import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Species, Observation, Trail } from "@/api/entities";
import BottomNav from "./BottomNav";

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_SEASON = [
  "winter","winter","spring","spring","spring",
  "summer","summer","summer","fall","fall","fall","winter"
];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASON_LABEL  = { spring:"Spring", summer:"Summer", fall:"Fall", winter:"Winter" };
const SEASON_ICON   = { spring:"🌸", summer:"☀️", fall:"🍂", winter:"🌧" };
const SEASON_COLOR  = { spring:"#4A9A5A", summer:"#D4883A", fall:"#8A5A2A", winter:"#3A6A9A" };
const SEASON_MONTHS = { spring:[2,3,4], summer:[5,6,7], fall:[8,9,10], winter:[11,0,1] };
const GROUP_ICONS   = {
  mammal:"🦌", bird:"🐦", reptile:"🦎", amphibian:"🐸", fish:"🐟",
  insect:"🦋", arachnid:"🕷", crustacean:"🦀", mollusk:"🐚",
  invertebrate:"🪱", plant:"🌿", fungi:"🍄", lichen:"🌱", algae:"🌊",
  "human impact":"🏗",
};
const RARE_STATUSES = [
  "endangered","threatened","critically endangered","rare","very rare",
  "state threatened","federally threatened","federally endangered",
  "species of special concern","of concern","sensitive","protected",
];
const HABITAT_LABELS = {
  chaparral:"Chaparral", "coastal-sage":"Coastal Sage Scrub",
  riparian:"Riparian", "tidal-marsh":"Tidal Marsh",
  beach:"Beach & Intertidal", "oak-woodland":"Oak Woodland",
};

// ── Story types ───────────────────────────────────────────────────────────────
// /Story?type=season&year=2026&season=spring
// /Story?type=year&year=2026
// /Story?type=habitat&year=2026
// /Story?type=trail&trailId=X&year=2026
// /Story?type=species&speciesId=X
// /Story?type=companions&year=2026
// /Story?type=rhythm&year=2026

