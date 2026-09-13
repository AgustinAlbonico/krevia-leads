#!/usr/bin/env python3
"""
==============================================================================
KREVIA LEADS - BOT DE SCRAPING EN PYTHON (INTEGRACIÓN OFICIAL)
==============================================================================
Este script consume las ciudades y provincias cargadas en Supabase (Fuente Única
de Verdad) para garantizar que los IDs coincidan exactamente con el panel web.

Requisitos mínimos:
    pip install requests
"""

import os
import requests
from typing import Optional, Dict, Any, List

# ==============================================================================
# 1. CONFIGURACIÓN DE CONEXIÓN
# ==============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kkptleilhonswqrjydnj.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "tu-service-role-key-secreta")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ==============================================================================
# 2. CONSULTAR PROVINCIAS Y CIUDADES OFICIALES DESDE SUPABASE
# ==============================================================================

def get_all_provinces() -> List[Dict[str, Any]]:
    """
    Obtiene las 24 provincias oficiales cargadas en Supabase.
    """
    url = f"{SUPABASE_URL}/rest/v1/provinces?select=id,name,code&order=name.asc"
    res = requests.get(url, headers=HEADERS)
    return res.json() if res.status_code == 200 else []


def get_cities_by_province(province_id: int) -> List[Dict[str, Any]]:
    """
    Obtiene todas las ciudades de una provincia dada para que el bot itere sobre ellas.
    """
    url = f"{SUPABASE_URL}/rest/v1/cities?province_id=eq.{province_id}&select=id,name&order=name.asc"
    res = requests.get(url, headers=HEADERS)
    return res.json() if res.status_code == 200 else []


def get_city_id(city_name: str) -> Optional[int]:
    """
    Busca el ID oficial de la ciudad en la base de datos para no inventar IDs.
    Ejemplo: get_city_id("Rosario") -> Devuelve el ID exacto que ve el panel web.
    """
    url = f"{SUPABASE_URL}/rest/v1/cities?name=ilike.{city_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]
    print(f"[!] Ciudad '{city_name}' no encontrada en la base oficial.")
    return None


def get_or_create_category_id(category_name: str) -> Optional[int]:
    """
    Busca o crea dinámicamente un rubro en business_categories.
    """
    url = f"{SUPABASE_URL}/rest/v1/business_categories?name=ilike.{category_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]

    # Si no existe, lo crea
    create_res = requests.post(
        f"{SUPABASE_URL}/rest/v1/business_categories",
        headers={**HEADERS, "Prefer": "return=representation"},
        json={"name": category_name}
    )
    if create_res.status_code in (200, 201) and create_res.json():
        return create_res.json()[0]["id"]

    return None

# ==============================================================================
# 3. GENERADOR DE MENSAJE COMERCIAL PERSONALIZADO
# ==============================================================================

def generate_commercial_message(name: str, category: str, has_website: bool, city: str) -> str:
    """
    Genera el mensaje que luego vas a copiar con 1 click desde Krevia Leads.
    """
    if not has_website:
        return (
            f"Hola, estuve viendo su negocio {name} en {city} y noté que actualmente "
            f"no cuentan con un sitio web institucional.\\n\\n"
            f"Trabajo desarrollando páginas web y soluciones digitales pensadas específicamente "
            f"para el rubro {category.lower()}, y creo que podríamos ayudarlos a posicionarse "
            f"mejor en Google y captar nuevos clientes en la zona.\\n\\n"
            f"Si les interesa, puedo mostrarles algunas opciones y modelos sin ningún tipo de compromiso. "
            f"¿Tienen unos minutos para conversar?"
        )
    else:
        return (
            f"Hola equipo de {name}! Estuve viendo su presencia online en {city}. "
            f"Noté que disponen de un sitio web, pero podemos colaborar en optimizarlo "
            f"para celulares y conectar directamente pedidos y reservas a WhatsApp.\\n\\n"
            f"¿Les interesaría ver una breve propuesta de mejora para su negocio?"
        )

# ==============================================================================
# 4. GUARDADO / UPSERT DE NEGOCIO (CON DEDUPLICACIÓN)
# ==============================================================================

def save_business_lead(lead_data: Dict[str, Any]) -> bool:
    """
    Envía el negocio a Supabase.
    'resolution=merge-duplicates' asegura que si el bot vuelve a encontrar
    el mismo negocio (mismo source + external_id de Google Maps), lo actualiza
    sin duplicarlo.
    """
    upsert_headers = {
        **HEADERS,
        "Prefer": "resolution=merge-duplicates,return=representation"
    }

    url = f"{SUPABASE_URL}/rest/v1/businesses"
    response = requests.post(url, headers=upsert_headers, json=lead_data)

    if response.status_code in (200, 201):
        data = response.json()
        saved_id = data[0]["id"] if data else "OK"
        print(f"[✓] Lead guardado exitosamente (ID: {saved_id}): {lead_data['name']}")
        return True
    else:
        print(f"[✗] Error al guardar {lead_data['name']}: {response.status_code} - {response.text}")
        return False

# ==============================================================================
# 5. EJEMPLO DE FLUJO DE UN BOT
# ==============================================================================

def run_sample_bot():
    print("================================================================")
    print("🤖 KREVIA LEADS - EJECUCIÓN DE BOT DE SCRAPING")
    print("================================================================")

    # 1. Definir objetivo
    target_city_name = "Rosario"
    target_category_name = "Mueblería"

    # 2. Consultar IDs oficiales en Supabase (Fuente Única de Verdad)
    print(f"[*] Consultando Supabase para obtener el ID de '{target_city_name}'...")
    city_id = get_city_id(target_city_name)
    category_id = get_or_create_category_id(target_category_name)

    if not city_id:
        print(f"[!] Error: La ciudad '{target_city_name}' no existe en la base. Abortando.")
        return

    print(f"[✓] ID oficial de {target_city_name}: {city_id}")
    print(f"[✓] ID oficial de {target_category_name}: {category_id}")

    # 3. Datos obtenidos por tu bot desde Google Maps / Redes
    # En tu bot real, acá hacés el scraping con Playwright, BeautifulSoup, Selenium, etc.
    dummy_scraped_lead = {
        "city_id": city_id,              # ID oficial de Supabase
        "category_id": category_id,      # ID oficial de Supabase
        "name": "Mueblería San Cayetano",
        "address": "Av. San Martín 1540, Rosario",
        "phone": "+54 341 4558899",
        "whatsapp": "+54 9 341 6112233",
        "instagram": "@muebleriasancayetano",
        "email": "contacto@sancayetanomuebles.com",
        "website": None,
        "has_website": False,
        "google_maps_url": "https://maps.google.com/?cid=12345",
        "source": "google_maps",
        "external_id": "ChIJ_sancayetano_rosario_place_id",  # Place ID para deduplicación
        "score": 90,
        "status": "NEW"
    }

    # Generar mensaje automático
    dummy_scraped_lead["generated_message"] = generate_commercial_message(
        dummy_scraped_lead["name"],
        target_category_name,
        dummy_scraped_lead["has_website"],
        target_city_name
    )

    # 4. Enviar a Supabase
    save_business_lead(dummy_scraped_lead)

if __name__ == "__main__":
    run_sample_bot()
