// EarthEye OC — SpeciesDetail v4 — Yard Edition DNA
import { useState, useEffect } from "react";
import { Species, Trail, Observation } from "@/api/entities";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { logSpeciesSighting } from "./Journal";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:         "#0F0F0D",
  card:       "#1A1A17",
  cardAlt:    "#161613",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  ink:        "rgba(255,255,255,0.90)",
  inkMid:     "rgba(255,255,255,0.70)",
  inkLight:   "rgba(255,255,255,0.35)",
  inkFaint:   "rgba(255,255,255,0.18)",
  accent:     "#7AB87A",
  accentDim:  "rgba(122,184,122,0.5)",
  accentPale: "rgba(122,184,122,0.12)",
  warn:       "#C47A7A",
  warnPale:   "rgba(196,122,122,0.12)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_SEASON = {
  0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
  5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter"
};
const SEASON_ORDER = ["spring","summer","fall","winter"];
const MONTH_TO_SEASON = ["winter","winter","spring","spring","spring","summer","summer","summer","fall","fall","fall","winter"];
const MONTH_LABELS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

const RARE_STATUSES = ["of concern","threatened","endangered","critically endangered",
  "state threatened","federally threatened","federally endangered","rare","very rare"];

const CORRIDORS = [
  { id:"69e069445c7bb4cecf803289", name:"Mountains-to-Sea",  short:"Mtn–Sea" },
  { id:"69e0248656b58bca7d679d30", name:"Upper Newport Bay", short:"Newport Bay" },
  { id:"69e005f2b447b8e1f109219e", name:"Crystal Cove",      short:"Crystal Cove" },
  { id:"69e06ef8ae83438254c22903", name:"San Juan Creek",    short:"San Juan" },
];

const HABITAT_BIOME_MAP = [
  { keywords:["coast","beach","intertidal","tidepool","rocky shore","sandy","surf","dune","bluff"],        biome:"coastal",   label:"Coastal" },
  { keywords:["wetland","marsh","estuary","saltmarsh","mudflat","bay","tidal","cordgrass","pickleweed","riparian","creek","river"], biome:"wetlands",  label:"Wetlands" },
  { keywords:["chaparral","sage scrub","scrub","shrubland","coastal sage","manzanita","ceanothus"],        biome:"chaparral", label:"Chaparral" },
  { keywords:["oak woodland","oak","woodland","canyon woodland"],                                          biome:"woodland",  label:"Oak Woodland" },
  { keywords:["mountain","peak","ridge","conifer","pine","fir","subalpine"],                               biome:"mountains", label:"Mountains" },
  { keywords:["grassland","meadow","vernal pool","annual grass","open field"],                             biome:"grassland", label:"Grassland" },
  { keywords:["kelp forest","offshore","pelagic","subtidal","open water","ocean","marine"],                biome:"marine",    label:"Marine" },
  { keywords:["urban","suburban","garden","park","developed","city","edge","disturbed"],                   biome:"urban",     label:"Urban Edge" },
];

function getHabitatBiomes(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const seen = new Set(), out = [];
  for (const e of HABITAT_BIOME_MAP) {
    if (!seen.has(e.biome) && e.keywords.some(k => lower.includes(k))) {
      out.push(e); seen.add(e.biome);
    }
  }
  return out;
}

