export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    Pterodactyls: "/Pterodactyls_Logo.png",
    IceHoles: "/IceHoles_Logo.png",
    "Flying V": "/FlyingV_Logo.png",
    "Mad Men": "/Mad_Men_Logo.png",
  };

  return TEAM_LOGOS[teamName] || "/CF_Summer_Draft_League_Logo.png";
}

function getStarImageSrc(rank) {
  if (rank === 1) return "/1st_Star.png";
  if (rank === 2) return "/2nd_Star.png";
  return "/3rd_Star.png";
}

function getStarLabel(rank) {
  if (rank === 1) return "1st Star";
  if (rank === 2) return "2nd Star";
  return "3rd Star";
}

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let upcomingGames = [];
  let scoreStripGames = [];
  let standings = [];
  let recentNews = [];
  let playersOfWeek = [];

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: teams = [] } = await supabase
      .from("teams")
      .select("id, name")
      .order("name", { ascending: true });

    const { data: games = [] } = await supabase
      .from("games")
      .select(`
        id,
        game_date,
        game_time,
        rink,
        status,
        home_score,
        away_score,
        result_type,
        home_team:home_team_id(id,name),
        away_team:away_team_id(id,name)
      `)
      .order("game_date", { ascending: true });

    const { data: newsPosts = [] } = await supabase
      .from("news_posts")
      .select(`
        id,
        title,
        summary,
        created_at
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const { data: playerOfWeekRows = [] } = await supabase
      .from("player_of_week")
      .select(`
        id,
        player_name,
        team_name,
        position,
        blurb,
        image_url,
        star_rank
      `)
      .eq("is_active", true)
      .order("star_rank", { ascending: true })
      .limit(3);

    recentNews = newsPosts.slice(0, 3);

    const nowEastern = getEasternNowParts();

    const completedGames = games
      .filter((game) => isCompletedGame(game) && hasGameScore(game))
      .sort(compareGamesDesc)
      .slice(0, 5);

    const futureGames = games
      .filter((game) => !isCompletedGame(game) && isUpcomingGame(game, nowEastern))
      .sort(compareGamesAsc);

    upcomingGames = futureGames.slice(0, 3);

    scoreStripGames = [
      ...completedGames.map((game) => ({ ...game, stripType: "final" })),
      ...futureGames.slice(0, 5).map((game) => ({
        ...game,
        stripType: "upcoming",
      })),
    ].slice(0, 10);

    playersOfWeek = playerOfWeekRows || [];

    const standingsMap = {};

    for (const team of teams) {
      standingsMap[team.name] = {
        team: team.name,
        gp: 0,
        w: 0,
        l: 0,
        otl: 0,
        t: 0,
        pts: 0,
        gf: 0,
        ga: 0,
      };
    }

    for (const game of games) {
      if (
        !isCompletedGame(game) ||
        !hasGameScore(game) ||
        !game.home_team?.name ||
        !game.away_team?.name
      ) {
        continue;
      }

      const home = standingsMap[game.home_team.name];
      const away = standingsMap[game.away_team.name];
      if (!home || !away) continue;

      home.gp += 1;
      away.gp += 1;

      home.gf += Number(game.home_score || 0);
      home.ga += Number(game.away_score || 0);
      away.gf += Number(game.away_score || 0);
      away.ga += Number(game.home_score || 0);

      const homeWon = game.home_score > game.away_score;
      const awayWon = game.away_score > game.home_score;
      const tied = game.home_score === game.away_score;

      if (tied || game.result_type === "tie") {
        home.t += 1;
        away.t += 1;
        home.pts += 2;
        away.pts += 2;
        continue;
      }

      if (game.result_type === "overtime" || game.result_type === "shootout") {
        if (homeWon) {
          home.w += 1;
          home.pts += 3;
          away.otl += 1;
          away.pts += 1;
        } else if (awayWon) {
          away.w += 1;
          away.pts += 3;
          home.otl += 1;
          home.pts += 1;
        }
        continue;
      }

      if (homeWon) {
        home.w += 1;
        home.pts += 3;
        away.l += 1;
      } else if (awayWon) {
        away.w += 1;
        away.pts += 3;
        home.l += 1;
      }
    }

    standings = Object.values(standingsMap).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  }

  function getEasternNowParts() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

    const values = {};
    for (const part of parts) {
      values[part.type] = part.value;
    }

    return {
      dateString: `${values.year}-${values.month}-${values.day}`,
      minutes: Number(values.hour) * 60 + Number(values.minute),
    };
  }

  function hasGameScore(game) {
    return (
      game.home_score !== null &&
      game.home_score !== undefined &&
      game.away_score !== null &&
      game.away_score !== undefined
    );
  }

  function isCompletedGame(game) {
    return String(game.status || "").toLowerCase() === "final" || hasGameScore(game);
  }

  function parseGameTimeToMinutes(timeString = "") {
    const cleaned = String(timeString || "")
      .trim()
      .toUpperCase()
      .split("-")[0]
      .trim();

    if (!cleaned || cleaned === "TBD") return 23 * 60 + 59;

    const twelveHourMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (twelveHourMatch) {
      let hours = Number(twelveHourMatch[1]);
      const minutes = Number(twelveHourMatch[2] || 0);
      const meridiem = twelveHourMatch[3];

      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    }

    const twentyFourHourMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHourMatch) {
      return Number(twentyFourHourMatch[1]) * 60 + Number(twentyFourHourMatch[2]);
    }

    return 23 * 60 + 59;
  }

  function getGameSortValue(game) {
    const dateValue = Number(String(game.game_date || "").replaceAll("-", ""));
    return dateValue * 1440 + parseGameTimeToMinutes(game.game_time);
  }

  function compareGamesAsc(a, b) {
    return getGameSortValue(a) - getGameSortValue(b);
  }

  function compareGamesDesc(a, b) {
    return getGameSortValue(b) - getGameSortValue(a);
  }

  function isUpcomingGame(game, nowEastern) {
    if (!game.game_date) return false;

    if (game.game_date > nowEastern.dateString) return true;
    if (game.game_date < nowEastern.dateString) return false;

    return parseGameTimeToMinutes(game.game_time) >= nowEastern.minutes;
  }

  function formatGameDate(dateString) {
    if (!dateString) return "";

    const d = new Date(`${dateString}T12:00:00`);

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const displayPlayers =
    playersOfWeek.length > 0
      ? playersOfWeek
      : [
          {
            star_rank: 1,
            player_name: "Player 1",
            team_name: "Team A",
            position: "F",
            blurb: "Add player stats here.",
          },
          {
            star_rank: 2,
            player_name: "Player 2",
            team_name: "Team B",
            position: "F",
            blurb: "Add player stats here.",
          },
          {
            star_rank: 3,
            player_name: "Player 3",
            team_name: "Team C",
            position: "G",
            blurb: "Add player stats here.",
          },
        ];

  const announcements = [
    "Live Draft 8/27 @ 7pm",
  ];

  const heroRotatingImages = [
    "/CF_Summer_Draft_League_Logo.png",
    "/Pterodactyls_Logo.png",
    "/IceHoles_Logo.png",
    "/FlyingV_Logo.png",
    "/Mad_Men_Logo.png",
  ];

  const heroSlideSeconds = 4;
  const heroSlideCount = heroRotatingImages.length;
  const heroSlideDuration = heroSlideCount * heroSlideSeconds;
  const heroSlideVisiblePct = (heroSlideSeconds / heroSlideDuration) * 100;
  const heroSlideFadeInPct = heroSlideVisiblePct * 0.14;
  const heroSlideHoldPct = heroSlideVisiblePct * 0.82;
  const heroSlideFadeOutPct = heroSlideVisiblePct;

  // Slow announcement ticker.
  // Each announcement takes 28 seconds to travel across the bar.
  const announcementScrollSeconds = 28;
  const announcementStartEverySeconds = 28;

  const shell = {
    maxWidth: 1220,
    margin: "0 auto",
    padding: 24,
    color: "#ffffff",
    position: "relative",
    zIndex: 1,
  };

  const card = {
    background:
      "linear-gradient(180deg, rgba(7,16,34,0.56) 0%, rgba(4,10,24,0.68) 100%)",
    border: "1px solid rgba(34, 211, 238, 0.14)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.26)",
    backdropFilter: "blur(7px)",
  };

  const subCard = {
    background:
      "linear-gradient(180deg, rgba(6,14,30,0.78) 0%, rgba(3,8,20,0.88) 100%)",
    border: "1px solid rgba(34, 211, 238, 0.10)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const sectionTitle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8,
    letterSpacing: "-0.02em",
  };

  const sectionText = {
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6,
  };

  const heroBadgeWrap = {
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
  };

  const heroActions = {
    display: "flex",
    gap: 12,
    flexWrap: "nowrap",
    justifyContent: "center",
    alignItems: "stretch",
    marginTop: 6,
  };

  const heroButtonBase = {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 14,
    fontWeight: 800,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: 170,
    minHeight: 54,
    lineHeight: 1.08,
  };

  const heroButtonTitle = {
    fontSize: 16,
    fontWeight: 800,
  };

  const heroButtonSubtitle = {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 3,
    opacity: 0.85,
    letterSpacing: "0.01em",
  };

  const announcementBar = {
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(34,211,238,0.16)",
    background:
      "linear-gradient(90deg, rgba(6,14,30,0.88) 0%, rgba(8,37,70,0.78) 50%, rgba(6,14,30,0.88) 100%)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
  };

  const announcementLabel = {
    flexShrink: 0,
    padding: "0 14px",
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "#67e8f9",
    borderRight: "1px solid rgba(34,211,238,0.14)",
    background: "rgba(2,6,23,0.30)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  const announcementViewport = {
    position: "relative",
    overflow: "hidden",
    flex: 1,
    height: 42,
  };

  const announcementItemBase = {
    position: "absolute",
    left: "100%",
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    width: "max-content",
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: 700,
    opacity: 0,
    padding: "0 8px",
    animationName: "leagueAnnouncementScroll",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationFillMode: "both",
  };

  const announcementDot = {
    color: "#67e8f9",
    marginRight: 10,
    fontSize: 16,
    lineHeight: 1,
  };

  const scoreStripBar = {
    marginBottom: 18,
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid rgba(34,211,238,0.16)",
    background:
      "linear-gradient(90deg, rgba(3,8,20,0.90) 0%, rgba(8,30,58,0.82) 50%, rgba(3,8,20,0.90) 100%)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  };

  const scoreStripHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(34,211,238,0.12)",
  };

  const scoreStripTitle = {
    color: "#67e8f9",
    fontSize: 13,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const scoreStripLink = {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 800,
    textDecoration: "none",
  };

  const scoreStripScroller = {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    padding: 12,
    scrollbarWidth: "thin",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
  };

  const scoreGameCard = {
    width: 225,
    minWidth: 225,
    maxWidth: 225,
    flex: "0 0 225px",
    background:
      "linear-gradient(180deg, rgba(6,14,30,0.88) 0%, rgba(3,8,20,0.94) 100%)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 14,
    padding: 12,
    scrollSnapAlign: "start",
  };

  const scoreGameStatus = {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  };

  const scoreTeamLine = {
    display: "grid",
    gridTemplateColumns: "26px 1fr auto",
    alignItems: "center",
    gap: 8,
    marginTop: 7,
  };

  const scoreTeamLogo = {
    width: 24,
    height: 24,
    objectFit: "contain",
  };

  const scoreTeamName = {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const scoreNumber = {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 900,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundImage: `
          linear-gradient(rgba(2,6,23,0.38), rgba(2,6,23,0.54)),
          url("/cold-fusion-rink-bg.png")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        paddingBottom: 32,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at top left, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0) 24%),
            radial-gradient(circle at top right, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 22%),
            radial-gradient(circle at 50% 0%, rgba(14,165,233,0.04) 0%, rgba(14,165,233,0) 28%)
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.018,
          backgroundImage: `
            linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 22%, transparent 75%, rgba(255,255,255,0.04) 100%),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 1px,
              transparent 42px
            )
          `,
        }}
      />

      <div style={shell} className="home-shell">
        <style>{`
          @keyframes leagueAnnouncementScroll {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            4% {
              transform: translateX(0);
              opacity: 1;
            }
            96% {
              transform: translateX(calc(-100% - 112vw));
              opacity: 1;
            }
            100% {
              transform: translateX(calc(-100% - 112vw));
              opacity: 0;
            }
          }

          @keyframes heroLogoRotate {
            0% {
              opacity: 0;
              transform: scale(0.98);
            }
            ${heroSlideFadeInPct}% {
              opacity: 1;
              transform: scale(1);
            }
            ${heroSlideHoldPct}% {
              opacity: 1;
              transform: scale(1);
            }
            ${heroSlideFadeOutPct}% {
              opacity: 0;
              transform: scale(1.02);
            }
            100% {
              opacity: 0;
              transform: scale(1.02);
            }
          }

          .announcement-bar {
            display: flex !important;
            overflow: hidden !important;
          }

          .announcement-viewport {
            position: relative !important;
            overflow: hidden !important;
            display: block !important;
          }

          .announcement-item {
            position: absolute !important;
            left: 100% !important;
            top: 0 !important;
            bottom: 0 !important;
            display: flex !important;
            align-items: center !important;
            white-space: nowrap !important;
            width: max-content !important;
            min-width: 0 !important;
            max-width: none !important;
            flex: none !important;
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            opacity: 0;
            transform: translateX(0);
            animation-name: leagueAnnouncementScroll !important;
            animation-timing-function: linear !important;
            animation-iteration-count: infinite !important;
            animation-fill-mode: both !important;
          }

          .score-strip-scroller {
            scroll-snap-type: x mandatory;
          }

          .score-game-card {
            width: 225px !important;
            min-width: 225px !important;
            max-width: 225px !important;
            flex: 0 0 225px !important;
            scroll-snap-align: start !important;
          }

          @media (max-width: 900px) {
            .home-shell {
              padding: 14px !important;
            }

            .announcement-bar {
              min-height: 40px !important;
              border-radius: 14px !important;
              margin-bottom: 12px !important;
            }

            .announcement-label {
              flex-shrink: 0 !important;
              height: 40px !important;
              width: auto !important;
              justify-content: center !important;
              border-right: 1px solid rgba(34,211,238,0.14) !important;
              border-bottom: 0 !important;
              padding: 0 10px !important;
              font-size: 11px !important;
              letter-spacing: 0.06em !important;
            }

            .announcement-viewport {
              flex: 1 !important;
              height: 40px !important;
              padding: 0 !important;
              scroll-snap-type: none !important;
              -webkit-overflow-scrolling: auto !important;
            }

            .announcement-item {
              min-height: 40px !important;
              padding: 0 8px !important;
              line-height: 1.2 !important;
              font-size: 14px !important;
              scroll-snap-align: unset !important;
            }

            .announcement-item span:last-child {
              display: inline !important;
              white-space: nowrap !important;
            }

            .announcement-item span:first-child {
              flex-shrink: 0 !important;
              margin-top: 0 !important;
            }

            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }

            .hero-logo-box {
              min-height: 145px !important;
              padding: 12px !important;
            }

            .hero-rotating-stage {
              height: 135px !important;
            }

            .hero-rotating-image {
              max-height: 125px !important;
            }

            .hero-copy {
              text-align: center !important;
            }

            .hero-title {
              font-size: 26px !important;
              line-height: 1.05 !important;
            }

            .hero-description {
              font-size: 16px !important;
              max-width: none !important;
            }

            .hero-actions {
              flex-wrap: wrap !important;
              gap: 10px !important;
            }

            .hero-button {
              width: calc(50% - 6px) !important;
              min-width: 150px !important;
              min-height: 56px !important;
            }

            .home-main-grid {
              grid-template-columns: 1fr !important;
            }

            .players-week-card {
              padding-right: 22px !important;
            }

            .players-week-top-image {
              position: static !important;
              display: block !important;
              width: 72px !important;
              height: 72px !important;
              margin: 0 0 12px auto !important;
            }

            .players-week-row {
              min-height: 118px !important;
              padding: 16px !important;
            }

            .players-week-star {
              width: 70px !important;
              height: 70px !important;
            }

            .players-week-name {
              font-size: 24px !important;
            }

            .players-week-meta {
              font-size: 16px !important;
            }

            .players-week-blurb {
              font-size: 17px !important;
            }

            .matchup-grid {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }

            .matchup-vs {
              margin: 2px 0 !important;
            }

            .team-logo {
              width: 58px !important;
              height: 58px !important;
            }

            .hockey-truck-inner {
              flex-direction: column !important;
              align-items: flex-start !important;
            }

            .hockey-truck-image-box {
              width: 100% !important;
              max-width: 320px !important;
              height: 120px !important;
            }
          }
