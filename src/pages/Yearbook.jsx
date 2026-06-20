import BottomNav from "./BottomNav";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Species, Observation, Trail } from "@/api/entities";

const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter",
};
const SEASON_ORDER = ["spring","summer","fall","winter"];
const SEASON_LABEL = { spring:"Spring", summer:"Summer", fall:"Fall", winter:"Winter" };
const SEASON_ICONS = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const GROUP_ICONS  = {
  mammal:"🦌", bird:"🐦", reptile:"🦎", amphibian:"🐸", fish:"🐟",
  insect:"🦋", arachnid:"🕷", crustacean:"🦀", mollusk:"🐚",
  invertebrate:"🪱", plant:"🌿", fungi:"🍄", lichen:"🌿", algae:"🌊",
  "human impact":"🏗",
};

function SpeciesTile({ species, onClick }) {
  const [imgOk, setImgOk] = useState(false);
  return (
    <button onClick={onClick}
      className="relative rounded-xl overflow-hidden transition-all active:scale-95 hover:opacity-90 text-left"
      style={{ aspectRatio:"1", background:"#1C3A2A", cursor:"pointer", border:"none", padding:0 }}>
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize:"24px", opacity:0.18 }}>
        {GROUP_ICONS[species.group?.toLowerCase()] || "🌿"}
      </div>
      {species.imageUrl && (
        <img src={species.imageUrl} alt={species.name}
          className="absolute inset-0 w-full h-full object-cover" loading="lazy"
          onLoad={() => setImgOk(true)}
          onError={e => { e.currentTarget.style.display = "none"; }}
          style={{ opacity: imgOk ? 1 : 0, transition:"opacity 0.3s" }} />
      )}
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
        style={{ background:"linear-gradient(transparent, rgba(0,0,0,0.78))" }}>
        <div style={{ color:"#E8F4E8", fontSize:"9px", fontWeight:"600", lineHeight:"1.3",
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {species.name}
        </div>
      </div>
    </button>
  );
}

