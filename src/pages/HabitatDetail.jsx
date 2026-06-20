import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Trail, Species, Observation } from "@/api/entities";
import BottomNav from "./BottomNav";

// === Privacy utilities (inlined — no external import needed) ===
const K_OBS = 3, K_DAYS = 2;
function trailVisibility(obs) {
  if (!obs || !obs.length) return { eligible: false, rollupLevel: "hidden" };
  if (obs.some(o => o.source === "curated")) return { eligible: true, rollupLevel: "trail" };
  if (obs.some(o => o.sensitivityLevel === "high")) return { eligible: false, rollupLevel: "corridor" };
  const total = obs.filter(o => o.isPublicEligible !== false).length;
  const days  = new Set(obs.filter(o => o.timestamp).map(o => new Date(o.timestamp).toDateString())).size;
  return (total >= K_OBS && days >= K_DAYS) ? { eligible: true, rollupLevel: "trail" } : { eligible: false, rollupLevel: "corridor" };
}
function filterForPublic(obs, { isOwner = false } = {}) {
  if (isOwner) return obs;
  return obs.filter(o => o.isPublicEligible !== false && o.source === "curated");
}
function coarseSeasonLabel(date) {
  const m = date.getMonth(), y = date.getFullYear();
  if (m >= 2 && m <= 4) return `Spring ${y}`;
  if (m >= 5 && m <= 7) return `Summer ${y}`;
  if (m >= 8 && m <= 10) return `Fall ${y}`;
  return `Winter ${y}`;
}
function publicTrailDisplay(obs, trail) {
  if (!obs || !obs.length) return null;
  const { eligible, rollupLevel } = trailVisibility(obs);
  const hasHigh = obs.some(o => o.sensitivityLevel === "high");
  const ts = obs.filter(o => o.timestamp).map(o => new Date(o.timestamp));
  const seasonLabel = ts.length ? coarseSeasonLabel(new Date(Math.max(...ts))) : null;
  if (hasHigh || rollupLevel === "corridor") return { visible:true, resolution:"corridor", label: trail.corridorName || trail.biomeName || "OC bioregion", temporal:seasonLabel, showTrail:false, showDate:false, showGPS:false };
  if (eligible && rollupLevel === "trail") return { visible:true, resolution:"trail", label:trail.name, temporal:seasonLabel, showTrail:true, showDate:false, showGPS:false };
  return null;
}
function seenOnTrailsChips(allObs, trailMap) {
  const byTrail = {};
  allObs.forEach(o => { if (o.trailId) { if (!byTrail[o.trailId]) byTrail[o.trailId] = []; byTrail[o.trailId].push(o); } });
  const chips = [], seen = new Set();
  Object.entries(byTrail).forEach(([id, obs]) => {
    const d = publicTrailDisplay(obs, trailMap[id] || { name: id });
    if (!d) return;
    if (d.resolution === "trail") chips.push({ type:"trail", id, label:d.label, temporal:d.temporal });
    else if (!seen.has(d.label)) { seen.add(d.label); chips.push({ type:"corridor", id:null, label:d.label, temporal:d.temporal }); }
  });
  return chips;
}
const HIGH_SENS = new Set(["Least Bell's Vireo","California Gnatcatcher","Coastal Cactus Wren","Belding's Savannah Sparrow","Western Snowy Plover","Burrowing Owl","Ridgway's Rail","Black Rail","Tricolored Blackbird","Elegant Tern","California Condor","Steelhead Trout","Tidewater Goby","Santa Ana Sucker","Arroyo Toad","Southern Steelhead","Mountain Lion","Bobcat"]);
function autoSensitivityLevel(name, cs, rc) {
  if (HIGH_SENS.has(name)) return "high";
  const c = `${cs||""} ${rc||""}`.toLowerCase();
  if (c.includes("endangered")||c.includes("critically")) return "high";
  if (c.includes("threatened")||c.includes("rare")) return "sensitive";
  return "normal";
}
// === End privacy utilities ===

