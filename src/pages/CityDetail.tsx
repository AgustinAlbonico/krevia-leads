import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { City, Business, BusinessStatus, BusinessCategory } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusSelect } from '../components/StatusSelect';
import { CopyButton } from '../components/CopyButton';
import { ChevronRight, Search, Phone, ExternalLink, RotateCcw } from 'lucide-react';

export const CityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cityId = Number(id);

  const [cityData, setCityData] = useState<{
    city: City;
    stats: {
      totalBusinesses: number;
      withoutWeb: number;
      withWhatsapp: number;
      totalCategories: number;
    };
    categoryBreakdown: { category_name: string; count: number }[];
  } | null>(null);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros internos de negocios de la ciudad
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<BusinessStatus | 'all'>('all');
  const [selectedWeb, setSelectedWeb] = useState<'all' | 'true' | 'false'>('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getCityDetail(cityId),
      api.getBusinesses({
        search: '',
        provinceId: 'all',
        cityId: cityId,
        categoryId: 'all',
        status: 'all',
        hasWebsite: 'all',
      }),
      api.getCategories(),
    ]).then(([detail, bizList, catList]) => {
      if (isMounted) {
        setCityData(detail);
        setBusinesses(bizList);
        setCategories(catList);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cityId]);

  // Filtrado reactivo en el cliente para máxima velocidad
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          b.name.toLowerCase().includes(q) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          (b.phone && b.phone.includes(q));
        if (!matches) return false;
      }

      if (selectedCategory !== 'all' && b.category_id !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== 'all' && b.status !== selectedStatus) {
        return false;
      }

      if (selectedWeb !== 'all') {
        const wantsWeb = selectedWeb === 'true';
        if (b.has_website !== wantsWeb) return false;
      }

      return true;
    });
  }, [businesses, search, selectedCategory, selectedStatus, selectedWeb]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedWeb('all');
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

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Sin fecha';
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-64"></div>
        <div className="h-10 bg-slate-200 rounded w-48"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Ciudad no encontrada</h2>
        <p className="text-sm text-slate-500 mt-1">El identificador ingresado no corresponde a una localidad válida.</p>
        <Link
          to="/cities"
          className="inline-block mt-4 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver a Ciudades
        </Link>
      </div>
    );
  }

  const { city, stats, categoryBreakdown } = cityData;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-slate-500 gap-1.5">
        <Link to="/cities" className="hover:text-blue-600 transition-colors">
          Ciudades
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span>{city.province_name || 'Provincia'}</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800">{city.name}</span>
      </nav>

      {/* Encabezado y Metadata simple */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{city.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Negocios encontrados en esta ciudad</p>
        </div>
        <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-3.5 py-2 space-y-1 sm:text-right">
          <div>
            <span className="text-slate-400">Provincia:</span>{' '}
            <span className="font-medium text-slate-800">{city.province_name || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400">Último scraping:</span>{' '}
            <span className="font-medium text-slate-800">{formatDate(city.last_scraped_at)}</span>
          </div>
        </div>
      </div>

      {/* Resumen en 4 Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Negocios" value={stats.totalBusinesses} sublabel="En esta ciudad" />
        <StatCard 
          label="Sin web" 
          value={stats.withoutWeb} 
          sublabel="Oportunidad principal"
          highlight={stats.withoutWeb > 0}
        />
        <StatCard label="Con WhatsApp" value={stats.withWhatsapp} sublabel="Contacto directo" />
        <StatCard label="Rubros" value={stats.totalCategories} sublabel="Sectores detectados" />
      </div>

      {/* Rubros principales de la ciudad */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Rubros principales de la ciudad</h2>
          <span className="text-xs text-slate-500">{categoryBreakdown.length} rubros detectados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                <th className="py-2.5 px-4">Rubro</th>
                <th className="py-2.5 px-4 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 px-4 text-center text-slate-400">
                    No hay rubros clasificados en esta ciudad.
                  </td>
                </tr>
              ) : (
                categoryBreakdown.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-4 font-medium text-slate-800">{cat.category_name}</td>
                    <td className="py-2 px-4 text-right font-semibold text-slate-900">{cat.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Negocios dentro de una ciudad */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Negocios en {city.name}
          </h2>
          <p className="text-xs text-slate-500">Listado detallado con acceso a mensaje y estados</p>
        </div>

        {/* Filtros de la tabla de la ciudad */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buscar negocio */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar negocio..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Rubro */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
              >
                <option value="all">Todos los rubros</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as BusinessStatus | 'all')}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
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

            {/* Web */}
            <div>
              <select
                value={selectedWeb}
                onChange={(e) => setSelectedWeb(e.target.value as 'all' | 'true' | 'false')}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
              >
                <option value="all">Web: Todos</option>
                <option value="false">Sin web (No)</option>
                <option value="true">Con web (Sí)</option>
              </select>
            </div>
          </div>

          {(search || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedWeb !== 'all') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla de negocios de la ciudad */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase font-medium">
                  <th className="py-3 px-4">Negocio</th>
                  <th className="py-3 px-4">Rubro</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Web</th>
                  <th className="py-3 px-4 text-center">Mensaje</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No hay negocios que coincidan con los filtros en {city.name}.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.name}</div>
                        {b.address && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{b.address}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.category_name || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {b.whatsapp ? (
                            <a
                              href={`https://wa.me/${b.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1"
                              title="Abrir WhatsApp"
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
                      <td className="py-3 px-4 text-center">
                        <CopyButton text={b.generated_message} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusSelect
                          status={b.status}
                          onChange={(newStatus) => handleStatusChange(b.id, newStatus)}
                        />
                      </td>
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
        </div>
      </div>
    </div>
  );
};
