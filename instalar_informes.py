"""Añade o actualiza Lam Research, Aixtron y SUSS MicroTec en 'Investment Ideas'. Ejecutar dentro de la carpeta Portfolio."""
import re
from pathlib import Path
def card(href, logo, cls, name, tkr, tag, rating, tp, up):
    return f"""        <a class="idea-card idea-card-link" href="{href}">
          <div class="card-top"><div class="company"><div class="round-logo {cls}">{logo}</div><div><h3>{name}</h3><small>{tkr}</small></div></div><span class="pill">Company Analysis</span></div>
          <p>{tag}</p>
          <div class="metrics"><div><small>Rating</small><strong>{rating}</strong></div><div class="vline"></div><div><small>Target Price</small><strong>{tp}</strong></div><div><small>Upside</small><strong class="green">{up}</strong></div><b class="arrow">→</b></div>
        </a>
"""
nuevas = (card("lam-research.html", "LRCX", "lrcx", "Lam Research", "LRCX", "Selling the tools for the AI build-out", "BUY", "$385", "~45.9%")
          + card("suss-microtec.html", "SMHN", "smhn", "SUSS MicroTec", "SMHN", "The backlog is back: wafer preparation for AI packaging", "BUY", "€84.9", "~50.6%")
          + card("aixtron.html", "AIXA", "aixa", "Aixtron", "AIXA", "Building before connecting: from the optical cycle to the power cycle", "BUY", "€46.0", "~39.9%"))
idx = Path("index.html"); s = idx.read_text(encoding="utf-8")
for href in ("lam-research.html", "aixtron.html", "suss-microtec.html"):          # quitar versiones anteriores
    s = re.sub(r'\s*<a class="idea-card idea-card-link" href="' + re.escape(href) + r'">.*?</a>\n', "\n", s, flags=re.S)
marca = '      <div class="cards">\n'
if marca not in s:
    raise SystemExit("No encuentro la sección de tarjetas; no he cambiado nada.")
s = s.replace(marca, marca + nuevas, 1)
idx.write_text(s, encoding="utf-8")
css = Path("style.css"); c = css.read_text(encoding="utf-8")
extra = ""
if ".round-logo.lrcx" not in c:
    extra += ".round-logo.lrcx{background:#2a4a6b;color:#fff;font-size:16px;font-weight:800}.round-logo.aixa{background:#8a6a3b;color:#fff;font-size:16px;font-weight:800}"
if ".round-logo.smhn" not in c:
    extra += ".round-logo.smhn{background:#5b6b4a;color:#fff;font-size:16px;font-weight:800}"
if extra:
    css.write_text(c + "\n" + extra + "\n", encoding="utf-8")
print("Hecho: tarjetas de Lam Research, SUSS MicroTec y Aixtron actualizadas.")
