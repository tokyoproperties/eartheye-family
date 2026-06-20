import { useState, useEffect } from "react";
import BottomNav from "./BottomNav";
import { Trail } from "@/api/entities";
import { useNavigate } from "react-router-dom";

// ── Canonical Corridors ─────────────────────────────────────────────────────
const CANONICAL = [
  {
    id: "69e069445c7bb4cecf803289",
    name: "Mountains-to-Sea",
    subtitle: "Interior Transect (North) · 22 miles",
    icon: "⛰",
    color: "#2D5A3D",
    accent: "#4A7C59",
    terminus: "Saltmarsh",
    terminusIcon: "🦅",
    direction: "N → S",
    biomes: ["Chaparral", "Sage Scrub", "Grassland", "Riparian", "Saltmarsh"],
    role: "The north interior spine — foothills to Newport Bay estuary across every OC biome.",
    peakNote: "October: chaparral golden + Newport Bay at maximum shorebird diversity",
    x: 0.52, y: 0.28,
  },
  {
    id: "69e0248656b58bca7d679d30",
    name: "Upper Newport Bay",
    subtitle: "Wetland Terminus · 10.5 miles",
    icon: "🌊",
    color: "#1C4A5A",
    accent: "#2D7A8A",
    terminus: "Estuary",
    terminusIcon: "🦆",
    direction: "Loop",
    biomes: ["Tidal Channel", "Mudflat", "Cordgrass", "Pickleweed", "Sage Scrub"],
    role: "The wetland mouth — where the entire OC watershed exhales into the Pacific.",
    peakNote: "October: crimson pickleweed + 35,000 shorebirds on the mudflats",
    x: 0.38, y: 0.52,
  },
  {
    id: "69e005f2b447b8e1f109219e",
    name: "Crystal Cove Ridge-to-Sea",
    subtitle: "Coastal Transect · 18 miles",
    icon: "🐚",
    color: "#2A4A6A",
    accent: "#3D6A8A",
    terminus: "Basalt Reef",
    terminusIcon: "🪨",
    direction: "E → W",
    biomes: ["Chaparral", "Riparian", "Sage Scrub", "Bluff", "Intertidal"],
    role: "The coastal edge — backcountry chaparral to rocky intertidal reef.",
    peakNote: "October: bioluminescence + minus tides + migrant raptors on the bluff",
    x: 0.42, y: 0.62,
  },
  {
    id: "69e06ef8ae83438254c22903",
    name: "San Juan Creek",
    subtitle: "Interior Transect (South) · 22 miles",
    icon: "🌳",
    color: "#3A2A1C",
    accent: "#7A5A3A",
    terminus: "Estuary Mouth",
    terminusIcon: "🏖",
    direction: "N → S",
    biomes: ["Chaparral", "Oak Woodland", "Riparian", "Sage Scrub", "Estuary"],
    role: "The south interior spine — Juaneño corridor from Cleveland NF to Doheny.",
    peakNote: "October: cottonwood gold in canyon + shorebirds at creek mouth",
    x: 0.55, y: 0.78,
  },
];

