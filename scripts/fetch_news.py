#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# ---- Configuración ----
SITE = "https://www.epicentrochile.com"
TAG_SLUG = "vina2026"
OUT_FILE = "assets/data/noticias.json"
LIMIT = 10
TIMEOUT = 30

# ---- Utilidades ----
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def ensure_out_dir():
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)

def strip_html(text: str) -> str:
    if not text: return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = (text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"')
            .replace("&#039;", "'").replace("&lt;", "<").replace("&gt;", ">"))
    return re.sub(r"\s+", " ", text).strip()

def http_get(url: str, is_json=True):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json" if is_json else "text/html"
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=TIMEOUT) as r:
        raw = r.read().decode("utf-8", errors="ignore")
        return json.loads(raw) if is_json else raw

# ---- Lógica de Extracción ----
def fetch_from_wp_api():
    print(f"Buscando tag ID para: {TAG_SLUG}...")
    tags_url = f"{SITE}/wp-json/wp/v2/tags?slug={TAG_SLUG}"
    tags = http_get(tags_url)
    
    if not tags or not isinstance(tags, list):
        # Intento 2: Buscar por texto si el slug no coincide exacto
        tags_url = f"{SITE}/wp-json/wp/v2/tags?search={TAG_SLUG}"
        tags = http_get(tags_url)

    if not tags:
        raise RuntimeError("No se encontró el tag en la API.")

    tag_id = tags[0]['id']
    print(f"ID encontrado: {tag_id}. Trayendo posts...")
    
    # Traemos los posts filtrados por ese ID
    posts_url = f"{SITE}/wp-json/wp/v2/posts?tags={tag_id}&per_page={LIMIT}&_fields=link,date,title,excerpt"
    posts = http_get(posts_url)
    
    items = []
    for p in posts:
        items.append({
            "title": strip_html(p['title']['rendered']),
            "url": p['link'],
            "date": p['date'],
            "excerpt": strip_html(p['excerpt']['rendered'])[:160] + "..."
        })
    return items

def fetch_from_html_fallback():
    """Si la API falla, extrae los datos directamente del HTML de la web"""
    print("API falló o vacía. Iniciando scraping de emergencia...")
    url = f"{SITE}/tag/{TAG_SLUG}/"
    html = http_get(url, is_json=False)
    
    # Regex para capturar títulos y links en el formato de El Epicentro
    # Busca patrones tipo <h2...><a href="URL">TITULO</a></h2>
    pattern = r'<h[23][^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>'
    matches = re.finditer(pattern, html, re.I | re.S)
    
    items = []
    for m in matches:
        link = m.group(1)
        title = strip_html(m.group(2))
        if SITE in link and len(title) > 10:
            items.append({
                "title": title,
                "url": link,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "excerpt": "Haz clic para ver más detalles en El Epicentro."
            })
        if len(items) >= LIMIT: break
    return items

def main():
    ensure_out_dir()
    final_items = []
    mode = "wp-api"

    try:
        final_items = fetch_from_wp_api()
        if not final_items:
            raise ValueError("API respondió pero sin noticias.")
    except Exception as e:
        print(f"Error en API: {e}")
        try:
            final_items = fetch_from_html_fallback()
            mode = "html-fallback"
        except Exception as e2:
            print(f"Error fatal en fallback: {e2}")
            mode = "error"

    payload = {
        "source": f"{SITE}/tag/{TAG_SLUG}/",
        "mode": mode,
        "generated_at": now_iso(),
        "items": final_items
    }

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    
    print(f"Éxito: {len(final_items)} noticias guardadas en {OUT_FILE} (Modo: {mode})")

if __name__ == "__main__":
    main()
