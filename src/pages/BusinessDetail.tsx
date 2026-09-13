import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Business, BusinessStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { 
  ChevronRight, 
  Phone, 
  ExternalLink, 
  Mail, 
  Instagram, 
  MapPin, 
  Check, 
  Save, 
  MessageSquare,
  FileText
} from 'lucide-react';

export const BusinessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const businessId = Number(id);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados editables
  const [currentStatus, setCurrentStatus] = useState<BusinessStatus>('NEW');
  const [notes, setNotes] = useState('');
  const [statusSaved, setStatusSaved] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getBusinessById(businessId).then((data) => {
      if (isMounted) {
        setBusiness(data);
        if (data) {
          setCurrentStatus(data.status);
          setNotes(data.notes || '');
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [businessId]);

  const handleSaveStatus = async () => {
    if (!business) return;
    const ok = await api.updateBusinessStatus(business.id, currentStatus);
    if (ok) {
      setBusiness((prev) => (prev ? { ...prev, status: currentStatus } : null));
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2500);
    }
  };

  const handleSaveNotes = async () => {
    if (!business) return;
    const ok = await api.updateBusinessNotes(business.id, notes);
    if (ok) {
      setBusiness((prev) => (prev ? { ...prev, notes } : null));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48"></div>
        <div className="h-10 bg-slate-200 rounded w-96"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-lg"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Negocio no encontrado</h2>
        <p className="text-sm text-slate-500 mt-1">El negocio solicitado no existe o fue eliminado.</p>
        <Link
          to="/businesses"
          className="inline-block mt-4 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver a Negocios
        </Link>
      </div>
    );
  }

  const cleanWaNumber = business.whatsapp ? business.whatsapp.replace(/\D/g, '') : '';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-slate-500 gap-1.5">
        <Link to="/businesses" className="hover:text-blue-600 transition-colors">
          Negocios
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        {business.city_name && (
          <>
            <Link to={`/cities/${business.city_id}`} className="hover:text-blue-600 transition-colors">
              {business.city_name}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </>
        )}
        <span className="font-semibold text-slate-800">{business.name}</span>
      </nav>

      {/* Header Principal con Nombre y Estado Actual */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{business.name}</h1>
            <StatusBadge status={business.status} size="md" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {business.category_name || 'Sin rubro'} • {business.city_name || '-'}, {business.province_name || '-'}
          </p>
        </div>

        {/* Selector y Guardado de Estado */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-md">
          <label htmlFor="status-select" className="text-xs font-medium text-slate-600">
            Estado:
          </label>
          <select
            id="status-select"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value as BusinessStatus)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-800"
          >
            <option value="NEW">Nuevo</option>
            <option value="CONTACTED">Contactado</option>
            <option value="INTERESTED">Interesado</option>
            <option value="REJECTED">Rechazado</option>
            <option value="CLIENT">Cliente</option>
            <option value="DISCARDED">Descartado</option>
          </select>
          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={currentStatus === business.status && !statusSaved}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              statusSaved
                ? 'bg-emerald-600 text-white'
                : currentStatus !== business.status
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {statusSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardado</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Principal: Ficha Técnica (izq) y Gestión/Mensaje (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Ficha de Información */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Ficha del Negocio
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-400">Rubro</dt>
              <dd className="text-slate-800 font-medium mt-0.5">{business.category_name || '-'}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Ciudad</dt>
              <dd className="text-slate-800 font-medium mt-0.5">
                {business.city_name ? (
                  <Link to={`/cities/${business.city_id}`} className="text-blue-600 hover:underline">
                    {business.city_name}
                  </Link>
                ) : (
                  '-'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Provincia</dt>
              <dd className="text-slate-800 mt-0.5">{business.province_name || '-'}</dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Dirección</dt>
              <dd className="text-slate-800 mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{business.address || 'No informada'}</span>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Teléfono</dt>
              <dd className="text-slate-800 mt-0.5">
                {business.phone ? (
                  <a href={`tel:${business.phone}`} className="text-slate-700 hover:text-blue-600">
                    {business.phone}
                  </a>
                ) : (
                  'No informado'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">WhatsApp</dt>
              <dd className="text-slate-800 mt-0.5">
                {business.whatsapp ? (
                  <a
                    href={`https://wa.me/${cleanWaNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {business.whatsapp}
                    <ExternalLink className="w-3 h-3 text-emerald-500" />
                  </a>
                ) : (
                  'No informado'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Instagram</dt>
              <dd className="text-slate-800 mt-0.5">
                {business.instagram ? (
                  <a
                    href={
                      business.instagram.startsWith('http')
                        ? business.instagram
                        : `https://instagram.com/${business.instagram.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-pink-600"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    {business.instagram}
                  </a>
                ) : (
                  'No informado'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Email</dt>
              <dd className="text-slate-800 mt-0.5">
                {business.email ? (
                  <a
                    href={`mailto:${business.email}`}
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {business.email}
                  </a>
                ) : (
                  'No informado'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Sitio Web</dt>
              <dd className="mt-0.5">
                {business.has_website && business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                  >
                    <span className="truncate max-w-[200px]">{business.website}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-rose-600 text-xs font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    No tiene sitio web
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-slate-400">Fuente / Maps</dt>
              <dd className="text-slate-800 mt-0.5">
                {business.google_maps_url ? (
                  <a
                    href={business.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                  >
                    <span>{business.source || 'Google Maps'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-600 text-xs">{business.source || 'Google Maps'}</span>
                )}
              </dd>
            </div>

            {business.score !== null && (
              <div>
                <dt className="text-xs font-medium text-slate-400">Calificación / Score</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">
                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                    {business.score} / 100
                  </span>
                </dd>
              </div>
            )}

            {business.external_id && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400">ID Externo</dt>
                <dd className="text-slate-500 font-mono text-[11px] mt-0.5 truncate">
                  {business.external_id}
                </dd>
              </div>
            )}
          </dl>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
            <span>Registrado: {formatDate(business.created_at)}</span>
            <span>Última actualización: {formatDate(business.updated_at)}</span>
          </div>
        </div>

        {/* Columna Derecha: Mensaje Generado y Notas */}
        <div className="space-y-6">
          {/* Caja del Mensaje Generado */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Mensaje generado automáticamente
                </h2>
              </div>
              <CopyButton 
                text={business.generated_message} 
                label="Copiar mensaje" 
                size="md" 
              />
            </div>

            <p className="text-xs text-slate-500">
              Personalizado por el bot según rubro y presencia digital. Copialo y envialo por WhatsApp o Instagram.
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={business.generated_message || 'No se generó un mensaje para este negocio.'}
                rows={6}
                className="w-full p-3.5 text-sm bg-slate-50/70 border border-slate-200 rounded-md text-slate-800 font-normal leading-relaxed focus:outline-none cursor-text resize-none"
              />
            </div>

            {business.whatsapp && (
              <div className="pt-1 flex items-center justify-end">
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
                    business.generated_message || ''
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Abrir WhatsApp con mensaje</span>
                </a>
              </div>
            )}
          </div>

          {/* Caja de Notas */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Notas de seguimiento</h2>
              </div>
              <button
                type="button"
                onClick={handleSaveNotes}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  notesSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {notesSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Notas guardadas</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar notas</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Escribí aquí notas sobre la conversación, respuestas del cliente o fecha de re-contacto..."
              className="w-full p-3 text-sm bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
