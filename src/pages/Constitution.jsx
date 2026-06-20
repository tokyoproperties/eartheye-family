import { useNavigate } from "react-router-dom";

const PRINCIPLES = [
  {
    id: "no-tracking",
    icon: "🚫",
    title: "No Tracking",
    body: "EarthEye OC does not track you. It does not record your location, your clicks, your sightings, or your time on any server. There is no analytics layer. There is no telemetry. The atlas does not know you exist.",
  },
  {
    id: "no-accounts",
    icon: "🚫",
    title: "No Accounts",
    body: "You do not need to sign in. You do not need to create a profile. You do not need to give your name, email, phone number, or any personally identifying information to use any part of the atlas. The atlas is anonymous by default and by design.",
  },
  {
    id: "local-memory",
    icon: "📱",
    title: "All Data Stays on Your Device",
    body: "Your journal, your yearbooks, your sighting history, your phenology, your moments — every piece of data you generate is stored only in your browser's localStorage. It lives on your device and only your device. When you clear your browser storage, it is gone. No server holds a copy.",
  },
  {
    id: "no-profiling",
    icon: "🚫",
    title: "No Profiling",
    body: "EarthEye OC does not build a model of your behavior, your preferences, or your ecological interests. It does not categorize you. It does not score you. It does not sell insights about you. It does not know your profile, because it never builds one.",
  },
  {
    id: "no-ads",
    icon: "🚫",
    title: "No Ads",
    body: "There are no advertisements in the atlas. There are no sponsored species. There are no promoted trails. There are no banner ads, pop-ups, or interstitials. The atlas does not generate revenue by selling your attention.",
  },
  {
    id: "no-engagement-loops",
    icon: "🚫",
    title: "No Engagement Loops",
    body: "EarthEye OC is not designed to maximize your time in the app. There are no streaks, no points, no leaderboards, no badges, no daily challenges, no artificial urgency. The atlas is indifferent to how often you open it. It will be here when the season changes and you want to know what moved.",
  },
  {
    id: "no-notifications",
    icon: "🚫",
    title: "No Notifications",
    body: "EarthEye OC will never ask to send you notifications. It will never push alerts, reminders, or recommendations to your device. It will not interrupt your day. It waits until you come to it.",
  },
  {
    id: "no-manipulation",
    icon: "🚫",
    title: "No Manipulation",
    body: "Nothing in the atlas is designed to alter your behavior, extend your session, increase your dependence, or shape your emotions for commercial ends. The companion layer surfaces ecological truth — not nudges. The seasonal engine reflects the county's actual phenology — not content optimized for engagement.",
  },
  {
    id: "open-source-spirit",
    icon: "🌿",
    title: "Built in the Open",
    body: "The atlas is built on a constitutional discipline: every feature is evaluated against these principles before it is implemented. If a feature requires tracking, it is not built. If a feature requires an account, it is not built. If a feature requires a server to remember something about you, it is not built. The constraint is the design.",
  },
];

export default function Constitution() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background:"#7FAF8A" }} />
          <span style={{ color:"#7FAF8A", fontSize:"11px", fontWeight:"700",
            textTransform:"uppercase", letterSpacing:"0.08em" }}>
            EarthEye OC · Principles of Operation
          </span>
        </div>
        <h1 className="font-bold mb-3"
          style={{ color:"rgba(255,255,255,0.90)", fontFamily:"Georgia,serif", fontWeight:"400", fontSize:"clamp(22px,5vw,30px)", letterSpacing:"-0.01em" }}>
          The Atlas Constitution
        </h1>
        <div className="rounded-2xl px-5 py-4"
          style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color:"rgba(255,255,255,0.60)", fontSize:"13px", fontStyle:"italic", fontFamily:"Georgia,serif", lineHeight:"1.8" }}>
            EarthEye OC was built with a constitutional spine — a set of principles that govern
            every feature, every surface, and every decision. These are not aspirational values.
            They are architectural constraints. The atlas cannot violate them because it is not
            built in a way that would allow it to.
          </p>
        </div>
      </div>

      {/* Principles */}
      <div className="space-y-4">
        {PRINCIPLES.map((p, i) => (
          <div key={p.id} className="rounded-2xl px-5 py-5"
            style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize:"18px", flexShrink:0, marginTop:"1px" }}>{p.icon}</span>
              <div>
                <div style={{ color:"rgba(255,255,255,0.88)", fontSize:"14px", fontFamily:"Georgia,serif", fontWeight:"400",
                  marginBottom:"6px" }}>
                  {p.title}
                </div>
                <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"13px", lineHeight:"1.75" }}>
                  {p.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-2xl px-5 py-5 text-center"
        style={{ background:"#1A1A17", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:"10px" }}>
          The Intent
        </div>
        <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"14px", fontStyle:"italic", fontFamily:"Georgia,serif", lineHeight:"1.8" }}>
          EarthEye OC is a companion, not a platform.<br/>
          It is a field guide, not a social network.<br/>
          It is a seasonal instrument, not an engagement engine.<br/>
          It belongs to the land it describes.
        </p>
      </div>

      {/* Version / back */}
      <div className="mt-6 text-center">
        <button onClick={() => navigate(-1)}
          style={{ color:"#9BB8A4", fontSize:"12px", background:"none",
            border:"none", cursor:"pointer" }}>
          ← Back to Atlas
        </button>
      </div>

    </div>
  );
}
