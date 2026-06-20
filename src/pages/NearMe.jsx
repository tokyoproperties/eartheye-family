import { useState, useEffect } from "react";
import { Trail, Species } from "@/api/entities";
import { useNavigate } from "react-router-dom";

const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter"
};
const SEASON_ICONS = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const GROUP_ICONS = {
  bird:"🦅", birds:"🦅", plant:"🌿", plants:"🌿", mammal:"🦊", mammals:"🦊",
  reptile:"🦎", reptiles:"🦎", "reptiles/amphibians":"🦎",
  fish:"🐟", insect:"🦋", insects:"🦋",
  marine:"🌊", "marine/intertidal":"🌊", fungi:"🍄", "fungi/lichens":"🍄",
};
const DIFF_COLORS = {
  easy:     { bg:"rgba(122,184,122,0.12)", text:"#7AB87A" },
  moderate: { bg:"rgba(196,151,74,0.12)", text:"#C4974A" },
  hard:     { bg:"rgba(196,122,122,0.12)", text:"#C47A7A" },
  strenuous:{ bg:"rgba(154,122,184,0.12)", text:"#9A7AB8" },
};

// Haversine distance in miles
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function distanceLabel(mi) {
  if (mi < 0.1) return "< 0.1 mi";
  if (mi < 10)  return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export default function NearMe() {
  const navigate = useNavigate();
  const [state,    setState]   = useState("idle"); // idle | locating | loaded | denied | error
  const [userPos,  setUserPos] = useState(null);
  const [trails,   setTrails]  = useState([]);
  const [sorted,   setSorted]  = useState([]);
  const [species,  setSpecies] = useState({});
  const [radius,   setRadius]  = useState(10); // miles filter

  const currentSeason = MONTH_SEASON[new Date().getMonth()];
  const seasonIcon    = SEASON_ICONS[currentSeason];

  // Load all trails once
  useEffect(() => {
    Trail.filter({}).then(t => setTrails(t || []));
  }, []);

  // Sort by distance when we have position
  useEffect(() => {
    if (!userPos || !trails.length) return;
    const withDist = trails
      .filter(t => t.lat && t.lng)
      .map(t => ({ ...t, _dist: distanceMiles(userPos.lat, userPos.lng, t.lat, t.lng) }))
      .sort((a, b) => a._dist - b._dist);
    setSorted(withDist);

    // Load species for the nearest 5 trails
    const nearest = withDist.slice(0, 5);
    const allSpeciesIds = [...new Set(nearest.flatMap(t => t.speciesIds || []))].slice(0, 80);
    if (allSpeciesIds.length) {
      Promise.all(allSpeciesIds.map(id => Species.get(id).catch(() => null)))
        .then(results => {
          const map = {};
          results.filter(Boolean).forEach(s => { map[s.id] = s; });
          setSpecies(map);
        });
    }
  }, [userPos, trails]);

  function locate() {
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState("loaded");
      },
      err => {
        setState(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const filtered = sorted.filter(t => t._dist <= radius);

  // Active species for a trail in current season
  function activeSpecies(trail) {
    return (trail.speciesIds || [])
      .map(id => species[id])
      .filter(s => s && (s.seasonPresence || []).includes(currentSeason))
      .slice(0, 4);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-8 md:max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/home")}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color:"#7FAF8A", fontSize:"14px", background:"none", border:"none",
            cursor:"pointer", padding:0 }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </div>

      {/* Masthead */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Field Mode
          </span>
        </div>
        <h1 className="font-bold mb-1"
          style={{ color:"rgba(255,255,255,0.90)", fontSize:"clamp(22px,5vw,32px)", fontFamily:"Georgia,serif", fontWeight:"400", letterSpacing:"-0.01em" }}>
          Near Me
        </h1>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"13px", fontStyle:"italic", fontFamily:"Georgia,serif", lineHeight:"1.6" }}>
          Find trails within reach right now — sorted by distance, filtered by what's active {seasonIcon} this {currentSeason}.
        </p>
      </div>

      {/* IDLE STATE — field instrument + transparency */}
      {state === "idle" && (
        <div className="rounded-2xl overflow-hidden mb-4"
          style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
          <div className="px-6 pt-6 pb-5 text-center">
            <div style={{ fontSize:"48px", marginBottom:"8px" }}>{seasonIcon}</div>
            <div style={{ color:"rgba(255,255,255,0.88)", fontSize:"16px", fontFamily:"Georgia,serif", fontWeight:"400", marginBottom:"6px" }}>
              Find your trail for this {currentSeason}
            </div>
            <div style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.65", marginBottom:"20px" }}>
              The atlas knows what's active near you — sorted by distance, filtered by season.
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              {[
                { icon:"📍", label:"Used once", note:"to find trails" },
                { icon:"🔒", label:"Stays on device", note:"not transmitted" },
                { icon:"🗑", label:"Never stored", note:"not logged" },
              ].map((pt, i) => (
                <div key={i} className="rounded-xl p-2.5"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(127,175,138,0.12)" }}>
                  <div style={{ fontSize:"18px", marginBottom:"4px" }}>{pt.icon}</div>
                  <div style={{ color:"#C4DFC8", fontSize:"11px", fontWeight:"600" }}>{pt.label}</div>
                  <div style={{ color:"#5C8A6A", fontSize:"10px", marginTop:"1px" }}>{pt.note}</div>
                </div>
              ))}
            </div>
            <button onClick={locate}
              className="px-8 py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background:"#4A7C59", color:"#F0E9D6", fontSize:"14px",
                border:"none", cursor:"pointer" }}>
              📍 Use My Location
            </button>
          </div>
          <div className="px-5 py-2.5"
            style={{ background:"rgba(0,0,0,0.2)", borderTop:"1px solid rgba(127,175,138,0.1)" }}>
            <div className="flex items-center justify-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#5C8A6A" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ color:"#5C8A6A", fontSize:"11px" }}>
                Location stays on your device — never stored, never sent, never logged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LOCATING */}
      {state === "locating" && (
        <div className="rounded-2xl p-8 text-center mb-4"
          style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background:"#7FAF8A" }} />
            <span style={{ color:"#9BB8A4", fontSize:"14px" }}>Finding your position…</span>
          </div>
        </div>
      )}

      {/* DENIED */}
      {state === "denied" && (
        <div className="rounded-2xl p-6 mb-4"
          style={{ background:"#2A1A1A", border:"1px solid rgba(200,80,80,0.3)" }}>
          <div style={{ color:"#E8A0A0", fontSize:"15px", fontWeight:"600", marginBottom:"6px" }}>
            Location access was declined
          </div>
          <div style={{ color:"#B07070", fontSize:"13px", lineHeight:"1.6", marginBottom:"16px" }}>
            The atlas works without it — but Near Me needs your approximate location, just for this moment, to sort trails by distance. Enable it in your browser settings whenever you're ready.
          </div>
          <button onClick={() => setState("idle")}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background:"rgba(200,80,80,0.15)", color:"#E8A0A0",
              border:"1px solid rgba(200,80,80,0.3)", cursor:"pointer" }}>
            Try Again
          </button>
        </div>
      )}

      {/* ERROR */}
      {state === "error" && (
        <div className="rounded-2xl p-6 mb-4"
          style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
          <div style={{ color:"#F0E9D6", fontSize:"14px", marginBottom:"12px" }}>
            Couldn't get your location. Check your connection and try again.
          </div>
          <button onClick={locate}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background:"#4A7C59", color:"#F0E9D6", border:"none", cursor:"pointer" }}>
            Retry
          </button>
        </div>
      )}

      {/* LOADED */}
      {state === "loaded" && (
        <>
          {/* Position confirmed + radius filter */}
          <div className="flex items-center justify-between mb-4 rounded-xl px-4 py-2.5"
            style={{ background:"rgba(74,124,89,0.1)", border:"1px solid rgba(74,124,89,0.2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:"#7FAF8A" }} />
              <span style={{ color:"#7FAF8A", fontSize:"12px", fontWeight:"600" }}>
                📍 {filtered.length} trail{filtered.length !== 1 ? "s" : ""} within {radius} mi — location not stored
              </span>
            </div>
            <button onClick={() => setState("idle")}
              style={{ color:"#4A7C59", fontSize:"11px", background:"none",
                border:"none", cursor:"pointer" }}>
              Reset
            </button>
          </div>

          {/* Radius selector */}
          <div className="flex gap-2 mb-5">
            {[5, 10, 20, 50].map(r => (
              <button key={r} onClick={() => setRadius(r)}
                className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: radius === r ? "rgba(122,184,122,0.12)" : "rgba(255,255,255,0.05)",
                  color:      radius === r ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.40)",
                  border: radius === r ? "1px solid rgba(122,184,122,0.40)" : "1px solid rgba(255,255,255,0.10)",
                  cursor:"pointer",
                }}>
                {r} mi
              </button>
            ))}
          </div>

          {/* No results */}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div style={{ fontSize:"32px", marginBottom:"8px", opacity:0.5 }}>🗺️</div>
              <div style={{ color:"#9BB8A4", fontSize:"14px" }}>
                No trails within {radius} miles. Try expanding the radius.
              </div>
            </div>
          )}

          {/* Best trail right now — field recommendation */}
          {filtered.length > 0 && (() => {
            const best = filtered[0]; // closest = best in field mode
            const diff = best.difficulty?.toLowerCase();
            const dc   = DIFF_COLORS[diff] || { bg:"rgba(255,255,255,0.06)", text:"rgba(255,255,255,0.45)" };
            const active = activeSpecies(best);
            return (
              <button onClick={() => navigate(`/TrailDetail?id=${best.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden mb-4 transition-all hover:scale-[1.005] active:scale-[0.99]"
                style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.25)",
                  boxShadow:"0 4px 20px rgba(28,58,42,0.18)", cursor:"pointer" }}>
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:"#7FAF8A" }} />
                    <span style={{ color:"#7FAF8A", fontSize:"10px", fontWeight:"700",
                      textTransform:"uppercase", letterSpacing:"0.09em" }}>
                      Closest trail · {best._dist < 0.1 ? "< 0.1 mi" : `${best._dist.toFixed(1)} mi`}
                    </span>
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.90)", fontSize:"18px", fontFamily:"Georgia,serif", fontWeight:"400",
                    letterSpacing:"-0.01em", marginBottom:"4px" }}>
                    {best.name}
                  </div>
                  <div style={{ color:"#9BB8A4", fontSize:"12px", marginBottom:"12px" }}>
                    {best.distanceMiles ? `${best.distanceMiles} mi trail` : "Trail"} · {best.difficulty || "Moderate"} · {best.jurisdiction || "Orange County"}
                  </div>
                  {/* Trail story — first sentence */}
                  {best.story && (
                    <div className="mb-2">
                      <p style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.65",
                        fontStyle:"italic" }}>
                        "{best.story.split(".")[0]}."
                      </p>
                    </div>
                  )}
                  {active.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.10em", textTransform:"uppercase", color:"rgba(255,255,255,0.30)" }}>Active now</span>
                      {active.slice(0, 4).map(s => (
                        <span key={s.id} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background:"rgba(127,175,138,0.15)",
                            border:"1px solid rgba(127,175,138,0.25)", color:"#A8D5B0" }}>
                          {GROUP_ICONS[s.group?.toLowerCase()] || "🌱"} {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {best.heatRisk && best.heatRisk !== "low" && (
                      <span style={{ color:"#D4703A", fontSize:"11px" }}>🌡 {best.heatRisk} heat risk today</span>
                    )}
                    {best.hasWater === "yes" && (
                      <span style={{ color:"#7FAF8A", fontSize:"11px" }}>💧 Water on trail</span>
                    )}
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px" }}>
                    View trail →
                  </div>
                </div>
              </button>
            );
          })()}

          {/* All trails */}
          {filtered.length > 0 && (
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>
              All trails within {radius} mi — sorted by distance
            </div>
          )}

          {/* Trail cards */}
          <div className="space-y-3">
            {filtered.map((trail, i) => {
              const diff = trail.difficulty?.toLowerCase();
              const dc = DIFF_COLORS[diff] || { bg:"rgba(255,255,255,0.06)", text:"rgba(255,255,255,0.45)" };
              const active = activeSpecies(trail);
              const isClose = trail._dist < 2;

              return (
                <button key={trail.id}
                  onClick={() => navigate(`/TrailDetail?id=${trail.id}`)}
                  className="w-full text-left rounded-2xl overflow-hidden transition-all hover:scale-[1.005] active:scale-[0.99]"
                  style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
                    cursor:"pointer" }}>

                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2.5">
                      {/* Rank */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: i === 0 ? "rgba(122,184,122,0.15)" : "rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize:"10px", fontWeight:"700",
                          color: i === 0 ? "#7AB87A" : "rgba(255,255,255,0.40)" }}>
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <div style={{ color:"rgba(255,255,255,0.88)", fontSize:"14px", fontFamily:"Georgia,serif", fontWeight:"400",
                          lineHeight:"1.2" }}>
                          {trail.name}
                        </div>
                        <div style={{ color:"#9BB8A4", fontSize:"11px", marginTop:"1px" }}>
                          {trail.jurisdiction?.split("/")[0].trim()}
                        </div>
                      </div>
                    </div>

                    {/* Distance badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="px-2.5 py-1 rounded-full"
                        style={{
                          background: isClose ? "rgba(122,184,122,0.12)" : "rgba(255,255,255,0.06)",
                          border: isClose ? "1px solid rgba(122,184,122,0.35)" : "1px solid rgba(255,255,255,0.10)",
                        }}>
                        <span style={{ fontSize:"12px", fontWeight:"700",
                          color: isClose ? "#7AB87A" : "rgba(255,255,255,0.55)" }}>
                          {distanceLabel(trail._dist)}
                        </span>
                      </div>
                      {isClose && (
                        <span style={{ fontSize:"10px", color:"#7FAF8A" }}>nearby</span>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
                    {diff && (
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background:dc.bg, color:dc.text }}>
                        {trail.difficulty}
                      </span>
                    )}
                    {trail.distanceMiles && (
                      <span style={{ color:"#9BB8A4", fontSize:"11px" }}>
                        {trail.distanceMiles} mi trail
                      </span>
                    )}
                    {trail.dogFriendly?.toLowerCase() === "yes" && (
                      <span style={{ fontSize:"11px", color:"#7FAF8A" }}>🐕 dogs ok</span>
                    )}
                    {trail.hasWater?.toLowerCase() === "yes" && (
                      <span style={{ fontSize:"11px", color:"#7FAF8A" }}>💧 water</span>
                    )}
                  </div>

                  {/* Active species strip */}
                  {active.length > 0 && (
                    <div className="mx-3 mb-3 rounded-xl px-3 py-2"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"600",
                        textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"5px" }}>
                        {seasonIcon} Active this {currentSeason}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {active.map(s => (
                          <span key={s.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.10)",
                              fontSize:"11px", color:"rgba(255,255,255,0.60)" }}>
                            {GROUP_ICONS[s.group?.toLowerCase()] || "🌿"}
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer arrow */}
                  <div className="flex items-center justify-end px-4 pb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#C4C9B0" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