// ── Habitat registry ──────────────────────────────────────────────────────────
const HABITATS = {
  "chaparral": {
    name: "Chaparral",
    icon: "🌾",
    accent: "#C4A055",
    bg: "linear-gradient(135deg,#6B4C2A,#8B6A3A)",
    identity: "Dry-adapted shrubland with high spring turnover and strong bird fidelity. The fire clock of OC.",
    habitatKeywords: ["chaparral","sage","scrub","shrub","canyon","hillside","grassland"],
    heroEmoji: "🌾",
  },
  "coastal-sage": {
    name: "Coastal Sage Scrub",
    icon: "🌿",
    accent: "#8AB87A",
    bg: "linear-gradient(135deg,#3D5A3A,#5A7A4A)",
    identity: "The most threatened habitat in California — a fragrant coastal shrubland with high gnatcatcher fidelity.",
    habitatKeywords: ["coastal","sage","scrub","bluff","coastal sage"],
    heroEmoji: "🌿",
  },
  "riparian": {
    name: "Riparian",
    icon: "🌊",
    accent: "#6AB87A",
    bg: "linear-gradient(135deg,#1C3A2A,#2D5A3A)",
    identity: "Creek corridors — the county's nervous system, threading water, willow, and cottonwood through every biome.",
    habitatKeywords: ["riparian","creek","river","stream","willow","cottonwood","wetland"],
    heroEmoji: "🌊",
  },
  "tidal-marsh": {
    name: "Tidal Marsh",
    icon: "🦅",
    accent: "#5A9AB8",
    bg: "linear-gradient(135deg,#1C3A5A,#2D5A7A)",
    identity: "The bay — where the entire OC watershed comes to rest in a living tidal engine.",
    habitatKeywords: ["tidal","marsh","estuary","mudflat","bay","pickleweed","saltmarsh"],
    heroEmoji: "🦅",
  },
  "beach": {
    name: "Beach & Intertidal",
    icon: "🐚",
    accent: "#7A9AB8",
    bg: "linear-gradient(135deg,#2A3A5A,#3A4A6A)",
    identity: "Six intertidal zones stacked from splash to subtidal — each a complete ecological world on a six-hour clock.",
    habitatKeywords: ["beach","intertidal","tidepool","reef","sand","pier","coastal","harbor"],
    heroEmoji: "🐚",
  },
  "oak-woodland": {
    name: "Oak Woodland",
    icon: "🌳",
    accent: "#7AB87A",
    bg: "linear-gradient(135deg,#2A3A1C,#3A5A2A)",
    identity: "A single mature Coast Live Oak supports 200 species — every grove is a 500-year-old apartment with no vacancies.",
    habitatKeywords: ["oak","woodland","grove","sycamore","arboretum"],
    heroEmoji: "🌳",
  },
};

