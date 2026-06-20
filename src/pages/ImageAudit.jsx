import { useState, useEffect, useCallback } from "react";
import { Species } from "../api/entities";

const HIGH_RISK_GROUPS = ["mammal", "reptile", "bird", "arachnid", "fish", "invertebrate"];

const VIOLATION_TYPES = [
  { id: "hands", label: "🖐 Hands / Holding", color: "#ef4444" },
  { id: "captive", label: "🏛 Captive / Zoo / Rehab", color: "#f97316" },
  { id: "staged", label: "🎭 Staged / Unnatural", color: "#eab308" },
  { id: "gore", label: "💀 Gore / Predation", color: "#dc2626" },
  { id: "wrong_species", label: "❓ Wrong Species", color: "#8b5cf6" },
  { id: "non_oc", label: "🌍 Non-CA Aesthetic", color: "#6366f1" },
  { id: "poor_quality", label: "📷 Poor Quality", color: "#64748b" },
];

async function fetchAllSpecies() {
  const pageSize = 100;
  let all = [];
  let skip = 0;
  let hasMore = true;
  while (hasMore) {
    const page = await Species.filter({}, { limit: pageSize, skip });
    all = all.concat(page);
    hasMore = page.length === pageSize;
    skip += pageSize;
  }
  return all;
}

