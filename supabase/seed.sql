-- ==============================================================================
-- KREVIA LEADS - SEED DE DATOS INICIALES (ARGENTINA)
-- ==============================================================================

-- 1. PROVINCIAS DE ARGENTINA
INSERT INTO provinces (name, code) VALUES
    ('Buenos Aires', 'BA'),
    ('Ciudad Autónoma de Buenos Aires', 'CABA'),
    ('Catamarca', 'CAT'),
    ('Chaco', 'CHA'),
    ('Chubut', 'CHU'),
    ('Córdoba', 'CBA'),
    ('Corrientes', 'COR'),
    ('Entre Ríos', 'ER'),
    ('Formosa', 'FOR'),
    ('Jujuy', 'JUJ'),
    ('La Pampa', 'LP'),
    ('La Rioja', 'LR'),
    ('Mendoza', 'MDZ'),
    ('Misiones', 'MIS'),
    ('Neuquén', 'NEU'),
    ('Río Negro', 'RN'),
    ('Salta', 'SAL'),
    ('San Juan', 'SJ'),
    ('San Luis', 'SL'),
    ('Santa Cruz', 'SC'),
    ('Santa Fe', 'SF'),
    ('Santiago del Estero', 'SDE'),
    ('Tierra del Fuego', 'TDF'),
    ('Tucumán', 'TUC')
ON CONFLICT (name) DO NOTHING;

-- 2. RUBROS DE NEGOCIO HABITUALES
INSERT INTO business_categories (name) VALUES
    ('Mueblería'),
    ('Veterinaria'),
    ('Dietética'),
    ('Ferretería'),
    ('Gastronomía'),
    ('Gimnasio'),
    ('Peluquería'),
    ('Hotel'),
    ('Estudio contable'),
    ('Estudio jurídico'),
    ('Tecnología'),
    ('Taller mecánico'),
    ('Indumentaria'),
    ('Inmobiliaria')
ON CONFLICT (name) DO NOTHING;

-- 3. CIUDADES EJEMPLO
-- Santa Fe
INSERT INTO cities (province_id, name, population)
SELECT p.id, c.name, c.population
FROM provinces p,
(VALUES 
    ('Rosario', 1029000),
    ('Santa Fe', 415000),
    ('Rafaela', 109000),
    ('Cañada de Gómez', 30000),
    ('Villa Eloísa', 3500),
    ('Venado Tuerto', 82000),
    ('Reconquista', 78000),
    ('Santo Tomé', 66000),
    ('Esperanza', 43000),
    ('San Lorenzo', 50000)
) AS c(name, population)
WHERE p.code = 'SF'
ON CONFLICT (province_id, name) DO NOTHING;

-- Córdoba
INSERT INTO cities (province_id, name, population)
SELECT p.id, c.name, c.population
FROM provinces p,
(VALUES 
    ('Córdoba', 1500000),
    ('Río Cuarto', 180000),
    ('Villa María', 90000),
    ('Villa Carlos Paz', 75000),
    ('San Francisco', 65000),
    ('Bell Ville', 38000)
) AS c(name, population)
WHERE p.code = 'CBA'
ON CONFLICT (province_id, name) DO NOTHING;

-- Buenos Aires
INSERT INTO cities (province_id, name, population)
SELECT p.id, c.name, c.population
FROM provinces p,
(VALUES 
    ('La Plata', 772000),
    ('Mar del Plata', 682000),
    ('Bahía Blanca', 335000),
    ('Tandil', 150000),
    ('San Nicolás', 145000),
    ('Pergamino', 105000),
    ('Junín', 95000)
) AS c(name, population)
WHERE p.code = 'BA'
ON CONFLICT (province_id, name) DO NOTHING;

-- Mendoza
INSERT INTO cities (province_id, name, population)
SELECT p.id, c.name, c.population
FROM provinces p,
(VALUES 
    ('Mendoza', 120000),
    ('San Rafael', 130000),
    ('Godoy Cruz', 195000),
    ('Guaymallén', 320000)
) AS c(name, population)
WHERE p.code = 'MDZ'
ON CONFLICT (province_id, name) DO NOTHING;

