import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Observation, Species, Trail } from "@/api/entities";

// ── Constants ─────────────────────────────────────────────────────────────
const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter",
};
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASON_MONTHS = {
  spring: [2,3,4], summer: [5,6,7], fall: [8,9,10], winter: [11,0,1],
};
const SC = {
  spring:{ bg:"#E8F5E9", accent:"#4A9A5A", text:"#1B5E20", dark:"#0A2A10", mid:"#1C4A28" },
  summer:{ bg:"#1A1A0F", accent:"#C4974A", text:"#C4974A", dark:"#1A1A0F", mid:"#252010" },
  fall:  { bg:"#FBE9E7", accent:"#BF360C", text:"#BF360C", dark:"#2A0A00", mid:"#3A1200" },
  winter:{ bg:"#E3F2FD", accent:"#1565C0", text:"#0D47A1", dark:"#001A3A", mid:"#0A2248" },
};
const SI = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const GROUP_ICONS = {
  mammal:"🦌", bird:"🐦", reptile:"🦎", amphibian:"🐸", fish:"🐟",
  insect:"🦋", arachnid:"🕷", crustacean:"🦀", mollusk:"🐚",
  invertebrate:"🪱", plant:"🌿", fungi:"🍄", lichen:"🌿", algae:"🌊",
  "human impact":"🏗",
};
const RARE_FLAGS = ["endangered","threatened","critically endangered","rare","very rare",
  "state threatened","federally threatened","federally endangered"];

function fmt(iso, opts = { month:"short", day:"numeric" }) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", opts);
}

// ── Species tile ──────────────────────────────────────────────────────────
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
            objectFit:"cover", opacity: ok?1:0, transition:"opacity 0.3s" }} />
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

