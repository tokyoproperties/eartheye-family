import { useState, useEffect, useMemo } from "react";
import { Trail, Species } from "@/api/entities";
import { Link } from "react-router-dom";

// ── Duplicate detection via URL string hash ──────────────────────────────────
function simpleHash(str) {
  if (!str) return "null";
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(Math.abs(h));
}

// ── Coastal/inland mismatch detection ────────────────────────────────────────
const COASTAL_KEYWORDS = ["beach", "pier", "boardwalk", "harbor", "bay", "coast", "reef", "wetland", "lagoon", "doheny", "bolsa", "newport_pier", "Newport_Pier", "Huntington_Beach_pier", "Doheny_State_Beach", "Dana_Point"];
const INLAND_KEYWORDS  = ["canyon", "wilderness", "ridge", "peak", "summit", "chaparral", "forest", "oaks", "arroyo", "creek", "santiago", "trabuco", "saddleback", "limestone", "chino_hills"];

function detectMismatch(trail) {
  if (!trail.heroImage) return null;
  const url = trail.heroImage.toLowerCase();
  const name = (trail.name || "").toLowerCase();
  const habitats = (trail.habitatTypes || []).map(h => h.toLowerCase()).join(" ");
  const combined = name + " " + habitats;

  const trailIsCoastal = /beach|pier|boardwalk|harbor|bay|coast|reef|wetland|lagoon/.test(combined);
  const trailIsInland = /canyon|wilderness|ridge|peak|summit|chaparral|forest|oaks|arroyo|creek|mountain/.test(combined);

  const imageIsCoastal = COASTAL_KEYWORDS.some(k => trail.heroImage.includes(k));
  const imageIsInland  = INLAND_KEYWORDS.some(k => trail.heroImage.toLowerCase().includes(k));

  if (trailIsInland && imageIsCoastal) return "⚠️ inland trail — coastal image";
  if (trailIsCoastal && imageIsInland) return "⚠️ coastal trail — inland image";
  return null;
}

// ── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "name",       label: "Trail Name" },
  { value: "duplicates", label: "Duplicates First" },
  { value: "jurisdiction", label: "Jurisdiction" },
  { value: "species",    label: "Species Count ↓" },
  { value: "difficulty", label: "Difficulty" },
  { value: "length",     label: "Length ↓" },
];

const FILTER_OPTIONS = [
  { value: "all",       label: "All Trails" },
  { value: "missing",   label: "Missing Image" },
  { value: "duplicate", label: "Duplicate Image" },
  { value: "mismatch",  label: "Suspected Mismatch" },
];