-- Entre Ríos
INSERT INTO cities (province_id, name, population)
SELECT p.id, c.name, c.population
FROM provinces p,
(VALUES 
    ('Paraná', 290000),
    ('Concordia', 160000),
    ('Gualeguaychú', 95000)
) AS c(name, population)
WHERE p.code = 'ER'
ON CONFLICT (province_id, name) DO NOTHING;

-- 4. NEGOCIOS DE PRUEBA (LEADS SCRAPEADOS)
-- Rosario (Mueblerías, Veterinarias, Dietéticas, etc.)
INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Muebles López',
    'Av. Pellegrini 1420, Rosario',
    '+54 341 4578932',
    '+54 9 341 6213345',
    'contacto@muebleslopez.com.ar',
    '@muebleslopez.rosario',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=1001',
    'google_maps',
    'ChIJ_muebles_lopez_rosario',
    88,
    'Hola, estuve viendo su negocio Muebles López y noté que actualmente no cuentan con un sitio web con catálogo online. Trabajo desarrollando soluciones digitales para fábricas de muebles y creo que podríamos ayudarlos a captar más clientes en Rosario. Si les interesa, puedo mostrarles ejemplos específicos sin compromiso.',
    'NEW',
    'Excelente local sobre Pellegrini. Tienen mucho stock de algarrobo y pino.'
FROM cities c, business_categories cat
WHERE c.name = 'Rosario' AND cat.name = 'Mueblería'
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Veterinaria San Martín',
    'San Martín 3250, Rosario',
    '+54 341 4821199',
    '+54 9 341 5558912',
    'vetsanmartin@gmail.com',
    '@vet_sanmartin',
    'https://veterinariasanmartin.com.ar',
    TRUE,
    'https://maps.google.com/?cid=1002',
    'google_maps',
    'ChIJ_vet_sanmartin_rosario',
    65,
    'Hola, estuve viendo la web de Veterinaria San Martín. Noté que no está adaptada para solicitar turnos online ni urgencias por WhatsApp de forma directa. Desarrollamos herramientas para centros veterinarios para automatizar recordatorios de vacunas. ¿Les gustaría que les comparta una demo?',
    'CONTACTED',
    'Contactado por WhatsApp el 15/10. Quedó en responder el encargado del turno tarde.'
FROM cities c, business_categories cat
WHERE c.name = 'Rosario' AND cat.name = 'Veterinaria'
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Dietética Madre Tierra',
    'Córdoba 1820, Rosario',
    '+54 341 4247890',
    '+54 9 341 7123984',
    'madretierra.ros@gmail.com',
    '@madretierra.diet',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=1003',
    'google_maps',
    'ChIJ_dietetica_madretierra_rosario',
    92,
    'Hola equipo de Dietética Madre Tierra, vi su local en calle Córdoba y tienen una variedad increíble de productos. Noté que no disponen de menú o tienda web para pedidos por WhatsApp. Desarrollamos catálogos digitales rápidos pensados justo para dietéticas y almacenes naturales. ¿Tienen 5 minutos para coordinar una llamada?',
    'INTERESTED',
    'Respondieron interesados en armar catálogo para pedidos de oficina en el centro.'
FROM cities c, business_categories cat
WHERE c.name = 'Rosario' AND cat.name = 'Dietética'
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Ferretería Industrial La Tuerca',
    'Ovidio Lagos 2810, Rosario',
    '+54 341 4339900',
    '+54 9 341 4982103',
    'latuerca.rosario@hotmail.com',
    '@latuerca_ferreteria',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=1004',
    'google_maps',
    'ChIJ_ferreteria_latuerca_rosario',
    78,
    'Hola gente de La Tuerca! Notamos que reciben muchas consultas en su local pero no tienen ficha web con cotizador rápido para talleres y empresas de la zona. ¿Les interesaría ver una solución sencilla?',
    'NEW',
    'Zona muy comercial en Ovidio Lagos.'