export default function Yearbook() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [speciesMap,   setSpeciesMap]   = useState({});
  const [trailMap,     setTrailMap]     = useState({});
  const [loading,      setLoading]      = useState(true);
  const [openYear,     setOpenYear]     = useState(null);
  const [openSeason,   setOpenSeason]   = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      let all = [], skip = 0, hasMore = true;
      while (hasMore) {
        const page = await Observation.filter({}).catch(() => []);
        if (!Array.isArray(page) || page.length === 0) break;
        all = all.concat(page);
        hasMore = page.length === 500;
        skip += 500;
      }
      setObservations(all);
      const ids = [...new Set(all.map(o => o.speciesId).filter(Boolean))];
      if (ids.length) {
        // Batch fetch all species in one query instead of N individual gets
        try {
          const allSpecies = await Species.filter({});
          const map = {};
          allSpecies.filter(Boolean).forEach(s => { map[s.id] = s; });
          setSpeciesMap(map);
        } catch {
          // Fallback: individual fetches
          const results = await Promise.all(ids.map(id => Species.get(id).catch(() => null)));
          const map = {};
          results.filter(Boolean).forEach(s => { map[s.id] = s; });
          setSpeciesMap(map);
        }
      }
      // Load trail map for heroImage fallbacks on trail-only observations
      try {
        const trailIds = [...new Set(all.map(o => o.trailId).filter(Boolean))];
        if (trailIds.length) {
          const trails = await Trail.filter({});
          const tmap = {};
          trails.filter(Boolean).forEach(t => { tmap[t.id] = t; });
          setTrailMap(tmap);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Group observations: year → season → array of observations (not just ids)
  const grouped = {};
  observations.forEach(o => {
    // Prefer explicit timestamp, fall back to sessionKey year, then created_date
    const tsDate = o.timestamp ? new Date(o.timestamp) : null;
    const created = o.created_date ? new Date(o.created_date) : null;
    const yr = o.year
      ? String(o.year)
      : tsDate ? String(tsDate.getFullYear())
      : o.sessionKey ? String(o.sessionKey).slice(0, 4) || String(currentYear)
      : created ? String(created.getFullYear())
      : String(currentYear);
    const month  = o.month != null ? Number(o.month)
      : tsDate ? tsDate.getMonth()
      : created ? created.getMonth() : null;
    const season = o.season || (month != null ? MONTH_SEASON[month] : "unknown");
    if (!grouped[yr]) grouped[yr] = {};
    if (!grouped[yr][season]) grouped[yr][season] = [];
    grouped[yr][season].push(o);
  });

  const sortedYears = Object.keys(grouped).sort((a,b) => Number(b) - Number(a));
  const hasAny = observations.length > 0;

  // ── Streak: species seen in the most consecutive seasons across all years ──
  const streaks = {};
  observations.forEach(o => {
    if (!o.speciesId || !o.season) return;
    if (!streaks[o.speciesId]) streaks[o.speciesId] = new Set();
    const yr = o.year || (o.timestamp ? new Date(o.timestamp).getFullYear() : null);
    if (yr) streaks[o.speciesId].add(`${yr}-${o.season}`);
  });
  const topStreaks = Object.entries(streaks)
    .map(([id, set]) => ({ id, count: set.size }))
    .filter(e => e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Phenology: earliest and latest timestamp per species ──
  const phenology = {};
  observations.forEach(o => {
    if (!o.speciesId || !o.timestamp) return;
    const ts = o.timestamp;
    if (!phenology[o.speciesId]) phenology[o.speciesId] = { earliest: ts, latest: ts, name: o.speciesName };
    if (ts < phenology[o.speciesId].earliest) phenology[o.speciesId].earliest = ts;
    if (ts > phenology[o.speciesId].latest)   phenology[o.speciesId].latest   = ts;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 md:max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>Atlas · Annual Record</span>
        </div>
        <h1 className="font-bold mb-1"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          📚 Yearbook
        </h1>
        <p style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.7", maxWidth:"460px" }}>
          Species observed by year and season — live from the atlas record.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor:"#4A7C59", borderTopColor:"transparent" }} />
        </div>
      )}

      {!loading && !hasAny && (
        <div className="rounded-2xl p-8 text-center mb-6"
          style={{ background:"#F5F2EC", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:"36px", marginBottom:"12px", opacity:0.4 }}>📚</div>
          <div style={{ color:"#9BB8A4", fontSize:"13px", lineHeight:"1.7" }}>
            No field observations recorded yet.<br />
            Log a sighting from any trail or species page to start your yearbook.
          </div>
        </div>
      )}

      {/* Atlas Born — permanent first memory */}
      {!loading && (
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ border:"1px solid rgba(127,175,138,0.15)", boxShadow:"0 2px 12px rgba(28,58,42,0.06)" }}>
          <div style={{ background:"linear-gradient(135deg, #111110 0%, #1A1A17 100%)", padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
              <div style={{ width:"7px", height:"7px", borderRadius:"50%",
                background:"#4CAF50", boxShadow:"0 0 6px #4CAF50" }} />
              <span style={{ color:"rgba(127,175,138,0.6)", fontSize:"10px", fontWeight:"700",
                textTransform:"uppercase", letterSpacing:"0.1em" }}>
                Atlas Record · April 18, 2026
              </span>
            </div>
            <div style={{ color:"#F0E9D6", fontSize:"18px", fontWeight:"800" }}>Organism Born</div>
            <div style={{ color:"#7FAF8A", fontSize:"12px", marginTop:"4px" }}>Peak Spring · Orange County, CA</div>
          </div>
          <div style={{ background:"#1A1A17", padding:"16px 20px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color:"rgba(255,255,255,0.70)", fontSize:"13px", lineHeight:"1.8", marginBottom:"12px", fontStyle:"italic" }}>
              513 species. 111 trails. Five canonical corridors. Six biome zones. Ten ecological tiers.
              Built during Peak Spring when the Gnatcatcher was singing in coastal sage scrub
              and the Vireo was three weeks from arriving on Santiago Creek.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[{label:"Species",value:"513",icon:"🌿"},{label:"Trails",value:"111",icon:"🗺"},
                {label:"Corridors",value:"5",icon:"🌊"},{label:"Biomes",value:"6",icon:"🌾"}]
                .map(m => (
                <div key={m.label} style={{ background:"#F0EDE6", borderRadius:"10px",
                  padding:"10px 12px", border:"1px solid #E0D8CC" }}>
                  <div style={{ fontSize:"11px", color:"#9BB8A4", fontWeight:"600",
                    textTransform:"uppercase", letterSpacing:"0.06em" }}>{m.icon} {m.label}</div>
                  <div style={{ color:"#1C3A2A", fontSize:"22px", fontWeight:"800", marginTop:"2px" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Species Streaks ── */}
      {!loading && topStreaks.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-4"
          style={{ border:"1px solid rgba(127,175,138,0.15)" }}>
          <div style={{ background:"#1A1A17", padding:"14px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color:"#9BB8A4", fontSize:10, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>
              🔁 Species Streaks
            </div>
            <div style={{ color:"#1C3A2A", fontSize:13, color:"#5A7A6A" }}>
              Seen in multiple seasons or years
            </div>
          </div>
          <div style={{ background:"#1A1A17" }}>
            {topStreaks.map(({ id, count }, idx) => {
              const sp = speciesMap[id];
              const name = sp?.name || id;
              return (
                <div key={id}
                  onClick={() => navigate(`/SpeciesDetail?id=${id}`)}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"10px 16px", cursor:"pointer",
                    borderBottom: idx < topStreaks.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden",
                    flexShrink:0, background:"#1C3A2A" }}>
                    {sp?.imageUrl && (
                      <img loading="lazy" src={sp.imageUrl} alt={name}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { e.currentTarget.style.display="none"; }} />
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#1C3A2A", fontSize:13, fontWeight:600,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {name}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                    {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
                      <div key={i} style={{ width:6, height:6, borderRadius:3,
                        background: i < count ? "#4A7C59" : "#D8D0C4" }} />
                    ))}
                    <span style={{ color:"#7FAF8A", fontSize:11, marginLeft:4 }}>×{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stories entry */}
      <div style={{ marginBottom:16 }}>
        <button onClick={() => navigate("/Story")}
          style={{ width:"100%", padding:"12px 16px", borderRadius:12,
            background:"linear-gradient(135deg,rgba(74,124,89,0.15),rgba(74,124,89,0.08))",
            border:"1px solid rgba(74,124,89,0.25)", cursor:"pointer",
            display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
          <span style={{ fontSize:20 }}>📖</span>
          <div>
            <div style={{ color:"#A8D5B0", fontSize:13, fontWeight:700 }}>Your Ecological Stories</div>
            <div style={{ color:"#4A7A5A", fontSize:10, marginTop:1 }}>
              Season · Year · Habitat · Rhythm · Companions
            </div>
          </div>
          <div style={{ marginLeft:"auto", color:"#4A7A5A", fontSize:13 }}>→</div>
        </button>
      </div>

      {/* Year cards */}
      {!loading && sortedYears.map(yr => {
        const seasons     = grouped[yr];
        const allObs      = Object.values(seasons).flat();
        const totalSpecies = new Set(allObs.map(o => o.speciesId).filter(Boolean)).size;
        const totalObs    = allObs.length;
        const isOpen      = openYear === yr;
        const domSeason   = SEASON_ORDER.find(s => seasons[s]?.length > 0) || "spring";

        return (
          <div key={yr} className="mb-4">
            <button onClick={() => setOpenYear(isOpen ? null : yr)}
              className="w-full text-left rounded-2xl px-5 py-4 transition-all hover:opacity-90"
              style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ color:"#F0E9D6", fontSize:"16px", fontWeight:"800" }}>
                    {SEASON_ICONS[domSeason]} {yr}
                  </div>
                  <div style={{ color:"#7FAF8A", fontSize:"12px", marginTop:"2px" }}>
                    {totalSpecies} species · {totalObs} obs ·{" "}
                    {SEASON_ORDER.filter(s => seasons[s]?.length > 0).map(s => SEASON_LABEL[s]).join(", ")}
                  </div>
                </div>
                <div style={{ color:"#7FAF8A", fontSize:"18px",
                  transform: isOpen ? "rotate(90deg)" : "none", transition:"transform 0.2s" }}>›</div>
              </div>
            </button>

            {isOpen && (
              <div className="mt-2 space-y-3 pl-1">
                {SEASON_ORDER.filter(s => seasons[s]?.length > 0).map(season => {
                  const key          = `${yr}-${season}`;
                  const isSeasonOpen = openSeason === key;
                  const obs          = seasons[season] || [];
                  const uniqueIds    = [...new Set(obs.map(o => o.speciesId).filter(Boolean))];
                  const resolved     = uniqueIds.map(id => speciesMap[id]).filter(Boolean);

                  return (
                    <div key={season}>
                      <button onClick={() => setOpenSeason(isSeasonOpen ? null : key)}
                        className="w-full text-left rounded-xl px-4 py-3 transition-all hover:opacity-90"
                        style={{ background:"#F5F2EC", border:"1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-center justify-between">
                          <div style={{ color:"#1C3A2A", fontSize:"13px", fontWeight:"700" }}>
                            {SEASON_ICONS[season]} {SEASON_LABEL[season]}
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color:"#7FAF8A", fontSize:"11px" }}>{uniqueIds.length} sp · {obs.length} obs</span>
                            <span style={{ color:"#9BB8A4", fontSize:"14px",
                              transform: isSeasonOpen ? "rotate(90deg)" : "none", transition:"transform 0.2s" }}>›</span>
                          </div>
                        </div>
                      </button>

                      {isSeasonOpen && (
                        <div className="rounded-xl mt-1 overflow-hidden"
                          style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>

                          {/* ── Observation cards ── */}
                          {obs.length > 0 ? (
                            <div>
                              {obs.map((o, idx) => {
                                const sp        = speciesMap[o.speciesId];
                                const imgUrl    = o.photoUrl || sp?.imageUrl;
                                const hasNote   = o.notes && o.notes.trim();
                                const hasCond   = o.conditions && o.conditions.trim();
                                const ts        = o.timestamp ? new Date(o.timestamp) : null;
                                const timeLabel = ts
                                  ? ts.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
                                  : null;
                                return (
                                  <div key={o.id || idx}
                                    style={{
                                      display:"flex", gap:"12px", padding:"12px 14px",
                                      borderBottom: idx < obs.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                                      cursor:"pointer",
                                    }}
                                    onClick={() => sp && navigate(`/SpeciesDetail?id=${sp.id}`)}>

                                    {/* Thumbnail — field photo → atlas image → trail heroImage → glyph */}
                                    {(() => {
                                      const trailImg = trailMap[o.trailId]?.heroImage;
                                      const fallbackImg = imgUrl || (!sp ? trailImg : null);
                                      const isTrailFallback = !imgUrl && !sp && trailImg;
                                      return (
                                        <div style={{
                                          width:52, height:52, borderRadius:10, flexShrink:0,
                                          background: isTrailFallback ? "#1A2E22" : "#1C3A2A",
                                          overflow:"hidden", position:"relative",
                                        }}>
                                          {fallbackImg ? (
                                            <img loading="lazy" src={fallbackImg} alt={o.trailName || o.speciesName || ""}
                                              style={{ width:"100%", height:"100%", objectFit:"cover",
                                                filter: isTrailFallback ? "brightness(0.65) saturate(0.7)" : "none" }}
                                              onError={e => { e.currentTarget.style.display="none"; }} />
                                          ) : (
                                            <div style={{ position:"absolute", inset:0, display:"flex",
                                              alignItems:"center", justifyContent:"center",
                                              fontSize:20, opacity:0.3 }}>
                                              {sp ? (GROUP_ICONS[(sp.group||"").toLowerCase()] || "🌿") : "🥾"}
                                            </div>
                                          )}
                                          {o.photoUrl && (
                                            <div style={{
                                              position:"absolute", top:2, right:2,
                                              background:"rgba(28,58,42,0.75)", borderRadius:4,
                                              padding:"1px 3px", fontSize:8, color:"#A8D5B0",
                                              fontWeight:700, letterSpacing:"0.04em",
                                            }}>FIELD</div>
                                          )}
                                          {isTrailFallback && (
                                            <div style={{
                                              position:"absolute", bottom:2, right:3,
                                              fontSize:10, opacity:0.7,
                                            }}>🥾</div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* Meta */}
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ color:"#1C3A2A", fontSize:"13px",
                                        fontWeight:700, lineHeight:1.3, marginBottom:2,
                                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                        {o.speciesName || sp?.name || "Unknown species"}
                                      </div>
                                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom: hasNote ? 4 : 0 }}>
                                        {timeLabel && (
                                          <span style={{ color:"#9BB8A4", fontSize:11 }}>{timeLabel}</span>
                                        )}
                                        {o.trailName && (
                                          <span style={{
                                            color:"#5A8A6A", fontSize:11, fontWeight:600,
                                            background:"rgba(74,124,89,0.08)",
                                            borderRadius:4, padding:"0 5px",
                                          }}>📍 {o.trailName}</span>
                                        )}
                                        {hasCond && (
                                          <span style={{ color:"#8A9A8A", fontSize:11 }}>· {o.conditions}</span>
                                        )}
                                      </div>
                                      {hasNote && (
                                        <div style={{
                                          color:"#5A7A6A", fontSize:12, fontStyle:"italic",
                                          lineHeight:1.5,
                                          overflow:"hidden", display:"-webkit-box",
                                          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                                        }}>
                                          "{o.notes}"
                                        </div>
                                      )}
                                    </div>

                                    <div style={{ color:"#C8D8CC", fontSize:16, flexShrink:0, alignSelf:"center" }}>›</div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ color:"#9BB8A4", fontSize:"12px",
                              textAlign:"center", padding:"20px 0" }}>
                              No observations recorded.
                            </div>
                          )}

                          {/* ── Species grid (unique species seen this season) ── */}
                          {resolved.length > 0 && (
                            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"12px" }}>
                              <div style={{ color:"#9BB8A4", fontSize:10, fontWeight:700,
                                textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                                {uniqueIds.length} species this {season}
                              </div>
                              <div style={{ display:"grid", gap:6,
                                gridTemplateColumns:"repeat(auto-fill, minmax(56px, 1fr))" }}>
                                {resolved.map(sp => (
                                  <SpeciesTile key={sp.id} species={sp}
                                    onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)} />
                                ))}
                              </div>
                              <button
                                onClick={() => navigate(`/seasondetail?season=${season}&year=${yr}`)}
                                style={{ marginTop:10, width:"100%", padding:"8px 0",
                                  borderRadius:10, background:"transparent", cursor:"pointer",
                                  color:"#7FAF8A", fontSize:12, fontWeight:700,
                                  border:"1px solid rgba(127,175,138,0.25)" }}>
                                View full {season.charAt(0).toUpperCase()+season.slice(1)} {yr} record →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    <BottomNav active="yearbook" />
    </div>
  );
}