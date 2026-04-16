'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileCompletionWidget from '@/components/profile/ProfileCompletionWidget';
import {
  LayoutDashboard, Users, BarChart3, Shield, Settings,
  LogOut, Bell, ChevronRight
} from 'lucide-react';

const NAV = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'My Profile', icon: Users },
  { href: '/dashboard/financials', label: 'Financial Tracker', icon: BarChart3 },
  { href: '/dashboard/products', label: 'Products', icon: Shield },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/insurance', label: 'AI Insurance', icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-5 py-5 border-b border-gray-100">
            <h1 className="text-lg font-bold text-indigo-700">CFP Malaysia</h1>
            <p className="text-xs text-gray-400 mt-0.5">Financial Planning</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Profile completion widget */}
          <div className="px-3 pb-3">
            <ProfileCompletionWidget />
          </div>

          {/* Bottom */}
          <div className="px-3 py-3 border-t border-gray-100">
            <a href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
              <LogOut className="w-4 h-4" />
              Logout
            </a>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="flex items-center gap-4">
              <Bell className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition" />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
