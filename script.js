// ============================================================
// CONFIGURATION: EDIT THESE VALUES WITH YOUR REAL PORTFOLIO
// ============================================================
const portfolioAssets = [
  { name: "Equities", value: 65, color: "#1c765d" },
  { name: "Fixed Income", value: 15, color: "#315f7b" },
  { name: "Cash", value: 10, color: "#b18a4d" },
  { name: "Alternatives", value: 10, color: "#8b667a" }
];

// PUT YOUR REAL LINKEDIN URL HERE ONCE.
// Example: https://www.linkedin.com/in/your-name/
const LINKEDIN_URL = "https://www.linkedin.com/in/markel-mart%C3%ADn-vaquero/";

document.querySelectorAll(".linkedin-link").forEach(link => {
  link.href = LINKEDIN_URL;
});

// Build the portfolio donut dynamically
const chart = document.getElementById("portfolioChart");
const legend = document.getElementById("portfolioLegend");
const total = portfolioAssets.reduce((sum, asset) => sum + asset.value, 0);

let start = 0;
const stops = portfolioAssets.map(asset => {
  const end = start + (asset.value / total) * 100;
  const segment = `${asset.color} ${start}% ${end}%`;
  start = end;
  return segment;
});

chart.style.background = `conic-gradient(${stops.join(", ")})`;
document.getElementById("portfolioTotal").textContent = `${total}%`;

legend.innerHTML = portfolioAssets.map(asset => `
  <div class="legend-item">
    <span class="legend-dot" style="background:${asset.color}"></span>
    <span>${asset.name}</span>
    <span class="legend-value">${asset.value}%</span>
  </div>
`).join("");

// Navigation active state
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-links a").forEach(x => x.classList.remove("active"));
    link.classList.add("active");
  });
});