// ── reduceStory() — the narrative brain ──────────────────────────────────────
function reduceStory({ type, year, season, speciesId, trailId, observations, speciesMap, trails }) {
  // Filter to this year's obs (privacy safe)
  const eligible = observations.filter(o => {
    if (o.sensitivityLevel === "high") return false;
    if (o.isPublicEligible === false) return false;
    const yr = o.year || (o.timestamp ? new Date(o.timestamp).getFullYear() : null)
      || (o.created_date ? new Date(o.created_date).getFullYear() : null);
    if (year && String(yr) !== String(year)) return false;
    return true;
  });

  const allObs = observations.filter(o =>
    o.sensitivityLevel !== "high" && o.isPublicEligible !== false
  );

  const isRare = (s) => s && RARE_STATUSES.some(r =>
    (s.conservationStatus||"").toLowerCase().includes(r));

  // ── Season Story ────────────────────────────────────────────────────────────
  if (type === "season") {
    const seasonObs = eligible.filter(o => o.season === season || (o.month != null &&
      SEASON_MONTHS[season]?.includes(Number(o.month))));

    const uniqueSpIds = [...new Set(seasonObs.map(o => o.speciesId).filter(Boolean))];
    const uniqueTrailIds = [...new Set(seasonObs.map(o => o.trailId).filter(Boolean))];

    // First sighting (earliest timestamp)
    const withTs = seasonObs.filter(o => o.timestamp).sort((a,b) =>
      new Date(a.timestamp) - new Date(b.timestamp));
    const firstObs = withTs[0];
    const firstSp  = firstObs ? speciesMap[firstObs.speciesId] : null;

    // Opening frame
    let openingFrame = null;
    if (firstSp && firstObs) {
      const d = new Date(firstObs.timestamp);
      openingFrame = `${SEASON_LABEL[season]} opened for you on ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, when you saw your first ${firstSp.name}.`;
    } else if (seasonObs.length > 0) {
      openingFrame = `You logged ${seasonObs.length} sighting${seasonObs.length!==1?"s":""} this ${SEASON_LABEL[season]}.`;
    }

    // Highlights — species that defined the season
    const spCount = {};
    seasonObs.forEach(o => { if (o.speciesId) spCount[o.speciesId] = (spCount[o.speciesId]||0)+1; });

    // First-of-year set
    const prevObs = allObs.filter(o => {
      const yr = o.year || (o.timestamp ? new Date(o.timestamp).getFullYear() : null);
      return yr && Number(yr) < Number(year);
    });
    const everSeenIds = new Set(prevObs.map(o => o.speciesId));
    const firstOfSeason = uniqueSpIds.filter(id => !everSeenIds.has(id));
    const rareSpIds = uniqueSpIds.filter(id => isRare(speciesMap[id]));

    const highlights = uniqueSpIds
      .sort((a,b) => {
        // Score: count + firstOfSeason bonus + rare bonus
        const scoreA = (spCount[a]||0)*2 + (firstOfSeason.includes(a)?5:0) + (rareSpIds.includes(a)?4:0);
        const scoreB = (spCount[b]||0)*2 + (firstOfSeason.includes(b)?5:0) + (rareSpIds.includes(b)?4:0);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(id => {
        const s = speciesMap[id];
        return s ? {
          speciesId: id, name: s.name, thumbnail: s.imageUrl, group: s.group,
          count: spCount[id]||0,
          isFirst: firstOfSeason.includes(id),
          isRare: isRare(s),
          fieldCue: s.fieldCue,
        } : null;
      }).filter(Boolean);

    // Movement through land
    const trailVisited = uniqueTrailIds.map(id => trails.find(t => t.id===id)).filter(Boolean);

    // Closing thread
    let closingThread = null;
    if (highlights.length > 0 && trailVisited.length > 0) {
      const keysp = highlights[0];
      const keytrl = trailVisited[0];
      closingThread = `${keysp.name} on ${keytrl.name} — that's your ${SEASON_LABEL[season].toLowerCase()} signature.`;
    } else if (highlights.length > 0) {
      closingThread = `${highlights[0].name} carried your ${SEASON_LABEL[season].toLowerCase()}.`;
    }

    return {
      type: "season", season, year,
      stats: { sightings: seasonObs.length, species: uniqueSpIds.length,
        trails: uniqueTrailIds.length, rare: rareSpIds.length, firsts: firstOfSeason.length },
      openingFrame, highlights, trailVisited: trailVisited.slice(0,5),
      firstOfSeason: firstOfSeason.map(id => speciesMap[id]).filter(Boolean).slice(0,5),
      rareEncounters: rareSpIds.map(id => speciesMap[id]).filter(Boolean).slice(0,5),
      closingThread,
    };
  }

  // ── Year Story (10 species) ─────────────────────────────────────────────────
  if (type === "year") {
    const spCount = {};
    const spSeasons = {};
    const spTrails  = {};
    eligible.forEach(o => {
      if (!o.speciesId) return;
      spCount[o.speciesId] = (spCount[o.speciesId]||0)+1;
      if (o.season) {
        if (!spSeasons[o.speciesId]) spSeasons[o.speciesId] = new Set();
        spSeasons[o.speciesId].add(o.season);
      }
      if (o.trailId) {
        if (!spTrails[o.speciesId]) spTrails[o.speciesId] = new Set();
        spTrails[o.speciesId].add(o.trailId);
      }
    });
    const allIds = Object.keys(spCount);
    const rareIds = allIds.filter(id => isRare(speciesMap[id]));
    const prevObs = allObs.filter(o => {
      const yr = o.year || (o.timestamp ? new Date(o.timestamp).getFullYear() : null);
      return yr && Number(yr) < Number(year);
    });
    const everSeenIds = new Set(prevObs.map(o => o.speciesId));
    const firstOfYear = allIds.filter(id => !everSeenIds.has(id));

    // 3 keystone — most observed, multi-trail, multi-season
    const keystoneScore = id =>
      (spCount[id]||0)*2 + (spSeasons[id]?.size||0)*3 + (spTrails[id]?.size||0)*2;
    const keystone = allIds.sort((a,b) => keystoneScore(b)-keystoneScore(a)).slice(0,3);

    // 3 seasonal markers — species that define each season (max 1 per season)
    const seasonalMarkers = [];
    ["spring","summer","fall","winter"].forEach(s => {
      const candidates = allIds.filter(id => spSeasons[id]?.has(s) &&
        !keystone.includes(id) && !seasonalMarkers.includes(id));
      const best = candidates.sort((a,b) => (spCount[b]||0)-(spCount[a]||0))[0];
      if (best) seasonalMarkers.push(best);
    });

    // 2 rare
    const rare2 = rareIds.filter(id => !keystone.includes(id) && !seasonalMarkers.includes(id)).slice(0,2);

    // 1 habitat signature — species from the most diverse habitat
    const habitatSig = allIds.find(id =>
      !keystone.includes(id) && !seasonalMarkers.includes(id) && !rare2.includes(id) &&
      (spTrails[id]?.size||0) >= 2
    ) || allIds.find(id =>
      !keystone.includes(id) && !seasonalMarkers.includes(id) && !rare2.includes(id)
    );

    // 1 anomaly — first of year, rare, or single-trail unique
    const anomaly = firstOfYear.find(id =>
      !keystone.includes(id) && !seasonalMarkers.includes(id) && !rare2.includes(id) && id !== habitatSig
    ) || allIds.find(id =>
      (spCount[id]||0) === 1 && !keystone.includes(id) && !seasonalMarkers.includes(id) && !rare2.includes(id) && id !== habitatSig
    );

    const ten = [
      ...keystone.map(id => ({ role:"keystone",   id })),
      ...seasonalMarkers.map(id => ({ role:"seasonal",  id })),
      ...rare2.map(id => ({            role:"rare",      id })),
      habitatSig ? { role:"habitat",   id: habitatSig } : null,
      anomaly    ? { role:"anomaly",   id: anomaly }    : null,
    ].filter(Boolean).slice(0,10)
      .map(({ role, id }) => {
        const s = speciesMap[id];
        return s ? { role, speciesId: id, name: s.name, thumbnail: s.imageUrl,
          group: s.group, count: spCount[id]||0,
          seasons: [...(spSeasons[id]||[])],
          isRare: isRare(s),
          isFirst: firstOfYear.includes(id) } : null;
      }).filter(Boolean);

    const ROLE_LABEL = {
      keystone:"Keystone", seasonal:"Seasonal Marker", rare:"Rare Encounter",
      habitat:"Habitat Signature", anomaly:"Surprise",
    };

    return {
      type:"year", year,
      stats: { sightings: eligible.length, species: allIds.length,
        rare: rareIds.length, firsts: firstOfYear.length,
        trails: [...new Set(eligible.map(o=>o.trailId).filter(Boolean))].length },
      ten, roleLabel: ROLE_LABEL,
      trailsVisited: [...new Set(eligible.map(o=>o.trailId).filter(Boolean))]
        .map(id => trails.find(t=>t.id===id)).filter(Boolean).slice(0,6),
    };
  }

  // ── Habitat Story ───────────────────────────────────────────────────────────
  if (type === "habitat") {
    const habitatKeywords = {
      chaparral:["chaparral","sage","scrub","shrub","canyon","hillside"],
      "coastal-sage":["coastal","sage","bluff","coastal sage"],
      riparian:["riparian","creek","river","willow","cottonwood"],
      "tidal-marsh":["tidal","marsh","estuary","mudflat","bay","saltmarsh"],
      beach:["beach","intertidal","tidepool","pier","harbor"],
      "oak-woodland":["oak","woodland","grove","sycamore","arboretum"],
    };
    const trailHabitat = {};
    trails.forEach(t => {
      const text = ([...(t.habitatTypes||[])].join(" ")+" "+(t.name||"")+" "+(t.ecologicalNotes||"")).toLowerCase();
      Object.entries(habitatKeywords).forEach(([hab, kws]) => {
        if (kws.some(kw => text.includes(kw))) trailHabitat[t.id] = hab;
      });
    });

    const habCount = {};
    const habSpecies = {};
    eligible.forEach(o => {
      if (!o.trailId) return;
      const hab = trailHabitat[o.trailId];
      if (!hab) return;
      habCount[hab] = (habCount[hab]||0)+1;
      if (o.speciesId) {
        if (!habSpecies[hab]) habSpecies[hab] = new Set();
        habSpecies[hab].add(o.speciesId);
      }
    });

    const habList = Object.entries(habCount).sort((a,b)=>b[1]-a[1]);
    const topHab = habList[0];
    const rarest = habList.reduce((r,h) => {
      const ids = [...(habSpecies[h[0]]||[])];
      const rareCount = ids.filter(id => isRare(speciesMap[id])).length;
      return rareCount > (r.rareCount||0) ? { hab: h[0], rareCount } : r;
    }, {});

    const topHabDefining = topHab
      ? [...(habSpecies[topHab[0]]||[])]
          .map(id => speciesMap[id]).filter(Boolean)
          .sort((a,b) => isRare(b)?1:-1)
          .slice(0,8)
      : [];

    return {
      type:"habitat", year,
      stats: {
        sightings: eligible.length,
        habitats: habList.length,
        topHabitat: topHab ? HABITAT_LABELS[topHab[0]] || topHab[0] : null,
        topHabitatId: topHab?.[0],
        rareHabitat: rarest.hab ? HABITAT_LABELS[rarest.hab] || rarest.hab : null,
      },
      habList: habList.map(([h,count]) => ({
        habitatId: h,
        label: HABITAT_LABELS[h]||h,
        count,
        speciesCount: (habSpecies[h]||new Set()).size,
      })),
      topHabDefining,
    };
  }

  // ── Trail Story ─────────────────────────────────────────────────────────────
  if (type === "trail") {
    const trailObs = eligible.filter(o => o.trailId === trailId);
    const trail = trails.find(t => t.id === trailId);
    const uniqueSpIds = [...new Set(trailObs.map(o => o.speciesId).filter(Boolean))];
    const spCount = {};
    trailObs.forEach(o => { if (o.speciesId) spCount[o.speciesId]=(spCount[o.speciesId]||0)+1; });

    const withTs = trailObs.filter(o=>o.timestamp).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    const first = withTs[0];
    const firstSp = first ? speciesMap[first.speciesId] : null;
    const firstD = first ? new Date(first.timestamp) : null;

    const prevTrailObs = allObs.filter(o => {
      if (o.trailId !== trailId) return false;
      const yr = o.year || (o.timestamp ? new Date(o.timestamp).getFullYear() : null);
      return yr && Number(yr) < Number(year);
    });
    const prevIds = new Set(prevTrailObs.map(o=>o.speciesId));
    const newToTrail = uniqueSpIds.filter(id => !prevIds.has(id));
    const rareOnTrail = uniqueSpIds.filter(id => isRare(speciesMap[id]));

    const defining = uniqueSpIds
      .sort((a,b)=>(spCount[b]||0)-(spCount[a]||0))
      .slice(0,6)
      .map(id => { const s=speciesMap[id]; return s?{speciesId:id,name:s.name,thumbnail:s.imageUrl,group:s.group,count:spCount[id]||0,isRare:isRare(s),isNew:newToTrail.includes(id)}:null; })
      .filter(Boolean);

    return {
      type:"trail", year, trail,
      stats: { sightings: trailObs.length, species: uniqueSpIds.length,
        rare: rareOnTrail.length, new: newToTrail.length },
      openingFrame: firstSp && firstD
        ? `Your ${year} chapter on ${trail?.name||"this trail"} opened on ${MONTH_NAMES[firstD.getMonth()]} ${firstD.getDate()} with ${firstSp.name}.`
        : trailObs.length > 0 ? `You logged ${trailObs.length} sightings on ${trail?.name||"this trail"} in ${year}.` : null,
      defining,
      newToTrail: newToTrail.map(id=>speciesMap[id]).filter(Boolean).slice(0,4),
      rareOnTrail: rareOnTrail.map(id=>speciesMap[id]).filter(Boolean).slice(0,4),
    };
  }

  // ── Species Story ───────────────────────────────────────────────────────────
  if (type === "species") {
    const sp = speciesMap[speciesId];
    const spObs = allObs.filter(o => o.speciesId === speciesId);
    const sorted = spObs.filter(o=>o.timestamp).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    const firstEver = sorted[0];
    const firstD = firstEver ? new Date(firstEver.timestamp) : null;
    const trailIds = [...new Set(spObs.map(o=>o.trailId).filter(Boolean))];
    const seasons = [...new Set(spObs.map(o=>o.season).filter(Boolean))];
    const thisYearObs = eligible.filter(o=>o.speciesId===speciesId);
    const monthCounts = Array(12).fill(0);
    spObs.forEach(o => {
      const m = o.month!=null ? o.month : (o.timestamp ? new Date(o.timestamp).getMonth() : null);
      if (m!=null && m>=0 && m<12) monthCounts[m]++;
    });
    const peakMonth = monthCounts.indexOf(Math.max(...monthCounts));

    return {
      type:"species", species: sp, year,
      stats: { totalSightings: spObs.length, thisYear: thisYearObs.length,
        trails: trailIds.length, seasons: seasons.length },
      openingFrame: firstD && sp
        ? `You first encountered ${sp.name} on ${MONTH_NAMES[firstD.getMonth()]} ${firstD.getDate()}, ${firstD.getFullYear()}.`
        : sp ? `${sp.name} has appeared in your field records.` : null,
      trailsWhereSeen: trailIds.map(id=>trails.find(t=>t.id===id)).filter(Boolean).slice(0,5),
      seasons,
      peakMonth: monthCounts[peakMonth] > 0 ? { month: peakMonth, name: MONTH_NAMES[peakMonth], count: monthCounts[peakMonth] } : null,
      monthCounts,
      isRare: sp ? isRare(sp) : false,
    };
  }

  // ── Companions Story ────────────────────────────────────────────────────────
  if (type === "companions") {
    const coMap = {};
    eligible.forEach(o => {
      if (!o.speciesId) return;
      eligible.filter(o2 => o2.speciesId && o2.speciesId!==o.speciesId && o2.trailId===o.trailId).forEach(o2 => {
        const key = [o.speciesId,o2.speciesId].sort().join("__");
        coMap[key] = (coMap[key]||0)+1;
      });
    });
    const scoreMap = {};
    Object.entries(coMap).forEach(([key,score])=>{
      const [a,b] = key.split("__");
      scoreMap[a]=(scoreMap[a]||0)+score;
      scoreMap[b]=(scoreMap[b]||0)+score;
    });
    const companions = Object.entries(scoreMap)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)
      .map(([id,score]) => { const s=speciesMap[id]; return s?{speciesId:id,name:s.name,thumbnail:s.imageUrl,group:s.group,score,isRare:isRare(s)}:null; })
      .filter(Boolean);

    return { type:"companions", year, companions };
  }

  // ── Rhythm Story ────────────────────────────────────────────────────────────
  if (type === "rhythm") {
    const monthCounts = Array(12).fill(0);
    const monthSpecies = Array(12).fill(null).map(()=>new Set());
    eligible.forEach(o => {
      const m = o.month!=null ? o.month : (o.timestamp ? new Date(o.timestamp).getMonth() : null);
      if (m!=null && m>=0 && m<12) {
        monthCounts[m]++;
        if (o.speciesId) monthSpecies[m].add(o.speciesId);
      }
    });
    const peakMonth = monthCounts.indexOf(Math.max(...monthCounts));
    const quietMonth = monthCounts.indexOf(Math.min(...monthCounts.filter(c=>c>0)));
    const seasonCounts = {spring:0,summer:0,fall:0,winter:0};
    eligible.forEach(o=>{if(o.season&&seasonCounts[o.season]!==undefined)seasonCounts[o.season]++;});
    const dominantSeason = Object.entries(seasonCounts).sort((a,b)=>b[1]-a[1])[0];

    return {
      type:"rhythm", year,
      stats: { total: eligible.length, active: monthCounts.filter(c=>c>0).length },
      monthCounts,
      monthSpeciesCounts: monthSpecies.map(s=>s.size),
      peakMonth: { month:peakMonth, name:MONTH_NAMES[peakMonth], count:monthCounts[peakMonth] },
      quietMonth: quietMonth>=0 ? { month:quietMonth, name:MONTH_NAMES[quietMonth], count:monthCounts[quietMonth] } : null,
      dominantSeason: dominantSeason ? { season:dominantSeason[0], count:dominantSeason[1] } : null,
      seasonCounts,
    };
  }

  return null;
}

// ── Story Entry Picker (Hub) ──────────────────────────────────────────────────
function StoryHub({ navigate, currentYear }) {
  const STORY_TYPES = [
    { type:"season", query:`year=${currentYear}&season=spring`, icon:SEASON_ICON.spring,
      label:"Your Spring Story", desc:"First sightings · highlights · trail movement" },
    { type:"season", query:`year=${currentYear}&season=summer`, icon:SEASON_ICON.summer,
      label:"Your Summer Story", desc:"Dawn species · heat ecology · rare encounters" },
    { type:"season", query:`year=${currentYear}&season=fall`,   icon:SEASON_ICON.fall,
      label:"Your Fall Story",   desc:"Migration · mast · corridor crossings" },
    { type:"season", query:`year=${currentYear}&season=winter`, icon:SEASON_ICON.winter,
      label:"Your Winter Story", desc:"Resident species · winter arrivals · creek life" },
    { type:"year",     query:`year=${currentYear}`, icon:"📖",
      label:`Your ${currentYear} in 10 Species`,  desc:"Keystones · rarities · surprises · habitat signature" },
    { type:"habitat",  query:`year=${currentYear}`, icon:"🌿",
      label:"Your Habitat Signature", desc:"Your ecological home range · footprint" },
    { type:"companions",query:`year=${currentYear}`,icon:"🔗",
      label:"Your Ecological Companions", desc:"Species that travel with you" },
    { type:"rhythm",   query:`year=${currentYear}`, icon:"🎵",
      label:"Your Ecological Rhythm", desc:"Monthly tempo · active months · seasonal dominance" },
  ];

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
        Choose a story
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {STORY_TYPES.map((s,i) => (
          <button key={i}
            onClick={() => navigate(`/Story?type=${s.type}&${s.query}`)}
            style={{ display:"flex", alignItems:"center", gap:12,
              background:"#111E16", border:"1px solid rgba(127,175,138,0.12)",
              borderRadius:12, padding:"12px 14px", cursor:"pointer", textAlign:"left" }}>
            <div style={{ fontSize:22, flexShrink:0, width:36, textAlign:"center" }}>{s.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#C4DFC8", fontSize:13, fontWeight:600 }}>{s.label}</div>
              <div style={{ color:"#4A6A5A", fontSize:10, marginTop:2 }}>{s.desc}</div>
            </div>
            <div style={{ color:"#3A5A4A", fontSize:13, flexShrink:0 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function SpeciesChip({ s, navigate }) {
  return (
    <button onClick={() => navigate(`/SpeciesDetail?id=${s.speciesId||s.id}`)}
      style={{ display:"flex", alignItems:"center", gap:8,
        background: s.isRare ? "rgba(224,144,128,0.06)" : "rgba(127,175,138,0.05)",
        border:`1px solid ${s.isRare ? "rgba(224,144,128,0.2)" : "rgba(127,175,138,0.1)"}`,
        borderRadius:10, padding:"8px 10px", cursor:"pointer", textAlign:"left" }}>
      <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden",
        background:"#1C3A2A", flexShrink:0 }}>
        {(s.thumbnail||s.imageUrl)
          ? <img src={s.thumbnail||s.imageUrl} alt={s.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              height:"100%", fontSize:16, opacity:0.3 }}>
              {GROUP_ICONS[s.group?.toLowerCase()]||"🌿"}
            </div>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#C4DFC8", fontSize:12, fontWeight:600,
          overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{s.name}</div>
        <div style={{ display:"flex", gap:5, marginTop:2, flexWrap:"wrap" }}>
          {s.isFirst && <span style={{ fontSize:8, color:"#F5C842",
            background:"rgba(245,200,66,0.1)", borderRadius:3, padding:"1px 4px", fontWeight:700 }}>1st record</span>}
          {s.isRare && <span style={{ fontSize:8, color:"#E09080",
            background:"rgba(224,144,128,0.1)", borderRadius:3, padding:"1px 4px", fontWeight:700 }}>⚠ rare</span>}
          {s.isNew && <span style={{ fontSize:8, color:"#A8D5B0",
            background:"rgba(74,154,90,0.1)", borderRadius:3, padding:"1px 4px", fontWeight:700 }}>new to trail</span>}
          {s.count > 1 && <span style={{ fontSize:8, color:"#4A7A5A" }}>×{s.count}</span>}
        </div>
      </div>
      <div style={{ color:"#3A5A4A", fontSize:11, flexShrink:0 }}>›</div>
    </button>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={{ background: accent ? "rgba(74,154,90,0.12)" : "#111E16",
      border:`1px solid ${accent ? "rgba(74,154,90,0.25)" : "rgba(127,175,138,0.1)"}`,
      borderRadius:10, padding:"8px 0", textAlign:"center" }}>
      <div style={{ color:"#E8F4E8", fontSize:17, fontWeight:700 }}>{value}</div>
      <div style={{ color:"#3A5A4A", fontSize:8, marginTop:1,
        textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
    </div>
  );
}

function SectionHead({ icon, title }) {
  return (
    <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
      textTransform:"uppercase", letterSpacing:"0.08em",
      marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
      {icon && <span>{icon}</span>} {title}
    </div>
  );
}

// ── Story renderers ───────────────────────────────────────────────────────────
function SeasonStory({ intel, navigate }) {
  const s = intel;
  const sc = SEASON_COLOR[s.season];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      {/* Opening Frame */}
      {s.openingFrame && (
        <div style={{ background:`${sc}14`, border:`1px solid ${sc}30`,
          borderRadius:12, padding:"14px 16px" }}>
          <div style={{ color: sc, fontSize:10, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>
            {SEASON_ICON[s.season]} Opening
          </div>
          <div style={{ color:"#E8F4E8", fontSize:14, fontWeight:600, lineHeight:1.7 }}>
            "{s.openingFrame}"
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
        {[
          {label:"Sightings",value:s.stats.sightings},
          {label:"Species",  value:s.stats.species},
          {label:"Trails",   value:s.stats.trails},
          {label:"Rare",     value:s.stats.rare},
          {label:"Firsts",   value:s.stats.firsts, accent:s.stats.firsts>0},
        ].map(p => <StatPill key={p.label} {...p} />)}
      </div>

      {/* Highlights */}
      {s.highlights.length > 0 && (
        <div>
          <SectionHead icon="⭐" title="Your season defined by" />
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {s.highlights.map(sp => <SpeciesChip key={sp.speciesId} s={sp} navigate={navigate} />)}
          </div>
        </div>
      )}

      {/* First of season */}
      {s.firstOfSeason.length > 0 && (
        <div>
          <SectionHead icon="🌱" title={`First records this ${SEASON_LABEL[s.season].toLowerCase()}`} />
          <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
            {s.firstOfSeason.map(sp => (
              <button key={sp.id} onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                style={{ flexShrink:0, width:54, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                <div style={{ width:54, height:54, borderRadius:9, overflow:"hidden",
                  background:"#1C3A2A", border:"1px solid rgba(74,154,90,0.25)" }}>
                  {sp.imageUrl
                    ? <img src={sp.imageUrl} alt={sp.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", fontSize:18, opacity:0.3 }}>{GROUP_ICONS[sp.group?.toLowerCase()]||"🌿"}</div>
                  }
                </div>
                <div style={{ fontSize:7, color:"#4A7A5A", marginTop:2, textAlign:"center",
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:54 }}>
                  {sp.name.split(" ").slice(-1)[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rare encounters */}
      {s.rareEncounters.length > 0 && (
        <div style={{ background:"rgba(191,54,12,0.06)", border:"1px solid rgba(191,54,12,0.18)",
          borderRadius:12, padding:"12px 14px" }}>
          <SectionHead icon="⚠️" title="Rare encounters" />
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {s.rareEncounters.map(sp => (
              <button key={sp.id} onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                style={{ display:"flex", alignItems:"center", gap:9, background:"none",
                  border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
                <div style={{ width:30, height:30, borderRadius:6, overflow:"hidden",
                  background:"#2A1810", flexShrink:0 }}>
                  {sp.imageUrl
                    ? <img src={sp.imageUrl} alt={sp.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", fontSize:14, opacity:0.3 }}>⚠️</div>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#DFC8C4", fontSize:12, fontWeight:600 }}>{sp.name}</div>
                  {sp.conservationStatus && (
                    <div style={{ color:"#D47060", fontSize:9, textTransform:"capitalize" }}>{sp.conservationStatus}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trails visited */}
      {s.trailVisited.length > 0 && (
        <div>
          <SectionHead icon="🥾" title="Trails you walked" />
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {s.trailVisited.map(t => (
              <button key={t.id} onClick={() => navigate(`/TrailDetail?id=${t.id}`)}
                style={{ display:"flex", alignItems:"center", gap:9,
                  background:"rgba(127,175,138,0.05)", border:"1px solid rgba(127,175,138,0.1)",
                  borderRadius:9, padding:"8px 12px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#C4DFC8", fontSize:12, fontWeight:600 }}>{t.name}</div>
                  {t.difficulty && <div style={{ color:"#4A7A5A", fontSize:10,
                    textTransform:"capitalize" }}>{t.difficulty}</div>}
                </div>
                <div style={{ color:"#3A5A4A", fontSize:11 }}>›</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Closing thread */}
      {s.closingThread && (
        <div style={{ background:"rgba(127,175,138,0.06)", border:"1px solid rgba(127,175,138,0.15)",
          borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
          <div style={{ color:"#7FAF8A", fontSize:13, fontWeight:600, lineHeight:1.7,
            fontStyle:"italic" }}>
            "{s.closingThread}"
          </div>
        </div>
      )}

      {/* Map button */}
      <button onClick={() => navigate(`/Map?season=${s.season}`)}
        style={{ width:"100%", padding:"11px", borderRadius:10,
          background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.25)",
          color:"#7FAF8A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
        🗺 View {SEASON_LABEL[s.season]} Map →
      </button>
    </div>
  );
}

function YearStory({ intel, navigate }) {
  const s = intel;
  const ROLE_ICON = { keystone:"🌿", seasonal:"🗓", rare:"⚠️", habitat:"🏠", anomaly:"⚡" };
  const ROLE_COLOR = { keystone:"#4A9A5A", seasonal:"#D4883A", rare:"#E09080", habitat:"#7A9AB8", anomaly:"#C4A055" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
        {[
          {label:"Sightings",value:s.stats.sightings},
          {label:"Species",  value:s.stats.species},
          {label:"Trails",   value:s.stats.trails},
          {label:"Rare",     value:s.stats.rare},
          {label:"Firsts",   value:s.stats.firsts, accent:s.stats.firsts>0},
        ].map(p => <StatPill key={p.label} {...p} />)}
      </div>

      {/* 10 Species */}
      <div>
        <SectionHead icon="📖" title={`${s.ten.length} species that defined your ${s.year}`} />
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {s.ten.map((sp, i) => {
            const rc = ROLE_COLOR[sp.role];
            return (
              <button key={sp.speciesId}
                onClick={() => navigate(`/SpeciesDetail?id=${sp.speciesId}`)}
                style={{ display:"flex", alignItems:"center", gap:10,
                  background:"#111E16", border:`1px solid ${rc}28`,
                  borderRadius:12, padding:"10px 12px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ width:42, height:42, borderRadius:9, overflow:"hidden",
                  background:"#1C3A2A", flexShrink:0, position:"relative" }}>
                  {sp.thumbnail
                    ? <img src={sp.thumbnail} alt={sp.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", fontSize:18, opacity:0.3 }}>
                        {GROUP_ICONS[sp.group?.toLowerCase()]||"🌿"}
                      </div>
                  }
                  <div style={{ position:"absolute", top:-1, left:-1, width:14, height:14,
                    background: rc, borderRadius:"50% 50% 50% 0",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:7 }}>
                    {i+1}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#C4DFC8", fontSize:13, fontWeight:600,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {sp.name}
                  </div>
                  <div style={{ display:"flex", gap:5, marginTop:2, alignItems:"center" }}>
                    <span style={{ fontSize:8, color: rc,
                      background: rc+"18", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>
                      {ROLE_ICON[sp.role]} {s.roleLabel[sp.role]}
                    </span>
                    {sp.seasons.length > 0 && (
                      <span style={{ fontSize:8, color:"#4A7A5A" }}>
                        {sp.seasons.map(s=>SEASON_ICON[s]).join("")}
                      </span>
                    )}
                    {sp.isFirst && <span style={{ fontSize:7, color:"#F5C842",
                      background:"rgba(245,200,66,0.1)", borderRadius:3, padding:"1px 4px" }}>1st record</span>}
                  </div>
                </div>
                <div style={{ color:"#3A5A4A", fontSize:11 }}>›</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trails */}
      {s.trailsVisited.length > 0 && (
        <div>
          <SectionHead icon="🥾" title="Trails you walked this year" />
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {s.trailsVisited.map(t => (
              <button key={t.id} onClick={() => navigate(`/TrailDetail?id=${t.id}`)}
                style={{ padding:"5px 10px", borderRadius:8,
                  background:"rgba(127,175,138,0.07)", border:"1px solid rgba(127,175,138,0.15)",
                  color:"#7FAF8A", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitatStory({ intel, navigate }) {
  const s = intel;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      {s.stats.topHabitat && (
        <div style={{ background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.25)",
          borderRadius:12, padding:"14px 16px" }}>
          <div style={{ color:"#7FAF8A", fontSize:10, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
            🏠 Your ecological home range
          </div>
          <div style={{ color:"#E8F4E8", fontSize:15, fontWeight:700 }}>
            {s.stats.topHabitat}
          </div>
          <div style={{ color:"#5A8A6A", fontSize:11, marginTop:2 }}>
            {s.stats.habitats} habitat type{s.stats.habitats!==1?"s":""} visited this year
          </div>
        </div>
      )}

      <div>
        <SectionHead icon="🌿" title="Habitats you walked" />
        {s.habList.map(h => (
          <div key={h.habitatId} style={{ display:"flex", alignItems:"center", gap:10,
            background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
            borderRadius:10, padding:"10px 12px", marginBottom:6 }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"#C4DFC8", fontSize:12, fontWeight:600 }}>{h.label}</div>
              <div style={{ color:"#4A7A5A", fontSize:10, marginTop:1 }}>
                {h.speciesCount} species · {h.count} sightings
              </div>
            </div>
            <button onClick={() => navigate(`/HabitatDetail?type=${h.habitatId}`)}
              style={{ padding:"4px 10px", borderRadius:7,
                background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.2)",
                color:"#7FAF8A", fontSize:9, fontWeight:600, cursor:"pointer" }}>
              Explore →
            </button>
          </div>
        ))}
      </div>

      {s.topHabDefining.length > 0 && (
        <div>
          <SectionHead icon="⭐" title={`Defining species in ${s.stats.topHabitat}`} />
          <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
            {s.topHabDefining.map(sp => (
              <button key={sp.id} onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                style={{ flexShrink:0, width:58, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                <div style={{ width:58, height:58, borderRadius:10, overflow:"hidden", background:"#1C3A2A" }}>
                  {sp.imageUrl
                    ? <img src={sp.imageUrl} alt={sp.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", fontSize:22, opacity:0.25 }}>
                        {GROUP_ICONS[sp.group?.toLowerCase()]||"🌿"}
                      </div>
                  }
                </div>
                <div style={{ fontSize:7.5, color:"#4A7A5A", marginTop:2, textAlign:"center",
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:58 }}>
                  {sp.name.split(" ").slice(-1)[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {s.stats.rareHabitat && (
        <div style={{ background:"rgba(191,54,12,0.06)", border:"1px solid rgba(191,54,12,0.15)",
          borderRadius:10, padding:"10px 14px" }}>
          <div style={{ color:"#D47060", fontSize:10, fontWeight:700, marginBottom:2 }}>⚠️ Rarest habitat</div>
          <div style={{ color:"#C4B0A8", fontSize:12 }}>
            Your most ecologically sensitive encounters were in <strong>{s.stats.rareHabitat}</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

function TrailStory({ intel, navigate }) {
  const s = intel;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      {s.openingFrame && (
        <div style={{ background:"rgba(74,154,90,0.08)", border:"1px solid rgba(74,154,90,0.2)",
          borderRadius:12, padding:"14px 16px" }}>
          <div style={{ color:"#7FAF8A", fontSize:14, fontWeight:600, lineHeight:1.7 }}>
            "{s.openingFrame}"
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5 }}>
        {[
          {label:"Sightings",value:s.stats.sightings},
          {label:"Species",  value:s.stats.species},
          {label:"Rare",     value:s.stats.rare},
          {label:"New",      value:s.stats.new, accent:s.stats.new>0},
        ].map(p => <StatPill key={p.label} {...p} />)}
      </div>
      {s.defining.length > 0 && (
        <div>
          <SectionHead icon="⭐" title="Species that defined this trail for you" />
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {s.defining.map(sp => <SpeciesChip key={sp.speciesId} s={sp} navigate={navigate} />)}
          </div>
        </div>
      )}
      {s.newToTrail.length > 0 && (
        <div>
          <SectionHead icon="🌱" title="New to this trail this year" />
          <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
            {s.newToTrail.map(sp => (
              <button key={sp.id} onClick={() => navigate(`/SpeciesDetail?id=${sp.id}`)}
                style={{ flexShrink:0, width:52, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                <div style={{ width:52, height:52, borderRadius:8, overflow:"hidden",
                  background:"#1C3A2A", border:"1px solid rgba(74,154,90,0.2)" }}>
                  {sp.imageUrl
                    ? <img src={sp.imageUrl} alt={sp.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                        height:"100%", fontSize:18, opacity:0.25 }}>
                        {GROUP_ICONS[sp.group?.toLowerCase()]||"🌿"}
                      </div>
                  }
                </div>
                <div style={{ fontSize:7, color:"#4A7A5A", marginTop:2, textAlign:"center",
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", maxWidth:52 }}>
                  {sp.name.split(" ").slice(-1)[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {s.trail && (
        <button onClick={() => navigate(`/TrailDetail?id=${s.trail.id}`)}
          style={{ width:"100%", padding:"11px", borderRadius:10,
            background:"rgba(74,154,90,0.1)", border:"1px solid rgba(74,154,90,0.25)",
            color:"#7FAF8A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          🥾 Open {s.trail.name} →
        </button>
      )}
    </div>
  );
}

function SpeciesStory({ intel, navigate }) {
  const s = intel;
  if (!s.species) return null;
  const maxMonth = Math.max(...s.monthCounts, 1);
  const curMonth = new Date().getMonth();
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      {/* Species hero */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:64, height:64, borderRadius:12, overflow:"hidden",
          background:"#1C3A2A", flexShrink:0 }}>
          {s.species.imageUrl
            ? <img src={s.species.imageUrl} alt={s.species.name}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                height:"100%", fontSize:26, opacity:0.25 }}>
                {GROUP_ICONS[s.species.group?.toLowerCase()]||"🌿"}
              </div>
          }
        </div>
        <div>
          <div style={{ color:"#E8F4E8", fontSize:16, fontWeight:700 }}>{s.species.name}</div>
          <div style={{ color:"#4A7A5A", fontSize:11, marginTop:2, textTransform:"capitalize" }}>
            {GROUP_ICONS[s.species.group?.toLowerCase()]||""} {s.species.group}
          </div>
          {s.isRare && (
            <div style={{ color:"#D47060", fontSize:9, fontWeight:700,
              background:"rgba(224,144,128,0.1)", borderRadius:4, padding:"2px 6px",
              display:"inline-block", marginTop:4 }}>
              ⚠ {s.species.conservationStatus}
            </div>
          )}
        </div>
      </div>

      {s.openingFrame && (
        <div style={{ background:"rgba(127,175,138,0.07)", border:"1px solid rgba(127,175,138,0.15)",
          borderRadius:10, padding:"12px 14px" }}>
          <div style={{ color:"#A8D5B0", fontSize:13, fontWeight:600, lineHeight:1.7 }}>
            "{s.openingFrame}"
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5 }}>
        {[
          {label:"Total",    value:s.stats.totalSightings},
          {label:"This year",value:s.stats.thisYear},
          {label:"Trails",   value:s.stats.trails},
          {label:"Seasons",  value:s.stats.seasons},
        ].map(p => <StatPill key={p.label} {...p} />)}
      </div>

      {/* Monthly bars */}
      <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
        borderRadius:12, padding:"12px 14px" }}>
        <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
          When you see this species
        </div>
        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:48 }}>
          {s.monthCounts.map((c,i) => {
            const isCur = i === curMonth;
            const season = MONTH_SEASON[i];
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                <div style={{ width:"100%", borderRadius:2,
                  height:`${Math.max(2, (c/maxMonth)*38)}px`,
                  background: isCur ? "#7FAF8A" : (c>0 ? SEASON_COLOR[season] : "#1C3A2A"),
                  opacity: c>0?(isCur?1:0.7):0.25,
                  boxShadow: isCur?"0 0 6px rgba(127,175,138,0.4)":"none" }} />
                <div style={{ fontSize:6.5, color:isCur?"#7FAF8A":"#2A4A3A" }}>
                  {MONTH_SHORT[i]}
                </div>
              </div>
            );
          })}
        </div>
        {s.peakMonth && (
          <div style={{ color:"#7FAF8A", fontSize:10, marginTop:8, fontWeight:600 }}>
            Peak: {s.peakMonth.name} · {s.peakMonth.count} sighting{s.peakMonth.count!==1?"s":""}
          </div>
        )}
      </div>

      {/* Trails */}
      {s.trailsWhereSeen.length > 0 && (
        <div>
          <SectionHead icon="🥾" title="Where you encounter this species" />
          {s.trailsWhereSeen.map(t => (
            <button key={t.id} onClick={() => navigate(`/TrailDetail?id=${t.id}`)}
              style={{ display:"flex", alignItems:"center", gap:8,
                background:"rgba(127,175,138,0.05)", border:"1px solid rgba(127,175,138,0.1)",
                borderRadius:9, padding:"7px 12px", cursor:"pointer", textAlign:"left",
                marginBottom:5, width:"100%" }}>
              <div style={{ flex:1, color:"#C4DFC8", fontSize:12, fontWeight:600 }}>{t.name}</div>
              <div style={{ color:"#3A5A4A", fontSize:11 }}>›</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanionsStory({ intel, navigate }) {
  const s = intel;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      <div style={{ background:"rgba(74,154,90,0.07)", border:"1px solid rgba(74,154,90,0.18)",
        borderRadius:12, padding:"12px 14px" }}>
        <div style={{ color:"#7FAF8A", fontSize:12, fontWeight:600, lineHeight:1.6 }}>
          These are the species that appeared alongside your sightings most often —
          your ecological companions on the land.
        </div>
      </div>
      {s.companions.length === 0 ? (
        <div style={{ color:"#3A5A4A", fontSize:12 }}>Log more sightings to discover your companions.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {s.companions.map((c,i) => (
            <button key={c.speciesId}
              onClick={() => navigate(`/SpeciesDetail?id=${c.speciesId}`)}
              style={{ display:"flex", alignItems:"center", gap:10,
                background:"#111E16", border:"1px solid rgba(127,175,138,0.12)",
                borderRadius:12, padding:"10px 12px", cursor:"pointer", textAlign:"left" }}>
              <div style={{ color:"#3A5A4A", fontSize:11, width:16, textAlign:"center" }}>
                {i+1}
              </div>
              <div style={{ width:40, height:40, borderRadius:8, overflow:"hidden",
                background:"#1C3A2A", flexShrink:0 }}>
                {c.thumbnail
                  ? <img src={c.thumbnail} alt={c.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                      height:"100%", fontSize:17, opacity:0.3 }}>
                      {GROUP_ICONS[c.group?.toLowerCase()]||"🌿"}
                    </div>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#C4DFC8", fontSize:13, fontWeight:600,
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {c.name}
                </div>
                <div style={{ color:"#4A7A5A", fontSize:10, marginTop:1, textTransform:"capitalize" }}>
                  {GROUP_ICONS[c.group?.toLowerCase()]||""} {c.group}
                </div>
              </div>
              <div style={{ color:"#4A9A5A", fontSize:10, fontWeight:700 }}>×{c.score}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RhythmStory({ intel, navigate }) {
  const s = intel;
  const maxCount = Math.max(...s.monthCounts, 1);
  const curMonth = new Date().getMonth();
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"0 16px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div style={{ background:"rgba(74,154,90,0.08)", border:"1px solid rgba(74,154,90,0.2)",
          borderRadius:12, padding:"12px 14px" }}>
          <div style={{ color:"#7FAF8A", fontSize:10, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>📈 Peak</div>
          <div style={{ color:"#E8F4E8", fontSize:14, fontWeight:700 }}>{s.peakMonth.name}</div>
          <div style={{ color:"#5A8A6A", fontSize:10 }}>{s.peakMonth.count} sightings</div>
        </div>
        {s.dominantSeason && (
          <div style={{ background:`${SEASON_COLOR[s.dominantSeason.season]}14`,
            border:`1px solid ${SEASON_COLOR[s.dominantSeason.season]}30`,
            borderRadius:12, padding:"12px 14px" }}>
            <div style={{ color: SEASON_COLOR[s.dominantSeason.season], fontSize:10,
              fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
              {SEASON_ICON[s.dominantSeason.season]} Dominant
            </div>
            <div style={{ color:"#E8F4E8", fontSize:14, fontWeight:700 }}>
              {SEASON_LABEL[s.dominantSeason.season]}
            </div>
            <div style={{ color:"#5A8A6A", fontSize:10 }}>{s.dominantSeason.count} sightings</div>
          </div>
        )}
      </div>

      {/* 12-bar rhythm */}
      <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
        borderRadius:12, padding:"14px" }}>
        <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>
          Your ecological tempo — {s.year}
        </div>
        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:60 }}>
          {s.monthCounts.map((c,i) => {
            const isCur = i === curMonth;
            const season = MONTH_SEASON[i];
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", gap:1 }}>
                <div style={{ fontSize:7, color:isCur?"#A8D5B0":"#2A4A3A", fontWeight:isCur?700:400 }}>
                  {c>0?c:""}
                </div>
                <div style={{ width:"100%", borderRadius:2,
                  height:`${Math.max(2,(c/maxCount)*46)}px`,
                  background: isCur?"#7FAF8A":(c>0?SEASON_COLOR[season]:"#1C3A2A"),
                  opacity:c>0?(isCur?1:0.7):0.2,
                  boxShadow:isCur?"0 0 8px rgba(127,175,138,0.4)":"none" }} />
                <div style={{ fontSize:6, color:isCur?"#7FAF8A":"#2A4A3A" }}>
                  {MONTH_SHORT[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Season breakdown */}
      <div>
        <SectionHead icon="🗓" title="By season" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {["spring","summer","fall","winter"].map(season => (
            <div key={season} style={{ background:"#111E16",
              border:`1px solid ${SEASON_COLOR[season]}22`,
              borderRadius:10, padding:"9px 12px" }}>
              <div style={{ fontSize:11, marginBottom:2 }}>{SEASON_ICON[season]}</div>
              <div style={{ color: SEASON_COLOR[season], fontSize:11, fontWeight:600,
                textTransform:"capitalize" }}>{season}</div>
              <div style={{ color:"#E8F4E8", fontSize:15, fontWeight:700 }}>
                {s.seasonCounts[season]}
              </div>
              <div style={{ color:"#3A5A4A", fontSize:9 }}>sightings</div>
            </div>
          ))}
        </div>
      </div>

      {/* Month-species count */}
      <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
        borderRadius:12, padding:"12px 14px" }}>
        <div style={{ color:"#4A7A5A", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
          Species diversity per month
        </div>
        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:40 }}>
          {s.monthSpeciesCounts.map((c,i) => {
            const maxSp = Math.max(...s.monthSpeciesCounts,1);
            const isCur = i===curMonth;
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", gap:1 }}>
                <div style={{ width:"100%", borderRadius:2,
                  height:`${Math.max(2,(c/maxSp)*32)}px`,
                  background: isCur?"#A8D5B0":"#3A6A5A",
                  opacity:c>0?1:0.15 }} />
                <div style={{ fontSize:6, color:"#2A4A3A" }}>{MONTH_SHORT[i]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Story() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const type       = searchParams.get("type") || null;
  const year       = searchParams.get("year") || String(new Date().getFullYear());
  const season     = searchParams.get("season") || null;
  const speciesId  = searchParams.get("speciesId") || null;
  const trailId    = searchParams.get("trailId") || null;
  const currentYear = new Date().getFullYear();

  const [obs,   setObs]   = useState([]);
  const [sp,    setSp]    = useState([]);
  const [trails,setTrails]= useState([]);
  const [loading,setLoad] = useState(true);

  useEffect(() => {
    Promise.all([
      Observation.filter({}).catch(() => []),
      Species.filter({}).catch(() => []),
      Trail.filter({}).catch(() => []),
    ]).then(([o, s, t]) => {
      setObs(o || []);
      setSp(s || []);
      setTrails(t || []);
      setLoad(false);
    });
  }, []);

  const speciesMap = useMemo(() => {
    const m = {};
    sp.forEach(s => { if (s?.id) m[s.id] = s; });
    return m;
  }, [sp]);

  const intel = useMemo(() => {
    if (loading || !type) return null;
    return reduceStory({ type, year, season, speciesId, trailId,
      observations: obs, speciesMap, trails });
  }, [loading, type, year, season, speciesId, trailId, obs, speciesMap, trails]);

  // ── Title for current story ──
  const STORY_TITLE = {
    season: season ? `Your ${SEASON_LABEL[season]||season} Story · ${year}` : "Season Story",
    year:   `Your ${year} in 10 Species`,
    habitat:`Your Habitat Signature · ${year}`,
    trail:  intel?.trail ? `Your ${year} on ${intel.trail.name}` : `Trail Story · ${year}`,
    species:intel?.species ? `Your Story with ${intel.species.name}` : "Species Story",
    companions:`Your Ecological Companions · ${year}`,
    rhythm: `Your Ecological Rhythm · ${year}`,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0D1520",
      fontFamily:"system-ui,-apple-system,sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:"#0A1510", borderBottom:"1px solid rgba(74,154,90,0.12)",
        padding:"18px 16px 14px" }}>
        <button onClick={() => navigate(type ? "/Story" : -1)}
          style={{ background:"rgba(0,0,0,0.2)", border:"none", color:"rgba(240,233,214,0.6)",
            fontSize:13, borderRadius:8, padding:"5px 10px", cursor:"pointer", marginBottom:12 }}>
          {type ? "← All Stories" : "← Back"}
        </button>
        <div style={{ color:"#3A6A5A", fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>
          📖 Ecological Stories
        </div>
        <div style={{ color:"#F0E9D6", fontSize:19, fontWeight:800, letterSpacing:"-0.01em" }}>
          {type ? STORY_TITLE[type] : "Your Stories"}
        </div>
        {!type && (
          <div style={{ color:"#4A7A5A", fontSize:12, marginTop:4 }}>
            Your ecological biography — season, habitat, species, and rhythm.
          </div>
        )}
      </div>

      <div style={{ paddingTop:16 }}>
        {/* Hub — no type selected */}
        {!type && <StoryHub navigate={navigate} currentYear={currentYear} />}

        {/* Loading */}
        {type && loading && (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#3A5A4A" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📖</div>
            <div style={{ fontSize:12 }}>Building your story…</div>
          </div>
        )}

        {/* No data */}
        {type && !loading && (!intel || (intel.stats && intel.stats.sightings === 0 && type !== "species" && type !== "companions")) && (
          <div style={{ padding:"0 16px" }}>
            <div style={{ background:"#111E16", border:"1px solid rgba(127,175,138,0.1)",
              borderRadius:14, padding:"28px 20px", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🌿</div>
              <div style={{ color:"#7FAF8A", fontSize:14, fontWeight:600, marginBottom:6 }}>
                No sightings to build this story yet
              </div>
              <div style={{ color:"#3A5A4A", fontSize:12, marginBottom:16 }}>
                Log your first sighting to start generating ecological stories.
              </div>
              <button onClick={() => navigate("/LogSighting")}
                style={{ padding:"10px 20px", borderRadius:9,
                  background:"rgba(74,154,90,0.15)", border:"1px solid rgba(74,154,90,0.3)",
                  color:"#7FAF8A", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                + Log a Sighting
              </button>
            </div>
          </div>
        )}

        {/* Story renderers */}
        {!loading && intel && type === "season"     && <SeasonStory     intel={intel} navigate={navigate} />}
        {!loading && intel && type === "year"       && <YearStory       intel={intel} navigate={navigate} />}
        {!loading && intel && type === "habitat"    && <HabitatStory    intel={intel} navigate={navigate} />}
        {!loading && intel && type === "trail"      && <TrailStory      intel={intel} navigate={navigate} />}
        {!loading && intel && type === "species"    && <SpeciesStory    intel={intel} navigate={navigate} />}
        {!loading && intel && type === "companions" && <CompanionsStory intel={intel} navigate={navigate} />}
        {!loading && intel && type === "rhythm"     && <RhythmStory     intel={intel} navigate={navigate} />}
      </div>

      <BottomNav active="story" />
    </div>
  );
}
