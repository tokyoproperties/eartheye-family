// EarthEye OC — BottomNav v5 — with Global Index panel
// Usage: <BottomNav active="home" />

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:       "#0F0F0D",
  border:   "rgba(255,255,255,0.07)",
  inactive: "rgba(255,255,255,0.28)",
  active:   "rgba(255,255,255,0.90)",
  accent:   "#7AB87A",
  card:     "#1A1A17",
  ink:      "rgba(255,255,255,0.90)",
  inkMid:   "rgba(255,255,255,0.60)",
  inkLight: "rgba(255,255,255,0.35)",
  inkFaint: "rgba(255,255,255,0.18)",
};

// ── Global Index sections ─────────────────────────────────────────────────────
const INDEX = [
  {
    section: "Field",
    voice: "What the land is doing right now",
    items: [
      { label: "Today's Briefing",  sub: "Daily ecological conditions",     path: "/Field"    },
      { label: "Sky Intelligence",  sub: "Sun · moon · stars · twilight",   path: "/Sky"      },
      { label: "Acoustic Mode",     sub: "What you'd hear right now",       path: "/Seasonal?tab=acoustic" },
    ],
  },
  {
    section: "Atlas",
    voice: "542 species · 111 trails · Orange County",
    items: [
      { label: "Species",           sub: "542 documented · all groups",     path: "/Species"  },
      { label: "Trails",            sub: "111 routes · all biomes",         path: "/Trails"   },
      { label: "Search the Atlas",  sub: "Species · trails · habitats",     path: "/Search"   },
      { label: "Map",               sub: "Biome zones · corridors",         path: "/Map"      },
      { label: "Habitats",          sub: "Ecosystem profiles",              path: "/Habitats" },
    ],
  },
  {
    section: "Seasonal",
    voice: "Time · rhythm · what's arriving and departing",
    items: [
      { label: "Seasonal Arc",      sub: "Month-by-month ecological year",  path: "/Seasonal" },
      { label: "Year Arc",          sub: "Every species across 12 months",  path: "/Yearbook" },
      { label: "Near Me",           sub: "Species active at your location", path: "/NearMe"   },
    ],
  },
  {
    section: "Corridors",
    voice: "The five canonical movement pathways",
    items: [
      { label: "Corridors",         sub: "Movement pathways across OC",     path: "/Corridors" },
      { label: "Watershed Story",   sub: "Water as ecological spine",       path: "/WatershedStory" },
    ],
  },
  {
    section: "Record",
    voice: "Your presence in the atlas",
    items: [
      { label: "Journal",           sub: "Your personal field record",      path: "/Journal"      },
      { label: "Log a Sighting",    sub: "Add an observation",              path: "/LogSighting"  },
    ],
  },
];

// ── Hairline SVG icons ────────────────────────────────────────────────────────
const ICONS = {
  home: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={a?"1.8":"1.5"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9"/><path d="M5 10v9h5v-5h4v5h5v-9"/>
    </svg>
  ),
  species: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={a?"1.8":"1.5"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
      <path d="M12 7c-1.7 2.2-2.5 4-2.5 5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5C14.5 11 13.7 9.2 12 7z"/>
    </svg>
  ),
  trails: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={a?"1.8":"1.5"} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,17 7,9 11,13 15,7 19,13"/>
      <circle cx="7" cy="9" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  map: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={a?"1.8":"1.5"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  index: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="7"  x2="20" y2="7"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="17" x2="14" y2="17"/>
    </svg>
  ),
};

const NAV = [
  { id: "home",    label: "Home",    path: "/Home"    },
  { id: "species", label: "Species", path: "/Species" },
  { id: "trails",  label: "Trails",  path: "/Trails"  },
  { id: "map",     label: "Map",     path: "/Map"     },
];

// ── Global Index panel (slides from right) ────────────────────────────────────
function GlobalIndex({ open, onClose, navigate }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        zIndex: 201, width: "min(88vw, 340px)",
        background: T.bg,
        borderLeft: `1px solid ${T.border}`,
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both",
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0.6; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: "24px 20px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.inkLight, marginBottom: "6px"
            }}>
              EarthEye OC
            </div>
            <div style={{
              fontSize: "18px", fontFamily: "Georgia, serif",
              color: T.ink, fontWeight: "400"
            }}>
              Atlas Index
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
              borderRadius: "50%", width: "32px", height: "32px",
              color: T.inkLight, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", lineHeight: 1, flexShrink: 0
            }}>
            ×
          </button>
        </div>

        {/* Index sections */}
        <div style={{ flex: 1, padding: "8px 0 40px" }}>
          {INDEX.map((sec) => (
            <div key={sec.section} style={{ marginBottom: "4px" }}>
              {/* Section header */}
              <div style={{ padding: "20px 20px 8px" }}>
                <div style={{
                  fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: T.accent, marginBottom: "3px"
                }}>
                  {sec.section}
                </div>
                <div style={{
                  fontSize: "11px", fontStyle: "italic",
                  fontFamily: "Georgia, serif", color: T.inkLight
                }}>
                  {sec.voice}
                </div>
              </div>
              {/* Items */}
              {sec.items.map((item) => (
                <div
                  key={item.path}
                  onClick={() => { navigate(item.path); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 20px",
                    borderBottom: `1px solid ${T.border}`,
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: "14px", fontFamily: "Georgia, serif", color: T.ink,
                      marginBottom: "2px"
                    }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "11px", color: T.inkLight }}>
                      {item.sub}
                    </div>
                  </div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BottomNav({ active }) {
  const navigate   = useNavigate();
  const [indexOpen, setIndexOpen] = useState(false);

  return (
    <>
      {/* Spacer */}
      <div style={{ height: "68px" }} />

      {/* Global Index panel */}
      <GlobalIndex open={indexOpen} onClose={() => setIndexOpen(false)} navigate={navigate} />

      {/* Bottom bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: T.bg,
        borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: `10px 0 max(10px, env(safe-area-inset-bottom))`,
      }}>
        {/* Four nav items */}
        {NAV.map(item => {
          const isActive = item.id === active;
          return (
            <button key={item.id} onClick={() => navigate(item.path)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              padding: "4px 10px", background: "none", border: "none", cursor: "pointer",
              color: isActive ? T.active : T.inactive, minWidth: "52px",
              transition: "color 0.15s",
            }}>
              {ICONS[item.id](isActive)}
              <span style={{
                fontSize: "10px",
                fontWeight: isActive ? "600" : "400",
                letterSpacing: isActive ? "0.03em" : "0.02em",
                color: isActive ? T.accent : "rgba(255,255,255,0.22)",
                lineHeight: 1,
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  width: "3px", height: "3px", borderRadius: "50%",
                  background: T.accent, marginTop: "-1px",
                }} />
              )}
            </button>
          );
        })}

        {/* Index button — three-line glyph */}
        <button
          onClick={() => setIndexOpen(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            padding: "4px 10px", background: "none", border: "none", cursor: "pointer",
            color: indexOpen ? T.active : T.inactive, minWidth: "52px",
            transition: "color 0.15s",
          }}>
          {ICONS.index()}
          <span style={{
            fontSize: "10px", fontWeight: "400", letterSpacing: "0.02em",
            color: "rgba(255,255,255,0.22)", lineHeight: 1,
          }}>
            Index
          </span>
        </button>
      </nav>
    </>
  );
}