export default function TrailAudit() {
  const [trails, setTrails]         = useState([]);
  const [speciesCounts, setSpeciesCounts] = useState({});
  const [loading, setLoading]       = useState(true);
  const [sort, setSort]             = useState("duplicates");
  const [filter, setFilter]         = useState("all");
  const [page, setPage]             = useState(0);
  const PER_PAGE = 30;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const batch = await Trail.filter({});
        const all = Array.isArray(batch) ? batch : [];
        setTrails(all);

        // Count species per trail
        const allSpecies = await Species.filter({});
        const counts = {};
        for (const sp of (Array.isArray(allSpecies) ? allSpecies : [])) {
          for (const tid of (sp.trail || [])) {
            counts[tid] = (counts[tid] || 0) + 1;
          }
        }
        setSpeciesCounts(counts);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Compute duplicate map ─────────────────────────────────────────────────
  const dupeMap = useMemo(() => {
    const freq = {};
    for (const t of trails) {
      const h = simpleHash(t.heroImage);
      if (!freq[h]) freq[h] = [];
      freq[h].push(t.id);
    }
    // Only flag hashes shared by 2+ trails
    const dupes = {};
    for (const [h, ids] of Object.entries(freq)) {
      if (ids.length >= 2) {
        for (const id of ids) dupes[id] = ids.length;
      }
    }
    return dupes;
  }, [trails]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...trails];
    if (filter === "missing")   list = list.filter(t => !t.heroImage);
    if (filter === "duplicate") list = list.filter(t => dupeMap[t.id]);
    if (filter === "mismatch")  list = list.filter(t => detectMismatch(t));
    return list;
  }, [trails, filter, dupeMap]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "name")       list.sort((a,b) => (a.name||"").localeCompare(b.name||""));
    if (sort === "duplicates") list.sort((a,b) => (dupeMap[b.id]||0) - (dupeMap[a.id]||0));
    if (sort === "jurisdiction") list.sort((a,b) => (a.jurisdiction||"").localeCompare(b.jurisdiction||""));
    if (sort === "species")    list.sort((a,b) => (speciesCounts[b.id]||0) - (speciesCounts[a.id]||0));
    if (sort === "difficulty") list.sort((a,b) => (a.difficulty||"").localeCompare(b.difficulty||""));
    if (sort === "length")     list.sort((a,b) => (b.distanceMiles||0) - (a.distanceMiles||0));
    return list;
  }, [filtered, sort, dupeMap, speciesCounts]);

  const paginated = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const missing   = trails.filter(t => !t.heroImage).length;
    const dupeCount = Object.keys(dupeMap).length;
    const mismatch  = trails.filter(t => detectMismatch(t)).length;
    return { total: trails.length, missing, dupeCount, mismatch };
  }, [trails, dupeMap]);

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: "#080F09", color: "#C4DFC8", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span style={{ fontSize: "22px" }}>🗺️</span>
          <h1 style={{ color: "#E8F5E2", fontSize: "20px", fontWeight: "700" }}>Trail Hero Image Audit</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(74,124,89,0.25)", color: "#7FAF8A", border: "1px solid rgba(74,124,89,0.4)" }}>
            {stats.total} trails
          </span>
        </div>
        <p style={{ color: "#5C8A6A", fontSize: "13px" }}>
          Detect duplicate, missing, and mismatched hero images across all 111 trails.
        </p>
      </div>

      {/* Stats row */}
      <div className="max-w-6xl mx-auto grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Trails", value: stats.total, color: "#7FAF8A", icon: "🗺️" },
          { label: "Missing Image", value: stats.missing, color: stats.missing > 0 ? "#D4A898" : "#7FAF8A", icon: "❌" },
          { label: "Duplicate Image", value: stats.dupeCount, color: stats.dupeCount > 0 ? "#E8C56A" : "#7FAF8A", icon: "♻️" },
          { label: "Suspected Mismatch", value: stats.mismatch, color: stats.mismatch > 0 ? "#D4A898" : "#7FAF8A", icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.15)" }}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: "22px", fontWeight: "700" }}>{s.value}</div>
            <div style={{ color: "#5C8A6A", fontSize: "11px", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto flex flex-wrap gap-2 mb-5">
        {/* Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(f => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === f.value ? "rgba(74,124,89,0.35)" : "rgba(74,124,89,0.1)",
                color: filter === f.value ? "#C4DFC8" : "#5C8A6A",
                border: filter === f.value ? "1px solid rgba(74,124,89,0.6)" : "1px solid rgba(74,124,89,0.15)"
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "#0F2218", color: "#7FAF8A", border: "1px solid rgba(74,124,89,0.3)", outline: "none" }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div className="max-w-6xl mx-auto mb-3">
        <span style={{ color: "#5C8A6A", fontSize: "12px" }}>
          Showing {paginated.length} of {sorted.length} trails
          {filter !== "all" ? ` (filtered: ${FILTER_OPTIONS.find(f=>f.value===filter)?.label})` : ""}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-6xl mx-auto flex items-center gap-3 py-12 justify-center">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "#4A7C59", borderTopColor: "transparent" }} />
          <span style={{ color: "#5C8A6A", fontSize: "13px" }}>Loading 111 trails…</span>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="max-w-6xl mx-auto grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {paginated.map(trail => {
            const dupeCount = dupeMap[trail.id];
            const mismatch  = detectMismatch(trail);
            const spCount   = speciesCounts[trail.id] || 0;
            const hasImage  = !!trail.heroImage;

            return (
              <div key={trail.id} className="rounded-xl overflow-hidden"
                style={{
                  background: "#0F2218",
                  border: dupeCount ? "1px solid rgba(232,197,106,0.5)"
                        : mismatch  ? "1px solid rgba(212,168,152,0.5)"
                        : !hasImage ? "1px solid rgba(212,168,152,0.3)"
                        : "1px solid rgba(127,175,138,0.2)"
                }}>

                {/* Hero image */}
                <div className="relative w-full" style={{ height: "140px", background: "#0a1a0f" }}>
                  {hasImage ? (
                    <img src={trail.heroImage} alt={trail.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: "32px", opacity: 0.3 }}>🗺️</span>
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {dupeCount && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(232,197,106,0.9)", color: "#1a1200" }}>
                        ♻️ {dupeCount}× duplicate
                      </span>
                    )}
                    {mismatch && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(212,168,152,0.9)", color: "#1a0800" }}>
                        {mismatch}
                      </span>
                    )}
                    {!hasImage && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(212,168,152,0.9)", color: "#1a0800" }}>
                        ❌ no image
                      </span>
                    )}
                  </div>

                  {/* Species count badge */}
                  {spCount > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                          color: "#7FAF8A", border: "1px solid rgba(127,175,138,0.3)" }}>
                        🌿 {spCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div style={{ color: "#E8F5E2", fontSize: "13px", fontWeight: "600",
                    lineHeight: "1.3", marginBottom: "4px" }}>
                    {trail.name}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {trail.jurisdiction && (
                      <span className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "rgba(74,124,89,0.15)", color: "#5C8A6A" }}>
                        {trail.jurisdiction}
                      </span>
                    )}
                    {trail.difficulty && (
                      <span className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "rgba(74,124,89,0.15)", color: "#5C8A6A" }}>
                        {trail.difficulty}
                      </span>
                    )}
                    {trail.distanceMiles && (
                      <span className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "rgba(74,124,89,0.15)", color: "#5C8A6A" }}>
                        {trail.distanceMiles} mi
                      </span>
                    )}
                    {trail.elevationGain && (
                      <span className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "rgba(74,124,89,0.15)", color: "#5C8A6A" }}>
                        ↑ {trail.elevationGain} ft
                      </span>
                    )}
                  </div>

                  {/* Habitats */}
                  {(trail.habitatTypes || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(trail.habitatTypes || []).slice(0, 3).map((h, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: "rgba(127,175,138,0.1)", color: "#7FAF8A",
                            border: "1px solid rgba(127,175,138,0.2)" }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Image URL snippet */}
                  {hasImage && (
                    <div className="mb-3 rounded p-1.5"
                      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(127,175,138,0.1)" }}>
                      <span style={{ color: "#3d6e4d", fontSize: "10px", fontFamily: "monospace",
                        wordBreak: "break-all", lineHeight: "1.4",
                        display: "block", maxHeight: "36px", overflow: "hidden" }}>
                        {trail.heroImage.split("/").slice(-1)[0].replace(/1280px-/, "")}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/trails/${trail.id}`}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-all"
                      style={{ background: "rgba(74,124,89,0.2)", color: "#7FAF8A",
                        border: "1px solid rgba(74,124,89,0.3)", textDecoration: "none" }}>
                      Open Trail →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(74,124,89,0.2)", color: page===0?"#3d6e4d":"#7FAF8A",
              border: "1px solid rgba(74,124,89,0.3)" }}>
            ← Prev
          </button>
          <span style={{ color: "#5C8A6A", fontSize: "13px" }}>
            Page {page + 1} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(74,124,89,0.2)", color: page===totalPages-1?"#3d6e4d":"#7FAF8A",
              border: "1px solid rgba(74,124,89,0.3)" }}>
            Next →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 pt-4"
        style={{ borderTop: "1px solid rgba(127,175,138,0.1)" }}>
        <p style={{ color: "#3d6e4d", fontSize: "11px", textAlign: "center" }}>
          TrailAudit · EarthEye OC · Duplicate detection via URL hash · Mismatch detection via trail name + habitat keywords
        </p>
      </div>
    </div>
  );
}
