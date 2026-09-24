import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { VehicleStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/format';
import { VEHICLE_IMAGES } from '../../lib/mock';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';
import type { Vehicle, VehicleStatus, Dealer, PageResponse } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
];

export default function AdminVehicles() {
  const { success, error } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dealerFilter, setDealerFilter] = useState('');
  const [page, setPage] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    trim: '',
    color: '',
    vin: '',
    price: 0,
    status: 'AVAILABLE' as VehicleStatus,
    dealerId: '',
    image: '',
    bodyType: 'Sedan',
    description: '',
    engine: '',
    transmission: 'Automatic',
    fuelType: 'Petrol',
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  function fetchData() {
    setLoading(true);
    Promise.all([
      api.get<PageResponse<Vehicle> | Vehicle[]>('/api/vehicles').catch(() => []),
      api.get<Dealer[]>('/dealers').catch(() => []),
    ]).then(([v, d]) => {
      setVehicles(Array.isArray(v) ? v : (v as any).content ?? []);
      setDealers(Array.isArray(d) ? d : (d as any).content ?? []);
    }).finally(() => setLoading(false));
  }

  const dealerOptions = [
    { value: '', label: 'All Dealers' },
    ...dealers.map(d => ({ value: d.dealerId, label: `${d.name} (${d.city || ''})` }))
  ];

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    if (q && !`${v.model} ${v.vin ?? ''} ${v.trim ?? ''}`.toLowerCase().includes(q)) return false;
    if (status && v.status !== status) return false;
    if (dealerFilter && v.dealerId !== dealerFilter) return false;
    return true;
  });

  function openModal(vehicle?: Vehicle) {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        price: vehicle.price || 0,
        status: vehicle.status || 'AVAILABLE',
        dealerId: vehicle.dealerId || '',
        image: vehicle.image || vehicle.images?.[0] || '',
        bodyType: vehicle.bodyType || 'Sedan',
        description: vehicle.description || '',
        engine: vehicle.engine || '',
        transmission: vehicle.transmission || 'Automatic',
        fuelType: vehicle.fuelType || 'Petrol',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        model: '',
        trim: '',
        color: '',
        vin: '',
        price: 0,
        status: 'AVAILABLE',
        dealerId: dealers[0]?.dealerId || '',
        image: '',
        bodyType: 'Sedan',
        description: '',
        engine: '',
        transmission: 'Automatic',
        fuelType: 'Petrol',
      });
    }
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.model.trim() || formData.price <= 0) return;
    setSaving(true);
    try {
      if (editingVehicle) {
        await api.put(`/api/vehicles/${editingVehicle.vehicleId}`, formData);
        success('Vehicle updated successfully.');
      } else {
        await api.post('/api/vehicles', formData);
        success('Vehicle created successfully.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(vehicleId: string, newStatus: VehicleStatus) {
    try {
      await api.patch(`/api/vehicles/${vehicleId}/status`, { status: newStatus });
      setVehicles(prev => prev.map(v => v.vehicleId === vehicleId ? { ...v, status: newStatus } : v));
      success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      error(err.message || 'Failed to update status.');
    }
  }

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
      <PageHeader
        title="Vehicles"
        subtitle="Platform-wide vehicle inventory management"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Vehicles' }]}
        actions={<Button onClick={() => openModal()}>Add Vehicle</Button>}
      />
      
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64"><SearchInput placeholder="Search vehicles…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="w-36"><Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} /></div>
        <div className="w-48"><Select options={dealerOptions} value={dealerFilter} onChange={e => setDealerFilter(e.target.value)} /></div>
        <span className="text-xs text-zinc-600 self-center ml-auto font-mono">{filtered.length} vehicles</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={v => v.vehicleId}
          emptyMessage="No vehicles found"
          columns={[
            { key: 'vehicle', header: 'Vehicle', render: (v, i) => (
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  <img src={v.images?.[0] || v.image || VEHICLE_IMAGES[i % VEHICLE_IMAGES.length]} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{v.model}</p>
                  {v.trim && <p className="text-xs text-zinc-500">{v.trim}</p>}
                </div>
              </div>
            )},
            { key: 'vin', header: 'VIN', render: v => <span className="font-mono text-xs text-zinc-500">{v.vin ?? '—'}</span> },
            { key: 'price', header: 'Price', align: 'right', render: v => <span className="font-mono">{formatCurrency(v.price)}</span> },
            { key: 'status', header: 'Status', render: v => (
              <select
                value={v.status}
                onChange={e => handleStatusChange(v.vehicleId, e.target.value as VehicleStatus)}
                className="bg-zinc-950 border border-zinc-700 text-xs rounded px-2 py-1 text-zinc-300 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="SOLD">SOLD</option>
              </select>
            )},
            { key: 'actions', header: '', align: 'right', render: v => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={e => { e.stopPropagation(); openModal(v); }}
                  className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(v); }}
                  className="text-red-400 hover:text-red-300 text-xs font-mono px-2 py-1 rounded bg-red-950/30 hover:bg-red-900/40 transition-colors"
                  aria-label="Remove vehicle"
                >
                  Delete
                </button>
              </div>
            )},
          ]}
        />
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>

      {/* Vehicle Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Model" placeholder="e.g. BMW M4 Competition" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
            <Input label="Trim / Variant" placeholder="e.g. xDrive" value={formData.trim} onChange={e => setFormData({ ...formData, trim: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (INR)" type="number" placeholder="15000000" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
            <Input label="VIN" placeholder="17-character VIN" value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Dealer"
              options={dealers.map(d => ({ value: d.dealerId, label: d.name }))}
              value={formData.dealerId}
              onChange={e => setFormData({ ...formData, dealerId: e.target.value })}
            />
            <Select
              label="Status"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'RESERVED', label: 'Reserved' },
                { value: 'SOLD', label: 'Sold' },
              ]}
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
            />
          </div>
          <Input label="Image URL" placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingVehicle ? 'Save Changes' : 'Create Vehicle'}</Button>
          </div>
        </form>
      </Modal>

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
