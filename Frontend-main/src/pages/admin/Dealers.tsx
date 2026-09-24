import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { SearchInput } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/format';
import api from '../../lib/api';
import type { Dealer, PageResponse } from '../../types';

export default function AdminDealers() {
  const { success, error } = useToast();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Dealer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<Dealer> | Dealer[]>('/dealers')
      .then(res => setDealers(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setDealers([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = dealers.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/dealers/${deleteTarget.dealerId}`);
      setDealers(prev => prev.filter(d => d.dealerId !== deleteTarget.dealerId));
      success('Dealer removed.');
    } catch (err: any) {
      error(err.message || 'Failed to remove dealer.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader title="Dealers" subtitle="Manage authorized dealership partners" breadcrumbs={[{ label: 'Admin' }, { label: 'Dealers' }]} />
      <div className="w-64 mb-4"><SearchInput placeholder="Search dealers…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={d => d.dealerId}
          emptyMessage="No dealers"
          columns={[
            { key: 'name', header: 'Dealer', render: d => (
              <div>
                <p className="text-white font-medium">{d.name}</p>
                <p className="text-xs text-zinc-500">{d.city}, {d.state}</p>
              </div>
            )},
            { key: 'contact', header: 'Contact', render: d => (
              <div>
                <p className="text-sm text-zinc-300">{d.email}</p>
                <p className="text-xs text-zinc-500 font-mono">{d.phone}</p>
              </div>
            )},
            { key: 'inventory', header: 'Inventory', align: 'right', render: d => (
              <span className="font-mono text-zinc-300">{d.totalVehicles ?? '—'}</span>
            )},
            { key: 'rating', header: 'Rating', render: d => (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <span className="text-sm font-mono text-zinc-300">{d.rating ?? '—'}</span>
              </div>
            )},
            { key: 'actions', header: '', align: 'right', render: d => (
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget(d); }}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )},
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Dealer"
        message={`Remove ${deleteTarget?.name} from the platform? All associated data will be affected.`}
        confirmLabel="Remove Dealer"
      />
    </div>
  );
}
