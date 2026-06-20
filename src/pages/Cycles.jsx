import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CYCLES = [
  {
    id: "marine-layer",
    name: "Marine Layer Cycle",
    emoji: "🌫",
    gradient: "linear-gradient(135deg, #1C3A5A 0%, #2D5A7A 100%)",
    accent: "#7AB0D0",
    identity: "Not weather — a biological machine. The Pacific chills the coast 20°F below the interior every morning, then retreats, then returns. Every coastal species in Orange County has organized its daily schedule around this rhythm.",
    phases: [
      { label: "Night", note: "Marine layer consolidates offshore. Fog bank 200–600 ft deep sits 5–20 miles offshore." },
      { label: "Dawn", note: "Fog bank advances inland at 5–8 mph. Beach temperatures drop 10–15°F in 30 minutes." },
      { label: "Midday", note: "Solar heating burns fog back. Interior heats to 90°F+ while coast holds at 65°F." },
      { label: "Dusk", note: "Land cools faster than ocean. Marine layer re-establishes along the coastal strip." },
    ],
    seasons: {
      spring: "Light and variable. May sees fog only 3–4 mornings/week. Coastal sage scrub begins its green flush.",
      summer: "June Gloom — peak marine layer season. Coast stays 15–20°F cooler than interior for weeks at a time.",
      fall:   "Marine layer thins abruptly after October 1. Crystal-clear skies and warm Santa Ana winds.",
      winter: "Rare. When it forms in winter, it signals an unusual Pacific pattern — watch for storm precursors.",
    },
    habitats: ["Coastal Sage Scrub", "Beach & Intertidal", "Tidal Marsh"],
    corridors: ["Crystal Cove", "Huntington Beach Coastal Corridor"],
  },
  {
    id: "tidal",
    name: "Tidal Cycle",
    emoji: "🌊",
    gradient: "linear-gradient(135deg, #1A3A6A 0%, #2D5A9A 100%)",
    accent: "#6AAAD0",
    identity: "The most reliable clock in the county — two highs, two lows, every single day, whether or not the sun comes out. Every intertidal organism from the barnacle to the sea otter has calibrated its life to this six-hour interval.",
    phases: [
      { label: "High Tide", note: "Intertidal zone submerged. Shore birds compress to upper marsh edges. Harbor seals haul out." },
      { label: "Ebb", note: "Water recedes. Herons and egrets begin following the water line down. Foraging window opens." },
      { label: "Low Tide", note: "Full intertidal exposure. The mid-zone barnacle-urchin community is accessible. Best tidepool window." },
      { label: "Minus Tide", note: "The rarest event — below 0.0 ft MLLW. The lowest zone exposed. Sunflower sea star territory." },
    ],
    seasons: {
      spring: "Extreme minus tides in morning hours — the ecologically ideal tidepool window of the year.",
      summer: "Best minus tides occur after dark. Bioluminescence visible in surge channels at Crystal Cove.",
      fall:   "Tidal push compresses 35,000+ shorebirds to Newport Bay mud edges on afternoon high tides.",
      winter: "Highest wave energy. Best tidal biodiversity. Largest surf events expose deepest coastal features.",
    },
    habitats: ["Beach & Intertidal", "Tidal Marsh"],
    corridors: ["Upper Newport Bay", "Crystal Cove Beach Walk"],
  },
  {
    id: "bloom",
    name: "Bloom Cycle",
    emoji: "🌸",
    gradient: "linear-gradient(135deg, #3A2A5A 0%, #5A3A7A 100%)",
    accent: "#A07AD0",
    identity: "Not a single event — a cascade. The bloom moves in three stages from coast to canyon to mountain, each triggered by different conditions. A good bloom year is a specific sequence of rainfall, temperature, and timing, and it only works if all three align.",
    phases: [
      { label: "Rain Trigger", note: "1.5 inches of rain before January 15 activates the seed bank. Below that threshold — no bloom." },
      { label: "Coast Bloom", note: "February–March: beach primrose, sea rocket, and sand verbena on the coastal bluffs and dunes." },
      { label: "Chaparral Bloom", note: "March–April: Ceanothus, monkeyflower, and poppies explode on burn scars and south-facing slopes." },
      { label: "Oak Woodland", note: "April–May: canyon walls and shaded north slopes bloom last — trillium, shooting star, clarkia." },
    ],
    seasons: {
      spring: "Peak bloom window. Every substrate type blooming simultaneously for 4–6 weeks.",
      summer: "All annual color gone. Only drought-tolerant perennials hold color — buckwheat and sages.",
      fall:   "Second minor bloom after October rains — coastal bluffs reactivate. Watch for canyon sunflower.",
      winter: "The bloom window is set by rain now. High rainfall years produce legendary March blooms.",
    },
    habitats: ["Chaparral", "Coastal Sage Scrub", "Oak Woodland", "Beach & Intertidal"],
    corridors: ["San Juan Creek", "Crystal Cove Backcountry"],
  },
  {
    id: "migration",
    name: "Migration Cycle",
    emoji: "🦅",
    gradient: "linear-gradient(135deg, #1C3A2A 0%, #2D5A3A 100%)",
    accent: "#6AB88A",
    identity: "Orange County sits at the convergence of the Pacific Flyway and the California coastal migration corridor — every spring and fall, millions of birds move through five distinct ecological highways simultaneously.",
    phases: [
      { label: "Spring Arrival", note: "March–May: Neotropical migrants move north. Warblers, flycatchers, vireos. Peak mid-April." },
      { label: "Breeding", note: "May–July: Resident breeders claim territory. The county is at maximum avian density." },
      { label: "Post-breeding Dispersal", note: "July–August: Arctic shorebirds begin southward movement. First fall migrants arrive." },
      { label: "Fall Convergence", note: "September–November: All corridors peak simultaneously. The October Convergence." },
    ],
    seasons: {
      spring: "Neotropical arrivals. Watch riparian corridors — the creek systems are the main highways.",
      summer: "Shorebird return begins in July — counter-intuitively early. Fall migration starts before summer ends.",
      fall:   "Peak diversity. The October Convergence brings all five corridor systems to simultaneous peak.",
      winter: "Gray Whale offshore. Waterfowl maximum at Newport Bay. Arctic visitors in the tidal marsh.",
    },
    habitats: ["Tidal Marsh", "Riparian", "Coastal Sage Scrub"],
    corridors: ["Mountains-to-Sea", "San Juan Creek", "Upper Newport Bay"],
  },
  {
    id: "fire",
    name: "Fire Cycle",
    emoji: "🔥",
    gradient: "linear-gradient(135deg, #5A2A1C 0%, #7A3A2A 100%)",
    accent: "#D08060",
    identity: "The chaparral is a fire-adapted ecosystem — it does not survive fire, it requires fire. The entire community is structured around a 20–50 year burn cycle that resets succession and drives peak biodiversity.",
    phases: [
      { label: "Pre-fire Climax", note: "Dense, mature chaparral. High fuel load. Low biodiversity — only shade-tolerant species persist under the canopy." },
      { label: "Fire Event", note: "Typically late summer/fall — wind-driven, fast-moving. Santa Ana winds create extreme fire weather conditions." },
      { label: "Post-fire Flush", note: "Year 1–3: Explosion of annual wildflowers and fire-follower plants. Maximum visible biodiversity." },
      { label: "Recovery", note: "Year 3–10: Shrub layer re-establishes. By year 10, mature chaparral structure restored." },
    ],
    seasons: {
      spring: "Fire risk low. New growth and bloom. Chaparral oils are at minimum concentration.",
      summer: "Risk rises rapidly after July. The chaparral dries and oils concentrate. Avoid ignition sources.",
      fall:   "Peak fire season. Santa Ana winds create extreme conditions. Coal Canyon is the primary corridor risk.",
      winter: "First rains reduce risk. Post-fire recovery accelerates. Watch for invasive grasses in burned areas.",
    },
    habitats: ["Chaparral", "Coastal Sage Scrub"],
    corridors: ["Coal Canyon Wildlife Corridor", "Mountains-to-Sea", "Santiago Creek"],
  },
  {
    id: "corridor-movement",
    name: "Corridor Movement Cycle",
    emoji: "🔄",
    gradient: "linear-gradient(135deg, #2A3A1C 0%, #3A5A2A 100%)",
    accent: "#8AB87A",
    identity: "Wildlife movement through Orange County follows a predictable seasonal rhythm — not random wandering but structured tidal flows of energy, guided by the five canonical corridors.",
    phases: [
      { label: "Spring Pulse", note: "March–May: Northward neotropical migration. Upland movement begins. Mountain Lion range expands." },
      { label: "Summer Compression", note: "June–August: Heat compresses movement to dawn/dusk. Coastal corridor remains active — the only cool path." },
      { label: "Fall Convergence", note: "September–November: The highest wildlife traffic of the year. All corridors simultaneously active." },
      { label: "Winter Consolidation", note: "December–February: Movement slows. Bay ecosystem at maximum productivity. Mammals concentrate near water." },
    ],
    seasons: {
      spring: "Vireo and Gnatcatcher claim riparian and sage scrub territories. Mule Deer move to high chaparral.",
      summer: "Mountain Lion expands territory at night. Deer move to coastal strip. Bay shorebirds maximum.",
      fall:   "Mountain Lion at Coal Canyon peak — the 91 Freeway crossing attempts cluster in October.",
      winter: "Deer concentrate near lowland water sources. Mountain Lion follows. Corridor bottlenecks exposed.",
    },
    habitats: ["Chaparral", "Riparian", "Tidal Marsh", "Oak Woodland"],
    corridors: ["Mountains-to-Sea", "San Juan Creek", "Coal Canyon Wildlife Corridor", "Santiago Creek"],
  },
];

