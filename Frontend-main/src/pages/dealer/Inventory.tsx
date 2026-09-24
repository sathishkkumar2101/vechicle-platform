import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { VehicleStatusBadge } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatMileage, formatDate } from '../../lib/format';
import { VEHICLE_IMAGES } from '../../lib/mock';
import api from '../../lib/api';
import type { Vehicle, PageResponse } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
];

export default function DealerInventory() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

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

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage your dealership's vehicle stock"
        breadcrumbs={[{ label: 'Dealer' }, { label: 'Inventory' }]}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-64">
          <SearchInput placeholder="Search by make, model, VIN…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-36">
          <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} />
        </div>
        <span className="text-xs text-zinc-600 ml-auto font-mono">{filtered.length} vehicles</span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
          keyExtractor={v => v.vehicleId}
          onRowClick={v => navigate(`/dealer/inventory/${v.vehicleId}`)}
          emptyMessage="No vehicles in inventory"
          columns={[
            { key: 'vehicle', header: 'Vehicle', render: (v, i) => (
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    src={v.images?.[0] ?? VEHICLE_IMAGES[i % VEHICLE_IMAGES.length]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{v.model}</p>
                  {v.trim && <p className="text-xs text-zinc-500">{v.trim}</p>}
                </div>
              </div>
            )},
            { key: 'vin', header: 'VIN', render: v => <span className="font-mono text-xs text-zinc-500">{v.vin ?? '—'}</span> },
            { key: 'color', header: 'Color', render: v => <span className="text-zinc-400 text-sm">{v.color ?? '—'}</span> },
            { key: 'mileage', header: 'Mileage', align: 'right', render: v => <span className="font-mono text-xs">{formatMileage(v.mileage)}</span> },
            { key: 'price', header: 'Price', align: 'right', render: v => <span className="font-mono font-medium text-white">{formatCurrency(v.price)}</span> },
            { key: 'status', header: 'Status', render: v => <VehicleStatusBadge status={v.status} /> },
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} totalElements={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
