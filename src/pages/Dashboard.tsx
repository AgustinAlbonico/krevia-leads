import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowRight, Building2, MapPin } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getDashboardStats().then((data) => {
      if (isMounted) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-lg"></div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen general</p>
      </div>

      {/* 4 Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Ciudades" 
          value={stats.totalCities} 
          sublabel="Localidades registradas" 
        />
        <StatCard 
          label="Ciudades con negocios" 
          value={stats.citiesWithBusinesses} 
          sublabel="Con datos scrapeados"
          highlight={stats.citiesWithBusinesses > 0}
        />
        <StatCard 
          label="Negocios" 
          value={stats.totalBusinesses} 
          sublabel="Total de leads cargados"
        />
        <StatCard 
          label="Pendientes" 
          value={stats.pendingBusinesses} 
          sublabel="Estado: Nuevo"
          highlight={stats.pendingBusinesses > 0}
        />
      </div>

      {/* Tablas de resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Ciudades con más negocios */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Ciudades con más negocios</h2>
            </div>
            <Link
              to="/cities"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                  <th className="py-2.5 px-4">Ciudad</th>
                  <th className="py-2.5 px-4 text-right">Cantidad</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topCities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-sm">
                      Aún no hay negocios cargados en ninguna ciudad.
                    </td>
                  </tr>
                ) : (
                  stats.topCities.map((city) => (
                    <tr key={city.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {city.name}
                        {city.province_name && (
                          <span className="text-xs text-slate-400 font-normal ml-1.5">
                            ({city.province_name})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {city.business_count || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/cities/${city.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos negocios */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Últimos negocios</h2>
            </div>
            <Link
              to="/businesses"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                  <th className="py-2.5 px-4">Negocio</th>
                  <th className="py-2.5 px-4">Ciudad</th>
                  <th className="py-2.5 px-4">Rubro</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.latestBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-sm">
                      No hay negocios registrados.
                    </td>
                  </tr>
                ) : (
                  stats.latestBusinesses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {b.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.city_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.category_name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/businesses/${b.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
