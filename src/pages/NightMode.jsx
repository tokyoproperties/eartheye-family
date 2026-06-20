import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Night Mode Hook ────────────────────────────────────────────────────────────
// Detects civil dusk/dawn and manages night mode state.
// Preference stored in localStorage: "ee_night_mode" = "auto"|"on"|"off"

const NIGHT_PREF_KEY = "ee_night_mode";

// Summer nights are longer — adjust for season
function isNightHour() {
  const d = new Date();
  const h = d.getHours();
  const month = d.getMonth();
  // Summer (Jun–Aug): twilight extends to 8:30pm; dawn 5:30am
  const isSummer = month >= 5 && month <= 7;
  if (isSummer) return h >= 21 || h < 5;
  return h >= 20 || h < 6;
}

// Get current ecological night context for messages
export function getNightContext() {
  const d = new Date();
  const h = d.getHours();
  const month = d.getMonth();
  const isSummer = month >= 5 && month <= 7;
  const isFall   = month >= 8 && month <= 10;

  // Night species by season
  const nightSpecies = {
    summer: ["Pallid Bat", "Mexican Free-tailed Bat", "Common Poorwill", "Lesser Nighthawk", "Katydid (Fork-tailed)"],
    fall:   ["Great Horned Owl", "Western Screech-Owl", "Pacific Tree Frog", "Virginia Opossum", "Pallid Bat", "California Myotis"],
    winter: ["Great Horned Owl", "Long-eared Owl", "Virginia Opossum", "Striped Skunk"],
    spring: ["Pacific Tree Frog", "Western Toad", "Great Horned Owl", "Burrowing Owl (calling)", "Mexican Free-tailed Bat"],
  };
  const season = isSummer ? "summer" : isFall ? "fall" : month <= 1 || month === 11 ? "winter" : "spring";

  // Night messages by season + time
  const earlyNight = h >= 20 && h < 23;
  const lateNight  = h >= 23 || h < 2;
  const preDawn    = h >= 2 && h < 6;

  const messages = {
    summer: {
      earlyNight: "The Lesser Nighthawk is calling overhead — a soft, electric purr that tracks the same insects the bats are chasing. The canyon airflow picks up after 9pm.",
      lateNight:  "Peak bat foraging. Mexican Free-tailed Bats are working the sage margins at 35 mph. The marine layer is audible on the coast — a low hiss before you can see it.",
      preDawn:    "The night insects are slowing. Common Poorwill has gone silent. The birds start 20 minutes before the light appears.",
    },
    fall: {
      earlyNight: "Great Horned Owl pairs calling across the canyon — fall courtship begins in October. Pacific Tree Frogs active near any standing water after the first rain. The Peregrine is roosting on its bluff ledge.",
      lateNight:  "The owl is in hunting mode — no more calling, just listening. Opossums and Raccoons working the creek corridors. Virginia Opossum is the only native marsupial you'll encounter.",
      preDawn:    "Great Horned Owl calls once before dawn — the bookend. The first Wrentit answers from the chaparral edge at first gray light. The bay is already active: Long-billed Dowitchers feeding in the dark.",
    },
    winter: {
      earlyNight: "The Great Horned Owl called two hours before dark — they begin earlier in winter, nesting while the oaks stand bare. The bay is quiet except for the soft alarm calls of roosting shorebirds. The county's longest nights.",
      lateNight:  "Stillest ecological hour of the year. Long-eared Owls hunting open grasslands at Mile Square. Barn Owl hunting the oak woodland edge at Santiago Oaks. Striped Skunk and Virginia Opossum working the suburban creek corridors.",
      preDawn:    "Dawn chorus starts at 5:45am in December — the latest of any month. The first call is usually a Song Sparrow from the pickleweed margin. The Peregrine is already on its cliff ledge, waiting for enough light to hunt.",
    },
    spring: {
      earlyNight: "Pacific Tree Frog chorus from every canyon pool and vernal pool in the county — the loudest biological sound of the year, building to a peak in March and April. Mexican Free-tailed Bats emerging from roost sites at sunset, chasing moths over the sage scrub canopy.",
      lateNight:  "Western Toad out in the canyon bottom. Great Horned Owl carrying food to its owlets — silent flight. Burrowing Owl calling from the Bolsa Chica bluffs — a hollow, two-note sound you hear before you understand it.",
      preDawn:    "April pre-dawn is the most acoustically dense window in OC ecology — 20+ species in the first 15 minutes of light. California Gnatcatcher first. Then Spotted Towhee. Then the full chaparral opens. Go before 5:30am.",
    },
  };

  const timeKey = preDawn ? "preDawn" : lateNight ? "lateNight" : "earlyNight";
  const msg = messages[season]?.[timeKey] || messages.fall.earlyNight;

  return {
    season,
    activeSpecies: nightSpecies[season] || nightSpecies.fall,
    message: msg,
    warmNight: isSummer && h >= 21,
    longerTwilight: isSummer,
  };
}

