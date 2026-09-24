import type { Vehicle, Order, Dealer, Customer, Appointment } from '../types';

export const VEHICLE_IMAGES = [
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=800&h=500&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&h=500&fit=crop&auto=format',
];

export const MOCK_VEHICLES: Vehicle[] = [
  { vehicleId: 'uuid-v-1', model: 'M5 Competition', trim: 'xDrive', color: 'Brooklyn Grey', price: 122000, status: 'AVAILABLE', dealerId: 'uuid-d-1' },
  { vehicleId: 'uuid-v-2', model: 'S-Class', trim: 'S 580', color: 'Obsidian Black', price: 118500, status: 'AVAILABLE', dealerId: 'uuid-d-2' },
  { vehicleId: 'uuid-v-3', model: 'Cayenne', trim: 'Turbo GT', color: 'Chalk', price: 185000, status: 'RESERVED', dealerId: 'uuid-d-1' },
  { vehicleId: 'uuid-v-4', model: 'RS7', trim: 'Performance', color: 'Nardo Grey', price: 134000, status: 'AVAILABLE', dealerId: 'uuid-d-1' },
  { vehicleId: 'uuid-v-5', model: 'Urus', trim: 'Performante', color: 'Giallo Orion', price: 265000, status: 'SOLD', dealerId: 'uuid-d-2' },
  { vehicleId: 'uuid-v-6', model: 'Roma', trim: 'Spider', color: 'Rosso Corsa', price: 298000, status: 'AVAILABLE', dealerId: 'uuid-d-3' },
];

export const MOCK_DEALERS: Dealer[] = [
  { dealerId: 'uuid-d-1', name: 'Prestige Motors Group', location: 'Beverly Hills, CA' },
  { dealerId: 'uuid-d-2', name: 'Elite Auto Gallery', location: 'New York, NY' },
  { dealerId: 'uuid-d-3', name: 'Apex Performance', location: 'Chicago, IL' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'uuid-o-1', customerId: 'uuid-c-1', vehicleId: 'uuid-v-2', dealerId: 'uuid-d-1', status: 'DELIVERED', totalAmount: 118500, createdAt: '2024-11-15T10:00:00Z' },
  { id: 'uuid-o-2', customerId: 'uuid-c-1', vehicleId: 'uuid-v-1', dealerId: 'uuid-d-2', status: 'IN_PRODUCTION', totalAmount: 122000, createdAt: '2024-12-01T14:30:00Z' },
  { id: 'uuid-o-3', customerId: 'uuid-c-2', vehicleId: 'uuid-v-4', dealerId: 'uuid-d-1', status: 'CONFIRMED', totalAmount: 134000, createdAt: '2024-12-10T09:15:00Z' },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'uuid-a-1', customerId: 'uuid-c-1', vehicleId: 'uuid-v-2', dealerId: 'uuid-d-1', serviceType: 'MAINTENANCE', status: 'CONFIRMED', appointmentDate: '2025-01-15T09:00:00Z' },
  { id: 'uuid-a-2', customerId: 'uuid-c-1', vehicleId: 'uuid-v-2', dealerId: 'uuid-d-1', serviceType: 'INSPECTION', status: 'COMPLETED', appointmentDate: '2024-10-20T11:00:00Z' },
];
