import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Species, Observation } from "@/api/entities";
import BottomNav from "./BottomNav";

// ── Sky Engine ────────────────────────────────────────────────────────────────

// Moon phase calculation (Julian date method)
function getMoonPhase(date = new Date()) {
  const JD = date / 86400000 + 2440587.5;
  const phase = ((JD - 2451550.1) / 29.530588861) % 1;
  const p = phase < 0 ? phase + 1 : phase;
  const pct = Math.round(p * 100);
  let name, icon, ecology;
  if (p < 0.033)      { name="New Moon";        icon="🌑"; ecology="new"; }
  else if (p < 0.242) { name="Waxing Crescent"; icon="🌒"; ecology="crescent"; }
  else if (p < 0.258) { name="First Quarter";   icon="🌓"; ecology="quarter"; }
  else if (p < 0.467) { name="Waxing Gibbous";  icon="🌔"; ecology="gibbous"; }
  else if (p < 0.533) { name="Full Moon";        icon="🌕"; ecology="full"; }
  else if (p < 0.742) { name="Waning Gibbous";  icon="🌖"; ecology="waning_gibbous"; }
  else if (p < 0.758) { name="Last Quarter";    icon="🌗"; ecology="quarter"; }
  else if (p < 0.967) { name="Waning Crescent"; icon="🌘"; ecology="crescent"; }
  else                 { name="New Moon";        icon="🌑"; ecology="new"; }
  // Illumination (rough) — peaks at full, zero at new
  const illumination = Math.round(Math.abs(Math.cos(p * 2 * Math.PI)) * 100);
  return { phase: p, pct, name, icon, illumination, ecology };
}

