import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { Customer, Vehicle, Order, Appointment } from '../../types';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/layout/PageHeader';
import { KpiCard } from '../../components/ui/Card';
import { OrderStatusBadge, VehicleStatusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/format';
import { useAuth } from '../../contexts/AuthContext';

const MONTHLY_SALES = [
  { month: 'Jul', revenue: 420000, units: 3 },
  { month: 'Aug', revenue: 580000, units: 4 },
  { month: 'Sep', revenue: 340000, units: 2 },
  { month: 'Oct', revenue: 720000, units: 5 },
  { month: 'Nov', revenue: 890000, units: 6 },
  { month: 'Dec', revenue: 650000, units: 4 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-medium">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

export default function DealerDashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<Customer[]>('/api/v1/customers').then(res => setCustomers(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Vehicle[]>('/api/vehicles').then(res => setVehicles(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Order[]>(`/dealers/orders/${user.id}`).then(res => setOrders(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Appointment[]>('/api/appointments').then(res => setAppointments(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
  }, [user]);
  const available = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time overview of your dealership performance"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Inventory" value={vehicles.length} change={8} />
        <KpiCard label="Available" value={available} change={5} />
        <KpiCard label="Pending Orders" value={pending} />
        <KpiCard label="Revenue (MTD)" value={formatCurrency(orders.reduce((acc, o) => acc + o.totalAmount, 0), true)} change={12} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-display text-base font-semibold text-white">Monthly Revenue</p>
            <p className="text-xs text-zinc-600 font-mono">Last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_SALES} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="revenue" fill="#C4A84F" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
          <p className="font-display text-base font-semibold text-white mb-4">Inventory Status</p>
          <div className="space-y-3">
            {[
              { label: 'Available', count: available, color: 'bg-green-500' },
              { label: 'Reserved', count: vehicles.filter(v => v.status === 'RESERVED').length, color: 'bg-amber-500' },
              { label: 'Sold', count: vehicles.filter(v => v.status === 'SOLD').length, color: 'bg-zinc-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{item.label}</span>
                  <span className="text-sm font-mono text-white">{item.count}</span>
                </div>
                <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${(item.count / [].length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="font-display text-base font-semibold text-white">Recent Orders</p>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-white">{order.vehicle?.model}</p>
                  <p className="text-xs text-zinc-600 font-mono">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="font-display text-base font-semibold text-white">Upcoming Service</p>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {appointments.slice(0, 5).map(appt => (
              <div key={appt.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-white capitalize">{appt.serviceType.toLowerCase().replace(/_/g, ' ')}</p>
                  <p className="text-xs text-zinc-600 font-mono">{formatDate(appt.scheduledDate)} · {appt.scheduledTime}</p>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded uppercase ${
                  appt.status === 'SCHEDULED' ? 'bg-blue-950/60 text-blue-400' : 'bg-green-950/60 text-green-400'
                }`}>{appt.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
