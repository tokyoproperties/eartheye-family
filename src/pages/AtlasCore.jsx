import { useNavigate } from "react-router-dom";

const ENGINES = [
  {
    id: "seasonal",
    emoji: "🌸",
    name: "Seasonal Engine",
    gradient: "linear-gradient(135deg, #2A4A2A 0%, #3A6A3A 100%)",
    description: "The seasonal engine is the temporal spine of the atlas. It maps the 12 calendar months to a named ecological phase (\"Peak Spring,\" \"October Convergence,\" \"Deep Winter\") and derives a living arc note — a single sentence of ecological truth — for each phase. Every surface in the atlas reads from this engine: the home page greeting, the companion layer message, the active species filter, the trail safety overlays.",
    dataRequirements: [
      "12 monthly phase names and descriptions",
      "12 monthly arc notes (ecological truths)",
      "Season-to-month mapping (winter/spring/summer/fall)",
      "Phase icons for visual representation",
    ],
    generalization: "Generalizes to any region with seasonal ecological variation. Replace the OC arc notes with the target region's phenological calendar. The phase names and icons are universal — only the ecological content changes.",
  },
  {
    id: "corridor",
    emoji: "🔄",
    name: "Corridor Engine",
    gradient: "linear-gradient(135deg, #1C3A2A 0%, #2D5A3A 100%)",
    description: "The corridor engine treats wildlife movement pathways as first-class data entities. Each corridor has a name, type (interior transect, coastal transect, wetland terminus, urban riparian), seasonal strength scores, keystone species IDs, and terminal points. The engine powers the map glow rings, the corridor detail pages, the species-corridor relationships in SpeciesDetail, and the seasonal movement intelligence in the Field surface.",
    dataRequirements: [
      "Corridor name, type, and role description",
      "Terminal points (geographic start and end)",
      "Seasonal strength scores (spring/summer/fall/winter, 0–1 scale)",
      "Keystone species IDs (linked to Species entity)",
      "Linked trail IDs",
      "Bottleneck coordinates (optional)",
    ],
    generalization: "Replace the five OC corridors with the target region's primary wildlife movement pathways. The engine is agnostic to region — it only needs a named set of pathways with seasonal behavior and species relationships.",
  },
  {
    id: "habitat",
    emoji: "🌿",
    name: "Habitat Engine",
    gradient: "linear-gradient(135deg, #2A3A1C 0%, #3A5A2A 100%)",
    description: "The habitat engine classifies every species and trail into a named ecological community (chaparral, riparian, tidal marsh, etc.) and provides each community with an ecological biography: an identity statement, keystone species, seasonal shifts, and corridor interactions. The engine powers the Habitats surface, the species group tags, the trail mood banners, and the biome navigation.",
    dataRequirements: [
      "Habitat name and ecological identity statement",
      "Keystone species list (3–8 species per habitat)",
      "Seasonal behavior descriptions (four seasons)",
      "Corridor cross-references",
      "Field safety notes",
      "Visual gradient (CSS gradient for mood banner)",
    ],
    generalization: "Replace the six OC habitats with the target region's dominant ecological communities. The engine structure is universal — any region with identifiable habitat zones can use this pattern.",
  },
  {
    id: "phenology",
    emoji: "📅",
    name: "Phenology Engine",
    gradient: "linear-gradient(135deg, #3A2A5A 0%, #5A3A7A 100%)",
    description: "The phenology engine tracks when a user has observed each species, building a personal ecological calendar. It records the seasons in which each species has been seen, the years of observation, and the earliest and latest sighting dates within each year. This data is stored only in the user's localStorage — never transmitted, never profiled. The engine powers the Phenology section of the Journal and the Moments layer.",
    dataRequirements: [
      "Species seasonPresence field (array of season strings per species record)",
      "Client-side localStorage schema (ee_journal_v1)",
      "Month-to-season mapping",
      "No server infrastructure required",
    ],
    generalization: "The phenology engine requires no region-specific data beyond the species seasonPresence field. Any region's species records can use this engine directly — only the species list changes.",
  },
  {
    id: "journal",
    emoji: "📘",
    name: "Journal Engine",
    gradient: "linear-gradient(135deg, #1C3A5A 0%, #2D5A7A 100%)",
    description: "The journal engine is a four-layer anonymous memory system, stored entirely in the user's browser localStorage. Layer 1 records species sighting counts and dates. Layer 2 records trail visit counts and dates. Layer 3 builds personal phenology from sighting events. Layer 4 captures ecological milestones: first-ever sightings, earliest of the year, latest of the year, trail firsts. The annual Yearbook generator snapshots each year's journal data into a separate localStorage key.",
    dataRequirements: [
      "localStorage key: ee_journal_v1 (see schema below)",
      "Species and Trail entity IDs for record linkage",
      "No server infrastructure required",
    ],
    schema: {
      speciesSightings: "{ [speciesId]: { count, lastSeen, lastSeason, lastYear } }",
      trailVisits: "{ [trailId]: { visits, lastVisit, lastSeason, lastYear } }",
      phenology: "{ [speciesId]: { seasonsSeen[], yearsSeen[] } }",
      moments: "{ firstSightings, earliestOfYear, latestOfYear, trailFirsts }",
    },
    generalization: "The journal engine is entirely region-agnostic. Any atlas built on this pattern can use the same localStorage schema and engine — only the species and trail IDs change.",
  },
  {
    id: "companion",
    emoji: "🌱",
    name: "Companion Engine",
    gradient: "linear-gradient(135deg, #3A3A1C 0%, #5A5A2A 100%)",
    description: "The companion engine generates one short, honest ecological message per session, based on the current month's arc note and the user's local journal state. It does not send messages to a server. It does not call an LLM API at runtime. It selects from a pre-authored set of 12 monthly ecological truths, adjusted by simple conditions: whether the user has zero, some, or many sightings in their journal. The result is a message that feels personal without any personal data leaving the device.",
    dataRequirements: [
      "12 monthly ecological truth messages (pre-authored)",
      "Conditional logic based on local journal state (read from localStorage)",
      "No server infrastructure required",
      "No LLM runtime calls",
    ],
    generalization: "Replace the 12 OC monthly messages with the target region's ecological calendar. The conditional logic (zero/some/many sightings) is universal. The companion engine requires no infrastructure beyond what the journal engine provides.",
  },
];

