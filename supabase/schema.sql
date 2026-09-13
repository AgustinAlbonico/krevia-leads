-- ==============================================================================
-- KREVIA LEADS - ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- 1. TABLA: Provincias
CREATE TABLE IF NOT EXISTS provinces (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: Ciudades / Localidades
CREATE TABLE IF NOT EXISTS cities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    province_id BIGINT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    population INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_province_city_name UNIQUE (province_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cities_province_id ON cities(province_id);
CREATE INDEX IF NOT EXISTS idx_cities_lower_name ON cities(lower(name));

-- 3. TABLA: Rubros / Categorías de negocio
CREATE TABLE IF NOT EXISTS business_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: Negocios (Leads)
CREATE TABLE IF NOT EXISTS businesses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES business_categories(id) ON DELETE SET NULL,
    
    -- Información básica
    name TEXT NOT NULL,
    address TEXT,
    
    -- Contacto
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    instagram TEXT,
    
    -- Web & presencia digital
    website TEXT,
    has_website BOOLEAN NOT NULL DEFAULT FALSE,
    google_maps_url TEXT,
    
    -- Origen y deduplicación
    source TEXT NOT NULL DEFAULT 'google_maps',
    external_id TEXT, -- ID provisto por la fuente (ej. Place ID de Google Maps)
    source_url TEXT,
    
    -- Calificación y contenido generado
    score INTEGER, -- 0 a 100
    generated_message TEXT,
    
    -- Gestión de estado y notas
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'CONTACTED', 'INTERESTED', 'REJECTED', 'CLIENT', 'DISCARDED')
    ),
    notes TEXT,
    
    -- Marcas temporales
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ÍNDICES DE RENDIMIENTO Y DEDUPLICACIÓN
-- Evita duplicados cuando el bot envía el mismo external_id para la misma fuente
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_source_external_id 
    ON businesses (source, external_id) 
    WHERE external_id IS NOT NULL;

-- Búsquedas y filtros comunes
CREATE INDEX IF NOT EXISTS idx_businesses_city_id ON businesses(city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_has_website ON businesses(has_website);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_name_lower ON businesses(lower(name));

-- 6. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_businesses_updated_at ON businesses;
CREATE TRIGGER tr_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 7. VISTA OPTIMIZADA: Ciudades con estadísticas
CREATE OR REPLACE VIEW view_cities_with_stats AS
SELECT
    c.id,
    c.province_id,
    c.name,
    p.name AS province_name,
    p.code AS province_code,
    c.population,
    COUNT(b.id)::INTEGER AS business_count,
    MAX(b.created_at) AS last_scraped_at
FROM cities c
JOIN provinces p ON p.id = c.province_id
LEFT JOIN businesses b ON b.city_id = c.id
GROUP BY c.id, c.province_id, c.name, p.name, p.code, c.population;

-- 8. POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
-- Herramienta interna: lectura y actualización pública mediante anon key, y acceso total con service_role.
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Provinces
CREATE POLICY "Allow public read on provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow admin all on provinces" ON provinces FOR ALL TO service_role USING (true);

-- Cities
CREATE POLICY "Allow public read on cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow admin all on cities" ON cities FOR ALL TO service_role USING (true);

-- Categories
CREATE POLICY "Allow public read on categories" ON business_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on categories" ON business_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin all on categories" ON business_categories FOR ALL TO service_role USING (true);

-- Businesses
CREATE POLICY "Allow public read on businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on businesses" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on businesses" ON businesses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin all on businesses" ON businesses FOR ALL TO service_role USING (true);