// ── Corridor seasonal intelligence ──────────────────────────────────────────
// Seasonal strength curves refined for ecological accuracy:
// Mountains-to-Sea: summer = 0.3 (heat shuts interior; Mountain Lion nocturnal only)
// Upper Newport Bay: summer = 0.6 (shorebird return begins July; persistent tidal cycle)
// Crystal Cove: summer = 0.8 (HIGHEST summer corridor — marine layer keeps it active all day)
// San Juan Creek: summer = 0.4 (creek drops to pools; Vireo nesting but trail impassable midday)
const CORRIDOR_INTEL = {
  "69e069445c7bb4cecf803289": { // Mountains-to-Sea
    seasonalStrength: { spring: 0.8, summer: 0.3, fall: 1.0, winter: 0.6 },
    keystoneSpecies: ["Mountain Lion", "Mule Deer", "Acorn Woodpecker", "Costa's Hummingbird"],
    keystoneBySeason: {
      summer: ["Mountain Lion (nocturnal only)", "White-throated Swift", "Pallid Bat", "Common Poorwill"],
      spring: ["Red-tailed Hawk (courtship)", "California Gnatcatcher", "Ceanothus (bloom)", "Costa's Hummingbird"],
      fall:   ["Mountain Lion", "Mule Deer", "Peregrine Falcon", "American Kestrel"],
    },
    bottlenecks: ["Coal Canyon crossing — 91 Freeway (most critical in county)", "Weir Canyon ridgeline pinch"],
    movementNote: {
      spring: "Bloom cascade opens the corridor from mountains to sea — Chamise and Ceanothus on the upper slopes, Gnatcatcher territorial in the coastal sage scrub below. Raptors in courtship flight over the ridgeline. Santiago Peak trail fully accessible in mild weather. The full ecological gradient active simultaneously.",
      summer: "Interior movement collapses to pre-dawn and post-dusk windows. The corridor is thermally closed by 9am. Mountain Lions shift entirely to nocturnal traversal.",
      fall:   "Peak movement — the highest wildlife activity of the year on this corridor. All age classes of Mountain Lion, Mule Deer, and Bobcat use the full corridor width. The acorn mast opens the oak woodland to every frugivore in the county. Santiago Peak at its most accessible: clear air, cooler temperatures, hawk migration overhead.",
      winter: "Corridor quiets as temperatures drop. Mountain Lion range expands — they move lower in elevation following Mule Deer herds. Coal Canyon crossing most critical in winter when deer concentrate near creek water.",
    },
    healthIndicators: ["Mountain Lion sightings at Coal Canyon", "Mule Deer herd size", "Least Bell's Vireo in riparian"],
  },
  "69e0248656b58bca7d679d30": { // Upper Newport Bay
    seasonalStrength: { spring: 0.7, summer: 0.6, fall: 1.0, winter: 0.9 },
    keystoneSpecies: ["Light-footed Ridgway's Rail", "Belding's Savannah Sparrow", "Pickleweed", "Pacific Dunlin"],
    keystoneBySeason: {
      summer: ["Western Sandpiper (returning July)", "Least Tern", "California Gull", "Pickleweed"],
      spring: ["Northbound Shorebirds (peak diversity)", "Belding's Savannah Sparrow", "Snowy Plover", "Least Tern (arriving)"],
      winter: ["Ridgway's Rail", "Dunlin", "Long-billed Dowitcher", "Canvasback"],
    },
    bottlenecks: ["Jamboree Road bridge (tidal flow restriction)", "Bristol Street culvert (fish passage)"],
    movementNote: {
      spring: "Northbound shorebird migration peaks on the bay mudflats in April — maximum species diversity of the year. Belding's Savannah Sparrow in full territorial song on the pickleweed. Minus tides expose the full mudflat during morning high-activity windows.",
      summer: "Tidal rhythm continues regardless of season — the bay is the most thermally stable corridor. Western Sandpipers return in late July, the first fall migrants anywhere in OC.",
      fall:   "The bay at October capacity — 35,000 shorebirds on the mudflats, the pickleweed crimson, the Peregrine hunting every morning. The highest species density of any OC site all year.",
      winter: "Maximum sustained capacity. 35,000+ shorebirds compress to the upper pickleweed edge at high tide. The American White Pelican cooperative feeding circles return in November.",
    },
    healthIndicators: ["Pickleweed coverage", "Rail call density at dawn", "Shorebird flock compression at high tide"],
  },
  "69e005f2b447b8e1f109219e": { // Crystal Cove
    seasonalStrength: { spring: 0.8, summer: 0.8, fall: 0.9, winter: 0.6 },
    keystoneSpecies: ["Ochre Sea Star", "California Gnatcatcher", "Peregrine Falcon", "Black Oystercatcher"],
    keystoneBySeason: {
      summer: ["Brown Pelican", "Brandt's Cormorant", "Garibaldi", "California Spiny Lobster (nocturnal)"],
      spring: ["Western Snowy Plover", "Allen's Hummingbird", "Grunion", "Coralline Algae"],
    },
    bottlenecks: ["PCH crossing at Crystal Cove State Beach entrance", "Moro Canyon ridgeline trail pinch"],
    movementNote: {
      spring: "Allen's Hummingbird displaying on the coastal bluff from February. Grunion spawning on specific minus-tide nights in March and April. California Gnatcatcher at peak territorial song. Western Snowy Plover on the sandy margins. The reef recovering from winter exposure.",
      summer: "Highest-use corridor in summer — marine layer suppresses heat, making this the only comfortable midday trail in the county. Evening minus tides open the full intertidal. Bioluminescence possible on calm warm nights.",
      fall:   "Peregrine returns to the Crystal Cove headlands in September — the corridor announces fall before any other. Marine layer collapses: the coast goes from gray to hard blue overnight. Bioluminescence peaks in warm-water Septembers. Raptor migration along the bluff through October.",
      winter: "Deepest minus tides of the year occur in morning hours in December. Gray Whale visible from the bluff. The reef is at maximum tidepool exposure.",
    },
    healthIndicators: ["Intertidal sea star recovery", "Gnatcatcher pair density", "Marine layer persistence"],
  },
  "69e06ef8ae83438254c22903": { // San Juan Creek
    seasonalStrength: { spring: 0.9, summer: 0.4, fall: 1.0, winter: 0.7 },
    keystoneSpecies: ["Least Bell's Vireo", "Fremont Cottonwood", "Arroyo Chub", "Two-striped Garter Snake"],
    keystoneBySeason: {
      summer: ["Least Bell's Vireo (nesting)", "Cliff Swallow", "Western Pond Turtle", "Bullfrog (invasive — indicator)"],
      spring: ["Cliff Swallow", "Least Bell's Vireo (arriving May)", "Arroyo Toad", "Two-striped Garter Snake"],
      fall:   ["Cottonwood (peak gold)", "Peregrine Falcon", "Neotropical migrants", "Bobcat"],
    },
    bottlenecks: ["I-5 culvert at Ortega Highway (Steelhead barrier)", "San Juan Creek mouth at Doheny (salt intrusion)"],
    movementNote: {
      spring: "Cliff Swallows return to San Juan Capistrano around March 19 — a date so consistent it predates the town. The Least Bell's Vireo arrives in May and begins singing from the willow thickets. Arroyo Toad calling from the upper tributaries at night. The creek is full and cold and purposeful.",
      summer: "Creek drops to isolated pools by July — Arroyo Chub and Western Pond Turtle concentrate in remaining deep pools. Vireo nesting continues but trail is impassable midday. Best visited before 7am.",
      fall:   "The cottonwood corridor turns gold in October — the county's most reliable fall color. Orange-crowned and Yellow-rumped Warblers stack in the canopy. The first rains reopen the creek: Steelhead staging at the lower culvert.",
      winter: "Creek running after first significant rain. Bare cottonwood canopy opens the woodland to light — White-crowned Sparrows and Hermit Thrushes move through the understory.",
    },
    healthIndicators: ["Vireo song density", "Creek flow continuity below Ortega", "Cottonwood canopy cover"],
  },
};

