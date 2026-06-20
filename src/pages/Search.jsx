// EarthEye OC — Search v4 — Yard Edition DNA
import BottomNav from "./BottomNav";
import { useState, useEffect, useRef } from "react";
import { Species, Trail } from "@/api/entities";
import { useNavigate, useSearchParams } from "react-router-dom";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#0F0F0D",
  card:      "#1A1A17",
  border:    "rgba(255,255,255,0.07)",
  ink:       "rgba(255,255,255,0.90)",
  inkMid:    "rgba(255,255,255,0.70)",
  inkLight:  "rgba(255,255,255,0.35)",
  inkFaint:  "rgba(255,255,255,0.18)",
  accent:    "#7AB87A",
  accentPale:"rgba(122,184,122,0.12)",
};

const DIFFICULTY_COLOR = {
  easy:      "#7AB87A",
  moderate:  "#C4974A",
  hard:      "#C47A7A",
  strenuous: "#9A7AB8",
};

const RARE_STATUSES = ["of concern","threatened","endangered","critically endangered",
  "state threatened","federally threatened","federally endangered","rare","very rare"];

const CANONICAL_GROUPS = new Set([
  "bird","mammal","reptile","amphibian","fish","insect","arachnid",
  "crustacean","mollusk","invertebrate","plant","fungi","lichen","algae","human impact"
]);

function normalizeGroup(q, groups) {
  if (groups.has(q)) return q;
  if (q.endsWith("s")) {
    const s = q.slice(0,-1);
    if (groups.has(s)) return s;
  }
  return null;
}

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:"rgba(122,184,122,0.25)", color:T.accent,
        borderRadius:"2px", padding:"0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Seasonal suggestions ──────────────────────────────────────────────────────
const SEASONAL_SUGGESTIONS = {
  spring: [
    { label:"California Gnatcatcher", type:"species", note:"Peak breeding in coastal sage scrub" },
    { label:"Least Bell's Vireo",     type:"species", note:"Returns mid-May to riparian corridors" },
    { label:"San Juan Creek",         type:"trail",   note:"Cliff Swallows returned" },
    { label:"Coast Live Oak",         type:"species", note:"New leaf flush underway" },
    { label:"Painted Lady",           type:"species", note:"Migration pulse through chaparral" },
    { label:"Grunion",                type:"species", note:"Crystal Cove beach at night" },
  ],
  summer: [
    { label:"Burrowing Owl",          type:"species", note:"Grassland species — dawn only" },
    { label:"Elegant Tern",           type:"species", note:"Colony active at Bolsa Chica" },
    { label:"Crystal Cove",           type:"trail",   note:"Dawn start — heat risk by 9am" },
    { label:"Western Rattlesnake",    type:"species", note:"Crepuscular — early morning" },
    { label:"Grunion",                type:"species", note:"Active on Crystal Cove beach" },
    { label:"Bolsa Chica",            type:"trail",   note:"Tern colony nesting" },
  ],
  fall: [
    { label:"Monarch Butterfly",      type:"species", note:"Migration peak — coastal corridors" },
    { label:"Newport Back Bay",       type:"trail",   note:"35,000 shorebirds on mudflats" },
    { label:"Mountain Lion",          type:"species", note:"Coal Canyon — October movement" },
    { label:"Pickleweed",             type:"species", note:"Crimson peak at Newport Bay" },
    { label:"Peregrine Falcon",       type:"species", note:"Hunting the bay channels" },
    { label:"Mountains-to-Sea Trail", type:"trail",   note:"October corridor — all biomes peak" },
  ],
  winter: [
    { label:"Gray Whale",             type:"species", note:"Offshore from Crystal Cove bluffs" },
    { label:"American White Pelican", type:"species", note:"Cooperative feeding at Newport Bay" },
    { label:"Upper Newport Bay",      type:"trail",   note:"Maximum shorebird diversity" },
    { label:"Long-billed Curlew",     type:"species", note:"Peak on the mudflats" },
    { label:"Ridgway's Rail",         type:"species", note:"Vocal before dawn in cordgrass" },
    { label:"Tidewater Goby",         type:"species", note:"Estuary endemic — winter survey" },
  ],
};