FROM cities c, business_categories cat
WHERE c.name = 'Rosario' AND cat.name = 'Ferretería'
ON CONFLICT (source, external_id) DO NOTHING;

-- Córdoba
INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Gimnasio Titán Fitness',
    'Av. Colón 1250, Córdoba',
    '+54 351 4712390',
    '+54 9 351 6890214',
    'contacto@titanfitnesscba.com',
    '@titan_fitness_cba',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=2001',
    'google_maps',
    'ChIJ_titan_fitness_cordoba',
    85,
    'Hola equipo de Titán Fitness! Estuve viendo sus instalaciones en Av. Colón. Noté que no tienen página web para inscripción de socios ni venta de pases online. Ayudamos a gimnasios a sumar socios con páginas optimizadas para celulares. ¿Les gustaría ver ejemplos?',
    'NEW',
    'Poco manejo digital en redes pero tienen 400+ reseñas en Google Maps.'
FROM cities c, business_categories cat
WHERE c.name = 'Córdoba' AND cat.name = 'Gimnasio'
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Mueblería Nueva Era',
    'Humberto 1º 450, Córdoba',
    '+54 351 4220199',
    '+54 9 351 5304921',
    'info@nuevaeramuebles.com.ar',
    '@nuevaeramuebles',
    'https://nuevaeramuebles.com.ar',
    TRUE,
    'https://maps.google.com/?cid=2002',
    'google_maps',
    'ChIJ_muebles_nuevaera_cordoba',
    40,
    'Hola! Vimos su sitio web y notamos que tiene tiempos de carga lentos desde celulares. Podemos colaborar en optimizarlo.',
    'REJECTED',
    'Tienen agencia propia.'
FROM cities c, business_categories cat
WHERE c.name = 'Córdoba' AND cat.name = 'Mueblería'
ON CONFLICT (source, external_id) DO NOTHING;

-- Santa Fe Capital
INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Estudio Contable Albarracín & Asoc.',
    'San Jerónimo 2140, Santa Fe',
    '+54 342 4591020',
    '+54 9 342 6112233',
    'consultas@estudioalbarracin.com',
    '@albarracin_contable',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=3001',
    'google_maps',
    'ChIJ_estudio_albarracin_sf',
    90,
    'Estimados Cr. Albarracín: Estuve analizando la presencia digital de estudios contables en Santa Fe y noté que su firma no cuenta con una landing page institucional para captación de pymes y clientes corporativos. Trabajamos exclusivamente en sitios serios y profesionales para profesionales de ciencias económicas. ¿Podríamos coordinar una breve reunión virtual?',
    'CLIENT',
    'Cerraron el desarrollo de su web institucional y portal de clientes el mes pasado.'
FROM cities c, business_categories cat
WHERE c.name = 'Santa Fe' AND cat.name = 'Estudio contable'
ON CONFLICT (source, external_id) DO NOTHING;

-- Rafaela
INSERT INTO businesses (
    city_id, category_id, name, address, phone, whatsapp, email, instagram,
    website, has_website, google_maps_url, source, external_id, score,
    generated_message, status, notes
)
SELECT 
    c.id, cat.id,
    'Hotel Central Rafaela',
    'Bv. Santa Fe 340, Rafaela',
    '+54 3492 422001',
    '+54 9 3492 511029',
    'reservas@hotelcentralrafaela.com.ar',
    '@hotelcentralrafaela',
    NULL,
    FALSE,
    'https://maps.google.com/?cid=4001',
    'google_maps',
    'ChIJ_hotel_central_rafaela',
    95,
    'Hola! Vimos que reciben muchos viajeros corporativos en Rafaela pero no cuentan con motor de reservas directas en su propia web para evitar comisiones de Booking. ¿Les gustaría ver una alternativa ágil?',
    'NEW',
    'Muy buena ubicación céntrica.'
FROM cities c, business_categories cat
WHERE c.name = 'Rafaela' AND cat.name = 'Hotel'
ON CONFLICT (source, external_id) DO NOTHING;
