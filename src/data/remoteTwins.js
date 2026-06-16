const RAILWAY_URL = "https://ricon-storyline-production.up.railway.app";

function inferMomentType(title = "", eventType = "") {
  const t = title.toLowerCase();
  if (/draft(ed)?/.test(t)) return "draft";
  if (/champion|championship|title|ring/.test(t)) return "championship";
  if (/record|scored|points/.test(t)) return "record";
  if (/retire|retirement|farewell/.test(t)) return "retirement";
  if (eventType === "Achievement" || eventType === "Award") return "record";
  return "iconic";
}

function extractYears(timeline) {
  const years = (timeline || []).map(e => e.year).filter(Boolean).sort((a, b) => a - b);
  if (years.length === 0) return "";
  return `${years[0]} – ${years[years.length - 1]}`;
}

function isPublicTimelineEvent(event) {
  return event?.visibility === "Public" && event?.approvalStatus === "Reviewed";
}

function isPublicCustomMoment(moment) {
  return moment?.visibility === "Public";
}

function isPublishableTwin(twin) {
  if (twin?.draftStatus !== "saved") return false;
  const publicTimeline = (twin.timeline || []).some(isPublicTimelineEvent);
  const publicMoments = (twin.customMoments || []).some(isPublicCustomMoment);
  return publicTimeline || publicMoments;
}

export function transformTwinToLegend(twin, options = {}) {
  const { cat = "sports", league = "nba", leagueLabel = "NBA" } = options;

  const name   = twin.coreIdentity?.name || "Unknown";
  const wiki   = twin.wikipedia || {};
  const bdl    = twin.bdl_verified_stats || {};
  const timeline = (twin.timeline || [])
    .filter(isPublicTimelineEvent)
    .sort((a, b) => (a.year || 0) - (b.year || 0));
  const customMoments = (twin.customMoments || []).filter(isPublicCustomMoment);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const timelineMoments = timeline
    .map(event => ({
      y:      String(event.year || ""),
      era:    event.decade || "",
      type:   inferMomentType(event.title, event.eventType),
      title:  event.title || "",
      body:   event.description || event.summary || "",
      src:    event.source?.citation || event.source?.url || "Wikipedia",
      source: event.source?.citation || event.source?.url || "Wikipedia",
    }))
    .filter(m => m.title);

  const customMapped = customMoments
    .map(cm => ({
      y:      cm.date?.slice(0, 4) || "",
      era:    "Personal",
      type:   "iconic",
      title:  cm.title || "",
      body:   cm.description || "",
      src:    "Verified by athlete",
      source: "Verified by athlete",
    }))
    .filter(m => m.title);

  const allMoments = [...timelineMoments, ...customMapped]
    .sort((a, b) => (parseInt(a.y) || 0) - (parseInt(b.y) || 0));

  const stats = [];
  if (bdl.recent_season?.ppg) stats.push({ l: "PPG", v: String(bdl.recent_season.ppg) });
  if (bdl.recent_season?.rpg) stats.push({ l: "RPG", v: String(bdl.recent_season.rpg) });
  if (bdl.recent_season?.apg) stats.push({ l: "APG", v: String(bdl.recent_season.apg) });
  if (bdl.height)              stats.push({ l: "Height", v: bdl.height });

  return {
    id:         twin.twinId,
    name,
    initials,
    headshot:   wiki.imageUrl || "",
    years:      extractYears(timeline),
    position:   bdl.position || "",
    tagline:    wiki.description || `${name}'s verified digital twin`,
    teams:      "",
    stats,
    voice:      wiki.description || "",
    moments:    allMoments,
    cat,
    league,
    leagueLabel,
    _remote:    true,
    // Preserve raw API data for use in HomeScreen merge logic
    _bdl:       twin.bdl_verified_stats  || null,
    _wiki:      twin.wiki_verified_stats || null,
  };
}

export async function fetchRemoteLegends() {
  try {
    const res = await fetch(`${RAILWAY_URL}/api/twins`);
    if (!res.ok) {
      console.warn(`[remoteTwins] API returned ${res.status}`);
      return [];
    }
    const twins = await res.json();
    return twins
      .filter(isPublishableTwin)
      .map(t =>
        transformTwinToLegend(t, { cat: "sports", league: "nba", leagueLabel: "NBA" })
      );
  } catch (err) {
    console.warn("[remoteTwins] Fetch failed, using local data only:", err);
    return [];
  }
}