export default function AtlasCore() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Atlas Architecture · Exportable Blueprint
          </span>
        </div>
        <h1 className="font-bold mb-3"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          Atlas Core
        </h1>
        <div className="rounded-2xl px-5 py-4"
          style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
          <p style={{ color:"#C4DFC8", fontSize:"13px", lineHeight:"1.8" }}>
            EarthEye OC is built on six portable engines. Every surface, every feature, and every
            interaction is powered by one of these engines. This page documents them so that a new
            region — a new county, a new watershed, a new ecological zone — can be built by replacing
            the content while reusing the architecture.
          </p>
        </div>
      </div>

      {/* Engine cards */}
      <div className="space-y-6">
        {ENGINES.map((e, i) => (
          <div key={e.id}>
            {/* Engine header */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: e.gradient, boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:"22px" }}>{e.emoji}</span>
                  <div>
                    <div style={{ color:"rgba(240,233,214,0.5)", fontSize:"10px",
                      fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em" }}>
                      Engine {i + 1} of {ENGINES.length}
                    </div>
                    <div style={{ color:"#F0E9D6", fontSize:"17px", fontWeight:"800" }}>
                      {e.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engine body */}
            <div className="rounded-b-2xl -mt-2 px-5 pt-5 pb-5 space-y-4"
              style={{ background:"#fff", border:"1px solid #E8E0D0",
                borderTop:"none", boxShadow:"0 4px 12px rgba(28,58,42,0.04)" }}>

              {/* Description */}
              <p style={{ color:"#3D5C4A", fontSize:"13px", lineHeight:"1.8" }}>
                {e.description}
              </p>

              {/* Data requirements */}
              <div>
                <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                  textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>
                  Data Requirements
                </div>
                <ul className="space-y-1.5">
                  {e.dataRequirements.map(req => (
                    <li key={req} className="flex items-start gap-2">
                      <span style={{ color:"#7FAF8A", fontSize:"12px", flexShrink:0,
                        marginTop:"1px" }}>·</span>
                      <span style={{ color:"#5A7A6A", fontSize:"12px",
                        lineHeight:"1.6" }}>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Schema (Journal only) */}
              {e.schema && (
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>
                    localStorage Schema
                  </div>
                  <div className="rounded-xl p-3 space-y-1"
                    style={{ background:"#F9F6F0", border:"1px solid #E8E0D0" }}>
                    {Object.entries(e.schema).map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color:"#4A7C59", fontSize:"11px",
                          fontFamily:"monospace", fontWeight:"700" }}>{k}:</span>
                        <span style={{ color:"#7A8A7A", fontSize:"11px",
                          fontFamily:"monospace", marginLeft:"6px" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generalization */}
              <div className="rounded-xl px-3.5 py-3"
                style={{ background:"rgba(74,124,89,0.08)",
                  border:"1px solid rgba(127,175,138,0.2)" }}>
                <div style={{ color:"#4A7C59", fontSize:"10px", fontWeight:"700",
                  textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"4px" }}>
                  How it generalizes
                </div>
                <p style={{ color:"#3D5C4A", fontSize:"12px", lineHeight:"1.65" }}>
                  {e.generalization}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-2xl px-5 py-5 text-center"
        style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
        <div style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.8", fontStyle:"italic" }}>
          These six engines are the atlas.<br/>
          Everything else is content.
        </div>
      </div>

    </div>
  );
}
