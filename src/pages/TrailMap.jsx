import { useState, useEffect, useRef } from "react";
import { Trail } from "@/api/entities";
import { useNavigate } from "react-router-dom";

// ── Geographic constants ─────────────────────────────────────────────────────
const LAT_MIN = 33.368;
const LAT_MAX = 33.970;
const LNG_MIN = -118.100;
const LNG_MAX = -117.490;
const COS_LAT = Math.cos((33.65 * Math.PI) / 180); // 0.8324

// ── Biome classification ─────────────────────────────────────────────────────
const BIOMES = {
  coastal:  { color: "#4A9B8E", label: "Coastal & Wetland" },
  sage:     { color: "#C4992A", label: "Sage & Chaparral" },
  oak:      { color: "#6B9B4A", label: "Oak & Riparian" },
  summit:   { color: "#8A9BB8", label: "Summit & Conifer" },
  urban:    { color: "#B89B7A", label: "Urban Edge" },
  creek:    { color: "#6BA8D4", label: "Creek Corridor" },
};

function classifyBiome(trail) {
  const habitats = (trail.habitatTypes || []).map(h => h.toLowerCase());
  const name = (trail.name || "").toLowerCase();
  const join = habitats.join(" ") + " " + name;

  if (join.includes("beach") || join.includes("pier") || join.includes("harbor") ||
      join.includes("coastal") || join.includes("wetland") || join.includes("tidal") ||
      join.includes("estuary") || join.includes("reef") || join.includes("boardwalk")) return "coastal";
  if (join.includes("summit") || join.includes("peak") || join.includes("conifer") ||
      join.includes("ridge") && join.includes("hard")) return "summit";
  if (join.includes("oak") || join.includes("riparian") || join.includes("canyon") && join.includes("creek")) return "oak";
  if (join.includes("creek") || join.includes("riparian") || join.includes("river")) return "creek";
  if (join.includes("urban") || join.includes("arboretum") || join.includes("regional park")) return "urban";
  return "sage";
}

// ── Coordinate projection ────────────────────────────────────────────────────
function toSVG(lat, lng, W, H, PAD) {
  const drawW = W - PAD * 2;
  const drawH = H - PAD * 2;
  // Apply cos correction to normalize geographic degrees to visual distance
  const latSpanDeg = LAT_MAX - LAT_MIN;
  const lngSpanDeg = (LNG_MAX - LNG_MIN) * COS_LAT;
  const aspect = lngSpanDeg / latSpanDeg;

  // Normalize
  const nx = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN);
  const ny = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN);

  // Map to canvas — x gets cos correction to match true E-W distance
  const x = PAD + nx * drawW;
  const y = PAD + (1 - ny) * drawH;
  return { x: +x.toFixed(1), y: +y.toFixed(1) };
}

// ── Node radius by difficulty ────────────────────────────────────────────────
function getRadius(difficulty) {
  const d = (difficulty || "").toLowerCase();
  if (d === "hard") return 7;
  if (d === "moderate") return 5.5;
  return 4;
}

// ── Region labels ────────────────────────────────────────────────────────────
const REGION_LABELS = [
  { label: "Chino Hills", lat: 33.92, lng: -117.75, size: 9 },
  { label: "Santa Ana Mtns", lat: 33.72, lng: -117.55, size: 9 },
  { label: "Newport Bay", lat: 33.645, lng: -117.895, size: 8 },
  { label: "Laguna Hills", lat: 33.565, lng: -117.74, size: 8 },
  { label: "San Clemente", lat: 33.42, lng: -117.615, size: 8 },
  { label: "Coastal Corridor", lat: 33.65, lng: -118.065, size: 8 },
];

