import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';
import type { Dealer, Order } from '../../types';

const SERVICE_TYPES = [
  { value: 'MAINTENANCE', label: 'Scheduled Maintenance' },
  { value: 'REPAIR', label: 'Repair Service' },
  { value: 'INSPECTION', label: 'Vehicle Inspection' },
  { value: 'WARRANTY', label: 'Warranty Service' },
  { value: 'DETAILING', label: 'Premium Detailing' },
];

export default function BookService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    dealerId: '',
    vehicleId: '',
    serviceType: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  useEffect(() => {
    api.get<any>('/dealers').then(res => setDealers(Array.isArray(res) ? res : res.content ?? [])).catch(() => {});
    api.get<any>('/api/v1/orders').then(res => setMyOrders(Array.isArray(res) ? res : res.content ?? [])).catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceType || !form.dealerId) {
      error('Service type and dealer are required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/appointments', {
        customerId: user?.id,
        dealerId: form.dealerId,
        vehicleId: form.vehicleId || null, // Optional if no vehicle selected
        serviceType: form.serviceType,
        // The backend uses @CreationTimestamp for appointmentDate and doesn't store notes
      });
      success('Appointment booked successfully!');
      navigate('/customer/appointments');
    } catch (err: any) {
      error(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Book Service Appointment"
        subtitle="Schedule a service visit at an authorized dealer"
        breadcrumbs={[{ label: 'Service' }, { label: 'Book Appointment' }]}
        actions={<Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>}
      />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded p-6 space-y-5">
          <Select
            label="Service Type"
            options={SERVICE_TYPES}
            placeholder="Select service type"
            value={form.serviceType}
            onChange={e => set('serviceType', e.target.value)}
            required
          />
          <Select
            label="Select Dealer"
            options={dealers.map(d => ({ value: String(d.dealerId), label: `${d.name} - ${d.location}` }))}
            placeholder="Choose a preferred dealer"
            value={form.dealerId}
            onChange={e => set('dealerId', e.target.value)}
            required
          />
          {myOrders.length > 0 && (
            <Select
              label="Select Vehicle (Optional)"
              options={myOrders.filter(o => o.vehicle).map(o => ({ value: String(o.vehicleId), label: o.vehicle?.model || 'Unknown Vehicle' }))}
              placeholder="Choose a vehicle"
              value={form.vehicleId}
              onChange={e => set('vehicleId', e.target.value)}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preferred Date"
              type="date"
              value={form.scheduledDate}
              onChange={e => set('scheduledDate', e.target.value)}
              hint="Note: Dates are subject to dealer availability."
            />
            <Input
              label="Preferred Time"
              type="time"
              value={form.scheduledTime}
              onChange={e => set('scheduledTime', e.target.value)}
            />
          </div>
          <Textarea
            label="Notes"
            placeholder="Describe any symptoms or requests…"
            rows={4}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Book Appointment
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
