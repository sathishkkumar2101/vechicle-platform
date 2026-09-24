import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { AppointmentStatusBadge } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate, formatCurrency } from '../../lib/format';
import api from '../../lib/api';
import type { Appointment, PageResponse } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function DealerAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<Appointment> | Appointment[]>('/api/appointments')
      .then(res => setAppointments(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = appointments.filter(a => !status || a.status === status);

  return (
    <div>
      <PageHeader title="Service Appointments" subtitle="Manage incoming service requests" breadcrumbs={[{ label: 'Dealer' }, { label: 'Appointments' }]} />
      <div className="w-40 mb-4">
        <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={a => a.id}
          emptyMessage="No appointments"
          columns={[
            { key: 'id', header: '#', width: '70px', render: a => <span className="font-mono text-zinc-500">#{a.id}</span> },
            { key: 'customer', header: 'Customer', render: a => (
              <span>{a.customer ? `${a.customer.name}` : `Customer #${a.customerId}`}</span>
            )},
            { key: 'service', header: 'Service', render: a => (
              <span className="capitalize">{a.serviceType.toLowerCase().replace(/_/g, ' ')}</span>
            )},
            { key: 'date', header: 'Scheduled', render: a => (
              <div>
                <p>{formatDate(a.scheduledDate)}</p>
                {a.scheduledTime && <p className="text-xs text-zinc-600 font-mono">{a.scheduledTime}</p>}
              </div>
            )},
            { key: 'status', header: 'Status', render: a => <AppointmentStatusBadge status={a.status} /> },
            { key: 'cost', header: 'Est. Cost', align: 'right', render: a => (
              <span className="font-mono text-xs">{a.estimatedCost ? formatCurrency(a.estimatedCost) : '—'}</span>
            )},
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>
    </div>
  );
}
