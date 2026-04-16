'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, PiggyBank, Shield, Settings,
  FileText, ChevronLeft, LogOut, Scale, Bell,
} from 'lucide-react';

interface SidebarProps {
  role?: string;
  approvedByAdmin?: boolean;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5">
      <p className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function Sidebar({ role, approvedByAdmin, onLogout, userName, userEmail }: SidebarProps) {
  const isAdvisor = role === 'advisor' || role === 'admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">CFP Malaysia</h1>
            <p className="text-[10px] text-gray-400">Financial Planning</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-2">
        {/* Financial section — visible to all */}
        <SidebarSection label="Financial Planning">
          <SidebarLink href="/dashboard/overview" icon={<LayoutDashboard className="w-4 h-4" />}>
            Overview
          </SidebarLink>
          <SidebarLink href="/client/profile" icon={<User className="w-4 h-4" />}>
            My Profile
          </SidebarLink>
          <SidebarLink href="/dashboard/financial-tracker" icon={<PiggyBank className="w-4 h-4" />}>
            Financial Tracker
          </SidebarLink>
          <SidebarLink href="/dashboard/products" icon={<Shield className="w-4 h-4" />}>
            Products
          </SidebarLink>
          <SidebarLink href="/dashboard/settings" icon={<Settings className="w-4 h-4" />}>
            Settings
          </SidebarLink>
        </SidebarSection>

        {/* AI Insurance — visible to all logged-in users */}
        <SidebarSection label="Advisor Tools">
          <SidebarLink href="/insurance" icon={<Shield className="w-4 h-4" />}>
            AI Insurance
          </SidebarLink>
        </SidebarSection>

        {/* Admin — admin only */}
        {role === 'admin' && (
          <SidebarSection label="Admin">
            <SidebarLink href="/admin" icon={<Shield className="w-4 h-4" />}>
              Admin Panel
            </SidebarLink>
            <SidebarLink href="/admin/audit" icon={<FileText className="w-4 h-4" />}>
              Audit Log
            </SidebarLink>
          </SidebarSection>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail || ''}</p>
          </div>
        </div>
        <button
          onClick={() => { window.location.href = '/api/auth/logout'; }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
