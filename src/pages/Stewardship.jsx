import { useState, useEffect, useMemo, useCallback } from "react";
import { Species, Trail } from "@/api/entities";

// ── Constants ────────────────────────────────────────────────────────────────
const GROUPS = [
  "all", "mammal", "bird", "reptile", "amphibian", "fish",
  "insect", "arachnid", "crustacean", "mollusk", "invertebrate",
  "plant", "fungi", "lichen", "algae", "human impact",
];

const GROUP_ICONS = {
  mammal: "🦌", bird: "🦅", reptile: "🦎", amphibian: "🐸", fish: "🐟",
  insect: "🦋", arachnid: "🕷", crustacean: "🦀", mollusk: "🐚",
  invertebrate: "🪱", plant: "🌿", fungi: "🍄", lichen: "🪨",
  algae: "🌊", "human impact": "🏗", all: "🌍",
};

function imageTier(url) {
  if (!url) return { tier: 4, label: "Missing", color: "#E57373" };
  if (url.includes("media.base44.com") || url.includes("base44")) return { tier: 1, label: "Frozen", color: "#81C784" };
  if (url.includes("inaturalist.org") || url.includes("static.inaturalist")) return { tier: 2, label: "iNat", color: "#4A7C59" };
  if (url.includes("wikimedia.org") || url.includes("wikipedia.org")) return { tier: 3, label: "Wiki", color: "#FFD54F" };
  return { tier: 3, label: "Other", color: "#FFB74D" };
}

function detectTrailMismatch(trail) {
  if (!trail?.heroImage) return null;
  const name = (trail.name || "").toLowerCase();
  const hab = (trail.habitatTypes || []).join(" ").toLowerCase();
  const url = trail.heroImage.toLowerCase();
  const isCoastal = /beach|pier|boardwalk|harbor|wetland|lagoon|doheny|bolsa/.test(name + " " + hab);
  const isInland  = /canyon|wilderness|ridge|peak|summit|chaparral|arroyo|creek|mountain/.test(name + " " + hab);
  const imgCoastal = /beach|pier|boardwalk|harbor|bay|coast|reef|wetland|lagoon|doheny|bolsa|newport_pier/.test(url);
  const imgInland  = /canyon|wilderness|ridge|peak|summit|chaparral|forest|oaks|arroyo|creek|santiago|trabuco|saddleback/.test(url);
  if (isInland && imgCoastal) return "⚠️ inland trail — coastal image";
  if (isCoastal && imgInland) return "⚠️ coastal trail — inland image";
  return null;
}

