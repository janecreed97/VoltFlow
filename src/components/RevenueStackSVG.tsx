export default function RevenueStackSVG() {
  const barWidth = 80;
  const barHeight = 300;
  const barX = 160;

  // Segment heights (% of total)
  const capacityPct = 30;
  const ancillaryPct = 50;
  const arbitragePct = 20;

  const capacityH = (capacityPct / 100) * barHeight;
  const ancillaryH = (ancillaryPct / 100) * barHeight;
  const arbitrageH = (arbitragePct / 100) * barHeight;

  // Y positions (stacked bottom-to-top → SVG top-to-bottom order)
  const arbitrageY = 40; // top segment
  const ancillaryY = arbitrageY + arbitrageH;
  const capacityY = ancillaryY + ancillaryH;

  const totalH = barHeight;
  const svgH = totalH + 80; // padding

  return (
    <svg
      width="400"
      height={svgH}
      viewBox={`0 0 400 ${svgH}`}
      aria-label="Revenue stack bar chart showing capacity, ancillary, and arbitrage revenue segments"
      className="mx-auto"
    >
      {/* Title */}
      <text x="200" y="20" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="inherit">
        Annual Revenue Stack ($/kW-year)
      </text>

      {/* Arbitrage — amber */}
      <rect
        x={barX}
        y={arbitrageY}
        width={barWidth}
        height={arbitrageH}
        fill="#f59e0b"
        rx="2"
      />
      <text
        x={barX + barWidth / 2}
        y={arbitrageY + arbitrageH / 2 + 5}
        textAnchor="middle"
        fill="#1e293b"
        fontSize="13"
        fontWeight="bold"
        fontFamily="inherit"
      >
        {arbitragePct}%
      </text>

      {/* Ancillary — green */}
      <rect
        x={barX}
        y={ancillaryY}
        width={barWidth}
        height={ancillaryH}
        fill="#22c55e"
      />
      <text
        x={barX + barWidth / 2}
        y={ancillaryY + ancillaryH / 2 + 5}
        textAnchor="middle"
        fill="#1e293b"
        fontSize="13"
        fontWeight="bold"
        fontFamily="inherit"
      >
        {ancillaryPct}%
      </text>

      {/* Capacity — blue */}
      <rect
        x={barX}
        y={capacityY}
        width={barWidth}
        height={capacityH}
        fill="#3b82f6"
        rx="2"
      />
      <text
        x={barX + barWidth / 2}
        y={capacityY + capacityH / 2 + 5}
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="inherit"
      >
        {capacityPct}%
      </text>

      {/* Legend */}
      {[
        { color: "#f59e0b", label: "Arbitrage" },
        { color: "#22c55e", label: "Ancillary Services" },
        { color: "#3b82f6", label: "Capacity Market" },
      ].map(({ color, label }, i) => (
        <g key={label} transform={`translate(270, ${arbitrageY + i * 28})`}>
          <rect width="14" height="14" fill={color} rx="2" />
          <text x="20" y="11" fill="#cbd5e1" fontSize="12" fontFamily="inherit">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
