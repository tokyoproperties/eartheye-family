import { useState, useEffect, useRef } from "react";
import { Species } from "../api/entities";

// ─── Flagged list (embedded — generated from eartheye_flagged8.json) ───────────
// Scientific name map for verified iNat fetches (Protocol 60 compliant)
const SCI_NAME_MAP = {
  "Anise Swallowtail": "Papilio zelicaon",
  "Backswimmer": "Notonecta spinosa",
  "Black Witch Moth": "Ascalapha odorata",
  "Blue Dasher": "Pachydiplax longipennis",
  "Blue-eyed Darner": "Rhionaeschna multicolor",
  "Buckeye Butterfly": "Junonia coenia",
  "Cabbage White": "Pieris rapae",
  "California Carpenter Ant": "Camponotus yogi",
  "California Dobsonfly": "Neohermes californicus",
  "California Firefly": "Photinus californicus",
  "California Mantis": "Stagmomantis californica",
  "California Native Bumble Bee": "Bombus caliginosus",
  "California Tortoiseshell": "Nymphalis californica",
  "Cardinal Meadowhawk": "Sympetrum illotum",
  "Carpenter Bee": "Xylocopa tabaniformis",
  "Ceanothus Silk Moth": "Hyalophora euryalus",
  "Charcoal Beetle": "Melanophila acuminata",
  "Click Beetle": "Alaus melanops",
  "Convergent Lady Beetle": "Hippodamia convergens",
  "Darkling Beetle": "Eleodes osculans",
  "Flame Skimmer": "Libellula saturata",
  "Giant Water Bug": "Lethocerus americanus",
  "Gray Hairstreak": "Strymon melinus",
  "Green Darner": "Anax junius",
  "Honey Bee": "Apis mellifera",
  "Jerusalem Cricket": "Stenopelmatus fuscus",
  "Lady Beetle": "Coccinella septempunctata",
  "Leafcutter Bee": "Megachile brevis",
  "Marine Blue": "Leptotes marina",
  "Mosquito": "Culex quinquefasciatus",
  "Mourning Cloak": "Nymphalis antiopa",
  "Pacific Forktail Damselfly": "Ischnura cervula",
  "Painted Lady": "Vanessa cardui",
  "Pandorus Sphinx Moth": "Eumorpha pandorus",
  "Red Admiral": "Vanessa atalanta",
  "Red Velvet Ant": "Dasymutilla aureola",
  "Robber Fly": "Efferia albibarbis",
  "Sphinx Moth": "Manduca sexta",
  "Sweat Bee": "Halictus rubicundus",
  "Tarantula Hawk": "Pepsis thisbe",
  "Valley Carpenter Bee": "Xylocopa varipuncta",
  "Wandering Glider": "Pantala flavescens",
  "Water Boatman": "Hesperocorixa laevigata",
  "Water Strider": "Aquarius remigis",
  "Western Honey Bee": "Apis mellifera",
  "Western Leaf-footed Bug": "Leptoglossus zonatus",
  "Western Predatory Bush Katydid": "Scudderia furcata",
  "Western Tussock Moth": "Orgyia vetusta",
  "Western Yellowjacket": "Vespula pensylvanica",
  "Whirligig Beetle": "Gyrinus parcus",
  "White-lined Sphinx Moth": "Hyles lineata",
  "Yellow-faced Bumble Bee": "Bombus vosnesenskii",
  // Fish
  "Bat Ray": "Myliobatis californica",
  "Black Surfperch": "Embiotoca jacksoni",
  "Bluegill": "Lepomis macrochirus",
  "California Killifish": "Fundulus parvipinnis",
  "California Moray Eel": "Gymnothorax mordax",
  "Channel Catfish": "Ictalurus punctatus",
  "Common Carp": "Cyprinus carpio",
  "Dojo Loach (Weather Loach)": "Misgurnus anguillicaudatus",
  "Garibaldi": "Hypsypops rubicundus",
  "Giant Sea Bass": "Stereolepis gigas",
  "Horn Shark": "Heterodontus francisci",
  "Kelp Bass": "Paralabrax clathratus",
  "Largemouth Bass": "Micropterus salmoides",
  "Leopard Shark": "Triakis semifasciata",
  "Mola Mola": "Mola mola",
  "Mosquitofish": "Gambusia affinis",
  "Opaleye": "Girella nigricans",
  "Pacific Sardine": "Sardinops sagax",
  "Plecostomus (Armored Catfish)": "Hypostomus plecostomus",
  "Prickly Sculpin": "Cottus asper",
  "Santa Ana Sucker": "Catostomus santaanae",
  "Shiner Surfperch": "Cymatogaster aggregata",
  "Steelhead Trout": "Oncorhynchus mykiss",
  "Striped Bass": "Morone saxatilis",
  "Swell Shark": "Cephaloscyllium ventriosum",
  "Threespine Stickleback": "Gasterosteus aculeatus",
  "Tidewater Goby": "Eucyclogobius newberryi",
  "Tule Perch": "Hysterocarpus traskii",
  "White Sturgeon": "Acipenser transmontanus",
  // Mammal
  "Big Brown Bat": "Eptesicus fuscus",
  "Blue Whale": "Balaenoptera musculus",
  "Bobcat": "Lynx rufus",
  "California Ground Squirrel": "Otospermophilus beecheyi",
  "California Sea Lion": "Zalophus californianus",
  "Common Bottlenose Dolphin": "Tursiops truncatus",
  "Coyote": "Canis latrans",
  "Desert Cottontail": "Sylvilagus audubonii",
  "Domestic Goat": "Capra hircus",
  "Domestic Sheep": "Ovis aries",
  "Donkey": "Equus africanus asinus",
  "Gray Fox": "Urocyon cinereoargenteus",
  "Gray Whale": "Eschrichtius robustus",
  "Harbor Seal": "Phoca vitulina",
  "Humpback Whale": "Megaptera novaeangliae",
  "Llama": "Lama glama",
  "Mexican Free-tailed Bat": "Tadarida brasiliensis",
  "Mountain Lion": "Puma concolor",
  "Pallid Bat": "Antrozous pallidus",
  "Raccoon": "Procyon lotor",
  "Risso's Dolphin": "Grampus griseus",
  "Southern Sea Otter": "Enhydra lutris nereis",
  "Striped Skunk": "Mephitis mephitis",
  "Western Gray Squirrel": "Sciurus griseus",
  // Reptile
  "California Kingsnake": "Lampropeltis californiae",
  "Coast Horned Lizard": "Phrynosoma blainvillii",
  "Coast Night Lizard": "Xantusia riversiana",
  "Common Side-blotched Lizard": "Uta stansburiana",
  "Gopher Snake": "Pituophis catenifer",
  "Leatherback Sea Turtle": "Dermochelys coriacea",
  "Orange-throated Whiptail": "Aspidoscelis hyperythra",
  "Red Diamond Rattlesnake": "Crotalus ruber",
  "Ring-necked Snake": "Diadophis punctatus",
  "Side-blotched Lizard": "Uta stansburiana",
  "Southern Alligator Lizard": "Elgaria multicarinata",
  "Southern Pacific Rattlesnake": "Crotalus helleri",
  "Two-striped Garter Snake": "Thamnophis hammondii",
  "Western Fence Lizard": "Sceloporus occidentalis",
  "Western Pond Turtle": "Actinemys marmorata",
  "Western Skink": "Plestiodon skiltonianus",
  "Western Whiptail": "Aspidoscelis tigris",
  // Fungi
  "Artist's Conk": "Ganoderma applanatum",
  "Burn Site Morel": "Morchella tomentosa",
  "Calvatia Booniana": "Calvatia booniana",
  "Coprinus Comatus": "Coprinus comatus",
  "Dead Man's Foot": "Pisolithus arhizus",
  "Death Cap": "Amanita phalloides",
  "Dog Vomit Slime Mold": "Fuligo septica",
  "Earthstar Fungus": "Geastrum saccatum",
  "Hericium Erinaceus": "Hericium erinaceus",
  "Panaeolus antillarum": "Panaeolus antillarum",
  "Rim Lichen": "Lecanora muralis",
  "Russula Californica": "Russula nigricans",
  "Shaggy Mane": "Coprinus comatus",
  "Split Gill": "Schizophyllum commune",
  "Turkey Tail Fungus": "Trametes versicolor",
  "Witch's Butter": "Tremella mesenterica",
  // Invertebrate
  "Aggregating Anemone": "Anthopleura elegantissima",
  "Armored Centipede": "Scolopendra polymorpha",
  "Bat Star": "Patiria miniata",
  "By-the-Wind Sailor": "Velella velella",
  "California Sea Cucumber": "Apostichopus californicus",
  "Giant Green Anemone": "Anthopleura xanthogrammica",
  "Moon Jelly": "Aurelia aurita",
  "Ochre Sea Star": "Pisaster ochraceus",
  "Purple Sea Urchin": "Strongylocentrotus purpuratus",
  "Sandcastle Worm": "Phragmatopoma californica",
  "Sunflower Sea Star": "Pycnopodia helianthoides",
  // Crustacean
  "California Spiny Lobster": "Panulirus interruptus",
  "Gooseneck Barnacle": "Pollicipes polymerus",
  "Hermit Crab": "Pagurus samuelis",
  "Isopod": "Ligia occidentalis",
  "Kelp Crab": "Pugettia producta",
  "Lined Shore Crab": "Pachygrapsus crassipes",
  "Pacific Gray Whale Barnacle": "Cryptolepas rhachianecti",
  "Pacific Mole Crab": "Emerita analoga",
  "Red Swamp Crayfish": "Procambarus clarkii",
  // Amphibian
  "Arboreal Salamander": "Aneides lugubris",
  "California Newt": "Taricha torosa",
  "California Treefrog": "Pseudacris cadaverina",
  "Ensatina Salamander": "Ensatina eschscholtzii",
  "Pacific Chorus Frog": "Pseudacris regilla",
  "Pacific Tree Frog": "Pseudacris regilla",
  "Red-spotted Toad": "Anaxyrus punctatus",
  "Western Toad": "Anaxyrus boreas",
  // Arachnid
  "California Scorpion": "Paruroctonus silvestrii",
  "Cellar Spider": "Pholcus phalangioides",
  "Jumping Spider": "Phidippus johnsoni",
  "Orb Weaver Spider": "Araneus diadematus",
  "Southern California Tarantula": "Aphonopelma johnnycashi",
  // Mollusk
  "California Sea Hare": "Aplysia californica",
  "Garden Slug": "Arion hortensis",
  "Mossy Chiton": "Mopalia muscosa",
};