export default function TrailMap() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all"); // all | coastal | sage | oak | summit | creek | urban
  const [showLegend, setShowLegend] = useState(false);
  const navigate = useNavigate();
  const svgRef = useRef(null);

  const W = 390;
  const H = 680;
  const PAD = 32;

  useEffect(() => {
    Trail.filter({}).then(data => {
      setTrails(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const enriched = trails
    .filter(t => t.lat && t.lng)
    .map(t => ({
      ...t,
      biome: classifyBiome(t),
      pos: toSVG(t.lat, t.lng, W, H, PAD),
      r: getRadius(t.difficulty),
    }));

  const visible = filter === "all"
    ? enriched
    : enriched.filter(t => t.biome === filter);

  function handleTap(trail) {
    if (selected?.id === trail.id) {
      navigate(`/TrailDetail?id=${trail.id}`);
    } else {
      setSelected(trail);
    }
  }

  function handleSVGTap(e) {
    if (e.target.tagName === "svg" || e.target.tagName === "rect" || e.target.tagName === "text") {
      setSelected(null);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0D1520", color: "#6B8B6B", fontFamily: "system-ui"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>Loading trail map…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#0D1520",
      minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
      userSelect: "none",
    }}>

      {/* Header */}
      <div style={{
        padding: "16px 20px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: "#E8E4DA", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>
            Trail Map
          </div>
          <div style={{ color: "#6B8B6B", fontSize: 12, marginTop: 2 }}>
            {enriched.length} trails · Orange County
          </div>
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            background: showLegend ? "#2A4A3A" : "#1A2A20",
            border: "1px solid #2A3A2A",
            borderRadius: 8,
            color: "#9BBB8B",
            fontSize: 11,
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          {showLegend ? "Hide legend" : "Legend"}
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{
          margin: "0 16px 8px",
          background: "#121E18",
          border: "1px solid #1E3028",
          borderRadius: 10,
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 16px",
        }}>
          {Object.entries(BIOMES).map(([key, { color, label }]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ color: "#8A9A88", fontSize: 11 }}>{label}</span>
            </div>
          ))}
          <div style={{ gridColumn: "1/-1", marginTop: 4, borderTop: "1px solid #1E3028", paddingTop: 6 }}>
            <span style={{ color: "#6B7B6B", fontSize: 10 }}>
              Circle size = difficulty · Tap once to preview · Tap twice to open
            </span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        display: "flex",
        gap: 6,
        padding: "0 16px 8px",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {[["all", "#5A6A5A", "All"], ...Object.entries(BIOMES).map(([k, v]) => [k, v.color, v.label.split(" & ")[0]])].map(([key, color, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              flexShrink: 0,
              background: filter === key ? color + "33" : "#121E18",
              border: `1px solid ${filter === key ? color : "#1E3028"}`,
              borderRadius: 20,
              color: filter === key ? color : "#6B7B6B",
              fontSize: 11,
              padding: "5px 12px",
              cursor: "pointer",
              fontWeight: filter === key ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SVG Map */}
      <div style={{ position: "relative", margin: "0 auto", maxWidth: W }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", cursor: "default" }}
          onClick={handleSVGTap}
        >
          {/* Background */}
          <rect width={W} height={H} fill="#0D1520" />

          {/* Subtle grid lines for geographic orientation */}
          {[33.4, 33.5, 33.6, 33.7, 33.8, 33.9].map(lat => {
            const { y } = toSVG(lat, -117.79, W, H, PAD);
            return (
              <line key={lat} x1={PAD} x2={W - PAD} y1={y} y2={y}
                stroke="#1A2A20" strokeWidth={0.5} strokeDasharray="3,6" />
            );
          })}
          {[-118.0, -117.9, -117.8, -117.7, -117.6].map(lng => {
            const { x } = toSVG(33.67, lng, W, H, PAD);
            return (
              <line key={lng} x1={x} x2={x} y1={PAD} y2={H - PAD}
                stroke="#1A2A20" strokeWidth={0.5} strokeDasharray="3,6" />
            );
          })}

          {/* Coastal water shading (west edge) */}
          <rect
            x={0} y={0} width={PAD + 12} height={H}
            fill="#0A1525" opacity={0.6}
          />

          {/* Region labels */}
          {REGION_LABELS.map(({ label, lat, lng, size }) => {
            const { x, y } = toSVG(lat, lng, W, H, PAD);
            return (
              <text key={label} x={x} y={y}
                fill="#2A3A2A" fontSize={size} fontFamily="system-ui"
                textAnchor="middle" fontWeight={500} letterSpacing={0.5}
                style={{ pointerEvents: "none" }}
              >
                {label}
              </text>
            );
          })}

          {/* Dim non-filtered trails */}
          {filter !== "all" && enriched.filter(t => t.biome !== filter).map(t => (
            <circle
              key={`dim-${t.id}`}
              cx={t.pos.x} cy={t.pos.y}
              r={3}
              fill="#1E2E22"
              stroke="none"
            />
          ))}

          {/* Trail nodes */}
          {visible.map(t => {
            const biomeColor = BIOMES[t.biome]?.color || "#6B8B6B";
            const isSel = selected?.id === t.id;
            const r = isSel ? t.r + 3 : t.r;
            return (
              <g key={t.id} onClick={(e) => { e.stopPropagation(); handleTap(t); }} style={{ cursor: "pointer" }}>
                {/* Glow ring for selected */}
                {isSel && (
                  <circle
                    cx={t.pos.x} cy={t.pos.y}
                    r={r + 6}
                    fill="none"
                    stroke={biomeColor}
                    strokeWidth={1}
                    opacity={0.35}
                  />
                )}
                {/* Main node */}
                <circle
                  cx={t.pos.x} cy={t.pos.y}
                  r={r}
                  fill={biomeColor}
                  stroke={isSel ? "#E8E4DA" : "#0D1520"}
                  strokeWidth={isSel ? 2 : 1}
                  opacity={isSel ? 1 : 0.85}
                />
                {/* Hard trail inner dot */}
                {(t.difficulty || "").toLowerCase() === "hard" && !isSel && (
                  <circle cx={t.pos.x} cy={t.pos.y} r={2} fill="#0D1520" opacity={0.5} />
                )}
              </g>
            );
          })}

          {/* Compass */}
          <g transform={`translate(${W - PAD - 8}, ${PAD + 12})`}>
            <text fill="#2A3A2A" fontSize={9} textAnchor="middle" y={-2} fontFamily="system-ui">N</text>
            <line x1={0} y1={2} x2={0} y2={10} stroke="#2A3A2A" strokeWidth={1} />
            <polygon points="0,-2 -2,4 0,2 2,4" fill="#2A3A2A" />
          </g>

          {/* Scale indicator */}
          <g transform={`translate(${PAD}, ${H - PAD + 10})`}>
            <line x1={0} y1={0} x2={40} y2={0} stroke="#2A3A2A" strokeWidth={1} />
            <line x1={0} y1={-3} x2={0} y2={3} stroke="#2A3A2A" strokeWidth={1} />
            <line x1={40} y1={-3} x2={40} y2={3} stroke="#2A3A2A" strokeWidth={1} />
            <text x={20} y={-5} fill="#2A3A2A" fontSize={8} textAnchor="middle" fontFamily="system-ui">~10 mi</text>
          </g>
        </svg>

        {/* Selected trail card */}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              background: "#121E18",
              border: `1px solid ${BIOMES[selected.biome]?.color || "#2A3A2A"}44`,
              borderRadius: 12,
              padding: "12px 14px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
            onClick={() => navigate(`/TrailDetail?id=${selected.id}`)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: "#E8E4DA", fontSize: 13, fontWeight: 600,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                }}>
                  {selected.name}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {selected.distanceMiles && (
                    <span style={{ color: "#8A9A88", fontSize: 11 }}>
                      {selected.distanceMiles} mi
                    </span>
                  )}
                  {selected.difficulty && (
                    <span style={{
                      color: BIOMES[selected.biome]?.color || "#8A9A88",
                      fontSize: 11,
                      textTransform: "capitalize"
                    }}>
                      {selected.difficulty}
                    </span>
                  )}
                  {selected.jurisdiction && (
                    <span style={{
                      color: "#5A6A5A", fontSize: 10,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: 160
                    }}>
                      {selected.jurisdiction.split("/")[0].trim()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                background: BIOMES[selected.biome]?.color || "#4A7A5A",
                borderRadius: 6,
                padding: "4px 10px",
                color: "#0D1520",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                Open →
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacer for nav */}
      <div style={{ height: 80 }} />
    </div>
  );
}
