import React, { useState } from 'react';
import { BusinessStatus } from '../types';

interface StatusSelectProps {
  status: BusinessStatus;
  onChange: (newStatus: BusinessStatus) => Promise<unknown> | void;
  disabled?: boolean;
}

const STATUS_STYLE_MAP: Record<BusinessStatus, { bg: string; text: string; border: string }> = {
  NEW: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  CONTACTED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  INTERESTED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
  },
  REJECTED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
  },
  CLIENT: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
  },
  DISCARDED: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  },
};

export const StatusSelect: React.FC<StatusSelectProps> = ({
  status,
  onChange,
  disabled = false,
}) => {
  const [updating, setUpdating] = useState(false);
  const currentStyle = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP.NEW;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BusinessStatus;
    if (newStatus === status) return;

    setUpdating(true);
    try {
      await onChange(newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <select
        value={status}
        disabled={disabled || updating}
        onChange={handleChange}
        className={`text-xs font-semibold py-1 pl-2.5 pr-6 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors appearance-none ${
          currentStyle.bg
        } ${currentStyle.text} ${currentStyle.border} ${
          updating ? 'opacity-60 cursor-wait' : 'hover:brightness-95'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.35rem center',
          backgroundSize: '0.8rem 0.8rem',
        }}
      >
        <option value="NEW" className="bg-white text-slate-800 font-normal">
          Nuevo
        </option>
        <option value="CONTACTED" className="bg-white text-slate-800 font-normal">
          Contactado
        </option>
        <option value="INTERESTED" className="bg-white text-slate-800 font-normal">
          Interesado
        </option>
        <option value="REJECTED" className="bg-white text-slate-800 font-normal">
          Rechazado
        </option>
        <option value="CLIENT" className="bg-white text-slate-800 font-normal">
          Cliente
        </option>
        <option value="DISCARDED" className="bg-white text-slate-800 font-normal">
          Descartado
        </option>
      </select>
    </div>
  );
};