// Privacy utilities (inlined)
const K_OBS = 3, K_DAYS = 2;
function trailVisibility(obs) {
  if (!obs?.length) return { eligible:false, rollupLevel:"hidden" };
  if (obs.some(o => o.source === "curated")) return { eligible:true, rollupLevel:"trail" };
  if (obs.some(o => o.sensitivityLevel === "high")) return { eligible:false, rollupLevel:"corridor" };
  const total = obs.filter(o => o.isPublicEligible !== false).length;
  const days  = new Set(obs.filter(o => o.timestamp).map(o => new Date(o.timestamp).toDateString())).size;
  return (total >= K_OBS && days >= K_DAYS) ? { eligible:true, rollupLevel:"trail" } : { eligible:false, rollupLevel:"corridor" };
}
function coarseSeasonLabel(date) {
  const m = date.getMonth(), y = date.getFullYear();
  if (m>=2&&m<=4) return `Spring ${y}`;
  if (m>=5&&m<=7) return `Summer ${y}`;
  if (m>=8&&m<=10) return `Fall ${y}`;
  return `Winter ${y}`;
}
function publicTrailDisplay(obs, trail) {
  if (!obs?.length) return null;
  const { eligible, rollupLevel } = trailVisibility(obs);
  const hasHigh = obs.some(o => o.sensitivityLevel === "high");
  const ts = obs.filter(o => o.timestamp).map(o => new Date(o.timestamp));
  const seasonLabel = ts.length ? coarseSeasonLabel(new Date(Math.max(...ts))) : null;
  if (hasHigh || rollupLevel === "corridor") return { visible:true, resolution:"corridor", label:trail.corridorName||trail.biomeName||"OC bioregion", temporal:seasonLabel };
  if (eligible && rollupLevel === "trail") return { visible:true, resolution:"trail", label:trail.name, temporal:seasonLabel };
  return null;
}
function seenOnTrailsChips(allObs, trailMap) {
  const byTrail = {};
  allObs.forEach(o => { if (o.trailId) { if (!byTrail[o.trailId]) byTrail[o.trailId]=[]; byTrail[o.trailId].push(o); } });
  const chips=[], seen=new Set();
  Object.entries(byTrail).forEach(([id,obs]) => {
    const d = publicTrailDisplay(obs, trailMap[id]||{name:id});
    if (!d) return;
    if (d.resolution==="trail") chips.push({type:"trail",id,label:d.label,temporal:d.temporal});
    else if (!seen.has(d.label)) { seen.add(d.label); chips.push({type:"corridor",id:null,label:d.label,temporal:d.temporal}); }
  });
  return chips;
}
const HIGH_SENS = new Set(["Least Bell's Vireo","California Gnatcatcher","Coastal Cactus Wren","Belding's Savannah Sparrow","Western Snowy Plover","Burrowing Owl","Ridgway's Rail","Black Rail","Tricolored Blackbird","Elegant Tern","California Condor","Steelhead Trout","Tidewater Goby","Santa Ana Sucker","Arroyo Toad","Southern Steelhead","Mountain Lion","Bobcat"]);

