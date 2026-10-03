import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let classes = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = status?.toLowerCase() || '';

  if (normalized.includes('track') || normalized === 'active') {
    classes = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (normalized.includes('high') || normalized.includes('warning')) {
    classes = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (normalized.includes('over') || normalized.includes('danger') || normalized === 'deficit') {
    classes = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (normalized.includes('not started') || normalized === 'inactive') {
    classes = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {status}
    </span>
  );
}
