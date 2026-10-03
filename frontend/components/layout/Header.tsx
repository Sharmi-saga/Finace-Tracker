'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Heart, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import MonthYearPicker from '../ui/MonthYearPicker';

interface HeaderProps {
  title: string;
  subtitle: string;
  rightAction?: React.ReactNode;
  showDatePicker?: boolean;
}

export const MONTH_OPTIONS = [
  'January 2026',
  'February 2026',
  'March 2026',
  'April 2026',
  'May 2026',
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
];

export default function Header({ title, subtitle, rightAction, showDatePicker = true }: HeaderProps) {
  const router = useRouter();
  const { user, selectedMonth, dateFilter, setDateFilter, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AS';

  const handleMenuAction = (action: 'settings' | 'logout') => {
    setIsMenuOpen(false);

    if (action === 'settings') {
      router.push('/settings');
      return;
    }

    logout();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 font-medium">
          <Heart className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
          <span>&ldquo;Discipline today. A bigger tomorrow.&rdquo;</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showDatePicker && (
          <MonthYearPicker
            value={dateFilter?.label || selectedMonth}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            compact
          />
        )}

        {rightAction}

        <div ref={dropdownRef} className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 text-left rounded-xl hover:bg-slate-50 transition"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {user?.name || 'A. S. Sharmitha'}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {user?.role || 'Founder / CEO'}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isMenuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <button
                type="button"
                onClick={() => handleMenuAction('settings')}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuAction('logout')}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
