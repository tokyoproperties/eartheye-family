import BottomNav from "./BottomNav";
import { useState, useEffect, useCallback } from "react";
import { Observation, Species, Trail } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import LogSighting from "./LogSighting";

// ── Keep these exports so existing imports don't break ───────────────────────
export function logSpeciesSighting() {}
export function logTrailVisit() {}
export function readJournal() { return []; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASON_ICON = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function groupByDate(obs) {
  const groups = {};
  obs.forEach(o => {
    const key = o.timestamp
      ? new Date(o.timestamp).toISOString().slice(0, 10)
      : (o.created_date ? new Date(o.created_date).toISOString().slice(0, 10) : "unknown");
    if (!groups[key]) groups[key] = [];
    groups[key].push(o);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function SeasonBadge({ season }) {
  if (!season) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6,
      background: "rgba(74,124,89,0.10)", color: "#5A8A6A",
      border: "1px solid rgba(74,124,89,0.18)", textTransform: "capitalize",
    }}>
      {SEASON_ICON[season]} {season}
    </span>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ obs }) {
  const uniqueSpecies = new Set(obs.map(o => o.speciesId).filter(Boolean)).size;
  const uniqueTrails  = new Set(obs.map(o => o.trailId).filter(Boolean)).size;
  const withGPS       = obs.filter(o => o.lat && o.lng).length;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8, marginBottom: 20,
    }}>
      {[
        { n: obs.length,     label: "Sightings" },
        { n: uniqueSpecies,  label: "Species"   },
        { n: uniqueTrails,   label: "Trails"    },
      ].map(({ n, label }) => (
        <div key={label} style={{
          background: "#0F0F0D", border: "1px solid #1A1A17",
          borderRadius: 10, padding: "12px 0", textAlign: "center",
        }}>
          <div style={{ color: "#A8D5B0", fontSize: 22, fontWeight: 800 }}>{n}</div>
          <div style={{ color: "#4A6A4A", fontSize: 11, marginTop: 2 }}>{label}</div>
        </div>
      ))}
    <BottomNav active="journal" />
    </div>
  );
}

