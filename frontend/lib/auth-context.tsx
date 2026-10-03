'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from './api';
import { User } from '../types';

export type DateFilterMode = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface DateFilter {
  mode: DateFilterMode;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  month: string; // e.g. "September 2026"
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  selectedDate: string;
  selectedMonth: string;
  setSelectedDate: (date: string) => void;
  setSelectedMonth: (month: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const pad = (n: number) => String(n).padStart(2, '0');

const toDateInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
const toDateLabel = (date: Date) => `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;

function getMonthDates(monthStr: string) {
  const normalized = monthStr || toMonthLabel(new Date());
  const parts = normalized.split(' ');
  const mName = parts[0] || 'September';
  const yr = parseInt(parts[1] || String(new Date().getFullYear()), 10);
  const mIdx = Math.max(0, MONTH_NAMES.indexOf(mName));
  const start = new Date(yr, mIdx, 1);
  const end = new Date(yr, mIdx + 1, 0);

  const startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  return { startDate, endDate, month: `${MONTH_NAMES[mIdx]} ${yr}` };
}

function parseDateString(value?: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildDateFilterForDate(dateStr: string): DateFilter {
  const parsed = parseDateString(dateStr) || new Date();
  return {
    mode: 'day',
    label: toDateLabel(parsed),
    startDate: toDateInput(parsed),
    endDate: toDateInput(parsed),
    month: toMonthLabel(parsed),
  };
}

function buildDateFilterForYear(year: number): DateFilter {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return {
    mode: 'year',
    label: String(year),
    startDate: toDateInput(start),
    endDate: toDateInput(end),
    month: toMonthLabel(start),
  };
}

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_DATE_FILTER: DateFilter = buildDateFilterForYear(CURRENT_YEAR);
const DEFAULT_SELECTED_DATE = DEFAULT_DATE_FILTER.startDate;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, _setSelectedDate] = useState<string>(DEFAULT_SELECTED_DATE);
  const [selectedMonth, _setSelectedMonth] = useState<string>(DEFAULT_DATE_FILTER.month);
  const [dateFilter, _setDateFilter] = useState<DateFilter>(DEFAULT_DATE_FILTER);
  const router = useRouter();
  const pathname = usePathname();

  const setSelectedDate = (dateStr: string) => {
    const parsed = parseDateString(dateStr) || new Date();
    const normalized = toDateInput(parsed);
    const nextFilter = buildDateFilterForDate(normalized);
    _setSelectedDate(normalized);
    _setSelectedMonth(nextFilter.month);
    _setDateFilter(nextFilter);
  };

  const setSelectedMonth = (monthStr: string) => {
    const { startDate, endDate, month } = getMonthDates(monthStr);
    const nextFilter: DateFilter = {
      mode: 'month',
      label: month,
      startDate,
      endDate,
      month,
    };

    _setSelectedDate(startDate);
    _setSelectedMonth(month);
    _setDateFilter(nextFilter);
  };

  const setDateFilter = (filter: DateFilter) => {
    _setDateFilter(filter);

    const resolvedDate = parseDateString(filter.startDate) || parseDateString(filter.endDate) || parseDateString(filter.month);
    if (resolvedDate) {
      _setSelectedDate(toDateInput(resolvedDate));
    }

    if (filter.month) {
      _setSelectedMonth(filter.month);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /auth/me in background
        api
          .get('/auth/me')
          .then((res) => {
            const freshUser: User = {
              id: res.data._id || res.data.id,
              name: res.data.name,
              email: res.data.email,
              role: res.data.role,
              profileImage: res.data.profileImage,
              defaultCurrency: res.data.defaultCurrency || 'LKR',
              dateFormat: res.data.dateFormat || 'DD MMM YYYY',
              dashboardStartPage: res.data.dashboardStartPage || 'Dashboard',
              monthlyTarget: res.data.monthlyTarget || 0,
              yearlyTarget: res.data.yearlyTarget || 0,
            };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isPublic = publicPaths.some((p) => pathname.startsWith(p));

      if (!token && !isPublic) {
        router.push('/login');
      } else if (token && isPublic) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, token, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedUser };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        selectedDate,
        selectedMonth,
        setSelectedDate,
        setSelectedMonth,
        dateFilter,
        setDateFilter,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
