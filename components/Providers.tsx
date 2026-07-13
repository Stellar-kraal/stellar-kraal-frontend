'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111a11',
            color: '#fff',
            border: '1px solid rgba(74,222,128,0.2)',
          },
          success: {
            iconTheme: { primary: '#4ade80', secondary: '#111a11' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#111a11' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
