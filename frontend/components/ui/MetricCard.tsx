'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  amount: number | string;
  currency?: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'income' | 'expense' | 'balance' | 'transfer' | 'pending' | 'neutral';
  trend?: string;
}

export default function MetricCard({
  title,
  amount,
  currency = 'LKR',
  subtitle,
  icon: Icon,
  variant = 'neutral',
  trend,
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return {
          container:
            'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 border-emerald-200/90 border-l-4 border-l-emerald-500',
          iconBg: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
          title: 'text-emerald-950 font-bold',
          amount: 'text-emerald-700',
          subtitle: 'text-emerald-700/80',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'expense':
        return {
          container:
            'bg-gradient-to-br from-rose-50/70 via-white to-rose-50/20 border-rose-200/90 border-l-4 border-l-rose-500',
          iconBg: 'bg-rose-600 text-white shadow-sm shadow-rose-200',
          title: 'text-rose-950 font-bold',
          amount: 'text-rose-700',
          subtitle: 'text-rose-700/80',
          badge: 'bg-rose-100 text-rose-800',
        };
      case 'balance':
        return {
          container:
            'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 border-blue-200/90 border-l-4 border-l-blue-600',
          iconBg: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
          title: 'text-blue-950 font-bold',
          amount: 'text-blue-900',
          subtitle: 'text-blue-700/80',
          badge: 'bg-blue-100 text-blue-800',
        };
      case 'transfer':
        return {
          container:
            'bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 border-sky-200/90 border-l-4 border-l-sky-500',
          iconBg: 'bg-sky-600 text-white shadow-sm shadow-sky-200',
          title: 'text-sky-950 font-bold',
          amount: 'text-sky-800',
          subtitle: 'text-sky-700/80',
          badge: 'bg-sky-100 text-sky-800',
        };
      case 'pending':
        return {
          container:
            'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/20 border-amber-200/90 border-l-4 border-l-amber-500',
          iconBg: 'bg-amber-600 text-white shadow-sm shadow-amber-200',
          title: 'text-amber-950 font-bold',
          amount: 'text-amber-800',
          subtitle: 'text-amber-700/80',
          badge: 'bg-amber-100 text-amber-800',
        };
      default:
        return {
          container:
            'bg-gradient-to-br from-slate-50/80 via-white to-slate-100/50 border-slate-200 border-l-4 border-l-slate-600',
          iconBg: 'bg-slate-700 text-white shadow-sm shadow-slate-200',
          title: 'text-slate-800 font-bold',
          amount: 'text-slate-900',
          subtitle: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const styles = getVariantStyles();
  const formattedAmount =
    typeof amount === 'number'
      ? `${currency} ${amount.toLocaleString()}`
      : `${currency} ${amount}`;

  return (
    <div
      className={`rounded-2xl p-5 border shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between ${styles.container}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={`text-xs uppercase tracking-wider ${styles.title}`}>
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        )}
      </div>

      <div>
        <div className={`text-xl lg:text-2xl font-black tracking-tight ${styles.amount}`}>
          {formattedAmount}
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          {subtitle && (
            <span className={`font-medium ${styles.subtitle}`}>
              {subtitle}
            </span>
          )}
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
