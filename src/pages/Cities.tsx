import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { City, Province, CityFiltersState, CitySortOption } from '../types';
import { StatCard } from '../components/StatCard';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export const Cities: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<CityFiltersState>({
    search: '',
    provinceId: 'all',
    status: 'all',
    sortBy: 'businesses_desc',
  });

  // Carga de provincias
  useEffect(() => {
    api.getProvinces().then(setProvinces);
  }, []);

  // Carga de ciudades cuando cambian los filtros
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getCities(filters).then((data) => {
      if (isMounted) {
        setCities(data);
        setCurrentPage(1);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [filters]);

  // Métricas superiores basadas en la totalidad de ciudades
  const totalCitiesCount = cities.length;
  const withDataCount = useMemo(() => cities.filter((c) => (c.business_count || 0) > 0).length, [cities]);
  const noDataCount = totalCitiesCount - withDataCount;

  // Paginación
  const totalPages = Math.ceil(cities.length / ITEMS_PER_PAGE) || 1;
  const paginatedCities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return cities.slice(start, start + ITEMS_PER_PAGE);
  }, [cities, currentPage]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      provinceId: 'all',
      status: 'all',
      sortBy: 'businesses_desc',
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ciudades</h1>
        <p className="text-sm text-slate-500 mt-0.5">Listado general de localidades y cobertura de scraping</p>
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total ciudades" value={totalCitiesCount} />
        <StatCard 
          label="Con negocios" 
          value={withDataCount} 
          sublabel="Ciudades activas con leads"
          highlight={withDataCount > 0}
        />
        <StatCard 
          label="Sin datos" 
          value={noDataCount} 
          sublabel="Pendientes de scraping"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscar ciudad */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar ciudad..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filtro Provincia */}
          <div>
            <select
              value={filters.provinceId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  provinceId: e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">Todas las provincias</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as 'all' | 'with_data' | 'no_data',
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">Todos los estados</option>
              <option value="with_data">Con datos</option>
              <option value="no_data">Sin datos</option>
            </select>
          </div>

          {/* Ordenar */}
          <div>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as CitySortOption,
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="businesses_desc">Mayor cantidad de negocios</option>
              <option value="businesses_asc">Menor cantidad de negocios</option>
              <option value="name_asc">Nombre A-Z</option>
              <option value="name_desc">Nombre Z-A</option>
              <option value="last_scraping">Último scraping</option>
            </select>
          </div>
        </div>

        {/* Limpiar filtros si alguno está activo */}
        {(filters.search || filters.provinceId !== 'all' || filters.status !== 'all' || filters.sortBy !== 'businesses_desc') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Ciudades */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                <th className="py-3 px-4">Ciudad</th>
                <th className="py-3 px-4">Provincia</th>
                <th className="py-3 px-4 text-center">Negocios</th>
                <th className="py-3 px-4">Último scraping</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Cargando ciudades...
                  </td>
                </tr>
              ) : paginatedCities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No se encontraron ciudades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedCities.map((city) => {
                  const hasData = (city.business_count || 0) > 0;
                  return (
                    <tr key={city.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {city.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {city.province_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            hasData ? 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded' : 'text-slate-400'
                          }`}
                        >
                          {city.business_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {formatDate(city.last_scraped_at)}
                      </td>
                      <td className="py-3 px-4">
                        {hasData ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Con datos
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                            Sin datos
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/cities/${city.id}`}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && cities.length > ITEMS_PER_PAGE && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Mostrando{' '}
              <span className="font-semibold text-slate-900">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, cities.length)}
              </span>{' '}
              de <span className="font-semibold text-slate-900">{cities.length}</span> ciudades
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
