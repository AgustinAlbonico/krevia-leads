import { Province, City, BusinessCategory, Business } from '../types';

export const INITIAL_PROVINCES: Province[] = [
  { id: 1, name: 'Buenos Aires', code: 'BA' },
  { id: 2, name: 'Ciudad Autónoma de Buenos Aires', code: 'CABA' },
  { id: 3, name: 'Catamarca', code: 'CAT' },
  { id: 4, name: 'Chaco', code: 'CHA' },
  { id: 5, name: 'Chubut', code: 'CHU' },
  { id: 6, name: 'Córdoba', code: 'CBA' },
  { id: 7, name: 'Corrientes', code: 'COR' },
  { id: 8, name: 'Entre Ríos', code: 'ER' },
  { id: 9, name: 'Formosa', code: 'FOR' },
  { id: 10, name: 'Jujuy', code: 'JUJ' },
  { id: 11, name: 'La Pampa', code: 'LP' },
  { id: 12, name: 'La Rioja', code: 'LR' },
  { id: 13, name: 'Mendoza', code: 'MDZ' },
  { id: 14, name: 'Misiones', code: 'MIS' },
  { id: 15, name: 'Neuquén', code: 'NEU' },
  { id: 16, name: 'Río Negro', code: 'RN' },
  { id: 17, name: 'Salta', code: 'SAL' },
  { id: 18, name: 'San Juan', code: 'SJ' },
  { id: 19, name: 'San Luis', code: 'SL' },
  { id: 20, name: 'Santa Cruz', code: 'SC' },
  { id: 21, name: 'Santa Fe', code: 'SF' },
  { id: 22, name: 'Santiago del Estero', code: 'SDE' },
  { id: 23, name: 'Tierra del Fuego', code: 'TDF' },
  { id: 24, name: 'Tucumán', code: 'TUC' },
];

export const INITIAL_CATEGORIES: BusinessCategory[] = [
  { id: 1, name: 'Mueblería' },
  { id: 2, name: 'Veterinaria' },
  { id: 3, name: 'Dietética' },
  { id: 4, name: 'Ferretería' },
  { id: 5, name: 'Gastronomía' },
  { id: 6, name: 'Gimnasio' },
  { id: 7, name: 'Peluquería' },
  { id: 8, name: 'Hotel' },
  { id: 9, name: 'Estudio contable' },
  { id: 10, name: 'Estudio jurídico' },
  { id: 11, name: 'Tecnología' },
  { id: 12, name: 'Taller mecánico' },
  { id: 13, name: 'Indumentaria' },
  { id: 14, name: 'Inmobiliaria' },
];

export const INITIAL_CITIES: City[] = [
  // Santa Fe (id: 21)
  { id: 1, province_id: 21, name: 'Rosario', population: 1029000, province_name: 'Santa Fe' },
  { id: 2, province_id: 21, name: 'Santa Fe', population: 415000, province_name: 'Santa Fe' },
  { id: 3, province_id: 21, name: 'Rafaela', population: 109000, province_name: 'Santa Fe' },
  { id: 4, province_id: 21, name: 'Cañada de Gómez', population: 30000, province_name: 'Santa Fe' },
  { id: 5, province_id: 21, name: 'Villa Eloísa', population: 3500, province_name: 'Santa Fe' },
  { id: 6, province_id: 21, name: 'Venado Tuerto', population: 82000, province_name: 'Santa Fe' },
  { id: 7, province_id: 21, name: 'Reconquista', population: 78000, province_name: 'Santa Fe' },
  { id: 8, province_id: 21, name: 'Santo Tomé', population: 66000, province_name: 'Santa Fe' },
  { id: 9, province_id: 21, name: 'Esperanza', population: 43000, province_name: 'Santa Fe' },
  { id: 10, province_id: 21, name: 'San Lorenzo', population: 50000, province_name: 'Santa Fe' },

  // Córdoba (id: 6)
  { id: 11, province_id: 6, name: 'Córdoba', population: 1500000, province_name: 'Córdoba' },
  { id: 12, province_id: 6, name: 'Río Cuarto', population: 180000, province_name: 'Córdoba' },
  { id: 13, province_id: 6, name: 'Villa María', population: 90000, province_name: 'Córdoba' },
  { id: 14, province_id: 6, name: 'Villa Carlos Paz', population: 75000, province_name: 'Córdoba' },
  { id: 15, province_id: 6, name: 'San Francisco', population: 65000, province_name: 'Córdoba' },
  { id: 16, province_id: 6, name: 'Bell Ville', population: 38000, province_name: 'Córdoba' },

  // Buenos Aires (id: 1)
  { id: 17, province_id: 1, name: 'La Plata', population: 772000, province_name: 'Buenos Aires' },
  { id: 18, province_id: 1, name: 'Mar del Plata', population: 682000, province_name: 'Buenos Aires' },
  { id: 19, province_id: 1, name: 'Bahía Blanca', population: 335000, province_name: 'Buenos Aires' },
  { id: 20, province_id: 1, name: 'Tandil', population: 150000, province_name: 'Buenos Aires' },
  { id: 21, province_id: 1, name: 'San Nicolás', population: 145000, province_name: 'Buenos Aires' },
  { id: 22, province_id: 1, name: 'Pergamino', population: 105000, province_name: 'Buenos Aires' },
  { id: 23, province_id: 1, name: 'Junín', population: 95000, province_name: 'Buenos Aires' },

  // Mendoza (id: 13)
  { id: 24, province_id: 13, name: 'Mendoza', population: 120000, province_name: 'Mendoza' },
  { id: 25, province_id: 13, name: 'San Rafael', population: 130000, province_name: 'Mendoza' },
  { id: 26, province_id: 13, name: 'Godoy Cruz', population: 195000, province_name: 'Mendoza' },
  { id: 27, province_id: 13, name: 'Guaymallén', population: 320000, province_name: 'Mendoza' },

  // Entre Ríos (id: 8)
  { id: 28, province_id: 8, name: 'Paraná', population: 290000, province_name: 'Entre Ríos' },
  { id: 29, province_id: 8, name: 'Concordia', population: 160000, province_name: 'Entre Ríos' },
  { id: 30, province_id: 8, name: 'Gualeguaychú', population: 95000, province_name: 'Entre Ríos' },
];

export const INITIAL_BUSINESSES: Business[] = [];

