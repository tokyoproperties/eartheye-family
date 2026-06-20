import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Species, Trail, Observation } from "@/api/entities";
import BottomNav from "./BottomNav";

// ── Ecological Knowledge Base ─────────────────────────────────────────────────

const MONTH_SEASON = [
  "winter","winter","spring","spring","spring",
  "summer","summer","summer","fall","fall","fall","winter"
];
const SEASON_ICON  = { spring:"🌿", summer:"☀️", fall:"🍂", winter:"🌧" };
const SEASON_COLOR = { spring:"#4A9A5A", summer:"#D4883A", fall:"#8A5A2A", winter:"#3A6A9A" };
const MONTH_NAMES  = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// Moon phase (Julian date method)
function getMoonPhase(date = new Date()) {
  const JD = date / 86400000 + 2440587.5;
  const phase = ((JD - 2451550.1) / 29.530588861) % 1;
  const p = phase < 0 ? phase + 1 : phase;
  if (p < 0.033) return { name:"New Moon", icon:"🌑", ecology:"new" };
  if (p < 0.258) return { name:"Waxing Crescent/Quarter", icon:"🌒", ecology:"crescent" };
  if (p < 0.533) return { name:"Waxing Gibbous/Full", icon:"🌔", ecology:"full_approach" };
  if (p < 0.758) return { name:"Waning Gibbous/Quarter", icon:"🌖", ecology:"waning" };
  return { name:"Waning Crescent", icon:"🌘", ecology:"crescent" };
}

// Sunrise/sunset for OC (33.7°N, -117.8°W)
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

