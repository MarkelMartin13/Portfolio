"""Actualiza el valor liquidativo (NAV) del fondo modelo y los datos de la web.

Método (estándar de cartera modelo, buy-and-hold entre rebalanceos):
- Inicio: NAV = 100 en la fecha de la primera cartera aprobada.
- En cada rebalanceo (cartera aprobada) se compran participaciones al cierre de ese día:
      participaciones_i = NAV * peso_i / precio_i(USD)        (el efectivo se mantiene a valor constante)
- Cada día: NAV = Σ participaciones_i × precio_i(USD) + efectivo. Los pesos derivan con los precios hasta el
  siguiente rebalanceo, como en una cartera real.
- Precios de cierre AJUSTADOS por dividendos y splits (rentabilidad total). Divisa de medición: USD; las
  acciones en otra divisa se convierten al tipo de cambio de cada día.
- Benchmarks: XSD (principal) y SOXX (secundario), base 100 en la misma fecha.
Precios de mercado: Yahoo Finance vía yfinance (solo precios; ningún dato contable).
"""
from __future__ import annotations

import json
import math
from datetime import date, datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = DOCS = ROOT / "fondo"          # carteras, NAV y datos de la web, todo en /fondo
BENCH = {"XSD": "SPDR S&P Semiconductor ETF (principal)", "SOXX": "iShares Semiconductor ETF (secundario)"}


def cargar_carteras() -> list[dict]:
    cs = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((DATA / "carteras").glob("*.json"))]
    return sorted(cs, key=lambda c: c["fecha"])


def descargar_precios(tickers: list[str], inicio: str) -> pd.DataFrame:
    import yfinance as yf
    df = yf.download(sorted(set(tickers)), start=inicio, auto_adjust=True, progress=False, group_by="column")
    close = df["Close"] if isinstance(df.columns, pd.MultiIndex) else df[["Close"]].rename(columns={"Close": tickers[0]})
    return close.sort_index().ffill()


def fx_series(divisas: set[str], idx, inicio: str, precios_fn=None) -> dict[str, pd.Series]:
    out = {"USD": pd.Series(1.0, index=idx)}
    pares = {d: f"{'GBP' if d in ('GBp', 'GBX') else d}USD=X" for d in divisas if d not in ("USD", None)}
    if pares:
        px = (precios_fn or descargar_precios)(list(pares.values()), inicio).reindex(idx).ffill().bfill()
        for d, par in pares.items():
            s = px[par]
            out[d] = s / 100 if d in ("GBp", "GBX") else s
    return out


def calcular_nav(carteras: list[dict], precios: pd.DataFrame, fx: dict[str, pd.Series]) -> pd.DataFrame:
    divisa = {}
    for c in carteras:
        for p in c["posiciones"]:
            divisa[p["ticker"]] = p.get("divisa") or "USD"
    usd = pd.DataFrame({t: precios[t] * fx.get(divisa.get(t, "USD"), fx["USD"]) for t in divisa if t in precios})
    inicio = pd.Timestamp(carteras[0]["fecha"][:10])
    usd = usd[usd.index >= inicio]
    fechas = sorted({pd.Timestamp(c["fecha"][:10]): c for c in carteras}.items())
    nav, unidades, efectivo, k, filas = 100.0, {}, 0.0, 0, []
    for d, row in usd.iterrows():
        if unidades:
            nav = sum(u * row[t] for t, u in unidades.items() if not math.isnan(row[t])) + efectivo
        while k < len(fechas) and fechas[k][0] <= d:          # rebalanceo al cierre (o siguiente sesión)
            c = fechas[k][1]
            k += 1
            unidades = {p["ticker"]: nav * p["peso"] / row[p["ticker"]] for p in c["posiciones"]
                        if p["ticker"] in row and not math.isnan(row[p["ticker"]]) and p["peso"] > 0}
            efectivo = nav * float(c.get("efectivo", 0.0))
        filas.append({"fecha": d, "nav": nav})
    calcular_nav.estado = {"unidades": unidades, "efectivo": efectivo, "usd": usd.iloc[-1] if len(usd) else None}
    return pd.DataFrame(filas).set_index("fecha")


