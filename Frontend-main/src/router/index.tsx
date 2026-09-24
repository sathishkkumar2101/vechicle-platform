import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

// Lazy-load pages
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const CustomerLayout = React.lazy(() => import('../components/layout/CustomerLayout'));
const DealerLayout = React.lazy(() => import('../components/layout/DealerLayout'));
const AdminLayout = React.lazy(() => import('../components/layout/AdminLayout'));

// Customer
const CustomerDashboard = React.lazy(() => import('../pages/customer/Dashboard'));
const CustomerVehicles = React.lazy(() => import('../pages/customer/Vehicles'));
const VehicleDetail = React.lazy(() => import('../pages/customer/VehicleDetail'));
const CustomerDealers = React.lazy(() => import('../pages/customer/Dealers'));
const CustomerOrders = React.lazy(() => import('../pages/customer/Orders'));
const OrderDetail = React.lazy(() => import('../pages/customer/OrderDetail'));
const DealerDetail = React.lazy(() => import('../pages/customer/DealerDetail'));
const CustomerAppointments = React.lazy(() => import('../pages/customer/Appointments'));
const BookService = React.lazy(() => import('../pages/customer/BookService'));
const CustomerProfile = React.lazy(() => import('../pages/customer/Profile'));

// Dealer
const DealerDashboard = React.lazy(() => import('../pages/dealer/Dashboard'));
const DealerInventory = React.lazy(() => import('../pages/dealer/Inventory'));
const DealerOrders = React.lazy(() => import('../pages/dealer/Orders'));
const DealerCustomers = React.lazy(() => import('../pages/dealer/Customers'));
const DealerAppointments = React.lazy(() => import('../pages/dealer/Appointments'));
const DealerProfile = React.lazy(() => import('../pages/dealer/Profile'));

// Admin
const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = React.lazy(() => import('../pages/admin/Users'));
const AdminVehicles = React.lazy(() => import('../pages/admin/Vehicles'));
const AdminDealers = React.lazy(() => import('../pages/admin/Dealers'));
const AdminCustomers = React.lazy(() => import('../pages/admin/Customers'));
const AdminOrders = React.lazy(() => import('../pages/admin/Orders'));
const AdminAppointments = React.lazy(() => import('../pages/admin/Appointments'));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">Loading</p>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const redirect = user.role === 'ADMIN' ? '/admin' : user.role === 'DEALER' ? '/dealer' : '/customer';
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const redirect = user.role === 'ADMIN' ? '/admin' : user.role === 'DEALER' ? '/dealer' : '/customer';
  return <Navigate to={redirect} replace />;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<LoadingScreen />}>{children}</React.Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    path: '/login',
    element: <SuspenseWrapper><Login /></SuspenseWrapper>,
  },
  {
    path: '/register',
    element: <SuspenseWrapper><Register /></SuspenseWrapper>,
  },
  {
    path: '/customer',
    element: (
      <AuthGuard>
        <RoleGuard role="CUSTOMER">
          <SuspenseWrapper><CustomerLayout /></SuspenseWrapper>
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><CustomerDashboard /></SuspenseWrapper> },
      { path: 'vehicles', element: <SuspenseWrapper><CustomerVehicles /></SuspenseWrapper> },
      { path: 'vehicles/:id', element: <SuspenseWrapper><VehicleDetail /></SuspenseWrapper> },
      { path: 'dealers', element: <SuspenseWrapper><CustomerDealers /></SuspenseWrapper> },
      { path: 'orders', element: <SuspenseWrapper><CustomerOrders /></SuspenseWrapper> },
      { path: 'orders/:id', element: <SuspenseWrapper><OrderDetail /></SuspenseWrapper> },
      { path: 'dealers/:id', element: <SuspenseWrapper><DealerDetail /></SuspenseWrapper> },
      { path: 'appointments', element: <SuspenseWrapper><CustomerAppointments /></SuspenseWrapper> },
      { path: 'appointments/book', element: <SuspenseWrapper><BookService /></SuspenseWrapper> },
      { path: 'profile', element: <SuspenseWrapper><CustomerProfile /></SuspenseWrapper> },
    ],
  },
  {
    path: '/dealer',
    element: (
      <AuthGuard>
        <RoleGuard role="DEALER">
          <SuspenseWrapper><DealerLayout /></SuspenseWrapper>
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><DealerDashboard /></SuspenseWrapper> },
      { path: 'inventory', element: <SuspenseWrapper><DealerInventory /></SuspenseWrapper> },
      { path: 'orders', element: <SuspenseWrapper><DealerOrders /></SuspenseWrapper> },
      { path: 'customers', element: <SuspenseWrapper><DealerCustomers /></SuspenseWrapper> },
      { path: 'appointments', element: <SuspenseWrapper><DealerAppointments /></SuspenseWrapper> },
      { path: 'profile', element: <SuspenseWrapper><DealerProfile /></SuspenseWrapper> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <RoleGuard role="ADMIN">
          <SuspenseWrapper><AdminLayout /></SuspenseWrapper>
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
      { path: 'users', element: <SuspenseWrapper><AdminUsers /></SuspenseWrapper> },
      { path: 'vehicles', element: <SuspenseWrapper><AdminVehicles /></SuspenseWrapper> },
      { path: 'dealers', element: <SuspenseWrapper><AdminDealers /></SuspenseWrapper> },
      { path: 'customers', element: <SuspenseWrapper><AdminCustomers /></SuspenseWrapper> },
      { path: 'orders', element: <SuspenseWrapper><AdminOrders /></SuspenseWrapper> },
      { path: 'appointments', element: <SuspenseWrapper><AdminAppointments /></SuspenseWrapper> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