// ── Monthly Ecological Knowledge ──────────────────────────────────────────────
const MONTHLY = {
  0: {  // January
    label:"Deep Winter", subLabel:"January · Orange County",
    voice:"Deep winter. The county is at its quietest. The Great Horned Owl has already begun nesting in January — the earliest nesting bird in OC. The wetlands are at maximum bird diversity. Gray Whale offshore.",
    peaking:["Great Horned Owl nesting — already incubating in the oaks","White Pelican cooperative feeding on Upper Newport Bay","Gray Whale offshore (Dec–Mar) — Bolsa Chica to Dana Point","Minus tides exposing intertidal zones — Crystal Cove","Long-billed Curlew on bay mudflats","Northern Harrier hunting Newport Bay pickleweed","Winter annuals germinating after rain"],
    quiet:["Bat activity at minimum — insect emergence low","Reptile and amphibian activity — cold-suppressed","Most songbird migrants absent"],
    corridor:"Upper Newport Bay",
    corridorNote:"White Pelican cooperative feeding in the channel. Maximum shorebird diversity. The quietest, deepest expression of OC winter.",
    corridorTime:"Low tide, any hour — the bay is active all day in winter",
    sound:"White Pelican wing-whistle on a cold morning — a sound most people never hear because they stop going outside in January.",
    marineLayer:"No marine layer — clear winter skies, longest astronomical twilight",
    tidalNote:"Deepest minus tides of the year — January intertidal zones fully exposed",
    nightEco:"Great Horned Owl dominant. Long-eared Owl hunting open grasslands at Mile Square. Barn Owl on the oak edge at Santiago Oaks.",
    nightTidal:"Nocturnal low tides — best intertidal access of the year",
    heatNote:null,
  },
  1: {  // February
    label:"Late Winter", subLabel:"February · Orange County",
    voice:"Late winter. The first cues of spring are in the air before spring arrives. Great Horned Owl chicks hatching. Allen's Hummingbird males already back on territory in the coastal sage. The canyon light is different.",
    peaking:["Great Horned Owl — first chicks hatching","Allen's Hummingbird males returning to coastal sage territories","First male Red-winged Blackbird establishing marsh territories","Gray Whale offshore — peak southbound migration","Least Bell's Vireo returning to riparian by month end","California Poppy beginning on south-facing slopes"],
    quiet:["Most warblers still absent","Bat emergence still minimal","Reptiles still cold-suppressed"],
    corridor:"Crystal Cove",
    corridorNote:"Gray Whale offshore in February — Bolsa Chica to Crystal Cove bluff is the best vantage. Lowest tides of the season. Intertidal access.",
    corridorTime:"Sunrise on the bluff — whales are visible in early morning light",
    sound:"Allen's Hummingbird wing trill over the sage — the first sound of returning spring before any flowers are open.",
    marineLayer:"Still clear — marine layer not yet rebuilt",
    tidalNote:"Deep winter tides — excellent intertidal access at Crystal Cove",
    nightEco:"Great Horned Owl chick calls beginning. Pacific Tree Frog not yet calling.",
    nightTidal:"Winter tide pattern continuing",
    heatNote:null,
  },
  2: {  // March
    label:"Early Spring", subLabel:"March · Orange County",
    voice:"Early spring. The county is unlocking. Pacific Tree Frog chorus from every canyon pool. Swallows return to San Juan Capistrano. The chaparral is opening. The first real bloom is underway.",
    peaking:["Pacific Tree Frog chorus — peak canyon pool calling","Cliff Swallow return to San Juan Capistrano","Western Meadowlark singing on grassland margins","California Poppy peak bloom on south-facing slopes","Coastal Cactus Wren nest building","Black-necked Stilt arriving at Newport Bay","Coast Live Oak catkins — pollen season begins"],
    quiet:["Most neotropical migrants still south","Summer heat absent — all-day hiking window","Bioluminescence season not yet open"],
    corridor:"San Juan Creek",
    corridorNote:"Cliff Swallow return to the mission. Pacific Tree Frog at peak chorus below Caspers. The creek is running. The willows are leafing.",
    corridorTime:"Dawn for songbirds — trail is comfortable all day in March",
    sound:"Pacific Tree Frog chorus from the canyon pool below Caspers — hundreds of voices, building and falling in waves.",
    marineLayer:"Not yet — clear spring mornings",
    tidalNote:"Spring tides building — increasing tidal amplitude",
    nightEco:"Pacific Tree Frog peak chorus. Great Horned Owl young calling for food. First bats beginning to emerge.",
    nightTidal:"Tidal variation increasing",
    heatNote:null,
  },
  3: {  // April
    label:"Peak Spring", subLabel:"April · Orange County",
    voice:"Peak spring. Everything is open. The Least Bell's Vireo is back in the willows. The coastal sage scrub is at maximum bloom. The Grunion run begins. Every habitat is simultaneously in its best week of the year.",
    peaking:["Least Bell's Vireo arriving in riparian willows","Grunion run beginning (full/new moon nights)","Coastal sage scrub peak bloom — Black Sage, White Sage","Western Fence Lizard and Skink maximum activity","Burrowing Owl on display at Bolsa Chica","Allen's Hummingbird nest with eggs","Northbound shorebird migration peaking on Newport Bay","California Gnatcatcher in full territorial song"],
    quiet:["Summer heat not yet arrived — full day hiking window","Marine layer not yet rebuilt"],
    corridor:"Upper Newport Bay",
    corridorNote:"Northbound shorebird migration at peak. Burrowing Owl at the east bluff. Black-necked Stilt nesting. The bay is at maximum ecological activity.",
    corridorTime:"Minus tide at dawn — shorebirds feeding on exposed mudflat",
    sound:"California Gnatcatcher contact call from the coastal sage — a thin, descending mew. The signature sound of the scrub in spring.",
    marineLayer:"Occasional light marine layer — mostly clear",
    tidalNote:"Grunion run nights — check calendar for specific dates",
    nightEco:"Grunion run on beach nights (moon phase dependent). Pacific Tree Frog chorus continuing. Mexican Free-tailed Bat emerging from roosts.",
    nightTidal:"Grunion spawning windows — Crystal Cove and Bolsa Chica",
    heatNote:null,
  },
  4: {  // May
    label:"Late Spring", subLabel:"May · Orange County",
    voice:"Late spring. The Vireo is back in the willows and the season is beginning to hand off to summer. The marine layer is rebuilding on the coast. The interior trails are warm before 9am. The chaparral bloom is beginning to rust. The county is at the top of the arc, and you can feel it starting to tip.",
    peaking:["Least Bell's Vireo in full song — San Juan Creek and Santiago Creek riparian","Belding's Savannah Sparrow in full territorial song on Newport Bay pickleweed","Grunion run continuing — Crystal Cove beach on specific nights","Black Sage and Buckwheat flowering — coastal sage scrub at peak bloom","Coast Horned Lizard and Western Fence Lizard at maximum activity","Arroyo Toad nesting ending as upper creek pools warm and shrink","Marine layer beginning to rebuild — first gray mornings of the coast","Interior trails becoming heat-limited by mid-May"],
    quiet:["Northbound shorebird migration largely complete","Raptor courtship flights over","Pacific Tree Frog chorus silent — pools drying"],
    corridor:"Santiago Creek",
    corridorNote:"Least Bell's Vireo singing in the willow thickets along Santiago Creek — a federally endangered bird singing over a creek it was absent from for decades. The conservation peak of the central OC year.",
    corridorTime:"Early morning in the upper sections near the wilderness boundary. Before 8am.",
    sound:"Least Bell's Vireo rapid chatter from the willow thickets — the sound of a bird that was functionally absent from OC riparian for 30 years, now back and defending its territory.",
    marineLayer:"Marine layer returns — June Gloom beginning",
    tidalNote:"Bay mudflats transitioning to breeding season",
    nightEco:"Great Horned Owl dominant. Pacific Tree Frog chorus at canyon pools after rain. Cricket stridulation everywhere.",
    nightTidal:"Nocturnal tidal cycle active",
    heatNote:"Trails heat-limited by mid-morning from mid-May",
  },
  5: {  // June
    label:"Early Summer", subLabel:"June · Orange County",
    voice:"June. The marine layer is fully established — June Gloom on the coast until noon. The interior is hot by 9am. The Least Tern is nesting on Bolsa Chica. The summer sky is the richest of the year. The county splits: coast stays cool, interior closes down.",
    peaking:["Least Tern nesting — Bolsa Chica and Newport Bay","Western Snowy Plover breeding — Bolsa Chica","June Gloom marine layer — coast cool until noon","Interior chaparral heat-closed by 9am","Bioluminescence season open — Crystal Cove surge channels","Mexican Free-tailed Bat maximum foraging activity","Summer Triangle overhead at new moon — darkest sky window"],
    quiet:["Northbound shorebird migration over","Wildflower bloom collapsed in interior","Amphibian activity minimal — pools dry"],
    corridor:"Crystal Cove",
    corridorNote:"Marine layer keeps the coast 15° cooler than the interior. Bioluminescence open in surge channels on calm nights. Least Tern overhead on the bluff.",
    corridorTime:"Pre-dawn coastal walk — marine layer lifts by noon",
    sound:"Mexican Free-tailed Bat echolocation clicks over the sage at dusk — inaudible to human ears, but the flight pattern is unmistakable.",
    marineLayer:"June Gloom established — coast gray until noon daily",
    tidalNote:"Summer tidal pattern — mixed semidiurnal",
    nightEco:"Mexican Free-tailed Bat peak. Lesser Nighthawk calling overhead. Bioluminescence windows at Crystal Cove.",
    nightTidal:"Calm nights = bioluminescence visible in wave action",
    heatNote:"Interior trails closed by 9am. Coast open all day.",
  },
  6: {  // July
    label:"Peak Summer", subLabel:"July · Orange County",
    voice:"Peak summer. The interior is hostile by 8am. The coast is the county. The Least Tern fledglings are beginning to fly at Bolsa Chica. The Milky Way is directly overhead at new moon. Scorpius glows red in the south. The county is in its longest, hottest expression.",
    peaking:["Least Tern fledglings — Bolsa Chica","Western Sandpiper beginning southbound migration (July 1+)","Milky Way core overhead at new moon — Santiago Peak view","Scorpius dominant in southern sky — Antares red","Bioluminescence peak — red tide potential","Coyote pups emerging from dens","Kelp canopy at maximum — dive conditions"],
    quiet:["Interior trails ecologically closed — heat extreme","Most breeding birds past nesting","Wildflower bloom over in all habitats"],
    corridor:"Bolsa Chica",
    corridorNote:"Least Tern fledglings on the loafing bars. Western Sandpiper beginning to arrive southbound. The marsh is in full summer expression.",
    corridorTime:"Pre-dawn — heat eliminates the afternoon window",
    sound:"Least Tern colony alarm call over the nesting island — a rapid, piercing trill. The sound of 30 years of coastal restoration.",
    marineLayer:"Marine layer most consistent — coast gray until 11am",
    tidalNote:"Bioluminescence window open — flat calm nights",
    nightEco:"Bioluminescence at Crystal Cove. Mexican Free-tailed Bat foraging. Summer Triangle overhead. Scorpius south.",
    nightTidal:"Bioluminescence most visible on calm, dark nights",
    heatNote:"Heat extreme. Interior trails before dawn only.",
  },
  7: {  // August
    label:"Late Summer", subLabel:"August · Orange County",
    voice:"Late summer. The county is beginning to exhale. The first southbound shorebirds are back. The marine layer is beginning to break up by afternoon. The nights are still warm but something in the air is shifting. The chaparral smells different after dark.",
    peaking:["Southbound shorebird migration — Western Sandpiper, Dunlin","Marine layer breaking up — more afternoon sun","Summer Triangle still overhead","Coyote activity increasing — pups dispersing","Bat diversity maximum — multiple species active","Green Flash visible from Bolsa Chica bluff on clear evenings"],
    quiet:["Tern nesting complete","Interior hiking still heat-limited","Most wildflowers gone"],
    corridor:"Upper Newport Bay",
    corridorNote:"Southbound shorebirds returning to the bay. First fall migrants beginning to appear on the willows. The bay is transitioning.",
    corridorTime:"Low tide, morning — shorebirds feeding on exposed flats",
    sound:"Western Sandpiper flock — a soft, rippling trill as 500 birds lift off the mudflat simultaneously. The sound of the fall return.",
    marineLayer:"Marine layer thinning — more afternoon clearing",
    tidalNote:"Transitional tidal pattern",
    nightEco:"Bat diversity maximum. Summer Triangle overhead. First cricket stridulation of the season.",
    nightTidal:"Calm nights still warm enough for bioluminescence",
    heatNote:"Still heat-limited on interior trails — morning only",
  },
  8: {  // September
    label:"Early Fall", subLabel:"September · Orange County",
    voice:"Early fall. The county is pivoting. The first rains haven't come but you can feel the season loading. Raptor migration has begun on the ridgelines. The cottonwoods on Santiago Creek are beginning to turn. The nights are different.",
    peaking:["Raptor migration — Broad-winged Hawk, Cooper's Hawk on ridgelines","Monarch Butterfly migration beginning — coastal route","Cottonwood leaves yellowing on Santiago and San Juan Creek","Warbler migration — Wilson's, Yellow-rumped in riparian","Santa Ana wind season begins","Great Horned Owl pair formation — courtship calls begin","Coyote dispersal peak — young animals establishing territories"],
    quiet:["Marine layer collapsing — blue skies returning","Shorebird migration tapering","Summer birds departing"],
    corridor:"Santiago Peak",
    corridorNote:"Raptor migration visible from the peak and ridge. Broad-winged Hawk in September. Cooper's Hawk funneling through the chaparral. The highest vantage in OC during the fall flight.",
    corridorTime:"10am–2pm — raptors need thermals to soar",
    sound:"Broad-winged Hawk kettle — dozens of birds circling on a thermal over the ridge in silence, then breaking south.",
    marineLayer:"Marine layer collapsing — clearest skies of the year",
    tidalNote:"Fall tidal pattern — moderate amplitude",
    nightEco:"Great Horned Owl pair calling. First Pacific Tree Frog calls after early rain. Bats still active. Pleiades rising in the east.",
    nightTidal:"Fall tidal pattern",
    heatNote:"Santa Ana wind events — fire weather possible",
  },
  9: {  // October
    label:"Peak Fall", subLabel:"October · Orange County",
    voice:"Peak fall. The first rains have arrived or are close. The cottonwood gold on Santiago Creek. The Pleiades rising in the east at dusk. Monarch Butterflies through Laguna Coast. The county is in its most dramatic seasonal expression.",
    peaking:["Cottonwood gold — Santiago Creek, San Juan Creek","Monarch Butterfly migration — Laguna Coast and Crystal Cove","First rains triggering seed germination in chaparral","California Newt emerging after first rain — road crossings","Pacific Tree Frog chorus restarting after rain","Pleiades rising at dusk — ancient harvest marker","Bioluminescence last window — Crystal Cove on calm nights","Santa Ana wind season peak"],
    quiet:["Summer marine layer gone — clearest skies","Most breeding birds gone south","Insect diversity dropping"],
    corridor:"Laguna Coast Wilderness",
    corridorNote:"Monarch Butterfly roost forming on the eucalyptus. Cottonwood gold in the canyon. California Newt emerging after first rain. The most visually dramatic trail in OC in October.",
    corridorTime:"Morning after first rain — Newt crossings visible",
    sound:"California Newt chorus in a canyon pool after the first October rain — a soft, pulsing call that most people never associate with amphibians.",
    marineLayer:"Gone — clearest skies of the year",
    tidalNote:"Fall tides — moderate, increasing amplitude toward winter",
    nightEco:"Great Horned Owl courtship calls. Pacific Tree Frog chorus after rain. Pleiades overhead. Orion rising in the east.",
    nightTidal:"Moderate fall tides",
    heatNote:"Santa Ana wind events remain possible",
  },
  10: { // November
    label:"Late Fall", subLabel:"November · Orange County",
    voice:"Late fall. The rains have arrived or the county is waiting. The chaparral is beginning its slow exhale. The waterfowl are building on the bay. Orion is fully risen. The Great Horned Owl will begin nesting before November ends.",
    peaking:["Orion rising — winter sky begins","Waterfowl diversity building on Upper Newport Bay","White-crowned Sparrow arriving in scrub understory","First winter shorebirds established","Creek systems running after rain","Fungal emergence in oak woodlands after rain","Long-billed Curlew on bay flats"],
    quiet:["Monarch migration complete","Most passerine migrants settled or gone","Reptile and amphibian activity minimal"],
    corridor:"Upper Newport Bay",
    corridorNote:"Waterfowl building to winter maximum. Long-billed Curlew on the mudflat. White Pelican beginning to arrive. The bay is transitioning to its richest winter expression.",
    corridorTime:"Low tide, morning — maximum bird concentration",
    sound:"Long-billed Curlew call over the bay — a rising, liquid whistle that carries across the entire basin. The sound of OC in late fall.",
    marineLayer:"No marine layer — winter clear",
    tidalNote:"Fall tides deepening toward winter minimum",
    nightEco:"Orion overhead. Great Horned Owl calling — first courtship calls of the season. Striped Skunk active. Virginia Opossum in creek corridors.",
    nightTidal:"Deepening winter tides",
    heatNote:null,
  },
  11: { // December
    label:"Early Winter", subLabel:"December · Orange County",
    voice:"Early winter. The county is settling into its longest nights. Orion is fully present in the south. The Great Horned Owl is already sitting on eggs in some territories. The bay is at maximum bird diversity. The land is resting.",
    peaking:["Great Horned Owl nesting — earliest territories already on eggs","Orion dominant — winter sky at full expression","Waterfowl maximum — Newport Bay winter peak","Minus tides beginning — intertidal access opens","White Pelican on the bay","Northern Harrier hunting pickleweed margins","Winter annuals sprouting after rain"],
    quiet:["All summer residents gone","Reptile activity minimal","Insect activity minimal"],
    corridor:"Upper Newport Bay",
    corridorNote:"Winter waterfowl at maximum. White Pelican cooperative feeding. The bay is the ecological heart of OC in December.",
    corridorTime:"Any hour — winter birds are active all day",
    sound:"White Pelican wing-whistle on a gray December morning — a deep, resonant sound from a bird that doesn't call, only produces sound with its wings.",
    marineLayer:"None — clear winter skies",
    tidalNote:"Minus tides beginning — best intertidal access of the season starting now",
    nightEco:"Orion overhead. Great Horned Owl on territory. Long-eared Owl hunting open grasslands. Barn Owl on the oak edge.",
    nightTidal:"Minus tides create intertidal access windows",
    heatNote:null,
  },
};

