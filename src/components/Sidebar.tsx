import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Building2, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export const Sidebar: React.FC = () => {
  const isConnected = isSupabaseConfigured();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cities', label: 'Ciudades', icon: MapPin },
    { to: '/businesses', label: 'Negocios', icon: Building2 },
  ];

  return (
    <aside className="w-64 bg-slate-50/50 border-r border-slate-200 min-h-screen flex flex-col">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div>
          <div className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Krevia Leads
          </div>
          <p className="text-xs text-slate-500 font-medium">Panel de leads & scraping</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Database Connection Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Base de datos</span>
          </div>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isConnected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
            title={
              isConnected
                ? 'Conectado a Supabase PostgreSQL'
                : 'Operando con datos locales de demostración (configurá VITE_SUPABASE_URL para producción)'
            }
          >
            {isConnected ? 'Supabase' : 'Modo Demo'}
          </span>
        </div>
      </div>
    </aside>
  );
};
