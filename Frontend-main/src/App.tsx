import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DealerProvider } from './contexts/DealerContext';
import { ToastProvider } from './components/ui/Toast';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <DealerProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </DealerProvider>
    </AuthProvider>
  );
}