// ── Daily Briefing Reducer ────────────────────────────────────────────────────
function reduceDailyBriefing({ date, species, observations, trails }) {
  const now    = date || new Date();
  const month  = now.getMonth();
  const season = MONTH_SEASON[month];
  const moon   = getMoonPhase(now);
  const sun    = getSunTimes(now);
  const eco    = MONTHLY[month];

  // Day of week for corridor rotation
  const dow  = now.getDay(); // 0–6
  const corridorKey = eco.corridor;

  // Night species active this season from DB
  const nightGroups = ["mammal","insect","arachnid","amphibian","bird"];
  const nightActive = species
    .filter(s => nightGroups.includes(s.group?.toLowerCase())
      && (s.seasonPresence||[]).map(x=>x.toLowerCase()).includes(season))
    .slice(0, 6);

  // Featured species peaking this month — match names in peaking list
  const peakingNames = (eco.peaking||[]).flatMap(p => {
    const first = p.split("—")[0].split("(")[0].trim();
    return [first];
  });
  const featuredSpecies = species
    .filter(s => peakingNames.some(n =>
      s.name?.toLowerCase().includes(n.toLowerCase().split(" ")[0]) &&
      n.toLowerCase().split(" ").length > 1 &&
      s.name?.toLowerCase().includes(n.toLowerCase().split(" ").slice(-1)[0])
    ))
    .slice(0, 4);

  // Best trail for this month's corridor
  const corridorTrail = trails.find(t =>
    t.name?.toLowerCase().includes(corridorKey?.toLowerCase().split(" ")[0]?.toLowerCase())
  ) || trails[0];

  return {
    date: now,
    season, month,
    moon, sun,
    eco,
    nightActive,
    featuredSpecies,
    corridorTrail,
    corridorKey,
  };
}

