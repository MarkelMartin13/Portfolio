"""Añade la sección 'Model Fund' a tu web sin tocar el resto. Ejecútalo dentro de la carpeta del repositorio Portfolio:
    python3 instalar_fondo.py
Se puede ejecutar varias veces: no duplica nada."""
from pathlib import Path

idx = Path("index.html")
s = idx.read_text(encoding="utf-8")
seccion = Path("seccion_fondo.html").read_text(encoding="utf-8")
cambios = []
if 'href="#fund"' not in s:
    s = s.replace('<a href="#ideas">Investment Ideas</a>', '<a href="#ideas">Investment Ideas</a>\n      <a href="#fund">Model Fund</a>', 1)
    cambios.append("enlace 'Model Fund' en el menú")
if 'id="fund"' not in s:
    marca = '<section class="portfolio-section" id="portfolio">'
    if marca not in s:
        raise SystemExit("No encuentro la sección de cartera actual en index.html; no he cambiado nada.")
    s = s.replace(marca, seccion + "  " + marca, 1)
    cambios.append("sección del fondo debajo de Investment Ideas")
if "fondo.js" not in s:
    s = s.replace('<script src="script.js"></script>',
                  '<script src="script.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n'
                  '<script src="fondo.js"></script>', 1)
    cambios.append("scripts del fondo")
idx.write_text(s, encoding="utf-8")
print("Hecho:", ", ".join(cambios) if cambios else "ya estaba instalado (sin cambios).")
