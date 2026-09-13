import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Business, Province, City, BusinessCategory, BusinessStatus, BusinessFiltersState } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusSelect } from '../components/StatusSelect';
import { CopyButton } from '../components/CopyButton';
import { Search, RotateCcw, ChevronLeft, ChevronRight, Phone, ExternalLink } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export const Businesses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Inicialización de filtros desde Query Params si existen
  const initialSearch = searchParams.get('search') || '';

  const [filters, setFilters] = useState<BusinessFiltersState>({
    search: initialSearch,
    provinceId: 'all',
    cityId: 'all',
    categoryId: 'all',
    status: 'all',
    hasWebsite: 'all',
  });

  // Carga de maestros: Provincias, Ciudades y Categorías
  useEffect(() => {
    Promise.all([
      api.getProvinces(),
      api.getCities({ search: '', provinceId: 'all', status: 'all', sortBy: 'name_asc' }),
      api.getCategories(),
    ]).then(([provs, cts, cats]) => {
      setProvinces(provs);
      setAllCities(cts);
      setCategories(cats);
    });
  }, []);

  // Sincronizar búsqueda si cambia el query param en la URL
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== filters.search) {
      setFilters((prev) => ({ ...prev, search: q }));
    }
  }, [searchParams]);

  // Carga de negocios según filtros
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getBusinesses(filters).then((data) => {
      if (isMounted) {
        setBusinesses(data);
        setCurrentPage(1);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [filters]);

  // Ciudades filtradas por la provincia seleccionada (Filtros en cascada)
  const availableCities = useMemo(() => {
    if (filters.provinceId === 'all') {
      return allCities;
    }
    return allCities.filter((c) => c.province_id === filters.provinceId);
  }, [allCities, filters.provinceId]);

  const handleProvinceChange = (provinceIdVal: number | 'all') => {
    setFilters((prev) => {
      // Si la ciudad actual no pertenece a la nueva provincia, reset a 'all'
      let newCityId = prev.cityId;
      if (provinceIdVal !== 'all' && prev.cityId !== 'all') {
        const cityObj = allCities.find((c) => c.id === prev.cityId);
        if (cityObj && cityObj.province_id !== provinceIdVal) {
          newCityId = 'all';
        }
      }
      return {
        ...prev,
        provinceId: provinceIdVal,
        cityId: newCityId,
      };
    });
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setFilters({
      search: '',
      provinceId: 'all',
      cityId: 'all',
      categoryId: 'all',
      status: 'all',
      hasWebsite: 'all',
    });
  };

  const handleStatusChange = async (businessId: number, newStatus: BusinessStatus) => {
    const ok = await api.updateBusinessStatus(businessId, newStatus);
    if (ok) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, status: newStatus } : b))
      );
    }
    return ok;
  };

  // Métricas de resumen
  const totalCount = businesses.length;
  const withoutWebCount = useMemo(() => businesses.filter((b) => !b.has_website).length, [businesses]);
  const withWhatsappCount = useMemo(() => businesses.filter((b) => Boolean(b.whatsapp)).length, [businesses]);
  const pendingCount = useMemo(() => businesses.filter((b) => b.status === 'NEW').length, [businesses]);

  // Paginación
  const totalPages = Math.ceil(businesses.length / ITEMS_PER_PAGE) || 1;
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return businesses.slice(start, start + ITEMS_PER_PAGE);
  }, [businesses, currentPage]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Negocios</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Listado general de leads encontrados independientemente de la ciudad
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={totalCount} sublabel="Leads registrados" />
        <StatCard 
          label="Sin web" 
          value={withoutWebCount} 
          sublabel="Prioridad de contacto"
          highlight={withoutWebCount > 0}
        />
        <StatCard label="Con WhatsApp" value={withWhatsappCount} sublabel="Contacto directo" />
        <StatCard 
          label="Pendientes" 
          value={pendingCount} 
          sublabel="Estado: Nuevo"
          highlight={pendingCount > 0}
        />
      </div>

      {/* Panel de Filtros Combinables */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Buscar negocio */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar negocio, dirección o teléfono..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Selector Provincia */}
          <div>
            <select
              value={filters.provinceId}
              onChange={(e) =>
                handleProvinceChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">Todas las provincias</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Ciudad (en cascada) */}
          <div>
            <select
              value={filters.cityId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  cityId: e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">
                {filters.provinceId === 'all' ? 'Todas las ciudades' : 'Ciudades de la provincia'}
              </option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Rubro */}
          <div>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">Todos los rubros</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Estado */}
          <div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as BusinessStatus | 'all',
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">Todos los estados</option>
              <option value="NEW">Nuevo</option>
              <option value="CONTACTED">Contactado</option>
              <option value="INTERESTED">Interesado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="CLIENT">Cliente</option>
              <option value="DISCARDED">Descartado</option>
            </select>
          </div>
        </div>

        {/* Segunda fila de opciones (Web + Limpieza) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium text-slate-500">Tiene sitio web:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="hasWebsite"
                value="all"
                checked={filters.hasWebsite === 'all'}
                onChange={() => setFilters((p) => ({ ...p, hasWebsite: 'all' }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Todos</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="hasWebsite"
                value="false"
                checked={filters.hasWebsite === 'false'}
                onChange={() => setFilters((p) => ({ ...p, hasWebsite: 'false' }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-rose-600 font-medium">No (Sin web)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="hasWebsite"
                value="true"
                checked={filters.hasWebsite === 'true'}
                onChange={() => setFilters((p) => ({ ...p, hasWebsite: 'true' }))}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-emerald-700">Sí (Con web)</span>
            </label>
          </div>

          {(filters.search ||
            filters.provinceId !== 'all' ||
            filters.cityId !== 'all' ||
            filters.categoryId !== 'all' ||
            filters.status !== 'all' ||
            filters.hasWebsite !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors self-end"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Negocios */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                <th className="py-3 px-4">Negocio</th>
                <th className="py-3 px-4">Ciudad</th>
                <th className="py-3 px-4">Rubro</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Web</th>
                <th className="py-3 px-4 text-center">Mensaje</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Cargando negocios...
                  </td>
                </tr>
              ) : paginatedBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No se encontraron negocios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Negocio */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      {b.address && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{b.address}</div>
                      )}
                    </td>

                    {/* Ciudad */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{b.city_name || '-'}</div>
                      {b.province_name && (
                        <div className="text-[11px] text-slate-400">{b.province_name}</div>
                      )}
                    </td>

                    {/* Rubro */}
                    <td className="py-3 px-4 text-slate-600">{b.category_name || '-'}</td>

                    {/* Contacto */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {b.whatsapp ? (
                          <a
                            href={`https://wa.me/${b.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            title="Contactar por WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {b.whatsapp}
                          </a>
                        ) : b.phone ? (
                          <span className="text-slate-600">{b.phone}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {b.instagram && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            {b.instagram}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Web */}
                    <td className="py-3 px-4 text-center">
                      {b.has_website ? (
                        <a
                          href={b.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <span>Sí</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          No
                        </span>
                      )}
                    </td>

                    {/* Mensaje generado: Botón Copiar */}
                    <td className="py-3 px-4 text-center">
                      <CopyButton text={b.generated_message} />
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      <StatusSelect
                        status={b.status}
                        onChange={(newStatus) => handleStatusChange(b.id, newStatus)}
                      />
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/businesses/${b.id}`}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
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

        {/* Paginación */}
        {!loading && businesses.length > ITEMS_PER_PAGE && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Mostrando{' '}
              <span className="font-semibold text-slate-900">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, businesses.length)}
              </span>{' '}
              de <span className="font-semibold text-slate-900">{businesses.length}</span> negocios
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
