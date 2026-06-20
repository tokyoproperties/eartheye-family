import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Settings engine (localStorage-backed) ─────────────────────────────────────
const SETTINGS_KEY = "ee_settings_v1";

export function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { kidsMode: false, eldersMode: false };
  } catch { return { kidsMode: false, eldersMode: false }; }
}

export function writeSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState(readSettings);

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    writeSettings(next);
  }

  return { settings, toggle };
}

// Keys to wipe on full reset
const RESET_KEYS = ["ee_journal_v1", "ee_yearbooks", "ee_night_mode"];

export default function Settings() {
  const navigate = useNavigate();
  const { settings, toggle } = useSettings();
  const [resetStep,    setResetStep]    = useState(0); // 0=idle, 1=confirm, 2=resetting
  const [resetDone,    setResetDone]    = useState(false);

  function handleReset() {
    if (resetStep === 0) { setResetStep(1); return; }
    if (resetStep === 1) {
      setResetStep(2);
      setTimeout(() => {
        RESET_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
        setResetDone(true);
        setResetStep(0);
        setTimeout(() => navigate("/"), 1200);
      }, 800);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 md:max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Atlas Settings
          </span>
        </div>
        <h1 className="font-bold"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          ⚙️ Settings
        </h1>
      </div>

      {/* ── Kids Mode ── */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
          boxShadow:"0 1px 6px rgba(28,58,42,0.04)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color:"#1C3A2A", fontSize:"15px", fontWeight:"700",
              marginBottom:"4px" }}>🐣 Kids Mode</div>
            <div style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.6",
              maxWidth:"280px" }}>
              Larger text, simpler cards, big icons, one fact per species. For young explorers.
            </div>
          </div>
          <button onClick={() => toggle("kidsMode")}
            className="flex-shrink-0 relative rounded-full transition-all"
            style={{
              width:"44px", height:"24px",
              background: settings.kidsMode ? "#4A7C59" : "#D4C9B0",
              border:"none", cursor:"pointer",
            }}>
            <span style={{
              position:"absolute", top:"2px",
              left: settings.kidsMode ? "22px" : "2px",
              width:"20px", height:"20px", background:"rgba(255,255,255,0.90)",
              borderRadius:"50%", transition:"left 0.2s",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
              display:"block",
            }} />
          </button>
        </div>
        {settings.kidsMode && (
          <div className="mt-3 px-3 py-2 rounded-xl"
            style={{ background:"rgba(122,184,122,0.08)", border:"1px solid rgba(122,184,122,0.20)" }}>
            <div style={{ color:"#2D5A3D", fontSize:"12px" }}>
              Kids Mode is active — simplified view across all surfaces.
            </div>
          </div>
        )}
      </div>

      {/* ── Elders Mode ── */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
          boxShadow:"0 1px 6px rgba(28,58,42,0.04)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color:"#1C3A2A", fontSize:"15px", fontWeight:"700",
              marginBottom:"4px" }}>🌿 Elders Mode</div>
            <div style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.6",
              maxWidth:"280px" }}>
              Extra-large text, high contrast, larger tap targets, simplified navigation. Designed for clarity.
            </div>
          </div>
          <button onClick={() => toggle("eldersMode")}
            className="flex-shrink-0 relative rounded-full transition-all"
            style={{
              width:"44px", height:"24px",
              background: settings.eldersMode ? "#4A7C59" : "#D4C9B0",
              border:"none", cursor:"pointer",
            }}>
            <span style={{
              position:"absolute", top:"2px",
              left: settings.eldersMode ? "22px" : "2px",
              width:"20px", height:"20px", background:"rgba(255,255,255,0.90)",
              borderRadius:"50%", transition:"left 0.2s",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
              display:"block",
            }} />
          </button>
        </div>
        {settings.eldersMode && (
          <div className="mt-3 px-3 py-2 rounded-xl"
            style={{ background:"rgba(122,184,122,0.08)", border:"1px solid rgba(122,184,122,0.20)" }}>
            <div style={{ color:"#2D5A3D", fontSize:"12px" }}>
              Elders Mode is active — high-accessibility view across all surfaces.
            </div>
          </div>
        )}
      </div>

      {/* ── Links ── */}
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
        {[
          { label:"Atlas Constitution", icon:"📜", path:"/constitution",
            note:"How this atlas is built and what it promises you" },
          { label:"Atlas Core Blueprint", icon:"🗺", path:"/core",
            note:"The six engines that power this atlas" },
          { label:"Watershed Story", icon:"🌊", path:"/WatershedStory",
            note:"Santiago Peak → Pacific in four chapters" },
        ].map((link, i, arr) => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className="w-full text-left px-5 py-4 transition-all hover:opacity-80"
            style={{ background:"transparent", border:"none", cursor:"pointer",
              borderBottom: i < arr.length - 1 ? "1px solid #F0EDE6" : "none" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span style={{ fontSize:"18px" }}>{link.icon}</span>
                <div>
                  <div style={{ color:"#1C3A2A", fontSize:"13px",
                    fontWeight:"600" }}>{link.label}</div>
                  <div style={{ color:"#9BB8A4", fontSize:"11px",
                    marginTop:"1px" }}>{link.note}</div>
                </div>
              </div>
              <span style={{ color:"#C4BAA8", fontSize:"16px" }}>›</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Atlas Reset ── */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ color:"#1C3A2A", fontSize:"14px", fontWeight:"700",
          marginBottom:"4px" }}>🔄 Reset Atlas Memory</div>
        <div style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.65",
          marginBottom:"14px" }}>
          This clears your local ecological memory — journal, yearbooks, night mode preference.
          Nothing is stored anywhere else. After reset, the atlas is fresh.
        </div>

        {resetDone ? (
          <div className="px-3 py-2 rounded-xl"
            style={{ background:"rgba(122,184,122,0.08)", border:"1px solid rgba(122,184,122,0.20)" }}>
            <div style={{ color:"#2D5A3D", fontSize:"12px" }}>
              ✓ Atlas memory cleared — returning to home.
            </div>
          </div>
        ) : resetStep === 0 ? (
          <button onClick={handleReset}
            className="px-5 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{ background:"rgba(196,122,122,0.15)", color:"#C47A7A",
              border:"1px solid #EF9A9A", cursor:"pointer" }}>
            Reset Atlas Memory
          </button>
        ) : resetStep === 1 ? (
          <div className="space-y-2">
            <div className="rounded-xl px-3 py-2.5"
              style={{ background:"rgba(196,151,74,0.10)", border:"1px solid rgba(196,151,74,0.25)" }}>
              <div style={{ color:"#7A4A1A", fontSize:"12px", lineHeight:"1.55" }}>
                This will permanently clear your journal, yearbooks, and night mode preference from this device.
                Your data is not stored anywhere else — this cannot be undone.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset}
                className="px-5 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background:"#C47A7A", color:"rgba(255,255,255,0.90)",
                  border:"none", cursor:"pointer" }}>
                Yes, clear everything
              </button>
              <button onClick={() => setResetStep(0)}
                className="px-5 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ background:"#F0EDE6", color:"#4A7C59",
                  border:"1px solid #D4C9B0", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color:"#9BB8A4", fontSize:"12px" }}>Clearing…</div>
        )}
      </div>

      {/* ── Privacy anchor ── */}
      <div className="rounded-xl px-4 py-3 text-center"
        style={{ background:"rgba(74,124,89,0.06)", border:"1px solid rgba(127,175,138,0.15)" }}>
        <div className="flex items-center justify-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="#5C8A6A" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ color:"#5C8A6A", fontSize:"11px" }}>
            All settings stay on your device — never stored, never sent
          </span>
        </div>
      </div>
    </div>
  );
}