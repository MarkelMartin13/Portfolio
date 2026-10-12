// ============================================================
// MODEL FUND — Semiconductors (datos: fondo/data.json, actualizado a diario por GitHub Actions)
// ============================================================
(function () {
  const PALETTE = ["#1c765d", "#315f7b", "#b18a4d", "#8b667a", "#6b7280", "#4b5563", "#9ca3af", "#374151",
                   "#78716f", "#57534e", "#2f6f5f", "#7a8b99", "#a07c5b", "#5d7a8c", "#86948f"];
  const pct = (x, d = 1) => (x === null || x === undefined) ? "—" : `${(x * 100).toFixed(d)}%`;
  const sgn = (x, d = 1) => (x === null || x === undefined) ? "—" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(d)}%`;
  const cls = x => (x === null || x === undefined) ? "" : (x >= 0 ? "positive" : "negative");
  const num = (x, d = 2) => (x === null || x === undefined) ? "—" : x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const $ = id => document.getElementById(id);
  const repo = (() => {
    const o = location.hostname.split(".")[0], r = location.pathname.split("/")[1];
    return location.hostname.endsWith("github.io") && r ? `https://github.com/${o}/${r}` : null;
  })();

  fetch("fondo/data.json?" + Date.now()).then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => {
    const c = d.cartera_actual, s = d.serie, m = d.metricas || {}, f = m.Fondo || {}, x = m.XSD || {};
    $("fundMeta").textContent = `Inception ${d.inicio} · Last close ${d.ultimo_cierre} · Updated ${d.actualizado}`;

    // KPIs
    const nav = s.fondo[s.fondo.length - 1];
    const rel = (f.total !== undefined && x.total !== undefined) ? f.total - x.total : null;
    $("fundKpis").innerHTML = [["NAV (base 100)", num(nav)], ["Since inception", sgn(f.total)], ["YTD", sgn(f.ytd)],
      ["vs XSD", sgn(rel)]].map(([l, v]) => `<div class="fund-kpi"><small>${l}</small><strong>${v}</strong></div>`).join("");

    // Donut de asignación (pesos actuales tras la deriva) + efectivo
    const pos = [...c.posiciones].sort((a, b) => (b.peso_actual ?? b.peso) - (a.peso_actual ?? a.peso));
    const assets = pos.map((p, i) => ({ name: p.ticker, value: 100 * (p.peso_actual ?? p.peso), color: PALETTE[i % PALETTE.length] }));
    const invested = assets.reduce((a, b) => a + b.value, 0);
    if (100 - invested > 0.05) assets.push({ name: "Cash", value: 100 - invested, color: "#d8d0c3" });
    let start = 0;
    $("fundChart").style.background = `conic-gradient(${assets.map(a => { const e = start + a.value; const seg = `${a.color} ${start}% ${e}%`; start = e; return seg; }).join(", ")})`;
    $("fundTotal").textContent = `${pos.length}`;
    $("fundLegend").innerHTML = assets.map(a => `<div class="legend-item"><span class="legend-dot" style="background:${a.color}"></span>
      <span>${a.name}</span><span class="legend-value">${a.value.toFixed(1)}%</span></div>`).join("");

    // Gráfico frente a los benchmarks
    if (window.Chart) {
      const ds = [{ label: "Model Fund", data: s.fondo, borderColor: "#1b765e", borderWidth: 2.2 }];
      if (s.XSD) ds.push({ label: "XSD", data: s.XSD, borderColor: "#315f7b", borderWidth: 1.5 });
      if (s.SOXX) ds.push({ label: "SOXX", data: s.SOXX, borderColor: "#b18a4d", borderWidth: 1.5, borderDash: [5, 4] });
      new Chart($("fundPerf"), { type: "line", data: { labels: s.fechas, datasets: ds.map(z => ({ ...z, pointRadius: 0, tension: .12 })) },
        options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { boxWidth: 12, font: { family: "DM Sans" }, color: "#38454c" } } },
          scales: { x: { ticks: { maxTicksLimit: 8, color: "#61707a" }, grid: { display: false } },
                    y: { ticks: { color: "#61707a" }, grid: { color: "rgba(23,33,43,.06)" } } } } });
    }

    // Métricas
    $("fundMetrics").innerHTML = `<tr><th></th><th>Since inception</th><th>YTD</th><th>Annualised</th><th>Volatility</th><th>Max drawdown</th></tr>` +
      Object.entries(m).map(([n, v]) => `<tr><td><strong>${n === "Fondo" ? "Model Fund" : n}</strong></td>
        <td class="${cls(v.total)}">${sgn(v.total)}</td><td class="${cls(v.ytd)}">${sgn(v.ytd)}</td><td>${sgn(v.anualizada)}</td>
        <td>${pct(v.volatilidad)}</td><td class="negative">${pct(v.max_caida)}</td></tr>`).join("");

    // Posiciones
    $("fundPositions").innerHTML = pos.map(p => `<tr><td><strong>${p.ticker}</strong></td><td>${p.nombre || ""}</td><td>${p.pais || ""}</td>
      <td>${pct(p.peso)}</td><td>${pct(p.peso_actual)}</td><td>${p.fecha_entrada || ""}</td>
      <td>${num(p.precio_entrada)}</td><td>${num(p.precio_actual)}</td><td class="${cls(p.pnl)}">${sgn(p.pnl, 2)}</td></tr>`).join("");
    $("fundPositionsMeta").textContent = `Last rebalance: ${c.fecha} · method: ${c.metodo || "—"}` + (c.efectivo ? ` · cash target ${pct(c.efectivo)}` : "");

    // Historial de rebalanceos
    $("fundHistory").innerHTML = d.rebalanceos.map(r => {
      const ops = (r.operaciones || []).filter(o => Math.abs(o.cambio) > 1e-6);
      const t = ops.length ? `<table class="portfolio-table"><thead><tr><th>Position</th><th>Before</th><th>After</th><th>Change</th></tr></thead><tbody>` +
        ops.map(o => `<tr><td><strong>${o.ticker}</strong></td><td>${pct(o.antes)}</td><td>${pct(o.despues)}</td><td class="${cls(o.cambio)}">${sgn(o.cambio)}</td></tr>`).join("") +
        `</tbody></table>` : `<p class="portfolio-source">Initial portfolio.</p>`;
      return `<details class="fund-rebal"><summary><strong>${r.fecha}</strong> · ${r.metodo || ""} · ${r.n} positions</summary>
        ${r.nota ? `<p class="portfolio-source">${r.nota}</p>` : ""}<div style="overflow-x:auto">${t}</div></details>`;
    }).join("");
    if (repo) $("fundVerify").innerHTML = `Every rebalance is recorded with a timestamp in the public repository: <a href="${repo}/commits/main/fondo/carteras" target="_blank" rel="noopener">view the audit trail →</a>`;
  }).catch(() => {
    const el = $("fundMeta");
    if (el) el.textContent = "The model fund will appear here once the first portfolio is recorded.";
  });
})();
