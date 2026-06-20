// EarthEye OC — Home v4 — Yard Edition DNA
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trail, Species } from "@/api/entities";
import BottomNav from "./BottomNav";

// ── Design tokens — Yard Edition dark DNA ────────────────────────────────────
const T = {
  bg:        "#0F0F0D",
  card:      "#1A1A17",
  border:    "rgba(255,255,255,0.07)",
  ink:       "rgba(255,255,255,0.90)",
  inkMid:    "rgba(255,255,255,0.70)",
  inkLight:  "rgba(255,255,255,0.35)",  // whispered labels
  inkFaint:  "rgba(255,255,255,0.18)",
  accent:    "#7AB87A",   // sage green — content only
  accentRose:"#C47A7A",  // dusty rose
  accentAmber:"#C4974A", // warm amber
  accentBlue:"#7A9AB8",  // muted blue
};

function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return { label: "Spring", months: "Mar – May", voice: "California Gnatcatcher is breeding in coastal sage. Least Bell's Vireo arrives mid-May. The chaparral is blooming." };
  if (m >= 5 && m <= 7) return { label: "Summer", months: "Jun – Aug", voice: "Arrive before 8am on exposed trails. Grunion run at Crystal Cove. Post-breeding shorebirds return to the bay late July." };
  if (m >= 8 && m <= 10) return { label: "Fall",   months: "Sep – Nov", voice: "All five corridors peak simultaneously in October. Crimson pickleweed. Bioluminescence on calm nights. Cottonwood gold on Santiago Creek." };
  return                        { label: "Winter", months: "Dec – Feb", voice: "Best season for the full Mountains-to-Sea traverse. Maximum shorebird diversity at Newport Bay. Gray Whale migration offshore." };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 10) return "Morning light is low and lateral — the best time for shadow and movement.";
  if (h >= 10 && h < 14) return "Midday light flattens contrast. Reptiles are at peak surface temperature. Raptors are gaining altitude.";
  if (h >= 14 && h < 18) return "Thermal columns are active above the ridgelines. Raptors riding them.";
  if (h >= 18 && h < 21) return "Light is dropping. Insect emergence rising. Bats active over water and oak canopy.";
  return "The Great Horned Owl is calling from the canyon. Pacific Tree Frogs are active near standing water.";
}

const CORRIDORS = [
  { id: "69e069445c7bb4cecf803289", name: "Mountains-to-Sea",  sub: "22 mi · Hard",      voice: "Every OC biome in a single traverse." },
  { id: "69e0248656b58bca7d679d30", name: "Upper Newport Bay", sub: "10.5 mi · Moderate", voice: "Where the watershed exhales into the Pacific." },
  { id: "69e005f2b447b8e1f109219e", name: "Crystal Cove",      sub: "18 mi · Moderate",  voice: "Backcountry chaparral to basalt reef." },
  { id: "69e06ef8ae83438254c22903", name: "San Juan Creek",    sub: "22 mi · Hard",      voice: "Juaneño corridor — Cleveland NF to Doheny." },
  { id: "69e0289d7669e7f23c9f9c4b", name: "Santiago Creek",   sub: "14 mi · Easy",      voice: "Wildlife corridor through the urban core." },
];

// ── Whispered section label ───────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{
      fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
      textTransform: "uppercase", color: T.inkLight, marginBottom: "14px"
    }}>
      {children}
    </div>
  );
}

// ── Hairline divider ──────────────────────────────────────────────────────────
function Rule() {
  return <div style={{ height: "1px", background: T.border, margin: "0 0 36px" }} />;
}

