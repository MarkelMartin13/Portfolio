// ============================================================
// MARKEL MARTIN — INVESTMENT RESEARCH
// PORTFOLIO
// Reference capital: $100,000
// Source: Darwinex Zero — DARWIN OZNQ
// P&L = price return since entry, before financing and fees
// ============================================================


// ------------------------------------------------------------
// PORTFOLIO ALLOCATION
// ------------------------------------------------------------

const portfolioAssets = [
  { name: "XTI/USD", value: 22.09, color: "#1c765d" },
  { name: "USD/JPY", value: 6.67, color: "#315f7b" },
  { name: "SNPS", value: 5.09, color: "#b18a4d" },
  { name: "MU", value: 4.97, color: "#8b667a" },
  { name: "INTC", value: 5.07, color: "#6b7280" },
  { name: "Nasdaq", value: 7.29, color: "#4b5563" },
  { name: "Nikkei", value: 6.13, color: "#9ca3af" },
  { name: "EWY", value: 8.09, color: "#374151" },
  { name: "IYR", value: 5.01, color: "#78716f" },
  { name: "XLU", value: 10.16, color: "#57534e" },
  { name: "Cash", value: 20.00, color: "#b18a4d" }
];


// ------------------------------------------------------------
// CURRENT POSITIONS
// ------------------------------------------------------------

const portfolioPositions = [
  {
    ticker: "XTI/USD",
    side: "Short",
    entry: 89.10,
    current: 90.63,
    entryDate: "02/09/2026",
    weight: 22.09
  },
  {
    ticker: "USD/JPY",
    side: "Short",
    entry: 159.820,
    current: 157.545,
    entryDate: "02/09/2026",
    weight: 6.67
  },
  {
    ticker: "SNPS",
    side: "Long",
    entry: 415.08,
    current: 415.97,
    entryDate: "02/09/2026",
    weight: 5.09
  },
  {
    ticker: "MU",
    side: "Long",
    entry: 944.00,
    current: 956.08,
    entryDate: "02/09/2026",
    weight: 4.97
  },
  {
    ticker: "INTC",
    side: "Long",
    entry: 88.40,
    current: 90.05,
    entryDate: "02/09/2026",
    weight: 5.07
  },
  {
    ticker: "Nasdaq",
    side: "Long",
    entry: 29152.9,
    current: 29112.3,
    entryDate: "03/09/2026",
    weight: 7.29
  },
  {
    ticker: "Nikkei",
    side: "Long",
    entry: 64261,
    current: 64373.74,
    entryDate: "03/09/2026",
    weight: 6.13
  },
  {
    ticker: "EWY",
    side: "Long",
    entry: 176.57,
    current: 178.86,
    entryDate: "02/09/2026",
    weight: 8.09
  },
  {
    ticker: "IYR",
    side: "Long",
    entry: 101.49,
    current: 102.45,
    entryDate: "02/09/2026",
    weight: 5.01
  },
  {
    ticker: "XLU",
    side: "Long",
    entry: 42.15,
    current: 42.67,
    entryDate: "02/09/2026",
    weight: 10.16
  }
];


// ------------------------------------------------------------
// P&L CALCULATION
// ------------------------------------------------------------

function calculatePnL(position) {

  if (position.side === "Short") {
    return (1 - position.current / position.entry) * 100;
  }

  return (position.current / position.entry - 1) * 100;
}


// ------------------------------------------------------------
// LINKEDIN
// ------------------------------------------------------------

const LINKEDIN_URL =
  "https://www.linkedin.com/in/markel-mart%C3%ADn-vaquero/";

document.querySelectorAll(".linkedin-link").forEach(link => {
  link.href = LINKEDIN_URL;
});


// ------------------------------------------------------------
// PORTFOLIO DONUT CHART
// ------------------------------------------------------------

const chart = document.getElementById("portfolioChart");
const legend = document.getElementById("portfolioLegend");
const totalElement = document.getElementById("portfolioTotal");

if (chart && legend && totalElement) {

  const total = portfolioAssets.reduce(
    (sum, asset) => sum + asset.value,
    0
  );

  let start = 0;

  const stops = portfolioAssets.map(asset => {

    const end =
      start + (asset.value / total) * 100;

    const segment =
      `${asset.color} ${start}% ${end}%`;

    start = end;

    return segment;
  });

  chart.style.background =
    `conic-gradient(${stops.join(", ")})`;

  totalElement.textContent =
    `${total.toFixed(0)}%`;

  legend.innerHTML =
    portfolioAssets.map(asset => `
      <div class="legend-item">

        <span
          class="legend-dot"
          style="background:${asset.color}">
        </span>

        <span>${asset.name}</span>

        <span class="legend-value">
          ${asset.value.toFixed(2)}%
        </span>

      </div>
    `).join("");
}


// ------------------------------------------------------------
// POSITIONS TABLE
// ------------------------------------------------------------

const positionsTable =
  document.getElementById("portfolioPositions");

if (positionsTable) {

  positionsTable.innerHTML =
    portfolioPositions.map(position => {

      const pnl =
        calculatePnL(position);

      const pnlClass =
        pnl >= 0 ? "positive" : "negative";

      const sign =
        pnl >= 0 ? "+" : "";

      let decimals = 2;

      if (position.ticker === "USD/JPY") {
        decimals = 3;
      }

      if (
        position.ticker === "Nasdaq" ||
        position.ticker === "Nikkei"
      ) {
        decimals = 1;
      }

      const formatPrice = value =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });

      return `
        <tr>

          <td>
            <strong>${position.ticker}</strong>
          </td>

          <td>
            <span class="position-side ${position.side.toLowerCase()}">
              ${position.side}
            </span>
          </td>

          <td>
            ${formatPrice(position.entry)}
          </td>

          <td>
            ${formatPrice(position.current)}
          </td>

          <td>
            ${position.weight.toFixed(2)}%
          </td>

          <td>
            ${position.entryDate}
          </td>

          <td class="${pnlClass}">
            ${sign}${pnl.toFixed(2)}%
          </td>

        </tr>
      `;

    }).join("");
}


// ------------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------------

document.querySelectorAll(".nav-links a").forEach(link => {

  link.addEventListener("click", () => {

    document
      .querySelectorAll(".nav-links a")
      .forEach(x => x.classList.remove("active"));

    link.classList.add("active");

  });

});