// ── Biome zones ──────────────────────────────────────────────────────────────
const BIOME_ZONES = [
  {
    id: "mountains",
    label: "Santa Ana Mountains",
    icon: "⛰",
    color: "#3A2A1C",
    fillOpacity: 0.28,
    description: "Cleveland National Forest — Santiago Peak to Saddleback",
    speciesFilter: "mountains",
    points: "68,5 95,5 98,35 88,55 75,60 65,45 62,25",
  },
  {
    id: "chaparral",
    label: "Chaparral & Wilderness",
    icon: "🌾",
    color: "#4A5C2A",
    fillOpacity: 0.28,
    description: "Mature chaparral, canyon wilderness, sage scrub",
    speciesFilter: "chaparral",
    points: "45,20 68,5 62,25 65,45 55,55 45,50 38,38 42,22",
  },
  {
    id: "riparian",
    label: "Riparian Corridors",
    icon: "🦋",
    color: "#2A5A3A",
    fillOpacity: 0.32,
    description: "Santiago, Aliso, San Juan creek corridors",
    speciesFilter: "wetlands",
    points: "38,38 45,50 55,55 58,72 50,80 38,78 30,65 32,48",
  },
  {
    id: "wetlands",
    label: "Coastal Wetlands",
    icon: "🦅",
    color: "#1C3A4A",
    fillOpacity: 0.32,
    description: "Bolsa Chica, Upper Newport Bay, San Joaquin",
    speciesFilter: "wetlands",
    points: "15,42 32,48 30,65 20,72 8,65 5,52 10,44",
  },
  {
    id: "coastal",
    label: "Coastal Corridor",
    icon: "🌊",
    color: "#1C4A6A",
    fillOpacity: 0.30,
    description: "PCH spine — Bolsa Chica to San Clemente beach",
    speciesFilter: "coastal",
    points: "5,52 8,65 20,72 30,65 38,78 50,80 58,90 50,95 28,95 5,78",
  },
  {
    id: "urban",
    label: "Urban Edge",
    icon: "🦊",
    color: "#4A4A2A",
    fillOpacity: 0.18,
    description: "City-embedded open space and greenbelts",
    speciesFilter: "urban",
    points: "5,30 42,22 38,38 32,48 15,42 5,35",
  },
];

// ── Trail pins ───────────────────────────────────────────────────────────────
const TRAIL_PINS = [
  { name: "Bolsa Chica",       x: 12, y: 38, biome: "wetlands",  id: "69e005f2b447b8e1f10921a2" },
  { name: "Newport Back Bay",  x: 26, y: 50, biome: "wetlands",  id: "69e000199189fb73f2cca86f" },
  { name: "San Joaquin",       x: 32, y: 46, biome: "wetlands",  id: "69e005f2b447b8e1f10921a7" },
  { name: "Crystal Cove",      x: 36, y: 60, biome: "coastal",   id: "69e005f2b447b8e1f109219e" },
  { name: "Laguna Coast",      x: 40, y: 64, biome: "chaparral", id: "69e005f2b447b8e1f10921a0" },
  { name: "Dana Point",        x: 42, y: 76, biome: "coastal",   id: "69e0248656b58bca7d679d2c" },
  { name: "Whiting Ranch",     x: 55, y: 44, biome: "chaparral", id: "69e005f2b447b8e1f10921a3" },
  { name: "Santiago Oaks",     x: 50, y: 36, biome: "riparian",  id: "69e005f2b447b8e1f10921a4" },
  { name: "Limestone Canyon",  x: 62, y: 40, biome: "chaparral", id: "69e005f2b447b8e1f10921a5" },
  { name: "Caspers",           x: 68, y: 60, biome: "chaparral", id: "69e0248656b58bca7d679d28" },
  { name: "Holy Jim",          x: 74, y: 50, biome: "mountains", id: "69e0289d7669e7f23c9f9c52" },
  { name: "Santiago Peak",     x: 80, y: 42, biome: "mountains", id: "69e062587200487a7507f1f7" },
  { name: "Peters Canyon",     x: 45, y: 32, biome: "urban",     id: "69e000199189fb73f2cca870" },
  { name: "Chino Hills",       x: 30, y: 16, biome: "chaparral", id: "69e005f2b447b8e1f10921a1" },
  { name: "Aliso & Wood",      x: 46, y: 70, biome: "chaparral", id: "69e0248656b58bca7d679d27" },
  { name: "O'Neill",           x: 66, y: 68, biome: "riparian",  id: "69e005f2b447b8e1f10921a6" },
  { name: "Black Star",        x: 70, y: 44, biome: "mountains", id: "69e02b46d1950015f453e143" },
  { name: "Doheny",            x: 44, y: 80, biome: "coastal",   id: "69e02b46d1950015f453e142" },
  { name: "Huntington Beach",  x: 14, y: 44, biome: "coastal",   id: "69e107ccdff3bddcdd219726" },
  { name: "San Clemente",      x: 52, y: 90, biome: "coastal",   id: "69e107ccdff3bddcdd21972f" },
];

const BIOME_COLORS = {
  mountains: "#7A5A3A",
  chaparral: "#6A8A3A",
  riparian:  "#3A8A5A",
  wetlands:  "#3A6A8A",
  coastal:   "#3A7AAA",
  urban:     "#7A7A4A",
};

// Keywords for habitatTypes matching (array contains check)
const REGIONS_KEYWORDS = {
  coastal:   ["sandy beach", "coastal bluff", "rocky intertidal", "intertidal", "wave-wash", "pier ecosystem", "harbor", "cobble beach", "coastal dune"],
  wetlands:  ["estuarine wetland", "freshwater marsh", "estuarine mouth", "coastal bay", "tidal", "mudflat", "cordgrass", "pickleweed", "estuary mouth", "estuary", "coastal bay", "sea"],
  riparian:  ["riparian corridor", "riparian-coastal", "willow woodland", "creek mouth"],
  chaparral: ["chaparral", "coastal sage scrub", "sandstone canyon", "sage scrub"],
};

