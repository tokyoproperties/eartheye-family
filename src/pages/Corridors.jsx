import { useState, useEffect, useRef } from "react";
import { Species } from "@/api/entities";
import { useNavigate, useParams } from "react-router-dom";

// ── Corridor definitions — the four canonical OC spines ──────────────────────
const CORRIDORS = [
  {
    id: "69e069445c7bb4cecf803289",
    name: "Mountains-to-Sea",
    type: "Interior Transect (North)",
    icon: "⛰",
    color: "#2D5A3D",
    accent: "#4A7C59",
    distance: "22 miles",
    direction: "N → S",
    origin: "Santiago Peak · 5,689 ft",
    terminus: "Newport Bay Saltmarsh",
    terminusIcon: "🦅",
    role: "The north interior spine. Every raindrop that falls on the Irvine Ranch flows through this corridor — from chaparral-cloaked foothills, through sage scrub benches, grassland openings, and riparian sycamore groves, until it exhales into the saltmarsh at the mouth of Newport Bay. This is the definitive OC transect: every biome in a single corridor.",
    watershedRole: "Primary drainage artery for north-central OC. The Santa Ana River watershed feeds this corridor's upper reach; the lower reach terminates at the ecological keystone of Newport Bay.",
    peakSeason: "October",
    peakNote: "Chaparral turns amber-gold. Newport Bay reaches maximum shorebird density — 35,000+ birds on the mudflats. The entire corridor is in simultaneous ecological peak.",
    biomes: [
      { label: "Chaparral",   icon: "🌾", desc: "Upper slopes — chamise, scrub oak, ceanothus" },
      { label: "Sage Scrub",  icon: "🌿", desc: "Midsection — California sagebrush, black sage" },
      { label: "Grassland",   icon: "🍃", desc: "Open benches — native bunchgrass, vernal pools" },
      { label: "Riparian",    icon: "🦋", desc: "Canyon floors — sycamore, willow, mulefat" },
      { label: "Freshwater",  icon: "💧", desc: "Seasonal streams and seeps" },
      { label: "Saltmarsh",   icon: "🦅", desc: "Terminus — cordgrass, pickleweed, mudflat" },
    ],
    keySpecies: ["California Gnatcatcher", "Belding's Savannah Sparrow", "Mountain Lion", "Mule Deer", "Coast Horned Lizard", "Elegant Tern"],
    sarCues: "Wide fire roads with sandy shoulders hold Mountain Lion tracks after rain. Coyote scat marks territory boundaries at junction points. Raptor convergence over the estuary marks the bay terminus.",
    connections: [
      { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay", note: "Shares the wetland terminus — the mountain's destination." },
      { id: "69e06ef8ae83438254c22903", name: "San Juan Creek", note: "Southern sibling — both interior transects bracket the OC watershed." },
    ],
  },
  {
    id: "69e0248656b58bca7d679d30",
    name: "Upper Newport Bay",
    type: "Wetland Terminus",
    icon: "🌊",
    color: "#1C4A5A",
    accent: "#2D7A8A",
    distance: "10.5 miles (loop)",
    direction: "Loop",
    origin: "Bluff Rim · 200 ft",
    terminus: "Pacific Estuary",
    terminusIcon: "🦆",
    role: "The wetland mouth — where the entire OC watershed exhales into the Pacific. Upper Newport Bay is the ecological terminus of multiple inland corridors. It is the highest-priority shorebird and waterfowl site in Southern California, the last significant coastal wetland between Los Angeles and San Diego, and the only habitat in the world for a significant portion of the global Belding's Savannah Sparrow population.",
    watershedRole: "The receiving basin for both the Santa Ana River drainage (north) and the Newport Valley drainages (inland). Water that fell on Santiago Peak ten days ago arrives here. The bay is the final ecological processor before the Pacific.",
    peakSeason: "October",
    peakNote: "Crimson pickleweed. 35,000+ shorebirds on the mudflats at low tide. The bay is a blur of dowitchers, godwits, willets, and sandpipers. Elegant Terns depart; ducks arrive. The light is gold.",
    biomes: [
      { label: "Tidal Channel", icon: "🌊", desc: "Eelgrass beds — nursery habitat for young fish" },
      { label: "Mudflat",       icon: "🦅", desc: "Low tide feeding grounds — invertebrate-rich" },
      { label: "Cordgrass",     icon: "🌾", desc: "Tidal fringe — Spartina fodens, native marsh grass" },
      { label: "Pickleweed",    icon: "🌿", desc: "High marsh — Salicornia, crimson in fall" },
      { label: "Freshwater",    icon: "💧", desc: "Freshwater seeps and seasonal marsh edges" },
      { label: "Coastal Bluff", icon: "⛰", desc: "Rim habitat — sage scrub, nesting raptors" },
    ],
    keySpecies: ["Belding's Savannah Sparrow", "Elegant Tern", "Long-billed Curlew", "Black-bellied Plover", "Ridgway's Rail", "Western Sandpiper"],
    sarCues: "Bay loop trail is wide and well-marked. Mudflat edges are unstable at low tide — do not cross. The bluff rim offers the best vantage for bird density counts. Tidal cycle determines wildlife activity — low tide is peak foraging.",
    connections: [
      { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea", note: "Shares its terminus — the creek that feeds this bay drains the Irvine Ranch chaparral." },
      { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", note: "Coastal sibling — basalt reef to this saltmarsh, two faces of the OC coast." },
    ],
  },
  {
    id: "69e005f2b447b8e1f109219e",
    name: "Crystal Cove Ridge-to-Sea",
    type: "Coastal Transect",
    icon: "🐚",
    color: "#2A4A6A",
    accent: "#3D6A8A",
    distance: "18 miles",
    direction: "E → W",
    origin: "Moro Ridge · 1,000 ft",
    terminus: "Basalt Intertidal Reef",
    terminusIcon: "🪨",
    role: "The coastal edge — the only corridor in OC that runs unbroken from backcountry chaparral to a functioning rocky intertidal reef. Crystal Cove preserves a rare coastal transect where the full gradient from inland scrubland to ocean is intact. The basalt reef at its terminus is one of the most species-rich intertidal zones in Southern California.",
    watershedRole: "A coastal-facing transect rather than a watershed corridor. Fog and marine influence penetrate inland along this route — creating a unique ecological gradient where maritime chaparral and interior sage scrub intermix. The reef receives no upstream freshwater — it is fed entirely by tidal exchange.",
    peakSeason: "October",
    peakNote: "Minus tides expose the full intertidal reef — best tidepooling of the year. Migrant raptors concentrate on the bluff. Bioluminescence in the surf zone on calm October nights. The backcountry is golden.",
    biomes: [
      { label: "Chaparral",     icon: "🌾", desc: "Upper inland slopes — maritime chaparral mix" },
      { label: "Riparian",      icon: "🦋", desc: "Moro Canyon floor — sycamore and willow gallery" },
      { label: "Sage Scrub",    icon: "🌿", desc: "Mid-slope — coastal sage scrub, buckwheat" },
      { label: "Coastal Bluff", icon: "⛰", desc: "Marine terrace — coreopsis, dudleya, lizardtail" },
      { label: "Cobble Beach",  icon: "🪨", desc: "Wave-worked cobble — kelp wrack, mole crabs" },
      { label: "Intertidal",    icon: "🐚", desc: "Basalt reef — ochre stars, chitons, turban snails" },
    ],
    keySpecies: ["Ochre Sea Star", "California Spiny Lobster", "Garibaldi", "Peregrine Falcon", "Coast Liveforever", "Giant Kelp"],
    sarCues: "Moro Canyon trail junction is a primary navigation point. Intertidal reef is hazardous in surge — red flag days are no-go. The beach is the most reliable exit point if inland trails are compromised. Cell service drops in canyon.",
    connections: [
      { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea", note: "North interior sibling — together they bracket the central OC biome." },
      { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay", note: "Saltmarsh terminus to this corridor's basalt reef — two faces of the OC coast." },
    ],
  },
  {
    id: "69e06ef8ae83438254c22903",
    name: "San Juan Creek",
    type: "Interior Transect (South)",
    icon: "🌳",
    color: "#3A2A1C",
    accent: "#7A5A3A",
    distance: "22 miles",
    direction: "N → S",
    origin: "Cleveland National Forest · 3,000 ft",
    terminus: "Doheny Estuary Mouth",
    terminusIcon: "🏖",
    role: "The south interior spine — the Juaneño corridor. San Juan Creek is the oldest ecological pathway in Orange County. Indigenous Acjachemen (Juaneño) communities traveled this corridor for ten thousand years, following the same route that Mountain Lions, deer, and neotropical migrants still use today. It runs from Cleveland National Forest's oak woodland heart to the mouth of the Pacific at Doheny State Beach, passing through the most biodiverse interior corridor in southern OC.",
    watershedRole: "Primary drainage for the south OC interior. The San Juan Creek watershed drains the south face of the Santa Ana Mountains — Caspers, O'Neill, and the Talega uplands all feed this system. The creek is one of the last functioning steelhead corridors in Southern California.",
    peakSeason: "October",
    peakNote: "Cottonwood gold in the canyon — the most dramatic fall color in OC. Shorebirds concentrate at the creek mouth. The oak woodland canopy is at peak richness. Steelhead trout begin their upstream run with the first fall rains.",
    biomes: [
      { label: "Chaparral",    icon: "🌾", desc: "Upper slopes — chamise, manzanita, yucca" },
      { label: "Oak Woodland", icon: "🌳", desc: "Mid-canyon — valley oak, coast live oak gallery" },
      { label: "Riparian",     icon: "🦋", desc: "Creek corridor — cottonwood, willow, alder" },
      { label: "Sage Scrub",   icon: "🌿", desc: "Lower canyon — California sagebrush, black sage" },
      { label: "Freshwater",   icon: "💧", desc: "Perennial creek — one of OC's last steelhead runs" },
      { label: "Estuary",      icon: "🦅", desc: "Terminus — creek mouth, shorebird congregation" },
    ],
    keySpecies: ["Steelhead Trout", "Mountain Lion", "Least Bell's Vireo", "Valley Oak", "Western Pond Turtle", "Acorn Woodpecker"],
    sarCues: "San Juan Creek floods rapidly in rain events — check upstream conditions. Canyon narrows at Hot Spring area are a navigation chokepoint. The oak woodland section has the densest wildlife sign — tracks in creek mud, scat on sandstone outcrops. Multiple trail junction points require map.",
    connections: [
      { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea", note: "Northern sibling — both interior transects bracket the OC watershed." },
      { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay", note: "Northern wetland sibling — both corridors terminate in tidal systems." },
    ],
  },
];


// ── Peak month index for Seasonal Atlas linking ───────────────────────────────
const PEAK_MONTH_INDEX = {
  "69e069445c7bb4cecf803289": 9,  // Mountains-to-Sea → October
  "69e0248656b58bca7d679d30": 9,  // Upper Newport Bay → October (also Jan peak)
  "69e005f2b447b8e1f109219e": 9,  // Crystal Cove → October (also Feb minus tides)
  "69e06ef8ae83438254c22903": 9,  // San Juan Creek → October
};

const SEASONAL_MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const MONTH_SEASON = { 0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter" };
const SEASON_ICONS = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };

// ── Corridor card (list view) ────────────────────────────────────────────────
function CorridorCard({ corridor, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-2xl p-5 mb-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{ background: corridor.color, border: `1px solid ${corridor.accent}50`,
        boxShadow: `0 4px 20px ${corridor.color}40`, cursor: "pointer" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span style={{ fontSize: "20px" }}>{corridor.icon}</span>
            <span style={{ color: corridor.accent, fontSize: "10px", fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {corridor.type}
            </span>
          </div>
          <div className="font-bold mb-1" style={{ color: "#F0E9D6", fontSize: "18px", letterSpacing: "-0.01em" }}>
            {corridor.name}
          </div>
          <div style={{ color: "#9BB8A4", fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
            {corridor.origin} → {corridor.terminus}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ color: corridor.accent, fontSize: "12px" }}>{corridor.distance}</span>
            <span style={{ color: "rgba(255,255,255,0.50)", fontSize: "12px" }}>{corridor.direction}</span>
            <span style={{ color: "#D4883A", fontSize: "12px" }}>🍂 Peak: {corridor.peakSeason}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ fontSize: "24px" }}>{corridor.terminusIcon}</div>
          <div style={{ color: "rgba(255,255,255,0.50)", fontSize: "9px", marginTop: "4px",
            textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {corridor.terminus.split(" ")[0]}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Corridor detail view ─────────────────────────────────────────────────────
function CorridorDetail({ corridor, onBack, navigate }) {
  const [activeSpecies, setActiveSpecies] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const currentSeason = MONTH_SEASON[new Date().getMonth()];

  useEffect(() => {
    Species.filter({}).then(all => {
      const onCorridor = all.filter(s => s.trail?.includes(corridor.id));
      setActiveSpecies(onCorridor);
      setLoadingSpecies(false);
    });
  }, [corridor.id]);

  const activeNow = activeSpecies.filter(s => {
    const seasons = (s.seasonPresence || []).map(x => x.toLowerCase());
    return seasons.length === 0 || seasons.length >= 4 || seasons.includes(currentSeason);
  });

  const rareSpecies = activeNow.filter(s =>
    s.conservationStatus &&
    !["stable", "widespread", "common", ""].includes(s.conservationStatus.toLowerCase())
  );

  return (
    <div>
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 mb-5 transition-opacity hover:opacity-70"
        style={{ color: "#7FAF8A", fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        All Corridors
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-6 mb-4"
        style={{ background: corridor.color, border: `1px solid ${corridor.accent}50`,
          boxShadow: `0 8px 32px ${corridor.color}50` }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: "10px", color: corridor.accent, fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Canonical Corridor · {corridor.type}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "32px" }}>{corridor.icon}</span>
          <h1 className="font-bold" style={{ color: "#F0E9D6", fontSize: "22px", letterSpacing: "-0.02em" }}>
            {corridor.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: `${corridor.accent}30`, color: "#C4DFC8", border: `1px solid ${corridor.accent}50` }}>
            {corridor.distance}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: `${corridor.accent}30`, color: "#C4DFC8", border: `1px solid ${corridor.accent}50` }}>
            {corridor.direction}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(212,136,58,0.2)", color: "#D4883A", border: "1px solid rgba(212,136,58,0.35)" }}>
            🍂 Peak: {corridor.peakSeason}
          </span>
        </div>
        <div style={{ color: "#9BB8A4", fontSize: "13px" }}>
          {corridor.origin} → {corridor.terminus} {corridor.terminusIcon}
        </div>
      </div>

      {/* Ecological role */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>🔬</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Ecological Role</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,0.70)", fontSize: "14px", lineHeight: "1.75" }}>{corridor.role}</p>
      </div>

      {/* Watershed role */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>💧</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Watershed Role</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: "1.7" }}>{corridor.watershedRole}</p>
      </div>

      {/* Biome arc */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span>🗺</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Biome Arc</h2>
        </div>
        <div className="space-y-2">
          {corridor.biomes.map((b, i) => (
            <div key={b.label} className="flex items-start gap-3">
              <div className="flex items-center gap-1 flex-shrink-0 w-6">
                {i < corridor.biomes.length - 1 && (
                  <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.12)", position: "absolute", top: "100%", left: "50%" }} />
                )}
                <span style={{ fontSize: "14px" }}>{b.icon}</span>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.70)", fontFamily: "Georgia,serif", fontSize: "12px", fontWeight: "400" }}>{b.label}</div>
                <div style={{ color: "#7FAF8A", fontSize: "11px" }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Here Now */}
      <div className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.2)" }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#7FAF8A" }} />
            <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
              letterSpacing: "0.1em", textTransform: "uppercase" }}>Active Here Now</span>
          </div>
          <div style={{ color: "#C4DFC8", fontSize: "15px", fontWeight: "700" }}>
            {loadingSpecies ? "—" : `${activeNow.length} species this ${currentSeason}`}
          </div>
          {rareSpecies.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 mt-2"
              style={{ background: "rgba(138,58,42,0.2)", border: "1px solid rgba(138,58,42,0.35)" }}>
              <span style={{ fontSize: "12px" }}>⚠️</span>
              <span style={{ color: "#D4A898", fontSize: "11px" }}>
                {rareSpecies.length} at-risk · {rareSpecies.slice(0, 2).map(s => s.name).join(", ")}
                {rareSpecies.length > 2 ? ` +${rareSpecies.length - 2}` : ""}
              </span>
            </div>
          )}
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          {activeNow.slice(0, 6).map(s => (
            <button key={s.id} onClick={() => navigate(`/SpeciesDetail?id=${s.id}`)}
              className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,175,138,0.08)", cursor: "pointer" }}>
              <div style={{ color: "#C4DFC8", fontSize: "12px", fontWeight: "600", flex: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.50)", fontSize: "10px", flexShrink: 0, textTransform: "capitalize" }}>
                {s.group}
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3A5A4A" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
          <button onClick={() => navigate(`/TrailDetail?id=${corridor.id}`)}
            className="w-full py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(127,175,138,0.08)", color: "#7FAF8A",
              border: "1px solid rgba(127,175,138,0.15)", cursor: "pointer" }}>
            Open full trail detail →
          </button>
        </div>
      </div>

      {/* Peak season + Seasonal Atlas link */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "rgba(212,136,58,0.08)", border: "1px solid rgba(212,136,58,0.25)" }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: "18px" }}>🍂</span>
          <div className="flex-1">
            <div style={{ color: "#D4883A", fontSize: "11px", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
              Peak Season · {corridor.peakSeason}
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>{corridor.peakNote}</div>
            <button
              onClick={() => navigate("/seasonal")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: "rgba(212,136,58,0.18)", border: "1px solid rgba(212,136,58,0.35)",
                cursor: "pointer", fontSize: "12px", color: "#D4883A", fontWeight: "600" }}>
              <span style={{ fontSize: "13px" }}>📅</span>
              View {corridor.peakSeason} in Seasonal Atlas →
            </button>
          </div>
        </div>
      </div>

      {/* SAR cues */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: "#1C3A2A", border: "1px solid rgba(127,175,138,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>🔭</span>
          <h2 style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>SAR Field Cues</h2>
        </div>
        <p style={{ color: "#C4DFC8", fontSize: "13px", lineHeight: "1.7" }}>{corridor.sarCues}</p>
      </div>

      {/* Connected corridors */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>🔗</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Connected Corridors</h2>
        </div>
        <div className="space-y-2">
          {corridor.connections.map(c => (
            <button key={c.id} onClick={() => navigate(`/corridors/${c.id}`)}
              className="w-full text-left rounded-xl p-3 transition-all hover:opacity-80"
              style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: "400" }}>{c.name}</div>
                  <div style={{ color: "#7FAF8A", fontSize: "11px", marginTop: "2px" }}>{c.note}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FAF8A" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex gap-2">
        <button onClick={() => navigate(`/TrailDetail?id=${corridor.id}`)}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#1A1A17", border: "1px solid rgba(122,184,122,0.25)", color: "rgba(255,255,255,0.88)", cursor: "pointer" }}>
          Full Trail Detail →
        </button>
        <button onClick={() => navigate("/map")}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
          Biome Map
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Corridors() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const active    = id ? CORRIDORS.find(c => c.id === id) : null;

  // ── Scroll restore ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      const saved = sessionStorage.getItem("corridorsScroll");
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
          sessionStorage.removeItem("corridorsScroll");
        });
      }
      return () => { sessionStorage.setItem("corridorsScroll", window.scrollY); };
    }
  }, [id]);

  // Watershed overview stats
  const totalBiomes     = 7; // unique biomes across all four corridors
  const totalDistance   = "72+ miles combined";
  const elevationRange  = "0 – 5,689 ft";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 md:max-w-3xl">

      {active ? (
        <CorridorDetail
          corridor={active}
          onBack={() => navigate("/corridors")}
          navigate={navigate}
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#7FAF8A" }} />
              <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
                letterSpacing: "0.1em", textTransform: "uppercase" }}>OC Watershed Spines</span>
            </div>
            <h1 className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.90)", fontFamily: "Georgia,serif", fontWeight: "400", fontSize: "26px", letterSpacing: "-0.01em" }}>
              Canonical Corridors
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
              Four ecological spines — from Santiago Peak to the Pacific
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: "Combined distance", value: "72+ mi" },
              { label: "Biomes spanned",    value: `${totalBiomes} biomes` },
              { label: "Elevation range",   value: "5,689 ft" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(28,58,42,0.08)", border: "1px solid rgba(127,175,138,0.15)" }}>
                <div style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Georgia,serif", fontSize: "18px", fontWeight: "400" }}>{s.value}</div>
                <div style={{ color: "#7FAF8A", fontSize: "9px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Watershed thesis */}
          <div className="rounded-2xl p-4 mb-5"
            style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.15)" }}>
            <div className="flex flex-col items-center mb-3">
              <div className="px-3 py-1.5 rounded-lg text-xs mb-1"
                style={{ background: "rgba(74,124,89,0.2)", color: "#A8D5B0", border: "1px solid rgba(74,124,89,0.35)" }}>
                ⛰ Santiago Peak · 5,689 ft · origin of all four corridors
              </div>
              <div style={{ color: "rgba(255,255,255,0.30)", fontSize: "13px" }}>↓</div>
              <div style={{ color: "rgba(255,255,255,0.50)", fontSize: "11px", textAlign: "center", maxWidth: "280px" }}>
                Every raindrop that falls on Santiago Peak finds the Pacific through one of four primary corridors
              </div>
              <div style={{ color: "rgba(255,255,255,0.30)", fontSize: "13px" }}>↓</div>
              <div className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(45,90,106,0.3)", color: "#7FBFCF", border: "1px solid rgba(45,90,106,0.5)" }}>
                🌊 Pacific Ocean
              </div>
            </div>
          </div>

          {/* Corridor cards */}
          {CORRIDORS.map(c => (
            <CorridorCard key={c.id} corridor={c} onClick={() => navigate(`/corridors/${c.id}`)} />
          ))}

          {/* Bottom nav */}
          <div className="flex gap-2 mt-2">
            <button onClick={() => navigate("/map")}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
              style={{ background: "#1C3A2A", color: "#A8D5B0", border: "1px solid #4A7C59", cursor: "pointer" }}>
              Biome Map
            </button>
            <button onClick={() => navigate("/trails")}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
              All Trails
            </button>
          </div>
        </>
      )}
    </div>
  );
}