// Strider's protected archive — any media.base44.com URL with date-stamp or known field photo prefix
const STRIDER_PATTERNS = [
  "20201", "20210", "20211", "20220", "20221", "20230", "20231",
  "IMG_5413", "IMG_5414", "IMG_5246", "IMG_5047", "IMG_0566",
  "IMG_1794", "IMG_2499", "IMG_52", "g3lulz", "bd0c30d0d",
  "sq_r", "sq_new", "raccoon_r", "lion_r", "bat_", "btnd_",
  "cdol_", "cseal_", "otter_", "riss_", "gray_", "hump_",
  "hseal_", "pwsd_", "skunk_n", "verify_", "74bd05b03",
  "1289b0b9d", "2813513ef", "91b18bf82", "2b9041a5b",
  "1498c2fc9", "bae83f101", "efe54dbd7", "bb0c30d0d",
];

function isStriderPhoto(url) {
  if (!url) return false;
  if (!url.includes("media.base44.com")) return false;
  return STRIDER_PATTERNS.some(p => url.includes(p));
}

async function fetchProposedImage(commonName) {
  const sciName = SCI_NAME_MAP[commonName];
  if (!sciName) return { url: null, sciName: null, error: "No sci name mapped" };

  try {
    const q = sciName.replace(/ /g, "+");
    const taxaRes = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${q}&rank=species&per_page=1`,
      { headers: { "User-Agent": "EarthEyeOC/1.0" } }
    );
    const taxaData = await taxaRes.json();
    if (!taxaData.results?.length) return { url: null, sciName, error: "Taxon not found" };

    const taxon = taxaData.results[0];
    const taxonId = taxon.id;
    const confirmedName = taxon.name;

    // Try CA first
    let photoUrl = null;
    for (const placeId of ["14", ""]) {
      const placeParam = placeId ? `&place_id=${placeId}` : "";
      const obsRes = await fetch(
        `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&quality_grade=research&captive=false${placeParam}&order_by=votes&per_page=5&photos=true`,
        { headers: { "User-Agent": "EarthEyeOC/1.0" } }
      );
      const obsData = await obsRes.json();
      for (const obs of obsData.results || []) {
        const photos = obs.photos || [];
        if (photos.length) {
          photoUrl = photos[0].url?.replace("square", "medium");
          break;
        }
      }
      if (photoUrl) break;
    }

    return { url: photoUrl, sciName: confirmedName, taxonId, error: photoUrl ? null : "No photos found" };
  } catch (e) {
    return { url: null, sciName, error: e.message };
  }
}

const VIOLATION_COLORS = {
  gore: "#ef4444",
  wrong_species: "#8b5cf6",
  captive: "#f97316",
  staged: "#eab308",
  hands: "#f43f5e",
  poor_quality: "#64748b",
  non_oc: "#6366f1",
};

export default function CuratorReview() {
  const [flaggedList, setFlaggedList] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [proposed, setProposed] = useState(null); // { url, sciName, taxonId, error }
  const [fetchingProposed, setFetchingProposed] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null); // live DB record
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [decisions, setDecisions] = useState({}); // id -> "approved" | "skipped" | "pending"
  const [writing, setWriting] = useState(false);
  const [writeResult, setWriteResult] = useState(null);
  const [currentImgLoaded, setCurrentImgLoaded] = useState(false);
  const [proposedImgLoaded, setProposedImgLoaded] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | approved | skipped

  // Load the flagged JSON from the uploaded file via fetch
  useEffect(() => {
    fetch("https://media.base44.com/files/public/69dffe15eb268f56342f8e58/4c10104ac_eartheye_flagged8.json")
      .then(r => r.json())
      .then(data => {
        // Filter out Strider-protected entries (shouldn't be any, but safety check)
        const safe = data.filter(item => !isStriderPhoto(item.imageUrl));
        setFlaggedList(safe);
      })
      .catch(() => {
        // Fallback: embed a small sample if fetch fails
        setFlaggedList([]);
      });
  }, []);

  const filtered = flaggedList.filter(item => {
    if (filter === "all") return true;
    const d = decisions[item.name];
    if (filter === "pending") return !d || d === "pending";
    if (filter === "approved") return d === "approved";
    if (filter === "skipped") return d === "skipped";
    return true;
  });

  const current = filtered[currentIdx];

  // Fetch live DB record + proposed image whenever current changes
  useEffect(() => {
    if (!current) return;
    setProposed(null);
    setCurrentRecord(null);
    setCurrentImgLoaded(false);
    setProposedImgLoaded(false);
    setWriteResult(null);
    setCustomUrl("");
    setUseCustom(false);

    // Fetch live DB record
    setLoadingRecord(true);
    Species.filter({ name: current.name }, null, 1, 0)
      .then(records => {
        setCurrentRecord(records[0] || null);
        setLoadingRecord(false);
      })
      .catch(() => setLoadingRecord(false));

    // Fetch proposed image
    setFetchingProposed(true);
    fetchProposedImage(current.name)
      .then(result => {
        setProposed(result);
        setFetchingProposed(false);
      });
  }, [current?.name]);

  const effectiveProposedUrl = useCustom && customUrl ? customUrl : proposed?.url;

  const handleApprove = async () => {
    if (!currentRecord || !effectiveProposedUrl) return;
    // SAFETY: never overwrite Strider photos
    if (isStriderPhoto(currentRecord.imageUrl)) {
      setWriteResult({ ok: false, msg: "🔒 Protected Strider photo — skipping." });
      return;
    }
    setWriting(true);
    setWriteResult(null);
    try {
      await Species.update(currentRecord.id, { imageUrl: effectiveProposedUrl });
      setDecisions(d => ({ ...d, [current.name]: "approved" }));
      setWriteResult({ ok: true, msg: "✅ Written to DB" });
      setTimeout(() => advance(), 800);
    } catch (e) {
      setWriteResult({ ok: false, msg: "Error: " + e.message });
    }
    setWriting(false);
  };

  const handleSkip = () => {
    setDecisions(d => ({ ...d, [current.name]: "skipped" }));
    setWriteResult(null);
    advance();
  };

  const advance = () => {
    setCurrentImgLoaded(false);
    setProposedImgLoaded(false);
    setWriteResult(null);
    if (currentIdx < filtered.length - 1) {
      setCurrentIdx(i => i + 1);
    }
  };

  const goTo = (idx) => {
    setCurrentIdx(idx);
    setCurrentImgLoaded(false);
    setProposedImgLoaded(false);
    setWriteResult(null);
  };

  const approvedCount = Object.values(decisions).filter(d => d === "approved").length;
  const skippedCount = Object.values(decisions).filter(d => d === "skipped").length;
  const pendingCount = flaggedList.length - approvedCount - skippedCount;

  if (!flaggedList.length) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ color: "#34d399", fontSize: 18, marginTop: 12 }}>Loading flagged list...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f1f5f9", fontFamily: "system-ui", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#34d399" }}>🔬 Curator Review</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>EarthEye OC · {flaggedList.length} flagged species</span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <span style={{ color: "#34d399" }}>✅ {approvedCount} approved</span>
          <span style={{ color: "#64748b" }}>⏭ {skippedCount} skipped</span>
          <span style={{ color: "#f59e0b" }}>⏳ {pendingCount} pending</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: "100%", background: "#1f2937", borderRadius: 4, height: 4, marginTop: 4 }}>
          <div style={{ width: `${((approvedCount + skippedCount) / flaggedList.length) * 100}%`, background: "#34d399", height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1f2937", padding: "6px 20px", display: "flex", gap: 6 }}>
        {[
          { key: "all", label: `All (${flaggedList.length})` },
          { key: "pending", label: `Pending (${pendingCount})` },
          { key: "approved", label: `Approved (${approvedCount})` },
          { key: "skipped", label: `Skipped (${skippedCount})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setFilter(tab.key); setCurrentIdx(0); }} style={{
            background: filter === tab.key ? "#059669" : "#1f2937",
            border: `1px solid ${filter === tab.key ? "#34d399" : "#374151"}`,
            color: filter === tab.key ? "#fff" : "#94a3b8",
            padding: "3px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: filter === tab.key ? 700 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 1100, margin: "0 auto", width: "100%", padding: 16, gap: 16 }}>
        {current ? (
          <>
            {/* Species header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{current.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  <span style={{ background: "#1f2937", padding: "2px 8px", borderRadius: 10, marginRight: 6 }}>{current.group}</span>
                  {proposed?.sciName && <span style={{ color: "#34d399", fontStyle: "italic" }}>{proposed.sciName}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(current.violations || []).map(v => (
                  <span key={v} style={{ background: VIOLATION_COLORS[v] + "33", border: `1px solid ${VIOLATION_COLORS[v]}`, color: VIOLATION_COLORS[v], padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                    {v.replace("_", " ")}
                  </span>
                ))}
              </div>
              <div style={{ color: "#475569", fontSize: 12 }}>{currentIdx + 1} / {filtered.length}</div>
            </div>

            {/* Side-by-side images */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* CURRENT */}
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #374151", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>⚠ CURRENT (flagged)</span>
                  {loadingRecord && <span style={{ fontSize: 11, color: "#64748b" }}>loading...</span>}
                </div>
                <div style={{ position: "relative", aspectRatio: "4/3", background: "#0a0a0a" }}>
                  {currentRecord?.imageUrl ? (
                    <>
                      {!currentImgLoaded && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>Loading...</div>
                      )}
                      <img
                        src={currentRecord.imageUrl}
                        alt={current.name}
                        onLoad={() => setCurrentImgLoaded(true)}
                        onError={() => setCurrentImgLoaded(true)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: currentImgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
                      />
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#374151", fontSize: 12 }}>
                      {loadingRecord ? "fetching record..." : "no image"}
                    </div>
                  )}
                  {currentRecord && isStriderPhoto(currentRecord.imageUrl) && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      🔒 STRIDER LOCKED
                    </div>
                  )}
                </div>
                <div style={{ padding: "6px 10px" }}>
                  <div style={{ fontSize: 10, color: "#475569", wordBreak: "break-all" }}>{currentRecord?.imageUrl || "—"}</div>
                </div>
              </div>

              {/* PROPOSED */}
              <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #059669", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>✅ PROPOSED REPLACEMENT</span>
                  {fetchingProposed && <span style={{ fontSize: 11, color: "#64748b" }}>fetching via iNat...</span>}
                  {proposed?.error && !fetchingProposed && <span style={{ fontSize: 11, color: "#ef4444" }}>{proposed.error}</span>}
                </div>
                <div style={{ position: "relative", aspectRatio: "4/3", background: "#0a0a0a" }}>
                  {effectiveProposedUrl ? (
                    <>
                      {!proposedImgLoaded && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>Loading...</div>
                      )}
                      <img
                        src={effectiveProposedUrl}
                        alt="proposed"
                        onLoad={() => setProposedImgLoaded(true)}
                        onError={() => setProposedImgLoaded(true)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: proposedImgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
                      />
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#374151", fontSize: 12, padding: 16, textAlign: "center" }}>
                      {fetchingProposed ? "Fetching from iNaturalist..." : "No image found — paste URL below"}
                    </div>
                  )}
                </div>
                <div style={{ padding: "6px 10px" }}>
                  <div style={{ fontSize: 10, color: "#059669", wordBreak: "break-all" }}>{effectiveProposedUrl || "—"}</div>
                </div>
              </div>
            </div>

            {/* Custom URL input */}
            <div style={{ background: "#111827", borderRadius: 8, border: "1px solid #1f2937", padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>Custom URL:</span>
              <input
                type="text"
                value={customUrl}
                onChange={e => { setCustomUrl(e.target.value); setUseCustom(!!e.target.value); setProposedImgLoaded(false); }}
                placeholder="Paste iNat or base44 CDN URL to override..."
                style={{ flex: 1, background: "#0f172a", border: "1px solid #374151", color: "#f1f5f9", padding: "5px 10px", borderRadius: 6, fontSize: 12, outline: "none" }}
              />
              {customUrl && (
                <button onClick={() => { setCustomUrl(""); setUseCustom(false); setProposedImgLoaded(false); }}
                  style={{ background: "#374151", border: "none", color: "#94a3b8", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>clear</button>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleApprove}
                disabled={writing || !effectiveProposedUrl || !currentRecord || isStriderPhoto(currentRecord?.imageUrl)}
                style={{
                  background: writing ? "#064e3b" : "#059669",
                  border: "none", color: "#fff", padding: "10px 28px", borderRadius: 8,
                  cursor: writing || !effectiveProposedUrl || !currentRecord ? "not-allowed" : "pointer",
                  fontSize: 15, fontWeight: 700, opacity: writing || !effectiveProposedUrl || !currentRecord ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                {writing ? "Writing..." : "✅ Approve & Write to DB"}
              </button>

              <button
                onClick={handleSkip}
                style={{ background: "#1f2937", border: "1px solid #374151", color: "#94a3b8", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 600 }}
              >
                ⏭ Skip
              </button>

              <div style={{ flex: 1 }} />

              <button onClick={() => goTo(Math.max(0, currentIdx - 1))}
                style={{ background: "#1f2937", border: "1px solid #374151", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Prev</button>
              <button onClick={() => goTo(Math.min(filtered.length - 1, currentIdx + 1))}
                style={{ background: "#1f2937", border: "1px solid #374151", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Next →</button>
            </div>

            {writeResult && (
              <div style={{ background: writeResult.ok ? "#064e3b" : "#7f1d1d", border: `1px solid ${writeResult.ok ? "#34d399" : "#ef4444"}`, color: writeResult.ok ? "#34d399" : "#fca5a5", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {writeResult.msg}
              </div>
            )}

            {/* Species list sidebar (mini) */}
            <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "6px 12px", borderBottom: "1px solid #1f2937", fontSize: 11, color: "#64748b", fontWeight: 600 }}>FLAGGED LIST — click to jump</div>
              <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 4, padding: 8 }}>
                {filtered.map((item, idx) => {
                  const d = decisions[item.name];
                  return (
                    <button key={item.name} onClick={() => goTo(idx)} style={{
                      background: idx === currentIdx ? "#059669" : d === "approved" ? "#064e3b" : d === "skipped" ? "#1f2937" : "#0f172a",
                      border: `1px solid ${idx === currentIdx ? "#34d399" : d === "approved" ? "#059669" : d === "skipped" ? "#374151" : "#1f2937"}`,
                      color: idx === currentIdx ? "#fff" : d === "approved" ? "#34d399" : d === "skipped" ? "#475569" : "#94a3b8",
                      padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 10, whiteSpace: "nowrap",
                    }}>
                      {d === "approved" ? "✅ " : d === "skipped" ? "⏭ " : ""}{item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
            <div style={{ fontSize: 48 }}>🎉</div>
            <div style={{ fontSize: 18, marginTop: 12, color: "#34d399" }}>All {filter} items reviewed!</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Switch filter tab to continue</div>
          </div>
        )}
      </div>
    </div>
  );
}