const RARE_STATUSES = [
  "endangered","threatened","critically endangered","rare","very rare",
  "state threatened","federally threatened","federally endangered",
  "species of special concern","of concern","sensitive","protected",
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASON_OF = [
  "winter","winter","spring","spring","spring",
  "summer","summer","summer","fall","fall","fall","winter"
];
const SEASON_COLOR = { spring:"#4A9A5A", summer:"#D4883A", fall:"#8A5A2A", winter:"#3A6A9A" };
const SEASON_ICON  = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const GROUP_ICONS  = {
  mammal:"🦌", bird:"🐦", reptile:"🦎", amphibian:"🐸", fish:"🐟",
  insect:"🦋", arachnid:"🕷", crustacean:"🦀", mollusk:"🐚",
  invertebrate:"🪱", plant:"🌿", fungi:"🍄", lichen:"🌱", algae:"🌊",
  "human impact":"🏗",
};

// ── reduceHabitat() ───────────────────────────────────────────────────────────
function reduceHabitat({ habitatType, observations, species, trails }) {
  const def = HABITATS[habitatType];
  if (!def) return null;

  // 1. Identify trails in this habitat
  const habitatTrailIds = new Set(
    trails
      .filter(t => {
        const text = ([...(t.habitatTypes||[])].join(" ") + " " + (t.name||"") + " " + (t.ecologicalNotes||"")).toLowerCase();
        return def.habitatKeywords.some(kw => text.includes(kw));
      })
      .map(t => t.id)
  );

  // 2. Observations in this habitat (privacy filtered)
  const habitatObs = observations.filter(o => {
    if (!o.trailId || !habitatTrailIds.has(o.trailId)) return false;
    if (o.sensitivityLevel === "high") return false;
    if (o.isPublicEligible === false) return false;
    return true;
  });

  const spMap = {};
  (species || []).forEach(s => { if (s?.id) spMap[s.id] = s; });

  // 3. Unique species in habitat
  const uniqueSpIds = [...new Set(habitatObs.map(o => o.speciesId).filter(Boolean))];

  // 4. Rarity pass
  const rareSpecies = uniqueSpIds
    .map(id => spMap[id])
    .filter(s => s && RARE_STATUSES.some(r => (s.conservationStatus||"").toLowerCase().includes(r)))
    .map(s => ({ speciesId: s.id, name: s.name, status: s.conservationStatus, thumbnail: s.imageUrl, group: s.group }));

  // 5. Defining species — score by: obs frequency + trail spread + seasonal reliability
  const spScore = {};
  uniqueSpIds.forEach(id => {
    const obs = habitatObs.filter(o => o.speciesId === id);
    const trailSpread = new Set(obs.map(o => o.trailId)).size;
    const seasonSpread = new Set(obs.map(o => o.season).filter(Boolean)).size;
    const sp = spMap[id];
    const seasonalBreadth = sp ? (sp.seasonPresence || []).length : 0;
    spScore[id] = obs.length * 2 + trailSpread * 3 + seasonSpread * 2 + seasonalBreadth;
  });
  const definingSpecies = uniqueSpIds
    .sort((a, b) => (spScore[b] || 0) - (spScore[a] || 0))
    .slice(0, 12)
    .map(id => {
      const s = spMap[id];
      return s ? { speciesId: id, name: s.name, thumbnail: s.imageUrl, group: s.group,
        score: spScore[id], isRare: rareSpecies.some(r => r.speciesId === id) } : null;
    })
    .filter(Boolean);

  // 6. Seasonal species blocks
  const seasonal = { spring: [], summer: [], fall: [], winter: [] };
  uniqueSpIds.forEach(id => {
    const s = spMap[id];
    if (!s) return;
    (s.seasonPresence || []).forEach(season => {
      const key = season.toLowerCase();
      if (seasonal[key]) {
        seasonal[key].push({
          speciesId: id, name: s.name, thumbnail: s.imageUrl, group: s.group,
          isRare: rareSpecies.some(r => r.speciesId === id),
        });
      }
    });
  });

  // 7. Fidelity curve — 12-month activity bar (sightings per month across habitat)
  const monthBuckets = Array.from({length:12},(_,i) => ({month:i+1,count:0}));
  habitatObs.forEach(o => {
    const m = o.month != null ? o.month : (o.timestamp ? new Date(o.timestamp).getMonth() : null);
    if (m != null && m >= 0 && m < 12) monthBuckets[m].count++;
  });

  // 8. Companion co-occurrence (habitat-level)
  const coMap = {};
  habitatObs.forEach(o => {
    if (!o.speciesId) return;
    habitatObs.forEach(o2 => {
      if (o2.speciesId && o2.speciesId !== o.speciesId && o2.trailId === o.trailId) {
        const key = [o.speciesId, o2.speciesId].sort().join("__");
        coMap[key] = (coMap[key] || 0) + 1;
      }
    });
  });
  const companionScore = {};
  Object.entries(coMap).forEach(([key, score]) => {
    const [a, b] = key.split("__");
    companionScore[a] = (companionScore[a] || 0) + score;
    companionScore[b] = (companionScore[b] || 0) + score;
  });
  const companions = Object.entries(companionScore)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, score]) => {
      const s = spMap[id];
      return s ? { speciesId:id, name:s.name, score, thumbnail:s.imageUrl, group:s.group } : null;
    })
    .filter(Boolean);

  // 9. Timeline — recent sightings across habitat trails
  const seen = new Set();
  const timeline = habitatObs
    .filter(o => o.speciesId && o.timestamp)
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(o => {
      const key = `${o.speciesId}_${new Date(o.timestamp).getMonth()}_${new Date(o.timestamp).getFullYear()}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const s = spMap[o.speciesId];
      return {
        date: o.timestamp,
        speciesId: o.speciesId,
        name: o.speciesName || s?.name || "Unknown",
        thumbnail: s?.imageUrl || null,
        rare: rareSpecies.some(r => r.speciesId === o.speciesId),
        season: o.season,
        trailName: o.trailName,
      };
    })
    .filter(Boolean)
    .slice(0, 25);

  // 10. Stats
  const stats = {
    speciesCount: uniqueSpIds.length,
    sightingCount: habitatObs.length,
    rareCount: rareSpecies.length,
    trailCount: habitatTrailIds.size,
  };

  return { definingSpecies, seasonal, fidelityCurve: monthBuckets,
    rareSpecies, companions, timeline, stats,
    mapFilters: { season: SEASON_OF[new Date().getMonth()] } };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HabitatDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const habitatType = searchParams.get("type") || "chaparral";
  const def = HABITATS[habitatType] || HABITATS["chaparral"];

  const [trails, setTrails]   = useState([]);
  const [obs,    setObs]     = useState([]);
  const [sp,     setSp]      = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("defining"); // defining | seasonal | fidelity | companions | timeline | rare

  useEffect(() => {
    Promise.all([
      Trail.filter({}).catch(() => []),
      Observation.filter({}).catch(() => []),
      Species.filter({}).catch(() => []),
    ]).then(([t, o, s]) => {
      setTrails(t || []);
      setObs(o || []);
      setSp(s || []);
      setLoading(false);
    });
  }, []);

  const intel = useMemo(() => {
    if (loading) return null;
    return reduceHabitat({ habitatType, observations: obs, species: sp, trails });
  }, [loading, obs, sp, trails, habitatType]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentSeason = SEASON_OF[currentMonth];

  const TABS = [
    { key:"defining",   label:"🌿 Keystone"  },
    { key:"seasonal",   label:"🗓 Seasons"   },
    { key:"fidelity",   label:"📊 Fidelity"  },
    { key:"companions", label:"🔗 Co-seen"   },
    { key:"timeline",   label:"🕐 Timeline"  },
    ...(intel?.rareSpecies.length ? [{ key:"rare", label:`⚠️ ${intel.rareSpecies.length} Rare` }] : []),
  ];

  const maxFidelity = intel ? Math.max(...intel.fidelityCurve.map(m => m.count), 1) : 1;

  return (
    <div style={{ minHeight:"100vh", background:"#0D1520",
      fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:80 }}>

      {/* Hero */}
      <div style={{ background: def.bg, padding:"24px 20px 20px" }}>
        <button onClick={() => navigate(-1)}
          style={{ background:"rgba(0,0,0,0.2)", border:"none", color:"rgba(240,233,214,0.7)",
            fontSize:13, borderRadius:8, padding:"5px 10px", cursor:"pointer", marginBottom:14 }}>
          ← Back
        </button>
        <div style={{ fontSize:36, marginBottom:6 }}>{def.heroEmoji}</div>
        <div style={{ color:"rgba(240,233,214,0.55)", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>
          Habitat Intelligence
        </div>
        <div style={{ color:"#F0E9D6", fontSize:22, fontWeight:800,
          letterSpacing:"-0.01em", marginBottom:6 }}>
          {def.name}
        </div>
        <div style={{ color:"rgba(240,233,214,0.7)", fontSize:13, lineHeight:1.6 }}>
          {def.identity}
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>

        {/* Stats row */}
        {intel && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:14 }}>
            {[
              { label:"Species",  value: intel.stats.speciesCount },
              { label:"Sightings",value: intel.stats.sightingCount },
              { label:"Trails",   value: intel.stats.trailCount },
              { label:"Rare",     value: intel.stats.rareCount },
            ].map(s => (
              <div key={s.label} style={{ background:"#111E16",
                border:"1px solid rgba(127,175,138,0.12)", borderRadius:10,
                padding:"9px 0", textAlign:"center" }}>
                <div style={{ color:"#E8F4E8", fontSize:17, fontWeight:700 }}>{s.value}</div>
                <div style={{ color:"#3A5A4A", fontSize:8, marginTop:1,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Map + filter buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <button onClick={() => navigate(`/Map?season=${currentSeason}`)}
            style={{ flex:1, padding:"10px", borderRadius:10,
              background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.25)",
              color:"#7FAF8A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            🗺 View Habitat on Map →
          </button>
          <button onClick={() => navigate(`/Map?season=${currentSeason}&seenRecently=true`)}
            style={{ flex:1, padding:"10px", borderRadius:10,
              background:"rgba(74,154,90,0.06)", border:"1px solid rgba(74,154,90,0.15)",
              color:"#5A8A6A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            👁 Active Now →
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#3A5A4A" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🌿</div>
            <div style={{ fontSize:12 }}>Computing habitat intelligence…</div>
          </div>
        )}

        {/* No data state */}
        {!loading && intel && intel.stats.sightingCount === 0 && (
          <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.12)",
            borderRadius:12, padding:"24px 16px", textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{def.icon}</div>
            <div style={{ color:"#7FAF8A", fontSize:13, fontWeight:600, marginBottom:4 }}>
              No sightings recorded in this habitat yet
            </div>
            <div style={{ color:"#3A5A4A", fontSize:11 }}>
              Log your first sighting on a trail in this habitat to activate intelligence.
            </div>
          </div>
        )}

        {/* Intelligence tabs */}
        {!loading && intel && intel.stats.sightingCount > 0 && (
          <>
            {/* Tab bar */}
            <div style={{ display:"flex", gap:5, overflowX:"auto",
              scrollbarWidth:"none", marginBottom:12, paddingBottom:2 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flexShrink:0, padding:"6px 12px", borderRadius:14,
                    fontSize:11, fontWeight: tab===t.key ? 700 : 400, cursor:"pointer",
                    background: tab===t.key ? "rgba(74,154,90,0.2)" : "#111E16",
                    border:`1px solid ${tab===t.key ? "rgba(74,154,90,0.4)" : "rgba(74,154,90,0.1)"}`,
                    color: tab===t.key ? "#A8D5B0" : "#4A6A5A" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Defining / Keystone Species ── */}
            {tab === "defining" && (
              <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:14, padding:"14px" }}>
                <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                  {intel.definingSpecies.length} species define this habitat
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                  {intel.definingSpecies.map(s => (
                    <button key={s.speciesId}
                      onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId}`)}
                      style={{ background:"#1C3A2A", border:s.isRare
                        ? "1px solid rgba(224,144,128,0.3)" : "none",
                        borderRadius:10, aspectRatio:"1", overflow:"hidden",
                        position:"relative", cursor:"pointer", padding:0 }}>
                      {s.thumbnail
                        ? <img src={s.thumbnail} alt={s.name}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ display:"flex", alignItems:"center",
                            justifyContent:"center", height:"100%",
                            fontSize:20, opacity:0.3 }}>
                            {GROUP_ICONS[s.group?.toLowerCase()] || "🌿"}
                          </div>
                      }
                      <div style={{ position:"absolute", bottom:0, left:0, right:0,
                        padding:"2px 3px",
                        background:"linear-gradient(transparent,rgba(0,0,0,0.75))" }}>
                        <div style={{ fontSize:7, color:"#C4DFC8", fontWeight:600,
                          overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                          {s.name}
                        </div>
                      </div>
                      {s.isRare && (
                        <div style={{ position:"absolute", top:3, right:3,
                          width:6, height:6, borderRadius:"50%", background:"#E09080" }} />
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ color:"#2A4A3A", fontSize:9, marginTop:10 }}>
                  Ranked by: observation frequency · trail spread · seasonal reliability
                </div>
              </div>
            )}

            {/* ── Seasonal Windows ── */}
            {tab === "seasonal" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {["spring","summer","fall","winter"].map(season => {
                  const list = intel.seasonal[season] || [];
                  const sc = SEASON_COLOR[season];
                  return (
                    <div key={season} style={{ background:"#111E16",
                      border:`1px solid ${sc}22`, borderRadius:12, overflow:"hidden" }}>
                      <div style={{ padding:"10px 14px", display:"flex",
                        alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontSize:15 }}>{SEASON_ICON[season]}</span>
                          <span style={{ color: sc, fontSize:12, fontWeight:700,
                            textTransform:"capitalize" }}>{season}</span>
                          {season === currentSeason && (
                            <span style={{ fontSize:8, color:"#A8D5B0", fontWeight:700,
                              background:"rgba(74,154,90,0.15)", borderRadius:4,
                              padding:"1px 5px" }}>Now</span>
                          )}
                        </div>
                        <span style={{ color:"#3A5A4A", fontSize:10 }}>
                          {list.length} species
                        </span>
                      </div>
                      {list.length > 0 && (
                        <div style={{ padding:"0 12px 12px",
                          display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
                          {list.slice(0,12).map(s => (
                            <button key={s.speciesId}
                              onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId}`)}
                              style={{ flexShrink:0, width:52, background:"none",
                                border:"none", padding:0, cursor:"pointer" }}>
                              <div style={{ width:52, height:52, borderRadius:8,
                                overflow:"hidden", background:"#1C3A2A",
                                border: s.isRare ? "1px solid rgba(224,144,128,0.35)" : "none" }}>
                                {s.thumbnail
                                  ? <img src={s.thumbnail} alt={s.name}
                                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                  : <div style={{ display:"flex", alignItems:"center",
                                      justifyContent:"center", height:"100%",
                                      fontSize:18, opacity:0.25 }}>
                                      {GROUP_ICONS[s.group?.toLowerCase()] || "🌿"}
                                    </div>
                                }
                              </div>
                              <div style={{ fontSize:7.5, color:"#3A6A5A", marginTop:2,
                                textAlign:"center", overflow:"hidden",
                                whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:52 }}>
                                {s.name.split(" ").slice(-1)[0]}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Fidelity Curve ── */}
            {tab === "fidelity" && (
              <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:14, padding:"14px" }}>
                <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                  Habitat activity by month — ecological fidelity curve
                </div>
                <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:70 }}>
                  {intel.fidelityCurve.map((m, i) => {
                    const isCur = i === currentMonth;
                    const ratio = m.count / maxFidelity;
                    const sColor = SEASON_COLOR[SEASON_OF[i]];
                    return (
                      <div key={m.month} style={{ flex:1, display:"flex",
                        flexDirection:"column", alignItems:"center", gap:2 }}>
                        <div style={{ fontSize:7.5, color: isCur ? "#A8D5B0" : "#2A4A3A",
                          fontWeight: isCur ? 700 : 400 }}>
                          {m.count > 0 ? m.count : ""}
                        </div>
                        <div style={{
                          width:"100%", borderRadius:3,
                          height:`${Math.max(3, ratio * 48)}px`,
                          background: isCur ? "#7FAF8A" : (m.count > 0 ? sColor : "#1C3A2A"),
                          opacity: m.count > 0 ? (isCur ? 1 : 0.7) : 0.25,
                          boxShadow: isCur ? "0 0 8px rgba(127,175,138,0.5)" : "none",
                        }} />
                        <div style={{ fontSize:6.5, color: isCur ? "#7FAF8A" : "#2A4A3A",
                          fontWeight: isCur ? 700 : 400 }}>
                          {MONTH_SHORT[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Peak callout */}
                {(() => {
                  const peak = intel.fidelityCurve.reduce((a,b) => b.count > a.count ? b : a);
                  if (!peak.count) return null;
                  return (
                    <div style={{ marginTop:12, padding:"8px 10px",
                      background:"rgba(74,154,90,0.08)", borderRadius:8,
                      border:"1px solid rgba(74,154,90,0.15)" }}>
                      <div style={{ color:"#7FAF8A", fontSize:11, fontWeight:600 }}>
                        Peak month: {MONTH_SHORT[peak.month-1]} · {peak.count} sighting{peak.count!==1?"s":""}
                      </div>
                      <div style={{ color:"#3A5A4A", fontSize:10, marginTop:2 }}>
                        {SEASON_ICON[SEASON_OF[peak.month-1]]} {SEASON_OF[peak.month-1]} season
                      </div>
                    </div>
                  );
                })()}
                <div style={{ color:"#2A4A3A", fontSize:9, marginTop:10 }}>
                  Fidelity = species return rate across all trails in this habitat.
                </div>
              </div>
            )}

            {/* ── Companions ── */}
            {tab === "companions" && (
              <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:14, padding:"14px" }}>
                {intel.companions.length === 0 ? (
                  <div style={{ color:"#3A5A4A", fontSize:12 }}>
                    Not enough sightings to compute co-occurrence.
                  </div>
                ) : (
                  <>
                    <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                      Species most frequently seen together in this habitat
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {intel.companions.map((c, i) => (
                        <button key={c.speciesId}
                          onClick={() => navigate(`/SpeciesDetail?id=${c.speciesId}`)}
                          style={{ display:"flex", alignItems:"center", gap:10,
                            background:"rgba(127,175,138,0.05)",
                            border:"1px solid rgba(127,175,138,0.1)",
                            borderRadius:10, padding:"8px 10px",
                            cursor:"pointer", textAlign:"left" }}>
                          <div style={{ width:38, height:38, borderRadius:8,
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
                    <div style={{ color:"#2A4A3A", fontSize:9, marginTop:10 }}>
                      Co-occurrence score = shared trail sessions across habitat
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Timeline ── */}
            {tab === "timeline" && (
              <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:14, padding:"14px" }}>
                {intel.timeline.length === 0 ? (
                  <div style={{ color:"#3A5A4A", fontSize:12 }}>
                    No timestamped sightings yet.
                  </div>
                ) : (
                  <>
                    <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
                      textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                      Recent sightings across {def.name}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {intel.timeline.map((t, i) => {
                        const d = new Date(t.date);
                        const label = `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
                        return (
                          <button key={`${t.speciesId}-${i}`}
                            onClick={() => navigate(`/SpeciesDetail?id=${t.speciesId}`)}
                            style={{ display:"flex", alignItems:"center", gap:9,
                              background: t.rare
                                ? "rgba(224,144,128,0.05)" : "rgba(127,175,138,0.04)",
                              border:`1px solid ${t.rare
                                ? "rgba(224,144,128,0.2)" : "rgba(127,175,138,0.08)"}`,
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
                                  overflow:"hidden", whiteSpace:"nowrap",
                                  textOverflow:"ellipsis", maxWidth:130 }}>
                                  {t.name}
                                </span>
                                {t.rare && (
                                  <span style={{ fontSize:7.5, fontWeight:700, color:"#E09080",
                                    background:"rgba(224,144,128,0.1)",
                                    borderRadius:4, padding:"1px 4px", flexShrink:0 }}>
                                    ⚠ rare
                                  </span>
                                )}
                              </div>
                              <div style={{ color:"#3A6A5A", fontSize:10, marginTop:1 }}>
                                {label}{t.trailName ? ` · ${t.trailName}` : ""}
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
              <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:14, padding:"14px" }}>
                <div style={{ padding:"8px 10px", background:"rgba(191,54,12,0.08)",
                  border:"1px solid rgba(191,54,12,0.2)", borderRadius:9, marginBottom:12 }}>
                  <div style={{ color:"#D47060", fontSize:11, fontWeight:700 }}>
                    ⚠️ {intel.rareSpecies.length} at-risk species recorded in {def.name}
                  </div>
                  <div style={{ color:"#8A5050", fontSize:10, marginTop:2 }}>
                    Locations shown at corridor level only in public view.
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {intel.rareSpecies.map(s => (
                    <button key={s.speciesId}
                      onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId}`)}
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
                          <div style={{ color:"#D47060", fontSize:10,
                            marginTop:2, fontWeight:600, textTransform:"capitalize" }}>
                            {s.status}
                          </div>
                        )}
                      </div>
                      <div style={{ color:"#7A4040", fontSize:11 }}>›</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="habitats" />
    </div>
  );
}
