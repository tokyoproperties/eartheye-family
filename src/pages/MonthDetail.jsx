import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Observation, Species, Trail } from "@/api/entities";

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
// ── Constants ────────────────────────────────────────────────────────────
const MONTH_NAMES_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTH_NAMES_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter",
};
const SEASON_LABELS = { spring:"Spring", summer:"Summer", fall:"Fall", winter:"Winter" };
const SC = {
  spring:{ accent:"#4A9A5A", dark:"#0A2A10", mid:"#1C4A28", dim:"rgba(74,154,90,0.15)", text:"#C4DFC8" },
  summer:{ accent:"#F9A825", dark:"#2A1A00", mid:"#3A2800", dim:"rgba(249,168,37,0.15)", text:"#F5DFA8" },
  fall:  { accent:"#BF360C", dark:"#2A0A00", mid:"#3A1200", dim:"rgba(191,54,12,0.15)",  text:"#F0C4B0" },
  winter:{ accent:"#1565C0", dark:"#001A3A", mid:"#0A2248", dim:"rgba(21,101,192,0.15)", text:"#B0CCF0" },
};
const SI = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const GROUP_ICONS = {
  mammal:"🦌", bird:"🐦", reptile:"🦎", amphibian:"🐸", fish:"🐟",
  insect:"🦋", arachnid:"🕷", crustacean:"🦀", mollusk:"🐚",
  invertebrate:"🪱", plant:"🌿", fungi:"🍄", lichen:"🌿", algae:"🌊",
  "human impact":"🏗",
};
const RARE_FLAGS = [
  "endangered","threatened","critically endangered","rare","very rare",
  "state threatened","federally threatened","federally endangered",
];

function fmt(iso, opts = { month:"short", day:"numeric" }) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", opts);
}

function getSeason(monthIdx) { return MONTH_SEASON[((monthIdx % 12) + 12) % 12]; }

// ── Species Tile ─────────────────────────────────────────────────────────
function Tile({ species, badge, onClick }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={onClick}
      style={{ aspectRatio:"1", borderRadius:10, overflow:"hidden", background:"#1C3A2A",
        border:"none", padding:0, cursor:"pointer", position:"relative" }}>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:22, opacity:0.15 }}>
        {GROUP_ICONS[species.group?.toLowerCase()] || "🌿"}
      </div>
      {species.imageUrl && (
        <img src={species.imageUrl} alt={species.name} loading="lazy"
          onLoad={() => setOk(true)}
          onError={e => { e.currentTarget.style.display="none"; }}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", opacity:ok?1:0, transition:"opacity 0.3s" }} />
      )}
      {badge && (
        <div style={{ position:"absolute", top:3, right:3, background:"rgba(0,0,0,0.7)",
          borderRadius:4, padding:"1px 5px", fontSize:8, color:"#FFD54F", fontWeight:700 }}>
          {badge}
        </div>
      )}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"2px 4px", background:"linear-gradient(transparent,rgba(0,0,0,0.75))" }}>
        <div style={{ color:"#E8F4E8", fontSize:7, fontWeight:600, lineHeight:1.3,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {species.name}
        </div>
      </div>
    </button>
  );
}

