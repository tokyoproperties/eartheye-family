import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Habitat definitions — refined identity pass ───────────────────────────────
const HABITATS = [
  {
    id: "chaparral",
    name: "Chaparral",
    icon: "🌾",
    gradient: "linear-gradient(135deg, #6B4C2A 0%, #8B6A3A 100%)",
    accent: "#C4A055",
    identity: "Not a landscape — a fire clock. The chaparral sets its own timer, accumulates for twenty years, then resets itself through flame. Every bloom you see is the land in one of its four decades.",
    keystone: ["Coast Live Oak", "Mountain Lion", "California Scrub-Jay", "Chaparral Whitethorn", "Coastal Cactus Wren"],
    seasons: {
      spring: "The burn scars explode first — fire-follower poppies, phacelia, and whispering bells carpet the slopes before the shrubs return. In unburned chaparral, Ceanothus blooms from a hundred ridge crests simultaneously. The Wrentit is at its most vocal in April — every patch of dense chaparral has one. The air smells of sage, warm granite, and something sharp and floral.",
      summer: "Silent by 9am, impassable by 11. The oils in the shrubs are so concentrated the air tastes of sage. Heat shimmer rises off the south-facing slopes by 8am. The chaparral is not resting — it is surviving.",
      fall:   "The acorn mast drops. Scrub-Jays cache 5,000 acorns each, forget 30%, plant the next generation of oaks. The Santa Ana winds arrive — fire season opens.",
      winter: "First rain greens the slopes within 72 hours of the first significant rainfall. The seed bank activates. Fox Sparrows scratch in the leaf litter. The Wrentit never left — it sings through every cold morning from the same patch of chamise it has held all year.",
    },
    corridors: ["Mountains-to-Sea", "San Juan Creek", "Coal Canyon Wildlife Corridor"],
    corridorNote: "The chaparral is the corridor's rooftop. Mountain Lion and Mule Deer move through it to reach the riparian valleys below — especially along the Coal Canyon crossing at the 91 Freeway.",
    sarCue: "Impassable after fire. Wait 2 years before off-trail entry. The regrowth is sharper than the original shrubs.",
  },
  {
    id: "coastal-sage",
    name: "Coastal Sage Scrub",
    icon: "🌿",
    gradient: "linear-gradient(135deg, #3D5A3A 0%, #5A7A4A 100%)",
    accent: "#8AB87A",
    identity: "The most threatened habitat in California, and the most fragrant — a low, silver-green shrubland of sage and buckwheat that exists only in the 10-mile coastal strip where the Pacific cools the chaparral into something softer.",
    keystone: ["California Gnatcatcher", "Coastal Cactus Wren", "California Buckwheat", "Black Sage", "Coyote"],
    seasons: {
      spring: "The California Gnatcatcher defends its territory with a sound like a kitten's complaint. Every patch of coastal sage scrub has one pair — you can map the habitat by the calls. The buckwheat blooms rust-orange. Allen's Hummingbird display-diving on the bluff in February before anything else acknowledges spring. This is the loudest the soft chaparral ever gets.",
      summer: "The sage turns silver-gray and releases its oils slowly — the ambient scent of coastal OC in summer, noticeable before you can see the plants. Insect sound fills the silence the birds left. Katydids, crickets, and buzzing bees on the buckwheat.",
      fall:   "First rains revive the sage overnight. The smell returns — sharper now, after months of compression. Migrant warblers move through the reviving shrub layer.",
      winter: "Fox Sparrows from Alaska scratch in the sage scrub leaf litter. Hermit Thrushes move through the dense brush. The coastal sage scrub in winter is an airport for northerners — birds that breed in the boreal forest and winter in this thin strip of California coast.",
    },
    corridors: ["Newport Coast Wilderness", "Laguna Coast Wilderness", "Crystal Cove Backcountry"],
    corridorNote: "Coastal sage scrub is the ground layer of the coastal transect corridors — Crystal Cove Ridge-to-Sea and Newport Coast Wilderness both move through this habitat as their primary substrate.",
    sarCue: "A California Gnatcatcher call means you're standing in core habitat. Stay on trail. The bird's territory is 7 acres — you're in most of it.",
  },
  {
    id: "riparian",
    name: "Riparian",
    icon: "🌊",
    gradient: "linear-gradient(135deg, #1C3A2A 0%, #2D5A3A 100%)",
    accent: "#6AB87A",
    identity: "The creek corridors are the county's nervous system — ribbons of water, willow, and cottonwood threading through every other biome, the only cool path from mountain to sea in a county that reaches 110°F.",
    keystone: ["Fremont Cottonwood", "Arroyo Willow", "Least Bell's Vireo", "Two-striped Garter Snake", "Western Toad"],
    seasons: {
      spring: "Cottonwood leaf-out — chartreuse against gray canyon walls — signals Least Bell's Vireo arrival to within a few days. Yellow Warbler colonies settle into the willow thickets. Cliff Swallows return to San Juan Capistrano around March 19. Arroyo Toad calling from upper tributary pools at night. The creek corridor is at maximum song pressure — every linear foot of willow is occupied.",
      summer: "Every warm-blooded animal in a mile radius finds its way to the creek edge by midday. The riparian zone is the only functioning air conditioning in the interior.",
      fall:   "Cottonwood gold on Santiago Creek and San Juan Creek — the county's most reliable fall color, two weeks in October. Neotropical migrants stack in the canopy.",
      winter: "First rains open the creek mouths. Steelhead movement begins in the intact lower reaches of San Juan Creek. The creek is cold and clear and purposeful. The bare cottonwood canopy opens the corridor to winter light — White-crowned Sparrows and Hermit Thrushes move through the understory in flocks.",
    },
    corridors: ["Santiago Creek", "San Juan Creek", "Aliso Creek Regional Trail"],
    corridorNote: "The riparian zone IS the corridor in most of OC's interior — Santiago Creek and San Juan Creek are not just trails adjacent to riparian habitat; they are riparian habitat organized into a linear wildlife highway.",
    sarCue: "Vireo song density is the health indicator. A silent creek corridor in April means something is wrong upstream.",
  },
  {
    id: "tidal-marsh",
    name: "Tidal Marsh",
    icon: "🦅",
    gradient: "linear-gradient(135deg, #1C3A5A 0%, #2D5A7A 100%)",
    accent: "#5A9AB8",
    identity: "The bay is where the county's entire watershed comes to rest — a living tidal engine that breathes twice daily, filtering the mountain's runoff and returning it to the Pacific as clean water and protein.",
    keystone: ["Pickleweed", "Light-footed Ridgway's Rail", "Belding's Savannah Sparrow", "Pacific Dunlin", "Burrowing Owl"],
    seasons: {
      spring: "Rails call from deep in the pickleweed at dawn — a sound between a grunt and a bark, impossible to locate. Belding's Savannah Sparrow claiming every exposed mud edge with a thin electric buzz. Northbound shorebirds stacking on the bay mudflats in April. The marsh is at territorial maximum.",
      summer: "Salt stress peaks — pickleweed stores excess salt in its succulent tissue and then drops the tips. Heat pushes birds to the shadowed channel edges. The Western Sandpiper returns in late July — the bay detects fall before the land does.",
      fall:   "Pickleweed turns crimson across the mudflats. Thirty-five thousand shorebirds compress onto the bay at high tide. The October Convergence is loudest here.",
      winter: "Gray Whale offshore — visible from Dana Point as they move south. Dunlin and Long-billed Dowitcher flocks at every tidal cycle. Maximum waterfowl diversity.",
    },
    corridors: ["Upper Newport Bay", "Bolsa Chica Ecological Reserve", "Seal Beach National Wildlife Refuge"],
    corridorNote: "The tidal marsh is the terminus of all three major interior corridors — Mountains-to-Sea, San Juan Creek, and Santiago Creek all exhale into tidal or near-tidal systems. The bay is where the county's ecological energy arrives.",
    sarCue: "High-tide push compresses all birds to the upper marsh edges — the best viewing window of any tidal day. Arrive 90 minutes before high tide.",
  },
  {
    id: "beach",
    name: "Beach & Intertidal",
    icon: "🐚",
    gradient: "linear-gradient(135deg, #2A3A5A 0%, #3A4A6A 100%)",
    accent: "#7A9AB8",
    identity: "The OC coast from Seal Beach to San Clemente is a continuous tidal gradient — six intertidal zones stacked from splash to subtidal, each a complete ecological world operating on a six-hour clock.",
    keystone: ["Ochre Sea Star", "Purple Sea Urchin", "Western Snowy Plover", "Pacific Mole Crab", "Coralline Algae"],
    seasons: {
      spring: "Extreme morning minus tides — the year's best tidepool window. Grunion spawn on warm-sand beaches after the full moon. Western Snowy Plover nesting begins on the dry upper beach.",
      summer: "Bioluminescence visible in Crystal Cove surge channels on warm nights — a cold blue light in breaking waves. Minus tides shift to evening. Crowds compress shorebird habitat.",
      fall:   "Brown Pelican aggregations offshore. Surfperch schooling in the surf zone. First winter shorebirds arrive from Alaska — looking fresh and bewildered.",
      winter: "Highest wave energy of the year. Kelp wrack lines concentrate beach invertebrates and the scavengers that follow them — ravens, Sanderlings, Willets.",
    },
    corridors: ["Crystal Cove Beach Walk", "Huntington Beach Coastal Corridor", "San Clemente Pier"],
    corridorNote: "Piers function as vertical food web nodes — bait fish aggregate in pilings, bringing pelicans and cormorants above and leopard sharks below. Every OC pier is a miniature reef system.",
    sarCue: "Rogue wave zone beyond the barnacle line. The intertidal reef at low tide looks safe — it is not. Never turn your back on the ocean at Crystal Cove or Dana Point headlands.",
  },
  {
    id: "oak-woodland",
    name: "Oak Woodland",
    icon: "🌳",
    gradient: "linear-gradient(135deg, #2A3A1C 0%, #3A5A2A 100%)",
    accent: "#7AB87A",
    identity: "A single mature Coast Live Oak supports over 200 species — every grove is a complete ecological community, a 500-year-old apartment complex with no vacancies.",
    keystone: ["Coast Live Oak", "Acorn Woodpecker", "Western Scrub-Jay", "California Ground Squirrel", "Dusky-footed Woodrat"],
    seasons: {
      spring: "Catkins and new growth — the oak turns soft yellow-green for three weeks before settling to its summer dark. Warbler migration peaks in the canopy: Orange-crowned, Yellow-rumped, Wilson's all moving through. Band-tailed Pigeons arrive in flocks of 30. Acorn Woodpecker colonies at their loudest. Black-headed Grosbeak singing from the canopy in April — the richest voice in the spring oak woodland.",
      summer: "The oak woodland goes quiet by 9am — not empty, just still. Every mammal within a quarter-mile has moved into the deep canopy shadow. Mule Deer stand motionless under the largest oaks. Acorn Woodpeckers cache in the cooler morning hours, then disappear. The grove is running a shade economy.",
      fall:   "The acorn mast drives the food web. Acorn Woodpeckers cache in granary trees. Scrub-Jays plant the next generation of oaks in locations they choose deliberately. The woodland is planting its own future.",
      winter: "The grove is quieter but not empty. Spotted Towhee and Fox Sparrow scratch through the oak duff. Woodrats are active in their stick-pile cities. Rain fills the seasonal pools. The Great Horned Owl begins nesting in January — the earliest nester in the county, brooding eggs through the coldest weeks while the oaks stand bare.",
    },
    corridors: ["O'Neill Regional Park", "Santiago Oaks Regional Park", "Caspers Wilderness Park"],
    corridorNote: "Oak woodland pockets in the interior corridors function as wildlife rest stops — Mountain Lion, Mule Deer, and Bobcat all use dense oak groves as midday shelter during corridor traversal.",
    sarCue: "Dusky-footed Woodrat stick piles can exceed five feet — active wildlife nodes. A pile this size means this clearing is used at night. Good indicator of Mountain Lion presence nearby.",
  },
];

