'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Sliders,
  Settings,
  LogOut,
  PlusCircle,
  Building2,
  User as UserIcon,
  Briefcase,
  Store,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import api from '../../lib/api';
import { Account } from '../../types';

interface SidebarProps {
  onAddAccount?: () => void;
}

export default function Sidebar({ onAddAccount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, [pathname]);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Error fetching sidebar accounts:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Budget', href: '/budget', icon: PiggyBank },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Account Settings', href: '/account-settings', icon: Sliders },
  ];

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
      case 'Building':
        return Building2;
      case 'Briefcase':
        return Briefcase;
      case 'Store':
        return Store;
      default:
        return UserIcon;
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0B132B] border-r border-[#1E293B] text-slate-200 min-h-screen p-4 select-none shrink-0 transition-colors">
      {/* Brand Header - Clean Text-Based Name, No Logo */}
      <div className="px-3 py-3 mb-6 border-b border-slate-800/80 pb-4">
        <h1 className="text-xl font-extrabold text-white tracking-wider uppercase font-sans">
         FinScope
        </h1>
        <p className="text-[11px] font-semibold text-blue-400 mt-0.5 tracking-wide">
          Wealth & Asset Management
        </p>
      </div>

      {/* Main Navigation with Clear Active Highlighting */}
      <nav className="space-y-1.5 mb-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/80 ring-1 ring-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-white stroke-[2.5]' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Accounts List */}
      <div className="mb-6 flex-1 overflow-y-auto max-h-[40vh] pr-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            ACCOUNTS
          </span>
        </div>
        <div className="space-y-1">
          {accounts.map((acc) => {
            const isAccActive = pathname === `/accounts/${acc._id}`;
            const AccIcon = getAccountIcon(acc.icon);
            return (
              <Link
                key={acc._id}
                href={`/accounts/${acc._id}`}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm transition-all ${
                  isAccActive
                    ? 'bg-blue-950/80 text-blue-300 font-semibold border border-blue-700/60'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      acc.type === 'Business'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800/80'
                        : 'bg-indigo-950 text-indigo-400 border border-indigo-800/80'
                    }`}
                  >
                    <AccIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{acc.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            );
          })}

          <button
            onClick={() =>
              onAddAccount ? onAddAccount() : router.push('/account-settings?action=new')
            }
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-800/60 rounded-xl transition mt-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* General Section */}
      {/* <div className="pt-4 border-t border-slate-800/80 space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            GENERAL
          </span>
        </div>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname === '/settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/80 ring-1 ring-blue-400/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
          }`}
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all text-left"
        >
          <LogOut className="w-5 h-5 text-rose-400" />
          <span>Logout</span>
        </button>
      </div> */}
    </aside>
  );
}
