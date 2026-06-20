// EarthEye OC — Trails v5 — Clean Canonical
import { useState, useEffect, useMemo } from "react";
import BottomNav from "./BottomNav";
import { Trail } from "@/api/entities";
import { useNavigate, useSearchParams } from "react-router-dom";

const T = {
  bg:        "#0F0F0D",
  card:      "#1A1A17",
  border:    "rgba(255,255,255,0.07)",
  ink:       "rgba(255,255,255,0.90)",
  inkMid:    "rgba(255,255,255,0.70)",
  inkLight:  "rgba(255,255,255,0.35)",
  inkFaint:  "rgba(255,255,255,0.18)",
  accent:    "#7AB87A",
};

const DIFFICULTY_COLOR = {
  easy:      "#7AB87A",
  moderate:  "#C4974A",
  hard:      "#C47A7A",
  strenuous: "#9A7AB8",
};

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "easy",     label: "Easy" },
  { id: "moderate", label: "Moderate" },
  { id: "hard",     label: "Hard" },
  { id: "coastal",  label: "Coastal" },
  { id: "riparian", label: "Riparian" },
  { id: "dog",      label: "Dog Friendly" },
  { id: "water",    label: "Has Water" },
];

const PAGE_SIZE = 30;

function TrailCard({ trail, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const diff = trail.difficulty?.toLowerCase() || "moderate";
  const dc   = DIFFICULTY_COLOR[diff] || DIFFICULTY_COLOR.moderate;

  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: "11px",
        overflow: "hidden",
        cursor: "pointer",
        marginBottom: "8px",
      }}
    >
      {trail.heroImage && !imgErr ? (
        <div style={{
          width: "100%", paddingTop: "56.25%",
          position: "relative", background: "#0A0A08", overflow: "hidden"
        }}>
          <img
            src={trail.heroImage}
            alt={trail.name}
            onError={() => setImgErr(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              display: "block", opacity: 0.78
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(26,26,23,0.80) 100%)"
          }} />
          <div style={{
            position: "absolute", top: "10px", right: "10px",
            width: "8px", height: "8px", borderRadius: "50%",
            background: dc, opacity: 0.9
          }} />
        </div>
      ) : null}

      <div style={{ padding: "13px 14px 14px" }}>
        {trail.jurisdiction && (
          <div style={{
            fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em",
            textTransform: "uppercase", color: T.inkLight, marginBottom: "5px"
          }}>
            {trail.jurisdiction}
          </div>
        )}
        <div style={{
          fontSize: "15px", fontFamily: "Georgia, serif", fontWeight: "400",
          color: T.ink, marginBottom: "5px", lineHeight: 1.3
        }}>
          {trail.name}
        </div>
        {trail.ecologicalNotes && (
          <div style={{
            fontSize: "12px", fontStyle: "italic", fontFamily: "Georgia, serif",
            color: T.inkLight, lineHeight: 1.55, marginBottom: "8px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {trail.ecologicalNotes}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {trail.distanceMiles && (
            <span style={{ fontSize: "11px", color: T.inkLight }}>
              {trail.distanceMiles} mi
            </span>
          )}
          {trail.difficulty && (
            <span style={{
              fontSize: "10px", fontWeight: "600", color: dc,
              textTransform: "capitalize"
            }}>
              {trail.difficulty}
            </span>
          )}
          {trail.dogFriendly === "yes" && (
            <span style={{ fontSize: "10px", color: T.inkFaint }}>Dog friendly</span>
          )}
          {trail.hasWater === "yes" && (
            <span style={{ fontSize: "10px", color: T.inkFaint }}>Water</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "100px", cursor: "pointer",
      fontSize: "12px", fontWeight: "600", border: "none",
      background: active ? "rgba(122,184,122,0.18)" : "rgba(255,255,255,0.06)",
      color: active ? T.accent : T.inkMid,
      outline: active ? "1px solid rgba(122,184,122,0.35)" : "1px solid rgba(255,255,255,0.08)",
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

export default function Trails() {
  const [trails, setTrails]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [page, setPage]       = useState(1);
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const f = searchParams.get("filter");
    if (f) setFilter(f);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let all = [], skip = 0;
        while (true) {
          const b = await Trail.filter({}, null, 200, skip);
          const r = Array.isArray(b) ? b : (b?.records || []);
          all = all.concat(r);
          if (r.length < 200) break;
          skip += 200;
        }
        all.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setTrails(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { setPage(1); }, [search, filter]);

  const filtered = useMemo(() => trails.filter(t => {
    const q = search.toLowerCase();
    if (search && !t.name?.toLowerCase().includes(q) && !t.jurisdiction?.toLowerCase().includes(q)) return false;
    const d = t.difficulty?.toLowerCase();
    if (filter === "easy"     && d !== "easy") return false;
    if (filter === "moderate" && d !== "moderate") return false;
    if (filter === "hard"     && d !== "hard" && d !== "strenuous") return false;
    if (filter === "dog"      && t.dogFriendly?.toLowerCase() !== "yes") return false;
    if (filter === "water"    && t.hasWater?.toLowerCase() !== "yes") return false;
    if (filter === "coastal"  && !t.habitatTypes?.some(h => h.toLowerCase().includes("coast"))) return false;
    if (filter === "riparian" && !t.habitatTypes?.some(h => h.toLowerCase().includes("riparian"))) return false;
    return true;
  }), [trails, search, filter]);

  const paged   = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", paddingBottom: "80px" }}>

      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: T.bg, borderBottom: `1px solid ${T.border}`,
        padding: "20px 20px 0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.inkLight, marginBottom: "5px" }}>
              EarthEye OC · Atlas
            </div>
            <h1 style={{ fontSize: "20px", fontFamily: "Georgia, serif", fontWeight: "400",
              color: T.ink, lineHeight: 1 }}>
              Trails
            </h1>
          </div>
          <div style={{ fontSize: "11px", color: T.inkLight }}>
            {loading ? "Loading…" : `${filtered.length} of ${trails.length}`}
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: "12px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.inkLight} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trails or jurisdiction…"
            style={{
              width: "100%", paddingLeft: "36px", paddingRight: search ? "36px" : "12px",
              paddingTop: "10px", paddingBottom: "10px",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
              borderRadius: "9px", fontSize: "14px", color: T.ink,
              outline: "none", boxSizing: "border-box"
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%",
              width: "18px", height: "18px", cursor: "pointer", color: T.inkMid,
              fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"
            }}>×</button>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "12px", scrollbarWidth: "none" }}>
          {FILTERS.map(f => (
            <Chip
              key={f.id}
              label={f.label}
              active={f.id === "all" ? filter === "all" : filter === f.id}
              onClick={() => setFilter(f.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 0", gap: "14px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.08)",
              borderTopColor: T.accent,
              animation: "spin 0.8s linear infinite"
            }} />
            <div style={{ fontSize: "12px", color: T.inkLight }}>Loading trails…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "13px", color: T.inkLight, marginBottom: "12px" }}>
              No trails match that filter.
            </div>
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ fontSize: "13px", color: T.accent, background: "none", border: "none", cursor: "pointer" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {paged.map(trail => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onClick={() => {
                  sessionStorage.setItem("trailsScroll", window.scrollY.toString());
                  sessionStorage.setItem("trailsScrollFrom", "trail");
                  navigate(`/trails/${trail.id}`);
                }}
              />
            ))}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => setPage(p => p + 1)} style={{
                  padding: "12px 28px", borderRadius: "100px", cursor: "pointer",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                  fontSize: "13px", color: T.inkMid
                }}>
                  Load more · {filtered.length - paged.length} remaining
                </button>
              </div>
            )}
            {!hasMore && filtered.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "20px",
                fontSize: "11px", color: T.inkFaint }}>
                All {filtered.length} trails
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="trails" />
    </div>
  );
}