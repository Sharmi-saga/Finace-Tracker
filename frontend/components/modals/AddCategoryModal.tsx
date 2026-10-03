'use client';

import React, { useState } from 'react';
import {
  X,
  Utensils,
  Car,
  Zap,
  Heart,
  Film,
  ShoppingBag,
  BookOpen,
  Briefcase,
  CreditCard,
  DollarSign,
  Tag,
  Home,
  Smartphone,
  Coffee,
  Plane,
  Gift,
  Award,
  Music,
  Camera,
  Wrench,
  Shield,
  TrendingUp,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import api from '../../lib/api';
import { Category } from '../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCategory?: Category) => void;
  defaultType?: 'Income' | 'Expense' | 'Both';
}

const AVAILABLE_ICONS = [
  { name: 'Utensils', icon: Utensils, label: 'Food & Dining' },
  { name: 'Car', icon: Car, label: 'Transport' },
  { name: 'Zap', icon: Zap, label: 'Bills & Utilities' },
  { name: 'Briefcase', icon: Briefcase, label: 'Business' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
  { name: 'Film', icon: Film, label: 'Entertainment' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'BookOpen', icon: BookOpen, label: 'Education' },
  { name: 'Coffee', icon: Coffee, label: 'Café' },
  { name: 'Home', icon: Home, label: 'Housing' },
  { name: 'Plane', icon: Plane, label: 'Travel' },
  { name: 'CreditCard', icon: CreditCard, label: 'Finance' },
  { name: 'DollarSign', icon: DollarSign, label: 'Income' },
  { name: 'Tag', icon: Tag, label: 'Tag' },
  { name: 'Smartphone', icon: Smartphone, label: 'Gadgets' },
  { name: 'Gift', icon: Gift, label: 'Gift' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Camera', icon: Camera, label: 'Photography' },
  { name: 'Wrench', icon: Wrench, label: 'Services' },
  { name: 'Shield', icon: Shield, label: 'Insurance' },
  { name: 'Layers', icon: Layers, label: 'Materials' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Investments' },
  { name: 'Sparkles', icon: Sparkles, label: 'Special' },
  { name: 'Award', icon: Award, label: 'Rewards' },
];

const PRESET_COLORS = [
  '#7C3AED', // Purple
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#059669', // Dark Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#64748B', // Slate
];

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'Expense',
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Income' | 'Expense' | 'Both'>(defaultType);
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#7C3AED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        icon,
        color,
      };

      const res = await api.post('/categories', payload);
      setName('');
      setIcon('Tag');
      setColor('#7C3AED');
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.name === icon)?.icon || HelpCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Category</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a custom category for income or expenses
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add category modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category Preview Badge */}
          <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200/80">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: color }}
              >
                <SelectedIconComp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-900 block">
                  {name.trim() || 'Category Name'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {type} Category
                </span>
              </div>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries, Gym, Software, Freelance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Category Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Expense', 'Income', 'Both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    type === t
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Color Accent
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-purple-600 ring-offset-2 scale-105' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <span className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Icon Symbol
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.label}
                    onClick={() => setIcon(item.name)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