const SEASON_ICONS = { spring: "🌸", summer: "☀️", fall: "🍂", winter: "🌧" };
const SEASON_ORDER = ["spring", "summer", "fall", "winter"];

export default function Habitats() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Orange County Ecology
          </span>
        </div>
        <h1 className="font-bold mb-1"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          🌿 Habitats
        </h1>
        <p style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.7", maxWidth:"460px" }}>
          Six ecological worlds stacked coast to summit. Each one a complete biography.
        </p>
      </div>

      {/* Habitat cards */}
      <div className="space-y-4">
        {HABITATS.map(h => (
          <div key={h.id}>
            <button
              onClick={() => setActive(active === h.id ? null : h.id)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all hover:scale-[1.005] active:scale-[0.99]"
              style={{ background: h.gradient, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontSize:"22px" }}>{h.icon}</span>
                    <span style={{ color:"#F0E9D6", fontSize:"17px", fontWeight:"800",
                      letterSpacing:"-0.01em" }}>{h.name}</span>
                  </div>
                  <div style={{ color:"rgba(240,233,214,0.6)", fontSize:"11px",
                    marginLeft:"32px" }}>
                    {h.keystone.slice(0,3).join(" · ")}
                  </div>
                </div>
                <div style={{ color:"rgba(240,233,214,0.5)", fontSize:"18px",
                  transform: active === h.id ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s" }}>›</div>
              </div>
            </button>

            {active === h.id && (
              <div className="rounded-b-2xl -mt-2 pt-5 pb-5 px-5 space-y-4"
                style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
                  borderTop:"none", boxShadow:"0 4px 12px rgba(28,58,42,0.06)" }}>

                {/* Identity */}
                <p style={{ color:"#2D5A3D", fontSize:"14px", lineHeight:"1.85",
                  fontStyle:"italic", fontWeight:"500" }}>
                  "{h.identity}"
                </p>

                {/* Keystone species */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"6px" }}>
                    Keystone Species
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {h.keystone.map(sp => (
                      <span key={sp} className="px-2.5 py-1 rounded-full"
                        style={{ background:"rgba(122,184,122,0.12)", color:"#7AB87A",
                          fontSize:"11px", border:"1px solid rgba(122,184,122,0.25)" }}>
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Seasonal behavior */}
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"8px" }}>
                    Seasonal Character
                  </div>
                  <div className="space-y-3">
                    {SEASON_ORDER.map(s => (
                      <div key={s} className="flex gap-2.5">
                        <span style={{ fontSize:"14px", flexShrink:0 }}>{SEASON_ICONS[s]}</span>
                        <div>
                          <div style={{ color:"rgba(255,255,255,0.70)", fontSize:"11px",
                            fontWeight:"700", textTransform:"capitalize" }}>{s}</div>
                          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"12px",
                            lineHeight:"1.65" }}>{h.seasons[s]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corridor relationship */}
                <div className="rounded-xl px-3.5 py-3"
                  style={{ background:"rgba(74,124,89,0.07)",
                    border:"1px solid rgba(127,175,138,0.2)" }}>
                  <div style={{ color:"#4A7C59", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"4px" }}>
                    Corridor Relationship
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.70)", fontSize:"12px", lineHeight:"1.65" }}>
                    {h.corridorNote}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {h.corridors.map(co => (
                      <span key={co} className="px-2 py-0.5 rounded-full"
                        style={{ background:"rgba(122,184,122,0.10)", color:"#7AB87A",
                          fontSize:"10px", border:"1px solid rgba(122,184,122,0.20)" }}>
                        {co}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Habitat Intelligence button */}
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/HabitatDetail?type=${h.id}`); }}
                  style={{
                    width:"100%", padding:"10px 14px", borderRadius:10,
                    background:"rgba(74,124,89,0.1)", border:"1px solid rgba(74,124,89,0.25)",
                    color:"#4A7C59", fontSize:12, fontWeight:700,
                    cursor:"pointer", textAlign:"center", marginBottom:4,
                  }}>
                  🔬 Habitat Intelligence →
                </button>

                {/* SAR cue */}
                {h.sarCue && (
                  <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background:"rgba(196,151,74,0.10)", border:"1px solid rgba(196,151,74,0.25)" }}>
                    <span style={{ fontSize:"14px", flexShrink:0 }}>⚠️</span>
                    <div>
                      <div style={{ color:"#C4974A", fontSize:"10px", fontWeight:"700",
                        textTransform:"uppercase", letterSpacing:"0.07em",
                        marginBottom:"2px" }}>Field Safety</div>
                      <div style={{ color:"#7A5A1A", fontSize:"12px",
                        lineHeight:"1.6" }}>{h.sarCue}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p style={{ color:"#C4BAA8", fontSize:"11px", lineHeight:"1.6" }}>
          Each habitat is a complete world. You're visiting.
        </p>
      </div>
    </div>
  );
}