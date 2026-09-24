import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import type { User, Customer, Dealer, Vehicle, Order, Appointment } from '../../types';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '../../components/layout/PageHeader';
import { KpiCard } from '../../components/ui/Card';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/format';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 1200000 }, { month: 'Feb', revenue: 980000 },
  { month: 'Mar', revenue: 1450000 }, { month: 'Apr', revenue: 1100000 },
  { month: 'May', revenue: 1680000 }, { month: 'Jun', revenue: 1420000 },
  { month: 'Jul', revenue: 1890000 }, { month: 'Aug', revenue: 2100000 },
  { month: 'Sep', revenue: 1750000 }, { month: 'Oct', revenue: 2300000 },
  { month: 'Nov', revenue: 1950000 }, { month: 'Dec', revenue: 2450000 },
];

const PIE_DATA = [
  { name: 'Available', value: 4, color: '#22C55E' },
  { name: 'Reserved', value: 1, color: '#F59E0B' },
  { name: 'Sold', value: 1, color: '#71717A' },
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

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<User[]>('/api/users').then(res => setUsers(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Customer[]>('/api/v1/customers').then(res => setCustomers(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Dealer[]>('/dealers').then(res => setDealers(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Vehicle[]>('/api/vehicles').then(res => setVehicles(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Order[]>('/api/v1/orders').then(res => setOrders(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
    api.get<Appointment[]>('/api/appointments').then(res => setAppointments(Array.isArray(res) ? res : (res as any).content ?? [])).catch(()=>{});
  }, []);
  return (
    <div>
      <PageHeader title="Platform Control Center" subtitle="Enterprise-wide performance and management overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Users" value={users.length} change={14} />
        <KpiCard label="Active Vehicles" value={vehicles.length} change={8} />
        <KpiCard label="Total Orders" value={orders.length} change={22} />
        <KpiCard label="Annual Revenue" value={formatCurrency(orders.reduce((acc, o) => acc + o.totalAmount, 0), true)} change={18} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-display text-base font-semibold text-white">Annual Revenue</p>
            <p className="text-xs text-zinc-600 font-mono">2024</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#C4A84F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle status donut */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5">
          <p className="font-display text-base font-semibold text-white mb-4">Vehicle Status</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {PIE_DATA.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-zinc-400">{item.name}</span>
                </div>
                <span className="font-mono text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Dealers" value={dealers.length} change={2} />
        <KpiCard label="Customers" value={customers.length} change={31} />
        <KpiCard label="Pending Orders" value="124" />
        <KpiCard label="Service Appts" value={appointments.length} change={7} />
      </div>

      {/* Recent orders table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <p className="font-display text-base font-semibold text-white">Recent Orders</p>
          <span className="text-xs text-zinc-600 font-mono">Last 24h</span>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="grid grid-cols-4 items-center px-5 py-3.5 text-sm">
              <div>
                <p className="text-white font-medium">{order.vehicle?.model}</p>
                <p className="text-xs text-zinc-600 font-mono">#{order.id}</p>
              </div>
              <div className="text-zinc-400">Customer #{order.customerId}</div>
              <div><OrderStatusBadge status={order.status} /></div>
              <div className="text-right font-mono text-zinc-300">{formatCurrency(order.totalAmount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