// Approximate sunrise/sunset for OC latitude (33.7°N)
function getSunTimes(date = new Date()) {
  // Use device local UTC offset — respects PDT/PST automatically in browser
  const tzOffsetH = -date.getTimezoneOffset() / 60; // PDT = -7, PST = -8
  const lon = -117.8; // OC longitude (west = negative)
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);
  const eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const lat = 33.7 * (Math.PI / 180);
  const decl = 23.45 * Math.sin(B) * (Math.PI / 180);
  const ha = Math.acos(-Math.tan(lat) * Math.tan(decl)) * (180 / Math.PI);
  // lon * 4 converts degrees to minutes (each degree longitude = 4 min)
  const noonUTC   = 720 - eqTime - (lon * 4);
  const noonLocal = noonUTC + tzOffsetH * 60;
  const sunriseMin = noonLocal - ha * 4;
  const sunsetMin  = noonLocal + ha * 4;
  const fmt = m => {
    const total = ((m % 1440) + 1440) % 1440;
    const h  = Math.floor(total / 60);
    const mn = Math.round(total % 60);
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(mn).padStart(2,"0")} ${h >= 12 ? "pm" : "am"}`;
  };
  const daylightDecimal = (sunsetMin - sunriseMin) / 60;
  const daylightH = Math.floor(daylightDecimal);
  const daylightM = Math.round((daylightDecimal - daylightH) * 60);
  const daylight = daylightM > 0 ? `${daylightH}h ${daylightM}m` : `${daylightH}h`;
  return { sunrise: fmt(sunriseMin), sunset: fmt(sunsetMin), daylight, sunriseMin, sunsetMin };
}

const MONTH_SEASON = [
  "winter","winter","spring","spring","spring",
  "summer","summer","summer","fall","fall","fall","winter"
];
const SEASON_ICON  = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const SEASON_COLOR = { spring:"#4A9A5A", summer:"#D4883A", fall:"#8A5A2A", winter:"#3A6A9A" };
const MONTH_NAMES  = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// ── Sky Knowledge Base ────────────────────────────────────────────────────────
const CONSTELLATIONS = [
  {
    id:"orion", name:"Orion", icon:"⭐",
    direction:"South", riseMonths:"Nov–Mar", season:"winter",
    navUse:"Orion's Belt (3 stars) points east–west. The belt rises due east and sets due west — the most reliable E/W line in the sky.",
    ecology:"Winter raptor migration peaks when Orion is overhead. Marine upwelling season begins. Great Horned Owl nesting underway.",
    keyStars:["Betelgeuse (red giant, NE corner)","Rigel (blue-white, SW corner)","Orion's Belt (3 aligned stars — E↔W axis)"],
    ocSpecies:["Great Horned Owl","Red-tailed Hawk","American Kestrel","Peregrine Falcon"],
    fieldCue:"Face south on a clear winter night — the three-star belt is unmistakable at 45–60° elevation from OC.",
  },
  {
    id:"big-dipper", name:"Big Dipper (Ursa Major)", icon:"🌀",
    direction:"North", riseMonths:"Year-round (circumpolar)", season:"all",
    navUse:"The two outer stars of the dipper's bowl (Merak and Dubhe) point directly to Polaris — true north. Distance = 5× the pointer star spacing.",
    ecology:"Circumpolar — visible every night. Spring: handle points up (evening), signaling warbler migration. Fall: handle points down.",
    keyStars:["Dubhe (pointer star, outer rim)","Merak (pointer star, inner rim)","Handle curves away from bowl — follow to Arcturus in spring"],
    ocSpecies:["Allen's Hummingbird (spring signal)","Yellow Warbler (spring migration)","Pacific-slope Flycatcher"],
    fieldCue:"Always visible from OC. In spring evenings, the handle arcs toward the SE — follow the arc to Arcturus, then 'speed' to Spica.",
  },
  {
    id:"polaris", name:"Polaris (North Star)", icon:"🧭",
    direction:"True North", riseMonths:"Year-round (stationary)", season:"all",
    navUse:"Marks true north within 0.7° — accurate enough for land navigation. Altitude above horizon = your latitude (33.7° for OC — roughly fist-width at arm's length above horizon).",
    ecology:"The anchor all migratory birds use. Warblers, shorebirds, and raptors orient their nocturnal migration to Polaris. The one fixed point in the sky.",
    keyStars:["Located at end of Little Dipper's handle","Found by following Big Dipper's outer bowl stars × 5 their spacing"],
    ocSpecies:["Warbler migrants (all species)","Shorebird migrants","Monarch Butterfly"],
    fieldCue:"From OC, Polaris sits about 34° above the northern horizon — roughly three fist-widths at arm's length. Never moves.",
  },
  {
    id:"scorpius", name:"Scorpius", icon:"🦂",
    direction:"South–Southeast", riseMonths:"May–Sep", season:"summer",
    navUse:"Scorpius rises opposite Orion — when one is up, the other is below horizon. Antares marks the heart: bright red-orange, unmistakable in summer south.",
    ecology:"Signals marine upwelling peak (May–Aug). Least Tern nesting. Western Snowy Plover breeding. Kelp canopy at maximum. Bioluminescence season opens.",
    keyStars:["Antares (heart — bright red, magnitude 1.0)","Curved tail hooks south","Visible above horizon June through September from OC"],
    ocSpecies:["Least Tern","Western Snowy Plover","Kelp Bass","Lingulodinium polyedra (bioluminescence)"],
    fieldCue:"Look due south in July around 10pm. Antares glows distinctly red — brighter than anything nearby. The curved tail hooks east.",
  },
  {
    id:"pleiades", name:"Pleiades (Seven Sisters)", icon:"✨",
    direction:"East (rising) → West (setting)", riseMonths:"Sep–Apr", season:"fall/winter",
    navUse:"Tiny dipper-shaped cluster in Taurus. Rise in the east each fall — the most widely used planting/harvest calendar marker across cultures.",
    ecology:"Pleiades rising in the east at dusk = fall transition. Amphibian dormancy begins. Raptor migration peaks. First rains in OC trigger seed germination in chaparral.",
    keyStars:["Cluster of 6–7 visible stars (over 1,000 actual)","Located in Taurus, preceding Orion in the sky","Rise 2 hours before Orion each night"],
    ocSpecies:["Coast Horned Lizard (entering dormancy)","California Newt (first rains)","Red-tailed Hawk (migration peak)","Monarch Butterfly"],
    fieldCue:"Look east in October at 9pm — small, tight cluster of blue-white stars. Test your vision: most people see 6, some see 7.",
  },
  {
    id:"summer-triangle", name:"Summer Triangle", icon:"🔺",
    direction:"Overhead → West", riseMonths:"Jun–Oct", season:"summer",
    navUse:"Three stars (Vega, Deneb, Altair) form a large triangle overhead in summer. Deneb marks northeast; Altair marks south. Milky Way runs through the center.",
    ecology:"When the Summer Triangle is overhead (July–August), the Milky Way is at its most visible band. Bat foraging peaks. Marine layer nights suppress bird activity. Bioluminescence windows open.",
    keyStars:["Vega (brightest, northwest)","Deneb (northeast — Cygnus, the Swan)","Altair (south — Aquila, the Eagle)"],
    ocSpecies:["Mexican Free-tailed Bat","Pallid Bat","Lesser Nighthawk","Pacific Tree Frog (night chorus)"],
    fieldCue:"In August at 10pm, look straight up — the three brightest stars overhead form this triangle. The Milky Way band runs through Deneb.",
  },
  {
    id:"southern-cross", name:"Milky Way Core", icon:"🌌",
    direction:"South", riseMonths:"Jun–Aug (best)", season:"summer",
    navUse:"The Milky Way band aligns roughly N–S in summer, with the galactic core in the south (Sagittarius). A natural orientation line used by bird migrants.",
    ecology:"Bird migrants use the Milky Way as an orientation reference at night. Peak visibility coincides with peak summer raptor and shorebird migration. Moths navigate by polarized moonlight, also confused by artificial light.",
    keyStars:["Galactic core in Sagittarius (teapot asterism)","Cygnus overhead (summer)","Scorpius frame marks the southern edge"],
    ocSpecies:["Warbler migrants","Western Sandpiper (southbound July)","Mexican Free-tailed Bat","Moths (Sphinx, Noctuid families)"],
    fieldCue:"Requires dark sky — Santiago Peak or Caspers at new moon. Look south for a cloudy band rising from the horizon. The 'steam' from Sagittarius's teapot = galactic core.",
  },
];

const MOON_ECOLOGY = {
  new: {
    name:"New Moon", icon:"🌑", illumination:0,
    ecology:[
      "Darkest nights — bats dominate insect hunting. Mexican Free-tailed and Pallid Bats at peak efficiency.",
      "Moth flight activity surges — darkness is their primary protection from visual predators.",
      "Predatory fish (Halibut, Leopard Shark) less active near surface without moonlight gradient.",
      "Pacific Tree Frog chorus loudest — no moon suppression of calling.",
      "Owl hunting efficiency highest in open habitat.",
      "Best night for Milky Way observation from dark sky sites.",
    ],
    humanEffect:"Melatonin production peaks. Sleep deepens. The body reads full darkness as true night.",
  },
  crescent: {
    name:"Crescent", icon:"🌒", illumination:25,
    ecology:[
      "Moth navigation strongest — crescent moonlight provides orientation without suppression.",
      "Bat activity still high. Insect emergence strong.",
      "Coastal predators beginning to use moonlight gradient in surf zone.",
      "Bird nocturnal migration active — stars visible, some moonlight for orientation.",
    ],
    humanEffect:"Transition phase. Sleep architecture beginning to shift.",
  },
  quarter: {
    name:"Quarter Moon", icon:"🌓", illumination:50,
    ecology:[
      "Marine foraging shifts — fish and crustaceans begin responding to moonlight at the surface.",
      "Bat hunting adapts — switching to edge habitat where moonlight contrasts with shadow.",
      "Insect activity begins suppressing slightly on lit surfaces.",
      "Coyote hunting patterns shift toward lit-edge zones.",
    ],
    humanEffect:"Sleep latency may increase slightly. Circadian signal remains clear.",
  },
  gibbous: {
    name:"Waxing Gibbous", icon:"🌔", illumination:75,
    ecology:[
      "Prey species (rabbits, mice, deer mice) reduce open-ground activity.",
      "Predators shift strategy — using moonlight to their advantage in open habitat.",
      "Coastal grunion run timing influenced by gibbous phase.",
      "Insect emergence reduced in open, moonlit areas.",
    ],
    humanEffect:"Some disruption to sleep onset, particularly in outdoor sleepers.",
  },
  full: {
    name:"Full Moon", icon:"🌕", illumination:100,
    ecology:[
      "Prey animals (rabbits, small mammals) dramatically reduce open-ground movement. Mountain Lions hunt less in open terrain.",
      "Predators shift to dense cover edges — moonlit clearing becomes a kill zone.",
      "Coral spawning in tropical waters — triggered by full moon light cues.",
      "Grunion run: spawning peaks on beaches the night of and after full moon, March–August.",
      "Sea turtles use full moon reflection to orient hatchlings toward ocean.",
      "Pacific Tree Frog calling suppressed — they avoid lit areas.",
    ],
    humanEffect:"Documented reduction in slow-wave and REM sleep. Melatonin dips slightly. Some people report light sleep or vivid dreams.",
  },
  waning_gibbous: {
    name:"Waning Gibbous", icon:"🌖", illumination:75,
    ecology:[
      "Prey species begin returning to open ground — moonlight shifting later in the night.",
      "Early-morning hunters (coyotes, raptors) benefit from moonlit pre-dawn foraging.",
      "Coastal bird feeding windows shifting earlier.",
    ],
    humanEffect:"Sleep begins recovering as full moon passes.",
  },
};

const SKY_PHENOLOGY = [
  {
    event:"Orion rises (Nov)", skyKey:"Orion", month:10,
    species:["Great Horned Owl","Red-tailed Hawk","American Kestrel","Peregrine Falcon"],
    ecology:"Winter raptor migration fully underway. Great Horned Owl pairs beginning courtship calls. First cold fronts push waterfowl into OC wetlands.",
  },
  {
    event:"Pleiades dusk rise (Oct)", skyKey:"Pleiades", month:9,
    species:["California Newt","Coast Horned Lizard","Monarch Butterfly","Red-tailed Hawk"],
    ecology:"Fall transition marker. Amphibians entering dormancy. First rains trigger chaparral seed germination. Monarch migration southbound through OC coast.",
  },
  {
    event:"Scorpius peak (Jul)", skyKey:"Scorpius", month:6,
    species:["Least Tern","Western Snowy Plover","Bioluminescent Plankton","Kelp Bass"],
    ecology:"Marine upwelling peak. Bioluminescence season open in Crystal Cove surge channels. Least Tern fledglings on Bolsa Chica.",
  },
  {
    event:"Summer Triangle overhead (Aug)", skyKey:"Summer Triangle", month:7,
    species:["Mexican Free-tailed Bat","Pallid Bat","Lesser Nighthawk","Pacific Tree Frog"],
    ecology:"Peak bat foraging night. Milky Way overhead at new moon. Marine layer active. Night insects at annual maximum.",
  },
  {
    event:"Milky Way core visible (Jun–Aug)", skyKey:"Milky Way Core", month:6,
    species:["Warbler migrants","Western Sandpiper","Noctuid Moths"],
    ecology:"Bird migration orientation using galactic plane. Moths navigating by polarized moonlight. Darkest OC nights at new moon + marine layer.",
  },
  {
    event:"Big Dipper handle up / spring (Mar)", skyKey:"Big Dipper", month:2,
    species:["Allen's Hummingbird","Pacific-slope Flycatcher","Yellow Warbler","Pacific Tree Frog"],
    ecology:"Spring migration begins. Allen's Hummingbird already defending sage territories. Tree Frog chorus peak. Arc to Arcturus visible — 'spring star.'",
  },
  {
    event:"Polaris altitude (year-round)", skyKey:"Polaris", month:-1,
    species:["Warbler migrants","Monarch Butterfly","Western Sandpiper"],
    ecology:"All nocturnally migrating species orient to Polaris. Monarch butterflies use sun compass by day, stars by night. The fixed anchor of the migratory sky.",
  },
];

const NAVIGATION_CARDS = [
  {
    title:"Find True North — Polaris Method",
    steps:[
      "Find the Big Dipper (7-star ladle shape in the north)",
      "Locate the two outer stars of the bowl (Merak and Dubhe)",
      "Draw a line through them, extending north by 5× their spacing",
      "That star — alone, moderately bright — is Polaris",
      "Polaris is true north. From OC, it sits ~34° above the northern horizon",
    ],
    cue:"Hold your fist at arm's length: one fist ≈ 10°. Three fists from the northern horizon = Polaris.",
    icon:"🧭",
  },
  {
    title:"Find East & West — Orion's Belt",
    steps:[
      "Identify Orion in the southern winter sky (3 stars in a straight line = the belt)",
      "The leftmost belt star (Mintaka) rises due east — no matter your latitude",
      "The rightmost belt star (Alnitak) sets due west",
      "This works anywhere on Earth, year-round in winter",
    ],
    cue:"Winter only (Nov–Mar from OC). If you're lost in winter, find the belt and you know east from west.",
    icon:"📍",
  },
  {
    title:"Arc to Arcturus — Spring Navigation",
    steps:[
      "Find the Big Dipper — high in the north in spring evenings",
      "Follow the curve of the handle outward (arc south)",
      "The first bright star you reach = Arcturus (bright orange-yellow)",
      "Continue the arc: 'speed' to Spica (blue-white, lower south)",
      "Arcturus = northeast, Spica = southeast — quick spring orientation",
    ],
    cue:"'Arc to Arcturus, speed to Spica' — spring navigation mnemonic.",
    icon:"🌿",
  },
  {
    title:"Estimate Your Latitude — Polaris Altitude",
    steps:[
      "Face north and find Polaris",
      "Estimate its angle above the horizon",
      "That angle = your latitude (OC ≈ 33–34°)",
      "Use your fist: three fists + four fingers above the horizon from OC",
    ],
    cue:"Sailors used this for 500 years. Still works.",
    icon:"⚓",
  },
];

// ── reduceSky() ───────────────────────────────────────────────────────────────
function reduceSky({ date, observations, species }) {
  const now = date || new Date();
  const month = now.getMonth();
  const season = MONTH_SEASON[month];
  const moon = getMoonPhase(now);
  const sun  = getSunTimes(now);

  // Active constellations for current season
  const activeConstellations = CONSTELLATIONS.filter(c =>
    c.season === "all" || c.season === season || c.season.includes(season)
  );

  // Sky phenology events for current month (±1)
  const skyPhenology = SKY_PHENOLOGY.filter(e =>
    e.month === -1 || Math.abs(e.month - month) <= 1
  );

  // Moon ecology
  const moonEco = MOON_ECOLOGY[moon.ecology] || MOON_ECOLOGY["crescent"];

  // Night species from observations
  const nightGroups = ["mammal","insect","arachnid","amphibian"];
  const nightSpecies = species.filter(s =>
    nightGroups.includes(s.group?.toLowerCase()) &&
    (s.seasonPresence||[]).map(x=>x.toLowerCase()).includes(season)
  ).slice(0, 8);

  // Civil twilight: ~30 min after sunset, ~30 min before sunrise
  // Night species active: after civil dusk or before civil dawn
  const nowMinLocal = now.getHours() * 60 + now.getMinutes();
  const civilDusk   = sun.sunsetMin  + 30; // 30 min after sunset
  const civilDawn   = sun.sunriseMin - 30; // 30 min before sunrise
  const isNight = nowMinLocal >= civilDusk || nowMinLocal <= civilDawn;

  return { season, month, moon, sun, activeConstellations,
    skyPhenology, moonEco, nightSpecies, isNight,
    moonPhaseLine: CONSTELLATIONS.slice(0,3) };
}

// Pre-computed star positions — stable, no Math.random() in render
const STAR_POSITIONS = [
  {top:8,left:12,big:false,opacity:0.6},{top:15,left:35,big:true,opacity:0.8},
  {top:5,left:60,big:false,opacity:0.5},{top:22,left:78,big:false,opacity:0.7},
  {top:10,left:90,big:true,opacity:0.9},{top:30,left:5,big:false,opacity:0.4},
  {top:18,left:48,big:false,opacity:0.6},{top:40,left:25,big:true,opacity:0.5},
  {top:35,left:70,big:false,opacity:0.7},{top:12,left:20,big:false,opacity:0.8},
  {top:45,left:88,big:false,opacity:0.4},{top:25,left:55,big:true,opacity:0.6},
  {top:50,left:40,big:false,opacity:0.5},{top:8,left:75,big:false,opacity:0.7},
  {top:38,left:95,big:true,opacity:0.8},{top:20,left:3,big:false,opacity:0.5},
  {top:55,left:15,big:false,opacity:0.6},{top:42,left:62,big:true,opacity:0.7},
  {top:28,left:82,big:false,opacity:0.4},{top:60,left:30,big:false,opacity:0.8},
  {top:15,left:42,big:false,opacity:0.5},{top:48,left:72,big:true,opacity:0.6},
  {top:33,left:10,big:false,opacity:0.7},{top:65,left:55,big:false,opacity:0.4},
  {top:52,left:85,big:false,opacity:0.8},{top:7,left:50,big:true,opacity:0.5},
  {top:70,left:20,big:false,opacity:0.6},{top:44,left:45,big:false,opacity:0.7},
  {top:58,left:92,big:true,opacity:0.5},{top:22,left:68,big:false,opacity:0.8},
  {top:75,left:38,big:false,opacity:0.4},{top:62,left:8,big:false,opacity:0.6},
  {top:30,left:95,big:true,opacity:0.7},{top:18,left:28,big:false,opacity:0.5},
  {top:80,left:65,big:false,opacity:0.8},{top:55,left:48,big:false,opacity:0.4},
  {top:40,left:80,big:true,opacity:0.6},{top:72,left:75,big:false,opacity:0.7},
  {top:12,left:88,big:false,opacity:0.5},{top:85,left:30,big:false,opacity:0.6},
];

// ── Components ─────────────────────────────────────────────────────────────────
function SkyHeader({ intel }) {
  const { season, month, moon, sun } = intel;
  const sc = SEASON_COLOR[season] || "#4A7A9A";
  return (
    <div style={{ background:"linear-gradient(180deg,#020810,#0A1520)", padding:"20px 16px 0" }}>
      {/* Starfield dots — stable positions, no random in render */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:200,
        pointerEvents:"none", overflow:"hidden" }}>
        {STAR_POSITIONS.map((s,i) => (
          <div key={i} style={{
            position:"absolute",
            top:`${s.top}%`, left:`${s.left}%`,
            width: s.big?"2px":"1px", height: s.big?"2px":"1px",
            borderRadius:"50%", background:"rgba(255,255,255,0.90)",
            opacity: s.opacity,
          }} />
        ))}
      </div>

      {/* Season + month */}
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:18 }}>{SEASON_ICON[season]}</span>
          <div style={{ color: sc, fontSize:11, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.1em" }}>
            Sky Intelligence · {MONTH_NAMES[month]}
          </div>
        </div>

        {/* Moon */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, lineHeight:1 }}>{moon.icon}</div>
            <div style={{ color:"#8AA8C8", fontSize:9, marginTop:3, fontWeight:600 }}>
              {moon.name}
            </div>
          </div>
          <div>
            <div style={{ color:"#F0E9D6", fontSize:20, fontWeight:800, lineHeight:1.1 }}>
              {moon.illumination}% lit
            </div>
            <div style={{ color:"#4A6A8A", fontSize:11, marginTop:3 }}>
              Sunrise {intel.sun.sunrise} · Sunset {intel.sun.sunset}
            </div>
            <div style={{ color:"#3A5A7A", fontSize:10, marginTop:1 }}>
              {intel.sun.daylight} daylight · {season} sky
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoonEcoPanel({ moonEco }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:"#0A1520", border:"1px solid rgba(100,150,200,0.15)",
      borderRadius:14, overflow:"hidden" }}>
      <button onClick={() => setExpanded(e=>!e)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"12px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:20 }}>{moonEco.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ color:"#A8C8E8", fontSize:12, fontWeight:700 }}>{moonEco.name}</div>
          <div style={{ color:"#3A5A7A", fontSize:10, marginTop:1 }}>Night ecology effects</div>
        </div>
        <div style={{ color:"#3A5A7A", fontSize:14,
          transform:expanded?"rotate(180deg)":"none", transition:"transform 0.2s" }}>›</div>
      </button>
      {expanded && (
        <div style={{ padding:"0 14px 14px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {moonEco.ecology.map((e,i) => (
              <div key={i} style={{ display:"flex", gap:8,
                padding:"6px 8px", background:"rgba(100,150,200,0.04)",
                borderRadius:8, border:"1px solid rgba(100,150,200,0.08)" }}>
                <div style={{ color:"#4A6A8A", fontSize:12, flexShrink:0 }}>·</div>
                <div style={{ color:"#8AAAC8", fontSize:11, lineHeight:1.6 }}>{e}</div>
              </div>
            ))}
          </div>
          {moonEco.humanEffect && (
            <div style={{ marginTop:8, padding:"8px 10px",
              background:"rgba(180,160,120,0.06)", borderRadius:8,
              border:"1px solid rgba(180,160,120,0.12)" }}>
              <div style={{ color:"#C4A870", fontSize:9, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>
                👤 Human biology
              </div>
              <div style={{ color:"#9A8860", fontSize:11, lineHeight:1.6 }}>
                {moonEco.humanEffect}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConstellationCard({ c, navigate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:"#0A1520", border:"1px solid rgba(100,150,200,0.12)",
      borderRadius:12, overflow:"hidden" }}>
      <button onClick={() => setExpanded(e=>!e)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"11px 13px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:18 }}>{c.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#C8DCF0", fontSize:12, fontWeight:700 }}>{c.name}</div>
          <div style={{ color:"#3A5A7A", fontSize:10, marginTop:1 }}>
            {c.direction} · {c.riseMonths}
          </div>
        </div>
        <div style={{ color:"#3A5A7A", fontSize:14,
          transform:expanded?"rotate(180deg)":"none", transition:"transform 0.2s" }}>›</div>
      </button>
      {expanded && (
        <div style={{ padding:"0 13px 13px", display:"flex", flexDirection:"column", gap:8 }}>
          {/* Navigation use */}
          <div style={{ padding:"8px 10px", background:"rgba(74,154,90,0.06)",
            border:"1px solid rgba(74,154,90,0.15)", borderRadius:8 }}>
            <div style={{ color:"#4A9A5A", fontSize:9, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>
              🧭 Navigation
            </div>
            <div style={{ color:"#7AAA8A", fontSize:11, lineHeight:1.6 }}>{c.navUse}</div>
          </div>
          {/* Ecology */}
          <div style={{ padding:"8px 10px", background:"rgba(100,150,200,0.04)",
            border:"1px solid rgba(100,150,200,0.1)", borderRadius:8 }}>
            <div style={{ color:"#5A8AAA", fontSize:9, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>
              🌿 Ecology signal
            </div>
            <div style={{ color:"#6A9ABA", fontSize:11, lineHeight:1.6 }}>{c.ecology}</div>
          </div>
          {/* Key stars */}
          <div>
            <div style={{ color:"#2A4A6A", fontSize:9, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
              ✦ Key stars
            </div>
            {c.keyStars.map((s,i) => (
              <div key={i} style={{ color:"#4A6A8A", fontSize:10, marginBottom:2 }}>· {s}</div>
            ))}
          </div>
          {/* OC Species */}
          {c.ocSpecies?.length > 0 && (
            <div>
              <div style={{ color:"#2A4A6A", fontSize:9, fontWeight:700,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>
                🐾 OC species it signals
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {c.ocSpecies.map(sp => (
                  <button key={sp}
                    onClick={() => navigate(`/Search?q=${encodeURIComponent(sp)}`)}
                    style={{ padding:"3px 8px", borderRadius:6,
                      background:"rgba(74,154,90,0.08)", border:"1px solid rgba(74,154,90,0.15)",
                      color:"#7AAA8A", fontSize:10, cursor:"pointer" }}>
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Field cue */}
          <div style={{ padding:"6px 10px", background:"rgba(245,200,66,0.04)",
            border:"1px solid rgba(245,200,66,0.12)", borderRadius:7 }}>
            <div style={{ color:"#C4A840", fontSize:9, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
              👁 Field cue
            </div>
            <div style={{ color:"#9A8840", fontSize:11, lineHeight:1.6 }}>{c.fieldCue}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhenologyPanel({ skyPhenology, navigate }) {
  if (!skyPhenology.length) return null;
  return (
    <div>
      <div style={{ color:"#3A5A7A", fontSize:10, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
        🌿 Sky → Species Right Now
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {skyPhenology.map((e,i) => (
          <div key={i} style={{ background:"#0A1520",
            border:"1px solid rgba(100,150,200,0.1)",
            borderRadius:11, padding:"10px 12px" }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:4 }}>
              <div style={{ color:"#A8C8E8", fontSize:11, fontWeight:700 }}>{e.event}</div>
              <div style={{ color:"#2A4A6A", fontSize:9 }}>
                {e.skyKey}
              </div>
            </div>
            <div style={{ color:"#4A6A8A", fontSize:10, lineHeight:1.6, marginBottom:6 }}>
              {e.ecology}
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {e.species.map(sp => (
                <button key={sp}
                  onClick={() => navigate(`/Search?q=${encodeURIComponent(sp)}`)}
                  style={{ padding:"2px 7px", borderRadius:5,
                    background:"rgba(74,154,90,0.07)", border:"1px solid rgba(74,154,90,0.15)",
                    color:"#6A9A7A", fontSize:9, cursor:"pointer" }}>
                  {sp}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavigationPanel() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div style={{ color:"#3A5A7A", fontSize:10, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
        🧭 Navigation Intelligence
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {NAVIGATION_CARDS.map((c,i) => (
          <div key={i} style={{ background:"#0A1520",
            border:"1px solid rgba(100,150,200,0.12)", borderRadius:11, overflow:"hidden" }}>
            <button onClick={() => setOpen(open===i?null:i)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"10px 13px", background:"none", border:"none",
                cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:17 }}>{c.icon}</span>
              <div style={{ flex:1, color:"#C8DCF0", fontSize:12, fontWeight:600 }}>{c.title}</div>
              <div style={{ color:"#3A5A7A", fontSize:14,
                transform:open===i?"rotate(180deg)":"none", transition:"transform 0.2s" }}>›</div>
            </button>
            {open===i && (
              <div style={{ padding:"0 13px 13px" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {c.steps.map((s,j) => (
                    <div key={j} style={{ display:"flex", gap:8 }}>
                      <div style={{ color:"#2A4A6A", fontSize:11, flexShrink:0, fontWeight:700 }}>
                        {j+1}.
                      </div>
                      <div style={{ color:"#6A8AAA", fontSize:11, lineHeight:1.6 }}>{s}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:8, padding:"6px 9px",
                  background:"rgba(245,200,66,0.05)",
                  border:"1px solid rgba(245,200,66,0.12)", borderRadius:7 }}>
                  <div style={{ color:"#9A8840", fontSize:10, lineHeight:1.6 }}>
                    💡 {c.cue}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonalSkyPanel({ season }) {
  const SEASONAL_SKY = {
    spring:{
      headline:"The arc from Polaris south",
      description:"Spring evenings reveal the arc: Big Dipper handle curves south to Arcturus (the orange spring star), then 'speeds' to Spica. Leo is prominent in the south, signaling breeding season for most OC species. The winter sky retreats west — Orion sets earlier each week.",
      constellations:["Big Dipper","Leo","Virgo","Boötes (Arcturus)"],
      ecologyNote:"Bird song peak. Allen's Hummingbird defending territories. Pacific Tree Frog chorus from every canyon pool. Dawn comes 4 minutes earlier each week.",
      lightNote:"Days lengthening by ~2 min/day. Twilight extends. Species begin early-morning activity shifts.",
    },
    summer:{
      headline:"The overhead arc — Summer Triangle to galactic core",
      description:"Summer Triangle overhead (Vega–Deneb–Altair). Scorpius dominates the southern sky — Antares glowing red. The Milky Way band stretches from north to south. The galactic core rises in the south: best viewed from Santiago Peak or Caspers at new moon.",
      constellations:["Summer Triangle","Scorpius","Sagittarius (galactic core)","Hercules"],
      ecologyNote:"Bat foraging peaks. Marine layer suppresses bird activity after 10am. Bioluminescence season open at Crystal Cove. Least Tern fledglings on Bolsa Chica.",
      lightNote:"Longest days. Shortest nights. Astronomical twilight barely ends before it begins again in June.",
    },
    fall:{
      headline:"The great square pivot — from summer to winter",
      description:"Pegasus Great Square rises in the east — the door closing on summer. Pleiades visible in the east by 9pm: the ancient harvest marker. Orion's shoulder (Betelgeuse) rises before midnight. The sky rotates toward the winter configuration.",
      constellations:["Pegasus (Great Square)","Pleiades (Seven Sisters)","Andromeda","Perseus"],
      ecologyNote:"Raptor migration peaks. Cottonwood gold on Santiago Creek and San Juan Creek. First rains trigger seed germination. Monarch migration along OC coast.",
      lightNote:"Days shortening rapidly. First crisp nights. Ground cools: thermals collapse, raptor soaring peaks in afternoon uplift.",
    },
    winter:{
      headline:"Orion's court — the winter masterpiece",
      description:"The richest section of the winter sky: Orion with his belt, flanked by Aldebaran (Taurus) to the northwest and Sirius (brightest night star) to the southeast. The Winter Triangle: Sirius–Betelgeuse–Procyon. The Pleiades almost overhead. The county's longest nights.",
      constellations:["Orion","Taurus (Aldebaran, Pleiades)","Gemini (Castor, Pollux)","Canis Major (Sirius)"],
      ecologyNote:"Great Horned Owl nesting in January — earliest nester in OC. Waterfowl at maximum diversity on Upper Newport Bay. Gray Whale offshore (Dec–Mar).",
      lightNote:"Shortest days. Astronomical twilight is true — Mars, Jupiter often visible in winter sky.",
    },
  };
  const sky = SEASONAL_SKY[season] || SEASONAL_SKY["spring"];
  const sc = SEASON_COLOR[season];
  return (
    <div style={{ background:"#0A1520", border:`1px solid ${sc}25`,
      borderRadius:14, padding:"14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:15 }}>{SEASON_ICON[season]}</span>
        <div style={{ color: sc, fontSize:11, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.08em" }}>
          {season} sky
        </div>
      </div>
      <div style={{ color:"#C8DCF0", fontSize:13, fontWeight:600, marginBottom:6 }}>
        {sky.headline}
      </div>
      <div style={{ color:"#4A6A8A", fontSize:11, lineHeight:1.7, marginBottom:10 }}>
        {sky.description}
      </div>
      {/* Constellation chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {sky.constellations.map(c => (
          <span key={c} style={{ padding:"3px 8px", borderRadius:6,
            background:"rgba(100,150,200,0.08)", border:"1px solid rgba(100,150,200,0.15)",
            color:"#6A8AAA", fontSize:10 }}>
            ✦ {c}
          </span>
        ))}
      </div>
      <div style={{ padding:"8px 10px", background:"rgba(74,154,90,0.05)",
        border:"1px solid rgba(74,154,90,0.12)", borderRadius:8, marginBottom:6 }}>
        <div style={{ color:"#4A8A5A", fontSize:9, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
          🌿 Ecology now
        </div>
        <div style={{ color:"#5A8A6A", fontSize:11, lineHeight:1.6 }}>{sky.ecologyNote}</div>
      </div>
      <div style={{ padding:"6px 10px", background:"rgba(180,160,120,0.04)",
        border:"1px solid rgba(180,160,120,0.1)", borderRadius:7 }}>
        <div style={{ color:"#7A6A40", fontSize:10, lineHeight:1.6 }}>💡 {sky.lightNote}</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Sky() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initTab = searchParams.get("tab") || "sky";

  const [tab, setTab] = useState(initTab);
  const [species, setSpecies] = useState([]);
  const [obs, setObs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Species.filter({}).catch(() => []),
      Observation.filter({}).catch(() => []),
    ]).then(([s, o]) => {
      setSpecies(s || []);
      setObs(o || []);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const intel = useMemo(() => {
    return reduceSky({ date: now, observations: obs, species });
  }, [obs, species]);

  const TABS = [
    { key:"sky",     label:"🌌 Sky Now"    },
    { key:"moon",    label:"🌕 Moon"       },
    { key:"stars",   label:"✦ Stars"       },
    { key:"nav",     label:"🧭 Navigate"   },
    { key:"phenology",label:"🌿 Phenology" },
  ];

return (
  <div className="sky-screen" style={{ minHeight: "100vh", padding: 24 }}>
    <h1 style={{ fontSize: "2rem", marginBottom: 12 }}>Sky</h1>
    <p style={{ opacity: 0.8, marginBottom: 24 }}>
      A living world begins with awareness.
    </p>
    <button
      style={{
        padding: "12px 20px",
        background: "#4CAF50",
        color: "white",
        borderRadius: 8,
        border: "none",
        fontSize: "1rem",
      }}
    >
      Explore Today
    </button>
  </div>
);
}
