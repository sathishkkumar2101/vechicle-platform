import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { VehicleStatusBadge } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatCurrency, formatMileage } from '../../lib/format';
import { VEHICLE_IMAGES } from '../../lib/mock';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';
import type { Vehicle, PageResponse } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
];

export default function AdminVehicles() {
  const { success, error } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<Vehicle> | Vehicle[]>('/api/vehicles')
      .then(res => setVehicles(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    if (q && !`${v.model} ${v.vin ?? ''}`.toLowerCase().includes(q)) return false;
    if (status && v.status !== status) return false;
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/vehicles/${deleteTarget.vehicleId}`);
      setVehicles(prev => prev.filter(v => v.vehicleId !== deleteTarget.vehicleId));
      success('Vehicle removed from platform.');
    } catch (err: any) {
      error(err.message || 'Failed to remove vehicle.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="Platform-wide vehicle inventory management" breadcrumbs={[{ label: 'Admin' }, { label: 'Vehicles' }]} />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64"><SearchInput placeholder="Search vehicles…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="w-36"><Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} /></div>
        <span className="text-xs text-zinc-600 self-center ml-auto font-mono">{filtered.length} vehicles</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={v => v.vehicleId}
          emptyMessage="No vehicles"
          columns={[
            { key: 'vehicle', header: 'Vehicle', render: (v, i) => (
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  <img src={v.images?.[0] ?? VEHICLE_IMAGES[i % VEHICLE_IMAGES.length]} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{v.model}</p>
                  {v.trim && <p className="text-xs text-zinc-500">{v.trim}</p>}
                </div>
              </div>
            )},
            { key: 'vin', header: 'VIN', render: v => <span className="font-mono text-xs text-zinc-500">{v.vin ?? '—'}</span> },
            { key: 'price', header: 'Price', align: 'right', render: v => <span className="font-mono">{formatCurrency(v.price)}</span> },
            { key: 'status', header: 'Status', render: v => <VehicleStatusBadge status={v.status} /> },
            { key: 'actions', header: '', align: 'right', render: v => (
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget(v); }}
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
        title="Remove Vehicle"
        message={`Remove ${deleteTarget?.model} from the platform?`}
        confirmLabel="Remove Vehicle"
      />
    </div>
  );
}
