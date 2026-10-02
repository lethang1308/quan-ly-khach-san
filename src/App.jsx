import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts';
import AppRoutes from '@/routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toast Provider */}
        <Toaster
          containerClassName="no-print"
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--shadow)',
              fontSize: '0.875rem',
            },
          }}
        />

        {/* Centralized Route Tree */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