// ── Whispered label ───────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
      textTransform:"uppercase", color:T.inkLight, marginBottom:"12px" }}>
      {children}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ label, children, style }) {
  return (
    <div style={{ marginBottom:"28px", ...style }}>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}

// ── Species hero — 4:3, locked, full-bleed ────────────────────────────────────
function SpeciesHero({ src, name, group, scientificName, isActive, currentSeason }) {
  const [state, setState] = useState(src ? "loading" : "empty");

  return (
    <div style={{ position:"relative", width:"100%", paddingTop:"75%",
      background:"#0A0A08", overflow:"hidden" }}>
      {/* Image — fills the 4:3 container */}
      {src && state !== "empty" && (
        <img
          src={src}
          alt={name}
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          style={{
            position:"absolute", inset:0,
            width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            display:"block",
            opacity: state === "ok" ? 1 : 0,
            transition:"opacity 0.6s"
          }}
        />
      )}
      {/* Gradient overlay — only when image loaded */}
      {state === "ok" && (
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 45%, rgba(15,15,13,0.88) 100%)"
        }} />
      )}
      {/* Empty/error state */}
      {(state === "empty" || state === "error") && (
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"#111110"
        }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"50%",
            background:"rgba(255,255,255,0.06)" }} />
        </div>
      )}
      {/* Name + identity at bottom */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"0 20px 20px"
      }}>
        <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
          textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:"5px" }}>
          {group || "Species"}
          {isActive && (
            <span style={{ marginLeft:"10px", color:T.accent }}>· Active now</span>
          )}
        </div>
        <div style={{ fontSize:"clamp(22px,5vw,30px)", fontFamily:"Georgia, serif",
          fontWeight:"400", color:"rgba(255,255,255,0.92)", lineHeight:1.2, marginBottom:"4px" }}>
          {name}
        </div>
        {scientificName && (
          <div style={{ fontSize:"13px", fontStyle:"italic",
            color:"rgba(255,255,255,0.40)" }}>
            {scientificName}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Season presence bar ───────────────────────────────────────────────────────
function SeasonBar({ seasons }) {
  const currentSeason = MONTH_SEASON[new Date().getMonth()];
  const currentMonth  = new Date().getMonth();
  const presentSeasons = (seasons||[]).map(s=>s.toLowerCase());
  const isYearRound = presentSeasons.length===0 || presentSeasons.length>=4;

  const monthActive = Array.from({length:12},(_,i) => {
    const s = MONTH_TO_SEASON[i];
    return isYearRound || presentSeasons.includes(s);
  });

  const SEASON_COLOR = { spring:"#7AB87A", summer:"#C4974A", fall:"#C47A7A", winter:"#7A9AB8" };

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"11px", padding:"16px" }}>
      <div style={{ display:"flex", gap:"3px", marginBottom:"12px", alignItems:"flex-end", height:"24px" }}>
        {monthActive.map((active, i) => {
          const isCurrent = i === currentMonth;
          const sc = SEASON_COLOR[MONTH_TO_SEASON[i]];
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", gap:"3px" }}>
              <div style={{
                width:"100%", borderRadius:"2px",
                height: isCurrent ? "18px" : active ? "12px" : "6px",
                background: active ? sc : "rgba(255,255,255,0.08)",
                opacity: isCurrent ? 1 : active ? 0.7 : 0.3,
                transition:"all 0.2s",
              }} />
              <div style={{ fontSize:"7px", color: isCurrent ? T.accent : T.inkFaint,
                fontWeight: isCurrent ? "700" : "400" }}>
                {MONTH_LABELS[i]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {SEASON_ORDER.map(s => {
          const present = isYearRound || presentSeasons.includes(s);
          const isCurrent = s === currentSeason;
          const sc = SEASON_COLOR[s];
          return (
            <div key={s} style={{
              padding:"4px 10px", borderRadius:"100px",
              background: present ? `${sc}18` : "rgba(255,255,255,0.04)",
              border: isCurrent && present ? `1px solid ${sc}60` : `1px solid ${T.border}`,
              fontSize:"11px", fontWeight:"600",
              color: present ? sc : T.inkFaint,
              textTransform:"capitalize"
            }}>
              {s}
              {isCurrent && <span style={{ marginLeft:"4px", fontSize:"9px" }}>·now</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:"10px", fontSize:"12px", color:T.inkLight, lineHeight:1.5 }}>
        {isYearRound
          ? `Present year-round · currently ${currentSeason}`
          : presentSeasons.includes(currentSeason)
            ? `Active now — ${currentSeason} presence confirmed`
            : `Not typically present in ${currentSeason}`}
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, italic }) {
  if (!value) return null;
  return (
    <div style={{ paddingBottom:"14px", marginBottom:"14px",
      borderBottom:`1px solid ${T.border}` }}>
      <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.12em",
        textTransform:"uppercase", color:T.inkLight, marginBottom:"5px" }}>
        {label}
      </div>
      <div style={{
        fontSize:"14px", lineHeight:1.65,
        color:T.inkMid,
        fontStyle: italic ? "italic" : "normal",
        fontFamily: italic ? "Georgia, serif" : "inherit"
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Facts list ────────────────────────────────────────────────────────────────
function FactsList({ facts }) {
  if (!facts?.length) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {facts.map((f,i) => (
        <div key={i} style={{
          display:"flex", gap:"12px", alignItems:"flex-start",
          padding:"12px 14px", background:T.card,
          border:`1px solid ${T.border}`, borderRadius:"9px"
        }}>
          <div style={{
            width:"5px", height:"5px", borderRadius:"50%",
            background:T.accent, flexShrink:0, marginTop:"7px"
          }} />
          <div style={{ fontSize:"13px", lineHeight:1.65, color:T.inkMid }}>{f}</div>
        </div>
      ))}
    </div>
  );
}

// ── Corridor presence ─────────────────────────────────────────────────────────
function CorridorPresence({ trailIds, navigate }) {
  const matched   = CORRIDORS.filter(c => trailIds?.includes(c.id));
  const unmatched = CORRIDORS.filter(c => !trailIds?.includes(c.id));
  if (!matched.length) return null;

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"11px", padding:"16px" }}>
      <Label>Canonical Corridors</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:"1px",
        border:`1px solid ${T.border}`, borderRadius:"8px", overflow:"hidden",
        marginBottom: unmatched.length ? "10px" : "0" }}>
        {matched.map(c => (
          <div key={c.id} onClick={() => navigate(`/TrailDetail?id=${c.id}`)}
            style={{ background:"rgba(122,184,122,0.07)", padding:"12px 14px",
              cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"space-between" }}>
            <div style={{ fontSize:"14px", fontFamily:"Georgia, serif", color:T.ink }}>
              {c.name}
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        ))}
      </div>
      {unmatched.length > 0 && (
        <div style={{ fontSize:"11px", color:T.inkFaint }}>
          Not documented on: {unmatched.map(c=>c.short).join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Trails panel ──────────────────────────────────────────────────────────────
function TrailsPanel({ speciesId, trailIds, navigate }) {
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!speciesId) { setLoading(false); return; }
    (async () => {
      try {
        const [obs, allTrails] = await Promise.all([
          Observation.filter({ speciesId }).catch(()=>[]),
          Trail.filter({}).catch(()=>[]),
        ]);
        const trailMap = {};
        allTrails.filter(Boolean).forEach(t => { trailMap[t.id] = t; });
        let publicChips = seenOnTrailsChips(obs, trailMap);
        if (publicChips.length === 0 && trailIds?.length) {
          publicChips = trailIds.slice(0, 20).map(tid => ({
            type:"trail", id:tid,
            label:trailMap[tid]?.name || "OC Trail",
            temporal:null
          }));
        }
        setChips(publicChips);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [speciesId]);

  if (loading) return null;
  if (!chips.length) return null;

  const visible = expanded ? chips : chips.slice(0, 5);

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"11px", overflow:"hidden" }}>
      <div style={{ padding:"14px 16px 10px" }}>
        <Label>Where Found</Label>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"1px",
        background:T.border }}>
        {visible.map((chip, i) => (
          <div key={i}
            onClick={() => chip.id && navigate(`/TrailDetail?id=${chip.id}`)}
            style={{
              background:T.card, padding:"12px 16px",
              cursor: chip.id ? "pointer" : "default",
              display:"flex", alignItems:"center", justifyContent:"space-between"
            }}>
            <div>
              <div style={{ fontSize:"13px", color:T.ink }}>{chip.label}</div>
              {chip.temporal && (
                <div style={{ fontSize:"11px", color:T.inkLight, marginTop:"2px" }}>{chip.temporal}</div>
              )}
            </div>
            {chip.id && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            )}
          </div>
        ))}
      </div>
      {chips.length > 5 && (
        <div style={{ padding:"12px 16px" }}>
          <button onClick={() => setExpanded(e=>!e)}
            style={{ fontSize:"12px", color:T.accent, background:"none",
              border:"none", cursor:"pointer", padding:0 }}>
            {expanded ? "Show fewer" : `Show all ${chips.length} locations`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Observation panel ─────────────────────────────────────────────────────────
function ObsPanel({ species }) {
  const [obs, setObs]       = useState([]);
  const [logged, setLogged] = useState(false);
  const [ready, setReady]   = useState(false);

  const getSessionKey = () => {
    let k = sessionStorage.getItem("ee_session");
    if (!k) { k = Math.random().toString(36).slice(2); sessionStorage.setItem("ee_session", k); }
    return k;
  };

  useEffect(() => {
    Promise.all([
      Observation.filter({ speciesId: species.id }),
      Observation.filter({ speciesId: species.id, sessionKey: getSessionKey() }),
    ]).then(([all, mine]) => {
      setObs(all||[]);
      setLogged((mine||[]).length > 0);
      setReady(true);
    }).catch(() => setReady(true));
  }, [species.id]);

  const count = obs.length;
  const monthCounts = Array(12).fill(0);
  obs.forEach(o => { if (o.month!=null) monthCounts[Number(o.month)]++; });
  const maxMonth = Math.max(...monthCounts, 1);

  const SEASON_COLOR = { spring:"#7AB87A", summer:"#C4974A", fall:"#C47A7A", winter:"#7A9AB8" };
  const seasonCounts = { spring:0, summer:0, fall:0, winter:0 };
  obs.forEach(o => { const s=o.season||MONTH_SEASON[Number(o.month)]; if(s&&seasonCounts[s]!=null) seasonCounts[s]++; });
  const peakSeason = Object.entries(seasonCounts).sort((a,b)=>b[1]-a[1])[0];
  const peakLabel  = peakSeason && peakSeason[1]>0 ? peakSeason[0] : null;

  if (!ready) return null;

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"11px", padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          <Label>Atlas Sightings</Label>
          <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
            <span style={{ fontSize:"28px", fontFamily:"Georgia, serif",
              color:T.ink, lineHeight:1 }}>
              {count}
            </span>
            <span style={{ fontSize:"12px", color:T.inkLight }}>
              {count===1?"observation":"observations"}
            </span>
          </div>
          {peakLabel && (
            <div style={{ marginTop:"4px", fontSize:"11px",
              color:SEASON_COLOR[peakLabel] }}>
              Peak: {peakLabel}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            const key = Math.random().toString(36).slice(2);
            sessionStorage.setItem("ee_session", key);
            setLogged(true);
            Observation.create({
              speciesId: species.id,
              speciesName: species.name,
              sessionKey: key,
              source: "user",
              timestamp: new Date().toISOString(),
              month: new Date().getMonth(),
              year: new Date().getFullYear(),
              isPublicEligible: true,
              sensitivityLevel: HIGH_SENS.has(species.name) ? "high" : "normal",
            }).catch(()=>{});
          }}
          style={{
            padding:"9px 16px", borderRadius:"100px", cursor:"pointer",
            background: logged ? T.accentPale : "rgba(122,184,122,0.2)",
            border: logged ? `1px solid ${T.accentDim}` : "1px solid rgba(122,184,122,0.4)",
            fontSize:"12px", fontWeight:"600",
            color: logged ? T.accent : T.ink,
          }}
        >
          {logged ? "Logged ✓" : "Log sighting"}
        </button>
      </div>

      {/* Month histogram */}
      {count > 0 && (
        <div style={{ display:"flex", gap:"3px", alignItems:"flex-end", height:"32px" }}>
          {monthCounts.map((c,i) => {
            const isCurrent = i === new Date().getMonth();
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", gap:"2px" }}>
                <div style={{
                  width:"100%", borderRadius:"2px",
                  height: c > 0 ? `${Math.max(4, Math.round((c/maxMonth)*22))}px` : "3px",
                  background: c>0
                    ? (isCurrent ? T.accent : "rgba(122,184,122,0.4)")
                    : "rgba(255,255,255,0.07)",
                }} />
                <div style={{ fontSize:"7px", color:isCurrent?T.accent:T.inkFaint }}>
                  {MONTH_LABELS[i]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Lookalikes ────────────────────────────────────────────────────────────────
function Lookalikes({ lookalikes, lookalikeMap, navigate }) {
  if (!lookalikes?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"11px", padding:"16px" }}>
      <Label>Lookalikes</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {lookalikes.map((name, i) => {
          const lid = lookalikeMap[name];
          return (
            <div key={i}
              onClick={() => lid && navigate(`/SpeciesDetail?id=${lid}`)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px",
                background:"rgba(255,255,255,0.03)",
                border:`1px solid ${T.border}`, borderRadius:"8px",
                cursor: lid ? "pointer" : "default"
              }}>
              <span style={{ fontSize:"14px", fontFamily:"Georgia, serif", color:T.ink }}>
                {name}
              </span>
              {lid && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SpeciesDetail() {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const id = paramId || searchParams.get("id");
  const navigate = useNavigate();

  const fromSource    = searchParams.get("from") || null;
  const fromTrailId   = searchParams.get("trailId") || null;
  const fromTrailName = searchParams.get("trailName") || null;

  const [species, setSpecies]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [lookalikeMap, setLookalikeMap] = useState({});

  // Always land at top — detail page must not inherit list scroll position
  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    Species.get(id).then(data => {
      setSpecies(data);
      setLoading(false);
      logSpeciesSighting(id, data?.name, fromTrailId, fromTrailName);
      if (data?.lookalikes?.length) {
        (async () => {
          let all=[], skip=0;
          while(true) {
            const b = await Species.filter({},null,500,skip);
            const r = Array.isArray(b)?b:(b?.records||[]);
            all=all.concat(r);
            if(r.length<500) break;
            skip+=500;
          }
          const map={};
          data.lookalikes.forEach(n => {
            const m = all.find(s => s.name?.trim().toLowerCase()===n?.trim().toLowerCase());
            if(m) map[n]=m.id;
          });
          setLookalikeMap(map);
        })().catch(()=>{});
      }
    }).catch(() => setLoading(false));
  }, [id]);

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

  if (!species) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:T.bg }}>
      <div style={{ fontSize:"14px", color:T.inkLight }}>Species not found.</div>
    </div>
  );

  const currentSeason  = MONTH_SEASON[new Date().getMonth()];
  const presentSeasons = (species.seasonPresence||[]).map(s=>s.toLowerCase());
  const isActiveNow    = presentSeasons.length===0 || presentSeasons.length>=4 || presentSeasons.includes(currentSeason);
  const isRare         = RARE_STATUSES.includes(species.conservationStatus?.toLowerCase());
  const biomes         = getHabitatBiomes(species.habitat);

  return (
    <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:"60px" }}>

      {/* Back button */}
      <div style={{
        position:"absolute", top:"16px", left:"16px", zIndex:10
      }}>
        <button
          onClick={() => {
            if (fromSource==="trail" && fromTrailId) navigate(`/TrailDetail?id=${fromTrailId}`);
            else navigate(-1);
          }}
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
          {fromSource==="trail" && fromTrailName ? fromTrailName : "Back"}
        </button>
      </div>

      {/* Hero — full-width, 4:3, no crop distortion */}
      <SpeciesHero
        src={species.imageUrl}
        name={species.name}
        group={species.group}
        scientificName={species.scientificName}
        isActive={isActiveNow}
        currentSeason={currentSeason}
      />

      {/* Contribution link — quiet, below hero */}
      <div style={{ padding:"8px 20px 6px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <button
          aria-label={`Suggest a better photo for ${species.name}`}
          onClick={() => {
const subject = encodeURIComponent(`Photo Suggestion: ${species.name}`);
            const body = encodeURIComponent(`Species: ${species.name}\nScientific name: ${species.scientificName || ""}\nGroup: ${species.group || ""}\nSpecies ID: ${species.id || ""}\n\nPlease attach your photo and add any notes below:\n`);
            window.location.href = `mailto:tokyoproperties@gmail.com?subject=${subject}&body=${body}`;
          }}
          style={{
            background:"none", border:"none", padding:"6px 0",
            fontSize:"11px", color:"rgba(255,255,255,0.30)",
            cursor:"pointer", letterSpacing:"0.04em",
            textDecoration:"none", display:"inline-block"
          }}
          onMouseEnter={e => { e.currentTarget.style.color="rgba(122,184,122,0.70)"; e.currentTarget.style.textDecoration="underline"; }}
          onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.30)"; e.currentTarget.style.textDecoration="none"; }}
        >
          Suggest a photo
        </button>
      </div>

      {/* Content */}
      <div style={{ padding:"28px 20px 0" }}>

        {/* Status badges */}
        {(species.conservationStatus || species.nativeStatus || species.frequency) && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"28px" }}>
            {species.conservationStatus && (
              <span style={{
                padding:"4px 10px", borderRadius:"100px", fontSize:"11px", fontWeight:"600",
                background: isRare ? T.warnPale : T.accentPale,
                color: isRare ? T.warn : T.accent,
                border: `1px solid ${isRare ? "rgba(196,122,122,0.3)" : "rgba(122,184,122,0.3)"}`
              }}>
                {species.conservationStatus}
              </span>
            )}
            {species.nativeStatus && (
              <span style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"11px",
                background:"rgba(255,255,255,0.06)", color:T.inkMid,
                border:`1px solid ${T.border}` }}>
                {species.nativeStatus}
              </span>
            )}
            {species.frequency && (
              <span style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"11px",
                background:"rgba(255,255,255,0.06)", color:T.inkLight,
                border:`1px solid ${T.border}` }}>
                {species.frequency}
              </span>
            )}
            {species.endemicStatus && species.endemicStatus !== "widespread" && (
              <span style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"11px",
                background:"rgba(196,151,74,0.12)", color:"#C4974A",
                border:"1px solid rgba(196,151,74,0.3)" }}>
                {species.endemicStatus}
              </span>
            )}
          </div>
        )}

        {/* Conservation alert */}
        {isRare && (
          <div style={{
            background:T.warnPale, border:`1px solid rgba(196,122,122,0.25)`,
            borderRadius:"11px", padding:"14px 16px", marginBottom:"28px"
          }}>
            <div style={{ fontSize:"12px", fontWeight:"700", color:T.warn, marginBottom:"4px" }}>
              Conservation concern — {species.conservationStatus}
            </div>
            <div style={{ fontSize:"12px", color:"rgba(196,122,122,0.7)", lineHeight:1.55 }}>
              Observe from a distance. Do not disturb habitat.
              {species.riskCategory ? ` Risk: ${species.riskCategory}.` : ""}
            </div>
          </div>
        )}

        {/* Field cue — italic serif, prominent */}
        {species.fieldCue && (
          <Section label="Field Cue">
            <div style={{ fontSize:"17px", fontFamily:"Georgia, serif",
              fontStyle:"italic", color:T.inkMid, lineHeight:1.6 }}>
              "{species.fieldCue}"
            </div>
          </Section>
        )}

        {/* Seasonal presence */}
        <Section label="Seasonal Presence">
          <SeasonBar seasons={species.seasonPresence} />
        </Section>

        {/* Habitat */}
        {species.habitat && (
          <Section label="Habitat">
            <div style={{ fontSize:"14px", lineHeight:1.7, color:T.inkMid, marginBottom:"12px" }}>
              {species.habitat}
            </div>
            {biomes.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                {biomes.map(b => (
                  <button key={b.biome}
                    onClick={() => navigate(`/Species?biome=${b.biome}`)}
                    style={{ padding:"5px 12px", borderRadius:"100px", cursor:"pointer",
                      background:"rgba(255,255,255,0.05)",
                      border:`1px solid ${T.border}`,
                      fontSize:"11px", fontWeight:"600", color:T.inkMid }}>
                    {b.label} →
                  </button>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Behavior */}
        {species.behavior && (
          <Section label="Behavior">
            <div style={{ fontSize:"14px", lineHeight:1.7, color:T.inkMid }}>
              {species.behavior}
            </div>
          </Section>
        )}

        {/* Ecological role */}
        {species.ecologicalRole?.length > 0 && (
          <Section label="Ecological Role">
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {species.ecologicalRole.map((r,i) => (
                <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                  <div style={{ width:"4px", height:"4px", borderRadius:"50%",
                    background:T.accent, flexShrink:0, marginTop:"8px" }} />
                  <div style={{ fontSize:"13px", lineHeight:1.65, color:T.inkMid }}>{r}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Fun fact — italic, set apart */}
        {species.funFact && (
          <Section label="Field Note">
            <div style={{
              borderLeft:`2px solid ${T.accent}`, paddingLeft:"14px",
              fontSize:"14px", fontFamily:"Georgia, serif", fontStyle:"italic",
              color:T.inkMid, lineHeight:1.7
            }}>
              {species.funFact}
            </div>
          </Section>
        )}

        {/* Facts */}
        {species.facts?.length > 0 && (
          <Section label="Atlas Notes">
            <FactsList facts={species.facts} />
          </Section>
        )}

        {/* Observations */}
        <Section label="Sightings">
          <ObsPanel species={species} />
        </Section>

        {/* Corridors */}
        {species.trail?.length > 0 && (
          <Section label="Corridors">
            <CorridorPresence trailIds={species.trail} navigate={navigate} />
          </Section>
        )}

        {/* Trails */}
        <Section label="Trails">
          <TrailsPanel speciesId={species.id} trailIds={species.trail} navigate={navigate} />
        </Section>

        {/* Lookalikes */}
        {species.lookalikes?.length > 0 && (
          <Section label="Lookalikes">
            <Lookalikes lookalikes={species.lookalikes} lookalikeMap={lookalikeMap} navigate={navigate} />
          </Section>
        )}

      </div>
    </div>
  );
}