def posiciones_actuales(carteras: list[dict], precios: pd.DataFrame, nav_final: float) -> list[dict]:
    """Por posición: fecha y precio de entrada (cierre del día en que entró y sigue desde entonces), precio actual,
    P&L de precio desde la entrada (divisa local, ajustado por dividendos), peso objetivo y peso actual tras la deriva."""
    entrada = {}
    for c in carteras:
        d = pd.Timestamp(c["fecha"][:10])
        actuales = {p["ticker"] for p in c["posiciones"] if p["peso"] > 0}
        for t in list(entrada):
            if t not in actuales:
                entrada.pop(t)
        for t in actuales:
            entrada.setdefault(t, d)
    est = getattr(calcular_nav, "estado", {})
    out = []
    for p in carteras[-1]["posiciones"]:
        t = p["ticker"]
        if t not in precios:
            continue
        s = precios[t].dropna()
        d0 = entrada.get(t)
        e = s[s.index >= d0]
        px0, px1 = (float(e.iloc[0]) if len(e) else None), float(s.iloc[-1])
        u = est.get("unidades", {}).get(t)
        usd_px = est.get("usd")[t] if est.get("usd") is not None and t in est.get("usd") else None
        out.append({**p, "fecha_entrada": str(d0.date()) if d0 is not None else None, "precio_entrada": px0,
                    "precio_actual": px1, "pnl": (px1 / px0 - 1) if px0 else None,
                    "peso_actual": (u * usd_px / nav_final) if (u and usd_px and nav_final) else p["peso"]})
    return out


def metricas(serie: pd.Series) -> dict:
    s = serie.dropna()
    if len(s) < 2:
        return {}
    r = s.pct_change().dropna()
    dias = (s.index[-1] - s.index[0]).days or 1
    ytd0 = s[s.index >= pd.Timestamp(f"{s.index[-1].year}-01-01")]
    return {"total": s.iloc[-1] / s.iloc[0] - 1,
            "anualizada": (s.iloc[-1] / s.iloc[0]) ** (365.25 / dias) - 1 if dias >= 365 else None,  # GIPS: no anualizar < 1 año
            "ytd": (ytd0.iloc[-1] / ytd0.iloc[0] - 1) if len(ytd0) > 1 else None,
            "volatilidad": float(r.std() * math.sqrt(252)) if len(r) > 20 else None,
            "max_caida": float((s / s.cummax() - 1).min())}


def main(precios_fn=None, hoy: str | None = None):
    carteras = cargar_carteras()
    if not carteras:
        print("Aún no hay carteras aprobadas.")
        return
    inicio = carteras[0]["fecha"][:10]
    tickers = sorted({p["ticker"] for c in carteras for p in c["posiciones"]})
    fn = precios_fn or descargar_precios
    precios = fn(tickers + list(BENCH), inicio)
    divisas = {p.get("divisa") or "USD" for c in carteras for p in c["posiciones"]}
    fx = fx_series(divisas, precios.index, inicio, fn)
    nav = calcular_nav(carteras, precios, fx)
    for b in BENCH:
        if b in precios:
            s = precios[b].reindex(nav.index).ffill()
            nav[b] = 100 * s / s.dropna().iloc[0]
    nav.round(4).to_csv(DATA / "nav.csv")
    actual = carteras[-1]
    ult = nav.index[-1]
    # pesos actuales tras la deriva desde el último rebalanceo
    data = {
        "actualizado": hoy or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "inicio": inicio,
        "ultimo_cierre": str(ult.date()),
        "benchmarks": BENCH,
        "serie": {"fechas": [str(d.date()) for d in nav.index], "fondo": nav["nav"].round(3).tolist(),
                  **{b: nav[b].round(3).tolist() for b in BENCH if b in nav}},
        "metricas": {"Fondo": metricas(nav["nav"]), **{b: metricas(nav[b]) for b in BENCH if b in nav}},
        "cartera_actual": {**actual, "posiciones": posiciones_actuales(carteras, precios, float(nav["nav"].iloc[-1]))},
        "rebalanceos": [{"fecha": c["fecha"], "metodo": c.get("metodo"), "n": len(c["posiciones"]),
                         "operaciones": c.get("operaciones", []), "nota": c.get("nota", "")} for c in reversed(carteras)],
    }
    (DOCS / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    print(f"NAV {nav['nav'].iloc[-1]:.2f} a {ult.date()} · {len(carteras)} carteras · {len(nav)} sesiones")


if __name__ == "__main__":
    main()