export default function ImageAudit() {
  const [species, setSpecies] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flagged, setFlagged] = useState({});
  const [approved, setApproved] = useState({});
  const [filterGroup, setFilterGroup] = useState("all");
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadStatus("Fetching species...");
      try {
        const all = await fetchAllSpecies();
        setLoadStatus(`Loaded ${all.length} — sorting by risk...`);
        const sorted = all.sort((a, b) => {
          const aRisk = HIGH_RISK_GROUPS.includes(a.group) ? 0 : 1;
          const bRisk = HIGH_RISK_GROUPS.includes(b.group) ? 0 : 1;
          if (aRisk !== bRisk) return aRisk - bRisk;
          // Within risk tier, sort by group then name
          const gCmp = (a.group || "").localeCompare(b.group || "");
          if (gCmp !== 0) return gCmp;
          return (a.name || "").localeCompare(b.name || "");
        });
        setSpecies(sorted);
        setFiltered(sorted);
        setLoadStatus("");
      } catch (e) {
        setLoadStatus("Error: " + e.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Recompute filtered list whenever filters change
  useEffect(() => {
    let list = species;
    if (filterGroup !== "all") {
      list = list.filter(s => s.group === filterGroup);
    }
    if (showOnlyUnreviewed) {
      list = list.filter(s => !approved[s.id] && !(flagged[s.id] && Object.values(flagged[s.id]).some(v => v)));
    }
    setFiltered(list);
    setCurrentIdx(0);
    setImgLoaded(false);
    setImgError(false);
  }, [filterGroup, showOnlyUnreviewed, species]);

  const current = filtered[currentIdx];

  const isFlagged = (s) => s && flagged[s.id] && Object.values(flagged[s.id]).some(v => v);
  const isApproved = (s) => s && !!approved[s.id];

  const handleFlag = (violationType) => {
    if (!current) return;
    setFlagged(prev => ({
      ...prev,
      [current.id]: { ...(prev[current.id] || {}), [violationType]: !(prev[current.id]?.[violationType]) }
    }));
  };

  const handleApprove = () => {
    if (!current) return;
    setApproved(prev => ({ ...prev, [current.id]: true }));
    setFlagged(prev => { const n = { ...prev }; delete n[current.id]; return n; });
    advance();
  };

  const advance = () => {
    setImgLoaded(false); setImgError(false);
    if (currentIdx < filtered.length - 1) setCurrentIdx(i => i + 1);
  };
  const goNext = () => { setImgLoaded(false); setImgError(false); if (currentIdx < filtered.length - 1) setCurrentIdx(i => i + 1); };
  const goPrev = () => { setImgLoaded(false); setImgError(false); if (currentIdx > 0) setCurrentIdx(i => i - 1); };

  // Jump to next unreviewed
  const jumpNextUnreviewed = () => {
    for (let i = currentIdx + 1; i < filtered.length; i++) {
      const s = filtered[i];
      if (!approved[s.id] && !isFlagged(s)) {
        setCurrentIdx(i); setImgLoaded(false); setImgError(false); return;
      }
    }
  };

  const totalFlagged = species.filter(s => isFlagged(s)).length;
  const totalApproved = Object.keys(approved).length;
  const totalReviewed = totalFlagged + totalApproved;
  const totalRemaining = species.length - totalReviewed;
  const filteredRemaining = filtered.filter(s => !approved[s.id] && !isFlagged(s)).length;

  const flaggedList = species.filter(s => isFlagged(s));

  const exportFlagged = () => {
    const data = flaggedList.map(s => ({
      name: s.name, group: s.group, imageUrl: s.imageUrl,
      violations: Object.keys(flagged[s.id] || {}).filter(k => flagged[s.id][k]),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "eartheye_flagged.json"; a.click();
  };

  const hasImage = current?.imageUrl?.startsWith("http");
  const isEmoji = current?.imageUrl && !current.imageUrl.startsWith("http");
  const currentIsFlagged = isFlagged(current);
  const currentIsApproved = isApproved(current);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"system-ui", gap:16 }}>
      <div style={{ fontSize:48 }}>🔍</div>
      <div style={{ fontSize:18, color:"#34d399" }}>Loading EarthEye Atlas...</div>
      <div style={{ fontSize:14, color:"#64748b" }}>{loadStatus}</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#f1f5f9", fontFamily:"system-ui", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:"#111827", borderBottom:"1px solid #1f2937", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18, fontWeight:700, color:"#34d399" }}>EarthEye OC</span>
          <span style={{ fontSize:12, color:"#64748b" }}>Values Audit · {species.length} species</span>
        </div>

        {/* Global counters */}
        <div style={{ display:"flex", gap:14, fontSize:13, alignItems:"center" }}>
          <span style={{ color:"#34d399", fontWeight:600 }}>✅ {totalApproved} approved</span>
          <span style={{ color:"#ef4444", fontWeight:600 }}>🚩 {totalFlagged} flagged</span>
          <span style={{ color:"#f59e0b", fontWeight:600 }}>⏳ {totalRemaining} remaining</span>
          <div style={{ background:"#1f2937", borderRadius:10, height:6, width:120, overflow:"hidden" }}>
            <div style={{ width:`${(totalReviewed/Math.max(1,species.length))*100}%`, background:"#34d399", height:"100%", transition:"width 0.3s" }} />
          </div>
          <span style={{ color:"#475569", fontSize:11 }}>{Math.round((totalReviewed/Math.max(1,species.length))*100)}%</span>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          {totalFlagged > 0 && (
            <button onClick={exportFlagged} style={{ background:"#92400e", border:"1px solid #f59e0b", color:"#fbbf24", padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:600 }}>
              📥 Export {totalFlagged} Flagged
            </button>
          )}
          <button onClick={() => setShowFlagged(!showFlagged)} style={{ background: showFlagged ? "#7f1d1d" : "#1f2937", border:"1px solid #374151", color:"#fff", padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12 }}>
            {showFlagged ? "← Back to Audit" : `🚩 Review Flagged (${totalFlagged})`}
          </button>
        </div>
      </div>

      {/* Filter + Toggle Bar */}
      <div style={{ background:"#0f172a", borderBottom:"1px solid #1f2937", padding:"8px 16px", display:"flex", gap:6, alignItems:"center", overflowX:"auto" }}>
        {/* Show only unreviewed toggle */}
        <button
          onClick={() => setShowOnlyUnreviewed(v => !v)}
          style={{
            background: showOnlyUnreviewed ? "#1d4ed8" : "#1f2937",
            border:`1px solid ${showOnlyUnreviewed ? "#3b82f6" : "#374151"}`,
            color: showOnlyUnreviewed ? "#fff" : "#94a3b8",
            padding:"3px 10px", borderRadius:20, cursor:"pointer", fontSize:12, whiteSpace:"nowrap", flexShrink:0, fontWeight: showOnlyUnreviewed ? 700 : 400
          }}
        >
          {showOnlyUnreviewed ? "👁 Unreviewed only" : "👁 Show all"}
        </button>
        <div style={{ width:1, height:18, background:"#1f2937", flexShrink:0 }} />
        {["all","mammal","bird","reptile","fish","amphibian","insect","arachnid","invertebrate","crustacean","mollusk","plant","fungi","lichen","algae","human impact"].map(g => (
          <button key={g} onClick={() => setFilterGroup(g)} style={{
            background: filterGroup===g ? "#059669" : "#1f2937",
            border:`1px solid ${filterGroup===g ? "#34d399" : "#374151"}`,
            color: filterGroup===g ? "#fff" : "#94a3b8",
            padding:"3px 10px", borderRadius:20, cursor:"pointer", fontSize:12, whiteSpace:"nowrap", flexShrink:0
          }}>{g}</button>
        ))}
      </div>

      {!showFlagged ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:16, gap:12 }}>
          {current ? (
            <>
              {/* Progress bar (filtered) */}
              <div style={{ width:"100%", maxWidth:760, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, background:"#1f2937", borderRadius:4, height:3 }}>
                  <div style={{ width:`${((currentIdx+1)/Math.max(1,filtered.length))*100}%`, background:"#34d399", height:3, borderRadius:4, transition:"width 0.2s" }} />
                </div>
                <span style={{ fontSize:11, color:"#475569", whiteSpace:"nowrap" }}>
                  {currentIdx+1} / {filtered.length} shown · {filteredRemaining} unreviewed
                </span>
              </div>

              {/* Card */}
              <div style={{ width:"100%", maxWidth:760, background:"#111827", borderRadius:12, overflow:"hidden", border:`2px solid ${currentIsFlagged ? "#ef4444" : currentIsApproved ? "#34d399" : "#1f2937"}` }}>

                {/* Image */}
                <div style={{ position:"relative", background:"#000", width:"100%", paddingTop:"56.25%", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {hasImage ? (
                      <>
                        {!imgLoaded && !imgError && <div style={{ color:"#475569", fontSize:14 }}>Loading...</div>}
                        <img
                          key={current.id + current.imageUrl}
                          src={current.imageUrl}
                          alt={current.name}
                          onLoad={() => setImgLoaded(true)}
                          onError={() => { setImgError(true); setImgLoaded(true); }}
                          style={{ width:"100%", height:"100%", objectFit:"contain", display: imgLoaded && !imgError ? "block" : "none" }}
                        />
                        {imgError && (
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontSize:40 }}>🚫</div>
                            <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>Failed to load</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:72 }}>{isEmoji ? current.imageUrl : "🚫"}</div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>{!current.imageUrl ? "No image" : "Non-HTTP URL"}</div>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  {(currentIsApproved || currentIsFlagged) && (
                    <div style={{ position:"absolute", top:10, right:10, background: currentIsApproved ? "#059669" : "#dc2626", color:"#fff", padding:"3px 10px", borderRadius:16, fontSize:12, fontWeight:700 }}>
                      {currentIsApproved ? "✅ APPROVED" : "🚩 FLAGGED"}
                    </div>
                  )}

                  {/* Group badge */}
                  <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,0.65)", color:"#94a3b8", padding:"3px 8px", borderRadius:8, fontSize:11 }}>
                    {current.group || "unknown"}
                  </div>
                </div>

                {/* Species name + URL */}
                <div style={{ padding:"10px 14px", borderBottom:"1px solid #1f2937", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:18 }}>{current.name}</div>
                    <div style={{ color:"#334155", fontSize:11, marginTop:3, wordBreak:"break-all" }}>
                      {current.imageUrl?.substring(0, 100)}{current.imageUrl?.length > 100 ? "…" : ""}
                    </div>
                  </div>
                  <button onClick={jumpNextUnreviewed} style={{ flexShrink:0, background:"#1f2937", border:"1px solid #374151", color:"#64748b", padding:"4px 10px", borderRadius:6, cursor:"pointer", fontSize:11, whiteSpace:"nowrap" }}>
                    ⏭ Next unreviewed
                  </button>
                </div>

                {/* Violation Flags */}
                <div style={{ padding:"10px 14px", borderBottom:"1px solid #1f2937" }}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600 }}>Flag Violations</div>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {VIOLATION_TYPES.map(v => {
                      const active = !!flagged[current.id]?.[v.id];
                      return (
                        <button key={v.id} onClick={() => handleFlag(v.id)} style={{
                          background: active ? v.color : "#1f2937",
                          border:`1px solid ${active ? v.color : "#374151"}`,
                          color:"#fff", padding:"6px 12px", borderRadius:8,
                          cursor:"pointer", fontSize:12, fontWeight: active ? 700 : 400,
                          transition:"all 0.12s", transform: active ? "scale(1.04)" : "scale(1)"
                        }}>{v.label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding:"10px 14px", display:"flex", gap:10 }}>
                  <button onClick={goPrev} disabled={currentIdx===0}
                    style={{ background:"#1f2937", border:"1px solid #374151", color: currentIdx===0 ? "#374151" : "#94a3b8", padding:"8px 16px", borderRadius:8, cursor: currentIdx===0 ? "not-allowed" : "pointer", fontSize:14 }}>
                    ← Prev
                  </button>
                  <button onClick={handleApprove}
                    style={{ flex:1, background:"#059669", border:"none", color:"#fff", padding:"9px", borderRadius:8, cursor:"pointer", fontSize:15, fontWeight:700, letterSpacing:"0.3px" }}>
                    ✅ Approve & Next
                  </button>
                  <button onClick={goNext} disabled={currentIdx===filtered.length-1}
                    style={{ background:"#1f2937", border:"1px solid #374151", color: currentIdx===filtered.length-1 ? "#374151" : "#94a3b8", padding:"8px 16px", borderRadius:8, cursor: currentIdx===filtered.length-1 ? "not-allowed" : "pointer", fontSize:14 }}>
                    Skip →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:60, color:"#64748b" }}>
              <div style={{ fontSize:56 }}>🎉</div>
              <div style={{ fontSize:22, marginTop:16, color:"#f1f5f9" }}>All species reviewed!</div>
              <div style={{ fontSize:14, marginTop:8 }}>🚩 {totalFlagged} flagged · ✅ {totalApproved} approved</div>
              {totalFlagged > 0 && (
                <button onClick={exportFlagged} style={{ marginTop:24, background:"#f59e0b", border:"none", color:"#000", padding:"12px 28px", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:700 }}>
                  📥 Export Flagged List
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Flagged Grid */
        <div style={{ flex:1, padding:16 }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
              <h2 style={{ color:"#ef4444", margin:0 }}>🚩 Flagged ({flaggedList.length})</h2>
              {flaggedList.length > 0 && (
                <button onClick={exportFlagged} style={{ background:"#92400e", border:"1px solid #f59e0b", color:"#fbbf24", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700 }}>
                  📥 Export JSON
                </button>
              )}
            </div>
            {flaggedList.length === 0 ? (
              <div style={{ color:"#64748b", textAlign:"center", padding:60 }}>No flags yet — run the audit first.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
                {flaggedList.map(s => (
                  <div key={s.id} style={{ background:"#111827", border:"2px solid #ef4444", borderRadius:10, overflow:"hidden" }}>
                    <div style={{ aspectRatio:"4/3", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                      {s.imageUrl?.startsWith("http") ? (
                        <img src={s.imageUrl} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <span style={{ fontSize:36 }}>{s.imageUrl || "🚫"}</span>
                      )}
                    </div>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                      <div style={{ color:"#64748b", fontSize:11, marginTop:1 }}>{s.group}</div>
                      <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:3 }}>
                        {Object.entries(flagged[s.id]||{}).filter(([,v])=>v).map(([k]) => {
                          const vt = VIOLATION_TYPES.find(v=>v.id===k);
                          return <span key={k} style={{ background:vt?.color||"#374151", color:"#fff", fontSize:9, padding:"2px 5px", borderRadius:4 }}>{vt?.label||k}</span>;
                        })}
                      </div>
                      <button onClick={() => {
                        const idx = species.findIndex(x => x.id === s.id);
                        if (idx >= 0) { setFilterGroup("all"); setShowOnlyUnreviewed(false); setCurrentIdx(idx); setShowFlagged(false); setImgLoaded(false); setImgError(false); }
                      }} style={{ marginTop:7, width:"100%", background:"#1f2937", border:"1px solid #374151", color:"#94a3b8", padding:"5px", borderRadius:6, cursor:"pointer", fontSize:11 }}>
                        Edit →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
