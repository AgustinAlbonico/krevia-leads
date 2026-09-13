import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Province, 
  City, 
  BusinessCategory, 
  Business, 
  BusinessStatus,
  DashboardStats,
  CityFiltersState,
  BusinessFiltersState
} from '../types';
import { 
  INITIAL_PROVINCES, 
  INITIAL_CATEGORIES, 
  INITIAL_CITIES, 
  INITIAL_BUSINESSES 
} from './mockData';

// Local storage keys para modo demo
const STORAGE_KEY_BUSINESSES = 'krevia_mock_businesses';

function getLocalBusinesses(): Business[] {
  const stored = localStorage.getItem(STORAGE_KEY_BUSINESSES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(INITIAL_BUSINESSES));
  return INITIAL_BUSINESSES;
}

function saveLocalBusinesses(businesses: Business[]) {
  localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(businesses));
}

// ==============================================================================
// SERVICIOS DE DATOS (CONMUTACIÓN TRANSPARENTE: SUPABASE O DEMO LOCAL)
// ==============================================================================

export const api = {
  // 1. DASHBOARD
  async getDashboardStats(): Promise<DashboardStats> {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Conteo total de ciudades
        const { count: totalCities } = await supabase
          .from('cities')
          .select('*', { count: 'exact', head: true });

        // Conteo total de negocios
        const { count: totalBusinesses } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });

        // Conteo de negocios pendientes (NEW)
        const { count: pendingBusinesses } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'NEW');

        // Ciudades con estadísticas desde la vista
        const { data: citiesData } = await supabase
          .from('view_cities_with_stats')
          .select('*')
          .order('business_count', { ascending: false });

        const citiesWithBusinesses = (citiesData || []).filter(c => (c.business_count || 0) > 0).length;
        const topCities: City[] = (citiesData || []).slice(0, 5);

        // Últimos negocios cargados
        const { data: latestData } = await supabase
          .from('businesses')
          .select(`
            *,
            cities (name, provinces (name)),
            business_categories (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        const latestBusinesses: Business[] = (latestData || []).map(b => ({
          ...b,
          city_name: b.cities?.name,
          province_name: b.cities?.provinces?.name,
          category_name: b.business_categories?.name,
        }));

        return {
          totalCities: totalCities || 0,
          citiesWithBusinesses,
          totalBusinesses: totalBusinesses || 0,
          pendingBusinesses: pendingBusinesses || 0,
          topCities,
          latestBusinesses,
        };
      } catch (err) {
        console.warn('Error conectando a Supabase, usando datos locales:', err);
      }
    }

    // Modo local / demo
    const businesses = getLocalBusinesses();
    const citiesMap = new Map<number, City>();

    INITIAL_CITIES.forEach(c => {
      citiesMap.set(c.id, {
        ...c,
        business_count: 0,
        last_scraped_at: null,
      });
    });

    businesses.forEach(b => {
      const city = citiesMap.get(b.city_id);
      if (city) {
        city.business_count = (city.business_count || 0) + 1;
        if (!city.last_scraped_at || new Date(b.created_at) > new Date(city.last_scraped_at)) {
          city.last_scraped_at = b.created_at;
        }
      }
    });

    const allCitiesWithStats = Array.from(citiesMap.values());
    const citiesWithBusinesses = allCitiesWithStats.filter(c => (c.business_count || 0) > 0).length;
    const topCities = [...allCitiesWithStats]
      .sort((a, b) => (b.business_count || 0) - (a.business_count || 0))
      .slice(0, 5);

    const latestBusinesses = [...businesses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      totalCities: INITIAL_CITIES.length + 2270, // Simula volumen total de ciudades de Argentina
      citiesWithBusinesses,
      totalBusinesses: businesses.length,
      pendingBusinesses: businesses.filter(b => b.status === 'NEW').length,
      topCities,
      latestBusinesses,
    };
  },

  // 2. PROVINCIAS
  async getProvinces(): Promise<Province[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) return data;
    }
    return [...INITIAL_PROVINCES].sort((a, b) => a.name.localeCompare(b.name));
  },

  // 3. RUBROS / CATEGORÍAS
  async getCategories(): Promise<BusinessCategory[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) return data;
    }
    return [...INITIAL_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
  },

  // 4. LISTADO DE CIUDADES CON ESTADÍSTICAS Y FILTROS
  async getCities(filters: CityFiltersState): Promise<City[]> {
    let cities: City[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('view_cities_with_stats').select('*');

        if (filters.provinceId !== 'all') {
          query = query.eq('province_id', filters.provinceId);
        }

        if (filters.search.trim()) {
          query = query.ilike('name', `%${filters.search.trim()}%`);
        }

        if (filters.status === 'with_data') {
          query = query.gt('business_count', 0);
        } else if (filters.status === 'no_data') {
          query = query.eq('business_count', 0);
        }

        // Ordenamiento
        switch (filters.sortBy) {
          case 'businesses_desc':
            query = query.order('business_count', { ascending: false }).order('name', { ascending: true });
            break;
          case 'businesses_asc':
            query = query.order('business_count', { ascending: true }).order('name', { ascending: true });
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          case 'last_scraping':
            query = query.order('last_scraped_at', { ascending: false, nullsFirst: false });
            break;
        }

        const { data, error } = await query;
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Fallback a modo local para getCities:', err);
      }
    }

    // Modo local / demo
    const businesses = getLocalBusinesses();
    const citiesMap = new Map<number, City>();

    INITIAL_CITIES.forEach(c => {
      citiesMap.set(c.id, {
        ...c,
        business_count: 0,
        last_scraped_at: null,
      });
    });

    businesses.forEach(b => {
      const city = citiesMap.get(b.city_id);
      if (city) {
        city.business_count = (city.business_count || 0) + 1;
        if (!city.last_scraped_at || new Date(b.created_at) > new Date(city.last_scraped_at)) {
          city.last_scraped_at = b.created_at;
        }
      }
    });

    cities = Array.from(citiesMap.values());

    // Filtros locales
    if (filters.provinceId !== 'all') {
      cities = cities.filter(c => c.province_id === filters.provinceId);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      cities = cities.filter(c => c.name.toLowerCase().includes(q));
    }
    if (filters.status === 'with_data') {
      cities = cities.filter(c => (c.business_count || 0) > 0);
    } else if (filters.status === 'no_data') {
      cities = cities.filter(c => (c.business_count || 0) === 0);
    }

    // Ordenamiento local
    cities.sort((a, b) => {
      switch (filters.sortBy) {
        case 'businesses_desc':
          return (b.business_count || 0) - (a.business_count || 0) || a.name.localeCompare(b.name);
        case 'businesses_asc':
          return (a.business_count || 0) - (b.business_count || 0) || a.name.localeCompare(b.name);
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'last_scraping': {
          const timeA = a.last_scraped_at ? new Date(a.last_scraped_at).getTime() : 0;
          const timeB = b.last_scraped_at ? new Date(b.last_scraped_at).getTime() : 0;
          return timeB - timeA;
        }
        default:
          return 0;
      }
    });

    return cities;
  },

  // 5. DETALLE DE CIUDAD + MÉTRICAS + DESGLOSE DE RUBROS
  async getCityDetail(cityId: number): Promise<{
    city: City;
    stats: {
      totalBusinesses: number;
      withoutWeb: number;
      withWhatsapp: number;
      totalCategories: number;
    };
    categoryBreakdown: { category_name: string; count: number }[];
  } | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: cityData } = await supabase
          .from('view_cities_with_stats')
          .select('*')
          .eq('id', cityId)
          .single();

        if (cityData) {
          const { data: businesses } = await supabase
            .from('businesses')
            .select('*, business_categories(name)')
            .eq('city_id', cityId);

          const list = businesses || [];
          const totalBusinesses = list.length;
          const withoutWeb = list.filter(b => !b.has_website).length;
          const withWhatsapp = list.filter(b => Boolean(b.whatsapp)).length;

          // Breakdown
          const catCountMap = new Map<string, number>();
          list.forEach(b => {
            const catName = b.business_categories?.name || 'Sin rubro';
            catCountMap.set(catName, (catCountMap.get(catName) || 0) + 1);
          });

          const categoryBreakdown = Array.from(catCountMap.entries())
            .map(([category_name, count]) => ({ category_name, count }))
            .sort((a, b) => b.count - a.count);

          return {
            city: cityData,
            stats: {
              totalBusinesses,
              withoutWeb,
              withWhatsapp,
              totalCategories: categoryBreakdown.length,
            },
            categoryBreakdown,
          };
        }
      } catch (err) {
        console.warn('Fallback a modo local para getCityDetail:', err);
      }
    }

    // Modo local
    const city = INITIAL_CITIES.find(c => c.id === cityId);
    if (!city) return null;

    const businesses = getLocalBusinesses().filter(b => b.city_id === cityId);
    const totalBusinesses = businesses.length;
    const withoutWeb = businesses.filter(b => !b.has_website).length;
    const withWhatsapp = businesses.filter(b => Boolean(b.whatsapp)).length;

    const catCountMap = new Map<string, number>();
    businesses.forEach(b => {
      const catName = b.category_name || 'Sin rubro';
      catCountMap.set(catName, (catCountMap.get(catName) || 0) + 1);
    });

    const categoryBreakdown = Array.from(catCountMap.entries())
      .map(([category_name, count]) => ({ category_name, count }))
      .sort((a, b) => b.count - a.count);

    const last_scraped_at = businesses.reduce<string | null>((latest, b) => {
      if (!latest || new Date(b.created_at) > new Date(latest)) return b.created_at;
      return latest;
    }, null);

    return {
      city: {
        ...city,
        business_count: totalBusinesses,
        last_scraped_at,
      },
      stats: {
        totalBusinesses,
        withoutWeb,
        withWhatsapp,
        totalCategories: categoryBreakdown.length,
      },
      categoryBreakdown,
    };
  },

  // 6. NEGOCIOS GLOBALES O FILTRADOS
  async getBusinesses(filters: BusinessFiltersState): Promise<Business[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('businesses')
          .select(`
            *,
            cities!inner (id, name, province_id, provinces!inner (id, name)),
            business_categories (name)
          `);

        if (filters.search.trim()) {
          query = query.ilike('name', `%${filters.search.trim()}%`);
        }

        if (filters.provinceId !== 'all') {
          query = query.eq('cities.province_id', filters.provinceId);
        }

        if (filters.cityId !== 'all') {
          query = query.eq('city_id', filters.cityId);
        }

        if (filters.categoryId !== 'all') {
          query = query.eq('category_id', filters.categoryId);
        }

        if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.hasWebsite !== 'all') {
          query = query.eq('has_website', filters.hasWebsite === 'true');
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
          return data.map(b => ({
            ...b,
            city_name: b.cities?.name,
            province_name: b.cities?.provinces?.name,
            category_name: b.business_categories?.name,
          }));
        }
      } catch (err) {
        console.warn('Fallback a modo local para getBusinesses:', err);
      }
    }

    // Modo local / demo
    let list = getLocalBusinesses();

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(b => 
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q))
      );
    }

    if (filters.provinceId !== 'all') {
      const allowedCityIds = INITIAL_CITIES
        .filter(c => c.province_id === filters.provinceId)
        .map(c => c.id);
      list = list.filter(b => allowedCityIds.includes(b.city_id));
    }

    if (filters.cityId !== 'all') {
      list = list.filter(b => b.city_id === filters.cityId);
    }

    if (filters.categoryId !== 'all') {
      list = list.filter(b => b.category_id === filters.categoryId);
    }

    if (filters.status !== 'all') {
      list = list.filter(b => b.status === filters.status);
    }

    if (filters.hasWebsite !== 'all') {
      const isTrue = filters.hasWebsite === 'true';
      list = list.filter(b => b.has_website === isTrue);
    }

    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // 7. DETALLE DE UN NEGOCIO POR ID
  async getBusinessById(id: number): Promise<Business | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            *,
            cities (id, name, provinces (id, name)),
            business_categories (name)
          `)
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            ...data,
            city_name: data.cities?.name,
            province_name: data.cities?.provinces?.name,
            category_name: data.business_categories?.name,
          };
        }
      } catch (err) {
        console.warn('Fallback a modo local para getBusinessById:', err);
      }
    }

    // Modo local
    const b = getLocalBusinesses().find(item => item.id === id);
    return b || null;
  },

  // 8. ACTUALIZAR ESTADO DE NEGOCIO
  async updateBusinessStatus(id: number, status: BusinessStatus): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('businesses')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Error actualizando estado en Supabase:', err);
      }
    }

    // Modo local
    const list = getLocalBusinesses();
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      list[idx].updated_at = new Date().toISOString();
      saveLocalBusinesses(list);
      return true;
    }
    return false;
  },

  // 9. ACTUALIZAR NOTAS DE NEGOCIO
  async updateBusinessNotes(id: number, notes: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('businesses')
          .update({ notes, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Error actualizando notas en Supabase:', err);
      }
    }

    // Modo local
    const list = getLocalBusinesses();
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      list[idx].notes = notes;
      list[idx].updated_at = new Date().toISOString();
      saveLocalBusinesses(list);
      return true;
    }
    return false;
  }
};
