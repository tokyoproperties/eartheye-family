import { useState, useEffect, useRef } from "react";
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
const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter",
};

const CONDITIONS = [
  "Clear / sunny","Overcast","Marine layer","Fog",
  "Light rain","Post-storm","Golden hour","Dawn","Dusk","Night",
];

function getSeason(d) { return MONTH_SEASON[d.getMonth()]; }

// ── GPS hook ──────────────────────────────────────────────────────────────────
function useGPS() {
  const [state, setState] = useState({ lat: null, lng: null, status: "idle" });
  function capture() {
    if (!navigator.geolocation) { setState(s => ({ ...s, status: "unsupported" })); return; }
    setState(s => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      pos => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: "ok" }),
      ()  => setState(s => ({ ...s, status: "denied" })),
      { timeout: 8000, maximumAge: 60000 }
    );
  }
  return { ...state, capture };
}

// ── Search input with debounce ────────────────────────────────────────────────
function SearchPicker({ placeholder, items, onSelect, selected, labelKey = "name", idKey = "id" }) {
  const [query, setQuery]     = useState("");
  const [open,  setOpen]      = useState(false);
  const ref                   = useRef(null);

  const filtered = query.length < 2 ? [] :
    items.filter(i => (i[labelKey] || "").toLowerCase().includes(query.toLowerCase())).slice(0, 12);

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  if (selected) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 12px", borderRadius: 10, background: "rgba(74,124,89,0.08)",
      border: "1px solid rgba(74,124,89,0.3)" }}>
      <span style={{ color: "#1C3A2A", fontSize: 14, fontWeight: 600 }}>{selected[labelKey]}</span>
      <button type="button" onClick={() => onSelect(null)} style={{
        background: "none", border: "none", color: "#7FAF8A", fontSize: 16,
        cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1px solid #D8D0C4", background: "#F5F2EC",
          color: "#1C3A2A", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit",
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
          background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.map(item => (
            <div key={item[idKey]} onClick={() => { onSelect(item); setQuery(""); setOpen(false); }}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#1C3A2A",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F0EDE6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >{item[labelKey]}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * LogSighting — modal or standalone page for logging a field observation.
 *
 * Props (all optional when used as standalone page):
 *   open        {bool}    — show/hide (modal mode); if undefined = standalone
 *   onClose     {fn}
 *   onSaved     {fn}      — called with saved Observation
 *   speciesId   {string}  — pre-fill
 *   speciesName {string}  — pre-fill
 *   trailId     {string}  — pre-fill
 *   trailName   {string}  — pre-fill
 */
export default function LogSighting({
  open, onClose, onSaved,
  speciesId: propSpeciesId,
  speciesName: propSpeciesName,
  trailId: propTrailId,
  trailName: propTrailName,
}) {
  const isModal    = open !== undefined;
  const isVisible  = isModal ? open : true;

  const now        = new Date();
  const todayStr   = now.toISOString().slice(0, 10);
  const timeStr    = now.toTimeString().slice(0, 5);

  const [allSpecies, setAllSpecies] = useState([]);
  const [allTrails,  setAllTrails]  = useState([]);
  const [loaded,     setLoaded]     = useState(false);

  const [selSpecies, setSelSpecies] = useState(
    propSpeciesId ? { id: propSpeciesId, name: propSpeciesName } : null
  );
  const [selTrail,   setSelTrail]   = useState(
    propTrailId   ? { id: propTrailId,   name: propTrailName   } : null
  );

  const [date,       setDate]       = useState(todayStr);
  const [time,       setTime]       = useState(timeStr);
  const [conditions, setConditions] = useState("");
  const [notes,      setNotes]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");

  const gps = useGPS();

  // Load species + trails once
  useEffect(() => {
    if (!isVisible || loaded) return;
    Promise.all([
      Species.filter({}).catch(() => []),
      Trail.filter({}).catch(() => []),
    ]).then(([sp, tr]) => {
      setAllSpecies(sp || []);
      setAllTrails(tr  || []);
      setLoaded(true);
    });
  }, [isVisible, loaded]);

  // Auto-capture GPS on open
  useEffect(() => {
    if (isVisible && gps.status === "idle") gps.capture();
  }, [isVisible]);

  if (!isVisible) return null;

  const dateObj = date ? new Date(date + "T12:00:00") : now;
  const season  = getSeason(dateObj);
  const month   = dateObj.getMonth();
  const year    = dateObj.getFullYear();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selSpecies) { setError("Species is required."); return; }
    setSaving(true);
    setError("");
    try {
      const timestamp = `${date}T${time || "12:00"}:00`;
      const sensitivityLevel = autoSensitivityLevel(
        selSpecies?.name || "",
        selSpecies?.conservationStatus || "",
        selSpecies?.riskCategory || ""
      );
      const record = await Observation.create({
        speciesId:      selSpecies?.id   || null,
        speciesName:    selSpecies?.name || null,
        trailId:        selTrail?.id     || null,
        trailName:      selTrail?.name   || null,
        timestamp,
        month,
        year,
        season,
        conditions:     conditions || null,
        notes:          notes      || null,
        lat:            gps.lat    || null,
        lng:            gps.lng    || null,
        sessionKey:     `${year}`,
        photoUrl:       null,
        source:         "curated",
        isProvisional:  false,
        isPublicEligible: true,
        sensitivityLevel,
      });
      setSaved(true);
      if (onSaved) onSaved(record);
      setTimeout(() => {
        setSaved(false);
        setSelSpecies(propSpeciesId ? { id: propSpeciesId, name: propSpeciesName } : null);
        setSelTrail(propTrailId     ? { id: propTrailId,   name: propTrailName   } : null);
        setDate(todayStr);
        setTime(timeStr);
        setConditions("");
        setNotes("");
        if (isModal && onClose) onClose();
      }, 1600);
    } catch (err) {
      console.error(err);
      setError("Save failed — try again.");
    } finally {
      setSaving(false);
    }
  }

  const inner = (
    <div style={{
      background: "#1A1A17",
      borderRadius: isModal ? "20px 20px 0 0" : 0,
      padding: "20px 20px 40px",
      maxWidth: isModal ? 640 : "100%",
      margin: isModal ? "0 auto" : 0,
      maxHeight: isModal ? "92vh" : "none",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>

      {/* Handle (modal only) */}
      {isModal && <div style={{ width: 36, height: 4, borderRadius: 2,
        background: "#D0C9BC", margin: "0 auto 16px" }} />}

      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#7FAF8A", fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Field Log
          </div>
          <div style={{ color: "#1C3A2A", fontSize: 20, fontWeight: 800 }}>Log Sighting</div>
        </div>
        {isModal && (
          <button type="button" onClick={onClose} style={{
            background: "none", border: "none", color: "#9BB8A4",
            fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {saved ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#4A7C59" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Sighting logged.</div>
          {gps.status === "ok" && (
            <div style={{ fontSize: 12, color: "#7FAF8A", marginTop: 8 }}>
              📍 GPS captured
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>

          {/* ── Species picker ── */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Species *</label>
            {loaded ? (
              <SearchPicker
                placeholder="Search species name…"
                items={allSpecies}
                onSelect={setSelSpecies}
                selected={selSpecies}
              />
            ) : propSpeciesName ? (
              <div style={prefillStyle}>{propSpeciesName}</div>
            ) : (
              <div style={{ color: "#9BB8A4", fontSize: 13 }}>Loading species…</div>
            )}
          </div>

          {/* ── Trail picker ── */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Trail</label>
            {loaded ? (
              <SearchPicker
                placeholder="Search trail name…"
                items={allTrails}
                onSelect={setSelTrail}
                selected={selTrail}
              />
            ) : propTrailName ? (
              <div style={prefillStyle}>{propTrailName}</div>
            ) : (
              <div style={{ color: "#9BB8A4", fontSize: 13 }}>Loading trails…</div>
            )}
          </div>

          {/* ── Date + Time ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* ── Season chip ── */}
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(74,124,89,0.08)", border: "1px solid rgba(74,124,89,0.15)",
              color: "#4A7C59",
            }}>
              {season === "spring" && "🌸"}{season === "summer" && "☀️"}
              {season === "fall"   && "🍂"}{season === "winter" && "🌧"}{" "}
              {season.charAt(0).toUpperCase() + season.slice(1)} · {year}
            </div>

            {/* GPS status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {gps.status === "loading" && (
                <span style={{ fontSize: 12, color: "#9BB8A4" }}>📍 Getting GPS…</span>
              )}
              {gps.status === "ok" && (
                <span style={{ fontSize: 12, color: "#4A7C59", fontWeight: 600 }}>
                  📍 {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
                </span>
              )}
              {gps.status === "denied" && (
                <button type="button" onClick={gps.capture} style={{
                  fontSize: 11, color: "#9BB8A4", background: "none",
                  border: "1px solid #D8D0C4", borderRadius: 6,
                  padding: "3px 8px", cursor: "pointer",
                }}>📍 Retry GPS</button>
              )}
              {gps.status === "unsupported" && (
                <span style={{ fontSize: 11, color: "#C0A090" }}>GPS unavailable</span>
              )}
            </div>
          </div>

          {/* ── Conditions ── */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Conditions</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CONDITIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => setConditions(conditions === c ? "" : c)}
                  style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                    border:      conditions === c ? "1px solid #4A7C59" : "1px solid #D8D0C4",
                    background:  conditions === c ? "rgba(74,124,89,0.12)" : "#F5F2EC",
                    color:       conditions === c ? "#3A6A4A" : "#6A8A7A",
                    fontWeight:  conditions === c ? 600 : 400,
                    transition: "all 0.12s",
                  }}>{c}</button>
              ))}
            </div>
          </div>

          {/* ── Notes ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Field Note</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What did you see, hear, or notice?"
              rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {error && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 12 }}>{error}</div>}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 10 }}>
            {isModal && (
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14,
                border: "1px solid #D8D0C4", background: "#F5F2EC",
                color: "#7FAF8A", fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
            )}
            <button type="submit" disabled={saving || !selSpecies} style={{
              flex: 2, padding: "12px 0", borderRadius: 12, fontSize: 14,
              border: "none",
              background: (!selSpecies || saving) ? "#C8D8C4" : "#1C3A2A",
              color: "#F0E9D6", fontWeight: 700,
              cursor: (!selSpecies || saving) ? "default" : "pointer",
              transition: "background 0.15s",
            }}>
              {saving ? "Saving…" : "Log Sighting"}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (!isModal) return (
    <div style={{ minHeight: "100vh", background: "#1A1A17", fontFamily: "system-ui, sans-serif" }}>
      {inner}
      <div style={{ height: 80 }} />
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,26,20,0.72)", backdropFilter: "blur(4px)",
      }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
        fontFamily: "system-ui, sans-serif",
      }}>
        {inner}
      </div>
    </>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────
const labelStyle = {
  color: "#7FAF8A", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "block", marginBottom: 6,
};
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: "1px solid #D8D0C4", background: "#F5F2EC",
  color: "#1C3A2A", fontSize: 14, boxSizing: "border-box",
  fontFamily: "inherit",
};
const prefillStyle = {
  padding: "10px 12px", borderRadius: 10,
  background: "rgba(74,124,89,0.08)", border: "1px solid rgba(74,124,89,0.3)",
  color: "#1C3A2A", fontSize: 14, fontWeight: 600,
};
