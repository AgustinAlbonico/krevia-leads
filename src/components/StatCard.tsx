import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  highlight = false,
}) => {
  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-shadow ${
        highlight ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 shadow-sm'
      }`}
    >
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
      </div>
      {sublabel && (
        <div className="text-xs text-slate-500 mt-1">{sublabel}</div>
      )}
    </div>
  );
};