// ── Suggestion chip ───────────────────────────────────────────────────────────
function SuggestionRow({ item, onClick }) {
  return (
    <div onClick={() => onClick(item.label)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 0", borderBottom:`1px solid ${T.border}`,
        cursor:"pointer"
      }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"14px", fontFamily:"Georgia, serif",
          color:T.ink, marginBottom:"2px" }}>
          {item.label}
        </div>
        {item.note && (
          <div style={{ fontSize:"11px", fontStyle:"italic",
            color:T.inkLight }}>
            {item.note}
          </div>
        )}
      </div>
      <span style={{ fontSize:"10px", fontWeight:"600", letterSpacing:"0.08em",
        textTransform:"uppercase", color:T.inkFaint,
        padding:"3px 8px", borderRadius:"100px",
        border:`1px solid ${T.border}`, marginLeft:"12px", flexShrink:0 }}>
        {item.type}
      </span>
    </div>
  );
}

// ── Species result row ────────────────────────────────────────────────────────
function SpeciesRow({ sp, query, navigate }) {
  const [imgErr, setImgErr] = useState(false);
  const isRare = RARE_STATUSES.includes(sp.conservationStatus?.toLowerCase());

  return (
    <div
      onClick={() => navigate(`/SpeciesDetail?id=${sp.id}&from=search&q=${encodeURIComponent(query)}`)}
      style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"12px 0", borderBottom:`1px solid ${T.border}`,
        cursor:"pointer"
      }}
    >
      {/* 4:3 thumbnail */}
      <div style={{
        width:"52px", height:"39px", borderRadius:"7px",
        overflow:"hidden", flexShrink:0, background:"#111110", position:"relative"
      }}>
        {sp.imageUrl && !imgErr ? (
          <img src={sp.imageUrl} alt={sp.name}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"center", display:"block" }} />
        ) : (
          <div style={{ width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:"12px", height:"12px", borderRadius:"50%",
              background:"rgba(255,255,255,0.1)" }} />
          </div>
        )}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"14px", fontFamily:"Georgia, serif",
          color:T.ink, marginBottom:"2px",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {highlight(sp.name, query)}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          {sp.scientificName && (
            <span style={{ fontSize:"11px", fontStyle:"italic", color:T.inkFaint }}>
              {sp.scientificName}
            </span>
          )}
          {sp.group && (
            <span style={{ fontSize:"10px", color:T.inkLight, textTransform:"capitalize" }}>
              {sp.group}
            </span>
          )}
          {isRare && (
            <span style={{ fontSize:"9px", fontWeight:"700",
              color:"#C47A7A", letterSpacing:"0.06em" }}>
              At-risk
            </span>
          )}
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </div>
  );
}

