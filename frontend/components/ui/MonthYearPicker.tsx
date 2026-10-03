'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  CalendarDays,
  Clock,
  Sparkles,
  SlidersHorizontal,
  CalendarRange,
} from 'lucide-react';
import { useAuth, DateFilter, DateFilterMode } from '../../lib/auth-context';

interface MonthYearPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  dateFilter?: DateFilter;
  onDateFilterChange?: (filter: DateFilter) => void;
  className?: string;
  compact?: boolean;
  popoverFixed?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

const getToday = () => new Date();

function parseDateString(value?: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const pad = (n: number) => String(n).padStart(2, '0');

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDisplayDate(d: Date): string {
  const day = d.getDate();
  const m = MONTHS[d.getMonth()].slice(0, 3);
  const yr = d.getFullYear();
  return `${day} ${m} ${yr}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export default function MonthYearPicker({
  value,
  onChange,
  dateFilter: propDateFilter,
  onDateFilterChange: propOnDateFilterChange,
  className = '',
  compact = false,
  popoverFixed = false,
}: MonthYearPickerProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active filter state from props or auth context
  const activeFilter: DateFilter = useMemo(() => {
    if (propDateFilter) return propDateFilter;
    if (auth?.dateFilter) return auth.dateFilter;
    const today = getToday();
    const currentMonthLabel = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
    return {
      mode: 'month',
      label: value || auth?.selectedMonth || currentMonthLabel,
      month: value || auth?.selectedMonth || currentMonthLabel,
      startDate: formatDateStr(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: formatDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
  }, [propDateFilter, auth?.dateFilter, value, auth?.selectedMonth]);

  const currentMonthLabel = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const updateFilter = (newFilter: DateFilter) => {
    if (propOnDateFilterChange) {
      propOnDateFilterChange(newFilter);
    } else if (!onChange && auth?.setDateFilter) {
      auth.setDateFilter(newFilter);
    }

    if (onChange) {
      onChange(newFilter.month || newFilter.label);
    }

    setIsOpen(false);
  };

  // Internal tab state: 'day' | 'week' | 'month' | 'custom'
  const [activeTab, setActiveTab] = useState<DateFilterMode>(activeFilter.mode || 'month');

  // Sync tab with external filter mode when reopened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(activeFilter.mode || 'month');
    }
  }, [isOpen, activeFilter.mode]);

  // Calendar View State for Day & Week picker
  const initialDate = parseDateString(activeFilter.startDate || activeFilter.endDate) || getToday();
  const [calMonth, setCalMonth] = useState<number>(initialDate.getMonth());
  const [calYear, setCalYear] = useState<number>(initialDate.getFullYear());

  // Custom Duration State
  const [customStart, setCustomStart] = useState<string>(activeFilter.startDate || formatDateStr(initialDate));
  const [customEnd, setCustomEnd] = useState<string>(activeFilter.endDate || formatDateStr(initialDate));

  // Month Picker Year State
  const [monthPickerYear, setMonthPickerYear] = useState<number>(initialDate.getFullYear());

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute days in current calMonth/calYear
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; dayNum: number }[] = [];

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(calYear, calMonth - 1, prevMonthDays - i),
        isCurrentMonth: false,
        dayNum: prevMonthDays - i,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(calYear, calMonth, i),
        isCurrentMonth: true,
        dayNum: i,
      });
    }

    // Next month filler to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(calYear, calMonth + 1, i),
        isCurrentMonth: false,
        dayNum: i,
      });
    }

    return days;
  }, [calYear, calMonth]);

  // Handle Day Selection
  const handleSelectDay = (d: Date) => {
    const dateStr = formatDateStr(d);
    const monthStr = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const displayLabel = formatDisplayDate(d);

    updateFilter({
      mode: 'day',
      label: `Day: ${displayLabel}`,
      startDate: dateStr,
      endDate: dateStr,
      month: monthStr,
    });
  };

  // Handle Week Selection
  const handleSelectWeek = (targetDate: Date) => {
    const mon = getMonday(targetDate);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const startStr = formatDateStr(mon);
    const endStr = formatDateStr(sun);
    const monthStr = `${MONTHS[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    const label = `Week: ${mon.getDate()} ${MONTHS[mon.getMonth()].slice(0, 3)} - ${sun.getDate()} ${MONTHS[sun.getMonth()].slice(0, 3)} ${sun.getFullYear()}`;

    updateFilter({
      mode: 'week',
      label,
      startDate: startStr,
      endDate: endStr,
      month: monthStr,
    });
  };

  // Handle Month Selection
  const handleSelectMonth = (monthName: string, year: number) => {
    const monthIndex = MONTHS.indexOf(monthName);
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);

    const startStr = formatDateStr(start);
    const endStr = formatDateStr(end);
    const label = `${monthName} ${year}`;

    updateFilter({
      mode: 'month',
      label,
      startDate: startStr,
      endDate: endStr,
      month: label,
    });
  };

  const handleSelectYear = (year: number) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    updateFilter({
      mode: 'year',
      label: String(year),
      startDate: formatDateStr(start),
      endDate: formatDateStr(end),
      month: `${MONTHS[0]} ${year}`,
    });
  };

  // Handle Custom Duration Apply
  const handleApplyCustomDuration = () => {
    if (!customStart || !customEnd) return;
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (s > e) return; // Prevent invalid range

    const monthStr = `${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    const label = `${formatDisplayDate(s)} - ${formatDisplayDate(e)}`;

    updateFilter({
      mode: 'custom',
      label,
      startDate: customStart,
      endDate: customEnd,
      month: monthStr,
    });
  };

  // Quick Preset Handlers
  const handleQuickPreset = (preset: string) => {
    const base = new Date();

    if (preset === 'today') {
      handleSelectDay(base);
    } else if (preset === 'yesterday') {
      const yest = new Date(base);
      yest.setDate(yest.getDate() - 1);
      handleSelectDay(yest);
    } else if (preset === 'this-week') {
      handleSelectWeek(base);
    } else if (preset === 'last-week') {
      const prevWeekDate = new Date(base);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      handleSelectWeek(prevWeekDate);
    } else if (preset === 'last-7') {
      const s = new Date(base);
      s.setDate(s.getDate() - 6);
      setCustomStart(formatDateStr(s));
      setCustomEnd(formatDateStr(base));
      updateFilter({
        mode: 'custom',
        label: `Last 7 Days (${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} - ${base.getDate()} ${MONTHS[base.getMonth()].slice(0, 3)} ${base.getFullYear()})`,
        startDate: formatDateStr(s),
        endDate: formatDateStr(base),
        month: `${MONTHS[base.getMonth()]} ${base.getFullYear()}`,
      });
    } else if (preset === 'last-30') {
      const s = new Date(base);
      s.setDate(s.getDate() - 29);
      setCustomStart(formatDateStr(s));
      setCustomEnd(formatDateStr(base));
      updateFilter({
        mode: 'custom',
        label: `Last 30 Days (${MONTHS[s.getMonth()].slice(0, 3)} - ${MONTHS[base.getMonth()].slice(0, 3)} ${base.getFullYear()})`,
        startDate: formatDateStr(s),
        endDate: formatDateStr(base),
        month: `${MONTHS[base.getMonth()]} ${base.getFullYear()}`,
      });
    } else if (preset === 'this-month') {
      handleSelectMonth(MONTHS[base.getMonth()], base.getFullYear());
    } else if (preset === 'this-quarter') {
      const quarterStartMonth = Math.floor(base.getMonth() / 3) * 3;
      const quarterStart = new Date(base.getFullYear(), quarterStartMonth, 1);
      const quarterEnd = new Date(base.getFullYear(), quarterStartMonth + 3, 0);
      setCustomStart(formatDateStr(quarterStart));
      setCustomEnd(formatDateStr(quarterEnd));
      updateFilter({
        mode: 'custom',
        label: `Q${Math.floor(base.getMonth() / 3) + 1} ${base.getFullYear()} (${MONTHS[quarterStartMonth].slice(0, 3)} - ${MONTHS[quarterEnd.getMonth()].slice(0, 3)} ${base.getFullYear()})`,
        startDate: formatDateStr(quarterStart),
        endDate: formatDateStr(quarterEnd),
        month: `${MONTHS[base.getMonth()]} ${base.getFullYear()}`,
      });
    }
  };

  // Badge label for trigger button
  const modeBadge = {
    day: { text: 'Day', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    week: { text: 'Week', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    month: { text: 'Month', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    year: { text: 'Year', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    custom: { text: 'Duration', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  }[activeFilter.mode || 'month'];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${
          compact ? 'p-2.5' : 'justify-between px-3.5 py-2'
        }`}
        aria-expanded={isOpen}
        aria-label={`Choose date range: ${activeFilter.label}`}
        title={compact ? activeFilter.label : undefined}
      >
        <div className={`flex items-center gap-2 truncate ${compact ? '' : ''}`}>
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          {!compact && (
            <>
              <span className="whitespace-nowrap font-medium text-slate-800">
                {activeFilter.label || currentMonthLabel}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${modeBadge.color}`}
              >
                {modeBadge.text}
              </span>
            </>
          )}
        </div>
        {!compact && (
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        )}
      </button>

      {/* Floating Calendar Popover */}
      {isOpen && (
        <div
          className={`${
            popoverFixed
              ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]'
              : 'absolute left-0 top-full mt-2 z-50'
          } w-80 max-w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 animate-fade-in`}
        >
          {/* Top Mode Segmented Switcher */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl mb-3.5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('day')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'day'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('week')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'week'
                  ? 'bg-white text-blue-700 font-bold shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'month'
                  ? 'bg-white text-blue-700 font-bold shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('year')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'year'
                  ? 'bg-white text-blue-700 font-bold shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Year
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'custom'
                  ? 'bg-white text-amber-700 font-bold shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              Duration
            </button>
          </div>

          {/* TAB 1: DAY SELECTOR */}
          {activeTab === 'day' && (
            <div>
              {/* Month/Year Nav */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(calYear - 1);
                    } else {
                      setCalMonth(calMonth - 1);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-800">
                  {MONTHS[calMonth]} {calYear}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(calYear + 1);
                    } else {
                      setCalMonth(calMonth + 1);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  const dateStr = formatDateStr(item.date);
                  const isSelected =
                    activeFilter.mode === 'day' && activeFilter.startDate === dateStr;
                  const isDemoToday = dateStr === formatDateStr(new Date());

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(item.date)}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200'
                          : isDemoToday
                          ? 'bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-300'
                          : item.isCurrentMonth
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Quick Day Presets */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('today')}
                  className="px-2.5 py-1 rounded-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  Today (22 Sep)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('yesterday')}
                  className="px-2.5 py-1 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Yesterday (21 Sep)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WEEK SELECTOR */}
          {activeTab === 'week' && (
            <div>
              {/* Month/Year Nav */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(calYear - 1);
                    } else {
                      setCalMonth(calMonth - 1);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-800">
                  {MONTHS[calMonth]} {calYear}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(calYear + 1);
                    } else {
                      setCalMonth(calMonth + 1);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid - Clicking a date selects the whole week */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  const dateStr = formatDateStr(item.date);
                  const mon = getMonday(item.date);
                  const sun = new Date(mon);
                  sun.setDate(mon.getDate() + 6);
                  const isInSelectedWeek =
                    activeFilter.mode === 'week' &&
                    dateStr >= (activeFilter.startDate || '') &&
                    dateStr <= (activeFilter.endDate || '');

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectWeek(item.date)}
                      title={`Select week containing ${formatDisplayDate(item.date)}`}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        isInSelectedWeek
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : item.isCurrentMonth
                          ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                          : 'text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Quick Week Presets */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('this-week')}
                  className="px-2.5 py-1 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                >
                  This Week (Sep 21 - 27)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('last-week')}
                  className="px-2.5 py-1 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Last Week (Sep 14 - 20)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MONTH SELECTOR */}
          {activeTab === 'month' && (
            <div>
              {/* Year Navigation */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setMonthPickerYear((y) => Math.max(2020, y - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                  title="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <select
                    value={monthPickerYear}
                    onChange={(e) => setMonthPickerYear(parseInt(e.target.value, 10))}
                    className="font-bold text-slate-800 text-sm bg-transparent border-none outline-none cursor-pointer hover:text-blue-600"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setMonthPickerYear((y) => Math.min(2035, y + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                  title="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12-Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m) => {
                  const isSelected =
                    activeFilter.mode === 'month' &&
                    activeFilter.month === `${m} ${monthPickerYear}`;
                  const shortName = m.slice(0, 3);

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(m, monthPickerYear)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <span>{shortName}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick Month Presets */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 1);
                    handleSelectMonth(MONTHS[d.getMonth()], d.getFullYear());
                  }}
                  className="font-semibold text-slate-500 hover:text-blue-600 transition"
                >
                  {MONTHS[(new Date().getMonth() + 11) % 12].slice(0, 3)} {new Date().getFullYear() - (new Date().getMonth() === 0 ? 1 : 0)}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMonth(MONTHS[new Date().getMonth()], new Date().getFullYear())}
                  className="font-bold text-blue-600 hover:text-blue-700 transition bg-blue-50 px-2 py-0.5 rounded-md"
                >
                  {MONTHS[new Date().getMonth()].slice(0, 3)} {new Date().getFullYear()} (Active)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    handleSelectMonth(MONTHS[d.getMonth()], d.getFullYear());
                  }}
                  className="font-semibold text-slate-500 hover:text-blue-600 transition"
                >
                  {MONTHS[(new Date().getMonth() + 1) % 12].slice(0, 3)} {(new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear())}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'year' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500" htmlFor="year-filter">
                Select year
              </label>
              <select
                id="year-filter"
                value={monthPickerYear}
                onChange={(event) => setMonthPickerYear(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleSelectYear(monthPickerYear)}
                className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Show {monthPickerYear}
              </button>
            </div>
          )}

          {/* TAB 4: CUSTOM DURATION SELECTOR */}
          {activeTab === 'custom' && (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Select custom start and end dates or choose a preset duration:
              </p>

              {/* Start & End Inputs */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-2 gap-1.5 mb-3.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('last-7')}
                  className="py-1 px-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium text-left transition"
                >
                  ⏱ Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('last-30')}
                  className="py-1 px-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium text-left transition"
                >
                  🗓 Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('this-month')}
                  className="py-1 px-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium text-left transition"
                >
                  📅 Full Month
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('this-quarter')}
                  className="py-1 px-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium text-left transition"
                >
                  📊 Q3 (Jul - Sep)
                </button>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyCustomDuration}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Apply Custom Duration</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