// ── Nav entry row ─────────────────────────────────────────────────────────────
function NavEntry({ label, meta, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 0", borderBottom: `1px solid ${T.border}`,
        cursor: "pointer"
      }}
    >
      <div>
        <div style={{ fontSize: "17px", fontFamily: "Georgia, serif", fontWeight: "400", color: T.ink, marginBottom: "3px" }}>
          {label}
        </div>
        {meta && <div style={{ fontSize: "12px", color: T.inkLight }}>{meta}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={T.inkLight} strokeWidth="1.5" strokeLinecap="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [counts, setCounts]  = useState({ species: 542, trails: 111 });
  const [heroTrail, setHero] = useState(null);
  const season   = getSeason();
  const greeting = getGreeting();
  const today    = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    // Hero trail
    (async () => {
      try {
        const res = await Trail.filter({}, null, 40);
        const trails = Array.isArray(res) ? res : (res?.records || []);
        const withHero = trails.filter(t => t.heroImage);
        if (withHero.length) setHero(withHero[Math.floor(Math.random() * withHero.length)]);
      } catch {}
    })();

    // Real counts
    (async () => {
      try {
        let sp = 0, skip = 0;
        while (true) {
          const b = await Species.filter({}, null, 500, skip);
          const r = Array.isArray(b) ? b : (b?.records || []);
          sp += r.length;
          if (r.length < 500) break;
          skip += 500;
        }
        let tr = 0; skip = 0;
        while (true) {
          const b = await Trail.filter({}, null, 200, skip);
          const r = Array.isArray(b) ? b : (b?.records || []);
          tr += r.length;
          if (r.length < 200) break;
          skip += 200;
        }
        if (sp > 0) setCounts(c => ({ ...c, species: sp }));
        if (tr > 0) setCounts(c => ({ ...c, trails: tr }));
      } catch {}
    })();
  }, []);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", paddingBottom: "80px" }}>

      {/* ── Hero image ────────────────────────────────────────────────────── */}
      {heroTrail?.heroImage && (
        <div
          onClick={() => heroTrail?.id && navigate(`/TrailDetail?id=${heroTrail.id}`)}
          style={{
            position: "relative", width: "100%",
            height: "56vw", maxHeight: "360px", minHeight: "200px",
            overflow: "hidden", cursor: "pointer", background: "#0A0A08"
          }}
        >
          <img
            src={heroTrail.heroImage}
            alt={heroTrail.name}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              objectPosition: "center", display: "block", opacity: 0.65 }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(15,15,13,0.1) 0%, rgba(15,15,13,0.75) 100%)"
          }} />
          <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "5px" }}>
              {heroTrail.jurisdiction || "Orange County"}
            </div>
            <div style={{ fontSize: "16px", fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.88)" }}>
              {heroTrail.name}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "32px 20px 0" }}>

        {/* ── Wordmark + date ────────────────────────────────────────────── */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.14em",
            textTransform: "uppercase", color: T.inkLight, marginBottom: "6px" }}>
            EarthEye OC
          </div>
          <div style={{ fontSize: "12px", color: T.inkLight }}>
            {today} · {season.label}
          </div>
        </div>

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "40px" }}>
          <Label>Greeting</Label>
          <div style={{
            fontSize: "20px", fontFamily: "Georgia, serif",
            fontStyle: "italic", color: T.inkMid, lineHeight: 1.55,
            fontWeight: "400"
          }}>
            {greeting}
          </div>
        </div>

        {/* ── Today's Briefing — elevated daily pulse ──────────────────── */}
        <div
          onClick={() => navigate("/Field")}
          style={{
            marginBottom: "40px", cursor: "pointer",
            borderLeft: "2px solid rgba(122,184,122,0.5)",
            paddingLeft: "14px"
          }}
        >
          <div style={{
            fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(122,184,122,0.7)",
            marginBottom: "7px"
          }}>
            Today's Briefing
          </div>
          <div style={{
            fontSize: "16px", fontFamily: "Georgia, serif",
            color: T.ink, marginBottom: "4px"
          }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div style={{
            fontSize: "13px", fontStyle: "italic", fontFamily: "Georgia, serif",
            color: T.inkMid, lineHeight: 1.55
          }}>
            Live ecological conditions — open the daily field report
          </div>
        </div>

        <Rule />

        {/* ── Season ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "40px", cursor: "pointer" }} onClick={() => navigate("/Seasonal")} >
          <Label>Season · {season.months}</Label>
          <div style={{
            fontSize: "22px", fontFamily: "Georgia, serif",
            color: T.ink, letterSpacing: "-0.01em", marginBottom: "12px"
          }}>
            {season.label}
          </div>
          <div style={{
            fontSize: "14px", fontStyle: "italic", fontFamily: "Georgia, serif",
            color: T.inkMid, lineHeight: 1.65
          }}>
            {season.voice}
          </div>
        </div>

        <Rule />

        {/* ── Atlas navigation ──────────────────────────────────────────── */}
        <div style={{ marginBottom: "40px" }}>
          <Label>Atlas</Label>
          <NavEntry
            label="Species"
            meta={`${counts.species} documented · Orange County, CA`}
            onClick={() => navigate("/Species")}
          />
          <NavEntry
            label="Trails"
            meta={`${counts.trails} routes · all biomes`}
            onClick={() => navigate("/Trails")}
          />

          <NavEntry
            label="Search the Atlas"
            meta="Any species, habitat, or trait"
            onClick={() => navigate("/Search")}
          />
        </div>

        <Rule />

        {/* ── Canonical Corridors ───────────────────────────────────────── */}
        <div style={{ marginBottom: "40px" }}>
          <Label>Canonical Corridors</Label>
          {CORRIDORS.map((c, i) => (
            <div
              key={c.id}
              onClick={() => navigate(`/TrailDetail?id=${c.id}`)}
              style={{
                display: "flex", alignItems: "flex-start", gap: "16px",
                padding: "16px 0", borderBottom: `1px solid ${T.border}`,
                cursor: "pointer"
              }}
            >
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%",
                border: `1px solid rgba(122,184,122,0.4)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "700", color: T.accent,
                flexShrink: 0, marginTop: "2px"
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontFamily: "Georgia, serif",
                  color: T.ink, marginBottom: "3px" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: "12px", color: T.inkLight }}>{c.voice}</div>
              </div>
              <div style={{ fontSize: "11px", color: T.inkFaint, flexShrink: 0, paddingTop: "3px" }}>
                {c.sub}
              </div>
            </div>
          ))}
          <div style={{ paddingTop: "14px" }}>
            <span
              onClick={() => navigate("/Trails")}
              style={{ fontSize: "12px", color: T.accent, cursor: "pointer" }}
            >
              All {counts.trails} trails →
            </span>
          </div>
        </div>

        <Rule />

        {/* ── More ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          <Label>More</Label>
          <NavEntry label="Seasonal Atlas"     meta="Year arc · species windows · phenology" onClick={() => navigate("/Seasonal")} />
          <NavEntry label="Yearbook"           meta="Your seasonal record"                    onClick={() => navigate("/Yearbook")} />
          <NavEntry label="Sky"                meta="Moon, stars, night ecology"              onClick={() => navigate("/Sky")} />
          <NavEntry label="Habitats"           meta="Biomes and ecological zones"             onClick={() => navigate("/Habitats")} />
          <NavEntry label="Near Me"            meta="Trails by proximity"                     onClick={() => navigate("/NearMe")} />
          <NavEntry label="Log a Sighting"     meta="Record an observation"                   onClick={() => navigate("/LogSighting")} />
        </div>

      </div>

      <BottomNav active="home" />
    </div>
  );
}