// ── Components ────────────────────────────────────────────────────────────────

function BriefingHeader({ b }) {
  const sc = SEASON_COLOR[b.season];
  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][b.date.getDay()];
  return (
    <div style={{ padding:"18px 16px 0", background:"#0F0F0D" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
        <span style={{ fontSize:13 }}>{SEASON_ICON[b.season]}</span>
        <div style={{ color:"#3A6A4A", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em" }}>
          Daily Field Report
        </div>
      </div>
      <div style={{ color: sc, fontSize:11, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
        {b.eco.label}
      </div>
      <div style={{ color:"#7FAF8A", fontSize:11, marginBottom:10 }}>
        {dayName} · {MONTH_NAMES[b.month]} · Orange County
      </div>
      <div style={{ color:"rgba(255,255,255,0.70)", fontSize:15, lineHeight:1.7,
        fontStyle:"italic", fontFamily:"Georgia, serif", marginBottom:12, paddingBottom:12,
        borderBottom:"1px solid rgba(127,175,138,0.1)" }}>
        {b.eco.voice}
      </div>
      {/* Sun + Moon strip */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"8px 10px" }}>
          <div style={{ color:"#4A8A5A", fontSize:9, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>☀️ Sun</div>
          <div style={{ color:"#8AB89A", fontSize:11 }}>
            ↑ {b.sun.sunrise} · ↓ {b.sun.sunset}
          </div>
          <div style={{ color:"#3A6A4A", fontSize:9, marginTop:1 }}>
            {b.sun.daylight} daylight
          </div>
        </div>
        <div style={{ flex:1, background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"8px 10px" }}>
          <div style={{ color:"#3A5A7A", fontSize:9, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>
            {b.moon.icon} Moon
          </div>
          <div style={{ color:"#6A8AAA", fontSize:11 }}>{b.moon.name}</div>
          <div style={{ color:"#2A4A6A", fontSize:9, marginTop:1 }}>
            {b.moon.ecology === "new" ? "Darkest nights — bat peak" :
             b.moon.ecology === "crescent" ? "Moth navigation strongest" :
             b.moon.ecology === "full_approach" ? "Prey movement suppressed" :
             "Night ecology transitioning"}
          </div>
        </div>
      </div>
      {/* Marine layer + heat */}
      {(b.eco.marineLayer || b.eco.heatNote) && (
        <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
          {b.eco.marineLayer && (
            <div style={{ display:"flex", gap:6, alignItems:"flex-start",
              padding:"6px 9px", background:"rgba(50,70,100,0.15)",
              border:"1px solid rgba(100,140,180,0.12)", borderRadius:8 }}>
              <span style={{ fontSize:13 }}>🌁</span>
              <div style={{ color:"#6A8AAA", fontSize:11, lineHeight:1.6 }}>
                {b.eco.marineLayer}
              </div>
            </div>
          )}
          {b.eco.heatNote && (
            <div style={{ display:"flex", gap:6, alignItems:"flex-start",
              padding:"6px 9px", background:"rgba(100,40,20,0.15)",
              border:"1px solid rgba(200,100,80,0.12)", borderRadius:8 }}>
              <span style={{ fontSize:13 }}>🌡</span>
              <div style={{ color:"#B87060", fontSize:11, lineHeight:1.6 }}>
                {b.eco.heatNote}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PeakingPanel({ eco }) {
  return (
    <div style={{ padding:"0 14px" }}>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:8 }}>
        🔭 What's Peaking This Month
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {eco.peaking.map((item, i) => (
          <div key={i} style={{ display:"flex", gap:7,
            padding:"6px 8px", background:"rgba(20,40,24,0.6)",
            border:"1px solid rgba(74,154,90,0.1)", borderRadius:8 }}>
            <div style={{ color:"#3A7A4A", fontSize:11, flexShrink:0 }}>·</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, lineHeight:1.65 }}>{item}</div>
          </div>
        ))}
      </div>
      {eco.quiet?.length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={{ color:"#2A4A32", fontSize:9, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>
            Quiet this month
          </div>
          {eco.quiet.map((item, i) => (
            <div key={i} style={{ color:"#2A5A36", fontSize:10,
              lineHeight:1.6, marginBottom:2 }}>· {item}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function CorridorPanel({ b, navigate }) {
  return (
    <div style={{ padding:"0 14px" }}>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:6 }}>
        🌆 Corridor of the Day
      </div>
      <div style={{ background:"rgba(20,40,24,0.8)",
        border:"1px solid rgba(74,154,90,0.2)", borderRadius:12,
        padding:"12px 13px" }}>
        <div style={{ color:"rgba(255,255,255,0.85)", fontSize:14, fontFamily:"Georgia, serif",
          marginBottom:4 }}>{b.eco.corridor}</div>
        <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, fontStyle:"italic", fontFamily:"Georgia, serif", lineHeight:1.65,
          marginBottom:8 }}>{b.eco.corridorNote}</div>
        <div style={{ display:"flex", gap:6, alignItems:"flex-start",
          padding:"5px 8px", background:"rgba(74,154,90,0.06)",
          border:"1px solid rgba(74,154,90,0.1)", borderRadius:7, marginBottom:8 }}>
          <span style={{ fontSize:12 }}>⏰</span>
          <div style={{ color:"#4A7A5A", fontSize:10, lineHeight:1.6 }}>
            {b.eco.corridorTime}
          </div>
        </div>
        {b.corridorTrail && (
          <button onClick={() => navigate(`/TrailDetail?id=${b.corridorTrail.id}`)}
            style={{ width:"100%", padding:"7px", borderRadius:8,
              background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.2)",
              color:"#7FAF8A", fontSize:11, cursor:"pointer", fontWeight:600 }}>
            Open {b.corridorTrail.name} →
          </button>
        )}
      </div>
    </div>
  );
}

function NightPanel({ b, navigate }) {
  return (
    <div style={{ padding:"0 14px" }}>
      <div style={{ color:"#2A4A6A", fontSize:10, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
        🌙 Night Ecology
      </div>
      <div style={{ background:"linear-gradient(135deg,#050C14,#0A1520)",
        border:"1px solid rgba(100,140,200,0.15)", borderRadius:12, padding:"12px 13px" }}>
        <div style={{ color:"#6A8AAA", fontSize:11, lineHeight:1.75,
          marginBottom:8 }}>{b.eco.nightEco}</div>
        {b.eco.tidalNote && (
          <div style={{ display:"flex", gap:6, alignItems:"flex-start",
            padding:"5px 8px", background:"rgba(50,80,120,0.12)",
            border:"1px solid rgba(100,140,200,0.1)", borderRadius:7, marginBottom:8 }}>
            <span style={{ fontSize:12 }}>🌊</span>
            <div style={{ color:"#4A6A8A", fontSize:10, lineHeight:1.6 }}>
              {b.eco.nightTidal}
            </div>
          </div>
        )}
        {b.nightActive.length > 0 && (
          <div>
            <div style={{ color:"#2A3A5A", fontSize:9, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>
              Active tonight
            </div>
            <div style={{ display:"flex", gap:6, overflowX:"auto",
              scrollbarWidth:"none", paddingBottom:2 }}>
              {b.nightActive.map(s => (
                <button key={s.id}
                  onClick={() => navigate(`/SpeciesDetail?id=${s.id}`)}
                  style={{ flexShrink:0, width:52, background:"none",
                    border:"none", padding:0, cursor:"pointer" }}>
                  <div style={{ width:52, height:52, borderRadius:9,
                    overflow:"hidden", background:"#050C14",
                    border:"1px solid rgba(100,140,200,0.1)" }}>
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ display:"flex", alignItems:"center",
                          justifyContent:"center", height:"100%",
                          fontSize:18, opacity:0.2 }}>🌙</div>
                    }
                  </div>
                  <div style={{ fontSize:7, color:"#2A3A5A", marginTop:2,
                    textAlign:"center", overflow:"hidden",
                    whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:52 }}>
                    {s.name.split(" ").slice(-1)[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SoundPanel({ eco, navigate }) {
  return (
    <div style={{ padding:"0 14px" }}>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:6 }}>
        🎵 Sound of the Month
      </div>
      <div style={{ background:"rgba(20,40,24,0.6)",
        border:"1px solid rgba(74,154,90,0.12)", borderRadius:12, padding:"12px 13px" }}>
        <div style={{ color:"rgba(255,255,255,0.60)", fontSize:13, lineHeight:1.75,
          fontStyle:"italic", fontFamily:"Georgia, serif" }}>"{eco.sound}"</div>
        <button onClick={() => navigate("/Seasonal?tab=acoustic")}
          style={{ marginTop:8, padding:"5px 10px", borderRadius:7,
            background:"rgba(74,154,90,0.08)", border:"1px solid rgba(74,154,90,0.15)",
            color:"#4A8A5A", fontSize:10, cursor:"pointer" }}>
          Acoustic Mode →
        </button>
      </div>
    </div>
  );
}

function QuickLinks({ navigate }) {
  const links = [
    { label:"Sky Intelligence", icon:"🌌", path:"/Sky" },
    { label:"Seasonal Arc",     icon:"📅", path:"/Seasonal" },
    { label:"Year Arc",         icon:"📖", path:"/Yearbook" },
    { label:"Log Sighting",     icon:"📍", path:"/LogSighting" },
  ];
  return (
    <div style={{ padding:"0 14px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
        {links.map(l => (
          <button key={l.label} onClick={() => navigate(l.path)}
            style={{ padding:"10px 11px", borderRadius:10, textAlign:"left",
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
              cursor:"pointer" }}>
            <div style={{ fontSize:16, marginBottom:3 }}>{l.icon}</div>
            <div style={{ color:"rgba(255,255,255,0.60)", fontSize:10, fontWeight:600 }}>{l.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Field() {
  const navigate = useNavigate();
  const [species,  setSpecies]  = useState([]);
  const [trails,   setTrails]   = useState([]);
  const [obs,      setObs]      = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      Species.filter({}).catch(() => []),
      Trail.filter({}).catch(() => []),
      Observation.filter({}).catch(() => []),
    ]).then(([s, t, o]) => {
      setSpecies(s || []);
      setTrails(t || []);
      setObs(o || []);
      setLoading(false);
    });
  }, []);

  const briefing = useMemo(() => {
    if (!species.length && !trails.length) return null;
    return reduceDailyBriefing({
      date: new Date(),
      species,
      trails,
      observations: obs,
    });
  }, [species, trails, obs]);

  if (loading || !briefing) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:"#0F0F0D" }}>
      <div>
        <div style={{ fontSize:24, textAlign:"center", marginBottom:8 }}>🌿</div>
        <div style={{ color:"#3A6A4A", fontSize:12 }}>Reading the land…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0F0F0D",
      fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:88 }}>

      <BriefingHeader b={briefing} />

      <div style={{ display:"flex", flexDirection:"column", gap:16, marginTop:16 }}>
        <PeakingPanel eco={briefing.eco} />
        <CorridorPanel b={briefing} navigate={navigate} />
        <NightPanel b={briefing} navigate={navigate} />
        <SoundPanel eco={briefing.eco} navigate={navigate} />
        <QuickLinks navigate={navigate} />
      </div>

      <BottomNav active="field" />
    </div>
  );
}
