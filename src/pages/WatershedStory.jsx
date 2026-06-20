import { useNavigate } from "react-router-dom";

const CHAPTERS = [
  {
    id: "begins",
    num: "I",
    emoji: "⛰",
    title: "Where Water Begins",
    gradient: "linear-gradient(135deg, #2A3A1C 0%, #3A5A2A 100%)",
    accent: "#8AB87A",
    narrative: [
      "Santiago Peak stands at 5,687 feet — the highest point in Orange County and the origin of every watershed system in the region. When a storm breaks over the Santa Ana Mountains, the first rain hits granite and chaparral simultaneously. You can smell the difference between wet granite and wet sage from fifty feet. The water that lands here will take between three days and three weeks to reach the Pacific, depending on which canyon it enters.",
      "The headwaters are not gentle. They are steep, cold, and episodic — running only after significant rainfall, then going dry for months at a time. In a dry year, you find the creek as a series of dark stains on pale rock, the memory of water rather than water itself. This boom-and-bust hydrology shapes every organism that depends on the upper watershed. The species here are specialists in scarcity.",
      "The Coast Live Oak groves at this elevation are the watershed's first filter. Their root systems slow runoff, trap sediment, and recharge the groundwater that will feed the creek systems far below. Every acorn that falls here is a deposit into the county's long-term water account. And just below the peak, the canyons narrow and the water begins to move with intention — toward the sea it has never seen.",
    ],
    species: ["Mountain Lion", "Mule Deer", "Western Scrub-Jay", "Coast Live Oak", "Acorn Woodpecker"],
    habitats: ["Chaparral", "Oak Woodland"],
    corridors: ["Mountains-to-Sea", "San Juan Creek"],
  },
  {
    id: "slows",
    num: "II",
    emoji: "🌊",
    title: "Where Water Slows",
    gradient: "linear-gradient(135deg, #1C3A2A 0%, #2D5A3A 100%)",
    accent: "#6AB88A",
    narrative: [
      "As the water descends from the peaks, the canyon walls widen and the gradient softens. Here — in the middle elevations of Santiago Canyon, Trabuco Canyon, and Holy Jim Canyon — the water slows enough to deposit the fine sediment it has been carrying. The soil deepens. The trees get taller. The sound of the creek becomes something you stop to listen to rather than step over.",
      "The Fremont Cottonwood and Arroyo Willow communities that define this zone are the most productive wildlife habitat in the county per acre. In the spring, the sound of a riparian corridor in this zone is overwhelming — Least Bell's Vireo, Yellow Warbler, and Cliff Swallow stacked vertically through the canopy, while Two-striped Garter Snakes and Western Toads work the water's edge. You can hear four or five bird species at once without turning your head.",
      "This is also where the corridors become bottlenecks. The canyon floor is narrow. Wildlife moving between the mountains and the coast must pass through these exact points. Every trail through this zone is a corridor crossing — you are walking through the same door that mountain lions, deer, and neotropical migrants all use. Which means you are, for a moment, part of the same river they're traveling.",
    ],
    species: ["Least Bell's Vireo", "Fremont Cottonwood", "Two-striped Garter Snake", "Western Toad", "Yellow Warbler"],
    habitats: ["Riparian", "Oak Woodland"],
    corridors: ["San Juan Creek", "Santiago Creek", "Aliso Creek Regional Trail"],
  },
  {
    id: "spreads",
    num: "III",
    emoji: "🌾",
    title: "Where Water Spreads",
    gradient: "linear-gradient(135deg, #3A2A1C 0%, #5A3A2A 100%)",
    accent: "#C4A055",
    narrative: [
      "Below the canyon mouths, the topography flattens and the water spreads. This is where the alluvial fan begins — a broad, gently sloping apron of sediment deposited over tens of thousands of years by streams exiting the mountains. The water slows to a walk, then to a meandering. The urgency of the mountains is gone. This is also where Orange County's cities were built, because the alluvial fan soils are the county's deepest and most productive — deep enough that you can't see the bedrock from the surface even if you try.",
      "What survives here now is fragmentary: the grassland patches at Mile Square Park, the remnant coastal sage scrub at Limestone Canyon, the riparian corridor threading through the urban core along Santiago Creek. These fragments are not decorations. They are the last functional connections between the mountain watershed and the coastal systems — the remaining pieces of a continuous landscape that was intact until fifty years ago.",
      "The Santa Ana River is the primary drainage of this zone, carrying the water of the entire inland basin through the most urbanized corridor in southern California. Despite this, the river mouth at Huntington Beach remains a functioning ecological node — shorebirds, gulls, and terns use it as a tidal interface every season. The river doesn't know it was supposed to have been erased. It just keeps moving toward the sea.",
    ],
    species: ["Coyote", "American Kestrel", "Western Meadowlark", "Burrowing Owl", "Arroyo Chub"],
    habitats: ["Coastal Sage Scrub", "Riparian"],
    corridors: ["Santiago Creek", "Coal Canyon Wildlife Corridor"],
  },
  {
    id: "meets-sea",
    num: "IV",
    emoji: "🌊",
    title: "Where Water Meets the Sea",
    gradient: "linear-gradient(135deg, #1C3A5A 0%, #2D5A7A 100%)",
    accent: "#6AAAD0",
    narrative: [
      "The watershed exhales at three distinct points: the Santa Ana River mouth at Huntington Beach, Upper Newport Bay, and the San Juan Creek estuary at Doheny State Beach. Each arrival is different in tone. The river mouth is abrupt — fresh water hitting salt water in a visible seam. The bay is gradual — a tidal engine that processes the watershed slowly, through mud and cordgrass and six-hour cycles. The creek estuary is quiet — a small delta where fresh and salt water negotiate in whispers.",
      "Upper Newport Bay is the county's most important ecological terminus. It is where the entire northern watershed system — Santiago Peak, Santiago Canyon, Santiago Creek — finally rests after its journey to the sea. The bay's 752 acres of open water, mudflat, and salt marsh support 35,000+ shorebirds in peak fall. On a high tide in October, the entire mudflat surface disappears, and every bird in the system compresses to the pickleweed edge, shoulder to shoulder — a wall of life at the water's margin.",
      "The tidal cycle here runs in reverse of everything upstream. The mountain watershed is episodic — it runs only when it rains, and goes dry the rest of the time. The bay breathes twice every day without fail, regardless of season, regardless of rainfall, regardless of year. The Pickleweed, the Ridgway's Rail, and the Belding's Savannah Sparrow have organized their entire lives around this six-hour rhythm. They are the living proof that the water made it.",
    ],
    species: ["Ridgway's Rail", "Pickleweed", "Belding's Savannah Sparrow", "Brown Pelican", "Pacific Dunlin"],
    habitats: ["Tidal Marsh", "Beach & Intertidal"],
    corridors: ["Upper Newport Bay", "Mountains-to-Sea", "San Juan Creek"],
  },
];

