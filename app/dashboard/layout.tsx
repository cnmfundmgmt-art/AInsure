'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileCompletionWidget from '@/components/profile/ProfileCompletionWidget';
import {
  Users, BarChart3, Shield, Settings,
  LogOut, Bell, ChevronRight, Menu, X, User, PiggyBank
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/client/me')
      .then(r => r.json())
      .then(d => setRole(d.role || null))
      .catch(() => setRole(null));
  }, []);

  const isAdvisor = role === 'advisor' || role === 'admin';

  const NAV = [
    { href: '/client/profile', label: 'My Profile', icon: User },
    ...(isAdvisor ? [{ href: '/dashboard/client', label: 'My Client', icon: Users }] : []),
    { href: '/dashboard/financials', label: 'Financial Tracker', icon: PiggyBank },
    { href: '/insurance', label: 'AI Insurance', icon: Shield },
    { href: '/dashboard/products', label: 'Products', icon: Shield },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:z-auto lg:translate-x-0
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h1 className="text-lg font-bold text-indigo-700">CFP Malaysia</h1>
              <p className="text-xs text-gray-900 mt-0.5">Financial Planning</p>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden text-gray-900 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowSidebar(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-900 hover:bg-gray-50'
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
            <a href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 hover:text-gray-700 transition">
              <LogOut className="w-4 h-4" />
              Logout
            </a>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden text-gray-900 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-900 hidden sm:block">
              {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Bell className="w-4 h-4 text-gray-900 cursor-pointer hover:text-gray-600 transition" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}