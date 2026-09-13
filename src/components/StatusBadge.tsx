import React from 'react';
import { BusinessStatus } from '../types';

interface StatusBadgeProps {
  status: BusinessStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<BusinessStatus, { label: string; bg: string; text: string; border: string }> = {
  NEW: {
    label: 'Nuevo',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  CONTACTED: {
    label: 'Contactado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  INTERESTED: {
    label: 'Interesado',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  REJECTED: {
    label: 'Rechazado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  CLIENT: {
    label: 'Cliente',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  DISCARDED: {
    label: 'Descartado',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      {config.label}
    </span>
  );
};