// ── Monthly breakdown bar ─────────────────────────────────────────────────
function MonthlyBar({ obs, seasonMonths, sc, navigate, year }) {
  const counts = {};
  seasonMonths.forEach(m => { counts[m] = 0; });
  obs.forEach(o => {
    const m = o.month != null ? Number(o.month)
      : o.timestamp ? new Date(o.timestamp).getMonth() : null;
    if (m != null && counts[m] != null) counts[m]++;
  });
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:68, marginTop:8 }}>
      {seasonMonths.map(m => {
        const c = counts[m] || 0;
        const h = c === 0 ? 6 : Math.max(10, (c / max) * 50);
        return (
          <button key={m}
            onClick={() => navigate && navigate(`/MonthDetail?month=${m + 1}&year=${year}`)}
            style={{ flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", gap:4, background:"none", border:"none",
              cursor:"pointer", padding:"4px 0", borderRadius:6,
              transition:"opacity 0.15s" }}>
            <div style={{ width:"100%", borderRadius:"4px 4px 2px 2px", height:h,
              background: c > 0 ? sc.accent : "rgba(0,0,0,0.1)",
              opacity: c > 0 ? 0.8 + (c/max)*0.2 : 0.25,
              transition:"height 0.3s" }} />
            <span style={{ fontSize:9, color: c>0 ? sc.text : "#9BB8A4", fontWeight:600 }}>
              {MONTH_NAMES[m]}
            </span>
            {c > 0 && (
              <span style={{ fontSize:8, color:sc.accent }}>{c}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function SeasonDetail() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const season        = (params.get("season") || "spring").toLowerCase();
  const year          = params.get("year") || String(new Date().getFullYear());

  const [obs,      setObs]      = useState([]);
  const [spMap,    setSpMap]    = useState({});
  const [trailMap, setTrailMap] = useState({});
  const [loading,  setLoading]  = useState(true);

  const sc = SC[season] || SC.spring;
  const seasonMonths = SEASON_MONTHS[season] || [2,3,4];

  useEffect(() => {
    async function load() {
      let all = [], skip = 0, more = true;
      while (more) {
        const pg = await Observation.filter({}).catch(() => []);
        if (!Array.isArray(pg) || !pg.length) break;
        all = all.concat(pg); more = pg.length === 500; skip += 500;
      }
      // Filter to this season + year
      const filtered = all.filter(o => {
        const ts  = o.timestamp ? new Date(o.timestamp) : null;
        const cr  = o.created_date ? new Date(o.created_date) : null;
        const oyr = String(o.year || (ts ? ts.getFullYear() : cr ? cr.getFullYear() : ""));
        const m   = o.month != null ? Number(o.month) : ts ? ts.getMonth() : cr ? cr.getMonth() : null;
        const os  = o.season || (m != null ? MONTH_SEASON[m] : null);
        return oyr === year && os === season;
      });
      setObs(filtered);

      const ids = [...new Set(filtered.map(o => o.speciesId).filter(Boolean))];
      if (ids.length) {
        const all = await Species.filter({}).catch(() => []);
        const m = {}; all.filter(Boolean).forEach(s => { m[s.id] = s; });
        setSpMap(m);
      }
      const trailIds = [...new Set(filtered.map(o => o.trailId).filter(Boolean))];
      if (trailIds.length) {
        const trails = await Trail.filter({}).catch(() => []);
        const tm = {}; trails.filter(Boolean).forEach(t => { tm[t.id] = t; });
        setTrailMap(tm);
      }
      setLoading(false);
    }
    load();
  }, [season, year]);

  // ── Derived intelligence ─────────────────────────────────────────────
  const uniqueIds  = [...new Set(obs.map(o => o.speciesId).filter(Boolean))];
  const resolved   = uniqueIds.map(id => spMap[id]).filter(Boolean);
  const sortedObs  = [...obs].filter(o => o.timestamp).sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp));
  const firstObs   = sortedObs[0];
  const lastObs    = sortedObs[sortedObs.length-1];
  const firstSp    = firstObs ? spMap[firstObs.speciesId] : null;
  const lastSp     = lastObs  ? spMap[lastObs.speciesId]  : null;

  // Rare finds
  const rareFinds = obs
    .map(o => spMap[o.speciesId])
    .filter(sp => sp && (
      RARE_FLAGS.includes((sp.conservationStatus||"").toLowerCase()) ||
      RARE_FLAGS.includes((sp.riskCategory||"").toLowerCase()) ||
      RARE_FLAGS.includes((sp.frequency||"").toLowerCase())
    ))
    .filter((sp,i,a) => a.findIndex(x=>x.id===sp.id)===i); // dedupe

  // Top trail
  const trailCounts = {};
  obs.forEach(o => { if (o.trailId) trailCounts[o.trailId]=(trailCounts[o.trailId]||0)+1; });
  const topTrailEntry = Object.entries(trailCounts).sort((a,b)=>b[1]-a[1])[0];
  const topTrail = topTrailEntry ? trailMap[topTrailEntry[0]] : null;
  const topTrailObs = topTrailEntry ? topTrailEntry[1] : 0;

  // Group breakdown
  const gc = {};
  obs.forEach(o => { const g = spMap[o.speciesId]?.group?.toLowerCase(); if(g) gc[g]=(gc[g]||0)+1; });
  const groupBreakdown = Object.entries(gc).sort((a,b)=>b[1]-a[1]);

  // Trail breakdown (all trails visited)
  const trailBreakdown = Object.entries(trailCounts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([id,count]) => ({ trail: trailMap[id], id, count }));

  // New-to-atlas species this season (first ever logged)
  // (simplified: species only appearing in this season's obs, not in others)
  const seasonSpIds = new Set(uniqueIds);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-8 md:max-w-3xl">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display:"flex", alignItems:"center", gap:8, color:sc.accent,
          fontSize:14, background:"none", border:"none", cursor:"pointer",
          padding:0, marginBottom:20 }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      {/* Hero header */}
      <div style={{ borderRadius:20, overflow:"hidden", marginBottom:16,
        background:`linear-gradient(135deg, ${sc.dark}, ${sc.mid})`,
        border:`1px solid ${sc.accent}30` }}>
        <div style={{ padding:"20px 20px 16px" }}>
          <div style={{ color:sc.accent, fontSize:10, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
            {SI[season]} {season.charAt(0).toUpperCase()+season.slice(1)} {year} · Personal Record
          </div>
          <div style={{ color:"rgba(255,255,255,0.90)", fontFamily:"Georgia,serif", fontSize:26, fontWeight:400, lineHeight:1.2, marginBottom:4 }}>
            {loading ? "Loading…" : `${uniqueIds.length} species`}
          </div>
          <div style={{ color:sc.accent, fontSize:13, opacity:0.8 }}>
            {loading ? "" : `${obs.length} sightings · Orange County, CA`}
          </div>
        </div>

        {/* Monthly bar */}
        {!loading && obs.length > 0 && (
          <div style={{ padding:"0 20px 18px" }}>
            <MonthlyBar obs={obs} seasonMonths={seasonMonths} sc={sc} navigate={navigate} year={year} />
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:24, height:24, borderRadius:"50%",
            border:`2px solid ${sc.accent}`, borderTopColor:"transparent",
            animation:"spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && obs.length === 0 && (
        <div style={{ borderRadius:16, padding:32, textAlign:"center",
          background:sc.bg, border:`1px solid ${sc.accent}20` }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>{SI[season]}</div>
          <div style={{ color:sc.text, fontSize:13, lineHeight:1.7 }}>
            No sightings logged for {season} {year}.<br />
            Log a sighting to start your {season} record.
          </div>
        </div>
      )}

      {!loading && obs.length > 0 && (<>

        {/* ── Stat row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",
          gap:10, marginBottom:16 }}>
          {[
            { icon:"🌿", label:"Species",  val: uniqueIds.length },
            { icon:"👁",  label:"Sightings", val: obs.length },
            { icon:"🥾", label:"Trails",   val: Object.keys(trailCounts).length },
            { icon:"⚠️", label:"Rare finds", val: rareFinds.length || "—" },
          ].map((s,i) => (
            <div key={i} style={{ background:sc.bg, borderRadius:12,
              padding:"10px 12px", border:`1px solid ${sc.accent}20` }}>
              <div style={{ fontSize:10, color:sc.text, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.06em", opacity:0.7 }}>
                {s.icon} {s.label}
              </div>
              <div style={{ color:sc.text, fontSize:22, fontWeight:800, marginTop:2 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ── Milestone cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {/* First sighting */}
          {firstSp && (
            <button onClick={() => navigate(`/SpeciesDetail?id=${firstSp.id}`)}
              style={{ borderRadius:14, overflow:"hidden", background:"none",
                border:`1px solid ${sc.accent}30`, padding:0, cursor:"pointer",
                textAlign:"left", position:"relative" }}>
              <div style={{ height:70, position:"relative", background:sc.dark, overflow:"hidden" }}>
                {firstSp.imageUrl && (
                  <img src={firstSp.imageUrl} alt={firstSp.name}
                    style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.55 }}
                    onError={e => { e.currentTarget.style.display="none"; }} />
                )}
                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)" }} />
              </div>
              <div style={{ padding:"8px 10px", background:sc.bg }}>
                <div style={{ color:sc.accent, fontSize:8, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                  ✦ First Sighting
                </div>
                <div style={{ color:sc.text, fontSize:12, fontWeight:700 }}>{firstSp.name}</div>
                <div style={{ color:sc.text, fontSize:10, opacity:0.6, marginTop:1 }}>
                  {fmt(firstObs.timestamp)}
                  {firstObs.trailName ? ` · ${firstObs.trailName.replace(/ Trail$/,"")}` : ""}
                </div>
              </div>
            </button>
          )}

          {/* Top trail */}
          {topTrail && (
            <button onClick={() => navigate(`/TrailDetail?id=${topTrail.id}`)}
              style={{ borderRadius:14, overflow:"hidden", background:"none",
                border:`1px solid ${sc.accent}30`, padding:0, cursor:"pointer",
                textAlign:"left" }}>
              <div style={{ height:70, position:"relative", background:sc.dark, overflow:"hidden" }}>
                {topTrail.heroImage && (
                  <img src={topTrail.heroImage} alt={topTrail.name}
                    style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.55 }}
                    onError={e => { e.currentTarget.style.display="none"; }} />
                )}
                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)" }} />
              </div>
              <div style={{ padding:"8px 10px", background:sc.bg }}>
                <div style={{ color:sc.accent, fontSize:8, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                  🥾 Top Trail
                </div>
                <div style={{ color:sc.text, fontSize:12, fontWeight:700 }}>
                  {topTrail.name.replace(/ Trail$/,"")}
                </div>
                <div style={{ color:sc.text, fontSize:10, opacity:0.6, marginTop:1 }}>
                  {topTrailObs} sighting{topTrailObs!==1?"s":""}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* ── Rare finds ── */}
        {rareFinds.length > 0 && (
          <div style={{ borderRadius:14, marginBottom:16, overflow:"hidden",
            background:"rgba(191,54,12,0.06)", border:"1px solid rgba(191,54,12,0.2)" }}>
            <div style={{ padding:"12px 14px 8px" }}>
              <div style={{ color:"#BF360C", fontSize:10, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                ⚠️ Rare Finds This Season
              </div>
            </div>
            {rareFinds.map((sp,i) => (
              <div key={sp.id}
                onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"8px 14px", cursor:"pointer",
                  borderTop: i>0 ? "1px solid rgba(191,54,12,0.1)" : "none" }}>
                <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden",
                  flexShrink:0, background:"#1C3A2A" }}>
                  {sp.imageUrl && (
                    <img src={sp.imageUrl} alt={sp.name}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e => { e.currentTarget.style.display="none"; }} />
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#7A2A10", fontSize:13, fontWeight:600 }}>{sp.name}</div>
                  <div style={{ color:"#BF6A3A", fontSize:10 }}>
                    {sp.conservationStatus || sp.riskCategory || sp.frequency}
                  </div>
                </div>
                <svg width="12" height="12" fill="none" stroke="#BF360C" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* ── Group breakdown ── */}
        {groupBreakdown.length > 0 && (
          <div style={{ borderRadius:14, marginBottom:16, padding:"14px 16px",
            background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>
              📊 By Group
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {groupBreakdown.map(([g,c]) => {
                const pct = Math.round((c / obs.length) * 100);
                return (
                  <div key={g} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:13, width:20, textAlign:"center" }}>
                      {GROUP_ICONS[g] || "🌿"}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        marginBottom:3 }}>
                        <span style={{ color:"#3D5C4A", fontSize:11, fontWeight:600,
                          textTransform:"capitalize" }}>{g}</span>
                        <span style={{ color:"#9BB8A4", fontSize:10 }}>{c}</span>
                      </div>
                      <div style={{ height:4, borderRadius:2, background:"#E8E0D0" }}>
                        <div style={{ height:"100%", borderRadius:2,
                          width:`${pct}%`, background:sc.accent, opacity:0.8 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Trail breakdown ── */}
        {trailBreakdown.length > 0 && (
          <div style={{ borderRadius:14, marginBottom:16, overflow:"hidden",
            background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ padding:"12px 14px 8px" }}>
              <div style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)" }}>
                🥾 Trails Visited
              </div>
            </div>
            {trailBreakdown.map(({trail,id,count},i) => (
              <div key={id}
                onClick={() => trail && navigate(`/TrailDetail?id=${id}`)}
                style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"8px 14px", cursor: trail ? "pointer" : "default",
                  borderTop: i>0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  background:"#1A1A17" }}>
                <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden",
                  flexShrink:0, background:"#1C3A2A" }}>
                  {trail?.heroImage && (
                    <img src={trail.heroImage} alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e => { e.currentTarget.style.display="none"; }} />
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"rgba(255,255,255,0.88)", fontSize:13, fontWeight:400, fontFamily:"Georgia,serif",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {trail?.name || id}
                  </div>
                  <div style={{ color:"#7FAF8A", fontSize:10 }}>
                    {count} sighting{count!==1?"s":""}
                    {trail?.difficulty ? ` · ${trail.difficulty}` : ""}
                  </div>
                </div>
                {trail && (
                  <svg width="12" height="12" fill="none" stroke="#9BB8A4" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Species grid ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>
            🌿 All {uniqueIds.length} Species — {season.charAt(0).toUpperCase()+season.slice(1)} {year}
          </div>
          <div style={{ display:"grid", gap:6,
            gridTemplateColumns:"repeat(auto-fill, minmax(60px, 1fr))" }}>
            {resolved.map((sp,i) => (
              <Tile key={sp.id} species={sp}
                badge={i===0 ? "1st" : null}
                onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)} />
            ))}
          </div>
        </div>

        {/* ── Observation log ── */}
        <div style={{ borderRadius:14, overflow:"hidden",
          border:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ padding:"12px 14px", background:"#141412",
            borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)" }}>
              📋 All {obs.length} Sightings
            </div>
          </div>
          <div style={{ background:"#1A1A17" }}>
            {[...obs].sort((a,b) => new Date(b.timestamp||b.created_date) - new Date(a.timestamp||a.created_date))
              .map((o, i, arr) => {
                const sp    = spMap[o.speciesId];
                const img   = o.photoUrl || sp?.imageUrl;
                const ts    = o.timestamp ? new Date(o.timestamp) : null;
                const label = ts ? ts.toLocaleDateString("en-US",{month:"short",day:"numeric"}) : null;
                return (
                  <div key={o.id||i}
                    onClick={() => sp && navigate(`/SpeciesDetail?id=${sp.id}`)}
                    style={{ display:"flex", gap:12, padding:"10px 14px", cursor: sp?"pointer":"default",
                      borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ width:44, height:44, borderRadius:8, flexShrink:0,
                      background:"#1C3A2A", overflow:"hidden" }}>
                      {img ? (
                        <img src={img} alt=""
                          style={{ width:"100%", height:"100%", objectFit:"cover" }}
                          onError={e => { e.currentTarget.style.display="none"; }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          fontSize:20, opacity:0.25 }}>
                          {GROUP_ICONS[sp?.group?.toLowerCase()] || "🌿"}
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#1C3A2A", fontSize:13, fontWeight:600,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {o.speciesName || sp?.name || "Unknown"}
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:2 }}>
                        {label && <span style={{ color:"#9BB8A4", fontSize:10 }}>{label}</span>}
                        {o.trailName && (
                          <span style={{ color:"#5A8A6A", fontSize:10, fontWeight:600,
                            background:"rgba(74,124,89,0.08)", borderRadius:4, padding:"0 4px" }}>
                            📍 {o.trailName}
                          </span>
                        )}
                      </div>
                      {o.notes?.trim() && (
                        <div style={{ color:"#5A7A6A", fontSize:11, fontStyle:"italic",
                          marginTop:2, lineHeight:1.4, overflow:"hidden",
                          display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
                          "{o.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ color:"#C8D8CC", fontSize:14, flexShrink:0, alignSelf:"center" }}>›</div>
                  </div>
                );
            })}
          </div>
        </div>

      </>)}

      {/* View on Map → */}
      <button onClick={() => navigate(`/Story?type=season&season=${season}&year=${year}`)}
        style={{ width:"100%", padding:"11px", borderRadius:10, marginBottom:8,
          background:"rgba(74,154,90,0.12)", border:"1px solid rgba(74,154,90,0.25)",
          color:"#A8D5B0", fontSize:12, fontWeight:600, cursor:"pointer" }}>
        📖 Your {season} Story →
      </button>

      <button onClick={() => navigate(`/Map?season=${season}&year=${year}`)}
        style={{ display:"block", width:"100%", marginTop:16, padding:"11px",
          borderRadius:10, border:`1px solid ${sc.mid}`,
          background:"rgba(0,0,0,0.2)", color: sc.accent,
          fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
        🗺 View {SI[season]} {season.charAt(0).toUpperCase()+season.slice(1)} on Map →
      </button>
    </div>
  );
}