export function useNightMode() {
  const [pref, setPref] = useState(() => {
    try { return localStorage.getItem(NIGHT_PREF_KEY) || "auto"; } catch { return "auto"; }
  });

  const isNight = pref === "on" || (pref === "auto" && isNightHour());

  function cyclePref() {
    const next = pref === "auto" ? "on" : pref === "on" ? "off" : "auto";
    setPref(next);
    try { localStorage.setItem(NIGHT_PREF_KEY, next); } catch {}
  }

  // Apply body class
  useEffect(() => {
    if (isNight) {
      document.body.classList.add("night-mode");
    } else {
      document.body.classList.remove("night-mode");
    }
    return () => document.body.classList.remove("night-mode");
  }, [isNight]);

  return { isNight, pref, cyclePref };
}

// Night Mode toggle button component
export function NightModeToggle({ compact = false }) {
  const { isNight, pref, cyclePref } = useNightMode();
  const labels = { auto: "Auto", on: "Night On", off: "Night Off" };
  const icons  = { auto: "🌓", on: "🌙", off: "☀️" };
  return (
    <button onClick={cyclePref}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all hover:opacity-80"
      style={{
        background: isNight ? "rgba(12,31,42,0.8)" : "rgba(240,233,214,0.15)",
        border: isNight ? "1px solid rgba(127,175,138,0.2)" : "1px solid rgba(127,175,138,0.3)",
        cursor: "pointer",
      }}>
      <span style={{ fontSize: compact ? "12px" : "14px" }}>{icons[pref]}</span>
      {!compact && (
        <span style={{ color: isNight ? "#7FAF8A" : "#4A7C59",
          fontSize: "10px", fontWeight: "700", letterSpacing: "0.05em" }}>
          {labels[pref]}
        </span>
      )}
    </button>
  );
}

// ── Night Mode Page (default export — required by router) ─────────────────────
const SEASON_SPECIES = {
  summer: [
    { name: "Pallid Bat",            note: "Hunts scorpions and large insects low over sage scrub" },
    { name: "Mexican Free-tailed Bat", note: "High-speed aerial hunter — 35 mph over canyon corridors" },
    { name: "Common Poorwill",       note: "Ground-nesting nightjar; calls from canyon rock outcrops" },
    { name: "Lesser Nighthawk",      note: "Electric purr overhead — tracks the same moths as the bats" },
    { name: "Katydid (Fork-tailed)", note: "Loudest insect in the summer night chorus after 10pm" },
  ],
  fall: [
    { name: "Great Horned Owl",      note: "Courtship calls begin in October — pairs calling across the canyon" },
    { name: "Western Screech-Owl",   note: "Whinny call from oak woodland — most often heard at Irvine Regional Park" },
    { name: "Pacific Tree Frog",     note: "Active near any standing water after first fall rain" },
    { name: "Virginia Opossum",      note: "Only native marsupial in OC — creek corridors and suburban edges" },
    { name: "Pallid Bat",            note: "Still active into October on warm nights" },
    { name: "California Myotis",     note: "Small bat over woodland ponds — echolocation clicks audible to some" },
  ],
  winter: [
    { name: "Great Horned Owl",      note: "Nesting in January — earliest breeder in the county by six weeks" },
    { name: "Long-eared Owl",        note: "Open grassland hunter — Mile Square and coastal sage flats" },
    { name: "Barn Owl",              note: "Silent ghost over oak woodland edges at Santiago Oaks" },
    { name: "Virginia Opossum",      note: "Suburban creek corridors — strictly nocturnal" },
    { name: "Striped Skunk",         note: "Active all winter; forages suburban edges and canyon bottoms" },
  ],
  spring: [
    { name: "Pacific Tree Frog",     note: "Chorus from every vernal pool and canyon stream — peak March–April" },
    { name: "Western Toad",          note: "Canyon bottoms after rain — low, buzzing trill" },
    { name: "Great Horned Owl",      note: "Owlets now audible — raspy begging calls from nest tree" },
    { name: "Burrowing Owl",         note: "Two-note call from Bolsa Chica bluffs — hollow and carry-far" },
    { name: "Mexican Free-tailed Bat", note: "Emerging from roost at sunset, chasing moths over sage scrub" },
  ],
};

