'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '@/lib/auth-context';
import Spinner from '@/components/ui/Spinner';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
};

function titleFor(pathname) {
  if (pathname.startsWith('/doctors/')) return 'Doctor Details';
  return TITLES[pathname] || 'Doctor Tracker';
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={titleFor(pathname)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