const SEASON_ICONS = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const SEASON_ORDER = ["spring","summer","fall","winter"];

export default function Cycles() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Ecological Mechanics · Orange County
          </span>
        </div>
        <h1 className="font-bold mb-1"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          ♻️ Cycles
        </h1>
        <p style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.7", maxWidth:"460px" }}>
          Six forces that govern when things happen and why. The atlas is their calendar.
        </p>
      </div>

      {/* Cycle cards */}
      <div className="space-y-4">
        {CYCLES.map(c => (
          <div key={c.id}>
            <button
              onClick={() => setActive(active === c.id ? null : c.id)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all hover:scale-[1.005] active:scale-[0.99]"
              style={{ background: c.gradient, boxShadow:"0 2px 12px rgba(0,0,0,0.12)" }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize:"22px" }}>{c.emoji}</span>
                    <span style={{ color:"#F0E9D6", fontSize:"17px", fontWeight:"800",
                      letterSpacing:"-0.01em" }}>{c.name}</span>
                  </div>
                  <div style={{ color:"rgba(240,233,214,0.6)", fontSize:"11px",
                    marginLeft:"32px", maxWidth:"260px" }}>
                    {c.identity.split(".")[0]}.
                  </div>
                </div>
                <div style={{ color:"rgba(240,233,214,0.5)", fontSize:"18px",
                  transform: active === c.id ? "rotate(90deg)" : "none",
                  transition:"transform 0.2s" }}>›</div>
              </div>
            </button>

            {active === c.id && (
              <div className="rounded-b-2xl -mt-2 pt-5 pb-5 px-5 space-y-5"
                style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
                  borderTop:"none", boxShadow:"0 4px 12px rgba(28,58,42,0.06)" }}>

                {/* Identity */}
                <p style={{ color:"rgba(255,255,255,0.70)", fontSize:"13px", lineHeight:"1.75", fontStyle:"italic" }}>
                  "{c.identity}"
                </p>

                {/* Four-phase diagram */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>
                    The Four Phases
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {c.phases.map((p, i) => (
                      <div key={p.label} className="flex gap-2.5 items-start">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background:"rgba(74,124,89,0.12)", border:"1px solid rgba(74,124,89,0.25)" }}>
                          <span style={{ color:"#4A7C59", fontSize:"9px", fontWeight:"800" }}>{i+1}</span>
                        </div>
                        <div>
                          <div style={{ color:"#1C3A2A", fontSize:"11px", fontWeight:"700" }}>{p.label}</div>
                          <div style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.55" }}>{p.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seasonal behavior */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>
                    Seasonal Behavior
                  </div>
                  <div className="space-y-2">
                    {SEASON_ORDER.map(s => c.seasons[s] ? (
                      <div key={s} className="flex gap-2.5">
                        <span style={{ fontSize:"14px", flexShrink:0 }}>{SEASON_ICONS[s]}</span>
                        <div>
                          <div style={{ color:"#1C3A2A", fontSize:"11px",
                            fontWeight:"700", textTransform:"capitalize" }}>{s}</div>
                          <div style={{ color:"#7FAF8A", fontSize:"12px", lineHeight:"1.55" }}>{c.seasons[s]}</div>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* Habitats */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"6px" }}>
                    Habitat Interactions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.habitats.map(h => (
                      <span key={h} className="px-2.5 py-1 rounded-full"
                        style={{ background:"rgba(122,184,122,0.12)", color:"#7AB87A",
                          fontSize:"11px", border:"1px solid #B0D4BE" }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Corridors */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"6px" }}>
                    Corridor Interactions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.corridors.map(co => (
                      <span key={co} className="px-2.5 py-1 rounded-full"
                        style={{ background:"#F0EDE6", color:"#4A7C59",
                          fontSize:"11px", border:"1px solid rgba(255,255,255,0.07)" }}>
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p style={{ color:"#C4BAA8", fontSize:"11px", lineHeight:"1.6" }}>
          The atlas reads these cycles every session. So does the terrain.
        </p>
      </div>
    </div>
  );
}