const PHASE_ICONS = { summer: "🌙", fall: "🦉", winter: "❄️", spring: "🐸" };
const PHASE_LABELS = { summer: "Summer Night", fall: "Fall Night", winter: "Winter Night", spring: "Spring Night" };

export default function NightModePage() {
  const navigate  = useNavigate();
  const { isNight, pref, cyclePref } = useNightMode();
  const ctx       = getNightContext();
  const species   = SEASON_SPECIES[ctx.season] || SEASON_SPECIES.fall;
  const phaseIcon = PHASE_ICONS[ctx.season]  || "🌙";
  const phaseLabel= PHASE_LABELS[ctx.season] || "Night";
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const bgColor   = isNight ? "#050F18" : "#0C1F2A";
  const cardBg    = isNight ? "#0C1F2A" : "#111F2A";

  return (
    <div className="min-h-screen pb-24" style={{ background: bgColor, color: "#C4DFC8" }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 md:max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4A7C59" }} />
              <span style={{ color: "#4A7C59", fontSize: "11px", fontWeight: "700",
                textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Night Ecology · {timeStr}
              </span>
            </div>
            <h1 className="font-bold" style={{ fontSize: "clamp(22px,5vw,30px)",
              letterSpacing: "-0.02em", color: "#C4DFC8" }}>
              {phaseIcon} {phaseLabel}
            </h1>
          </div>
          <NightModeToggle />
        </div>

        {/* Live context message */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: cardBg,
          border: "1px solid rgba(74,124,89,0.25)" }}>
          <p style={{ color: "#A8C8B4", fontSize: "15px", lineHeight: "1.75",
            fontStyle: "italic" }}>
            "{ctx.message}"
          </p>
        </div>

        {/* Active species */}
        <div className="mb-5">
          <h2 className="font-semibold mb-3" style={{ color: "#7FAF8A", fontSize: "13px",
            textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Active Right Now
          </h2>
          <div className="flex flex-col gap-2">
            {species.map((s, i) => (
              <button key={i} onClick={() => navigate(`/Search?q=${encodeURIComponent(s.name)}`)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all hover:opacity-80"
                style={{ background: cardBg, border: "1px solid rgba(74,124,89,0.2)", cursor: "pointer" }}>
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: "16px", marginTop: "1px" }}>🌑</span>
                  <div>
                    <div style={{ color: "#C4DFC8", fontSize: "14px", fontWeight: "600" }}>{s.name}</div>
                    <div style={{ color: "#7FAF8A", fontSize: "12px", lineHeight: "1.5", marginTop: "2px" }}>{s.note}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Night mode control */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: cardBg,
          border: "1px solid rgba(74,124,89,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: "#C4DFC8", fontSize: "14px", fontWeight: "600" }}>Display Mode</div>
              <div style={{ color: "#7FAF8A", fontSize: "12px", marginTop: "2px" }}>
                {pref === "auto"
                  ? "Auto — switches at dusk and dawn"
                  : pref === "on"
                  ? "Night mode forced on"
                  : "Day mode forced on"}
              </div>
            </div>
            <NightModeToggle />
          </div>
        </div>

        {/* Navigation shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Species",  icon: "🦅", path: "/Species"  },
            { label: "Trails",   icon: "🌿", path: "/Trails"   },
            { label: "Seasonal", icon: "🍂", path: "/Seasonal" },
            { label: "Journal",  icon: "📘", path: "/Journal"  },
          ].map(({ label, icon, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="rounded-xl py-3 px-4 text-left transition-all hover:opacity-80"
              style={{ background: cardBg, border: "1px solid rgba(74,124,89,0.2)", cursor: "pointer" }}>
              <span style={{ fontSize: "18px" }}>{icon}</span>
              <div style={{ color: "#C4DFC8", fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>{label}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
