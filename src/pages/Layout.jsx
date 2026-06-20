import { useState, useEffect } from "react";
import { ErrorBoundary } from "./AtlasReady";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useNightMode, NightModeToggle } from "./NightMode";
import { useSettings } from "./Settings";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    path: "/",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    ),
  },
  {
    id: "trails",
    label: "Trails",
    path: "/trails",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l4-8 4 4 4-6 4 6" />
        <circle cx="8" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "species",
    label: "Species",
    path: "/species",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.5 2-2 3.5-2 4.5 0 1.1.9 2 2 2s2-.9 2-2c0-1-.5-2.5-2-4.5z" />
      </svg>
    ),
  },
  {
    id: "nearme",
    label: "Near Me",
    path: "/nearme",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" fill={active ? "currentColor" : "none"} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "journal",
    label: "Journal",
    path: "/journal",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h6"/>
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
  {
    id: "seasonal",
    label: "Today",
    path: "/seasonal",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

// Desktop secondary nav — discoverable surfaces only
const SECONDARY_NAV = [
  { id: "corridors",  label: "Corridors", path: "/corridors"  },
  { id: "biomes",     label: "Biomes",    path: "/biomes"     },
  { id: "field",      label: "Field",     path: "/field"      },
  { id: "yearbook",   label: "Yearbook",  path: "/yearbook"   },
];

const EARTHEYE_BUILD = 1776540916;
// ── EarthEye Global Index ─────────────────────────────────────────────────────
const EE_INDEX = [
  {
    section: "Field",
    voice: "What the land is doing right now",
    items: [
      { label: "Today's Briefing", sub: "Daily ecological conditions",   path: "/field"    },
      { label: "Sky Intelligence", sub: "Sun · moon · stars · twilight", path: "/sky"      },
      { label: "Near Me",          sub: "Species active at your location",path: "/nearme"  },
    ],
  },
  {
    section: "Atlas",
    voice: "542 species · 111 trails · Orange County",
    items: [
      { label: "Species",          sub: "542 documented · all groups",   path: "/species"  },
      { label: "Trails",           sub: "111 routes · all biomes",       path: "/trails"   },
      { label: "Map",              sub: "Biome zones · corridors",       path: "/map"      },
      { label: "Habitats",         sub: "Ecosystem profiles",            path: "/habitats" },
      { label: "Search",           sub: "Any species, trait, or habitat",path: "/search"   },
    ],
  },
  {
    section: "Seasonal",
    voice: "Time · rhythm · arrival and departure windows",
    items: [
      { label: "Seasonal Arc",     sub: "Month-by-month ecological year",path: "/seasonal" },
      { label: "Year Arc",         sub: "All species across 12 months",  path: "/yearbook" },
    ],
  },
  {
    section: "Corridors",
    voice: "The five canonical movement pathways",
    items: [
      { label: "Corridors",        sub: "Movement pathways across OC",   path: "/corridors"      },
      { label: "Watershed Story",  sub: "Water as ecological spine",     path: "/watershedstory" },
    ],
  },
  {
    section: "Record",
    voice: "Your presence in the atlas",
    items: [
      { label: "Journal",          sub: "Your personal field record",    path: "/journal"     },
      { label: "Log a Sighting",   sub: "Add an observation",           path: "/logsighting" },
    ],
  },
];

const T_NAV = {
  bg:       "#0F0F0D",
  border:   "rgba(255,255,255,0.07)",
  inactive: "rgba(255,255,255,0.28)",
  active:   "rgba(255,255,255,0.90)",
  accent:   "#7AB87A",
  card:     "#1A1A17",
  ink:      "rgba(255,255,255,0.90)",
  inkMid:   "rgba(255,255,255,0.60)",
  inkLight: "rgba(255,255,255,0.35)",
  inkFaint: "rgba(255,255,255,0.14)",
};

const NAV_ICONS = {
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

const EE_NAV_ITEMS = [
  { id: "home",    label: "Home",    path: "/home"    },
  { id: "species", label: "Species", path: "/species" },
  { id: "trails",  label: "Trails",  path: "/trails"  },
  { id: "map",     label: "Map",     path: "/map"     },
];

function EarthEyeIndexPanel({ open, onClose, navigate }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.65)",
        backdropFilter:"blur(2px)", WebkitBackdropFilter:"blur(2px)",
      }}/>
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, zIndex:201,
        width:"min(88vw,340px)",
        background:T_NAV.bg,
        borderLeft:`1px solid ${T_NAV.border}`,
        overflowY:"auto", display:"flex", flexDirection:"column",
        animation:"eeSlideIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both",
      }}>
        {/* Header */}
        <div style={{
          padding:"28px 20px 18px",
          borderBottom:`1px solid ${T_NAV.border}`,
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        }}>
          <div>
            <div style={{
              fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T_NAV.inkLight, marginBottom:"5px"
            }}>EarthEye OC</div>
            <div style={{
              fontSize:"20px", fontFamily:"Georgia, serif",
              color:T_NAV.ink, fontWeight:"400"
            }}>Atlas Index</div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.06)", border:`1px solid ${T_NAV.border}`,
            borderRadius:"50%", width:"32px", height:"32px",
            color:T_NAV.inkLight, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"18px", lineHeight:1, flexShrink:0, marginTop:"4px"
          }}>×</button>
        </div>
        {/* Sections */}
        <div style={{ flex:1, paddingBottom:"40px" }}>
          {EE_INDEX.map(sec => (
            <div key={sec.section}>
              <div style={{ padding:"18px 20px 6px" }}>
                <div style={{
                  fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
                  textTransform:"uppercase", color:T_NAV.accent, marginBottom:"3px"
                }}>{sec.section}</div>
                <div style={{
                  fontSize:"11px", fontStyle:"italic",
                  fontFamily:"Georgia, serif", color:T_NAV.inkLight
                }}>{sec.voice}</div>
              </div>
              {sec.items.map(item => (
                <div key={item.path}
                  onClick={() => { navigate(item.path); onClose(); }}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"13px 20px",
                    borderBottom:`1px solid ${T_NAV.border}`,
                    cursor:"pointer",
                  }}>
                  <div>
                    <div style={{
                      fontSize:"14px", fontFamily:"Georgia, serif",
                      color:T_NAV.ink, marginBottom:"2px"
                    }}>{item.label}</div>
                    <div style={{ fontSize:"11px", color:T_NAV.inkLight }}>{item.sub}</div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={T_NAV.inkFaint} strokeWidth="2.5" strokeLinecap="round">
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

function EarthEyeNav({ activeId, navigate }) {
  const [indexOpen, setIndexOpen] = useState(false);
  return (
    <>
      <style>{`
        @keyframes eeSlideIn {
          from { transform: translateX(100%); opacity: 0.8; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <EarthEyeIndexPanel open={indexOpen} onClose={() => setIndexOpen(false)} navigate={navigate} />
      <nav style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background:T_NAV.bg,
        borderTop:`1px solid ${T_NAV.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-around",
        padding:`10px 0 max(10px, env(safe-area-inset-bottom))`,
      }}>
        {EE_NAV_ITEMS.map(item => {
          const isActive = item.id === activeId;
          return (
            <button key={item.id} onClick={() => navigate(item.path)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
              padding:"4px 10px", background:"none", border:"none", cursor:"pointer",
              color: isActive ? T_NAV.active : T_NAV.inactive, minWidth:"52px",
              transition:"color 0.15s",
            }}>
              {NAV_ICONS[item.id](isActive)}
              <span style={{
                fontSize:"10px",
                fontWeight: isActive ? "600" : "400",
                letterSpacing:"0.02em",
                color: isActive ? T_NAV.accent : "rgba(255,255,255,0.22)",
                lineHeight:1,
              }}>{item.label}</span>
              {isActive && (
                <div style={{
                  width:"3px", height:"3px", borderRadius:"50%",
                  background:T_NAV.accent, marginTop:"-1px",
                }}/>
              )}
            </button>
          );
        })}
        {/* Index button */}
        <button onClick={() => setIndexOpen(true)} style={{
          display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
          padding:"4px 10px", background:"none", border:"none", cursor:"pointer",
          color: indexOpen ? T_NAV.active : T_NAV.inactive, minWidth:"52px",
          transition:"color 0.15s",
        }}>
          {NAV_ICONS.index()}
          <span style={{
            fontSize:"10px", fontWeight:"400", letterSpacing:"0.02em",
            color:"rgba(255,255,255,0.22)", lineHeight:1,
          }}>Index</span>
        </button>
      </nav>
    </>
  );
}


export default function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isNight } = useNightMode();
  const { settings } = useSettings();

  // ── Page title ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const titles = {
      "/home": "EarthEye OC — Orange County Field Atlas",
      "/species": "Species — EarthEye OC",
      "/trails": "Trails — EarthEye OC",
      "/map": "Map — EarthEye OC",
      "/seasonal": "Today — EarthEye OC",
      "/nearme": "Near Me — EarthEye OC",
      "/journal": "Journal — EarthEye OC",
      "/settings": "Settings — EarthEye OC",
      "/yearbook": "Yearbook — EarthEye OC",
      "/search": "Search — EarthEye OC",
      "/corridors": "Corridors — EarthEye OC",
      "/biomes": "Biomes — EarthEye OC",
      "/field": "Field Mode — EarthEye OC",
    };
    const match = Object.entries(titles).find(([k]) => path.startsWith(k));
    document.title = match ? match[1] : "EarthEye OC";
  }, [location.pathname]);

  // Map detail pages back to their parent nav tab
  const PATH_OVERRIDES = {
    "/SpeciesDetail": "species",
    "/speciesdetail": "species",
    "/species/":      "species",
    "/TrailDetail":   "trails",
    "/traildetail":   "trails",
    "/trails/":       "trails",
    "/Yearbook":      "home",
    "/yearbook":      "home",
    "/seasondetail":  "home",
    "/monthdetail":   "home",
    "/Settings":      "home",
    "/settings":      "home",
    "/NearMe":        "home",
    "/nearme":        "home",
    "/Search":        "home",
    "/search":        "home",
    "/Seasonal":      "home",
    "/seasonal":      "home",
    "/field":         "home",
    "/Field":         "home",
    "/sky":           "home",
    "/Sky":           "home",
    "/corridors":     "home",
    "/biomes":        "home",
    "/habitats":      "home",
    "/HabitatDetail": "home",
    "/journal":       "home",
    "/Journal":       "home",
    "/logsighting":   "home",
  };
  const overrideEntry = Object.entries(PATH_OVERRIDES).find(([k]) =>
    location.pathname.startsWith(k)
  );
  const activeId = overrideEntry
    ? overrideEntry[1]
    : NAV_ITEMS.find((item) =>
        item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
      )?.id ||
      SECONDARY_NAV.find(item => location.pathname.startsWith(item.path))?.id ||
      "home";

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "#0F0F0D", fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>

      {/* ── Night Mode style injection ── */}
      {isNight && (
        <style>{`
          .night-mode { background: #0A1A14 !important; }
          .night-mode .bg-white,
          .night-mode [class*="bg-white"],
          .night-mode [style*="background:#fff"],
          .night-mode [style*='background: #fff'] { background: #0D1F18 !important; }
          .night-mode body { background: #0A1A14 !important; }
          .night-mode p, .night-mode span, .night-mode div {
            color-scheme: dark;
          }
          /* Warmer text tones in night mode */
          .night-mode [style*="color:#1C3A2A"],
          .night-mode [style*="color: #1C3A2A"] { color: #DAD7D2 !important; }
          .night-mode [style*="color:#5A7A6A"],
          .night-mode [style*="color: #5A7A6A"] { color: #B8C4B8 !important; }
          .night-mode [style*="color:#3D5C4A"],
          .night-mode [style*="color: #3D5C4A"] { color: #C0CCBE !important; }
          /* Cooler card backgrounds */
          .night-mode [style*="background:#F9F6F0"],
          .night-mode [style*="background: #F9F6F0"],
          .night-mode [style*="background:#EDF5F0"],
          .night-mode [style*="background: #EDF5F0"] { background: #0D1F1A !important; }
          /* Pulsing corridor bottleneck animation */
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%       { opacity: 1.0; transform: scale(1.4); }
          }
          /* Page-level fade-in transition */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}
      {!isNight && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%       { opacity: 1.0; transform: scale(1.4); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}

      {/* ── Kids Mode + Elders Mode style injection ── */}
      {settings.kidsMode && (
        <style>{`
          body { font-size: 16px !important; overflow-x: hidden !important; }
          h1 { font-size: 26px !important; line-height: 1.3 !important; }
          p, span { line-height: 1.9 !important; }
          button, a { min-height: 48px !important; font-size: 15px !important; }
          .text-xs { font-size: 13px !important; }
          .text-sm { font-size: 15px !important; }
          /* No horizontal overflow on cards */
          .rounded-2xl, .rounded-xl { max-width: 100% !important; overflow: hidden !important; }
          /* Larger, readable icons */
          [style*="fontSize:"22px""] { font-size: 28px !important; }
          [style*="fontSize:"18px""] { font-size: 22px !important; }
          /* Clear tap targets */
          button, [role="button"], a { min-height: 48px !important; padding: 10px 14px !important; }
          /* Species cards in Kids Mode */
          .ee-kids-fact { font-size: 15px !important; line-height: 1.8 !important; }
        `}</style>
      )}
      {settings.eldersMode && (
        <style>{`
          body { font-size: 19px !important; background: #0F0F0D !important; overflow-x: hidden !important; }
          h1 { font-size: 34px !important; letter-spacing: -0.02em; line-height: 1.2 !important; }
          h2 { font-size: 26px !important; }
          p, span, li { font-size: 16px !important; line-height: 1.85 !important; }
          button, a { min-height: 56px !important; font-size: 17px !important;
            padding-left: 18px !important; padding-right: 18px !important; }
          input { font-size: 18px !important; min-height: 52px !important; }
          .text-xs { font-size: 14px !important; }
          .text-sm { font-size: 16px !important; }
          * { letter-spacing: 0.01em; }
          /* No overflow on cards */
          .rounded-2xl, .rounded-xl { max-width: 100% !important; overflow: hidden !important; }
          /* Navigation labels: ensure readability */
          nav button, nav a { font-size: 13px !important; gap: 6px !important; }
          /* High contrast muted tones */
          [style*="color:#9BB8A4"], [style*="color: #9BB8A4"] { color: #4A7C59 !important; }
          [style*="color:#7FAF8A"], [style*="color: #7FAF8A"] { color: #2D6A48 !important; }
          [style*="color:#C4BAA8"], [style*="color: #C4BAA8"] { color: #6A5A4A !important; }
          /* Ensure Field Mode works in Elders Mode */
          .min-h-screen { min-height: 100vh !important; }
        `}</style>
      )}

      {/* ── DESKTOP TOP NAV ── */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 shadow-sm sticky top-0 z-50"
        style={{ background: "#1C3A2A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4A7C59, #2D5A3D)" }}>
            <span style={{ fontSize: "14px" }}>🌿</span>
          </div>
          <div>
            <span className="font-bold tracking-tight" style={{ color: "#F0E9D6", fontSize: "17px", letterSpacing: "-0.02em" }}>
              EarthEye
            </span>
            <span className="ml-1 text-xs font-medium tracking-widest uppercase" style={{ color: "#7FAF8A", fontSize: "10px" }}>
              OC
            </span>
          </div>
        </div>

        {/* Primary nav */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeId;
            return (
              <button key={item.id} onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: active ? "rgba(127,175,138,0.18)" : "transparent",
                  color:      active ? "#A8D5B0" : "#9BB8A4",
                  fontSize: "14px", fontWeight: active ? "600" : "400",
                  border: "none", cursor: "pointer",
                }}>
                <span style={{ color: active ? "#A8D5B0" : "#7FAF8A" }}>{item.icon(active)}</span>
                {item.label}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          {/* Secondary nav (Corridors + Biomes) */}
          {SECONDARY_NAV.map(item => {
            const active = activeId === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: active ? "rgba(127,175,138,0.18)" : "transparent",
                  color:      active ? "#A8D5B0" : "#7FAF8A",
                  fontSize: "13px", fontWeight: active ? "600" : "400",
                  border: "none", cursor: "pointer",
                }}>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right side: search + night toggle */}
        <div className="flex items-center gap-2">
          <NightModeToggle compact />
        </div>
        {/* Right side: search + location */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/search")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
            style={{ background:"rgba(127,175,138,0.1)", border:"1px solid rgba(127,175,138,0.2)",
              cursor:"pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#7FAF8A" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ color:"#7FAF8A", fontSize:"13px" }}>Search</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(127,175,138,0.12)", border: "1px solid rgba(127,175,138,0.25)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#7FAF8A" }} />
            <span style={{ color: "#9BB8A4", fontSize: "12px", fontWeight: "500" }}>Orange County, CA</span>
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 pb-20 md:pb-0" style={{ animation:"fadeIn 0.15s ease-out" }}>
        <ErrorBoundary message="This surface encountered an error. Navigate to another page to continue.">
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* ── MOBILE BOTTOM NAV — EarthEye dark nav + Global Index ── */}
      <EarthEyeNav activeId={activeId} navigate={navigate} location={location} />

    </div>
  );
}