// Name-based keywords for zones where habitatType matching is unreliable
const NAME_KEYWORDS = {
  mountains: ["santiago peak", "saddleback", "holy jim", "trabuco canyon trail", "modjeska", "chiquito", "black star", "cleveland", "coal canyon", "gypsum canyon", "limestone canyon", "limestone-whiting", "caspers", "starr ranch", "o'neill regional", "arroyo trabuco"],
  urban:     ["arboretum", "regional park", "yorba", "peters canyon", "carbon canyon", "laguna niguel", "huntington central", "mile square", "barbara's lake", "coyote hills", "sycamore hills", "serrano creek", "bee canyon", "tres vistas", "bommer canyon", "rancho carrillo", "irvine valley open space", "turtle rock", "shady canyon"],
};

// ── Watershed diagram ────────────────────────────────────────────────────────
const WatershedDiagram = ({ onNavigate }) => (
  <div className="rounded-2xl p-5 mb-5"
    style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.15)" }}>
    <div className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "#7FAF8A" }}>
      OC Watershed Logic — Santiago Peak to Pacific
    </div>
    <div className="flex flex-col items-center mb-2">
      <div className="px-3 py-1.5 rounded-lg text-xs"
        style={{ background: "rgba(74,124,89,0.2)", color: "#A8D5B0", border: "1px solid rgba(74,124,89,0.35)" }}>
        ⛰ Santiago Peak · 5,689 ft
      </div>
      <div style={{ color: "#2D5A3D", fontSize: "16px", lineHeight: "1.5" }}>↓</div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-2 md:grid-cols-4">
      {CANONICAL.map(c => (
        <button key={c.id} onClick={() => onNavigate(`/TrailDetail?id=${c.id}`)}
          className="rounded-xl py-2.5 px-2 text-center transition-all hover:opacity-80 active:scale-95"
          style={{ background: `${c.color}70`, border: `1px solid ${c.accent}40`, cursor: "pointer" }}>
          <div style={{ fontSize: "18px", marginBottom: "3px" }}>{c.icon}</div>
          <div style={{ color: "#C4DFC8", fontSize: "10px", fontWeight: "600", lineHeight: "1.3" }}>
            {c.name.split(" ").slice(0, 2).join(" ")}
          </div>
          <div style={{ color: "#5C8A6A", fontSize: "9px", marginTop: "2px" }}>{c.direction}</div>
        </button>
      ))}
    </div>
    <div style={{ color: "#2D5A3D", fontSize: "11px", textAlign: "center", marginBottom: "6px" }}>
      ↓ &nbsp;&nbsp;&nbsp; ↓ &nbsp;&nbsp;&nbsp; ↓ &nbsp;&nbsp;&nbsp; ↓
    </div>
    <div className="grid grid-cols-2 gap-2 mb-2 md:grid-cols-4">
      {CANONICAL.map(c => (
        <div key={c.id} className="rounded-xl p-2 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(127,175,138,0.1)" }}>
          <div style={{ fontSize: "15px" }}>{c.terminusIcon}</div>
          <div style={{ color: "#7FAF8A", fontSize: "9px", fontWeight: "600", marginTop: "2px",
            textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.terminus}</div>
        </div>
      ))}
    </div>
    <div style={{ color: "#2D5A3D", fontSize: "11px", textAlign: "center", marginBottom: "6px" }}>
      ↓ &nbsp;&nbsp;&nbsp; ↓ &nbsp;&nbsp;&nbsp; ↓ &nbsp;&nbsp;&nbsp; ↓
    </div>
    <div className="flex justify-center">
      <div className="px-4 py-1.5 rounded-lg text-xs"
        style={{ background: "rgba(45,90,106,0.4)", color: "#7FBFCF", border: "1px solid rgba(45,90,106,0.6)" }}>
        🌊 Pacific Ocean
      </div>
    </div>
  </div>
);

