import { useState, useEffect, useRef } from "react";
import { Species, Trail } from "@/api/entities";
import { useNavigate, useParams } from "react-router-dom";

// ── Biome definitions ────────────────────────────────────────────────────────
const BIOMES = [
  {
    id: "coastal",
    name: "Coastal Corridor",
    icon: "🌊",
    color: "#1C4A6A",
    accent: "#3D7AAA",
    bg: "#E8F4F8",
    elevation: "0 – 200 ft",
    coverage: "~40 miles of coastline",
    description: "The living edge — where terrestrial Orange County meets the Pacific. The coastal corridor is the most ecologically dynamic zone in the county: intertidal reefs, sandy beaches, cobble coves, coastal bluffs, and the PCH movement spine. It is simultaneously a migration highway, a foraging ground, a nursery, and a cultural corridor used by humans and wildlife for ten thousand years.",
    ecology: "Governed by tidal cycles, fog influence, and seasonal marine upwelling. Intertidal zones are vertical ecosystems — each tidal band hosts a distinct community. The splash zone is the most physically extreme habitat on earth: organisms must tolerate desiccation, wave shock, salinity, and temperature swings within a single tidal cycle. Kelp canopy offshore creates a three-dimensional forest that feeds the entire nearshore food web.",
    keySpecies: ["Ochre Sea Star", "California Spiny Lobster", "Brown Pelican", "Western Snowy Plover", "Mole Crab", "Coast Liveforever"],
    threats: "Beach grooming destroys wrack habitat and dune pioneer species. Light pollution disrupts grunion spawning and sea turtle orientation. Storm drain runoff carries urban toxins into tidal nurseries.",
    bestSeason: "Winter (minus tides), Fall (migrant shorebirds), Spring (grunion)",
    corridorLinks: ["69e005f2b447b8e1f109219e"],
    // Trail keyword matches for this biome
    trailKeywords: ["coast", "beach", "pier", "crystal cove", "laguna beach", "dana point", "san clemente pier", "huntington beach coastal", "newport beach boardwalk", "bolsa chica state beach", "doheny to san clemente", "aliso creek beach"],
    speciesKeywords: ["coast", "beach", "intertidal", "tidepool", "rocky shore", "sandy", "surf", "dune", "bluff", "cobble"],
  },
  {
    id: "wetlands",
    name: "Coastal Wetlands",
    icon: "🦅",
    color: "#1C3A4A",
    accent: "#2D6A7A",
    bg: "#E8F0F4",
    elevation: "0 – 50 ft",
    coverage: "~4,000 acres remaining",
    description: "The rarest and most ecologically critical habitat in Orange County. Coastal wetlands — saltmarsh, estuary, mudflat, and brackish marsh — have been reduced to less than 10% of their historical extent by coastal development. What remains is extraordinary: Newport Bay holds the largest soft-bottom estuary in Southern California, and Bolsa Chica is one of the most productive coastal wetlands on the Pacific Flyway.",
    ecology: "Wetlands are the ecological lungs of the watershed — they filter runoff, buffer storm surge, sequester carbon, and produce more biomass per acre than any other habitat type on earth. The tidal rhythm drives everything: high tide pushes fish and invertebrates into the marsh; low tide exposes the mudflat as a vast foraging table for shorebirds. Pickleweed and cordgrass are the architectural species — they build the marsh from the bottom up.",
    keySpecies: ["Belding's Savannah Sparrow", "Ridgway's Rail", "Elegant Tern", "Long-billed Curlew", "Tidewater Goby", "Pickleweed"],
    threats: "Sea level rise will inundate low marsh habitat within decades without active restoration. Invasive Spartium alterniflora (smooth cordgrass) displaces native Spartium fodens. Armored shorelines prevent marsh migration inland.",
    bestSeason: "October–November (maximum shorebird diversity), Spring (breeding season for marsh birds)",
    corridorLinks: ["69e069445c7bb4cecf803289", "69e0248656b58bca7d679d30"],
    trailKeywords: ["bay", "wetland", "ecological reserve", "sanctuary", "marsh", "seal beach", "bolsa chica ecological", "san joaquin", "talbert"],
    speciesKeywords: ["wetland", "marsh", "estuary", "saltmarsh", "mudflat", "bay", "tidal", "cordgrass", "pickleweed", "riparian", "creek"],
  },
  {
    id: "chaparral",
    name: "Chaparral & Sage Scrub",
    icon: "🌾",
    color: "#4A5C2A",
    accent: "#7A9A4A",
    bg: "#F0F4E8",
    elevation: "200 – 3,000 ft",
    coverage: "Largest single habitat type in OC",
    description: "The defining landscape of Orange County — a dense, aromatic, fire-adapted shrubland that covers more area than any other habitat type in the county. Chaparral is not a degraded landscape. It is a fully evolved ecosystem adapted to the Mediterranean fire cycle: burn, resprout, mature, burn again. The chemistry of chaparral plants — terpenes, phenols, volatile oils — defines the scent of Southern California.",
    ecology: "Chaparral is governed by fire. Most chaparral species have fire-adapted seeds that require heat or smoke chemicals to germinate. After fire, the landscape explodes with wildflower diversity unprecedented in the mature stand. The shrub canopy creates a dense understory microhabitat for rodents, snakes, and ground-nesting birds. Coyote, bobcat, and Mountain Lion use chaparral as primary hunting and movement habitat.",
    keySpecies: ["California Gnatcatcher", "Coastal Cactus Wren", "Coast Horned Lizard", "California Towhee", "Chamise", "Ceanothus"],
    threats: "Fire suppression has created dense, homogeneous stands vulnerable to catastrophic crown fire. Invasive annual grasses replace native bunchgrass in the understory, increasing fire intensity. Urban edge creates fragmentation that interrupts wildlife movement across the shrubland matrix.",
    bestSeason: "Spring (wildflower bloom after winter rain, breeding birds), Fall (seed-eating birds)",
    corridorLinks: ["69e069445c7bb4cecf803289", "69e005f2b447b8e1f109219e", "69e06ef8ae83438254c22903"],
    trailKeywords: ["wilderness", "whiting", "aliso", "caspers", "limestone", "laguna coast", "chino hills", "black star", "sycamore", "gypsum", "loma ridge", "wood canyon"],
    speciesKeywords: ["chaparral", "sage scrub", "scrub", "shrubland", "coastal sage", "manzanita", "ceanothus", "chamise"],
  },
  {
    id: "woodland",
    name: "Oak Woodland",
    icon: "🌳",
    color: "#3A2A1C",
    accent: "#7A5A3A",
    bg: "#F4F0E8",
    elevation: "500 – 3,500 ft",
    coverage: "Canyon systems and north-facing slopes",
    description: "The cathedral habitat of Orange County — ancient valley oaks and coast live oaks forming multi-layered canopies in canyon systems and on cooler north-facing slopes. Oak woodland is the highest-biodiversity terrestrial habitat in the county, supporting more bird species, more insect species, and more small mammal species per acre than any other habitat type. A single large valley oak may support over 500 insect species.",
    ecology: "The oak is the keystone species of this system — its acorns feed everything from Acorn Woodpeckers to Mule Deer to Western Scrub-Jays. The bark provides nesting cavities; the canopy provides hunting perches; the leaf litter supports decomposer fungi and beetles. Sycamore-oak woodland along creek bottoms is the most stable and species-rich riparian habitat in OC — these trees live 400+ years and create structural complexity that no other habitat matches.",
    keySpecies: ["Acorn Woodpecker", "Valley Oak", "Western Scrub-Jay", "Coast Live Oak", "Western Pond Turtle", "Ringtail"],
    threats: "Sudden Oak Death (Phytophthora ramorum) is a lethal pathogen spreading through tanoak populations statewide. Goldspotted Oak Borer has killed thousands of oaks in San Diego and is moving north. Drought stress weakens mature oaks and opens them to secondary pests.",
    bestSeason: "Spring (warbler migration through canopy), Fall (acorn crop, woodpecker activity), Winter (bare canopy reveals structure)",
    corridorLinks: ["69e06ef8ae83438254c22903"],
    trailKeywords: ["irvine regional", "santiago oaks", "o'neill", "caspers", "carbon canyon", "fullerton arboretum", "modjeska", "trabuco canyon", "holy jim", "starr ranch", "arroyo trabuco"],
    speciesKeywords: ["oak woodland", "oak", "woodland", "canyon woodland"],
  },
  {
    id: "mountains",
    name: "Santa Ana Mountains",
    icon: "⛰",
    color: "#5A3A2A",
    accent: "#9A6A4A",
    bg: "#F4EEE8",
    elevation: "1,000 – 5,689 ft",
    coverage: "Cleveland National Forest + Irvine Ranch",
    description: "The spine of Orange County — the Santa Ana Mountains are the only mountain range in Southern California that runs north-south, perpendicular to the prevailing Pacific wind. This orientation creates exceptional diversity: the west face captures marine fog and supports dense chaparral; the east face is drier and supports more xeric communities. Santiago Peak at 5,689 ft is the highest point in OC and the origin of every major watershed in the county.",
    ecology: "The mountains function as a biological pump — upslope thermal currents carry insects and aerial organisms to elevation; downslope katabatic winds push cool air into valleys and canyons. The mountain system is one of the last refugia for Mountain Lions in coastal Southern California — the Santa Anas support an isolated population that is critically compromised by genetic isolation due to the 241 freeway. The Coal Canyon crossing is the only viable wildlife movement corridor across the 91 freeway.",
    keySpecies: ["Mountain Lion", "Mule Deer", "California Condor", "Bighorn Sheep", "Western Diamondback Rattlesnake", "Jeffrey Pine"],
    threats: "The 241 toll road expansion threatens the last viable coastal sage scrub corridor in the range. Genetic isolation of the Mountain Lion population is critical — the Puma 85 lineage is experiencing inbreeding depression. Climate change is pushing the lower chaparral boundary upslope, compressing habitats.",
    bestSeason: "Spring (wildflowers, migrant birds), Fall (clear air, raptor movement), Winter (snow on peaks, solitude)",
    corridorLinks: ["69e069445c7bb4cecf803289", "69e06ef8ae83438254c22903"],
    trailKeywords: ["cleveland", "santiago peak", "saddleback", "holy jim", "black star", "trabuco", "modjeska", "chiquito", "coal canyon", "christianitos", "gypsum canyon"],
    speciesKeywords: ["mountain", "peak", "ridge", "conifer", "pine", "cleveland", "saddleback", "santiago"],
  },
  {
    id: "marine",
    name: "Marine & Kelp Forest",
    icon: "🐠",
    color: "#1C3A6A",
    accent: "#3D6AAA",
    bg: "#E8EEF8",
    elevation: "0 – -200 ft (subtidal)",
    coverage: "Offshore from Crystal Cove to Dana Point",
    description: "The submerged forest — a three-dimensional ecosystem of Giant Kelp that rivals tropical rainforests in structural complexity and productivity. OC's offshore kelp forests are among the healthiest in Southern California, anchored to basalt reefs and fed by cold, nutrient-rich upwelling currents. The kelp canopy creates a vertical habitat gradient: surface canopy, mid-water column, understory kelp, and rocky reef bottom — each supporting a distinct community.",
    ecology: "Giant Kelp grows up to two feet per day in optimal conditions — it is one of the fastest-growing organisms on earth. The kelp forest is held together by a single predator-prey relationship: sea otters eat urchins, urchins eat kelp. Remove the otter, and urchin barrens replace the forest. In OC waters, the otter is locally extinct — urchin control depends on disease cycles, storm disturbance, and human harvesting. The Garibaldi, California's state marine fish, is the ecological ambassador of the reef system.",
    keySpecies: ["Giant Kelp", "Garibaldi", "California Moray Eel", "Sheephead", "Ochre Sea Star", "Pacific Harbor Seal"],
    threats: "Marine heat waves — the 'Blob' of 2014-2016 caused catastrophic kelp die-offs across the Southern California Bight. Sea urchin barrens expand when kelp is stressed. Ocean acidification dissolves the carbonate structures of urchins, mussels, and coralline algae — the foundational species of the reef.",
    bestSeason: "Winter (clearest water visibility), Fall (minus tides expose intertidal, bioluminescence)",
    corridorLinks: ["69e005f2b447b8e1f109219e"],
    trailKeywords: ["crystal cove tidepool", "crystal cove beach", "laguna beach coast", "dana point harbor", "doheny state beach", "heisler", "newport beach boardwalk"],
    speciesKeywords: ["kelp forest", "offshore", "pelagic", "subtidal", "ocean", "marine", "open water"],
  },
];

