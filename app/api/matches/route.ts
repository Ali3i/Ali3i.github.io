import { NextRequest, NextResponse } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "halftime" | "finished";
  kickoff: string; // ISO datetime
  minute: number | null;
  league: string;
  leagueId: string;
  commentator: string | null;
  twitterVerified: boolean;
  homeLogoUrl: string;
  awayLogoUrl: string;
}

// ─── Football API integration ───────────────────────────────────────────
// Replace FOOTBALL_API_KEY with your real key in .env.local
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY ?? "";
const FOOTBALL_API_BASE = "https://api.football-data.org/v4";

async function fetchMatchesFromApi(date: string): Promise<Match[]> {
  if (!FOOTBALL_API_KEY) {
    return getDemoMatches(date);
  }

  try {
    const res = await fetch(
      `${FOOTBALL_API_BASE}/matches?date=${date}`,
      {
        headers: { "X-Auth-Token": FOOTBALL_API_KEY },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      console.error("Football API error:", res.status);
      return getDemoMatches(date);
    }

    const data = await res.json();

    return (data.matches ?? []).map((m: any) => ({
      id: String(m.id),
      homeTeam: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "—",
      awayTeam: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "—",
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
      status: mapStatus(m.status),
      kickoff: m.utcDate,
      minute: m.minute ?? null,
      league: m.competition?.name ?? "",
      leagueId: String(m.competition?.id ?? ""),
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: m.homeTeam?.crest ?? "",
      awayLogoUrl: m.awayTeam?.crest ?? "",
    }));
  } catch (err) {
    console.error("Football API fetch failed:", err);
    return getDemoMatches(date);
  }
}

function mapStatus(apiStatus: string): Match["status"] {
  switch (apiStatus) {
    case "IN_PLAY":
    case "LIVE":
      return "live";
    case "PAUSED":
    case "HALFTIME":
      return "halftime";
    case "FINISHED":
      return "finished";
    default:
      return "scheduled";
  }
}

// ─── Twitter / X verification layer ─────────────────────────────────────
// Enriches matches with commentator info sourced from Twitter/X accounts.
// Replace TWITTER_BEARER_TOKEN with your real token in .env.local
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN ?? "";

interface TwitterCommentatorInfo {
  matchId: string;
  commentator: string;
  verified: boolean;
}

async function fetchTwitterCommentators(
  matches: Match[]
): Promise<TwitterCommentatorInfo[]> {
  if (!TWITTER_BEARER_TOKEN || matches.length === 0) {
    return getRandomCommentators(matches);
  }

  try {
    // Search recent tweets from known commentator accounts mentioning match teams
    const teamNames = matches
      .slice(0, 10)
      .map((m) => `${m.homeTeam} ${m.awayTeam}`)
      .join(" OR ");

    const query = encodeURIComponent(
      `(${teamNames}) (معلق OR commentator) -is:retweet`
    );

    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=50&tweet.fields=author_id,text`,
      {
        headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return getRandomCommentators(matches);
    }

    const data = await res.json();
    const results: TwitterCommentatorInfo[] = [];

    for (const match of matches) {
      const relevant = (data.data ?? []).find(
        (t: any) =>
          t.text?.includes(match.homeTeam) || t.text?.includes(match.awayTeam)
      );
      if (relevant) {
        const nameMatch = relevant.text.match(
          /(?:معلق|المعلق|commentator)[:\s]+([^\n,]+)/i
        );
        results.push({
          matchId: match.id,
          commentator: nameMatch?.[1]?.trim() ?? "غير معروف",
          verified: true,
        });
      }
    }

    return results;
  } catch {
    return getRandomCommentators(matches);
  }
}

// ─── Demo / fallback data ───────────────────────────────────────────────
const COMMENTATORS = [
  "عصام الشوالي",
  "رؤوف خليف",
  "فهد العتيبي",
  "حفيظ دراجي",
  "يوسف سيف",
  "خليل البلوشي",
  "علي سعيد الكعبي",
];

function getRandomCommentators(matches: Match[]): TwitterCommentatorInfo[] {
  return matches.map((m) => ({
    matchId: m.id,
    commentator: COMMENTATORS[Math.floor(Math.random() * COMMENTATORS.length)],
    verified: false,
  }));
}

function getDemoMatches(date: string): Match[] {
  const baseDate = date || new Date().toISOString().slice(0, 10);
  return [
    {
      id: "1",
      homeTeam: "الهلال",
      awayTeam: "النصر",
      homeScore: 2,
      awayScore: 1,
      status: "live",
      kickoff: `${baseDate}T17:00:00Z`,
      minute: 67,
      league: "دوري روشن السعودي",
      leagueId: "rsl",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "2",
      homeTeam: "الأهلي",
      awayTeam: "الاتحاد",
      homeScore: 0,
      awayScore: 0,
      status: "scheduled",
      kickoff: `${baseDate}T19:30:00Z`,
      minute: null,
      league: "دوري روشن السعودي",
      leagueId: "rsl",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "3",
      homeTeam: "ريال مدريد",
      awayTeam: "برشلونة",
      homeScore: 1,
      awayScore: 1,
      status: "halftime",
      kickoff: `${baseDate}T20:00:00Z`,
      minute: 45,
      league: "الدوري الإسباني",
      leagueId: "laliga",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "4",
      homeTeam: "ليفربول",
      awayTeam: "مانشستر سيتي",
      homeScore: 3,
      awayScore: 2,
      status: "finished",
      kickoff: `${baseDate}T15:00:00Z`,
      minute: 90,
      league: "الدوري الإنجليزي",
      leagueId: "epl",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "5",
      homeTeam: "باريس سان جيرمان",
      awayTeam: "مارسيليا",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      kickoff: `${baseDate}T21:00:00Z`,
      minute: null,
      league: "الدوري الفرنسي",
      leagueId: "ligue1",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "6",
      homeTeam: "بايرن ميونخ",
      awayTeam: "دورتموند",
      homeScore: 2,
      awayScore: 0,
      status: "live",
      kickoff: `${baseDate}T18:30:00Z`,
      minute: 52,
      league: "الدوري الألماني",
      leagueId: "bundesliga",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "7",
      homeTeam: "يوفنتوس",
      awayTeam: "إنتر ميلان",
      homeScore: 1,
      awayScore: 2,
      status: "finished",
      kickoff: `${baseDate}T14:00:00Z`,
      minute: 90,
      league: "الدوري الإيطالي",
      leagueId: "seriea",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
    {
      id: "8",
      homeTeam: "الزمالك",
      awayTeam: "الأهلي المصري",
      homeScore: 0,
      awayScore: 1,
      status: "live",
      kickoff: `${baseDate}T16:00:00Z`,
      minute: 78,
      league: "الدوري المصري",
      leagueId: "epl-eg",
      commentator: null,
      twitterVerified: false,
      homeLogoUrl: "",
      awayLogoUrl: "",
    },
  ];
}

// ─── Route handler ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const league = searchParams.get("league"); // optional filter

  // 1. Fetch matches from football API (or demo data)
  let matches = await fetchMatchesFromApi(date);

  // 2. Enrich with Twitter commentator data
  const commentators = await fetchTwitterCommentators(matches);
  for (const info of commentators) {
    const match = matches.find((m) => m.id === info.matchId);
    if (match) {
      match.commentator = info.commentator;
      match.twitterVerified = info.verified;
    }
  }

  // 3. Filter by league if requested
  if (league && league !== "all") {
    matches = matches.filter((m) => m.leagueId === league);
  }

  return NextResponse.json({ matches, date });
}
