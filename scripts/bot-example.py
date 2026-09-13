#!/usr/bin/env python3
"""
==============================================================================
KREVIA LEADS - BOT DE SCRAPING EN PYTHON (EJEMPLO DE INTEGRACIÓN)
==============================================================================
Este script muestra cómo tus bots de scraping locales (ej. Google Maps, Instagram,
directorios web) deben enviar los leads encontrados directamente a Supabase
sin necesidad de un servidor intermedio.

Requisitos mínimos:
    pip install requests
"""

import os
import re
import json
import requests
from typing import Optional, Dict, Any

# ==============================================================================
# 1. CONFIGURACIÓN DE SUPABASE
# ==============================================================================
# Podés definir estas variables en tu entorno o pasarlas directamente.
# Se recomienda usar la SUPABASE_SERVICE_ROLE_KEY para que el bot tenga
# permisos completos de INSERT/UPSERT sin restricciones.

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tu-proyecto.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "tu-service-role-key-secreta")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ==============================================================================
# 2. FUNCIONES AUXILIARES DE SUPABASE
# ==============================================================================

def get_or_create_city_id(city_name: str, province_name: str = "Santa Fe") -> Optional[int]:
    """
    Busca el ID de una ciudad por nombre. Si no existe, la crea vinculada a la provincia.
    """
    url = f"{SUPABASE_URL}/rest/v1/cities?name=ilike.{city_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]

    # Si no existe, buscar provincia
    prov_res = requests.get(f"{SUPABASE_URL}/rest/v1/provinces?name=ilike.{province_name}&select=id", headers=HEADERS)
    if prov_res.status_code == 200 and prov_res.json():
        prov_id = prov_res.json()[0]["id"]
        # Crear ciudad
        create_res = requests.post(
            f"{SUPABASE_URL}/rest/v1/cities",
            headers=HEADERS,
            json={"name": city_name, "province_id": prov_id}
        )
        if create_res.status_code in (200, 201) and create_res.json():
            return create_res.json()[0]["id"]

    print(f"[!] No se pudo resolver o crear la ciudad: {city_name}")
    return None


def get_or_create_category_id(category_name: str) -> Optional[int]:
    """
    Busca o crea dinámicamente un rubro en business_categories.
    """
    url = f"{SUPABASE_URL}/rest/v1/business_categories?name=ilike.{category_name}&select=id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return res.json()[0]["id"]

    # Crear categoría si no existe
    create_res = requests.post(
        f"{SUPABASE_URL}/rest/v1/business_categories",
        headers=HEADERS,
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
    Genera automáticamente el mensaje persuasivo que vas a copiar desde el panel web.
    """
    if not has_website:
        return (
            f"Hola, estuve viendo su negocio {name} en {city} y noté que actualmente "
            f"no cuentan con un sitio web institucional.\n\n"
            f"Trabajo desarrollando páginas web y soluciones digitales pensadas específicamente "
            f"para el rubro {category.lower()}, y creo que podríamos ayudarlos a posicionarse "
            f"mejor en Google y captar nuevos clientes en la zona.\n\n"
            f"Si les interesa, puedo mostrarles algunas opciones y modelos sin ningún tipo de compromiso. "
            f"¿Tienen unos minutos para conversar?"
        )
    else:
        return (
            f"Hola equipo de {name}! Estuve viendo su presencia online en {city}. "
            f"Noté que disponen de un sitio web, pero podemos colaborar en optimizarlo "
            f"para celulares y conectar directamente pedidos y reservas a WhatsApp.\n\n"
            f"¿Les interesaría ver una breve propuesta de mejora para su negocio?"
        )

# ==============================================================================
# 4. GUARDADO / UPSERT DE NEGOCIO (CON DEDUPLICACIÓN)
# ==============================================================================

def save_business_lead(lead_data: Dict[str, Any]) -> bool:
    """
    Envía el negocio a Supabase.
    Si source + external_id ya existe, actualiza el registro (UPSERT)
    evitando duplicar negocios repetidos.
    """
    # Usamos merge-duplicates para que respete el índice UNIQUE (source, external_id)
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
# 5. EJECUCIÓN DEL FLUJO DE SCRAPING DE EJEMPLO
# ==============================================================================

def run_sample_bot():
    print("================================================================")
    print("🤖 KREVIA LEADS - SIMULACIÓN DE BOT DE SCRAPING")
    print("================================================================")

    # 1. Parámetros de búsqueda del bot
    target_city = "Rosario"
    target_province = "Santa Fe"
    target_category = "Mueblería"

    print(f"[*] Buscando negocios en: {target_city} ({target_province}) - Rubro: {target_category}...")

    # 2. Obtener IDs relacionados en la base de datos
    city_id = get_or_create_city_id(target_city, target_province)
    category_id = get_or_create_category_id(target_category)

    if not city_id:
        print("[!] No se puede continuar sin el ID de ciudad.")
        return

    # 3. Datos simulados extraídos por el bot (ej. de Google Maps API o Scraper Playwright)
    scraped_leads = [
        {
            "name": "Fábrica de Sillas del Litoral",
            "address": "San Juan 2540, Rosario",
            "phone": "+54 341 4258900",
            "whatsapp": "+54 9 341 6889911",
            "email": "ventas@sillaslitoral.com.ar",
            "instagram": "@sillaslitoral.ros",
            "website": None,  # No tiene web
            "google_maps_url": "https://maps.google.com/?cid=9901",
            "source": "google_maps",
            "external_id": "ChIJ_sillas_litoral_rosario_001",
            "score": 90
        },
        {
            "name": "Amoblamientos del Centro",
            "address": "Mitre 850, Rosario",
            "phone": "+54 341 4112233",
            "whatsapp": "+54 9 341 5443322",
            "email": None,
            "instagram": "@amoblamientos.centro",
            "website": "https://amoblamientoscentro.com.ar",  # Sí tiene web
            "google_maps_url": "https://maps.google.com/?cid=9902",
            "source": "google_maps",
            "external_id": "ChIJ_amoblamientos_centro_rosario_002",
            "score": 55
        }
    ]

    # 4. Procesar y enviar cada lead
    for item in scraped_leads:
        has_web = bool(item.get("website"))
        
        # Generar mensaje comercial adaptado
        msg = generate_commercial_message(
            name=item["name"],
            category=target_category,
            has_website=has_web,
            city=target_city
        )

        lead_payload = {
            "city_id": city_id,
            "category_id": category_id,
            "name": item["name"],
            "address": item.get("address"),
            "phone": item.get("phone"),
            "whatsapp": item.get("whatsapp"),
            "email": item.get("email"),
            "instagram": item.get("instagram"),
            "website": item.get("website"),
            "has_website": has_web,
            "google_maps_url": item.get("google_maps_url"),
            "source": item.get("source", "google_maps"),
            "external_id": item.get("external_id"),
            "score": item.get("score"),
            "generated_message": msg,
            "status": "NEW"
        }

        save_business_lead(lead_payload)

    print("\n[✓] Simulación finalizada. Ya podés ver los nuevos leads en Krevia Leads.")

if __name__ == "__main__":
    run_sample_bot()