// ── Image preview card ───────────────────────────────────────────────────────
function ImageCard({ src, label, size = 160 }) {
  const [state, setState] = useState("loading");
  useEffect(() => { setState("loading"); }, [src]);
  return (
    <div style={{ width: size, height: size, borderRadius: 12, overflow: "hidden",
      background: "#0a1a0e", border: "1px solid rgba(74,124,89,0.25)",
      position: "relative", flexShrink: 0 }}>
      {src && state !== "error" && (
        <img src={src} alt={label}
          onLoad={() => setState("ok")} onError={() => setState("error")}
          style={{ width: "100%", height: "100%", objectFit: "cover",
            opacity: state === "ok" ? 1 : 0, transition: "opacity 0.4s" }} />
      )}
      {(!src || state === "error") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontSize: 24, opacity: 0.3 }}>📷</span>
          <span style={{ color: "#3D6B4A", fontSize: 9, textAlign: "center", padding: "0 8px" }}>
            {state === "error" ? "Image failed" : "No image"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Inline URL editor ────────────────────────────────────────────────────────
function UrlEditor({ currentUrl, onSave, onCancel, label }) {
  const [draft, setDraft] = useState(currentUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const tier = imageTier(draft);

  const handleSave = async () => {
    if (!draft.trim() || draft === currentUrl) { onCancel(); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onCancel(); }, 900);
  };

  return (
    <div style={{ background: "#0d1f14", border: "1px solid rgba(74,124,89,0.35)",
      borderRadius: 14, padding: 16, marginTop: 8 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
        <ImageCard src={currentUrl} label="Current" size={110} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
            letterSpacing: "0.07em", fontWeight: 700 }}>Current</div>
          {currentUrl ? (
            <div style={{ color: "#4A7C59", fontSize: 10, wordBreak: "break-all",
              lineHeight: 1.5, opacity: 0.8 }}>{currentUrl.slice(0, 80)}…</div>
          ) : (
            <div style={{ color: "#3D5A44", fontSize: 11, fontStyle: "italic" }}>No image set</div>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%",
              background: imageTier(currentUrl).color }} />
            <span style={{ color: imageTier(currentUrl).color, fontSize: 10 }}>
              {imageTier(currentUrl).label}
            </span>
          </div>
        </div>
      </div>

      {/* New URL input */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.07em", fontWeight: 700, marginBottom: 6 }}>New URL</div>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Paste image URL here…"
          style={{ width: "100%", background: "#071209", border: "1px solid rgba(74,124,89,0.35)",
            borderRadius: 8, padding: "8px 10px", color: "#C4DFC8", fontSize: 12,
            fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Preview */}
      {draft && draft !== currentUrl && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
          <ImageCard src={draft} label="Preview" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.07em", fontWeight: 700, marginBottom: 4 }}>Preview</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color }} />
              <span style={{ color: tier.color, fontSize: 10 }}>{tier.label}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving || saved || !draft.trim() || draft === currentUrl}
          style={{ flex: 1, padding: "8px 16px", borderRadius: 8, border: "none",
            background: saved ? "#2D7A3D" : "#4A7C59", color: "#F0E9D6", fontSize: 13,
            fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(74,124,89,0.3)",
            background: "transparent", color: "#7FAF8A", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Tab 1: Species Images ────────────────────────────────────────────────────
function SpeciesTab() {
  const [all, setAll]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [group, setGroup]       = useState("all");
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState(null); // species id
  const [sort, setSort]         = useState("alpha");

  useEffect(() => {
    Species.filter({}).then(data => {
      setAll(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = all;
    if (group !== "all") list = list.filter(s => (s.group || "").toLowerCase() === group);
    if (search.trim()) list = list.filter(s =>
      (s.name || "").toLowerCase().includes(search.toLowerCase()));
    if (sort === "alpha") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "tier") list = [...list].sort((a, b) => imageTier(a.imageUrl).tier - imageTier(b.imageUrl).tier);
    return list;
  }, [all, group, search, sort]);

  const handleSave = useCallback(async (id, url) => {
    await Species.update(id, { imageUrl: url });
    setAll(prev => prev.map(s => s.id === id ? { ...s, imageUrl: url } : s));
  }, []);

  // Tier counts
  const tiers = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    all.forEach(s => { const t = imageTier(s.imageUrl); counts[t.tier]++; });
    return counts;
  }, [all]);

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 48 }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin mx-auto"
        style={{ borderColor: "#4A7C59", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div>
      {/* Tier health bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { tier: 1, label: "Frozen (CDN)", color: "#81C784", count: tiers[1] },
          { tier: 2, label: "iNat",         color: "#4A7C59", count: tiers[2] },
          { tier: 3, label: "Wiki/Other",   color: "#FFD54F", count: tiers[3] },
          { tier: 4, label: "Missing",      color: "#E57373", count: tiers[4] },
        ].map(t => (
          <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20,
            background: `${t.color}18`, border: `1px solid ${t.color}40` }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color }} />
            <span style={{ color: t.color, fontSize: 11, fontWeight: 600 }}>{t.count}</span>
            <span style={{ color: `${t.color}AA`, fontSize: 10 }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search species…"
          style={{ width: "100%", background: "#071209", border: "1px solid rgba(74,124,89,0.25)",
            borderRadius: 8, padding: "8px 12px", color: "#C4DFC8", fontSize: 13,
            outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none" }}>
          {GROUPS.map(g => (
            <button key={g} onClick={() => setGroup(g)}
              style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid",
                borderColor: group === g ? "#4A7C59" : "rgba(74,124,89,0.2)",
                background: group === g ? "rgba(74,124,89,0.25)" : "transparent",
                color: group === g ? "#7FAF8A" : "#3D6B4A", fontSize: 11, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {GROUP_ICONS[g]} {g === "all" ? "All" : g}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[["alpha", "A–Z"], ["tier", "By Image Quality"]].map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)}
              style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid",
                borderColor: sort === v ? "#4A7C59" : "rgba(74,124,89,0.2)",
                background: sort === v ? "rgba(74,124,89,0.2)" : "transparent",
                color: sort === v ? "#7FAF8A" : "#4A6B55", fontSize: 11, cursor: "pointer" }}>
              {l}
            </button>
          ))}
          <span style={{ marginLeft: "auto", color: "#3D6B4A", fontSize: 11, alignSelf: "center" }}>
            {filtered.length} species
          </span>
        </div>
      </div>

      {/* Species list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map(sp => {
          const tier = imageTier(sp.imageUrl);
          const isEditing = editing === sp.id;
          return (
            <div key={sp.id}>
              <button onClick={() => setEditing(isEditing ? null : sp.id)}
                style={{ width: "100%", textAlign: "left", background: isEditing
                  ? "rgba(74,124,89,0.12)" : "rgba(15,27,18,0.6)",
                  border: `1px solid ${isEditing ? "rgba(74,124,89,0.4)" : "rgba(74,124,89,0.12)"}`,
                  borderRadius: isEditing ? "12px 12px 0 0" : 12, padding: "10px 12px",
                  cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Thumbnail */}
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden",
                    background: "#071209", flexShrink: 0, position: "relative" }}>
                    <TinyThumb src={sp.imageUrl} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#C4DFC8", fontSize: 13, fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sp.name}
                    </div>
                    <div style={{ color: "#3D6B4A", fontSize: 10, marginTop: 1 }}>
                      {GROUP_ICONS[sp.group] || "·"} {sp.group || "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color }} />
                    <span style={{ color: tier.color, fontSize: 10 }}>{tier.label}</span>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                      stroke="#4A7C59" strokeWidth={2} style={{ marginLeft: 2,
                        transform: isEditing ? "rotate(90deg)" : "none", transition: "0.2s" }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
              {isEditing && (
                <div style={{ borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                  <UrlEditor
                    currentUrl={sp.imageUrl}
                    label={sp.name}
                    onSave={url => handleSave(sp.id, url)}
                    onCancel={() => setEditing(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tiny thumbnail without state overhead
function TinyThumb({ src }) {
  const [ok, setOk] = useState(false);
  if (!src) return null;
  return (
    <img src={src} alt="" onLoad={() => setOk(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover",
        opacity: ok ? 1 : 0, transition: "opacity 0.3s" }} />
  );
}

// ── Tab 2: Trail Heroes ──────────────────────────────────────────────────────
function TrailsTab() {
  const [trails, setTrails]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [editing, setEditing] = useState(null);
  const [sort, setSort]       = useState("name");

  useEffect(() => {
    Trail.filter({}).then(data => {
      setTrails(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = trails;
    if (search.trim()) list = list.filter(t =>
      (t.name || "").toLowerCase().includes(search.toLowerCase()));
    if (sort === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "mismatch") {
      list = [...list].sort((a, b) => {
        const am = detectTrailMismatch(a) ? 1 : 0;
        const bm = detectTrailMismatch(b) ? 1 : 0;
        return bm - am;
      });
    }
    return list;
  }, [trails, search, sort]);

  const mismatches = useMemo(() => trails.filter(t => detectTrailMismatch(t)).length, [trails]);

  const handleSave = useCallback(async (id, url) => {
    await Trail.update(id, { heroImage: url });
    setTrails(prev => prev.map(t => t.id === id ? { ...t, heroImage: url } : t));
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 48 }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin mx-auto"
        style={{ borderColor: "#4A7C59", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div>
      {/* Health line */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          background: "rgba(74,124,89,0.12)", border: "1px solid rgba(74,124,89,0.3)" }}>
          <span style={{ color: "#7FAF8A", fontSize: 11, fontWeight: 600 }}>{trails.length}</span>
          <span style={{ color: "#5C8A6A", fontSize: 10 }}>trails</span>
        </div>
        {mismatches > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(255,183,77,0.1)", border: "1px solid rgba(255,183,77,0.35)" }}>
            <span style={{ color: "#FFB74D", fontSize: 11, fontWeight: 600 }}>⚠️ {mismatches}</span>
            <span style={{ color: "#CC8800", fontSize: 10 }}>image mismatches</span>
          </div>
        )}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search trails…"
        style={{ width: "100%", background: "#071209", border: "1px solid rgba(74,124,89,0.25)",
          borderRadius: 8, padding: "8px 12px", color: "#C4DFC8", fontSize: 13,
          outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["name", "A–Z"], ["mismatch", "Mismatches First"]].map(([v, l]) => (
          <button key={v} onClick={() => setSort(v)}
            style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid",
              borderColor: sort === v ? "#4A7C59" : "rgba(74,124,89,0.2)",
              background: sort === v ? "rgba(74,124,89,0.2)" : "transparent",
              color: sort === v ? "#7FAF8A" : "#4A6B55", fontSize: 11, cursor: "pointer" }}>
            {l}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: "#3D6B4A", fontSize: 11, alignSelf: "center" }}>
          {filtered.length} trails
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map(trail => {
          const mismatch = detectTrailMismatch(trail);
          const isEditing = editing === trail.id;
          return (
            <div key={trail.id}>
              <button onClick={() => setEditing(isEditing ? null : trail.id)}
                style={{ width: "100%", textAlign: "left",
                  background: isEditing ? "rgba(74,124,89,0.12)" : "rgba(15,27,18,0.6)",
                  border: `1px solid ${isEditing ? "rgba(74,124,89,0.4)" : mismatch ? "rgba(255,183,77,0.3)" : "rgba(74,124,89,0.12)"}`,
                  borderRadius: isEditing ? "12px 12px 0 0" : 12, padding: "10px 12px",
                  cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 56, height: 40, borderRadius: 6, overflow: "hidden",
                    background: "#071209", flexShrink: 0 }}>
                    <TinyThumb src={trail.heroImage} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#C4DFC8", fontSize: 12, fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {trail.name}
                    </div>
                    {mismatch && (
                      <div style={{ color: "#FFB74D", fontSize: 10, marginTop: 1 }}>{mismatch}</div>
                    )}
                    {!mismatch && (
                      <div style={{ color: "#3D6B4A", fontSize: 10, marginTop: 1 }}>
                        {(trail.habitatTypes || []).slice(0, 2).join(" · ")}
                      </div>
                    )}
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke="#4A7C59" strokeWidth={2}
                    style={{ transform: isEditing ? "rotate(90deg)" : "none", transition: "0.2s" }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
              {isEditing && (
                <div style={{ borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                  <UrlEditor
                    currentUrl={trail.heroImage}
                    label={trail.name}
                    onSave={url => handleSave(trail.id, url)}
                    onCancel={() => setEditing(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 3: Health ────────────────────────────────────────────────────────────
function HealthTab() {
  const [species, setSpecies]   = useState([]);
  const [trails, setTrails]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    Promise.all([
      Species.filter({}),
      Trail.filter({}),
    ]).then(([sp, tr]) => {
      setSpecies(Array.isArray(sp) ? sp : []);
      setTrails(Array.isArray(tr) ? tr : []);
      setLoading(false);
    });
  }, []);

  const spTiers = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    species.forEach(s => { counts[imageTier(s.imageUrl).tier]++; });
    return counts;
  }, [species]);

  const trailMismatches = useMemo(() => trails.filter(t => detectTrailMismatch(t)), [trails]);

  const pickSuggestion = () => {
    const candidates = species.filter(s => imageTier(s.imageUrl).tier >= 3);
    if (!candidates.length) { setSuggestion(null); return; }
    setSuggestion(candidates[Math.floor(Math.random() * candidates.length)]);
  };

  const groupBreakdown = useMemo(() => {
    const map = {};
    species.forEach(s => {
      const g = s.group || "unknown";
      if (!map[g]) map[g] = { frozen: 0, inat: 0, wiki: 0, missing: 0, total: 0 };
      const t = imageTier(s.imageUrl);
      map[g].total++;
      if (t.tier === 1) map[g].frozen++;
      else if (t.tier === 2) map[g].inat++;
      else if (t.tier === 3) map[g].wiki++;
      else map[g].missing++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [species]);

  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 48 }}>
      <div className="w-5 h-5 rounded-full border-2 animate-spin mx-auto"
        style={{ borderColor: "#4A7C59", borderTopColor: "transparent" }} />
    </div>
  );

  const totalSp = species.length;
  const frozenPct = totalSp ? Math.round(spTiers[1] / totalSp * 100) : 0;
  const inatPct   = totalSp ? Math.round(spTiers[2] / totalSp * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Atlas snapshot */}
      <div style={{ background: "#0d1f14", border: "1px solid rgba(74,124,89,0.25)",
        borderRadius: 16, padding: 18 }}>
        <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>Atlas Snapshot</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Species", value: totalSp, color: "#7FAF8A" },
            { label: "Trails", value: trails.length, color: "#7FAF8A" },
            { label: "Frozen Images", value: `${spTiers[1]}`, color: "#81C784" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "10px 6px",
              background: "rgba(74,124,89,0.08)", borderRadius: 10 }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: "#4A7C59", fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Image tier breakdown */}
      <div style={{ background: "#0d1f14", border: "1px solid rgba(74,124,89,0.25)",
        borderRadius: 16, padding: 18 }}>
        <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.08em", fontWeight: 700, marginBottom: 14 }}>Image Layer</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { tier: 1, label: "Frozen — Base44 CDN (personal field photos)", color: "#81C784", count: spTiers[1] },
            { tier: 2, label: "iNaturalist — research-grade, stable", color: "#4A7C59", count: spTiers[2] },
            { tier: 3, label: "Wikimedia / Other — display-safe", color: "#FFD54F", count: spTiers[3] },
            { tier: 4, label: "Missing — needs attention", color: "#E57373", count: spTiers[4] },
          ].map(t => (
            <div key={t.tier}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: t.color, fontSize: 11 }}>{t.label}</span>
                <span style={{ color: t.color, fontSize: 12, fontWeight: 700 }}>{t.count}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ height: "100%", borderRadius: 2, background: t.color,
                  width: `${totalSp ? (t.count / totalSp * 100) : 0}%`, transition: "width 0.8s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trail mismatches */}
      {trailMismatches.length > 0 && (
        <div style={{ background: "#1a1200", border: "1px solid rgba(255,183,77,0.3)",
          borderRadius: 16, padding: 16 }}>
          <div style={{ color: "#FFB74D", fontSize: 10, textTransform: "uppercase",
            letterSpacing: "0.08em", fontWeight: 700, marginBottom: 10 }}>
            ⚠️ Trail Image Mismatches — {trailMismatches.length}
          </div>
          {trailMismatches.slice(0, 5).map(t => (
            <div key={t.id} style={{ color: "#CC8800", fontSize: 11, marginBottom: 4,
              paddingLeft: 8, borderLeft: "2px solid rgba(255,183,77,0.4)" }}>
              {t.name} — {detectTrailMismatch(t)}
            </div>
          ))}
          {trailMismatches.length > 5 && (
            <div style={{ color: "#7A5500", fontSize: 10, marginTop: 6 }}>
              + {trailMismatches.length - 5} more → check Trails tab
            </div>
          )}
        </div>
      )}

      {/* Curate today */}
      <div style={{ background: "#0d1f14", border: "1px solid rgba(74,124,89,0.25)",
        borderRadius: 16, padding: 18 }}>
        <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.08em", fontWeight: 700, marginBottom: 10 }}>Curate Today</div>
        <p style={{ color: "#4A6B55", fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
          Pick a species with a Wiki or lower-tier image and upgrade it. One per session keeps the atlas healthy.
        </p>
        <button onClick={pickSuggestion}
          style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(74,124,89,0.4)",
            background: "rgba(74,124,89,0.15)", color: "#7FAF8A", fontSize: 13,
            fontWeight: 600, cursor: "pointer" }}>
          Suggest one →
        </button>
        {suggestion && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10,
            background: "rgba(74,124,89,0.08)", border: "1px solid rgba(74,124,89,0.2)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden",
                background: "#071209", flexShrink: 0 }}>
                <TinyThumb src={suggestion.imageUrl} />
              </div>
              <div>
                <div style={{ color: "#C4DFC8", fontSize: 14, fontWeight: 700 }}>{suggestion.name}</div>
                <div style={{ color: "#5C8A6A", fontSize: 11, marginTop: 2 }}>
                  {GROUP_ICONS[suggestion.group]} {suggestion.group} · {imageTier(suggestion.imageUrl).label}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group breakdown */}
      <div style={{ background: "#0d1f14", border: "1px solid rgba(74,124,89,0.25)",
        borderRadius: 16, padding: 18 }}>
        <div style={{ color: "#5C8A6A", fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>By Group</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groupBreakdown.map(([g, stats]) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, width: 18 }}>{GROUP_ICONS[g] || "·"}</span>
              <span style={{ color: "#7FAF8A", fontSize: 11, width: 100, flexShrink: 0 }}>{g}</span>
              <div style={{ flex: 1, display: "flex", gap: 1, height: 6, borderRadius: 3,
                overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                {stats.frozen > 0 && (
                  <div style={{ flex: stats.frozen, background: "#81C784" }} />
                )}
                {stats.inat > 0 && (
                  <div style={{ flex: stats.inat, background: "#4A7C59" }} />
                )}
                {stats.wiki > 0 && (
                  <div style={{ flex: stats.wiki, background: "#FFD54F" }} />
                )}
                {stats.missing > 0 && (
                  <div style={{ flex: stats.missing, background: "#E57373" }} />
                )}
              </div>
              <span style={{ color: "#3D6B4A", fontSize: 10, width: 24, textAlign: "right" }}>
                {stats.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Stewardship() {
  const [tab, setTab] = useState("health");

  const TABS = [
    { id: "health",   label: "Health",        icon: "📊" },
    { id: "species",  label: "Species Images", icon: "🔬" },
    { id: "trails",   label: "Trail Heroes",   icon: "🏞" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0F1B12", color: "#C4DFC8" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 48px" }}>

        {/* Header */}
        <div style={{ paddingTop: 32, paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4A7C59" }} />
            <span style={{ color: "#4A7C59", fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em" }}>
              EarthEye OC
            </span>
          </div>
          <h1 style={{ color: "#F0E9D6", fontSize: 28, fontWeight: 800,
            letterSpacing: "-0.03em", margin: 0 }}>Stewardship</h1>
          <p style={{ color: "#4A7C59", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
            Living atlas maintenance — species images, trail heroes, image health.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20,
          borderBottom: "1px solid rgba(74,124,89,0.15)", paddingBottom: 12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid",
                borderColor: tab === t.id ? "#4A7C59" : "transparent",
                background: tab === t.id ? "rgba(74,124,89,0.2)" : "transparent",
                color: tab === t.id ? "#7FAF8A" : "#3D6B4A",
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "health"  && <HealthTab />}
        {tab === "species" && <SpeciesTab />}
        {tab === "trails"  && <TrailsTab />}
      </div>
    </div>
  );
}