// ── Trail result row ──────────────────────────────────────────────────────────
function TrailRow({ trail, query, navigate }) {
  const [imgErr, setImgErr] = useState(false);
  const diff = trail.difficulty?.toLowerCase() || "moderate";
  const dc   = DIFFICULTY_COLOR[diff] || DIFFICULTY_COLOR.moderate;

  return (
    <div
      onClick={() => navigate(`/TrailDetail?id=${trail.id}&from=search&q=${encodeURIComponent(query)}`)}
      style={{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"12px 0", borderBottom:`1px solid ${T.border}`,
        cursor:"pointer"
      }}
    >
      {/* 16:9 thumbnail */}
      <div style={{
        width:"64px", height:"36px", borderRadius:"7px",
        overflow:"hidden", flexShrink:0, background:"#111110", position:"relative"
      }}>
        {trail.heroImage && !imgErr ? (
          <img src={trail.heroImage} alt={trail.name}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"center",
              display:"block", opacity:0.8 }} />
        ) : (
          <div style={{ width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:"14px", height:"14px", borderRadius:"50%",
              background:"rgba(255,255,255,0.08)" }} />
          </div>
        )}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"14px", fontFamily:"Georgia, serif",
          color:T.ink, marginBottom:"2px",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {highlight(trail.name, query)}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {trail.jurisdiction && (
            <span style={{ fontSize:"10px", color:T.inkLight }}>{trail.jurisdiction}</span>
          )}
          {trail.distanceMiles && (
            <span style={{ fontSize:"10px", color:T.inkFaint }}>{trail.distanceMiles} mi</span>
          )}
          {trail.difficulty && (
            <span style={{ fontSize:"10px", fontWeight:"600", color:dc, textTransform:"capitalize" }}>
              {trail.difficulty}
            </span>
          )}
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}>
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Search() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef       = useRef(null);

  const [query,          setQuery]          = useState(searchParams.get("q") || "");
  const [allSpecies,     setAllSpecies]     = useState([]);
  const [allTrails,      setAllTrails]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeSection,  setActiveSection]  = useState("all");
  const [displayedCount, setDisplayedCount] = useState(100);

  const currentMonth  = new Date().getMonth();
  const currentSeason = currentMonth>=2&&currentMonth<=4 ? "spring"
    : currentMonth>=5&&currentMonth<=7 ? "summer"
    : currentMonth>=8&&currentMonth<=10 ? "fall" : "winter";
  const SUGGESTIONS = SEASONAL_SUGGESTIONS[currentSeason];

  const SEASON_VOICE = {
    spring: "California Gnatcatcher is singing in coastal sage. Cliff Swallows are back. Chaparral slopes are blooming.",
    summer: "Arrive before 8am on exposed trails. Tern colony active at Bolsa Chica. Grunion run nights at Crystal Cove.",
    fall:   "All five OC corridors peak simultaneously. 35,000 shorebirds at Newport Bay. The October Convergence.",
    winter: "Gray Whale offshore from Crystal Cove. Maximum shorebird diversity at Newport Bay. Best minus tides of the year.",
  };

  // Load all data
  useEffect(() => {
    (async () => {
      try {
        const [b1, b2, tr] = await Promise.all([
          Species.filter({}, null, 500, 0),
          Species.filter({}, null, 500, 500),
          Trail.filter({}, null, 200, 0),
        ]);
        setAllSpecies([...(b1||[]), ...(b2||[])]);
        setAllTrails(tr||[]);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => { setDisplayedCount(100); }, [query]);

  const q = query.trim().toLowerCase();
  const normalizedQ  = normalizeGroup(q, CANONICAL_GROUPS);
  const isGroupQuery = normalizedQ !== null;

  const allMatchedSpecies = q.length < 2 ? [] : allSpecies.filter(s => {
    const nameHit  = s.name?.toLowerCase().includes(q);
    const sciHit   = s.scientificName?.toLowerCase().includes(q);
    const groupHit = s.group?.toLowerCase() === normalizedQ;
    if (isGroupQuery) return groupHit;
    if (nameHit || sciHit || groupHit) return true;
    if (q.length >= 8) {
      return s.habitat?.toLowerCase().includes(q) ||
        s.fieldCue?.toLowerCase().includes(q) ||
        s.funFact?.toLowerCase().includes(q) ||
        s.behavior?.toLowerCase().includes(q) ||
        (s.facts||[]).some(f => f.toLowerCase().includes(q));
    }
    return false;
  });

  const sortedSpecies  = [...allMatchedSpecies].sort((a,b) => (a.name||"").localeCompare(b.name||""));
  const matchedSpecies = sortedSpecies.slice(0, displayedCount);
  const hasMore        = sortedSpecies.length > displayedCount;

  const matchedTrails = q.length < 2 ? [] : allTrails.filter(t =>
    t.name?.toLowerCase().includes(q) ||
    t.jurisdiction?.toLowerCase().includes(q) ||
    (t.habitatTypes||[]).some(h => h.toLowerCase().includes(q)) ||
    t.ecologicalNotes?.toLowerCase().includes(q)
  ).slice(0, 10);

  const totalResults = allMatchedSpecies.length + matchedTrails.length;
  const showSpecies  = activeSection === "all" || activeSection === "species";
  const showTrails   = activeSection === "all" || activeSection === "trails";

  return (
    <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:"80px" }}>

      {/* ── Sticky search bar ─────────────────────────────────────────────── */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        background:T.bg, borderBottom:`1px solid ${T.border}`,
        padding:"20px 20px 14px"
      }}>
        <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
          textTransform:"uppercase", color:T.inkLight, marginBottom:"12px" }}>
          EarthEye OC · Search
        </div>

        {/* Input */}
        <div style={{ position:"relative" }}>
          <svg style={{ position:"absolute", left:"12px", top:"50%",
            transform:"translateY(-50%)", pointerEvents:"none" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={T.inkLight} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Species, trail, habitat, behavior…"
            style={{
              width:"100%", paddingLeft:"38px",
              paddingRight: query ? "38px" : "14px",
              paddingTop:"11px", paddingBottom:"11px",
              background:"rgba(255,255,255,0.05)",
              border:`1px solid ${T.border}`,
              borderRadius:"10px", fontSize:"15px", color:T.ink,
              outline:"none", boxSizing:"border-box"
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
              background:"rgba(255,255,255,0.10)", border:"none", borderRadius:"50%",
              width:"20px", height:"20px", cursor:"pointer", color:T.inkMid,
              fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center"
            }}>×</button>
          )}
        </div>

        {/* Section tabs — only when results exist */}
        {q.length >= 2 && totalResults > 0 && (
          <div style={{ display:"flex", gap:"6px", marginTop:"10px" }}>
            {[
              { id:"all",     label:`All (${totalResults})` },
              { id:"species", label:`Species (${allMatchedSpecies.length})` },
              { id:"trails",  label:`Trails (${matchedTrails.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{
                padding:"5px 12px", borderRadius:"100px", cursor:"pointer",
                fontSize:"11px", fontWeight:"600", border:"none",
                background: activeSection===tab.id ? "rgba(122,184,122,0.18)" : "rgba(255,255,255,0.06)",
                color: activeSection===tab.id ? T.accent : T.inkLight,
                outline: activeSection===tab.id ? "1px solid rgba(122,184,122,0.35)" : `1px solid rgba(255,255,255,0.08)`,
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:"0 20px" }}>

        {/* ── Empty state — seasonal suggestions ───────────────────────── */}
        {q.length < 2 && (
          <div style={{ paddingTop:"28px" }}>
            <div style={{ marginBottom:"28px" }}>
              <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
                textTransform:"uppercase", color:T.inkLight, marginBottom:"10px" }}>
                {currentSeason} · right now
              </div>
              <div style={{ fontSize:"14px", fontFamily:"Georgia, serif",
                fontStyle:"italic", color:T.inkMid, lineHeight:1.65 }}>
                {SEASON_VOICE[currentSeason]}
              </div>
            </div>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"6px" }}>
              Active right now
            </div>
            {SUGGESTIONS.map((s,i) => (
              <SuggestionRow key={i} item={s} onClick={label => setQuery(label)} />
            ))}
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && q.length >= 2 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            padding:"60px 0", gap:"12px" }}>
            <div style={{
              width:"20px", height:"20px", borderRadius:"50%",
              border:"2px solid rgba(255,255,255,0.08)",
              borderTopColor:T.accent,
              animation:"spin 0.8s linear infinite"
            }} />
            <span style={{ fontSize:"12px", color:T.inkLight }}>Searching…</span>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── No results ────────────────────────────────────────────────── */}
        {!loading && q.length >= 2 && totalResults === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:"13px", color:T.inkLight, marginBottom:"6px" }}>
              Nothing found for <span style={{ color:T.inkMid }}>"{query}"</span>
            </div>
            <div style={{ fontSize:"11px", color:T.inkFaint }}>
              Try a common name, habitat type, or trail name
            </div>
          </div>
        )}

        {/* ── Species results ───────────────────────────────────────────── */}
        {!loading && showSpecies && matchedSpecies.length > 0 && (
          <div style={{ paddingTop:"24px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"4px" }}>
              Species · {allMatchedSpecies.length}
            </div>
            {matchedSpecies.map(sp => (
              <SpeciesRow key={sp.id} sp={sp} query={q} navigate={navigate} />
            ))}
            {hasMore && (
              <div style={{ paddingTop:"16px", paddingBottom:"8px" }}>
                <button onClick={() => setDisplayedCount(c => c + 100)} style={{
                  padding:"10px 24px", borderRadius:"100px", cursor:"pointer",
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`,
                  fontSize:"12px", color:T.inkMid
                }}>
                  Load more · {sortedSpecies.length - displayedCount} remaining
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Trail results ─────────────────────────────────────────────── */}
        {!loading && showTrails && matchedTrails.length > 0 && (
          <div style={{ paddingTop:"24px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em",
              textTransform:"uppercase", color:T.inkLight, marginBottom:"4px" }}>
              Trails · {matchedTrails.length}
            </div>
            {matchedTrails.map(t => (
              <TrailRow key={t.id} trail={t} query={q} navigate={navigate} />
            ))}
          </div>
        )}

      </div>

      <BottomNav active="search" />
    </div>
  );
}
