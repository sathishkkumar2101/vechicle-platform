import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../lib/format';
import api from '../../lib/api';
import type { Order, PageResponse } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<Order> | Order[]>('/api/v1/orders')
      .then(res => setOrders(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = orders.filter(o => {
    if (search && !String(o.id).includes(search)) return false;
    if (status && o.status !== status) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Orders" subtitle="All platform vehicle purchase orders" breadcrumbs={[{ label: 'Admin' }, { label: 'Orders' }]} />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-52"><SearchInput placeholder="Search by order ID…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="w-40"><Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} /></div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={o => o.id}
          emptyMessage="No orders"
          columns={[
            { key: 'id', header: 'Order #', width: '90px', render: o => <span className="font-mono text-zinc-400">#{o.id}</span> },
            { key: 'vehicle', header: 'Vehicle', render: o => (
              <div>
                <p className="text-white font-medium">{o.vehicle?.model}</p>
              </div>
            )},
            { key: 'customer', header: 'Customer', render: o => (
              <span className="text-zinc-300">{o.customer ? `${o.customer.name}` : `#${o.customerId}`}</span>
            )},
            { key: 'amount', header: 'Amount', align: 'right', render: o => <span className="font-mono">{formatCurrency(o.totalAmount)}</span> },
            { key: 'status', header: 'Status', render: o => <OrderStatusBadge status={o.status} /> },
            { key: 'date', header: 'Date', render: o => <span className="text-zinc-500 text-xs font-mono">{formatDate(o.createdAt)}</span> },
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}
