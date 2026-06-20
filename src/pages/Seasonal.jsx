import BottomNav from "./BottomNav";
import { useState, useEffect } from "react";
import { Observation, Species } from "@/api/entities";
import { useNavigate } from "react-router-dom";

// ── ECOLOGICAL CALENDAR ─────────────────────────────────────────────────────
const CALENDAR = [
  {
    month: "January", phase: "Deep Winter", phaseIcon: "🌧",
    marineLayer: "Heavy — fog persists through midday on the coast",
    heatLevel: "low", tideCue: "Morning minus tides expose the deepest Crystal Cove reef zones",
    peaking: [
      "Gray Whale southbound migration — visible from Crystal Cove bluffs",
      "Allen's Hummingbird arrives on the coast — first sign of the coastal spring",
      "American White Pelican cooperative feeding on Newport Bay channels",
      "Long-billed Curlew and Marbled Godwit at peak on the mudflats",
      "Belted Kingfisher at every creek pool along San Juan Creek",
    ],
    quiet: ["Chaparral dormant — Wrentit still present, calling from the dry shrubs", "Least Bell's Vireo absent — 4 months until return"],
    corridorOfDay: { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay Loop", why: "Maximum shorebird diversity. Peregrine hunting the mudflats. Ridgway's Rail vocal at dawn. The bay is at its most alive in January.", timing: "Arrive at dawn at low tide for the full experience." },
    soundOfMonth: "Ridgway's Rail clucking from the cordgrass before first light — the acoustic anchor of the winter bay.",
    acousticPeak: "Shorebird call layer — Willet, Godwit, Dunlin calling simultaneously over the Newport Bay mudflats at low tide.",
    bloom: null, migrant: "Gray Whale offshore (southbound)", color: null,
    arcNote: "Deep winter. The bay is the warmest place in the county's ecology — 35,000 shorebirds have decided this, and they're right. The Great Horned Owl is already nesting in January, the earliest nester in the county by six weeks. Winter is not quiet here. It is purposeful.",
  },
  {
    month: "February", phase: "Late Winter", phaseIcon: "🌥",
    marineLayer: "Thinning — clearer afternoons, fog still possible on coast",
    heatLevel: "low", tideCue: "Morning minus tides continue — the finest tidepool window of the year",
    peaking: [
      "Gray Whale northbound migration begins — mothers and calves, visible from Crystal Cove bluff",
      "Allen's Hummingbird in full display flight on the coastal bluffs — the first territorial claim of the year",
      "California Gnatcatcher beginning territorial song in coastal sage scrub",
      "Pacific Tree Frog chorus beginning in canyon bottoms and vernal pools after rain",
      "Tidepool communities at maximum exposure — Crystal Cove reef at its best",
      "Western Meadowlark singing from coastal bluffs and open grasslands",
      "Great Horned Owl owlets hatching — adults calling through the night with urgency",
    ],
    quiet: ["Chaparral dormant but showing first green", "Most neotropical migrants still absent", "Interior trails cold and quiet"],
    corridorOfDay: { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", why: "Morning minus tides still exposing the full reef. Gray Whale mothers and calves offshore. Allen's Hummingbird display-diving on the bluff — the first territorial ignition of the season.", timing: "Check tide tables. Target -0.5 ft or lower between 7–10am. Arrive before the Allen's Hummingbird starts displaying." },
    soundOfMonth: "Allen's Hummingbird display dive — the sharp trill at the bottom of the arc, over the coastal sage scrub bluff, repeated every few minutes. The land's first assertion that spring is coming.",
    acousticPeak: "Allen's Hummingbird display trill + Pacific Tree Frog chorus from the canyon pools after dark + Gray Whale blow offshore at dawn.",
    bloom: "Coastal sage scrub greening — first California Sagebrush new growth", migrant: "Gray Whale offshore (northbound, mothers + calves); Allen's Hummingbird on coast", color: null,
    arcNote: "Quiet ignition. The Allen's Hummingbird is on the bluff before anything else knows spring is coming. The Pacific Tree Frogs are calling from the canyon pools. The Gray Whale mothers and calves are passing offshore. The land is deciding to wake up.",
  },
  {
    month: "March", phase: "Early Spring", phaseIcon: "🌸",
    marineLayer: "Variable — spring clearing begins",
    heatLevel: "low", tideCue: "Grunion run begins — Crystal Cove beach at night on specific tidal cycles",
    peaking: [
      "Cliff Swallows return to San Juan Capistrano — around March 19, one of the most reliable ecological dates in OC",
      "Wildflower bloom opening on chaparral slopes — Ceanothus, Prickly Pear, Wild Mustard",
      "California Gnatcatcher at peak territorial song on all coastal bluffs",
      "Pacific Tree Frog chorus at peak intensity in canyon pools and riparian margins",
      "Grunion run begins — first spawning events on Crystal Cove beach on specific minus-tide nights",
      "Arroyo Toad beginning to stir in upper San Juan Creek tributaries",
      "Red-tailed Hawk and Cooper's Hawk courtship flights over the ridgelines",
      "Northbound shorebird migration beginning at Newport Bay",
    ],
    quiet: ["Least Bell's Vireo still absent — arrives in May", "Interior heat not yet a factor — trails accessible all day"],
    corridorOfDay: { id: "69e06ef8ae83438254c22903", name: "San Juan Creek", why: "Cliff Swallows return to San Juan Capistrano around March 19 — a date so consistent it was recorded by the Mission friars. The creek corridor has witnessed this return every year.", timing: "Walk the mid-corridor near San Juan Capistrano town section in the morning. The swallows arrive from the south." },
    soundOfMonth: "Cliff Swallow colony chattering over San Juan Creek — a sound continuous in this valley since the 18th century, before the town existed.",
    acousticPeak: "Cliff Swallow chattering over the creek + California Gnatcatcher territorial mew on the bluffs + Pacific Tree Frog chorus from the canyon pools at dusk.",
    bloom: "Chaparral wildflower bloom opening — Ceanothus, Prickly Pear, Wild Mustard, Toyon", migrant: "Cliff Swallows return (Mar 19); northbound shorebirds beginning", color: null,
    arcNote: "Early spring. The swallows are back at San Juan Capistrano and the chaparral has remembered how to bloom. The Pacific Tree Frogs are calling from every canyon pool. The raptors are in courtship flight over the ridgelines. The county is turning.",
  },
  {
    month: "April", phase: "Peak Spring", phaseIcon: "🌺",
    marineLayer: "Clearing — spring sunshine through afternoon",
    heatLevel: "low", tideCue: "Northbound shorebird migration peaking through the bay mudflats",
    peaking: [
      "Northbound shorebird migration at maximum species diversity on Newport Bay mudflats",
      "Arroyo Toad breeding in upper San Juan Creek tributaries — calling from the rocky margins at night",
      "California Gnatcatcher nesting in full swing — most vocal month of the year",
      "Chaparral wildflower bloom at absolute peak — Chamise, Ceanothus, Lupine, Prickly Pear simultaneously",
      "Least Bell's Vireo begins arriving — first songs in the willow thickets by late April",
      "Monarch Butterfly northbound migration through coastal sage scrub corridors",
      "Black-chinned and Anna's Hummingbirds nesting in oaks and willows",
      "Orange-crowned and Yellow-rumped Warblers moving through the scrub canopy",
      "Mexican Free-tailed Bat emerging from roost sites at sunset",
    ],
    quiet: ["Wintering shorebirds departing", "Pacific Tree Frog chorus fading as pools dry", "Gray Whale migration ending"],
    corridorOfDay: { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea Trail", why: "Chaparral in full bloom from the upper trailhead. Gnatcatcher at peak song. Bay terminus has peak northbound shorebird diversity. The full ecological gradient from peak chaparral to peak wetland in a single walk.", timing: "Start at 6:30am from the upper trailhead. Bloom and bird activity most concentrated before 10am." },
    soundOfMonth: "The April dawn chorus — 20+ species calling simultaneously before 6am. The most acoustically dense window in OC ecology. California Gnatcatcher. Spotted Towhee. Black-headed Grosbeak. Wrentit. All at once.",
    acousticPeak: "Full dawn chorus across all biomes simultaneously — the most species-dense acoustic event of the OC year, concentrated in the hour before sunrise.",
    bloom: "Absolute peak bloom — Chamise, Ceanothus, Lupine, Prickly Pear, Toyon, California Poppy", migrant: "Northbound shorebirds at peak; Monarch Butterfly moving through", color: null,
    arcNote: "Ecological crescendo. The April dawn chorus is the densest sound the county makes all year — 20+ species before 6am. The chaparral is at peak bloom from the mountains to the sea. The shorebirds are stacked on the bay moving north. Everything is here at once. This is the top of the arc.",
  },
  {
    month: "May", phase: "Late Spring", phaseIcon: "🌿",
    marineLayer: "Marine layer returns — June Gloom begins",
    heatLevel: "moderate", tideCue: "Bay mudflats transitioning to breeding season",
    peaking: [
      "Least Bell's Vireo in full song — San Juan Creek and Santiago Creek riparian",
      "Belding's Savannah Sparrow in full territorial song on Newport Bay pickleweed",
      "Grunion run continuing — Crystal Cove beach on specific nights",
      "Black Sage and Buckwheat flowering — coastal sage scrub at peak bloom",
      "Coastal Horned Lizard and Western Fence Lizard at maximum activity",
      "Arroyo Toad nesting ending as upper creek pools warm and shrink",
      "Marine layer beginning to rebuild — the first gray mornings of the coast",
      "Interior trails becoming heat-limited by mid-May",
    ],
    quiet: ["Northbound shorebird migration largely complete", "Raptor courtship flights over", "Pacific Tree Frog chorus silent — pools dry"],
    corridorOfDay: { id: "69e0289d7669e7f23c9f9c4b", name: "Santiago Creek Trail", why: "Least Bell's Vireo singing in the willow thickets along Santiago Creek — a federally endangered bird singing over a creek it was absent from for decades. The conservation peak of the central OC year.", timing: "Early morning in the upper sections near the wilderness boundary. Before 8am." },
    soundOfMonth: "Least Bell's Vireo rapid chatter from the willow thickets — the sound of a bird that was functionally absent from OC riparian for 30 years, now back and defending its territory.",
    acousticPeak: "Least Bell's Vireo chatter from the willows + Belding's Savannah Sparrow thin buzz from the pickleweed + the first silence of the canyon interior as the heat begins.",
    bloom: "Black Sage and Buckwheat at coastal sage scrub peak — bloom beginning to rust by late May", migrant: "Least Bell's Vireo arrives (May); Arroyo Toad peak activity ending", color: null,
    arcNote: "Late spring. The Vireo is back in the willows and the season is beginning to hand off to summer. The marine layer is rebuilding on the coast. The interior trails are warm before 9am. The chaparral bloom is beginning to rust. The county is at the top of the arc, and you can feel it starting to tip.",
  },
  {
    month: "June", phase: "Early Summer", phaseIcon: "🌫",
    marineLayer: "June Gloom — persistent marine layer through late morning",
    heatLevel: "moderate", tideCue: "Minus tides shift to afternoon/evening",
    peaking: [
      "Least Bell's Vireo nesting at peak — San Juan Creek and Santiago Creek riparian corridors",
      "California Least Tern colony active at lower Newport Bay — federally endangered, critically sensitive",
      "June Gloom: coast holds 62–68°F while interior reaches 95°F+ — the largest thermal gradient of the year",
      "Kelp forest at maximum canopy density — best snorkeling conditions at Crystal Cove",
      "Brown Pelican summer colony established at La Jolla (visible offshore)",
      "Grunion run continuing through mid-June on Crystal Cove and San Clemente beaches",
    ],
    quiet: ["Interior chaparral impassable by 9am", "Spring wildflower bloom over — only drought-tolerant perennials"],
    corridorOfDay: { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", why: "June Gloom keeps the coastal terrace at 65°F while the interior bakes. This is the finest hiking month for Crystal Cove — the marine layer diffuses the light, cools the air, and gives the coastline a quiet, silver quality.", timing: "Start before 8am on the ridge. Descend to the reef at low tide for maximum kelp and fish visibility." },
    soundOfMonth: "The muffled silence of the June coast — marine layer absorbs the ambient sound and the California Gnatcatcher call cuts through it, clear as a pin drop.",
    acousticPeak: "June Gloom acoustic: ambient sound reduced, Gnatcatcher mew amplified, surf hitting the Crystal Cove cobble in slow rhythm.",
    bloom: "Buckwheat and Black Sage at coastal peak", migrant: "Least Tern colony active at Newport Bay", color: null,
    arcNote: "Early summer. June Gloom locks the coast in a cool, diffused light. The interior is already hot. The coast is the only cool path.",
  },
  {
    month: "July", phase: "Mid Summer", phaseIcon: "☀️",
    marineLayer: "Burning off by 10am most days",
    heatLevel: "high", tideCue: "Evening minus tides — 6–9pm is the best tidepool window",
    peaking: [
      "Post-breeding Western Sandpipers returning to Newport Bay — first shorebirds of fall",
      "Least Tern nesting ending — chicks fledging",
      "Kelp forest snorkeling — clearest water of the year",
      "Bioluminescence possible on warm calm nights",
    ],
    quiet: ["Interior trails inadvisable midday", "Most breeding birds post-nuptial and quiet"],
    corridorOfDay: { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay Loop", why: "The first post-breeding Western Sandpipers arrive in late July — the earliest signal that fall migration is coming.", timing: "Arrive before sunrise. Bring water." },
    soundOfMonth: "Western Sandpiper call over the Newport Bay mudflats — the first sound of fall in the middle of summer.",
    acousticPeak: "Near-silence on the interior trails at midday — then the evening acoustic opens with shorebird calls returning to the bay.",
    bloom: null, migrant: "Western Sandpiper return begins (late July)", color: null,
    arcNote: "Mid summer. Silence on the interior trails by 9am — the chaparral is thermally closed. The Western Sandpiper is back at Newport Bay, which means fall migration has already started, weeks before the air temperature knows it.",
  },
  {
    month: "August", phase: "Late Summer", phaseIcon: "🌤",
    marineLayer: "Variable — some clearing, some marine layer",
    heatLevel: "high", tideCue: "Evening tides shifting — fall tidepool window beginning",
    peaking: [
      "Shorebird migration building — Dunlin, Dowitcher, Willet increasing",
      "Post-breeding raptors appearing on coastal bluffs",
      "First hints of fall color in the cottonwood corridor of Santiago Creek",
    ],
    quiet: ["Interior heat still significant", "Breeding season largely over"],
    corridorOfDay: { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay Loop", why: "Shorebird diversity is building fast. August is the transition month at the bay.", timing: "Early morning at low tide. The diversity increases daily." },
    soundOfMonth: "The shorebird call layer over the Newport Bay mudflats thickening day by day — the sound of summer ending.",
    acousticPeak: "Shorebird call density building daily at Newport Bay — the acoustic transition from summer quiet to fall richness.",
    bloom: null, migrant: "Shorebird migration building", color: "First cottonwood hints on Santiago Creek",
    arcNote: "Late summer. The cottonwoods on Santiago Creek show the first yellow. The summer heat is releasing its grip on the interior. The shorebird numbers at the bay are building toward October.",
  },
  {
    month: "September", phase: "Fall Activation", phaseIcon: "🍂",
    marineLayer: "Clearing — Santa Ana wind events possible",
    heatLevel: "moderate", tideCue: "Morning minus tides returning — fall tidepool season opens",
    peaking: [
      "Peregrine Falcon returns to Newport Bay and Crystal Cove headlands",
      "Migrant raptors on Crystal Cove bluffs — Cooper's, Sharp-shinned, Merlin",
      "Shorebird diversity at near-maximum — 35 species possible in one morning",
      "Cottonwood beginning to turn gold in San Juan Creek and Santiago Creek canyons",
      "Bioluminescence peaking in warm water years at Crystal Cove surf zone",
      "Santa Ana wind events begin — inland heat surges, coastal clarity",
      "Marine layer collapses — first sustained clear skies of the season",
    ],
    quiet: ["Least Bell's Vireo has departed south", "Breeding residents silent — territorial songs done"],
    corridorOfDay: { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", why: "Migrant raptors moving along the coastal bluff. Bioluminescence possible at the reef terminus.", timing: "Hike the bluff section mid-morning for raptor movement. Return to the beach at dusk for bioluminescence." },
    soundOfMonth: "The first Peregrine stoop of fall — 3,000 shorebirds erupting simultaneously off the Newport Bay mudflat. The county's most violent acoustic moment.",
    acousticPeak: "3,000-bird eruption from Newport Bay mudflat as the Peregrine stoops — the most dramatic single acoustic event in OC ecology.",
    bloom: null, migrant: "Peregrine returns to Newport Bay; raptor migration on bluffs", color: "Cottonwood gold beginning on Santiago Creek and San Juan Creek",
    arcNote: "Early fall. The marine layer collapses in September — the coast goes from perpetual gray to hard blue overnight. The Peregrine Falcon arrives on the Crystal Cove headlands within days of each other, year after year. The Santa Ana winds shift the whole county east.",
  },
  {
    month: "October", phase: "October Peak", phaseIcon: "🍁",
    marineLayer: "Clear — the finest atmospheric clarity of the year",
    heatLevel: "low", tideCue: "Morning minus tides at maximum exposure — best reef access of the fall",
    peaking: [
      "All five canonical corridors at simultaneous peak — the October Convergence",
      "Crimson pickleweed marsh at Newport Bay — peak color mid-October",
      "Cottonwood gold in San Juan Creek and Santiago Creek canyons",
      "Bioluminescence at Crystal Cove on calm, warm nights",
      "Peregrine Falcon hunting Newport Bay every morning",
      "35,000+ shorebirds compressed on Newport Bay mudflats at high tide",
      "First rain events — fungal emergence in oak woodland and riparian zones",
      "Orange-crowned Warbler, Yellow-rumped Warbler moving through coastal scrub",
      "Long-billed Curlew and Marbled Godwit on the bay mudflats at low tide",
    ],
    quiet: ["Nothing is quiet in October — not even the quiet habitats."],
    corridorOfDay: { id: null, name: "All Five Canonical Corridors", why: "October is the only month where all five canonical corridors peak simultaneously.", timing: "Any morning this month. Start before sunrise on any canonical corridor.", allFour: true },
    soundOfMonth: "The Peregrine stoop at Newport Bay, the Ridgway's Rail from the crimson pickleweed, the cottonwood rustle in two creek canyons, the cobble surf at Crystal Cove reef — all audible in the same week.",
    acousticPeak: "Five simultaneous acoustic peaks — one for each canonical corridor, each for a different ecological reason.",
    bloom: null, migrant: "Peak shorebird diversity; raptor migration", color: "Crimson pickleweed (Newport Bay) + cottonwood gold (two creek corridors)",
    arcNote: "Peak fall. The October Convergence — the single most ecologically dense moment of the OC year. All five corridor systems peak simultaneously. The pickleweed is crimson. The cottonwoods are gold. The Peregrine hunts the bay every morning. Every morning this month is the best morning to go out.",
  },
  {
    month: "November", phase: "Early Winter", phaseIcon: "🌦",
    marineLayer: "Variable — first winter storms possible",
    heatLevel: "low", tideCue: "Morning minus tides deepening — tidepool access improving",
    peaking: [
      "American White Pelican returns to Newport Bay cooperative feeding — flocks of 30 circling together",
      "Eared Grebe and Horned Grebe on Newport Bay open channels",
      "Maximum shorebird diversity settling in for winter — 35,000 still present",
      "Gray Whale southbound migration beginning offshore — first sightings from Crystal Cove bluff",
      "Fox Sparrow arrives from Alaska — scratching in the coastal sage scrub leaf litter",
      "Canvasback and Bufflehead on Newport Bay open water",
      "Chaparral slopes greening within 72 hours of first significant rain",
    ],
    quiet: ["October visual peak fading", "Raptor migration largely complete", "Least Bell's Vireo 5 months absent"],
    corridorOfDay: { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay Loop", why: "American White Pelican cooperative feeding circles return in November. Eared Grebe and Canvasback now present on the open channels. The winter bay is assembling.", timing: "Morning at or just after low tide — the mud is most exposed and the Pelican flocks are feeding." },
    soundOfMonth: "American White Pelican wingbeats — the deep whomp of 30 birds circling together over the Newport Bay channel, herding fish cooperatively.",
    acousticPeak: "White Pelican wingbeats + Ridgway's Rail in the returning winter marsh + Long-billed Curlew on the mudflat.",
    bloom: null, migrant: "American White Pelican returns; Gray Whale offshore (southbound); Fox Sparrow from Alaska", color: null,
    arcNote: "Early winter. The October pulse is fading. The winter community is assembling — not just arriving, but organizing. The Pelicans remember how to cooperate. The sparrows remember where the leaf litter is. The bay is the warmest place in the county and everything that knows it is coming back.",
  },
  {
    month: "December", phase: "Deep Winter", phaseIcon: "🌧",
    marineLayer: "Heavy — winter fog and rain",
    heatLevel: "low", tideCue: "Morning minus tides — deepest of the year",
    peaking: [
      "Gray Whale southbound migration at full pace offshore — peak density from Crystal Cove bluff",
      "Newport Bay at winter peak — full complement of shorebirds, ducks, and waders",
      "Crystal Cove tidepools at maximum accessibility — deepest minus tides of the year",
      "San Juan Creek and Santiago Creek running after first significant rain",
      "Fungal emergence in oak woodland and riparian zones after rain",
      "Long-billed Curlew and Marbled Godwit at peak density on Newport Bay mudflats",
      "Barn Owl hunting the open edges of Santiago Oaks and Caspers at dusk",
    ],
    quiet: ["Interior chaparral dormant — Wrentit still calling from dry shrubs", "Mountain trails cold and wet after rain"],
    corridorOfDay: { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", why: "Deepest minus tides of the year in morning hours. Gray Whale visible from the bluff. The reef at maximum tidepool exposure — the best tidepoling of the year.", timing: "Check tide tables. Target -0.5 ft or lower between 7–10am. Arrive 45 minutes before low." },
    soundOfMonth: "Gray Whale blow offshore — the cloud of vapor visible from the Crystal Cove bluff on a clear December morning, the continent announcing the migration.",
    acousticPeak: "Crystal Cove surf + Black Oystercatcher alarm call on the reef + Gray Whale blow offshore — three simultaneous acoustic layers from a single bluff.",
    bloom: null, migrant: "Gray Whale offshore (southbound)", color: null,
    arcNote: "Deep winter onset. The Gray Whale is back offshore, moving south — the same individuals on the same route, year after year. If the first rain has come, the creeks are running and the fungi are emerging in the oak duff. The tidepools are at their most exposed. The county is quiet, purposeful, and cold.",
  },
];

// ── ACOUSTIC DATA ────────────────────────────────────────────────────────────
const BIOME_ACOUSTICS = [
  { biome: "Chaparral", icon: "🌾", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Wrentit trill — a dry, bouncing ball of sound that accelerates and then holds. The defining acoustic of Southern California chaparral.",
    species: ["Wrentit (year-round dominant)", "California Thrasher (spring mornings)", "California Quail (dawn and dusk chorus)", "Lazuli Bunting (spring migration)"],
    ambient: "Wind through mature Chamise — a dry papery rustle distinct from all other shrubs. The heat shimmer has a sound: the clicking and ticking of contracting vegetation in peak afternoon sun.",
    whenBest: "Dawn in April–May. The full chaparral chorus before 8am is one of the most species-dense acoustic events in OC." },
  { biome: "Coastal Sage Scrub", icon: "🌿", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "California Gnatcatcher mew — a thin descending call that sounds like a small cat, delivered from the top of California Sagebrush in the coastal wind.",
    species: ["California Gnatcatcher (year-round, most vocal Feb–Jun)", "California Towhee (constant chink notes)", "Bewick's Wren (complex song)", "Allen's Hummingbird (Jan–Jun on coast)"],
    ambient: "Coastal wind through sagebrush — a softer, more aromatic rustle than chaparral. The marine layer dampens the acoustic on June mornings, making calls carry differently than on clear days.",
    whenBest: "March through June on coastal bluffs. The Gnatcatcher is loudest in the morning breeze before the marine layer lifts." },
  { biome: "Riparian Corridor", icon: "🦋", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Song Sparrow — the most reliable acoustic anchor of any OC riparian. A variable, multi-phrase song that begins each verse with 3–4 identical introductory notes.",
    species: ["Song Sparrow (year-round)", "Common Yellowthroat (witchety-witchety)", "Black Phoebe (at every water crossing)", "Least Bell's Vireo (May–August, federally endangered)"],
    ambient: "Creek sound — the acoustic of moving water changes with the season. Winter: fast and loud after rain. Summer: the trickle of diminishing flow.",
    whenBest: "May through June in the willow sections. The Vireo and the creek together produce the most conservation-significant acoustic in south OC." },
  { biome: "Coastal Wetland", icon: "🦅", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Ridgway's Rail — a rapid descending kek-kek-kek from deep cordgrass. Heard far more than seen. The acoustic proof that the marsh is functioning.",
    species: ["Ridgway's Rail (year-round, most vocal at dawn)", "Belding's Savannah Sparrow (thin buzzy song)", "Willet (loud keew-keew in flight)", "Black-crowned Night Heron (harsh quok at dawn)"],
    ambient: "Tidal water movement through the cordgrass channels — a constant background sound that changes character with tidal phase.",
    whenBest: "Dawn at any tide, or high tide when the rails are pushed to the marsh edge. October through March for maximum shorebird call density." },
  { biome: "Oak Woodland", icon: "🌳", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Acorn Woodpecker — waka-waka-waka from the granary tree. The colony noise audible from a distance before the oak woodland is visible.",
    species: ["Acorn Woodpecker (year-round colony)", "Steller's Jay (loud and complex)", "Western Scrub-Jay", "Hutton's Vireo (spring breeding)"],
    ambient: "Oak leaf rustle — a softer, more rounded sound than chaparral. The acorn granary tree creaks in wind. Canyon wrens in rocky outcrops produce the most beautiful descending cascade in the OC acoustic catalog.",
    whenBest: "Year-round. The Acorn Woodpecker colony is audible even in winter dormancy. Spring mornings bring the full woodland chorus." },
  { biome: "Rocky Intertidal / Reef", icon: "🐚", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Black Oystercatcher kleep — a loud, sharp, carrying call from every rocky point. The acoustic anchor of the OC reef.",
    species: ["Black Oystercatcher (year-round on every rocky point)", "Western Gull (overhead)", "Brandt's Cormorant (in flight)", "Surfbird (Oct–Mar on exposed rocks)"],
    ambient: "Surf against cobble — a deep grinding bass note distinct from sandy beach surf. Cobble rolls and clatters in the wave backwash, a percussion layer beneath the wave roar.",
    whenBest: "Morning at minus tide. The near-silence of the tidepool between surges — then the Black Oystercatcher call — is the defining reef acoustic experience." },
  { biome: "Night Layer", icon: "🌙", color: "rgba(255,255,255,0.85)", bg: "#1A1A17", border: "rgba(255,255,255,0.07)",
    signature: "Great Horned Owl — the low, resonant hoo-h'HOO-hoo-hoo from the oak woodland edge at dusk.",
    species: ["Great Horned Owl (year-round, most vocal Nov–Feb)", "Common Poorwill (chaparral edges, spring–summer)", "Burrowing Owl (grassland edges, Oct–Mar)", "Pacific Tree Frog chorus (canyon pools, Jan–Apr after rain)"],
    ambient: "Crickets — the constant background acoustic of summer and fall nights. Their absence is one of the first acoustic signals of winter.",
    whenBest: "One hour after sunset, October to May. The Great Horned Owl and the Pacific Tree Frog chorus together are the deepest nocturnal acoustic layer in OC." },
];

const CORRIDOR_ACOUSTICS = [
  { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea", icon: "⛰", color: "#182028",
    signature: "Four acoustic environments in 22 miles. The sound shifts are as dramatic as the biome shifts.",
    zones: [
      { label: "Miles 0–6", desc: "Wrentit-dominated chaparral — dry, hot, enclosed. The interior OC acoustic at its purest." },
      { label: "Miles 6–13", desc: "Open grassland and sage — Red-tailed Hawk thermal cry, meadowlark song, wind. The acoustic opens dramatically." },
      { label: "Miles 13–17", desc: "San Diego Creek riparian — creek sound, Song Sparrow, Common Yellowthroat. The water acoustic begins." },
      { label: "Miles 17–22", desc: "Newport Bay marsh — tidal sound, Ridgway's Rail, shorebird calls, wind over open water." },
    ] },
  { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay", icon: "🌊", color: "#101A22",
    signature: "The most complex tidal soundscape in OC — four acoustic phases per day, shifting with the tide cycle.",
    zones: [
      { label: "Incoming tide", desc: "Water hiss through cordgrass channels. Shorebirds compressing onto the shrinking mudflat edge." },
      { label: "High tide", desc: "Ridgway's Rail most vocal — pushed to the marsh edge. Pelicans circle over deepened channels." },
      { label: "Outgoing tide", desc: "Shorebirds spreading back across the re-emerging mudflat. Continuous low tidal drain sound." },
      { label: "Low tide", desc: "Curlew and Godwit calls across the maximum mudflat exposure. The acoustic opens to its widest." },
    ] },
  { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove Ridge-to-Sea", icon: "🐚", color: "#141E1C",
    signature: "From enclosed chaparral to cobble surf — four distinct sound environments in 18 miles.",
    zones: [
      { label: "Miles 0–5", desc: "Enclosed chaparral acoustic — warm, insect-rich, Wrentit. The ocean is 14 miles away and acoustically absent." },
      { label: "Miles 5–10", desc: "El Moro Canyon riparian — creek sound, canyon wrens, Acorn Woodpecker. Canyon walls focus and amplify." },
      { label: "Miles 10–14", desc: "Coastal terrace — wind dominant, California Gnatcatcher, the first surf sound at the bluff edge." },
      { label: "Miles 14–18", desc: "Cobble reef — surf percussion, Black Oystercatcher, wind through cottage structures, tidepool surge-and-drain." },
    ] },
  { id: "69e06ef8ae83438254c22903", name: "San Juan Creek", icon: "🌳", color: "#3A2A1C",
    signature: "Mountain stream to Pacific harbor — the acoustic completes a full transformation.",
    zones: [
      { label: "Miles 0–7", desc: "Cleveland NF canyon — creek sound, Acorn Woodpecker colony, Pacific Wren. The most intimate acoustic on the corridor." },
      { label: "Miles 7–15", desc: "Juaneño lowland — Vireo song from willow thickets, Cliff Swallow chattering in spring, mission bells Easter egg acoustic." },
      { label: "Miles 15–22", desc: "Doheny terminus — creek merging with harbor sounds, gulls, Pacific surf. The mountain acoustic is gone." },
    ] },
  { id: "69e0289d7669e7f23c9f9c4b", name: "Santiago Creek", icon: "🌆", color: "#4A3A2A",
    signature: "The most honest acoustic in OC — creek, birds, freeway, cottonwood rustle, and the Vireo singing over all of it.",
    zones: [
      { label: "Miles 0–4", desc: "Upper wilderness transition — creek sound, Acorn Woodpecker, Vireo in spring. Deceptively wild acoustic 200m from the strip mall." },
      { label: "Miles 4–9", desc: "Urban riparian — creek + traffic layer + Black Phoebe + cottonwood flutter. The honest acoustic of urban Southern California ecology." },
      { label: "Miles 9–14", desc: "Santa Ana River confluence — creek meets river, Great Blue Heron, the mountain water acoustic fading into the coastal drainage sound." },
    ] },
];

const TIME_ACOUSTICS = [
  { label: "Pre-dawn", icon: "🌑", hours: [0,1,2,3,4], color: "#0D1018", desc: "Ridgway's Rail from the marsh. Great Horned Owl from the oak woodland edge. The nocturnal layer at maximum density.", cue: "If you hear the Rail calling in darkness, you are in a functioning marsh. That sound is increasingly rare in Southern California." },
  { label: "Dawn Window", icon: "🌅", hours: [5,6,7,8], color: "#3A2A1C", desc: "The most acoustically dense hours of the day. Every species singing simultaneously — the full ecological chorus.", cue: "The dawn window at Upper Newport Bay in October: Rail clucking, Night Heron returning, Savannah Sparrow beginning, shorebird layer activating — all within 30 minutes." },
  { label: "Morning", icon: "🌤", hours: [9,10,11], color: "#1A1C18", desc: "Song activity winding down as temperatures rise. Woodpeckers still active. Individual calls easier to isolate.", cue: "Best time to focus on individual species rather than the full chorus — easier to identify single birds once the dawn density fades." },
  { label: "Midday", icon: "☀️", hours: [12,13,14], color: "#1C1A10", desc: "The quietest acoustic window. Thermal raptors circling in silence. Insects most active.", cue: "The midday quiet is not emptiness — it is the sound of thermals, insect stridulation, and the heat pressing down." },
  { label: "Afternoon", icon: "🌇", hours: [15,16,17], color: "#4A5C2A", desc: "Coastal wind picks up. Sage scrub smells more strongly. Swallows active over water.", cue: "The afternoon wind acoustic on the Crystal Cove bluff — sagebrush and offshore wind together." },
  { label: "Dusk", icon: "🌆", hours: [18,19], color: "#1C1610", desc: "Common Poorwill on chaparral edges in summer. Bats emerging. The diurnal layer fading.", cue: "The Poorwill call from the chaparral edge at dusk — a soft, repeated poorwill — is the acoustic hinge between the diurnal and nocturnal worlds." },
  { label: "Night", icon: "🌙", hours: [20,21,22,23], color: "#0D0D18", desc: "Great Horned Owl dominant. Pacific Tree Frog chorus at canyon pools after rain. Cricket stridulation everywhere.", cue: "The Pacific Tree Frog chorus in January after the first rain — hundreds of frogs calling from a dark canyon pool — is the most emotionally powerful ecological sound in OC." },
];

const CANONICAL_NAMES = {
  "69e069445c7bb4cecf803289": { name: "Mountains-to-Sea",  icon: "⛰", color: "#182028" },
  "69e0248656b58bca7d679d30": { name: "Upper Newport Bay", icon: "🌊", color: "#101A22" },
  "69e005f2b447b8e1f109219e": { name: "Crystal Cove",      icon: "🐚", color: "#141E1C" },
  "69e06ef8ae83438254c22903": { name: "San Juan Creek",    icon: "🌳", color: "#3A2A1C" },
  "69e0289d7669e7f23c9f9c4b": { name: "Santiago Creek",   icon: "🌆", color: "#4A3A2A" },
};
const ALL_FIVE_IDS = Object.keys(CANONICAL_NAMES);

const getTidePhase = (h) => {
  if (h >= 5  && h < 8)  return { label: "Low tide window", icon: "⬇️", note: "Mudflats and tidepool zones most exposed" };
  if (h >= 8  && h < 11) return { label: "Rising tide",     icon: "↗️", note: "Shorebirds concentrating at the marsh edge" };
  if (h >= 11 && h < 14) return { label: "High tide",       icon: "⬆️", note: "Rails pushed to marsh edge — most vocal" };
  if (h >= 14 && h < 17) return { label: "Falling tide",    icon: "↘️", note: "Mudflats emerging — foraging activity increasing" };
  if (h >= 17 && h < 20) return { label: "Evening low",     icon: "⬇️", note: "Evening tidepool window — summer months" };
  return                        { label: "Nighttime tide",   icon: "🌙", note: "Nocturnal tidal cycle active" };
};
const getTimeAcoustic = (h) => TIME_ACOUSTICS.find((t) => t.hours.includes(h)) || TIME_ACOUSTICS[1];

export default function Seasonal() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("today"); // "today" | "acoustic" | "arc" | "field"
  const [activeBiome, setActiveBiome] = useState(null);
  const [activeCorr, setActiveCorr] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const [fieldObs, setFieldObs]   = useState([]);
  const [fieldSp,  setFieldSp]    = useState({});
  const [fieldLoad, setFieldLoad] = useState(false);
  const [fieldDone, setFieldDone] = useState(false);

  const MONTH_SEASON_F = {
    0:"winter",1:"winter",2:"spring",3:"spring",4:"spring",
    5:"summer",6:"summer",7:"summer",8:"fall",9:"fall",10:"fall",11:"winter",
  };
  const RARE_FLAGS_F = ["endangered","threatened","critically endangered","rare","very rare",
    "state threatened","federally threatened","federally endangered"];

  useEffect(() => {
    if (mode !== "field" || fieldDone) return;
    setFieldLoad(true);
    async function loadField() {
      let all = [], skip = 0, more = true;
      while (more) {
        const pg = await Observation.filter({}).catch(() => []);
        if (!Array.isArray(pg) || !pg.length) break;
        all = all.concat(pg); more = pg.length === 500; skip += 500;
      }
      setFieldObs(all);
      const ids = [...new Set(all.map(o => o.speciesId).filter(Boolean))];
      if (ids.length) {
        const sp = await Species.filter({}).catch(() => []);
        const m = {}; sp.filter(Boolean).forEach(s => { m[s.id] = s; });
        setFieldSp(m);
      }
      setFieldLoad(false); setFieldDone(true);
    }
    loadField();
  }, [mode]);

  const now    = new Date();
  const month  = now.getMonth();
  const hour   = now.getHours();
  const day    = now.getDate();
  const cal    = CALENDAR[month];
  const tide   = getTidePhase(hour);
  const timeAc = getTimeAcoustic(hour);
  const corridor = cal.corridorOfDay;
  const corrDef  = corridor.allFour ? null : CANONICAL_NAMES[corridor.id];

  return (
    <div style={{ background:"#0F0F0D", minHeight:"100vh", padding:"0 0 80px" }}><div style={{ padding:"24px 20px 0" }}>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#7FAF8A" }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#7FAF8A" }}>
            Today · {cal.month} {day}
          </span>
        </div>
        <h1 className="font-bold mb-1"
          style={{ color: "rgba(255,255,255,0.90)", fontSize: "22px", fontFamily: "Georgia, serif", fontWeight: "400", letterSpacing: "-0.01em" }}>
          {mode === "field" ? "My Field Record" : mode === "acoustic" ? "Acoustic Mode" : mode === "arc" ? "Seasonal Arc"
            : `${cal.phaseIcon} ${cal.phase}`}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {mode === "field" ? "Your personal sightings by season." : mode === "acoustic" ? "The sound layer of Orange County — what you'd hear right now."
           : mode === "arc" ? "The full ecological year — what the land does, month by month."
           : "What Orange County looks like right now."}
        </p>
      </div>

      {/* Mode toggle — three tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {[
          { id: "today",    label: "Today" },
          { id: "acoustic", label: "Acoustic" },
          { id: "arc",      label: "Year Arc" },
          { id: "field",    label: "My Field" },
        ].map((v) => (
          <button key={v.id} onClick={() => setMode(v.id)}
            style={{
              background: mode === v.id ? "rgba(122,184,122,0.10)" : "rgba(255,255,255,0.04)",
              color:      mode === v.id ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.35)",
              border:     mode === v.id ? "1px solid rgba(122,184,122,0.28)" : "1px solid rgba(255,255,255,0.07)",
              cursor:"pointer", flexShrink:0,
              padding:"8px 16px", borderRadius:20, fontSize:12, fontWeight:600,
              letterSpacing:"0.04em", whiteSpace:"nowrap",
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════ TODAY'S WINDOW */}
      {mode === "today" && (
        <>
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: "32px" }}>{cal.phaseIcon}</span>
              <div>
                <div className="font-bold" style={{ color: "#F0E9D6", fontSize: "20px", letterSpacing: "-0.01em" }}>{cal.phase}</div>
                <div style={{ color: "#7FAF8A", fontSize: "13px" }}>{cal.month} · Orange County</div>
              </div>
            </div>
            {/* Arc note — one-sentence ecological truth for this month */}
            {cal.arcNote && (
              <div className="mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(127,175,138,0.15)" }}>
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: "1.7",
                  fontStyle: "italic", fontFamily: "Georgia, serif", letterSpacing: "0.01em" }}>
                  "{cal.arcNote}"
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ marginTop:"12px" }}>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div style={{ color: "#7FAF8A", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Marine Layer</div>
                <div style={{ color: "#C4DFC8", fontSize: "12px", lineHeight: "1.4" }}>{cal.marineLayer}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div style={{ color: "#7FAF8A", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Tidal Note</div>
                <div style={{ color: "#C4DFC8", fontSize: "12px", lineHeight: "1.4" }}>{cal.tideCue}</div>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{timeAc.icon}</div>
              <div className="font-semibold" style={{ color: "rgba(255,255,255,0.88)", fontSize: "13px" }}>{timeAc.label}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", marginTop: "3px", lineHeight: "1.4" }}>{timeAc.desc}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{tide.icon}</div>
              <div className="font-semibold" style={{ color: "rgba(255,255,255,0.88)", fontSize: "13px" }}>{tide.label}</div>
              <div style={{ color: "rgba(255,255,255,0.60)", fontSize: "12px", marginTop: "3px", lineHeight: "1.4" }}>{tide.note}</div>
            </div>
          </div>

          <div className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span>🔭</span>
              <h2 className="font-semibold" style={{ color: "rgba(255,255,255,0.88)", fontSize: "12px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                What's Peaking in {cal.month}
              </h2>
            </div>
            <ul className="space-y-2">
              {cal.peaking.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#7FAF8A" }} />
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", lineHeight: "1.6" }}>{p}</span>
                </li>
              ))}
            </ul>
            {cal.quiet?.length > 0 && cal.quiet[0] !== "Nothing is quiet in October." && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "rgba(255,255,255,0.50)", fontSize: "12px", marginBottom: "6px", fontWeight: "500" }}>Quiet this month:</div>
                {cal.quiet.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }} />
                    <span style={{ color: "rgba(255,255,255,0.50)", fontSize: "13px", lineHeight: "1.5" }}>{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Corridor of the day */}
          <div className="mb-4">
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"10px" }}>Corridor of the Day</div>
            {corridor.allFour ? (
              <div className="rounded-2xl p-5" style={{ background: "#2A1C0F", border: "1px solid rgba(212,136,58,0.3)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>🍁</span>
                  <div className="font-bold" style={{ color: "#F0E9D6", fontSize: "16px" }}>{corridor.name}</div>
                </div>
                <div style={{ color: "#C4A87A", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>{corridor.why}</div>
                <div style={{ color: "#8A7A5A", fontSize: "12px", marginBottom: "14px" }}>{corridor.timing}</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {ALL_FIVE_IDS.map((cid) => {
                    const c = CANONICAL_NAMES[cid];
                    return (
                      <button key={cid} onClick={() => navigate(`/corridors/${cid}`)}
                        className="rounded-xl p-3 text-left transition-all hover:opacity-80"
                        style={{ background: `${c.color}80`, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                        <div style={{ fontSize: "16px", marginBottom: "2px" }}>{c.icon}</div>
                        <div style={{ color: "#F0E9D6", fontSize: "12px", fontWeight: "600" }}>{c.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button onClick={() => corridor.id && navigate(`/corridors/${corridor.id}`)}
                className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{ background: corrDef?.color || "#1C3A2A", border: "1px solid rgba(127,175,138,0.2)",
                  boxShadow: `0 4px 20px ${corrDef?.color || "#1C3A2A"}40`, cursor: "pointer" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: "24px" }}>{corrDef?.icon}</span>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.30)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>Corridor of the Day</div>
                    <div className="font-bold" style={{ color: "#F0E9D6", fontSize: "18px" }}>{corridor.name}</div>
                  </div>
                </div>
                <div style={{ color: "#C4DFC8", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>{corridor.why}</div>
                <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ color: "#A8D5B0", fontSize: "12px" }}>⏰ {corridor.timing}</div>
                </div>
              </button>
            )}
          </div>

          {/* Sound of the month */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "#1C3A2A", border: "1px solid rgba(127,175,138,0.15)" }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "22px" }}>🎵</span>
              <div>
                <div style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Sound of {cal.month}</div>
                <div style={{ color: "#F0E9D6", fontSize: "14px", lineHeight: "1.65", fontStyle: "italic" }}>"{cal.soundOfMonth}"</div>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => setMode("acoustic")} style={{ color: "#7FAF8A", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", fontWeight: "500" }}>Acoustic Mode →</button>
                  <button onClick={() => setMode("arc")} style={{ color: "#7FAF8A", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", fontWeight: "500" }}>Year Arc →</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ ACOUSTIC MODE */}
      {mode === "acoustic" && (
        <>
          <div className="rounded-2xl p-5 mb-5"
            style={{ background: timeAc.color, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: "28px" }}>{timeAc.icon}</span>
              <div>
                <div className="font-bold" style={{ color: "#F0E9D6", fontSize: "18px" }}>Right Now: {timeAc.label}</div>
                <div style={{ color: "rgba(255,255,255,0.30)", fontSize: "12px" }}>{cal.month} · {hour}:00</div>
              </div>
            </div>
            <div style={{ color: "#C4DFC8", fontSize: "14px", lineHeight: "1.65", marginBottom: "10px" }}>{timeAc.desc}</div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Field Cue</div>
              <div style={{ color: "#A8D5B0", fontSize: "13px", lineHeight: "1.5", fontStyle: "italic" }}>"{timeAc.cue}"</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: "#1C3A2A", border: "1px solid rgba(127,175,138,0.2)" }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "22px" }}>🎵</span>
              <div>
                <div style={{ color: "#7FAF8A", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "5px" }}>Acoustic Peak · {cal.month}</div>
                <div style={{ color: "#F0E9D6", fontSize: "14px", lineHeight: "1.65", fontStyle: "italic" }}>"{cal.acousticPeak}"</div>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>Corridor Sound Signatures</div>
            <div className="space-y-2">
              {CORRIDOR_ACOUSTICS.map((c) => {
                const isActive = activeCorr === c.id;
                return (
                  <div key={c.id}>
                    <button onClick={() => setActiveCorr(isActive ? null : c.id)}
                      className="w-full text-left rounded-2xl p-4 transition-all"
                      style={{ background: c.color, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: "20px" }}>{c.icon}</span>
                          <div>
                            <div className="font-semibold" style={{ color: "#F0E9D6", fontSize: "14px" }}>{c.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", marginTop: "1px" }}>{c.signature}</div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: "#7FAF8A", transform: isActive ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                    {isActive && (
                      <div className="rounded-b-2xl px-4 pb-4 pt-3 space-y-2"
                        style={{ background: `${c.color}90`, borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", marginTop: "-4px" }}>
                        {c.zones.map((z, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-semibold mt-0.5 flex-shrink-0 px-2 py-0.5 rounded"
                              style={{ background: "rgba(255,255,255,0.1)", color: "#A8D5B0", whiteSpace: "nowrap" }}>{z.label}</span>
                            <span style={{ color: "#C4DFC8", fontSize: "13px", lineHeight: "1.5" }}>{z.desc}</span>
                          </div>
                        ))}
                        <button onClick={() => navigate(`/TrailDetail?id=${c.id}`)}
                          style={{ color: "#7FAF8A", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", fontWeight: "500", marginTop: "4px" }}>
                          Open trail detail →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>Biome Acoustic Zones</div>
            <div className="space-y-2">
              {BIOME_ACOUSTICS.map((b) => {
                const isActive = activeBiome === b.biome;
                return (
                  <div key={b.biome}>
                    <button onClick={() => setActiveBiome(isActive ? null : b.biome)}
                      className="w-full text-left rounded-2xl p-4 transition-all"
                      style={{ background: b.bg, border: `1px solid ${b.border}`, cursor: "pointer" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: "20px" }}>{b.icon}</span>
                          <div>
                            <div className="font-semibold" style={{ color: b.color, fontSize: "14px" }}>{b.biome}</div>
                            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", marginTop: "1px" }}>{b.signature.split(" — ")[0]}</div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: b.color, transform: isActive ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                    {isActive && (
                      <div className="rounded-b-2xl px-4 pb-4 pt-3"
                        style={{ background: b.bg, borderLeft: `1px solid ${b.border}`, borderRight: `1px solid ${b.border}`, borderBottom: `1px solid ${b.border}`, marginTop: "-4px" }}>
                        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px", fontStyle: "italic" }}>"{b.signature}"</div>
                        <div className="mb-3">
                          <div style={{ color: b.color, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Acoustic Species</div>
                          {b.species.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1">
                              <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: b.color }} />
                              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>{s}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mb-3">
                          <div style={{ color: b.color, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Ambient Sound</div>
                          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.5" }}>{b.ambient}</div>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div style={{ color: b.color, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Best Window</div>
                          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{b.whenBest}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>Daily Acoustic Arc</div>
            <div className="space-y-2">
              {TIME_ACOUSTICS.map((t) => {
                const isCurrent = t.hours.includes(hour);
                return (
                  <div key={t.label} className="flex items-center gap-3 rounded-xl p-2.5"
                    style={{ background: isCurrent ? "#1C3A2A" : "transparent", border: isCurrent ? "1px solid rgba(127,175,138,0.3)" : "1px solid transparent" }}>
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>{t.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: isCurrent ? "#A8D5B0" : "rgba(255,255,255,0.55)", fontSize: "13px" }}>
                        {t.label} {isCurrent && <span style={{ fontSize: "10px", color: "#7FAF8A" }}>← now</span>}
                      </div>
                      <div style={{ color: isCurrent ? "#7FAF8A" : "rgba(255,255,255,0.40)", fontSize: "11px" }}>{t.desc.split(" — ")[0]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ SEASONAL ARC */}
      {mode === "arc" && (
        <>
          {/* Year at a glance */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"14px" }}>The Ecological Year</div>
            <div className="grid grid-cols-4 gap-1.5 md:grid-cols-6 mb-3">
              {CALENDAR.map((m, i) => (
                <button key={m.month} onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  className="rounded-xl py-2 px-1 text-center transition-all hover:opacity-80"
                  style={{
                    background: i === month ? "rgba(127,175,138,0.25)" : expandedMonth === i ? "rgba(127,175,138,0.12)" : "rgba(255,255,255,0.06)",
                    border: i === month ? "1px solid rgba(127,175,138,0.5)" : expandedMonth === i ? "1px solid rgba(127,175,138,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}>
                  <div style={{ fontSize: "16px" }}>{m.phaseIcon}</div>
                  <div style={{ color: i === month ? "#A8D5B0" : "#7FAF8A", fontSize: "9px", fontWeight: "600", letterSpacing: "0.03em", marginTop: "2px" }}>
                    {m.month.slice(0, 3).toUpperCase()}
                  </div>
                  {i === month && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#7FAF8A", margin: "2px auto 0" }} />}
                </button>
              ))}
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", lineHeight: "1.5", fontStyle:"italic" }}>
              Tap any month to expand.
            </div>
          </div>

          {/* Expanded month detail */}
          {expandedMonth !== null && (
            <div className="rounded-2xl p-5 mb-5"
              style={{ background: "#1A1A17", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "28px" }}>{CALENDAR[expandedMonth].phaseIcon}</span>
                  <div>
                    <div className="font-bold" style={{ color: "rgba(255,255,255,0.88)", fontSize: "18px" }}>{CALENDAR[expandedMonth].month}</div>
                    <div style={{ color: "#7FAF8A", fontSize: "13px" }}>{CALENDAR[expandedMonth].phase}</div>
                  </div>
                </div>
                <button onClick={() => setExpandedMonth(null)}
                  style={{ color: "rgba(255,255,255,0.30)", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
              </div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "15px", lineHeight: "1.7", marginBottom: "14px", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                "{CALENDAR[expandedMonth].arcNote}"
              </div>
              <div className="space-y-2">
                {CALENDAR[expandedMonth].bloom && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: "14px" }}>🌸</span>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: "1.5" }}><span style={{fontSize:"9px",fontWeight:"700",letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.30)",marginRight:"6px"}}>Bloom</span>{CALENDAR[expandedMonth].bloom}</span>
                  </div>
                )}
                {CALENDAR[expandedMonth].migrant && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: "14px" }}>🦅</span>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: "1.5" }}><span style={{fontSize:"9px",fontWeight:"700",letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.30)",marginRight:"6px"}}>Migration</span>{CALENDAR[expandedMonth].migrant}</span>
                  </div>
                )}
                {CALENDAR[expandedMonth].color && (
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: "14px" }}>🍂</span>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: "1.5" }}><span style={{fontSize:"9px",fontWeight:"700",letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.30)",marginRight:"6px"}}>Color</span>{CALENDAR[expandedMonth].color}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span style={{ fontSize: "14px" }}>🎵</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: "1.5" }}><span style={{fontSize:"9px",fontWeight:"700",letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(255,255,255,0.30)",marginRight:"6px"}}>Sound</span>{CALENDAR[expandedMonth].soundOfMonth}</span>
                </div>
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ color: "rgba(255,255,255,0.50)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Peaking this month</div>
                <div className="flex flex-wrap gap-1.5">
                  {CALENDAR[expandedMonth].peaking.slice(0, 4).map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {p.split(" — ")[0].split(" (")[0]}
                    </span>
                  ))}
                </div>
              </div>
              {CANONICAL_NAMES[CALENDAR[expandedMonth].corridorOfDay?.id] && (
                <button onClick={() => navigate(`/corridors/${CALENDAR[expandedMonth].corridorOfDay.id}`)}
                  className="w-full mt-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
                  style={{ background: "#1C3A2A", color: "#A8D5B0", border: "1px solid rgba(127,175,138,0.3)", cursor: "pointer" }}>
                  {CANONICAL_NAMES[CALENDAR[expandedMonth].corridorOfDay.id]?.icon} {CANONICAL_NAMES[CALENDAR[expandedMonth].corridorOfDay.id]?.name} · {CALENDAR[expandedMonth].month}
                </button>
              )}
            </div>
          )}

          {/* The five corridors through the year */}
          <div className="mb-5">
            <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>Five Corridors · Seasonal Calendar</div>
            <div className="space-y-2">
              {ALL_FIVE_IDS.map((cid) => {
                const c = CANONICAL_NAMES[cid];
                const monthsActive = CALENDAR.filter((m) => m.corridorOfDay?.id === cid).map((m) => m.month.slice(0, 3));
                return (
                  <button key={cid} onClick={() => navigate(`/corridors/${cid}`)}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                    style={{ background: c.color, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "18px" }}>{c.icon}</span>
                        <div className="font-semibold" style={{ color: "#F0E9D6", fontSize: "14px" }}>{c.name}</div>
                      </div>
                      <svg className="w-4 h-4" style={{ color: "#7FAF8A" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {monthsActive.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: "rgba(127,175,138,0.25)", color: "#A8D5B0" }}>{m}</span>
                      ))}
                      <span className="px-1.5 py-0.5 rounded text-xs"
                        style={{ background: "rgba(212,136,58,0.25)", color: "#D4883A" }}>🍂 Oct peak</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* October convergence */}
          <div className="rounded-2xl p-4"
            style={{ background: "#2A1C0F", border: "1px solid rgba(212,136,58,0.25)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span>🍁</span>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#D4883A" }}>October Convergence — All Five Corridors</div>
            </div>
            <div style={{ color: "#C4A87A", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>
              October is the one month where all five canonical corridors peak simultaneously — each for a different ecological reason.
            </div>
            <div className="space-y-1.5">
              {ALL_FIVE_IDS.map((cid) => {
                const c = CANONICAL_NAMES[cid];
                const octoberNote = CALENDAR[9].peaking.find((p) => p.toLowerCase().includes(c.name.split(" ")[0].toLowerCase()));
                return (
                  <div key={cid} className="flex items-start gap-2">
                    <span style={{ fontSize: "12px", marginTop: "1px" }}>{c.icon}</span>
                    <span style={{ color: "#8A7A5A", fontSize: "12px", lineHeight: "1.4" }}>
                      <strong style={{ color: "#C4A87A" }}>{c.name}:</strong> October peak
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}


      {/* ════════════════ MY FIELD */}
      {mode === "field" && (() => {
        if (fieldLoad) return (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", border:"2px solid #4A7C59",
              borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
          </div>
        );
        if (!fieldObs.length) return (
          <div style={{ borderRadius:12, padding:"40px 20px", textAlign:"center", marginBottom:16,
            background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Field Record</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:13, lineHeight:1.8,
              fontFamily:"Georgia,serif", fontStyle:"italic" }}>
              No sightings recorded yet.
            </div>
          </div>
        );
        const bySeason = { spring:[], summer:[], fall:[], winter:[] };
        fieldObs.forEach(o => {
          const m = o.month != null ? Number(o.month)
            : o.timestamp ? new Date(o.timestamp).getMonth()
            : o.created_date ? new Date(o.created_date).getMonth() : null;
          const s = o.season || (m != null ? MONTH_SEASON_F[m] : null);
          if (s && bySeason[s]) bySeason[s].push(o);
        });
        const currentSeason = MONTH_SEASON_F[now.getMonth()];
        const SC = {
          spring:{ bg:"#1A1A17", accent:"#7AB87A", header:"#131C14" },
          summer:{ bg:"#1A1A17", accent:"#C4974A", header:"#1C1810" },
          fall:  { bg:"#1A1A17", accent:"#C47A7A", header:"#1C1212" },
          winter:{ bg:"#1A1A17", accent:"#7A9AB8", header:"#111620" },
        };
        const SI = { spring:"SPR", summer:"SUM", fall:"FALL", winter:"WIN" };
        const totalSp  = new Set(fieldObs.map(o => o.speciesId).filter(Boolean)).size;
        const trailCnts = {};
        fieldObs.forEach(o => { if (o.trailId) trailCnts[o.trailId]=(trailCnts[o.trailId]||0)+1; });
        const topTE = Object.entries(trailCnts).sort((a,b)=>b[1]-a[1])[0];
        const topTN = topTE ? (fieldObs.find(o=>o.trailId===topTE[0])?.trailName||"").replace(/ Trail$/,"").slice(0,16) : null;

        return (
          <div>
            <div style={{ borderRadius:12, marginBottom:16, overflow:"hidden",
              background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:600,
                  textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Field Record</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))", gap:8 }}>
                  {[
                    { label:"Species", val: totalSp },
                    { label:"Sightings", val: fieldObs.length },
                    { label:"This Season", val: bySeason[currentSeason].length },
                    topTN ? { label:"Top Trail", val: topTN } : null,
                  ].filter(Boolean).map((s,i) => (
                    <div key={i} style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>{s.label}</div>
                      <div style={{ color:"rgba(255,255,255,0.90)", fontSize: s.label==="Top Trail"?11:18,
                        fontWeight:400, fontFamily:"Georgia,serif", lineHeight:1.2 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {["spring","summer","fall","winter"].map(season => {
              const obs = bySeason[season];
              if (!obs.length) return null;
              const sc = SC[season];
              const isCurrent = season === currentSeason;
              const uniqueIds = [...new Set(obs.map(o => o.speciesId).filter(Boolean))];
              const resolved  = uniqueIds.map(id => fieldSp[id]).filter(Boolean);
              const sorted    = obs.filter(o=>o.timestamp).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
              const firstObs  = sorted[0];
              const firstSp   = firstObs ? fieldSp[firstObs.speciesId] : null;
              const rareObs   = obs.find(o => {
                const sp = fieldSp[o.speciesId];
                return sp && RARE_FLAGS_F.includes((sp.conservationStatus||sp.frequency||"").toLowerCase());
              });
              const rareSp = rareObs ? fieldSp[rareObs.speciesId] : null;
              const gc = {};
              obs.forEach(o => { const g = fieldSp[o.speciesId]?.group?.toLowerCase(); if(g) gc[g]=(gc[g]||0)+1; });
              const topGroup = Object.entries(gc).sort((a,b)=>b[1]-a[1])[0];

              return (
                <div key={season} style={{ borderRadius:16, marginBottom:16, overflow:"hidden",
                  background:"#1A1A17",
                  border:`1px solid ${sc.accent}28`,
                  boxShadow: isCurrent ? `0 0 0 1px ${sc.accent}35` : "none" }}>
                  <div style={{ background: sc.header || sc.bg, padding:"14px 16px",
                    borderBottom:`1px solid ${sc.accent}20`,
                    display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ color:sc.accent, fontSize:10, fontWeight:700,
                        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>
                        {SI[season]} {season.charAt(0).toUpperCase()+season.slice(1)}
                        {isCurrent ? " · Active" : ""}
                      </div>
                      <div style={{ color:"rgba(255,255,255,0.90)", fontSize:18,
                        fontWeight:600, fontFamily:"Georgia,serif" }}>
                        {uniqueIds.length} species
                      </div>
                      <div style={{ color:sc.accent, fontSize:11, marginTop:3, opacity:0.65 }}>
                        {obs.length} sightings{topGroup ? ` · mostly ${topGroup[0]}` : ""}
                      </div>
                    </div>
                    {isCurrent && (
                      <div style={{ display:"flex", alignItems:"center", gap:6,
                        background:"rgba(127,175,138,0.15)", borderRadius:20, padding:"4px 10px",
                        border:"1px solid rgba(127,175,138,0.3)" }}>
                        <div style={{ width:6, height:6, borderRadius:3, background:"#7FAF8A" }} />
                        <span style={{ color:"#A8D5B0", fontSize:10, fontWeight:700 }}>Now</span>
                      </div>
                    )}
                  </div>

                  {(firstSp || rareSp) && (
                    <div style={{ background:"#1A1A17", padding:"10px 12px",
                      borderTop:`1px solid rgba(255,255,255,0.05)`,
                      display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {firstSp && (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:10,
                          padding:"8px 10px", border:`1px solid ${sc.accent}20` }}>
                          <div style={{ fontSize:9, color:sc.accent, fontWeight:600,
                            textTransform:"uppercase", letterSpacing:"0.10em", marginBottom:4 }}>
                            First Sighting
                          </div>
                          <div style={{ color:"rgba(255,255,255,0.90)", fontSize:12, fontWeight:600 }}>{firstSp.name}</div>
                          {firstObs.timestamp && (
                            <div style={{ color:"rgba(255,255,255,0.40)", fontSize:10, marginTop:3 }}>
                              {new Date(firstObs.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                            </div>
                          )}
                        </div>
                      )}
                      {rareSp && (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:10,
                          padding:"8px 10px", border:"1px solid rgba(196,122,122,0.25)" }}>
                          <div style={{ fontSize:9, color:"#C47A7A", fontWeight:600,
                            textTransform:"uppercase", letterSpacing:"0.10em", marginBottom:4 }}>
                            Rare Find
                          </div>
                          <div style={{ color:"rgba(255,255,255,0.90)", fontSize:12, fontWeight:600 }}>{rareSp.name}</div>
                          <div style={{ color:"rgba(255,255,255,0.40)", fontSize:10, marginTop:3 }}>
                            {rareSp.conservationStatus || rareSp.frequency}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {resolved.length > 0 && (
                    <div style={{ background:"#0F0F0D", padding:"10px 12px",
                      borderTop:`1px solid rgba(255,255,255,0.05)`,
                      display:"grid", gap:5,
                      gridTemplateColumns:"repeat(auto-fill, minmax(52px, 1fr))" }}>
                      {resolved.slice(0,16).map(sp => (
                        <button key={sp.id}
                          onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                          style={{ aspectRatio:"1", borderRadius:10, overflow:"hidden",
                            background:"#252520", border:"none", padding:0, cursor:"pointer",
                            position:"relative" }}>
                          {sp.imageUrl && (
                            <img src={sp.imageUrl} alt={sp.name} loading="lazy"
                              style={{ width:"100%", height:"100%", objectFit:"cover" }}
                              onError={e => { e.currentTarget.style.display="none"; }} />
                          )}
                          <div style={{ position:"absolute", bottom:0, left:0, right:0,
                            padding:"2px 3px", background:"linear-gradient(transparent,rgba(0,0,0,0.72))" }}>
                            <div style={{ color:"#E8F4E8", fontSize:7, fontWeight:600,
                              overflow:"hidden", display:"-webkit-box",
                              WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                              {sp.name}
                            </div>
                          </div>
                        </button>
                      ))}
                      {resolved.length > 16 && (
                        <div style={{ aspectRatio:"1", borderRadius:10, background:"rgba(255,255,255,0.07)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, color:"#9BB8A4", fontWeight:700 }}>
                          +{resolved.length - 16}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

    </div><BottomNav active="seasonal" />
    </div>
  );
}
