import { useState, useEffect, useMemo, useRef } from "react";
import LogSighting from "./LogSighting";
import { logTrailVisit } from "./Journal";
import { Trail, Species, Observation } from "@/api/entities";
import { useSearchParams, useNavigate, useParams, useLocation } from "react-router-dom";

// ── Helpers ──────────────────────────────────────────────────────────────────
const SECTION = ({ icon, title, children, accent }) => (
  <div className="rounded-2xl p-5 mb-4"
    style={{ background: accent ? "rgba(28,58,42,0.35)" : "#1A1A17", border: accent ? "1px solid rgba(122,184,122,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h2 className="font-semibold" style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent ? "#7AB87A" : "rgba(255,255,255,0.35)" }}>{title}</h2>
    </div>
    <div style={{ color: accent ? "#C4DFC8" : "#3D5C4A", fontSize: "14px", lineHeight: "1.75", whiteSpace: "pre-line" }}>{children}</div>
  </div>
);

const DIFF = {
  easy:      { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  moderate:  { bg: "rgba(196,151,74,0.12)", text: "#C4974A", border: "rgba(196,151,74,0.30)" },
  hard:      { bg: "#FCE4EC", text: "#C62828", border: "#EF9A9A" },
  strenuous: { bg: "#F3E5F5", text: "#6A1B9A", border: "#CE93D8" },
};

const STATUS_COLORS = {
  "of concern":            { bg: "rgba(196,151,74,0.12)", text: "#C4974A" },
  threatened:              { bg: "rgba(196,122,122,0.12)", text: "#C47A7A" },
  endangered:              { bg: "#FCE4EC", text: "#C62828" },
  "critically endangered": { bg: "#F3E5F5", text: "#6A1B9A" },
};

const GROUP_ICONS = {
  birds: "🦅", bird: "🦅",
  plants: "🌿", plant: "🌿",
  mammals: "🦊", mammal: "🦊",
  "reptiles/amphibians": "🦎", reptiles: "🦎", reptile: "🦎",
  fish: "🐟",
  insects: "🦋", insect: "🦋",
  "marine/intertidal": "🌊", marine: "🌊",
  "fungi/lichens": "🍄", fungi: "🍄",
};

// Month → season mapping
const MONTH_SEASON = {
  0: "winter", 1: "winter", 2: "spring",
  3: "spring", 4: "spring", 5: "summer",
  6: "summer", 7: "summer", 8: "fall",
  9: "fall",  10: "fall",  11: "winter",
};

const SEASON_LABELS = { spring: "Spring", summer: "Summer", fall: "Fall", winter: "Winter" };
const SEASON_ICONS  = { spring: "🌸", summer: "☀️", fall: "🍂", winter: "🌧" };

const PEAK_LABELS = {
  "69e069445c7bb4cecf803289": { label: "October", note: "Chaparral golden · Bay at max diversity" },
  "69e0248656b58bca7d679d30": { label: "October", note: "Crimson pickleweed · 35K shorebirds" },
  "69e005f2b447b8e1f109219e": { label: "October", note: "Bioluminescence · Minus tides · Raptors" },
  "69e06ef8ae83438254c22903": { label: "October", note: "Cottonwood gold · Creek mouth shorebirds" },
  "69e0289d7669e7f23c9f9c4b": { label: "October", note: "Cottonwood gold corridor through the city" },
};

const CANONICAL = {
  "69e069445c7bb4cecf803289": {
    badge: "OC Spine Trail · 22 Miles", type: "Interior Transect (North)",
    role: "The north interior spine — foothills to Newport Bay estuary across every OC biome.",
    biomes: [{ label: "Chaparral", icon: "🌾" }, { label: "Sage Scrub", icon: "🌿" }, { label: "Grassland", icon: "🍃" }, { label: "Riparian", icon: "🦋" }, { label: "Freshwater", icon: "💧" }, { label: "Saltmarsh", icon: "🦅" }, { label: "Mudflat", icon: "🌊" }],
    crossLinks: [
      { id: "69e0248656b58bca7d679d30", label: "Upper Newport Bay Loop", note: "Shares the wetland terminus — the mountain's destination." },
      { id: "69e06ef8ae83438254c22903", label: "San Juan Creek Trail", note: "The southern sibling — both transects bracket the OC watershed." },
    ],
  },
  "69e0248656b58bca7d679d30": {
    badge: "Wetland Terminus · Back Bay Loop", type: "Coastal Wetland",
    role: "The wetland mouth — where the entire OC watershed exhales into the Pacific.",
    biomes: [{ label: "Tidal Channel", icon: "🌊" }, { label: "Mudflat", icon: "🦅" }, { label: "Cordgrass", icon: "🌾" }, { label: "Pickleweed", icon: "🌿" }, { label: "Freshwater", icon: "💧" }, { label: "Sage Scrub", icon: "🍃" }, { label: "Coastal Bluff", icon: "⛰" }],
    crossLinks: [
      { id: "69e069445c7bb4cecf803289", label: "Mountains-to-Sea Trail", note: "Shares its terminus — the creek that feeds this bay drains the Irvine Ranch chaparral." },
    ],
  },
  "69e005f2b447b8e1f109219e": {
    badge: "Coastal Transect · Ridge to Reef", type: "Coastal Transect",
    role: "The coastal edge — backcountry chaparral to basalt reef.",
    biomes: [{ label: "Chaparral", icon: "🌾" }, { label: "Riparian", icon: "🦋" }, { label: "Sage Scrub", icon: "🌿" }, { label: "Coastal Bluff", icon: "⛰" }, { label: "Cobble Beach", icon: "🪨" }, { label: "Intertidal", icon: "🐚" }, { label: "Subtidal Reef", icon: "🌊" }],
    crossLinks: [
      { id: "69e069445c7bb4cecf803289", label: "Mountains-to-Sea Trail", note: "The north interior transect — together they bracket the central OC biome." },
      { id: "69e0248656b58bca7d679d30", label: "Upper Newport Bay Loop", note: "Saltmarsh terminus to this corridor's basalt reef." },
    ],
  },
  "69e06ef8ae83438254c22903": {
    badge: "Juaneño Corridor · Headwaters to Sea", type: "Interior Transect (South)",
    role: "The south interior spine — Juaneño corridor from Cleveland NF to Doheny.",
    biomes: [{ label: "Chaparral", icon: "🌾" }, { label: "Oak Woodland", icon: "🌳" }, { label: "Riparian", icon: "🦋" }, { label: "Sage Scrub", icon: "🌿" }, { label: "Freshwater", icon: "💧" }, { label: "Estuary", icon: "🦅" }, { label: "Ocean", icon: "🌊" }],
    crossLinks: [
      { id: "69e069445c7bb4cecf803289", label: "Mountains-to-Sea Trail", note: "The northern sibling — both interior transects bracket the OC watershed." },
      { id: "69e0289d7669e7f23c9f9c4b", label: "Santiago Creek Trail", note: "The urban sibling — the creek corridor that threads through the city core." },
    ],
  },
  "69e0289d7669e7f23c9f9c4b": {
    badge: "Urban-to-Wild Corridor · 14 Miles", type: "Urban Riparian",
    role: "The honest corridor — wildlife movement through the urban core of central OC.",
    biomes: [{ label: "Riparian", icon: "🦋" }, { label: "Oak Woodland", icon: "🌳" }, { label: "Urban Edge", icon: "🦊" }, { label: "Cottonwood", icon: "🍂" }, { label: "Freshwater", icon: "💧" }, { label: "River Confluence", icon: "🌊" }],
    crossLinks: [
      { id: "69e06ef8ae83438254c22903", label: "San Juan Creek Trail", note: "The south interior sibling — both corridors carry the watershed to the sea through a city." },
      { id: "69e069445c7bb4cecf803289", label: "Mountains-to-Sea Trail", note: "The north wilderness sibling — the contrast defines both corridors." },
    ],
  },
};

const HABITAT_ICONS = {
  "chaparral": "🌾", "coastal sage scrub": "🌿", "sage scrub": "🌿", "oak woodland": "🌳",
  "riparian": "🦋", "riparian corridor": "🦋", "salt marsh": "🦅", "saltmarsh": "🦅",
  "tidal": "🌊", "mudflat": "🦅", "intertidal": "🐚", "tidepools": "🐚",
  "beach": "🏖", "coastal bluff": "⛰", "freshwater": "💧", "freshwater marsh": "💧",
  "grassland": "🍃", "urban": "🦊", "urban edge": "🦊", "oak": "🌳",
};


// ── Trail Mood Banner (MG-02) ─────────────────────────────────────────────────
// A lightweight habitat-keyed visual texture that gives each trail its emotional register.
// Uses curated Wikimedia Commons images matched to habitat types.
const HABITAT_IMAGES = {
  "chaparral":           "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Chaparral_in_Santa_Monica_Mountains.jpg/640px-Chaparral_in_Santa_Monica_Mountains.jpg",
  "coastal sage scrub":  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Coastal_sage_scrub_-_Wikimedia.jpg/640px-Coastal_sage_scrub_-_Wikimedia.jpg",
  "sage scrub":          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Coastal_sage_scrub_-_Wikimedia.jpg/640px-Coastal_sage_scrub_-_Wikimedia.jpg",
  "oak woodland":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Southern_Oak_Woodland.jpg/640px-Southern_Oak_Woodland.jpg",
  "riparian":            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Riparian_habitat_California.jpg/640px-Riparian_habitat_California.jpg",
  "riparian corridor":   "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Riparian_habitat_California.jpg/640px-Riparian_habitat_California.jpg",
  "salt marsh":          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Bolsa_Chica_Ecological_Reserve.jpg/640px-Bolsa_Chica_Ecological_Reserve.jpg",
  "saltmarsh":           "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Bolsa_Chica_Ecological_Reserve.jpg/640px-Bolsa_Chica_Ecological_Reserve.jpg",
  "tidal":               "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Upper_Newport_Bay_Ecological_Reserve.jpg/640px-Upper_Newport_Bay_Ecological_Reserve.jpg",
  "mudflat":             "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Upper_Newport_Bay_Ecological_Reserve.jpg/640px-Upper_Newport_Bay_Ecological_Reserve.jpg",
  "intertidal":          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Crystal_Cove_State_Park_tidepools.jpg/640px-Crystal_Cove_State_Park_tidepools.jpg",
  "tidepools":           "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Crystal_Cove_State_Park_tidepools.jpg/640px-Crystal_Cove_State_Park_tidepools.jpg",
  "beach":               "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Laguna_Beach_California.jpg/640px-Laguna_Beach_California.jpg",
  "coastal bluff":       "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Dana_Point_Headlands.jpg/640px-Dana_Point_Headlands.jpg",
  "grassland":           "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/California_grassland.jpg/640px-California_grassland.jpg",
  "mountains":           "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Saddleback_Mountain_Orange_County.jpg/640px-Saddleback_Mountain_Orange_County.jpg",
};

const HABITAT_GRADIENT = {
  "chaparral":         "linear-gradient(to bottom, rgba(74,92,42,0.5), rgba(28,58,42,0.92))",
  "coastal sage scrub":"linear-gradient(to bottom, rgba(74,92,42,0.5), rgba(28,58,42,0.92))",
  "sage scrub":        "linear-gradient(to bottom, rgba(74,92,42,0.5), rgba(28,58,42,0.92))",
  "oak woodland":      "linear-gradient(to bottom, rgba(42,74,42,0.5), rgba(28,58,28,0.92))",
  "riparian":          "linear-gradient(to bottom, rgba(42,90,60,0.5), rgba(20,52,36,0.92))",
  "riparian corridor": "linear-gradient(to bottom, rgba(42,90,60,0.5), rgba(20,52,36,0.92))",
  "salt marsh":        "linear-gradient(to bottom, rgba(28,58,74,0.5), rgba(15,30,50,0.92))",
  "saltmarsh":         "linear-gradient(to bottom, rgba(28,58,74,0.5), rgba(15,30,50,0.92))",
  "tidal":             "linear-gradient(to bottom, rgba(28,74,90,0.5), rgba(15,40,60,0.92))",
  "mudflat":           "linear-gradient(to bottom, rgba(28,74,90,0.5), rgba(15,40,60,0.92))",
  "intertidal":        "linear-gradient(to bottom, rgba(28,90,100,0.5), rgba(15,50,70,0.92))",
  "tidepools":         "linear-gradient(to bottom, rgba(28,90,100,0.5), rgba(15,50,70,0.92))",
  "beach":             "linear-gradient(to bottom, rgba(100,90,60,0.5), rgba(40,60,80,0.92))",
  "coastal bluff":     "linear-gradient(to bottom, rgba(60,80,100,0.5), rgba(30,50,70,0.92))",
  "grassland":         "linear-gradient(to bottom, rgba(90,100,42,0.45), rgba(40,60,28,0.92))",
  "mountains":         "linear-gradient(to bottom, rgba(58,42,28,0.5), rgba(30,22,14,0.92))",
};

function TrailMoodBanner({ trail }) {
  const [imgState, setImgState] = useState("loading");
  
  const habitats = (trail.habitatTypes || []).map(h => h.toLowerCase());
  const matchedHabitat = habitats.find(h => HABITAT_IMAGES[h]) || null;
  
  // Hero image takes priority; fall back to habitat-keyed image
  const heroSrc = trail.heroImage || null;
  const fallbackSrc = matchedHabitat ? HABITAT_IMAGES[matchedHabitat] : null;
  const imgSrc = heroSrc || fallbackSrc;
  const isHero = !!heroSrc;
  
  const gradient = matchedHabitat
    ? (HABITAT_GRADIENT[matchedHabitat] || HABITAT_GRADIENT["chaparral"])
    : "linear-gradient(to bottom, rgba(28,58,42,0.5), rgba(15,30,20,0.92))";

  if (!imgSrc) return null;

  return (
    <div className="w-full rounded-2xl overflow-hidden mb-4"
      style={{ height: isHero ? "280px" : "180px", position: "relative", background: "#0F2218" }}>
      {/* Fallback gradient always present */}
      <div className="absolute inset-0" style={{ background: gradient }} />
      {/* Photo */}
      {imgState !== "error" && (
        <img
          src={imgSrc}
          alt={trail.name}
          onLoad={() => setImgState("ok")}
          onError={() => setImgState("error")}
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover", objectPosition: "center 40%",
            opacity: imgState === "ok" ? (isHero ? 1 : 0.5) : 0,
            transition: "opacity 0.7s",
          }}
        />
      )}
      {/* Deep vignette — bottom-heavy for text legibility */}
      <div className="absolute inset-0" style={{
        background: isHero
          ? "linear-gradient(to bottom, rgba(10,20,14,0.1) 0%, transparent 30%, rgba(10,20,14,0.88) 100%)"
          : "linear-gradient(to bottom, transparent 25%, rgba(10,20,14,0.9) 100%)",
        opacity: imgState === "ok" ? 1 : 0,
        transition: "opacity 0.7s",
      }} />
      {/* Trail name + habitat tags — overlaid at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-10">
        {/* Habitat pills */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {habitats.slice(0, 3).map((h, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                color: "rgba(200,230,210,0.9)", fontSize: "9px", fontWeight: "600",
                border: "1px solid rgba(255,255,255,0.12)", letterSpacing: "0.04em",
                textTransform: "uppercase" }}>
              {HABITAT_ICONS[h] || "🌿"} {h}
            </span>
          ))}
        </div>
        {/* Trail name */}
        <div style={{ color: "rgba(168,213,176,0.75)", fontSize: "10px", fontWeight: "700",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>
          {trail.jurisdiction || "Orange County"}
        </div>
        <div style={{ color: "#F0E9D6", fontSize: "22px", fontWeight: "800",
          letterSpacing: "-0.02em", textShadow: "0 2px 14px rgba(0,0,0,0.7)",
          lineHeight: 1.2 }}>
          {trail.name}
        </div>
      </div>
    </div>
  );
}

// ── Species thumbnail ────────────────────────────────────────────────────────
function SpeciesThumb({ src, name, group, size = 48 }) {
  const [err, setErr] = useState(false);
  const icon = GROUP_ICONS[group?.toLowerCase()] || "🌱";
  return !src || err ? (
    <div className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: "#1C3A2A", fontSize: size * 0.45, borderRadius: 8, display:"flex", alignItems:"center", justifyContent:"center" }}>
      {icon}
    </div>
  ) : (
    <img src={src} alt={name} loading="lazy" onError={() => setErr(true)}
      className="rounded-xl object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  );
}

// ── "What's Active Here" panel ───────────────────────────────────────────────
// ── Trail Sighting Summary ────────────────────────────────────────────────────
function TrailSightingSummary({ trailId, trailName, navigate }) {
  const [obs, setObs]         = useState([]);
  const [loading, setLoading] = useState(true);

  const MONTH_SEASON_MAP = {
    0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
    5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter"
  };
  const SEASON_COLORS_MAP = {
    spring: "#4A9A5A", summer: "#D4883A", fall: "#8A5A2A", winter: "#3A6A9A"
  };
  const SEASON_ICONS_MAP = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
  const MONTH_LABELS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const currentSeason = MONTH_SEASON_MAP[new Date().getMonth()];
  const currentMonth  = new Date().getMonth();

  useEffect(() => {
    if (!trailId) { setLoading(false); return; }
    Observation.filter({ trailId })
      .then(results => { setObs(results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trailId]);

  if (loading) return null;
  if (obs.length === 0) return (
    <div className="rounded-2xl p-4 mb-4"
      style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: "13px" }}>👁</span>
        <span style={{ color: "#5C7A6A", fontSize: "11px", fontWeight: "700",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>Atlas Sightings</span>
      </div>
      <div style={{ color: "#9BB8A4", fontSize: "12px" }}>
        No sightings logged on this trail yet. Be the first.
      </div>
    </div>
  );

  // Aggregate by species
  const bySpecies = {};
  obs.forEach(o => {
    if (!bySpecies[o.speciesId]) bySpecies[o.speciesId] = { name: o.speciesName, count: 0, months: [], seasons: new Set() };
    bySpecies[o.speciesId].count++;
    bySpecies[o.speciesId].months.push(o.month);
    if (o.season) bySpecies[o.speciesId].seasons.add(o.season);
  });
  const topSpecies = Object.values(bySpecies).sort((a,b) => b.count - a.count).slice(0, 5);

  // Monthly bar
  const monthCounts = Array(12).fill(0);
  obs.forEach(o => { if (o.month != null) monthCounts[o.month]++; });
  const maxMonth = Math.max(...monthCounts, 1);

  // Season breakdown
  const seasonCounts = { spring: 0, summer: 0, fall: 0, winter: 0 };
  obs.forEach(o => { if (o.season && seasonCounts[o.season] !== undefined) seasonCounts[o.season]++; });

  // Unique species count
  const uniqueSpecies = Object.keys(bySpecies).length;

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: "#0F1E15", border: "1px solid rgba(127,175,138,0.2)" }}>
      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "13px" }}>👁</span>
            <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "0.08em" }}>Atlas Sightings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full"
              style={{ background: "rgba(74,124,89,0.2)", color: "#A8D5B0",
                fontSize: "11px", fontWeight: "600", border: "1px solid rgba(74,124,89,0.3)" }}>
              {obs.length} logged
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Total logs", value: obs.length },
            { label: "Species", value: uniqueSpecies },
            { label: "This season", value: seasonCounts[currentSeason] || 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-3 py-2 text-center"
              style={{ background: "rgba(127,175,138,0.07)", border: "1px solid rgba(127,175,138,0.1)" }}>
              <div style={{ color: "#F0E9D6", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div style={{ color: "#5C8A6A", fontSize: "10px", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Monthly activity bar */}
        <div className="mb-3">
          <div style={{ color: "#5C8A6A", fontSize: "10px", fontWeight: "600",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            Activity by month
          </div>
          <div className="flex gap-0.5 items-end" style={{ height: "28px" }}>
            {monthCounts.map((c, i) => {
              const isCurrent = i === currentMonth;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-sm"
                    style={{
                      height: `${Math.max(2, (c / maxMonth) * 20)}px`,
                      background: isCurrent ? "#4A7C59" : c > 0 ? "#7FAF8A" : "#1C3A2A",
                      opacity: c > 0 ? 1 : 0.4,
                    }} />
                  <div style={{ fontSize: "6px", color: isCurrent ? "#7FAF8A" : "#2A4A3A" }}>
                    {MONTH_LABELS[i]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top observed species */}
        {topSpecies.length > 0 && (
          <div>
            <div style={{ color: "#5C8A6A", fontSize: "10px", fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Most observed
            </div>
            <div className="space-y-1.5">
              {topSpecies.map((sp, i) => (
                <div key={sp.name} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                  style={{ background: "rgba(127,175,138,0.06)", border: "1px solid rgba(127,175,138,0.1)" }}>
                  <div style={{ color: "#3A5A4A", fontSize: "11px", fontWeight: "700",
                    width: "14px", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div style={{ color: "#C4DFC8", fontSize: "12px", fontWeight: "600" }}>{sp.name}</div>
                    <div className="flex gap-1.5 mt-0.5">
                      {Array.from(sp.seasons).map(s => (
                        <span key={s} style={{ fontSize: "10px", color: SEASON_COLORS_MAP[s] || "#7FAF8A" }}>
                          {SEASON_ICONS_MAP[s] || ""} {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ color: "#4A7C59", fontSize: "12px", fontWeight: "700",
                    flexShrink: 0 }}>
                    ×{sp.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ color: "#2A4A3A", fontSize: "10px", marginTop: "10px" }}>
          Anonymous · no accounts · community-sourced
        </div>
      </div>
    </div>
  );
}


// ── Trail Species Grid ────────────────────────────────────────────────────────
function TrailSpeciesGrid({ trailId, trailName, trailSpeciesIds, navigate, initialExpanded }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(!!initialExpanded);

  useEffect(() => {
    if (!trailId) { setLoading(false); return; }
    // Query species that list this trail in their trail[] array
    Species.filter({}).then(all => {
      const filtered = all.filter(s =>
        s.trail?.includes(trailId) ||
        (trailSpeciesIds?.length && trailSpeciesIds.includes(s.id))
      );
      // Sort: rare first, then alpha
      filtered.sort((a, b) => {
        const rareA = a.conservationStatus && !["stable","widespread","common","not evaluated",""].includes((a.conservationStatus||"").toLowerCase()) ? 0 : 1;
        const rareB = b.conservationStatus && !["stable","widespread","common","not evaluated",""].includes((b.conservationStatus||"").toLowerCase()) ? 0 : 1;
        if (rareA !== rareB) return rareA - rareB;
        return a.name.localeCompare(b.name);
      });
      setSpeciesList(filtered);
      setLoading(false);
    });
  }, [trailId, trailSpeciesIds]);

  if (loading) return null;
  if (!speciesList.length) return null;

  const STATUS_DOT = { threatened: "#FF8C00", endangered: "#DC143C", "critically endangered": "#8B008B", "of concern": "#DAA520", sensitive: "#CD853F", "species of special concern": "#CD853F" };
  const DISPLAY_COUNT = 18;
  const display = expanded ? speciesList : speciesList.slice(0, DISPLAY_COUNT);

  const encodedTrailName = encodeURIComponent(trailName || "");

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐾</span>
          <h2 className="font-semibold" style={{ color: "#1C3A2A", fontSize: "12px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Species on This Trail
          </h2>
        </div>
        <span style={{ color: "#7FAF8A", fontSize: "11px" }}>{speciesList.length} recorded</span>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {display.map(s => {
          const statusKey = (s.conservationStatus || "").toLowerCase();
          const dotColor  = STATUS_DOT[statusKey];
          return (
            <button
              key={s.id}
              onClick={() => { sessionStorage.setItem(`trail_scroll_${trailId}`, String(window.scrollY)); sessionStorage.setItem(`trail_expanded_${trailId}`, expanded ? "1" : "0"); navigate(`/SpeciesDetail?id=${s.id}&from=trail&trailId=${trailId}&trailName=${encodedTrailName}`); }}
              className="relative rounded-xl overflow-hidden transition-all active:scale-95 hover:opacity-90 text-left"
              style={{ aspectRatio: "1", background: "#1C3A2A", cursor: "pointer", border: "none", padding: 0 }}>
              {/* Fallback emoji bg */}
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ fontSize: "28px", opacity: 0.18 }}>
                {GROUP_ICONS[s.group?.toLowerCase()] || "🌿"}
              </div>
              {s.imageUrl && (
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
              )}
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
                <div style={{ color: "#E8F4E8", fontSize: "9px", fontWeight: "600", lineHeight: "1.3",
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {s.name}
                </div>
              </div>
              {/* Rare dot */}
              {dotColor && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: dotColor, boxShadow: "0 0 4px rgba(0,0,0,0.5)" }} />
              )}
            </button>
          );
        })}
      </div>

      {speciesList.length > DISPLAY_COUNT && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ background: "rgba(74,124,89,0.08)", color: "#4A7C59",
            border: "1px solid rgba(74,124,89,0.2)", cursor: "pointer" }}>
          {expanded ? "Show fewer ↑" : `Show all ${speciesList.length} species ↓`}
        </button>
      )}
    </div>
  );
}


// ── reduceTrail() — Trail Intelligence Reducer ────────────────────────────────
function reduceTrail({ trailId, observations, species, privacyBrain }) {
  const RARE_STATUSES = ["endangered","threatened","critically endangered","rare","very rare",
    "state threatened","federally threatened","federally endangered","species of special concern",
    "of concern","sensitive","protected"];
  const MONTH_SEASON_L = {
    0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
    5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter"
  };
  const now = new Date();
  const currentSeason = MONTH_SEASON_L[now.getMonth()];
  const currentMonth  = now.getMonth(); // 0-indexed

  const spMap = {};
  (species || []).forEach(s => { if (s?.id) spMap[s.id] = s; });

  // 1. Core stats
  const uniqueSpIds = [...new Set(observations.map(o => o.speciesId).filter(Boolean))];
  const rareSpeciesIds = uniqueSpIds.filter(id => {
    const s = spMap[id];
    if (!s) return false;
    const st = (s.conservationStatus || "").toLowerCase().trim();
    return RARE_STATUSES.some(r => st.includes(r));
  });
  const stats = {
    speciesCount: uniqueSpIds.length,
    sightingCount: observations.length,
    rareCount: rareSpeciesIds.length,
  };

  // 2. Active Now — species with seasonPresence including currentSeason + recent obs
  const recentMs = 45 * 24 * 60 * 60 * 1000;
  const recentObsSet = new Set(
    observations
      .filter(o => o.timestamp && (Date.now() - new Date(o.timestamp).getTime()) < recentMs)
      .map(o => o.speciesId)
  );
  const activeNow = uniqueSpIds
    .map(id => spMap[id])
    .filter(s => s && (s.seasonPresence || []).map(x => x.toLowerCase()).includes(currentSeason))
    .map(s => ({
      speciesId: s.id,
      name: s.name,
      thumbnail: s.imageUrl || null,
      group: s.group || "unknown",
      recent: recentObsSet.has(s.id),
    }))
    .sort((a, b) => (b.recent ? 1 : 0) - (a.recent ? 1 : 0));

  // 3. Seasonal species blocks
  const seasonal = { spring: [], summer: [], fall: [], winter: [] };
  uniqueSpIds.forEach(id => {
    const s = spMap[id];
    if (!s) return;
    (s.seasonPresence || []).forEach(season => {
      const key = season.toLowerCase();
      if (seasonal[key]) seasonal[key].push({ speciesId: id, name: s.name, thumbnail: s.imageUrl, group: s.group });
    });
  });

  // 4. Peak months (12-bar) — count obs per month
  const peakMonths = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
  observations.forEach(o => {
    const m = o.month != null ? o.month : (o.timestamp ? new Date(o.timestamp).getMonth() : null);
    if (m != null && m >= 0 && m < 12) peakMonths[m].count++;
  });

  // 5. Rare species
  const rareSpecies = rareSpeciesIds.map(id => {
    const s = spMap[id];
    return s ? { speciesId: id, name: s.name, status: s.conservationStatus, thumbnail: s.imageUrl } : null;
  }).filter(Boolean);

  // 6. Companion species (co-occurrence O(n) pass)
  // For each obs, score all other species observed on the same trail
  const coScore = {};
  const spInObs = new Set(observations.map(o => o.speciesId).filter(Boolean));
  observations.forEach(o => {
    if (!o.speciesId) return;
    spInObs.forEach(otherId => {
      if (otherId === o.speciesId) return;
      const key = [o.speciesId, otherId].sort().join("__");
      coScore[key] = (coScore[key] || 0) + 1;
    });
  });
  const companions = uniqueSpIds.flatMap(id => {
    return uniqueSpIds
      .filter(oid => oid !== id)
      .map(oid => {
        const key = [id, oid].sort().join("__");
        return { fromId: id, speciesId: oid, score: coScore[key] || 0 };
      });
  });
  // Aggregate companion scores across all species
  const topCompanionMap = {};
  companions.forEach(c => {
    if (!topCompanionMap[c.speciesId]) topCompanionMap[c.speciesId] = 0;
    topCompanionMap[c.speciesId] += c.score;
  });
  const topCompanions = Object.entries(topCompanionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, score]) => {
      const s = spMap[id];
      return s ? { speciesId: id, name: s.name, score, thumbnail: s.imageUrl, group: s.group } : null;
    })
    .filter(Boolean);

  // 7. Timeline — chronological unique sightings (most recent first)
  const seen = new Set();
  const timeline = observations
    .filter(o => o.speciesId && o.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(o => {
      const key = `${o.speciesId}_${o.month}_${o.year}`;
      const isFirst = !seen.has(`${o.speciesId}_${o.year}`);
      if (!seen.has(key)) seen.add(key);
      seen.add(`${o.speciesId}_${o.year}`);
      const s = spMap[o.speciesId];
      return {
        date: o.timestamp,
        speciesId: o.speciesId,
        name: o.speciesName || s?.name || "Unknown",
        thumbnail: s?.imageUrl || null,
        rare: rareSpeciesIds.includes(o.speciesId),
        firstOfYear: isFirst,
        season: o.season,
      };
    })
    .filter((o, i, arr) => arr.findIndex(x => x.speciesId === o.speciesId && x.date === o.date) === i)
    .slice(0, 20);

  // 8. Map filters
  const mapFilters = { trailId, season: currentSeason, month: currentMonth + 1, group: null };

  // 9. Privacy (simplified pass-through)
  const privacy = { eligible: observations.length >= 3, sensitivity: "standard", corridorFallback: false };

  return { stats, activeNow, seasonal, peakMonths, rareSpecies, companions: topCompanions, timeline, mapFilters, privacy };
}

// ── Trail Intelligence Panel ──────────────────────────────────────────────────
function TrailIntelligencePanel({ trailId, trailName, trailSpeciesIds, navigate }) {
  const [obs, setObs]       = useState([]);
  const [sp, setSp]         = useState([]);
  const [loading, setLoad]  = useState(true);
  const [tab, setTab]       = useState("active"); // active | peak | companions | timeline | rare

  const SEASON_COLOR_MAP = { spring:"#4A9A5A", summer:"#D4883A", fall:"#8A5A2A", winter:"#3A6A9A" };
  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const STATUS_C = {
    "threatened":{"t":"#C47A7A"},
    "endangered":{"t":"#C62828"},
    "critically endangered":{"t":"#6A1B9A"},
    "of concern":{"t":"#F57F17"},
    "sensitive":{"t":"#CD853F"},
    "species of special concern":{"t":"#CD853F"},
    "state threatened":{"t":"#C47A7A"},
    "federally threatened":{"t":"#C47A7A"},
    "federally endangered":{"t":"#C62828"},
    "rare":{"t":"#8B4513"},
    "very rare":{"t":"#8B4513"},
  };

  useEffect(() => {
    if (!trailId) { setLoad(false); return; }
    Promise.all([
      Observation.filter({ trailId }).catch(() => []),
      Species.filter({}).catch(() => []),
    ]).then(([o, s]) => {
      setObs(o || []);
      setSp(s || []);
      setLoad(false);
    });
  }, [trailId]);

  const intel = useMemo(() => {
    if (loading || !obs.length) return null;
    return reduceTrail({ trailId, observations: obs, species: sp, privacyBrain: null });
  }, [loading, obs, sp, trailId]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentSeason = ["winter","winter","spring","spring","spring","summer","summer","summer","fall","fall","fall","winter"][currentMonth];

  if (loading) return null;
  if (!intel || intel.stats.sightingCount === 0) return null;

  const maxPeak = Math.max(...intel.peakMonths.map(m => m.count), 1);

  const TABS = [
    { key:"active",     label:"🌿 Now"       },
    { key:"peak",       label:"📊 Peaks"     },
    { key:"companions", label:"🔗 Co-seen"   },
    { key:"timeline",   label:"🕐 Timeline"  },
    ...(intel.rareSpecies.length ? [{ key:"rare", label:`⚠️ ${intel.rareSpecies.length} Rare` }] : []),
  ];

  return (
    <div style={{ background:"#0A1810", border:"1px solid rgba(74,154,90,0.25)",
      borderRadius:16, marginBottom:16, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"16px 16px 10px", borderBottom:"1px solid rgba(74,154,90,0.1)" }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%",
              background:"#4A9A5A", animation:"pulse 2s infinite" }} />
            <span style={{ color:"#7FAF8A", fontSize:11, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.09em" }}>
              Trail Intelligence
            </span>
          </div>
          <button onClick={() => navigate(`/Map?season=${currentSeason}&trailId=${trailId}`)}
            style={{ background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.25)",
              borderRadius:8, padding:"4px 10px", color:"#7FAF8A",
              fontSize:10, fontWeight:600, cursor:"pointer" }}>
            🗺 View on Map →
          </button>
        </div>
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[
            { label:"Species", value: intel.stats.speciesCount },
            { label:"Sightings", value: intel.stats.sightingCount },
            { label:"Rare", value: intel.stats.rareCount },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(127,175,138,0.07)",
              border:"1px solid rgba(127,175,138,0.1)", borderRadius:10,
              padding:"8px 0", textAlign:"center" }}>
              <div style={{ color:"#E8F4E8", fontSize:17, fontWeight:700 }}>{s.value}</div>
              <div style={{ color:"#4A6A5A", fontSize:9, marginTop:1,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:4, padding:"8px 12px",
        overflowX:"auto", scrollbarWidth:"none",
        borderBottom:"1px solid rgba(74,154,90,0.08)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flexShrink:0, padding:"5px 11px", borderRadius:14,
              fontSize:11, fontWeight: tab===t.key ? 700 : 400, cursor:"pointer",
              background: tab===t.key ? "rgba(74,154,90,0.2)" : "none",
              border:`1px solid ${tab===t.key ? "rgba(74,154,90,0.4)" : "rgba(74,154,90,0.1)"}`,
              color: tab===t.key ? "#A8D5B0" : "#4A6A5A" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Active Now ── */}
      {tab === "active" && (
        <div style={{ padding:"12px 14px" }}>
          {intel.activeNow.length === 0 ? (
            <div style={{ color:"#3A5A4A", fontSize:12, padding:"8px 0" }}>
              No seasonal species recorded here yet.
            </div>
          ) : (
            <>
              <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
                {intel.activeNow.length} species active this {currentSeason}
              </div>
              <div style={{ display:"flex", gap:8, overflowX:"auto",
                paddingBottom:4, scrollbarWidth:"none" }}>
                {intel.activeNow.slice(0,12).map(s => (
                  <button key={s.speciesId}
                    onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId}&from=trail&trailId=${trailId}&trailName=${encodeURIComponent(trailName||"")}`)}
                    style={{ flexShrink:0, width:58, background:"none",
                      border:"none", padding:0, cursor:"pointer" }}>
                    <div style={{ width:58, height:58, borderRadius:10, overflow:"hidden",
                      background:"#1C3A2A", position:"relative",
                      border: s.recent ? "2px solid #4A9A5A" : "none" }}>
                      {s.thumbnail
                        ? <img src={s.thumbnail} alt={s.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ display:"flex", alignItems:"center",
                            justifyContent:"center", height:"100%",
                            fontSize:22, opacity:0.3 }}>
                            {GROUP_ICONS[s.group?.toLowerCase()] || "🌿"}
                          </div>
                      }
                      {s.recent && (
                        <div style={{ position:"absolute", top:2, right:2,
                          width:6, height:6, borderRadius:"50%",
                          background:"#4A9A5A" }} />
                      )}
                    </div>
                    <div style={{ fontSize:7.5, color:"#4A7A5A", marginTop:3,
                      textAlign:"center", overflow:"hidden",
                      whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:58 }}>
                      {s.name.split(" ").slice(-1)[0]}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ color:"#2A4A3A", fontSize:9, marginTop:8 }}>
                🟢 Green border = seen in last 45 days
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Peak Months ── */}
      {tab === "peak" && (
        <div style={{ padding:"12px 14px" }}>
          <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>
            Sighting activity by month
          </div>
          <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:60 }}>
            {intel.peakMonths.map((m, i) => {
              const isCur = i === currentMonth;
              const ratio = m.count / maxPeak;
              const season = ["winter","winter","spring","spring","spring","summer","summer","summer","fall","fall","fall","winter"][i];
              const sColor = SEASON_COLOR_MAP[season];
              return (
                <div key={m.month} style={{ flex:1, display:"flex",
                  flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{ fontSize:8, color: isCur ? "#A8D5B0" : "#2A4A3A",
                    fontWeight: isCur ? 700 : 400, marginBottom:1 }}>
                    {m.count > 0 ? m.count : ""}
                  </div>
                  <div style={{
                    width:"100%", borderRadius:3,
                    height:`${Math.max(3, ratio * 40)}px`,
                    background: isCur ? "#7FAF8A" : (m.count > 0 ? sColor : "#1C3A2A"),
                    opacity: m.count > 0 ? (isCur ? 1 : 0.7) : 0.3,
                    boxShadow: isCur ? "0 0 6px rgba(127,175,138,0.5)" : "none",
                  }} />
                  <div style={{ fontSize:7, color: isCur ? "#7FAF8A" : "#2A4A3A",
                    fontWeight: isCur ? 700 : 400 }}>
                    {MONTH_SHORT[i]}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Peak month callout */}
          {(() => {
            const peak = intel.peakMonths.reduce((a, b) => b.count > a.count ? b : a);
            if (!peak.count) return null;
            return (
              <div style={{ marginTop:10, padding:"8px 10px",
                background:"rgba(74,154,90,0.08)", borderRadius:8,
                border:"1px solid rgba(74,154,90,0.15)" }}>
                <div style={{ color:"#7FAF8A", fontSize:11, fontWeight:600 }}>
                  Peak: {MONTH_SHORT[peak.month - 1]} · {peak.count} sighting{peak.count > 1 ? "s" : ""}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Companion Species ── */}
      {tab === "companions" && (
        <div style={{ padding:"12px 14px" }}>
          {intel.companions.length === 0 ? (
            <div style={{ color:"#3A5A4A", fontSize:12 }}>
              Not enough sightings to compute co-occurrence.
            </div>
          ) : (
            <>
              <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
                Species frequently seen together
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {intel.companions.map((c, i) => (
                  <button key={c.speciesId}
                    onClick={() => navigate(`/SpeciesDetail?id=${c.speciesId}&from=trail&trailId=${trailId}&trailName=${encodeURIComponent(trailName||"")}`)}
                    style={{ display:"flex", alignItems:"center", gap:10,
                      background:"rgba(127,175,138,0.05)",
                      border:"1px solid rgba(127,175,138,0.1)",
                      borderRadius:10, padding:"8px 10px",
                      cursor:"pointer", textAlign:"left" }}>
                    <div style={{ width:36, height:36, borderRadius:8,
                      overflow:"hidden", background:"#1C3A2A", flexShrink:0 }}>
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt={c.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ display:"flex", alignItems:"center",
                            justifyContent:"center", height:"100%",
                            fontSize:16, opacity:0.3 }}>
                            {GROUP_ICONS[c.group?.toLowerCase()] || "🌿"}
                          </div>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#C4DFC8", fontSize:12, fontWeight:600,
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                        {c.name}
                      </div>
                      <div style={{ color:"#4A7A5A", fontSize:10, marginTop:1,
                        textTransform:"capitalize" }}>
                        {GROUP_ICONS[c.group?.toLowerCase()] || ""} {c.group}
                      </div>
                    </div>
                    <div style={{ color:"#4A9A5A", fontSize:10, fontWeight:700, flexShrink:0 }}>
                      ×{c.score}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ color:"#2A4A3A", fontSize:9, marginTop:8 }}>
                Co-occurrence score = shared observation sessions on this trail
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      {tab === "timeline" && (
        <div style={{ padding:"12px 14px" }}>
          {intel.timeline.length === 0 ? (
            <div style={{ color:"#3A5A4A", fontSize:12 }}>
              No timestamped sightings yet.
            </div>
          ) : (
            <>
              <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
                Recent sightings
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {intel.timeline.map((t, i) => {
                  const d = new Date(t.date);
                  const label = `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
                  return (
                    <button key={`${t.speciesId}-${i}`}
                      onClick={() => navigate(`/SpeciesDetail?id=${t.speciesId}&from=trail&trailId=${trailId}&trailName=${encodeURIComponent(trailName||"")}`)}
                      style={{ display:"flex", alignItems:"center", gap:9,
                        background: t.firstOfYear
                          ? "rgba(245,200,66,0.06)" : "rgba(127,175,138,0.04)",
                        border:`1px solid ${t.firstOfYear ? "rgba(245,200,66,0.2)" : "rgba(127,175,138,0.08)"}`,
                        borderRadius:9, padding:"7px 10px",
                        cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:32, height:32, borderRadius:7,
                        overflow:"hidden", background:"#1C3A2A", flexShrink:0 }}>
                        {t.thumbnail
                          ? <img src={t.thumbnail} alt={t.name}
                              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ display:"flex", alignItems:"center",
                              justifyContent:"center", height:"100%",
                              fontSize:14, opacity:0.3 }}>🌿</div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ color:"#C4DFC8", fontSize:12, fontWeight:600,
                            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                            maxWidth:140 }}>
                            {t.name}
                          </span>
                          {t.firstOfYear && (
                            <span style={{ fontSize:8, fontWeight:700, color:"#F5C842",
                              background:"rgba(245,200,66,0.1)",
                              borderRadius:4, padding:"1px 4px", flexShrink:0 }}>
                              1st this year
                            </span>
                          )}
                          {t.rare && !t.firstOfYear && (
                            <span style={{ fontSize:8, fontWeight:700, color:"#E09080",
                              background:"rgba(224,144,128,0.1)",
                              borderRadius:4, padding:"1px 4px", flexShrink:0 }}>
                              ⚠ rare
                            </span>
                          )}
                        </div>
                        <div style={{ color:"#3A6A5A", fontSize:10, marginTop:1 }}>
                          {label}
                        </div>
                      </div>
                      <div style={{ color:"#3A5A4A", fontSize:11, flexShrink:0 }}>›</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Rare Species ── */}
      {tab === "rare" && intel.rareSpecies.length > 0 && (
        <div style={{ padding:"12px 14px" }}>
          <div style={{ padding:"8px 10px", background:"rgba(191,54,12,0.08)",
            border:"1px solid rgba(191,54,12,0.2)", borderRadius:9, marginBottom:10 }}>
            <div style={{ color:"#D47060", fontSize:11, fontWeight:700 }}>
              ⚠️ {intel.rareSpecies.length} at-risk species recorded on this trail
            </div>
            <div style={{ color:"#8A5050", fontSize:10, marginTop:2 }}>
              Presence data is corridor-level only in public view.
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {intel.rareSpecies.map(s => {
              const sc = STATUS_C[(s.status||"").toLowerCase()];
              return (
                <button key={s.speciesId}
                  onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId}&from=trail&trailId=${trailId}&trailName=${encodeURIComponent(trailName||"")}`)}
                  style={{ display:"flex", alignItems:"center", gap:9,
                    background:"rgba(180,90,50,0.05)",
                    border:"1px solid rgba(180,90,50,0.2)",
                    borderRadius:10, padding:"9px 10px",
                    cursor:"pointer", textAlign:"left" }}>
                  <div style={{ width:40, height:40, borderRadius:8,
                    overflow:"hidden", background:"#2A1810", flexShrink:0 }}>
                    {s.thumbnail
                      ? <img src={s.thumbnail} alt={s.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center",
                          justifyContent:"center", height:"100%",
                          fontSize:18, opacity:0.3 }}>⚠️</div>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#DFC8C4", fontSize:13, fontWeight:600,
                      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                      {s.name}
                    </div>
                    {s.status && (
                      <div style={{ color: sc?.t || "#D47060", fontSize:10,
                        marginTop:2, fontWeight:600, textTransform:"capitalize" }}>
                        {s.status}
                      </div>
                    )}
                  </div>
                  <div style={{ color:"#7A4040", fontSize:11 }}>›</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(74,154,90,0.08)",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ color:"#2A4A3A", fontSize:9 }}>
          Anonymous · privacy-safe · {intel.stats.sightingCount} sightings
        </div>
        <button onClick={() => navigate(`/Map?season=${currentSeason}&trailId=${trailId}`)}
          style={{ background:"none", border:"none", color:"#4A7A5A",
            fontSize:10, cursor:"pointer" }}>
          🗺 Map →
        </button>
      </div>
    </div>
  );
}

function ActiveHerePanel({ trailSpeciesIds, trailName, trailId, navigate }) {
  const [allActive, setAllActive]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(false);
  const [activeGroup, setActiveGroup] = useState("all");

  const now    = new Date();
  const season = MONTH_SEASON[now.getMonth()];
  const month  = now.toLocaleString("default", { month: "long" });

  useEffect(() => {
    if (!trailSpeciesIds?.length) { setLoading(false); return; }

    // Fetch species linked to this trail
    Species.filter({}).then(all => {
      // Filter to species on this trail
      const onTrail = all.filter(s =>
        s.trail?.some(tid => trailSpeciesIds.includes(tid)) ||
        trailSpeciesIds.includes(s.id)
      );
      setAllActive(onTrail);
      setLoading(false);
    });
  }, [trailSpeciesIds]);

  const currentSeason = useMemo(() => {
    return allActive.filter(s => {
      if (!s.seasonPresence?.length) return true; // year-round assumed if unset
      return s.seasonPresence.map(x => x.toLowerCase()).includes(season);
    });
  }, [allActive, season]);

  const groups = useMemo(() => {
    const gs = Array.from(new Set(currentSeason.map(s => s.group?.toLowerCase()).filter(Boolean))).sort();
    return ["all", ...gs];
  }, [currentSeason]);

  const filtered = activeGroup === "all"
    ? currentSeason
    : currentSeason.filter(s => s.group?.toLowerCase() === activeGroup);

  // OC-specific at-risk filter: only flag genuinely sensitive/threatened species
  // Excludes common species (Least Concern, Secure, Common, Widespread, Stable, Not Evaluated)
  const AT_RISK_STATUSES = [
    "threatened", "endangered", "critically endangered",
    "state threatened", "state endangered", "federally threatened", "federally endangered",
    "sensitive", "species of special concern", "ssc", "watch list",
    "candidate", "proposed threatened", "proposed endangered",
    "vulnerable", "near threatened",
  ];
  const SAFE_STATUSES = [
    "stable", "widespread", "common", "least concern", "secure",
    "not evaluated", "not listed", "abundant", "game species",
    "locally common", "uncommon but not at risk", ""
  ];
  const rareSpecies = currentSeason.filter(s => {
    if (!s.conservationStatus) return false;
    const status = s.conservationStatus.toLowerCase().trim();
    if (SAFE_STATUSES.some(safe => status.includes(safe))) return false;
    return AT_RISK_STATUSES.some(risk => status.includes(risk));
  });

  const displayList = expanded ? filtered : filtered.slice(0, 6);

  if (loading) return (
    <div className="rounded-2xl p-5 mb-4 flex items-center gap-3"
      style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.2)" }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin flex-shrink-0"
        style={{ borderColor: "#4A7C59", borderTopColor: "transparent" }} />
      <span style={{ color: "#5C8A6A", fontSize: "13px" }}>Loading species…</span>
    </div>
  );

  if (!allActive.length) return null;

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.2)" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#7FAF8A" }} />
              <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
                letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Active Here Now
              </span>
            </div>
            <div style={{ color: "#C4DFC8", fontSize: "16px", fontWeight: "700" }}>
              {currentSeason.length} species this {SEASON_LABELS[season]}
            </div>
            <div style={{ color: "#5C8A6A", fontSize: "12px", marginTop: "2px" }}>
              {SEASON_ICONS[season]} {month} · {allActive.length} total recorded on trail
            </div>
          </div>

          {/* Season badge */}
          <div className="px-3 py-2 rounded-xl text-center flex-shrink-0"
            style={{ background: "rgba(74,124,89,0.2)", border: "1px solid rgba(74,124,89,0.35)" }}>
            <div style={{ fontSize: "18px" }}>{SEASON_ICONS[season]}</div>
            <div style={{ color: "#7FAF8A", fontSize: "9px", fontWeight: "600", marginTop: "2px",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {SEASON_LABELS[season]}
            </div>
          </div>
        </div>

        {/* Rare species alert */}
        {rareSpecies.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
            style={{ background: "rgba(138,58,42,0.2)", border: "1px solid rgba(138,58,42,0.4)" }}>
            <span style={{ fontSize: "13px" }}>⚠️</span>
            <span style={{ color: "#D4A898", fontSize: "12px" }}>
              {rareSpecies.length} at-risk species present —{" "}
              {rareSpecies.slice(0, 2).map(s => s.name).join(", ")}
              {rareSpecies.length > 2 ? ` +${rareSpecies.length - 2} more` : ""}
            </span>
          </div>
        )}

        {/* Group filter chips */}
        {groups.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {groups.map(g => (
              <button key={g}
                onClick={() => setActiveGroup(g)}
                className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all capitalize flex-shrink-0"
                style={{
                  background: activeGroup === g ? "rgba(127,175,138,0.25)" : "rgba(255,255,255,0.05)",
                  color:      activeGroup === g ? "#A8D5B0" : "#5C8A6A",
                  border:     activeGroup === g ? "1px solid rgba(127,175,138,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  fontWeight: activeGroup === g ? "600" : "400",
                }}>
                {GROUP_ICONS[g] || ""} {g === "all" ? "All" : g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Species list */}
      <div className="px-3 pb-3">
        <div className="space-y-1.5">
          {displayList.map(s => {
            const sc     = STATUS_COLORS[s.conservationStatus?.toLowerCase()];
            const isRare = !!sc;
            return (
              <button key={s.id}
                onClick={() => { sessionStorage.setItem(`trail_scroll_${trailId}`, String(window.scrollY)); navigate(`/SpeciesDetail?id=${s.id}&from=trail&trailId=${trailId}&trailName=${encodeURIComponent(trailName || "")}`); }}
                className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-white/5 active:scale-[0.99]"
                style={{ background: isRare ? "rgba(180,90,50,0.04)" : "rgba(255,255,255,0.03)",
                  border: isRare ? "1px solid rgba(180,90,50,0.18)" : "1px solid rgba(127,175,138,0.08)",
                  cursor: "pointer" }}>
                <SpeciesThumb src={s.imageUrl} name={s.name} group={s.group} size={48} />
                <div className="flex-1 min-w-0">
                  <div style={{ color: "#C4DFC8", fontSize: "13px", fontWeight: "600",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span style={{ color: "#5C8A6A", fontSize: "10px", textTransform: "capitalize" }}>
                      {GROUP_ICONS[s.group?.toLowerCase()] || ""} {s.group}
                    </span>
                    {isRare && (
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: sc.bg + "25", color: sc.text, fontSize: "9px",
                          border: `1px solid ${sc.text}35`, fontWeight: "700" }}>
                        ⚠ {s.conservationStatus}
                      </span>
                    )}
                  </div>
                  {s.fieldCue && (
                    <div style={{ color: "#3A5A4A", fontSize: "10px", lineHeight: "1.5",
                      marginTop: "3px", overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                      {s.fieldCue}
                    </div>
                  )}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A5A4A" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Expand / collapse */}
        {filtered.length > 6 && (
          <button onClick={() => setExpanded(e => !e)}
            className="w-full mt-2 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: "rgba(127,175,138,0.08)", color: "#7FAF8A",
              border: "1px solid rgba(127,175,138,0.15)", cursor: "pointer" }}>
            {expanded
              ? "Show less ↑"
              : `Show all ${filtered.length} ${activeGroup === "all" ? "" : activeGroup + " "}species this ${SEASON_LABELS[season]} ↓`
            }
          </button>
        )}

        {/* Footer loop closure */}
        <button
          onClick={() => navigate(`/Species`)}
          className="w-full mt-2 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ background: "transparent", color: "#3A5A4A",
            border: "1px solid rgba(127,175,138,0.08)", cursor: "pointer" }}>
          Browse full species atlas →
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#0F0F0D",
  card:     "#1A1A17",
  border:   "rgba(255,255,255,0.07)",
  ink:      "rgba(255,255,255,0.90)",
  inkMid:   "rgba(255,255,255,0.70)",
  inkLight: "rgba(255,255,255,0.35)",
  inkFaint: "rgba(255,255,255,0.18)",
  accent:   "#7AB87A",
};

const DIFF_DARK = {
  easy:      "#7AB87A",
  moderate:  "#C4974A",
  hard:      "#C47A7A",
  strenuous: "#9A7AB8",
};

export default function TrailDetail() {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const id = paramId || searchParams.get("id");
  const fromSearch = searchParams.get("from") === "search";
  const navigate = useNavigate();
  const [trail, setTrail]     = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Trail.get(id)
      .then(d => { setTrail(d); setLoading(false); logTrailVisit(id); })
      .catch(() => setLoading(false));
  }, [id]);

  const scrollKey    = `trail_scroll_${id}`;
  const expandedKey  = `trail_expanded_${id}`;
  const savedExpandedRef = useRef(null);
  if (savedExpandedRef.current === null) {
    savedExpandedRef.current = sessionStorage.getItem(expandedKey) === "1";
    sessionStorage.removeItem(expandedKey);
  }
  const savedExpanded = savedExpandedRef.current;
  const location = useLocation();

  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey);
    if (!saved) return;
    const y = parseInt(saved, 10);
    sessionStorage.removeItem(scrollKey);
    let attempts = 0;
    const tryScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= y || attempts > 20) window.scrollTo({ top: y, behavior: "instant" });
      else { attempts++; setTimeout(tryScroll, 100); }
    };
    setTimeout(tryScroll, 100);
  }, [location.key, id]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:T.bg }}>
      <div style={{
        width:"28px", height:"28px", borderRadius:"50%",
        border:"2px solid rgba(255,255,255,0.08)",
        borderTopColor:T.accent,
        animation:"spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
  if (!trail) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:T.bg }}>
      <div style={{ fontSize:"14px", color:T.inkLight }}>Trail not found.</div>
    </div>
  );

  const diff      = trail.difficulty?.toLowerCase() || "moderate";
  const dc        = DIFF_DARK[diff] || DIFF_DARK.moderate;
  const canonical = CANONICAL[trail.id];
  const peakInfo  = PEAK_LABELS[trail.id];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:"60px" }}>

      {/* Back button — floating over hero */}
      <div style={{ position:"absolute", top:"16px", left:"16px", zIndex:10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display:"flex", alignItems:"center", gap:"6px",
            background:"rgba(15,15,13,0.6)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:"100px",
            padding:"7px 14px 7px 10px", cursor:"pointer",
            fontSize:"12px", fontWeight:"600", color:"rgba(255,255,255,0.75)"
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
          {fromSearch ? "Search" : "Trails"}
        </button>
      </div>

      {/* ── Hero image — cinematic, full-bleed ──────────────────────────── */}
      <TrailMoodBanner trail={trail} />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ padding:"28px 20px 0" }}>

        {/* Jurisdiction label + trail name */}
        <div style={{ marginBottom:"24px" }}>
          {trail.jurisdiction && (
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"6px" }}>
              {trail.jurisdiction}
            </div>
          )}
          <h1 style={{ fontSize:"clamp(22px,5vw,30px)", fontFamily:"Georgia, serif",
            fontWeight:"400", color:T.ink, lineHeight:1.2, marginBottom:"8px" }}>
            {trail.name}
          </h1>
          {/* Ecological note — italic serif voice */}
          {trail.ecologicalNotes && (
            <div style={{ fontSize:"14px", fontFamily:"Georgia, serif", fontStyle:"italic",
              color:T.inkMid, lineHeight:1.65 }}>
              {trail.ecologicalNotes}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"28px" }}>
          {trail.difficulty && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              fontWeight:"600", color:dc,
              background:`${dc}15`, border:`1px solid ${dc}40` }}>
              {trail.difficulty}
            </span>
          )}
          {trail.distanceMiles && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              color:T.inkLight, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
              {trail.distanceMiles} mi
            </span>
          )}
          {trail.elevationGain != null && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              color:T.inkLight, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
              ↑ {trail.elevationGain} ft
            </span>
          )}
          {trail.heatRisk && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              color:"#C4974A", background:"rgba(196,151,74,0.12)", border:"1px solid rgba(196,151,74,0.3)" }}>
              {trail.heatRisk} heat risk
            </span>
          )}
          {trail.dogFriendly === "yes" && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              color:T.inkLight, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
              Dog friendly
            </span>
          )}
          {trail.hasWater === "yes" && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              color:T.inkLight, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
              Water available
            </span>
          )}
          {canonical && (
            <span style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px",
              fontWeight:"600", color:T.accent,
              background:T.accentPale||"rgba(122,184,122,0.12)",
              border:"1px solid rgba(122,184,122,0.3)" }}>
              Canonical Corridor
            </span>
          )}
        </div>

        {/* Canonical ecological role — italic serif */}
        {canonical && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"12px" }}>
              Ecological Role
            </div>
            <div style={{ fontSize:"15px", fontFamily:"Georgia, serif", fontStyle:"italic",
              color:T.inkMid, lineHeight:1.65, borderLeft:`2px solid ${T.accent}`,
              paddingLeft:"14px" }}>
              {canonical.role}
            </div>
            {canonical.biomes?.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"14px" }}>
                {canonical.biomes.map(b => (
                  <span key={b.label} style={{
                    padding:"4px 10px", borderRadius:"100px", fontSize:"10px",
                    color:T.inkLight, background:"rgba(255,255,255,0.05)",
                    border:`1px solid ${T.border}`
                  }}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Non-canonical habitat types */}
        {!canonical && trail.habitatTypes?.length > 0 && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"12px" }}>
              Habitats
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {trail.habitatTypes.map(h => (
                <span key={h} style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"11px",
                  color:T.inkLight, background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}` }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Peak note */}
        {peakInfo && (
          <div style={{ marginBottom:"28px", borderLeft:"2px solid #C4974A",
            paddingLeft:"14px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:"#C4974A", marginBottom:"5px" }}>
              Peak Season
            </div>
            <div style={{ fontSize:"13px", fontFamily:"Georgia, serif", fontStyle:"italic",
              color:T.inkMid, lineHeight:1.55 }}>
              {peakInfo.label} — {peakInfo.note}
            </div>
          </div>
        )}

        {/* Log sighting CTA */}
        <div style={{ marginBottom:"28px" }}>
          <button onClick={() => setLogOpen(true)} style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
            width:"100%", padding:"13px 0", borderRadius:"11px", cursor:"pointer",
            background:"rgba(122,184,122,0.12)", border:"1px solid rgba(122,184,122,0.3)",
            fontSize:"13px", fontWeight:"600", color:T.accent
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Log a sighting on this trail
          </button>
        </div>

        {/* ── All intelligence panels — preserved exactly ──────────────── */}
        <TrailSpeciesGrid
          trailId={trail.id}
          trailName={trail.name}
          trailSpeciesIds={trail.speciesIds || []}
          navigate={navigate}
          initialExpanded={savedExpanded}
        />

        <ActiveHerePanel
          trailSpeciesIds={trail.speciesIds || []}
          trailName={trail.name}
          trailId={id}
          navigate={navigate}
        />

        <TrailIntelligencePanel
          trailId={trail.id}
          trailName={trail.name}
          trailSpeciesIds={trail.speciesIds || []}
          navigate={navigate}
        />

        <TrailSightingSummary
          trailId={trail.id}
          trailName={trail.name}
          navigate={navigate}
        />

        {/* Cross-links for canonical corridors */}
        {canonical?.crossLinks?.length > 0 && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"14px" }}>
              Connected Corridors
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {canonical.crossLinks.map(link => (
                <div key={link.id} onClick={() => navigate(`/TrailDetail?id=${link.id}`)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"14px 16px", background:T.card,
                    border:`1px solid ${T.border}`, borderRadius:"10px", cursor:"pointer" }}>
                  <div>
                    <div style={{ fontSize:"14px", fontFamily:"Georgia, serif", color:T.ink, marginBottom:"3px" }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize:"11px", fontStyle:"italic", color:T.inkLight }}>
                      {link.note}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enriched fields */}
        {trail.soundscape && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"10px" }}>
              Soundscape
            </div>
            <div style={{ fontSize:"13px", fontFamily:"Georgia, serif", fontStyle:"italic",
              color:T.inkMid, lineHeight:1.65 }}>
              {trail.soundscape}
            </div>
          </div>
        )}
        {trail.seasonalConditions && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"10px" }}>
              Seasonal Conditions
            </div>
            <div style={{ fontSize:"14px", color:T.inkMid, lineHeight:1.65 }}>
              {trail.seasonalConditions}
            </div>
          </div>
        )}
        {trail.sarCues && (
          <div style={{ marginBottom:"28px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"10px" }}>
              SAR Notes
            </div>
            <div style={{ fontSize:"13px", color:T.inkMid, lineHeight:1.65 }}>
              {trail.sarCues}
            </div>
          </div>
        )}

      </div>

      {/* Log sighting modal */}
      {logOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:50,
          background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setLogOpen(false); }}>
          <div style={{ width:"100%", maxHeight:"90vh", overflowY:"auto",
            background:T.card, borderRadius:"20px 20px 0 0",
            padding:"24px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:"16px" }}>
              <div style={{ fontSize:"16px", fontFamily:"Georgia, serif", color:T.ink }}>
                Log Sighting
              </div>
              <button onClick={() => setLogOpen(false)} style={{
                background:"rgba(255,255,255,0.08)", border:"none",
                borderRadius:"50%", width:"30px", height:"30px",
                cursor:"pointer", color:T.inkMid, fontSize:"16px"
              }}>×</button>
            </div>
            <LogSighting
              prefilledTrailId={trail.id}
              prefilledTrailName={trail.name}
              onClose={() => setLogOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}