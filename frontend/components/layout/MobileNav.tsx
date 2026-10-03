'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Sliders,
  CalendarDays,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronRight,
  Building2,
  Briefcase,
  Store,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import api from '../../lib/api';
import { Account } from '../../types';

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    api
      .get('/accounts')
      .then((res) => setAccounts(res.data))
      .catch(console.error);
  }, [pathname]);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Budget', href: '/budget', icon: PiggyBank },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Accounts', href: '/account-settings', icon: Sliders },
  ];

  const bottomNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
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
  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'AS';

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0B132B] text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        {/* Brand Text - No Logo */}
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-white font-sans">
              FinScope
            </h1>
            <p className="text-[9px] font-semibold text-blue-400 tracking-tight leading-none mt-0.5">
              Asset Management
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          aria-label={`Profile${user?.name ? `: ${user.name}` : ''}`}
          className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/10 transition"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400 bg-blue-900 text-xs font-bold text-blue-100">
            {initials}
          </span>
          <span className="max-w-28 truncate text-xs font-semibold text-white">
            {user?.name || 'Profile'}
          </span>
        </Link>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-4/5 max-w-xs bg-[#0B132B] text-slate-200 h-full p-5 flex flex-col justify-between shadow-2xl z-10 border-r border-slate-800 animate-slide-in">
            <div className="overflow-y-auto pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wider uppercase">
                    FinScope
                  </h2>
                  <p className="text-[10px] font-semibold text-blue-400">
                    Menu & Navigation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items with Clear Highlighting */}
              <nav className="space-y-1.5 mb-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Accounts List in Mobile Drawer */}
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  ACCOUNTS
                </span>
                <div className="space-y-1">
                  {accounts.map((acc) => {
                    const isAccActive = pathname === `/accounts/${acc._id}`;
                    const AccIcon = getAccountIcon(acc.icon);
                    return (
                      <Link
                        key={acc._id}
                        href={`/accounts/${acc._id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          isAccActive
                            ? 'bg-blue-950 text-blue-300 font-semibold border border-blue-700/60'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <AccIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="truncate">{acc.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions in Drawer: Settings and Prominent Logout */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span>Settings</span>
              </Link>

              {/* Explicit Drawer Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout from FinScope</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu Toggle for More & Logout */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-all"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
            <Menu className="w-5 h-5" />
          </div>
          <span className="mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
}
