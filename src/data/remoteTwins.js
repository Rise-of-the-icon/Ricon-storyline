const RAILWAY_URL = "https://ricon-storyline-production.up.railway.app";

function normalizeWhitespace(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function stripDiacritics(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function buildLegendMergeKey(name = "") {
  let cleaned = normalizeWhitespace(stripDiacritics(name).toLowerCase())
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.includes("walt liquor")) return "walt liquor";
  if (cleaned.includes("david west")) return "david west";
  if (cleaned.includes("tom hoover")) return "tom hoover";
  return cleaned;
}

function inferLegendCategory(twin) {
  const name = `${twin?.coreIdentity?.name || ""}`.toLowerCase();
  const summary = `${twin?.wikipedia?.summary || ""}`.toLowerCase();
  const description = `${twin?.wikipedia?.description || ""}`.toLowerCase();
  const haystack = `${name} ${summary} ${description}`;
  if (
    /music|musician|artist|rapper|singer|producer|executive|song|album|hip[-\s]?hop|r&b|rock|jazz/.test(
      haystack,
    )
  ) {
    return {
      cat: "music",
      genre: "music",
      genreLabel: "Music",
    };
  }
  return {
    cat: "sports",
    league: "nba",
    leagueLabel: "NBA",
  };
}

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

function isPlaceholderText(value = "") {
  return /\b(test|demo|sample|placeholder|unknown|temp)\b/i.test(value);
}

function normalizeLegendMoments(moments = []) {
  const seen = new Set();
  return moments
    .filter((m) => m?.title)
    .map((m) => ({
      ...m,
      source: m.source || m.src || "Verified archival source",
      src: m.src || m.source || "Verified archival source",
    }))
    .filter((m) => {
      const key = `${String(m.y || "")}:${String(m.title || "").toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function legendQualityScore(legend) {
  const momentScore = (legend.moments?.length || 0) * 10;
  const statScore = (legend.stats?.length || 0) * 2;
  const bodyScore = (legend.moments || []).reduce((sum, m) => sum + (m.body?.length || 0), 0);
  const yearsScore = legend.years ? 3 : 0;
  const imageScore = legend.headshot ? 2 : 0;
  const taglinePenalty = isPlaceholderText(legend.tagline || "") ? -10 : 0;
  return momentScore + statScore + bodyScore / 50 + yearsScore + imageScore + taglinePenalty;
}

function isRenderableLegend(legend) {
  const key = buildLegendMergeKey(legend.name);
  if (!key || key === "unknown") return false;
  if (isPlaceholderText(legend.name || "")) return false;
  if (!legend.moments || legend.moments.length === 0) return false;
  return true;
}

function dedupeLegendsByPerson(legends) {
  const byKey = new Map();
  legends.forEach((legend) => {
    const key = buildLegendMergeKey(legend.name);
    if (!key) return;
    const next = {
      ...legend,
      _mergeKey: key,
      moments: normalizeLegendMoments(legend.moments),
    };
    if (!isRenderableLegend(next)) return;
    const current = byKey.get(key);
    if (!current || legendQualityScore(next) > legendQualityScore(current)) {
      byKey.set(key, next);
    }
  });
  return [...byKey.values()];
}

export function transformTwinToLegend(twin, options = {}) {
  const inferred = inferLegendCategory(twin);
  const {
    cat = inferred.cat,
    league = inferred.league,
    leagueLabel = inferred.leagueLabel,
    genre = inferred.genre,
    genreLabel = inferred.genreLabel,
  } = options;

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

  const mergeKey = buildLegendMergeKey(name);

  const stats = [];
  if (bdl.recent_season?.ppg) stats.push({ l: "PPG", v: String(bdl.recent_season.ppg) });
  if (bdl.recent_season?.rpg) stats.push({ l: "RPG", v: String(bdl.recent_season.rpg) });
  if (bdl.recent_season?.apg) stats.push({ l: "APG", v: String(bdl.recent_season.apg) });
  if (bdl.height)              stats.push({ l: "Height", v: bdl.height });

  return {
    id:         twin.twinId || `remote-${mergeKey.replace(/\s+/g, "-")}`,
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
    genre,
    genreLabel,
    _remote:    true,
    _mergeKey:  mergeKey,
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
    const remoteLegends = twins
      .filter(isPublishableTwin)
      .map((t) => transformTwinToLegend(t));
    return dedupeLegendsByPerson(remoteLegends);
  } catch (err) {
    console.warn("[remoteTwins] Fetch failed, using local data only:", err);
    return [];
  }
}
