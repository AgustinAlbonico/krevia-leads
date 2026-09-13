# Krevia Leads 🚀

Panel web interno, simple y ágil para almacenar, visualizar, filtrar y gestionar negocios encontrados automáticamente por bots de scraping.

---

## 🧭 Arquitectura del Sistema

```text
Bots locales (Python / Node en tu PC)
            ↓ (REST API de Supabase)
     Base de Datos PostgreSQL (Supabase)
            ↑
  Frontend React + Vite + TypeScript (Cloudflare Pages)
```

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Base de Datos:** Supabase (PostgreSQL) con vistas agregadas e índices de deduplicación.
- **Hosting:** Cloudflare Pages (SPA estática).

---

## 🗄️ 1. Configuración de Base de Datos en Supabase

1. Creá un proyecto nuevo en [Supabase](https://supabase.com).
2. Entrá en el **SQL Editor** de tu proyecto Supabase.
3. Copiá y ejecutá el contenido del archivo `supabase/schema.sql`:
   - Crea las tablas `provinces`, `cities`, `business_categories` y `businesses`.
   - Crea índices optimizados y la restricción `UNIQUE (source, external_id)` para deduplicación.
   - Crea el trigger automático de `updated_at`.
   - Crea la vista `view_cities_with_stats` para consultas de conteo ultra rápidas.
   - Configura las políticas de seguridad (Row Level Security).
4. (Opcional) Ejecutá `supabase/seed.sql` para cargar las 24 provincias de Argentina, ciudades principales de Santa Fe, Córdoba, Buenos Aires, Mendoza y Entre Ríos, rubros y negocios de prueba.

---

## ⚙️ 2. Variables de Entorno

Creá un archivo `.env` en la raíz del proyecto basándote en `env.example`:

```bash
# Variables públicas para el frontend (Vite)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key

# Variables para scripts locales (importación o bots)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta
```

> **Nota sobre el Modo Demo:** Si ejecutás la aplicación sin configurar las variables de Supabase, la app inicia automáticamente en **Modo Demo** con datos locales interactivos en memoria/localStorage para que puedas probar el panel de inmediato.

---

## 💻 3. Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador la URL indicada (usualmente `http://localhost:5173`).

---

## 🏙️ 4. Importación de Ciudades desde CSV

Podés importar miles de ciudades de Argentina directamente a Supabase sin cargarlas a mano:

1. Tené a mano tu archivo CSV con el formato `province,city,population`.
   Ejemplo en `data/cities-sample.csv`:
   ```csv
   province,city,population
   Santa Fe,Rosario,1029000
   Santa Fe,Rafaela,109000
   Córdoba,Villa María,90000
   ```

2. Ejecutá el script de importación:
   ```bash
   # Importar el archivo por defecto (data/cities-sample.csv)
   npm run import:cities

   # O importar un archivo específico
   npx tsx scripts/import-cities.ts ruta/a/tu/archivo.csv
   ```

El script creará automáticamente las provincias que falten y cargará las ciudades por lotes asegurando no generar duplicados.

---

## 🤖 5. Conexión de los Bots de Scraping (Python)

Tus bots corren localmente en tu PC y envían los negocios directamente a Supabase mediante su API REST o la librería `supabase-py`.

### Ejemplo con `requests` (sin librerías pesadas):

Encontrás un ejemplo funcional y completo en `scripts/bot-example.py`.

```python
import requests

SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-service-role-key"  # o anon key

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    # Importante: merge-duplicates para deduplicar automáticamente por source + external_id
    "Prefer": "resolution=merge-duplicates,return=representation"
}

lead = {
    "city_id": 1,                       # ID de la ciudad en la tabla cities
    "category_id": 1,                   # ID del rubro en business_categories
    "name": "Muebles López",
    "address": "Av. Pellegrini 1420, Rosario",
    "phone": "+543414578932",
    "whatsapp": "+5493416213345",
    "instagram": "@muebleslopez",
    "website": None,
    "has_website": False,
    "source": "google_maps",
    "external_id": "ChIJ_muebles_lopez_rosario", # Place ID de Google Maps
    "score": 85,
    "generated_message": "Hola, estuve viendo su negocio y noté que no tienen sitio web...",
    "status": "NEW"
}

res = requests.post(f"{SUPABASE_URL}/rest/v1/businesses", headers=headers, json=lead)
print(res.status_code, res.json())
```

### Deduplicación garantizada
La base de datos cuenta con un índice único:
```sql
CREATE UNIQUE INDEX idx_businesses_source_external_id 
    ON businesses (source, external_id) 
    WHERE external_id IS NOT NULL;
```
Esto asegura que si el bot vuelve a pasar por el mismo negocio (mismo Google Maps Place ID u origen), el registro se actualiza y no se duplica.

---

## ☁️ 6. Despliegue en Cloudflare Pages

1. Subí este repositorio a tu cuenta de **GitHub** o **GitLab**.
2. En el panel de **Cloudflare**, andá a **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Seleccioná el repositorio `krevia_leads`.
4. Configurá el build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. En la sección **Environment variables**, agregá:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave pública `anon` de Supabase.
6. Hacé click en **Save and Deploy**.

> **Soporte SPA:** El proyecto incluye el archivo `public/_redirects` (`/* /index.html 200`), garantizando que al navegar directamente o refrescar rutas como `/cities/1` o `/businesses/5` no se produzcan errores 404 en Cloudflare Pages.

---

## 🎯 Estructura del Código

```text
src/
├── components/
│   ├── Layout.tsx          # Estructura general con Sidebar y Header
│   ├── Sidebar.tsx         # Navegación limpia lateral
│   ├── Header.tsx          # Barra superior con búsqueda global rápida
│   ├── StatCard.tsx        # Tarjetas numéricas de resumen
│   ├── StatusBadge.tsx     # Badges de estado coloreados
│   └── CopyButton.tsx      # Botón de copiado con feedback visual
├── pages/
│   ├── Dashboard.tsx       # Métricas generales, top ciudades y últimos leads
│   ├── Cities.tsx          # Listado de ciudades, conteos, orden DESC y filtros
│   ├── CityDetail.tsx      # Métricas de ciudad, desglose de rubros y tabla interna
│   ├── Businesses.tsx      # Listado global, filtros combinables y cascada provincia->ciudad
│   └── BusinessDetail.tsx  # Ficha técnica, WhatsApp directo, edición de estado y notas
├── services/
│   ├── supabase.ts         # Cliente y validación de conexión Supabase
│   ├── mockData.ts         # Dataset de prueba argentino para modo demo
│   └── api.ts              # Capa de datos unificada (Supabase o Fallback)
└── types/
    └── index.ts            # Tipos de TypeScript del modelo de negocio
```
