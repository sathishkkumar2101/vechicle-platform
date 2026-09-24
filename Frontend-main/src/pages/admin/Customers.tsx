import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { SearchInput } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { initials, formatDate } from '../../lib/format';
import api from '../../lib/api';
import type { Customer, PageResponse } from '../../types';

const MOCK: Customer[] = [
  { id: "uuid-c-1", name: 'Alexander Chen', email: 'alex.chen@email.com', phone: '+1 (415) 555-0194', createdAt: '2024-03-12T10:00:00Z' },
  { id: "uuid-c-2", name: 'Sophia Montgomery', email: 'sophia.m@email.com', phone: '+1 (212) 555-0177', createdAt: '2024-06-18T14:30:00Z' },
  { id: "uuid-c-3", name: 'James Hartwell', email: 'j.hartwell@email.com', phone: '+1 (310) 555-0162', createdAt: '2024-09-05T09:00:00Z' },
  { id: "uuid-c-4", name: 'Isabella Thornton', email: 'i.thornton@email.com', phone: '+1 (617) 555-0133', createdAt: '2024-07-22T16:00:00Z' },
];

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<Customer> | Customer[]>('/api/v1/customers')
      .then(res => setCustomers(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = customers.filter(c =>
    !search || `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle="Platform-wide customer registry" breadcrumbs={[{ label: 'Admin' }, { label: 'Customers' }]} />
      <div className="w-64 mb-4"><SearchInput placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={c => c.id}
          emptyMessage="No customers"
          columns={[
            { key: 'name', header: 'Customer', render: c => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-zinc-400">{initials(c.name,)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.email}</p>
                </div>
              </div>
            )},
            { key: 'phone', header: 'Phone', render: c => <span className="font-mono text-xs text-zinc-400">{c.phone ?? '—'}</span> },
            { key: 'joined', header: 'Joined', render: c => <span className="text-zinc-500 text-xs font-mono">{formatDate(c.createdAt)}</span> },
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}
