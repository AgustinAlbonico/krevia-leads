export type BusinessStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'REJECTED'
  | 'CLIENT'
  | 'DISCARDED';

export interface Province {
  id: number;
  name: string;
  code: string | null;
  created_at?: string;
}

export interface City {
  id: number;
  province_id: number;
  name: string;
  population: number | null;
  created_at?: string;
  // Computed / Joined fields
  province_name?: string;
  business_count?: number;
  last_scraped_at?: string | null;
}

export interface BusinessCategory {
  id: number;
  name: string;
}

export interface Business {
  id: number;
  city_id: number;
  category_id: number | null;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  has_website: boolean;
  google_maps_url: string | null;
  source: string;
  external_id: string | null;
  source_url: string | null;
  score: number | null;
  generated_message: string | null;
  status: BusinessStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields for display
  city_name?: string;
  province_name?: string;
  category_name?: string;
}

export interface DashboardStats {
  totalCities: number;
  citiesWithBusinesses: number;
  totalBusinesses: number;
  pendingBusinesses: number;
  topCities: City[];
  latestBusinesses: Business[];
}

export type CitySortOption = 
  | 'businesses_desc'
  | 'businesses_asc'
  | 'name_asc'
  | 'name_desc'
  | 'last_scraping';

export interface CityFiltersState {
  search: string;
  provinceId: number | 'all';
  status: 'all' | 'with_data' | 'no_data';
  sortBy: CitySortOption;
}

export interface BusinessFiltersState {
  search: string;
  provinceId: number | 'all';
  cityId: number | 'all';
  categoryId: number | 'all';
  status: BusinessStatus | 'all';
  hasWebsite: 'all' | 'true' | 'false';
}
