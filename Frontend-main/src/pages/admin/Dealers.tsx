import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput, Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';
import type { Dealer, PageResponse } from '../../types';

export default function AdminDealers() {
  const { success, error } = useToast();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  
  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Dealer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, [page]);

  function fetchDealers() {
    setLoading(true);
    api.get<PageResponse<Dealer> | Dealer[]>('/dealers')
      .then(res => setDealers(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setDealers([]))
      .finally(() => setLoading(false));
  }

  const filtered = dealers.filter(d => !search || `${d.name} ${d.city} ${d.email}`.toLowerCase().includes(search.toLowerCase()));

  function openModal(dealer?: Dealer) {
    if (dealer) {
      setEditingDealer(dealer);
      setFormData({
        name: dealer.name || '',
        city: dealer.city || '',
        state: dealer.state || '',
        email: dealer.email || '',
        phone: dealer.phone || '',
        address: dealer.address || '',
        zipCode: dealer.zipCode || '',
      });
    } else {
      setEditingDealer(null);
      setFormData({
        name: '',
        city: '',
        state: '',
        email: '',
        phone: '',
        address: '',
        zipCode: '',
      });
    }
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    setSaving(true);
    try {
      if (editingDealer) {
        await api.put(`/dealers/${editingDealer.dealerId}`, formData);
        success('Dealer details updated successfully.');
      } else {
        await api.post('/dealers', formData);
        success('Dealer registered successfully.');
      }
      setModalOpen(false);
      fetchDealers();
    } catch (err: any) {
      error(err.message || 'Failed to save dealer.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/dealers/${deleteTarget.dealerId}`);
      setDealers(prev => prev.filter(d => d.dealerId !== deleteTarget.dealerId));
      success('Dealer removed successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to remove dealer.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Dealers"
        subtitle="Manage authorized dealership partners across regions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dealers' }]}
        actions={<Button onClick={() => openModal()}>Add Dealer</Button>}
      />
      <div className="w-64 mb-4">
        <SearchInput placeholder="Search dealers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={d => d.dealerId}
          emptyMessage="No dealers found"
          columns={[
            {
              key: 'name',
              header: 'Dealer',
              render: d => (
                <div>
                  <p className="text-white font-medium">{d.name}</p>
                  <p className="text-xs text-zinc-500">{d.city}{d.state ? `, ${d.state}` : ''}</p>
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contact',
              render: d => (
                <div>
                  <p className="text-sm text-zinc-300">{d.email}</p>
                  <p className="text-xs text-zinc-500 font-mono">{d.phone || '—'}</p>
                </div>
              ),
            },
            {
              key: 'inventory',
              header: 'Inventory',
              align: 'right',
              render: d => <span className="font-mono text-zinc-300">{d.totalVehicles ?? '—'}</span>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: d => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); openModal(d); }}
                    className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(d); }}
                    className="text-red-400 hover:text-red-300 text-xs font-mono px-2 py-1 rounded bg-red-950/30 hover:bg-red-900/40 transition-colors"
                    aria-label="Remove Dealer"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDealer ? 'Edit Dealer' : 'Add New Dealer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Dealership Name" placeholder="e.g. BMW Chennai" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" placeholder="Chennai" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            <Input label="State" placeholder="Tamil Nadu" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Address" type="email" placeholder="dealer@bmwtechworks.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Phone Number" placeholder="+91 9876543210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <Input label="Street Address" placeholder="123 Regional Highway" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingDealer ? 'Save Changes' : 'Register Dealer'}</Button>
          </div>
        </form>
      </Modal>

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