// ── Month Arc Bar — prev / current / next ─────────────────────────────────
function MonthArcBar({ currentMonth, currentYear, sc, navigate }) {
  const prev = ((currentMonth - 1) + 12) % 12;
  const next = (currentMonth + 1) % 12;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const months = [
    { idx: prev,         year: prevYear,  active: false },
    { idx: currentMonth, year: currentYear, active: true  },
    { idx: next,         year: nextYear,  active: false  },
  ];

  return (
    <div style={{ display:"flex", gap:6, alignItems:"stretch", marginTop:12, marginBottom:4 }}>
      {months.map(({ idx, year: yr, active }) => (
        <button key={`${idx}-${yr}`}
          onClick={() => !active && navigate(`/MonthDetail?month=${idx + 1}&year=${yr}`)}
          style={{
            flex: active ? 2 : 1,
            padding: active ? "10px 12px" : "8px 10px",
            borderRadius: 10,
            border: active ? `1px solid ${sc.accent}` : "1px solid rgba(255,255,255,0.06)",
            background: active ? sc.dim : "rgba(255,255,255,0.03)",
            cursor: active ? "default" : "pointer",
            textAlign: "center",
            transition: "all 0.2s",
          }}>
          <div style={{ fontSize: active ? 13 : 11, fontWeight: 700,
            color: active ? sc.accent : "#3A5A4A" }}>
            {MONTH_NAMES_SHORT[idx]}
          </div>
          {active && (
            <div style={{ fontSize: 9, color: sc.text, marginTop: 2, opacity: 0.7 }}>
              {yr}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
  return (
    <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10,
      padding:"10px 6px", textAlign:"center", border:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize:20, fontWeight:800, color: accent }}>{value}</div>
      <div style={{ fontSize:9, color:"#5C8A6A", marginTop:2, fontWeight:600,
        textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
    </div>
  );
}

// ── Group Bar ─────────────────────────────────────────────────────────────
function GroupBar({ breakdown, sc }) {
  if (!breakdown.length) return null;
  const max = breakdown[0][1];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {breakdown.slice(0, 8).map(([group, count]) => (
        <div key={group} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:16, fontSize:12, textAlign:"center", flexShrink:0 }}>
            {GROUP_ICONS[group] || "🌿"}
          </div>
          <div style={{ flex:1, height:8, borderRadius:4, background:"rgba(255,255,255,0.06)",
            overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:4,
              width:`${Math.max(4, (count / max) * 100)}%`,
              background: sc.accent, opacity:0.75, transition:"width 0.4s" }} />
          </div>
          <div style={{ width:20, fontSize:11, color: sc.accent, fontWeight:700,
            textAlign:"right", flexShrink:0 }}>
            {count}
          </div>
          <div style={{ width:52, fontSize:9, color:"#5C8A6A",
            textTransform:"capitalize", flexShrink:0 }}>
            {group}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ icon, label, count, sc }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background: sc.accent, flexShrink:0 }} />
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em",
        textTransform:"uppercase", color: sc.accent }}>
        {icon} {label}
      </span>
      {count != null && (
        <span style={{ fontSize:10, color:"#3A5A4A", marginLeft:"auto" }}>{count}</span>
      )}
    </div>
  );
}

// ── Card Wrapper ─────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background:"#0F2218", border:"1px solid rgba(127,175,138,0.15)",
      borderRadius:14, padding:"16px 14px", marginBottom:12, ...style }}>
      {children}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function MonthDetail() {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const monthParam   = parseInt(params.get("month") || String(new Date().getMonth() + 1), 10);
  const yearParam    = parseInt(params.get("year")  || String(new Date().getFullYear()),  10);

  // month is 1-based in URL, 0-based internally
  const monthIdx = Math.min(Math.max(monthParam - 1, 0), 11);
  const year     = yearParam;
  const season   = getSeason(monthIdx);
  const sc       = SC[season] || SC.spring;

  const [obs,      setObs]      = useState([]);
  const [spMap,    setSpMap]    = useState({});
  const [trailMap, setTrailMap] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch all observations, paginated
      let all = [], skip = 0, more = true;
      while (more) {
        const pg = await Observation.filter({}).catch(() => []);
        if (!Array.isArray(pg) || !pg.length) break;
        all = all.concat(pg); more = pg.length === 500; skip += 500;
      }

      // Filter to this month + year
      const filtered = all.filter(o => {
        const ts  = o.timestamp ? new Date(o.timestamp) : null;
        const cr  = o.created_date ? new Date(o.created_date) : null;
        const oyr = Number(o.year || (ts ? ts.getFullYear() : cr ? cr.getFullYear() : 0));
        const m   = o.month != null ? Number(o.month)
                  : ts ? ts.getMonth() : cr ? cr.getMonth() : null;
        return oyr === year && m === monthIdx;
      });

      setObs(filtered);

      // Resolve species
      if (filtered.length) {
        const allSp = await Species.filter({}).catch(() => []);
        const sm = {}; allSp.filter(Boolean).forEach(s => { sm[s.id] = s; });
        setSpMap(sm);

        const allTr = await Trail.filter({}).catch(() => []);
        const tm = {}; allTr.filter(Boolean).forEach(t => { tm[t.id] = t; });
        setTrailMap(tm);
      }
      setLoading(false);
    }
    load();
  }, [monthIdx, year]);

  // ── Derived intelligence ────────────────────────────────────────────────
  const uniqueSpIds  = [...new Set(obs.map(o => o.speciesId).filter(Boolean))];
  const resolvedSp   = uniqueSpIds.map(id => spMap[id]).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name));

  const sortedObs    = [...obs].filter(o => o.timestamp)
    .sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const firstObs     = sortedObs[0];
  const firstSp      = firstObs ? spMap[firstObs.speciesId] : null;
  const firstTrail   = firstObs ? trailMap[firstObs.trailId] : null;

  const rareFinds = obs
    .map(o => spMap[o.speciesId])
    .filter(sp => sp && (
      RARE_FLAGS.includes((sp.conservationStatus || "").toLowerCase()) ||
      RARE_FLAGS.includes((sp.riskCategory       || "").toLowerCase()) ||
      RARE_FLAGS.includes((sp.frequency          || "").toLowerCase())
    ))
    .filter((sp, i, a) => a.findIndex(x => x.id === sp.id) === i);

  // Top trail
  const trailCounts = {};
  obs.forEach(o => { if (o.trailId) trailCounts[o.trailId] = (trailCounts[o.trailId] || 0) + 1; });
  const topTrailEntry = Object.entries(trailCounts).sort((a,b) => b[1]-a[1])[0];
  const topTrail      = topTrailEntry ? trailMap[topTrailEntry[0]] : null;
  const topTrailCount = topTrailEntry ? topTrailEntry[1] : 0;

  // Group breakdown
  const gc = {};
  obs.forEach(o => {
    const g = spMap[o.speciesId]?.group?.toLowerCase();
    if (g) gc[g] = (gc[g] || 0) + 1;
  });
  const groupBreakdown = Object.entries(gc).sort((a,b) => b[1]-a[1]);

  // Dominant group label
  const mostlyGroup = groupBreakdown[0]?.[0] || null;

  // Trails visited, sorted desc
  const trailBreakdown = Object.entries(trailCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([id, count]) => ({ trail: trailMap[id], id, count }))
    .filter(e => e.trail);

  // Privacy-filtered trail chips for each species (used for display consistency)
  // For month-level, we show trails at the trail level — curated data, always eligible.
  // Community-facing hook: filterForPublic ensures covenant is honored.
  const publicObs = filterForPublic(obs, { isOwner: true }); // owner view in personal journal

  // Season nav
  const seasonLabel = SEASON_LABELS[season];
  const prevMonthIdx = ((monthIdx - 1) + 12) % 12;
  const nextMonthIdx = (monthIdx + 1) % 12;
  const prevYear = monthIdx === 0  ? year - 1 : year;
  const nextYear = monthIdx === 11 ? year + 1 : year;

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#070F0A", color:"#5A7A5A" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
        <div style={{ fontSize:13, opacity:0.7 }}>Loading {MONTH_NAMES_FULL[monthIdx]}…</div>
      </div>
    </div>
  );

  const empty = obs.length === 0;

  return (
    <div style={{ minHeight:"100vh", background:"#070F0A", paddingBottom:100 }}>
      <div style={{ maxWidth:520, margin:"0 auto", padding:"0 16px" }}>

        {/* ── Back nav ────────────────────────────────────────────── */}
        <div style={{ paddingTop:16, paddingBottom:4, display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => navigate(-1)}
            style={{ background:"none", border:"none", color:"#5C8A6A",
              fontSize:13, cursor:"pointer", padding:"4px 0", display:"flex",
              alignItems:"center", gap:4 }}>
            ← Back
          </button>
          <span style={{ color:"#2A4A3A", fontSize:12 }}>
            {seasonLabel} {year}
          </span>
        </div>

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <div style={{ paddingTop:8, paddingBottom:4 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em",
            textTransform:"uppercase", color: sc.accent, marginBottom:4 }}>
            {SI[season]} Personal Record
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:"#E8F4E8", lineHeight:1.1 }}>
            {MONTH_NAMES_FULL[monthIdx]} {year}
          </div>
          {!empty && (
            <div style={{ fontSize:13, color:"#5C8A6A", marginTop:6 }}>
              {resolvedSp.length} species · {obs.length} sighting{obs.length !== 1 ? "s" : ""}
              {mostlyGroup ? ` · mostly ${mostlyGroup}` : ""}
            </div>
          )}
        </div>

        {/* ── Month Arc Bar ────────────────────────────────────────── */}
        <MonthArcBar
          currentMonth={monthIdx}
          currentYear={year}
          sc={sc}
          navigate={navigate}
        />

        {empty ? (
          <Card style={{ marginTop:16, textAlign:"center", padding:"32px 16px" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🌿</div>
            <div style={{ color:"#5C8A6A", fontSize:14, fontWeight:600 }}>
              No sightings recorded in {MONTH_NAMES_FULL[monthIdx]} {year}
            </div>
            <div style={{ color:"#3A5A4A", fontSize:12, marginTop:6 }}>
              Head out and log your first one.
            </div>
          </Card>
        ) : (
          <>
            {/* ── Stat Row ───────────────────────────────────────── */}
            <div style={{ display:"flex", gap:6, marginTop:12, marginBottom:12 }}>
              <StatPill label="Species"  value={resolvedSp.length}    accent={sc.accent} />
              <StatPill label="Sightings" value={obs.length}          accent={sc.accent} />
              <StatPill label="Trails"   value={trailBreakdown.length} accent={sc.accent} />
              <StatPill label="Rare"     value={rareFinds.length}     accent="#FFD54F"   />
            </div>

            {/* ── Milestone Cards ────────────────────────────────── */}
            {(firstObs || topTrail) && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {/* First Sighting */}
                {firstObs && firstSp && (
                  <button onClick={() => navigate(`/SpeciesDetail?id=${firstSp.id}`)}
                    style={{ background:"#0F2218", border:`1px solid ${sc.accent}30`,
                      borderRadius:12, padding:10, textAlign:"left", cursor:"pointer",
                      overflow:"hidden", position:"relative" }}>
                    {firstSp.imageUrl && (
                      <div style={{ borderRadius:8, overflow:"hidden", height:64, marginBottom:6 }}>
                        <img src={firstSp.imageUrl} alt={firstSp.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em",
                      textTransform:"uppercase", color: sc.accent, marginBottom:2 }}>
                      First Sighting
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#C4DFC8",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {firstSp.name}
                    </div>
                    <div style={{ fontSize:10, color:"#5C8A6A", marginTop:1 }}>
                      {fmt(firstObs.timestamp)}
                      {firstTrail ? ` · ${firstTrail.name.split(" ")[0]}` : ""}
                    </div>
                  </button>
                )}

                {/* Top Trail */}
                {topTrail && (
                  <button onClick={() => navigate(`/TrailDetail?id=${topTrail.id}`)}
                    style={{ background:"#0F2218", border:"1px solid rgba(127,175,138,0.15)",
                      borderRadius:12, padding:10, textAlign:"left", cursor:"pointer",
                      overflow:"hidden", position:"relative" }}>
                    {topTrail.heroImage && (
                      <div style={{ borderRadius:8, overflow:"hidden", height:64, marginBottom:6 }}>
                        <img src={topTrail.heroImage} alt={topTrail.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em",
                      textTransform:"uppercase", color:"#7FAF8A", marginBottom:2 }}>
                      Top Trail
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#C4DFC8",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {topTrail.name}
                    </div>
                    <div style={{ fontSize:10, color:"#5C8A6A", marginTop:1 }}>
                      {topTrailCount} sighting{topTrailCount !== 1 ? "s" : ""}
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* ── Rare Finds ─────────────────────────────────────── */}
            {rareFinds.length > 0 && (
              <Card>
                <SectionHeader icon="⭐" label="Rare Finds" count={rareFinds.length} sc={sc} />
                <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                  {rareFinds.map(sp => (
                    <div key={sp.id} style={{ flexShrink:0, width:72 }}>
                      <Tile species={sp}
                        badge={sp.conservationStatus || sp.riskCategory || sp.frequency}
                        onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── By Group ───────────────────────────────────────── */}
            {groupBreakdown.length > 0 && (
              <Card>
                <SectionHeader icon="📊" label="By Group" sc={sc} />
                <GroupBar breakdown={groupBreakdown} sc={sc} />
              </Card>
            )}

            {/* ── Trails Visited ─────────────────────────────────── */}
            {trailBreakdown.length > 0 && (
              <Card>
                <SectionHeader icon="🥾" label="Trails Visited" count={trailBreakdown.length} sc={sc} />
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {trailBreakdown.map(({ trail, id, count }) => (
                    <button key={id} onClick={() => navigate(`/TrailDetail?id=${id}`)}
                      style={{ display:"flex", alignItems:"center", gap:10,
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(127,175,138,0.08)",
                        borderRadius:10, padding:"8px 10px", cursor:"pointer", textAlign:"left" }}>
                      <div style={{ width:32, height:32, borderRadius:8, overflow:"hidden",
                        background:"rgba(74,124,89,0.15)", flexShrink:0 }}>
                        {trail?.heroImage
                          ? <img src={trail.heroImage} alt={trail.name}
                              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ width:"100%", height:"100%", display:"flex",
                              alignItems:"center", justifyContent:"center", fontSize:14 }}>🥾</div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#C4DFC8",
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {trail?.name || id}
                        </div>
                        <div style={{ fontSize:10, color:"#5C8A6A", marginTop:1 }}>
                          {count} sighting{count !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="#3A5A4A" strokeWidth="2" style={{ flexShrink:0 }}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* ── Species This Month ─────────────────────────────── */}
            {resolvedSp.length > 0 && (
              <Card>
                <SectionHeader icon="🌿" label="Species This Month" count={resolvedSp.length} sc={sc} />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
                  {resolvedSp.map(sp => (
                    <Tile key={sp.id} species={sp}
                      onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)} />
                  ))}
                </div>
              </Card>
            )}

            {/* ── Sightings Log ──────────────────────────────────── */}
            {sortedObs.length > 0 && (
              <Card>
                <SectionHeader icon="📋" label="Sightings Log" count={sortedObs.length} sc={sc} />
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {sortedObs.map((o, i) => {
                    const sp    = spMap[o.speciesId];
                    const trail = trailMap[o.trailId];
                    return (
                      <button key={o.id || i}
                        onClick={() => sp && navigate(`/SpeciesDetail?id=${sp.id}`)}
                        style={{ display:"flex", alignItems:"center", gap:8,
                          background:"rgba(255,255,255,0.02)",
                          border:"1px solid rgba(127,175,138,0.06)",
                          borderRadius:8, padding:"6px 8px", cursor: sp?"pointer":"default",
                          textAlign:"left" }}>
                        <div style={{ width:32, height:32, borderRadius:6, overflow:"hidden",
                          background:"rgba(74,124,89,0.12)", flexShrink:0 }}>
                          {sp?.imageUrl
                            ? <img src={sp.imageUrl} alt={sp.name}
                                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                            : <div style={{ width:"100%", height:"100%", display:"flex",
                                alignItems:"center", justifyContent:"center", fontSize:14 }}>
                                {GROUP_ICONS[sp?.group?.toLowerCase()] || "🌿"}
                              </div>
                          }
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#C4DFC8",
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            {o.speciesName || sp?.name || "Unknown"}
                          </div>
                          <div style={{ fontSize:10, color:"#5C8A6A", marginTop:1 }}>
                            {trail?.name || "—"}
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:"#3A5A4A", flexShrink:0 }}>
                          {fmt(o.timestamp, { month:"short", day:"numeric" })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── Bottom Navigation ───────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
          <button onClick={() => navigate(`/SeasonDetail?season=${season}&year=${year}`)}
            style={{ width:"100%", padding:"12px", borderRadius:10, border:`1px solid ${sc.accent}30`,
              background: sc.dim, color: sc.accent, fontSize:13, fontWeight:600,
              cursor:"pointer" }}>
            View {seasonLabel} {year} →
          </button>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <button onClick={() => navigate(`/MonthDetail?month=${prevMonthIdx + 1}&year=${prevYear}`)}
              style={{ padding:"10px", borderRadius:10,
                border:"1px solid rgba(127,175,138,0.12)",
                background:"rgba(255,255,255,0.03)", color:"#5C8A6A",
                fontSize:12, fontWeight:600, cursor:"pointer" }}>
              ← {MONTH_NAMES_SHORT[prevMonthIdx]} {prevYear}
            </button>
            <button onClick={() => navigate(`/MonthDetail?month=${nextMonthIdx + 1}&year=${nextYear}`)}
              style={{ padding:"10px", borderRadius:10,
                border:"1px solid rgba(127,175,138,0.12)",
                background:"rgba(255,255,255,0.03)", color:"#5C8A6A",
                fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {MONTH_NAMES_SHORT[nextMonthIdx]} {nextYear} →
            </button>
          </div>
        </div>

        {/* View on Map → */}
        <button onClick={() => navigate(`/Map?season=${season}&year=${year}`)}
          style={{ width:"100%", marginTop:6, padding:"10px", borderRadius:10,
            border:`1px solid ${sc.accent}20`, background:"rgba(0,0,0,0.15)",
            color: sc.accent, fontSize:12, fontWeight:600,
            cursor:"pointer", textAlign:"center" }}>
          🗺 View {MONTH_NAMES_FULL[monthIdx]} on Map →
        </button>
      </div>
    </div>
  );
}
