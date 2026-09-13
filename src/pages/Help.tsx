import React, { useState } from 'react';
import { 
  Terminal, 
  Database, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const Help: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const SNIPPET_GET_CITIES = `import requests

SUPABASE_URL = "${supabaseUrl}"
SUPABASE_KEY = "tu-service-role-key"  # o anon key

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. Obtener todas las provincias
def get_provinces():
    res = requests.get(f"{SUPABASE_URL}/rest/v1/provinces?select=id,name,code&order=name.asc", headers=HEADERS)
    return res.json() if res.status_code == 200 else []

# 2. Obtener todas las ciudades de una provincia específica
def get_cities_by_province(province_id: int):
    url = f"{SUPABASE_URL}/rest/v1/cities?province_id=eq.{province_id}&select=id,name&order=name.asc"
    res = requests.get(url, headers=HEADERS)
    return res.json() if res.status_code == 200 else []

# 3. Buscar el ID exacto de una ciudad por su nombre
def find_city_id(city_name: str) -> int:
    url = f"{SUPABASE_URL}/rest/v1/cities?name=ilike.{city_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    data = res.json() if res.status_code == 200 else []
    if data:
        return data[0]["id"]
    raise ValueError(f"Ciudad '{city_name}' no encontrada en la base oficial.")
`;

  const SNIPPET_SAVE_LEAD = `def save_lead(lead_data: dict) -> bool:
    """
    Guarda el lead en Supabase.
    'resolution=merge-duplicates' asegura que si el bot vuelve a encontrar
    el mismo negocio (mismo source + external_id), lo actualice en vez de duplicar.
    """
    upsert_headers = {
        **HEADERS,
        "Prefer": "resolution=merge-duplicates,return=representation"
    }

    url = f"{SUPABASE_URL}/rest/v1/businesses"
    response = requests.post(url, headers=upsert_headers, json=lead_data)

    if response.status_code in (200, 201):
        print(f"[✓] Lead guardado: {lead_data['name']}")
        return True
    else:
        print(f"[✗] Error {response.status_code}: {response.text}")
        return False
`;

  const SNIPPET_FULL_BOT = `#!/usr/bin/env python3
import requests

# ==============================================================================
# CONFIGURACIÓN
# ==============================================================================
SUPABASE_URL = "${supabaseUrl}"
SUPABASE_KEY = "tu-service-role-key"  # Obtenela en Supabase > Project Settings > API

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ==============================================================================
# 1. CONSULTAR CIUDADES Y PROVINCIAS OFICIALES DESDE SUPABASE
# ==============================================================================
def get_city_id_from_supabase(city_name: str) -> int:
    """
    Obtiene el ID oficial de la ciudad directamente desde Supabase.
    Esto garantiza 100% de consistencia entre lo que scrapea el bot y el panel web.
    """
    url = f"{SUPABASE_URL}/rest/v1/cities?name=ilike.{city_name}&select=id,name,province_id"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]
    raise ValueError(f"La ciudad '{city_name}' no existe en la base de datos de Supabase.")

def get_or_create_category_id(category_name: str) -> int:
    """
    Busca el ID del rubro. Si aún no existe, lo crea automáticamente.
    """
    url = f"{SUPABASE_URL}/rest/v1/business_categories?name=ilike.{category_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]

    # Crear categoría si no existe
    create_res = requests.post(
        f"{SUPABASE_URL}/rest/v1/business_categories",
        headers={**HEADERS, "Prefer": "return=representation"},
        json={"name": category_name}
    )
    if create_res.status_code in (200, 201) and create_res.json():
        return create_res.json()[0]["id"]
    raise RuntimeError(f"No se pudo crear el rubro '{category_name}'")

# ==============================================================================
# 2. GENERADOR DE MENSAJE COMERCIAL
# ==============================================================================
def generate_pitch_message(business_name: str, category: str, city_name: str, has_website: bool) -> str:
    if not has_website:
        return (
            f"Hola, estuve viendo su negocio {business_name} en {city_name} y noté que actualmente "
            f"no cuentan con un sitio web institucional.\\n\\n"
            f"Trabajo desarrollando páginas web y soluciones digitales pensadas específicamente "
            f"para el rubro {category.lower()}, y creo que podríamos ayudarlos a posicionarse "
            f"mejor en Google y captar nuevos clientes en la zona.\\n\\n"
            f"Si les interesa, puedo mostrarles algunas opciones sin ningún compromiso. "
            f"¿Tienen unos minutos para coordinar una breve llamada?"
        )
    else:
        return (
            f"Hola equipo de {business_name}! Noté que cuentan con sitio web pero podemos mejorar su "
            f"velocidad y sumar integración directa de consultas a WhatsApp para aumentar conversiones.\\n\\n"
            f"¿Les gustaría ver una breve propuesta?"
        )

# ==============================================================================
# 3. ENVÍO DE LEADS A SUPABASE CON DEDUPLICACIÓN
# ==============================================================================
def upload_lead(lead_dict: dict) -> bool:
    upsert_headers = {
        **HEADERS,
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    url = f"{SUPABASE_URL}/rest/v1/businesses"
    response = requests.post(url, headers=upsert_headers, json=lead_dict)
    if response.status_code in (200, 201):
        print(f"[✓] Lead subido con éxito: {lead_dict['name']}")
        return True
    else:
        print(f"[✗] Error al subir {lead_dict['name']}: {response.status_code} - {response.text}")
        return False

# ==============================================================================
# 4. FLUJO DE EJECUCIÓN DEL SCRAPER
# ==============================================================================
def main():
    target_city = "Rosario"
    target_category = "Mueblería"

    print(f"[*] Obteniendo IDs de Supabase para {target_city} y {target_category}...")
    city_id = get_city_id_from_supabase(target_city)
    cat_id = get_or_create_category_id(target_category)
    print(f"[+] ID Ciudad: {city_id} | ID Rubro: {cat_id}")

    # Simulación de resultado que tu scraper extrajo de Google Maps
    scraped_business = {
        "city_id": city_id,              # ID oficial de Supabase
        "category_id": cat_id,          # ID oficial del rubro
        "name": "Mueblería San Cayetano",
        "address": "Av. San Martín 1540, Rosario",
        "phone": "+54 341 4558899",
        "whatsapp": "+54 9 341 6112233",
        "instagram": "@muebleriasancayetano",
        "email": "contacto@sancayetanomuebles.com",
        "website": None,
        "has_website": False,
        "source": "google_maps",
        "external_id": "ChIJ_sancayetano_rosario_place_id",  # ID único para deduplicación
        "score": 88,
        "status": "NEW"
    }

    # Generar mensaje personalizado y anexar
    scraped_business["generated_message"] = generate_pitch_message(
        scraped_business["name"],
        target_category,
        target_city,
        scraped_business["has_website"]
    )

    # Subir a la base
    upload_lead(scraped_business)

if __name__ == "__main__":
    main()
`;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ayuda e Integración de Bots
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Guía técnica para conectar tus scripts de scraping en Python a Krevia Leads y Supabase.
        </p>
      </div>

      {/* Concepto Clave: Single Source of Truth */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm text-slate-700">
            <h2 className="font-bold text-blue-900 text-base">
              Principio de Consistencia: Fuente Única de Verdad (Single Source of Truth)
            </h2>
            <p className="leading-relaxed">
              Tu base de datos en Supabase ya tiene cargadas <strong>las 4.269 localidades oficiales de Argentina</strong> con sus respectivos identificadores (<code>id</code>) inmutables.
            </p>
            <div className="bg-white/80 border border-blue-200/80 rounded p-3 text-xs space-y-1 text-slate-800">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cómo trabaja el bot:
              </div>
              <p>
                1. El bot <strong>nunca inventa IDs</strong>. Antes de salir a scrapear o al momento de guardar, le consulta a Supabase: <em>"¿Cuál es el ID de Rosario?"</em> o descarga la lista de ciudades de la provincia que querés trabajar.
              </p>
              <p>
                2. Al guardar cada lead, envía ese <code>city_id</code> exacto.
              </p>
              <p>
                3. De esta forma, garantizás 100% de consistencia: lo que scrapea el bot encaja perfecto en los filtros y mapas de la web.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Endpoint y Credenciales */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            1. Endpoint y Autenticación del Bot
          </h2>
        </div>

        <p className="text-xs text-slate-600">
          Tus scrapers corren en tu PC y se comunican directamente con la API REST de Supabase mediante headers estándar:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="font-semibold text-slate-500 block mb-1">SUPABASE URL:</span>
            <code className="text-slate-800 font-mono text-[11px] break-all">{supabaseUrl}</code>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="font-semibold text-slate-500 block mb-1">KEY RECOMENDADA PARA EL BOT:</span>
            <span className="text-slate-700 font-medium">
              Usar <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">service_role</code> para tener permisos completos de escritura sin restricciones.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Obtener Ciudades desde Supabase */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            2. Paso 1: Consultar Provincias y Ciudades desde Python
          </h2>
          <button
            onClick={() => copyToClipboard(SNIPPET_GET_CITIES, 1)}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
          >
            {copiedIndex === 1 ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar función</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Usá estas funciones para consultar el ID oficial de la localidad antes de empezar a guardar datos:
        </p>

        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200">
          <pre>{SNIPPET_GET_CITIES}</pre>
        </div>
      </div>

      {/* 3. Guardado y Deduplicación */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            3. Paso 2: Guardar Leads con Deduplicación Automática (UPSERT)
          </h2>
          <button
            onClick={() => copyToClipboard(SNIPPET_SAVE_LEAD, 2)}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
          >
            {copiedIndex === 2 ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar función</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-600">
          La base de datos tiene un índice <code>UNIQUE (source, external_id)</code>. Si tu bot le envía el encabezado <code>Prefer: resolution=merge-duplicates</code>, cuando un negocio ya existe se actualiza y no se duplica.
        </p>

        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200">
          <pre>{SNIPPET_SAVE_LEAD}</pre>
        </div>
      </div>

      {/* 4. Script Completo de Ejemplo */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              4. Script Completo de Scraping en Python (Listo para Usar)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubicado también en <code>scripts/bot-example.py</code> en tu repositorio.
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(SNIPPET_FULL_BOT, 3)}
            className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
          >
            {copiedIndex === 3 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Código copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar script completo</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200 max-h-[500px] overflow-y-auto">
          <pre>{SNIPPET_FULL_BOT}</pre>
        </div>
      </div>

      {/* Checklist de Buenas Prácticas */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Recomendaciones al scrapear
        </h2>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
          <li>
            <strong>Guardá el <code>external_id</code>:</strong> Si scrapeás Google Maps, guardá siempre el <code>place_id</code> (ej: <code>ChIJ...</code>). Es lo que impide que un negocio se ingrese dos veces.
          </li>
          <li>
            <strong>Formato de WhatsApp:</strong> Guardá los números en formato internacional sin espacios ni guiones (ejemplo: <code>+5493416213345</code>) para que los botones de WhatsApp de la web funcionen con un solo click.
          </li>
          <li>
            <strong>Estado por defecto:</strong> Enviá siempre <code>status: "NEW"</code> para que aparezcan en el contador de <em>Pendientes</em> del Dashboard listos para ser contactados.
          </li>
        </ul>
      </div>
    </div>
  );
};