// ── Sighting row ──────────────────────────────────────────────────────────────
function SightingRow({ obs, navigate }) {
  const hasGPS = obs.lat && obs.lng;
  const time   = obs.timestamp
    ? new Date(obs.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      onClick={() => obs.speciesId && navigate(`/SpeciesDetail?id=${obs.speciesId}`)}
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #1A1A17",
        cursor: obs.speciesId ? "pointer" : "default",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}
    >
      {/* Dot */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#4A8A5A", flexShrink: 0, marginTop: 5,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Species name */}
        <div style={{
          color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: 600,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {obs.speciesName || "Unknown species"}
        </div>

        {/* Trail + time row */}
        <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
          {obs.trailName && (
            <span style={{ color: "#4A6A4A", fontSize: 11, 
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
              {obs.trailName}
            </span>
          )}
          {time && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{time}</span>}
          {hasGPS && <span style={{ fontSize: 10, color: "#3A6A4A" }}>📍</span>}
          <SeasonBadge season={obs.season} />
        </div>

        {/* Notes */}
        {obs.notes && (
          <div style={{
            color: "#5A7A5A", fontSize: 12, marginTop: 4,
            lineHeight: 1.5, fontStyle: "italic",
          }}>
            "{obs.notes}"
          </div>
        )}

        {/* Conditions */}
        {obs.conditions && (
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>
            {obs.conditions}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Journal() {
  const [obs,       setObs]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [logOpen,   setLogOpen]   = useState(false);
  const [tab,       setTab]       = useState("log"); // "log" | "species" | "trails"
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    Observation.filter({})
      .then(d => { setObs((d || []).sort((a,b) =>
        new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date)
      )); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived
  const grouped        = groupByDate(obs);
  const uniqueSpecies  = [...new Map(obs.filter(o => o.speciesId)
    .map(o => [o.speciesId, o])).values()]
    .sort((a,b) => (a.speciesName||"").localeCompare(b.speciesName||""));
  const trailMap = {};
  obs.forEach(o => {
    if (!o.trailId) return;
    if (!trailMap[o.trailId]) trailMap[o.trailId] = { id: o.trailId, name: o.trailName, count: 0 };
    trailMap[o.trailId].count++;
  });
  const trailList = Object.values(trailMap).sort((a,b) => b.count - a.count);

  const today = new Date();
  const monthName = MONTH_NAMES[today.getMonth()];

  return (
    <div style={{
      minHeight: "100vh", background: "#0A1410",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "rgba(255,255,255,0.88)",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          Field Journal
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ color: "rgba(255,255,255,0.88)", fontSize: 24, fontWeight: 800, margin: 0 }}>
            Your Sightings
          </h1>
          <button onClick={() => setLogOpen(true)} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, color: "rgba(255,255,255,0.70)",
            fontSize: 12, fontWeight: 700, padding: "8px 14px",
            cursor: "pointer",
          }}>+ Log</button>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>
          {monthName} {today.getFullYear()} · Orange County
        </div>
      </div>

      {/* ── Stats ── */}
      {!loading && obs.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          <StatsBar obs={obs} />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, padding: "0 20px 0",
        borderBottom: "1px solid #1A1A17", marginBottom: 16 }}>
        {[["log","Log"],["species","Species"],["trails","Trails"]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "10px 0", background: "none", border: "none",
            borderBottom: tab === key ? "2px solid #4A8A5A" : "2px solid transparent",
            color: tab === key ? "#A8D5B0" : "#3A5A3A",
            fontSize: 13, fontWeight: tab === key ? 700 : 400,
            cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "0 20px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.35)" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📘</div>
            <div style={{ fontSize: 13 }}>Loading journal…</div>
          </div>
        )}

        {!loading && obs.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            background: "#0F0F0D", borderRadius: 14, marginTop: 8,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📘</div>
            <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              No sightings yet
            </div>
            <div style={{ color: "#4A6A4A", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              Head to a species or trail page<br/>and tap Log Sighting.
            </div>
            <button onClick={() => navigate("/Species")} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, color: "rgba(255,255,255,0.70)",
              fontSize: 13, fontWeight: 600, padding: "10px 24px", cursor: "pointer",
            }}>Browse Species</button>
          </div>
        )}

        {/* ── LOG TAB — chronological ── */}
        {!loading && tab === "log" && obs.length > 0 && (
          <div>
            {grouped.map(([dateKey, dayObs]) => (
              <div key={dateKey} style={{ marginBottom: 24 }}>
                <div style={{
                  color: "#3A6A4A", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  marginBottom: 4, paddingBottom: 6,
                  borderBottom: "1px solid #1A1A17",
                }}>
                  {formatDate(dateKey + "T12:00:00")}
                  <span style={{ color: "#2A4A2A", marginLeft: 8, fontWeight: 400 }}>
                    {dayObs.length} {dayObs.length === 1 ? "sighting" : "sightings"}
                  </span>
                </div>
                {dayObs.map(o => (
                  <SightingRow key={o.id} obs={o} navigate={navigate} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── SPECIES TAB — alphabetical unique ── */}
        {!loading && tab === "species" && obs.length > 0 && (
          <div>
            {uniqueSpecies.map(o => {
              const count = obs.filter(x => x.speciesId === o.speciesId).length;
              return (
                <div key={o.speciesId}
                  onClick={() => navigate(`/SpeciesDetail?id=${o.speciesId}`)}
                  style={{
                    padding: "12px 0", borderBottom: "1px solid #1A1A17",
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "space-between",
                  }}>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: 600 }}>
                      {o.speciesName}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                      Last seen {formatDate(o.timestamp || o.created_date)}
                    </div>
                  </div>
                  <div style={{
                    background: "#0F0F0D", border: "1px solid #1A1A17",
                    borderRadius: 8, padding: "4px 10px",
                    color: "#7AB87A", fontSize: 12, fontWeight: 700,
                  }}>{count}×</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TRAILS TAB — by sighting count ── */}
        {!loading && tab === "trails" && obs.length > 0 && (
          <div>
            {trailList.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, padding: "24px 0", textAlign: "center" }}>
                No trail associations yet.<br/>
                <span style={{ fontSize: 12 }}>Log a sighting from a trail page to see it here.</span>
              </div>
            )}
            {trailList.map(t => (
              <div key={t.id}
                onClick={() => navigate(`/TrailDetail?id=${t.id}`)}
                style={{
                  padding: "12px 0", borderBottom: "1px solid #1A1A17",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "space-between",
                }}>
                <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: "75%" }}>
                  {t.name || "Unknown trail"}
                </div>
                <div style={{
                  background: "#0F0F0D", border: "1px solid #1A1A17",
                  borderRadius: 8, padding: "4px 10px",
                  color: "#7AB87A", fontSize: 12, fontWeight: 700,
                }}>{t.count} sighting{t.count !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Log Sighting modal ── */}
      <LogSighting
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={() => { setLogOpen(false); load(); }}
      />

      <div style={{ height: 100 }} />
    </div>
  );
}