export default function WatershedStory() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Santiago Peak → Pacific · Watershed Narrative
          </span>
        </div>
        <h1 className="font-bold mb-2"
          style={{ color:"#1C3A2A", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.02em" }}>
          The Watershed Story
        </h1>
        <p style={{ color:"#7FAF8A", fontSize:"14px", lineHeight:"1.75", maxWidth:"480px",
          fontStyle:"italic" }}>
          "Every trail in the atlas is a moment in this journey — from granite summit to tidal mud."
        </p>
      </div>

      {/* Chapters */}
      <div className="space-y-8">
        {CHAPTERS.map((ch, i) => (
          <div key={ch.id}>
            {/* Chapter header */}
            <div className="rounded-2xl overflow-hidden mb-0"
              style={{ background: ch.gradient, boxShadow:"0 2px 12px rgba(0,0,0,0.12)" }}>
              <div className="px-5 py-5">
                <div style={{ color:"rgba(240,233,214,0.5)", fontSize:"11px", fontWeight:"800",
                  letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"4px" }}>
                  Chapter {ch.num}
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:"24px" }}>{ch.emoji}</span>
                  <h2 style={{ color:"#F0E9D6", fontSize:"20px", fontWeight:"800",
                    letterSpacing:"-0.01em" }}>{ch.title}</h2>
                </div>
              </div>
            </div>

            {/* Chapter body */}
            <div className="rounded-b-2xl px-5 pt-5 pb-5 -mt-2 space-y-4"
              style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)",
                borderTop:"none", boxShadow:"0 4px 12px rgba(28,58,42,0.04)" }}>

              {/* Narrative paragraphs */}
              {ch.narrative.map((para, j) => (
                <p key={j} style={{ color: j === 0 ? "#2D5A3D" : "#5A7A6A",
                  fontSize:"14px", lineHeight:"1.8",
                  fontWeight: j === 0 ? "500" : "400" }}>
                  {para}
                </p>
              ))}

              {/* Key species */}
              <div>
                <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                  textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"6px" }}>
                  Key Species of this Stage
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ch.species.map(sp => (
                    <span key={sp} className="px-2.5 py-1 rounded-full"
                      style={{ background:"rgba(122,184,122,0.12)", color:"#7AB87A",
                        fontSize:"11px", border:"1px solid #B0D4BE" }}>
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Habitats + Corridors */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"5px" }}>
                    Habitats
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.habitats.map(h => (
                      <span key={h} className="px-2.5 py-1 rounded-full"
                        style={{ background:"rgba(122,184,122,0.10)", color:"#7AB87A",
                          fontSize:"11px", border:"1px solid rgba(255,255,255,0.07)" }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ color:"#9BB8A4", fontSize:"10px", fontWeight:"700",
                    textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"5px" }}>
                    Corridors
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.corridors.map(co => (
                      <span key={co} className="px-2.5 py-1 rounded-full"
                        style={{ background:"rgba(122,184,122,0.12)", color:"#7AB87A",
                          fontSize:"11px", border:"1px solid #B0D4BE" }}>
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter connector */}
            {i < CHAPTERS.length - 1 && (
              <div className="flex flex-col items-center py-2">
                <div style={{ width:"1px", height:"24px", background:"#D4C9B0" }} />
                <div style={{ color:"#C4BAA8", fontSize:"11px" }}>↓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 px-4 py-4 rounded-2xl text-center"
        style={{ background:"#1C3A2A", border:"1px solid rgba(127,175,138,0.2)" }}>
        <div style={{ color:"#7FAF8A", fontSize:"13px", lineHeight:"1.7", fontStyle:"italic" }}>
          The watershed doesn't know the county's borders.<br/>
          It only knows gravity.
        </div>
      </div>

    </div>
  );
}