const CORRIDOR_NAMES = {
  "69e069445c7bb4cecf803289": { name: "Mountains-to-Sea", icon: "⛰", color: "#2D5A3D" },
  "69e0248656b58bca7d679d30": { name: "Upper Newport Bay", icon: "🌊", color: "#1C4A5A" },
  "69e005f2b447b8e1f109219e": { name: "Crystal Cove", icon: "🐚", color: "#2A4A6A" },
  "69e06ef8ae83438254c22903": { name: "San Juan Creek", icon: "🌳", color: "#3A2A1C" },
};

const DIFF_COLORS = {
  easy:      { bg: "rgba(122,184,122,0.12)", text: "#7AB87A" },
  moderate:  { bg: "rgba(196,151,74,0.12)",  text: "#C4974A" },
  hard:      { bg: "rgba(196,122,122,0.12)", text: "#C47A7A" },
  strenuous: { bg: "rgba(154,122,184,0.12)", text: "#9A7AB8" },
};

const MONTH_SEASON = { 0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter" };
const SEASON_ICONS = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };

// ── Biome card (list view) ───────────────────────────────────────────────────
function BiomeCard({ biome, count, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-2xl p-4 mb-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 8px rgba(28,58,42,0.06)", cursor: "pointer" }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${biome.color}15`, border: `1px solid ${biome.color}30`, fontSize: "24px" }}>
          {biome.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ color: "rgba(255,255,255,0.88)", fontFamily: "Georgia,serif", fontSize: "15px", fontWeight: "400", marginBottom: "3px" }}>
            {biome.name}
          </div>
          <div style={{ color: "#7FAF8A", fontSize: "11px", marginBottom: "6px" }}>
            {biome.elevation} · {biome.coverage}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", lineHeight: "1.5",
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {biome.description.split("—")[0].trim()}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {count !== null && (
            <div className="px-2 py-1 rounded-lg text-center"
              style={{ background: `${biome.color}12`, border: `1px solid ${biome.color}25` }}>
              <div style={{ color: biome.accent, fontSize: "14px", fontWeight: "700" }}>{count}</div>
              <div style={{ color: "#9BB8A4", fontSize: "8px" }}>species</div>
            </div>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4BAA8" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ── Trail cross-link panel ───────────────────────────────────────────────────
function BiomeTrails({ biome, allTrails, navigate }) {
  const matched = allTrails.filter(t =>
    biome.trailKeywords.some(kw =>
      t.name?.toLowerCase().includes(kw) ||
      t.jurisdiction?.toLowerCase().includes(kw) ||
      t.habitatTypes?.some(h => h.toLowerCase().includes(kw))
    )
  );

  const [expanded, setExpanded] = useState(false);
  const display = expanded ? matched : matched.slice(0, 5);

  if (!matched.length) return null;

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.2)" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "#7FAF8A" }} />
          <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
            letterSpacing: "0.1em", textTransform: "uppercase" }}>Trails in This Biome</span>
        </div>
        <div style={{ color: "#C4DFC8", fontSize: "15px", fontWeight: "700" }}>
          {matched.length} trail{matched.length !== 1 ? "s" : ""} in the atlas
        </div>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {display.map(trail => {
          const diff = trail.difficulty?.toLowerCase() || "moderate";
          const dc   = DIFF_COLORS[diff] || DIFF_COLORS.moderate;
          return (
            <button key={trail.id}
              onClick={() => navigate(`/TrailDetail?id=${trail.id}`)}
              className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,175,138,0.08)", cursor: "pointer" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,124,89,0.15)", fontSize: "14px" }}>🥾</div>
              <div className="flex-1 min-w-0">
                <div style={{ color: "#C4DFC8", fontSize: "12px", fontWeight: "600",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {trail.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {trail.distanceMiles && <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px" }}>{trail.distanceMiles} mi</span>}
                  {trail.difficulty && (
                    <span className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: dc.bg + "30", color: dc.text, fontSize: "9px" }}>
                      {trail.difficulty}
                    </span>
                  )}
                </div>
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3A5A4A" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          );
        })}
        {matched.length > 5 && (
          <button onClick={() => setExpanded(e => !e)}
            className="w-full py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(127,175,138,0.08)", color: "#7FAF8A",
              border: "1px solid rgba(127,175,138,0.15)", cursor: "pointer" }}>
            {expanded ? "Show fewer ↑" : `Show all ${matched.length} trails ↓`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Biome detail view ────────────────────────────────────────────────────────
function BiomeDetail({ biome, speciesInBiome, allTrails, navigate, onBack }) {
  const currentSeason = MONTH_SEASON[new Date().getMonth()];
  const activeNow = speciesInBiome.filter(s => {
    const seasons = (s.seasonPresence || []).map(x => x.toLowerCase());
    return seasons.length === 0 || seasons.length >= 4 || seasons.includes(currentSeason);
  });

  return (
    <div>
      <button onClick={onBack}
        className="flex items-center gap-2 mb-5 transition-opacity hover:opacity-70"
        style={{ color: "#7FAF8A", fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        All Biomes
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-6 mb-4"
        style={{ background: `${biome.color}`, border: `1px solid ${biome.accent}50` }}>
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontSize: "36px" }}>{biome.icon}</span>
          <div>
            <div style={{ color: biome.accent, fontSize: "10px", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>OC Biome Zone</div>
            <h1 className="font-bold" style={{ color: "#F0E9D6", fontSize: "20px", letterSpacing: "-0.02em" }}>
              {biome.name}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.15)", color: "#F0E9D6" }}>{biome.elevation}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.15)", color: "#F0E9D6" }}>{biome.coverage}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,165,0,0.2)", color: "#FFD080" }}>
            Best: {biome.bestSeason.split("(")[0].trim()}
          </span>
        </div>
      </div>

      {/* Character */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>🌍</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Character</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,0.70)", fontSize: "14px", lineHeight: "1.75" }}>{biome.description}</p>
      </div>

      {/* Ecology */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>🔬</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>How It Works</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: "1.75" }}>{biome.ecology}</p>
      </div>

      {/* Active Now */}
      <div className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: "#0F2218", border: "1px solid rgba(127,175,138,0.2)" }}>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#7FAF8A" }} />
            <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
              letterSpacing: "0.1em", textTransform: "uppercase" }}>Active Here Now</span>
          </div>
          <div style={{ color: "#C4DFC8", fontSize: "15px", fontWeight: "700" }}>
            {activeNow.length} species this {currentSeason} {SEASON_ICONS[currentSeason]}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", marginTop: "2px" }}>
            {speciesInBiome.length} total in atlas for this biome
          </div>
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          {activeNow.slice(0, 5).map(s => (
            <button key={s.id} onClick={() => navigate(`/SpeciesDetail?id=${s.id}`)}
              className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(127,175,138,0.08)", cursor: "pointer" }}>
              <div style={{ color: "#C4DFC8", fontSize: "12px", fontWeight: "600", flex: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", flexShrink: 0, textTransform: "capitalize" }}>{s.group}</div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3A5A4A" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
          <button onClick={() => navigate(`/species?biome=${biome.id}`)}
            className="w-full py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(127,175,138,0.08)", color: "#7FAF8A",
              border: "1px solid rgba(127,175,138,0.15)", cursor: "pointer" }}>
            Browse all {speciesInBiome.length} species in this biome →
          </button>
        </div>
      </div>

      {/* ── TRAILS IN THIS BIOME ── */}
      <BiomeTrails biome={biome} allTrails={allTrails} navigate={navigate} />

      {/* Key Species */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span>⭐</span>
          <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.07em" }}>Key Species</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {biome.keySpecies.map(s => (
            <span key={s} className="px-2.5 py-1.5 rounded-full text-xs font-medium"
              style={{ background: `${biome.color}15`, color: biome.accent, border: `1px solid ${biome.color}40` }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Threats */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "rgba(138,58,42,0.08)", border: "1px solid rgba(138,58,42,0.25)" }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ color: "#D4A898", fontSize: "11px", fontWeight: "700",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Primary Threats</div>
            <p style={{ color: "#9A7A72", fontSize: "12px", lineHeight: "1.65" }}>{biome.threats}</p>
          </div>
        </div>
      </div>

      {/* Corridor links */}
      {biome.corridorLinks?.length > 0 && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span>🔗</span>
            <h2 style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Canonical Corridors</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {biome.corridorLinks.map(cid => {
              const c = CORRIDOR_NAMES[cid];
              if (!c) return null;
              return (
                <button key={cid} onClick={() => navigate(`/corridors/${cid}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                  style={{ background: `${c.color}20`, border: `1px solid ${c.color}40`, cursor: "pointer" }}>
                  <span style={{ fontSize: "14px" }}>{c.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.70)", fontSize: "11px", fontWeight: "600" }}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex gap-2">
        <button onClick={() => navigate(`/species?biome=${biome.id}`)}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
          style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
          Browse Species →
        </button>
        <button onClick={() => navigate("/map")}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
          Biome Map
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Biomes() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const [allSpecies, setAllSpecies] = useState([]);
  const [allTrails, setAllTrails]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── Scroll restore ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      const saved = sessionStorage.getItem("biomesScroll");
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
          sessionStorage.removeItem("biomesScroll");
        });
      }
      return () => { sessionStorage.setItem("biomesScroll", window.scrollY); };
    }
  }, [id]);

  useEffect(() => {
    Promise.all([
      Species.filter({}),
      Trail.filter({}),
    ]).then(([species, trails]) => {
      setAllSpecies(species);
      setAllTrails(trails);
      setLoading(false);
    });
  }, []);

  const getSpeciesForBiome = (biome) =>
    allSpecies.filter(s => {
      const haystack = [s.habitat, s.ecologicalRole?.join(" "), s.funFact, s.fieldCue]
        .filter(Boolean).join(" ").toLowerCase();
      return biome.speciesKeywords.some(kw => haystack.includes(kw));
    });

  const activeBiome   = id ? BIOMES.find(b => b.id === id) : null;
  const activeSpecies = activeBiome ? getSpeciesForBiome(activeBiome) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 md:max-w-3xl">
      {activeBiome ? (
        <BiomeDetail
          biome={activeBiome}
          speciesInBiome={activeSpecies}
          allTrails={allTrails}
          navigate={navigate}
          onBack={() => navigate("/biomes")}
        />
      ) : (
        <>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#7FAF8A" }} />
              <span style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "700",
                letterSpacing: "0.1em", textTransform: "uppercase" }}>OC Ecological Zones</span>
            </div>
            <h1 className="font-bold mb-1" style={{ color: "rgba(255,255,255,0.90)", fontFamily: "Georgia,serif", fontWeight: "400", fontSize: "26px", letterSpacing: "-0.01em" }}>
              Biome Encyclopedia
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>
              Six ecological zones — the character of Orange County
            </p>
          </div>

          {BIOMES.map(biome => {
            const count = loading ? null : getSpeciesForBiome(biome).length;
            return (
              <BiomeCard key={biome.id} biome={biome} count={count}
                onClick={() => navigate(`/biomes/${biome.id}`)} />
            );
          })}

          <div className="flex gap-2 mt-2">
            <button onClick={() => navigate("/map")}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
              Biome Map
            </button>
            <button onClick={() => navigate("/corridors")}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
              Corridors
            </button>
          </div>
        </>
      )}
    </div>
  );
}