// ── SVG Map ──────────────────────────────────────────────────────────────────
function OCMap({ trails, onSelectBiome, onSelectTrail, activeBiome }) {
  const [hoveredPin, setHoveredPin] = useState(null);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{ background: "#0D1F14", border: "1px solid rgba(127,175,138,0.2)", aspectRatio: "1.15/1" }}>

      <div className="absolute top-3 right-3 z-10 flex flex-col items-center" style={{ opacity: 0.6 }}>
        <span style={{ color: "#7FAF8A", fontSize: "9px", fontWeight: "700" }}>N</span>
        <div style={{ width: "1px", height: "12px", background: "#7FAF8A" }} />
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "8px" }}>S</span>
      </div>

      <div className="absolute bottom-3 left-3 z-10"
        style={{ color: "#3A5A4A", fontSize: "9px", letterSpacing: "0.05em" }}>
        ORANGE COUNTY · CA
      </div>

      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ display: "block" }}>
        <rect x="0" y="0" width="100" height="100" fill="#0D1F14" />
        <polygon points="0,35 5,30 5,78 28,95 50,95 58,90 50,80 38,78 30,65 20,72 8,65 5,52 0,45"
          fill="#0A1825" opacity="0.8" />
        <polygon
          points="5,30 42,22 68,5 95,5 98,35 88,55 75,60 65,45 55,55 58,72 50,80 38,78 30,65 20,72 8,65 5,52"
          fill="#12251A" stroke="rgba(127,175,138,0.15)" strokeWidth="0.3" />

        {/* Biome zone polygons + centroid icons */}
        {BIOME_ZONES.map(zone => {
          // Approximate centroid per zone for icon placement
          const centroids = {
            mountains: { cx: 80, cy: 30 },
            chaparral: { cx: 55, cy: 30 },
            riparian:  { cx: 42, cy: 56 },
            wetlands:  { cx: 18, cy: 54 },
            coastal:   { cx: 22, cy: 75 },
            urban:     { cx: 22, cy: 32 },
          };
          const c = centroids[zone.id] || { cx: 50, cy: 50 };
          const isActive = activeBiome === zone.id;
          return (
            <g key={zone.id}>
              <polygon points={zone.points}
                fill={zone.color}
                fillOpacity={isActive ? zone.fillOpacity * 2.2 : zone.fillOpacity}
                stroke={isActive ? zone.color : "transparent"}
                strokeWidth={isActive ? 0.5 : 0}
                style={{ cursor: "pointer", transition: "all 0.3s" }}
                onClick={() => onSelectBiome(zone.id === activeBiome ? null : zone.id)} />
              {/* Micro-icon at centroid — only show when zone is large enough */}
              <text x={c.cx} y={c.cy}
                fontSize={isActive ? "5" : "3.5"}
                textAnchor="middle"
                opacity={isActive ? 0.9 : 0.4}
                style={{ pointerEvents: "none", transition: "all 0.3s", userSelect: "none" }}>
                {zone.icon}
              </text>
            </g>
          );
        })}

        {/* Watershed lines */}
        {/* Primary watershed flows — mountains to coast */}
        <path d="M 70,15 Q 55,30 45,38 Q 35,46 20,50 Q 12,52 5,55"
          stroke="#3A7AAA" strokeWidth="0.8" fill="none" opacity="0.55" strokeDasharray="2,1" />
        <path d="M 78,30 Q 68,45 60,58 Q 52,68 44,78 Q 40,82 38,88"
          stroke="#7A5A3A" strokeWidth="0.7" fill="none" opacity="0.5" strokeDasharray="2,1" />
        <path d="M 68,30 Q 58,42 50,54 Q 44,62 40,70"
          stroke="#4A7C59" strokeWidth="0.5" fill="none" opacity="0.4" strokeDasharray="1.5,1.5" />
        {/* Tributary flows */}
        <path d="M 85,20 Q 80,30 75,38 Q 72,44 70,50"
          stroke="#4A7C59" strokeWidth="0.35" fill="none" opacity="0.3" strokeDasharray="1,2" />

        {/* Coastal spine */}
        <polyline points="5,55 8,65 20,72 30,65 38,78 50,80 58,90"
          stroke="#3A7AAA" strokeWidth="0.7" fill="none" opacity="0.6" />
        {/* Watershed legend — bottom right */}
        <rect x="70" y="76" width="28" height="22" rx="2" fill="#0D1F14" opacity="0.85" />
        <text x="84" y="80.5" fontSize="2.0" fill="#5C8A6A" opacity="0.8" textAnchor="middle" fontWeight="600">WATERSHED KEY</text>
        <line x1="72" y1="83.5" x2="78" y2="83.5" stroke="#3A7AAA" strokeWidth="0.8" strokeDasharray="2,1"/>
        <text x="80" y="84.5" fontSize="1.9" fill="#7FBFCF" opacity="0.8">N. Interior</text>
        <line x1="72" y1="87" x2="78" y2="87" stroke="#7A5A3A" strokeWidth="0.8" strokeDasharray="2,1"/>
        <text x="80" y="88" fontSize="1.9" fill="#C4A87A" opacity="0.8">S. Interior</text>
        <line x1="72" y1="90.5" x2="78" y2="90.5" stroke="#4A7C59" strokeWidth="0.8" strokeDasharray="1.5,1.5"/>
        <text x="80" y="91.5" fontSize="1.9" fill="#7FAF8A" opacity="0.8">Riparian</text>
        <line x1="72" y1="94" x2="78" y2="94" stroke="#3A7AAA" strokeWidth="0.8"/>
        <text x="80" y="95" fontSize="1.9" fill="#7FBFCF" opacity="0.8">Coastal</text>

        {/* Canonical corridor markers with labels */}
        {CANONICAL.map((c, i) => {
          // Label offset — avoid overlap at edge of map
          const lx = c.x * 100 > 60 ? c.x * 100 - 22 : c.x * 100 + 5;
          const ly = c.y * 100 - 4;
          return (
            <g key={c.id} style={{ cursor: "pointer" }} onClick={() => onSelectTrail(c.id)}>
              {/* Glow ring */}
              <circle cx={c.x * 100} cy={c.y * 100} r="5.5"
                fill={c.color} fillOpacity="0.15" stroke={c.accent} strokeWidth="0.3" opacity="0.6" />
              {/* Core dot */}
              <circle cx={c.x * 100} cy={c.y * 100} r="3.0"
                fill={c.color} stroke={c.accent} strokeWidth="0.7" opacity="0.98" />
              {/* Icon */}
              <text x={c.x * 100 + 4} y={c.y * 100 + 1.2}
                fontSize="4" fill="#A8D5B0" opacity="0.9"
                style={{ pointerEvents: "none" }}>
                {c.icon}
              </text>
              {/* Name label */}
              <text x={lx} y={ly}
                fontSize="2.6" fill={c.accent} opacity="0.85" fontWeight="600"
                style={{ pointerEvents: "none", letterSpacing: "0.02em" }}>
                {c.name.split(" ").slice(0, 2).join(" ")}
              </text>
            </g>
          );
        })}

        {/* Trail pins */}
        {TRAIL_PINS.map(pin => {
          const isHovered = hoveredPin === pin.name;
          const color = BIOME_COLORS[pin.biome] || "#7FAF8A";
          return (
            <g key={pin.name} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredPin(pin.name)}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={() => onSelectTrail(pin.id)}>
              <circle cx={pin.x} cy={pin.y} r={isHovered ? "2.8" : "2.0"}
                fill={color} opacity={isHovered ? 1 : 0.8}
                style={{ transition: "all 0.15s" }} />
              {isHovered && (
                <>
                  <rect x={pin.x - 9} y={pin.y - 8} width="18" height="5.5" rx="1.5"
                    fill="#0D1F14" stroke={color} strokeWidth="0.4" opacity="0.95" />
                  <text x={pin.x} y={pin.y - 4.2} fontSize="2.8" fill="#C4DFC8"
                    textAnchor="middle" style={{ pointerEvents: "none" }}>
                    {pin.name}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Santiago Peak anchor */}
        <circle cx="86" cy="5" r="3.5" fill="none" stroke="#4A7C59" strokeWidth="0.4" opacity="0.5" strokeDasharray="1,0.8" />
        <circle cx="86" cy="5" r="1.5" fill="#2D5A3D" stroke="#7FAF8A" strokeWidth="0.5" opacity="0.9" />
        <text x="86" y="3"  fontSize="2.6" fill="#9BB8A4" opacity="0.85" textAnchor="middle" fontWeight="700">⛰</text>
        <text x="86" y="10.5" fontSize="2.3" fill="#7FAF8A" opacity="0.75" textAnchor="middle">Santiago Peak</text>
        <text x="86" y="13.5" fontSize="2.0" fill="#5C7A6A" opacity="0.6" textAnchor="middle">5,689 ft · Headwaters</text>
        {/* Pacific label — bottom coast, horizontal */}
        <text x="28" y="97" fontSize="2.6" fill="#3A7AAA" opacity="0.65" textAnchor="middle" letterSpacing="0.08em">🌊 PACIFIC</text>
      </svg>
    </div>
  );
}

// ── Biome legend ─────────────────────────────────────────────────────────────
function BiomeLegend({ activeBiome, onSelect, onViewSpecies, trailsByBiome }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-5 md:grid-cols-3">
      {BIOME_ZONES.map(zone => {
        const count  = trailsByBiome[zone.id] || 0;
        const active = activeBiome === zone.id;
        return (
          <button key={zone.id}
            onClick={() => onSelect(zone.id === activeBiome ? null : zone.id)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
            style={{
              background: active ? `${zone.color}35` : "rgba(255,255,255,0.04)",
              border: active ? `1px solid ${zone.color}60` : "1px solid rgba(127,175,138,0.12)",
              cursor: "pointer",
            }}>
            <span style={{ fontSize: "16px" }}>{zone.icon}</span>
            <div className="flex-1 min-w-0">
              <div style={{ color: active ? "#C4DFC8" : "#7FAF8A", fontSize: "11px", fontWeight: "600",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {zone.label}
              </div>
              <div style={{ color: "#3A5A4A", fontSize: "9px" }}>{count} trails</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Map() {
  const [trails, setTrails]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeBiome, setActiveBiome] = useState(null);
  const [activeView, setActiveView]   = useState("corridors");
  const [intelOpen, setIntelOpen]     = useState(null); // corridor id for intel panel
  const month = new Date().getMonth();
  const currentSeason = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";
  const navigate = useNavigate();

  useEffect(() => {
    Trail.filter({}).then(data => {
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setTrails(data);
      setLoading(false);
    });
  }, []);

  // Biome matching strategy:
  // - mountains/urban: name-based matching (habitatTypes are unreliable for these)
  // - chaparral: primary habitat only (it appears as secondary on almost every trail)
  // - all others: any habitatType match
  const NAME_ONLY_ZONES = new Set(["mountains", "urban"]);
  const PRIMARY_ONLY_ZONES = new Set(["chaparral"]);

  const matchesBiome = (trail, zoneId) => {
    const trailName = (trail.name || "").toLowerCase();
    if (NAME_ONLY_ZONES.has(zoneId)) {
      const nkws = NAME_KEYWORDS[zoneId] || [];
      return nkws.some(kw => trailName.includes(kw));
    }
    const kws = REGIONS_KEYWORDS[zoneId] || [];
    if (kws.length === 0) return false;
    if (PRIMARY_ONLY_ZONES.has(zoneId)) {
      const primaryHabitat = (trail.habitatTypes?.[0] || "").toLowerCase();
      return kws.some(kw => primaryHabitat.includes(kw));
    }
    // Default: any habitatType match
    return kws.some(kw =>
      trail.habitatTypes?.some(h => h.toLowerCase().includes(kw))
    );
  };

  const trailsByBiome = {};
  BIOME_ZONES.forEach(zone => {
    trailsByBiome[zone.id] = trails.filter(t => matchesBiome(t, zone.id)).length;
  });

  const activeZone = BIOME_ZONES.find(z => z.id === activeBiome);
  const filteredTrails = activeBiome
    ? trails.filter(t => matchesBiome(t, activeBiome))
    : [];

  // Navigate to species page filtered by this biome
  const handleViewSpecies = (biomeId) => {
    const zone = BIOME_ZONES.find(z => z.id === biomeId);
    if (zone?.speciesFilter) navigate(`/species?biome=${zone.speciesFilter}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 md:max-w-4xl">

      <div className="mb-5">
        <h1 className="font-bold mb-1" style={{ color: "#1C3A2A", fontSize: "26px", letterSpacing: "-0.02em" }}>
          Watershed Map
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>Orange County · Santiago Peak to Pacific</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "corridors", label: "Watershed + Corridors" },
          { id: "map",       label: "Biome Map" },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeView === v.id ? "rgba(122,184,122,0.15)" : "rgba(255,255,255,0.04)",
              color:      activeView === v.id ? "#7AB87A" : "rgba(255,255,255,0.55)",
              border:     activeView === v.id ? "1px solid rgba(122,184,122,0.35)" : "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── MAP VIEW ── */}
      {activeView === "map" && (
        <>
          <div className="mb-4">
            <OCMap
              trails={trails}
              activeBiome={activeBiome}
              onSelectBiome={setActiveBiome}
              onSelectTrail={id => navigate(`/TrailDetail?id=${id}`)}
            />
            <div className="mt-2 text-center" style={{ color: "#3A5A4A", fontSize: "10px" }}>
              Tap a biome zone to filter trails · hover or tap a pin for trail name
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Trails",     value: trails.length },
              { label: "Biomes",     value: BIOME_ZONES.length },
              { label: "Corridors",  value: 4 },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(28,58,42,0.08)", border: "1px solid rgba(127,175,138,0.15)" }}>
                <div style={{ color: "#1C3A2A", fontSize: "20px", fontWeight: "700", letterSpacing: "-0.02em" }}>
                  {loading ? "—" : s.value}
                </div>
                <div style={{ color: "#7FAF8A", fontSize: "10px", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#1C3A2A" }}>
            Biome Zones
          </div>
          <BiomeLegend
            activeBiome={activeBiome}
            onSelect={setActiveBiome}
            onViewSpecies={handleViewSpecies}
            trailsByBiome={trailsByBiome}
          />

          {/* Active biome drill-down */}
          {activeBiome && activeZone && (
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: `${activeZone.color}18`, border: `1px solid ${activeZone.color}35` }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "18px" }}>{activeZone.icon}</span>
                  <div>
                    <div style={{ color: "#C4DFC8", fontSize: "14px", fontWeight: "700" }}>{activeZone.label}</div>
                    <div style={{ color: "#5C8A6A", fontSize: "11px" }}>{activeZone.description}</div>
                  </div>
                </div>
                {/* View species button */}
                {activeZone.speciesFilter && (
                  <button
                    onClick={() => handleViewSpecies(activeBiome)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 flex-shrink-0"
                    style={{ background: activeZone.color, color: "#F0E9D6",
                      border: `1px solid ${activeZone.color}`, cursor: "pointer" }}>
                    View Species →
                  </button>
                )}
              </div>

              {filteredTrails.length === 0 ? (
                <div style={{ color: "#3A5A4A", fontSize: "12px" }}>Browse All Trails to explore this biome.</div>
              ) : (
                <div className="space-y-2">
                  {filteredTrails.slice(0, 10).map(trail => (
                    <button key={trail.id} onClick={() => navigate(`/TrailDetail?id=${trail.id}`)}
                      className="w-full text-left flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(127,175,138,0.1)", cursor: "pointer" }}>
                      <div>
                        <div style={{ color: "#C4DFC8", fontSize: "12px", fontWeight: "600" }}>{trail.name}</div>
                        <div style={{ color: "#5C8A6A", fontSize: "10px" }}>
                          {trail.distanceMiles ? `${trail.distanceMiles} mi` : ""}
                          {trail.difficulty ? ` · ${trail.difficulty}` : ""}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A5A4A" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                  {filteredTrails.length > 10 && (
                    <div style={{ color: "#3A5A4A", fontSize: "11px", textAlign: "center", paddingTop: "4px" }}>
                      +{filteredTrails.length - 10} more · browse All Trails
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── CORRIDORS VIEW ── */}
      {activeView === "corridors" && (
        <>
          <WatershedDiagram onNavigate={navigate} />

          <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#1C3A2A" }}>
            The OC Canonical Four
          </div>
          <div className="space-y-3 mb-6">
            {CANONICAL.map(c => (
              <div key={c.id} className="mb-1">
              <button onClick={() => navigate(`/TrailDetail?id=${c.id}`)}
                className="w-full text-left rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: c.color, border: `1px solid ${c.accent}50`,
                  boxShadow: `0 4px 20px ${c.color}40`, cursor: "pointer" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: "20px" }}>{c.icon}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.accent }}>
                        {c.subtitle}
                      </span>
                    </div>
                    <div className="font-bold mb-1" style={{ color: "#F0E9D6", fontSize: "17px" }}>{c.name}</div>
                    <div style={{ color: "#9BB8A4", fontSize: "12px", lineHeight: "1.5", marginBottom: "8px" }}>
                      {c.role}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.biomes.map(b => (
                        <span key={b} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: `${c.accent}25`, color: c.accent }}>{b}</span>
                      ))}
                    </div>
                    <div className="flex items-start gap-1.5 rounded-xl p-2.5"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "12px" }}>🍂</span>
                      <span style={{ color: "#9BB8A4", fontSize: "11px" }}>{c.peakNote}</span>
                    </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2"
                    style={{ marginTop: "4px", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
              {/* Corridor intelligence expand */}
              {CORRIDOR_INTEL[c.id] && (() => {
                const intel = CORRIDOR_INTEL[c.id];
                const strength = intel.seasonalStrength[currentSeason] || 0.5;
                const bars = Math.round(strength * 5);
                const isOpen = intelOpen === c.id;
                return (
                  <div>
                    <button onClick={() => setIntelOpen(isOpen ? null : c.id)}
                      className="w-full text-left px-4 py-2 text-xs transition-all hover:opacity-80"
                      style={{ background:"rgba(28,58,42,0.6)", color:"#7FAF8A",
                        borderLeft:`1px solid ${c.accent}30`, borderRight:`1px solid ${c.accent}30`,
                        borderBottom:`1px solid ${c.accent}30`, borderTop:"none",
                        cursor:"pointer", borderRadius:"0 0 10px 10px" }}>
                      {isOpen ? "▲ Hide intelligence" : `▼ ${currentSeason.charAt(0).toUpperCase()+currentSeason.slice(1)} corridor intelligence`}
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 space-y-3 mb-1 rounded-b-xl"
                        style={{ background:"rgba(8,20,12,0.97)",
                          border:`1px solid ${c.accent}20`, borderTop:"none" }}>
                        <div>
                          <div style={{ color:"#5C8A6A", fontSize:"10px", fontWeight:"700",
                            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"4px" }}>
                            Activity · {currentSeason.charAt(0).toUpperCase()+currentSeason.slice(1)}
                          </div>
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4,5].map(i => {
                              const active = i <= bars;
                              const ht = 4 + i * 1.5;
                              return (
                                <div key={i} style={{
                                  width:"100%", height:`${active ? ht : Math.max(3, ht*0.3)}px`,
                                  background: active ? c.accent : "rgba(127,175,138,0.10)",
                                  borderRadius:"3px",
                                  opacity: active ? (0.55 + i * 0.09) : 0.3,
                                  transition:"height 0.6s ease, opacity 0.6s ease",
                                  alignSelf:"flex-end",
                                }} />) ; })}
                          </div>
                          <div style={{ color:"#5C8A6A", fontSize:"10px" }}>
                            {strength >= 0.9 ? "Peak movement period" : strength >= 0.7 ? "High activity" : strength >= 0.5 ? "Moderate activity" : "Quiet period"}
                          </div>
                        </div>
                        <div>
                          <div style={{ color:"#5C8A6A", fontSize:"10px", fontWeight:"700",
                            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"4px" }}>
                            Keystone Species
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {intel.keystoneSpecies.map(sp => (
                              <span key={sp} className="px-2 py-0.5 rounded-full text-xs"
                                style={{ background:`${c.accent}18`, color:c.accent,
                                  border:`1px solid ${c.accent}30` }}>{sp}</span>
                            ))}
                          </div>
                        </div>
                        {intel.movementNote && intel.movementNote[currentSeason] && (
                          <div className="rounded-lg px-3 py-2"
                            style={{ background:"rgba(127,175,138,0.06)",
                              border:"1px solid rgba(127,175,138,0.12)" }}>
                            <div style={{ color:"#5C8A6A", fontSize:"10px", fontWeight:"700",
                              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"3px" }}>
                              Movement · {currentSeason}
                            </div>
                            <p style={{ color:"#8AB8A0", fontSize:"11px", lineHeight:"1.65",
                              fontStyle:"italic" }}>{intel.movementNote[currentSeason]}</p>
                          </div>
                        )}
                        <div>
                          <div style={{ color:"#5C8A6A", fontSize:"10px", fontWeight:"700",
                            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"3px" }}>
                            Movement Pinch Points
                          </div>
                          {intel.bottlenecks.map(b => (
                            <div key={b} className="flex items-center gap-1.5 mb-1">
                              <div style={{
                                width:"6px", height:"6px", borderRadius:"50%",
                                background:"#E8A080", opacity:"0.8",
                                animation:"pulse 2.5s ease-in-out infinite",
                                flexShrink:0,
                              }} />
                              <div style={{ color:"#C4907A", fontSize:"11px", lineHeight:"1.5" }}>{b}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            ))}
          </div>

          <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#1C3A2A" }}>
            Full Watershed
          </div>
          <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: "1.7" }}>
              Orange County's hydrology is a single system. Every raindrop that falls on Santiago Peak
              finds its way to the Pacific — through one of four primary corridors. The atlas is organized
              around this movement: mountains to sea, interior to coast, canyon to estuary.
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Total watershed area", value: "~948 sq mi" },
                { label: "Elevation range",      value: "0 – 5,689 ft" },
                { label: "Primary corridors",    value: "4 canonical" },
                { label: "Coastal terminus",     value: "Pacific Ocean" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-2.5"
                  style={{ background: "rgba(28,58,42,0.06)", border: "1px solid rgba(127,175,138,0.15)" }}>
                  <div style={{ color: "#1C3A2A", fontSize: "12px", fontWeight: "700" }}>{s.value}</div>
                  <div style={{ color: "#7FAF8A", fontSize: "10px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom CTA */}
      <div className="flex gap-2 mt-2">
        <button onClick={() => navigate("/trails")}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#1C3A2A", color: "#A8D5B0", border: "1px solid #4A7C59", cursor: "pointer" }}>
          Browse All Trails
        </button>
        <button onClick={() => navigate("/species")}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
          Species Atlas
        </button>
      </div>

      {/* Atlas transparency + watershed story link */}
      <div className="mt-6 text-center space-y-2">
        <button onClick={() => navigate("/WatershedStory")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
          style={{ background:"rgba(74,124,89,0.1)", border:"1px solid rgba(127,175,138,0.2)",
            cursor:"pointer" }}>
          <span style={{ fontSize:"12px" }}>🌊</span>
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"600" }}>
            Learn the Watershed Story
          </span>
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="#9BB8A4" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ color:"#9BB8A4", fontSize:"10px", letterSpacing:"0.03em" }}>
            EarthEye OC does not track you — your location never leaves your device
          </span>
        </div>
      </div>

    <BottomNav active="map" />
    </div>
  );
}
