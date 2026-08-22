export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TEAM LOGOS
========================================================= */

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    Pterodactyls: "/Pterodactyls_Logo.png",
    IceHoles: "/IceHoles_Logo.png",
    "Flying V": "/FlyingV_Logo.png",
    "Mad Men": "/Mad_Men_Logo.png",
  };

  return TEAM_LOGOS[teamName] || "/CF_Summer_Draft_League_Logo.png";
}

/* =========================================================
   PLAYERS OF THE WEEK
========================================================= */

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

/* =========================================================
   MAIN PAGE
========================================================= */

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let upcomingGames = [];
  let scoreStripGames = [];
  let standings = [];
  let recentNews = [];
  let playersOfWeek = [];

  /* =========================================================
     SUPABASE
  ========================================================= */

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
      .filter(
        (game) =>
          !isCompletedGame(game) &&
          isUpcomingGame(game, nowEastern)
      )
      .sort(compareGamesAsc);

    upcomingGames = futureGames.slice(0, 3);

    scoreStripGames = [
      ...completedGames.map((game) => ({
        ...game,
        stripType: "final",
      })),

      ...futureGames.slice(0, 5).map((game) => ({
        ...game,
        stripType: "upcoming",
      })),
    ].slice(0, 10);

    playersOfWeek = playerOfWeekRows || [];

    /* =========================================================
       STANDINGS
    ========================================================= */

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

      if (
        game.result_type === "overtime" ||
        game.result_type === "shootout"
      ) {
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

  /* =========================================================
     DATE / TIME HELPERS
  ========================================================= */

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
      minutes:
        Number(values.hour) * 60 +
        Number(values.minute),
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
    return (
      String(game.status || "").toLowerCase() === "final" ||
      hasGameScore(game)
    );
  }

  function parseGameTimeToMinutes(timeString = "") {
    const cleaned = String(timeString || "")
      .trim()
      .toUpperCase()
      .split("-")[0]
      .trim();

    if (!cleaned || cleaned === "TBD") {
      return 23 * 60 + 59;
    }

    const twelveHourMatch = cleaned.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/
    );

    if (twelveHourMatch) {
      let hours = Number(twelveHourMatch[1]);
      const minutes = Number(
        twelveHourMatch[2] || 0
      );

      const meridiem = twelveHourMatch[3];

      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      }

      if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    }

    const twentyFourHourMatch = cleaned.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (twentyFourHourMatch) {
      return (
        Number(twentyFourHourMatch[1]) * 60 +
        Number(twentyFourHourMatch[2])
      );
    }

    return 23 * 60 + 59;
  }

  function getGameSortValue(game) {
    const dateValue = Number(
      String(game.game_date || "").replaceAll("-", "")
    );

    return (
      dateValue * 1440 +
      parseGameTimeToMinutes(game.game_time)
    );
  }

  function compareGamesAsc(a, b) {
    return (
      getGameSortValue(a) -
      getGameSortValue(b)
    );
  }

  function compareGamesDesc(a, b) {
    return (
      getGameSortValue(b) -
      getGameSortValue(a)
    );
  }

  function isUpcomingGame(game, nowEastern) {
    if (!game.game_date) return false;

    if (game.game_date > nowEastern.dateString) {
      return true;
    }

    if (game.game_date < nowEastern.dateString) {
      return false;
    }

    return (
      parseGameTimeToMinutes(game.game_time) >=
      nowEastern.minutes
    );
  }

  function formatGameDate(dateString) {
    if (!dateString) return "";

    const d = new Date(
      `${dateString}T12:00:00`
    );

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  /* =========================================================
     FALLBACK PLAYERS OF WEEK
  ========================================================= */

  const displayPlayers =
    playersOfWeek.length > 0
      ? playersOfWeek
      : [
          {
            star_rank: 1,
            player_name: "Player 1",
            team_name: "Team",
            position: "F",
            blurb: "Add player stats here.",
          },
          {
            star_rank: 2,
            player_name: "Player 2",
            team_name: "Team",
            position: "F",
            blurb: "Add player stats here.",
          },
          {
            star_rank: 3,
            player_name: "Player 3",
            team_name: "Team",
            position: "G",
            blurb: "Add player stats here.",
          },
        ];

  /* =========================================================
     ANNOUNCEMENTS

     ADD NEW ANNOUNCEMENTS HERE
  ========================================================= */

  const announcements = [
    "Live Draft 8/27 @ 7:00 PM",
  ];

  /* =========================================================
     ROTATING HERO LOGOS
  ========================================================= */

  const heroRotatingImages = [
    "/CF_Summer_Draft_League_Logo.png",
    "/Pterodactyls_Logo.png",
    "/IceHoles_Logo.png",
    "/FlyingV_Logo.png",
    "/Mad_Men_Logo.png",
  ];

  /* =========================================================
     REUSABLE STYLES
  ========================================================= */

  const card = {
    background:
      "linear-gradient(180deg, rgba(7,16,34,0.60), rgba(4,10,24,0.78))",

    border:
      "1px solid rgba(34,211,238,0.14)",

    borderRadius: 22,

    padding: 22,

    boxShadow:
      "0 18px 45px rgba(0,0,0,0.26)",

    backdropFilter: "blur(7px)",
  };

  const subCard = {
    background:
      "linear-gradient(180deg, rgba(6,14,30,0.78), rgba(3,8,20,0.90))",

    border:
      "1px solid rgba(34,211,238,0.10)",

    borderRadius: 18,

    padding: 16,
  };

  const sectionTitle = {
    fontSize: 28,
    marginTop: 0,
    marginBottom: 8,
  };

  const sectionText = {
    color: "#94a3b8",
    marginTop: 0,
    marginBottom: 18,
    lineHeight: 1.6,
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="page">
      {/* =====================================================
          GLOBAL PAGE CSS
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .page {
          min-height: 100vh;

          padding-bottom: 40px;

          color: #ffffff;

          background-image:
            linear-gradient(
              rgba(2,6,23,0.42),
              rgba(2,6,23,0.62)
            ),
            url("/cold-fusion-rink-bg.png");

          background-size: cover;

          background-position: center;

          background-attachment: fixed;
        }

        .shell {
          width: 100%;

          max-width: 1220px;

          margin: 0 auto;

          padding: 24px;
        }

        /* ===============================================
           ANNOUNCEMENT TICKER
        =============================================== */

        .announcement-bar {
          height: 44px;

          display: flex;

          align-items: center;

          overflow: hidden;

          margin-bottom: 16px;

          border-radius: 16px;

          border:
            1px solid rgba(34,211,238,0.18);

          background:
            linear-gradient(
              90deg,
              rgba(6,14,30,0.95),
              rgba(8,37,70,0.90),
              rgba(6,14,30,0.95)
            );
        }

        .announcement-label {
          height: 100%;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 0 16px;

          flex-shrink: 0;

          color: #67e8f9;

          font-size: 12px;

          font-weight: 900;

          text-transform: uppercase;

          letter-spacing: 0.06em;

          border-right:
            1px solid rgba(34,211,238,0.18);
        }

        .announcement-window {
          position: relative;

          height: 100%;

          flex: 1;

          overflow: hidden;
        }

        .announcement-item {
          position: absolute;

          top: 0;

          left: 100%;

          height: 100%;

          display: flex;

          align-items: center;

          width: max-content;

          white-space: nowrap;

          color: #e2e8f0;

          font-size: 15px;

          font-weight: 700;

          animation:
            announcementScroll 25s linear infinite;
        }

        @keyframes announcementScroll {

          0% {
            transform: translateX(0);
          }

          100% {
            transform:
              translateX(calc(-100% - 100vw));
          }

        }

        /* ===============================================
           SCORE STRIP
        =============================================== */

        .score-strip {
          margin-bottom: 20px;

          overflow: hidden;

          border-radius: 18px;

          border:
            1px solid rgba(34,211,238,0.16);

          background:
            rgba(3,8,20,0.90);
        }

        .score-strip-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          padding: 10px 14px;

          border-bottom:
            1px solid rgba(34,211,238,0.12);
        }

        .score-strip-title {
          color: #67e8f9;

          font-size: 13px;

          font-weight: 900;

          text-transform: uppercase;

          letter-spacing: 0.07em;
        }

        .score-strip-link {
          color: #cbd5e1;

          font-size: 13px;

          font-weight: 800;

          text-decoration: none;
        }

        .score-strip-games {
          display: flex;

          gap: 10px;

          padding: 12px;

          overflow-x: auto;
        }

        .score-game {
          min-width: 225px;

          padding: 12px;

          border-radius: 14px;

          background:
            rgba(6,14,30,0.92);

          border:
            1px solid rgba(34,211,238,0.10);
        }

        .score-status {
          color: #94a3b8;

          font-size: 11px;

          font-weight: 800;

          text-transform: uppercase;

          margin-bottom: 8px;
        }

        .score-team {
          display: grid;

          grid-template-columns:
            26px 1fr auto;

          gap: 8px;

          align-items: center;

          margin-top: 7px;
        }

        .score-team img {
          width: 24px;

          height: 24px;

          object-fit: contain;
        }

        .score-team-name {
          font-size: 14px;

          font-weight: 800;
        }

        .score-number {
          font-size: 18px;

          font-weight: 900;
        }

        /* ===============================================
           HERO
        =============================================== */

        .hero {
          ${Object.entries(card)
            .map(
              ([key, value]) =>
                `${key.replace(
                  /[A-Z]/g,
                  (m) => `-${m.toLowerCase()}`
                )}:${value};`
            )
            .join("")}

          margin-bottom: 22px;

          padding: 16px;
        }

        .hero-grid {
          display: grid;

          grid-template-columns:
            0.8fr 1.2fr;

          gap: 22px;

          align-items: center;
        }

        .hero-logo-box {
          min-height: 190px;

          display: flex;

          align-items: center;

          justify-content: center;

          position: relative;

          overflow: hidden;

          border-radius: 20px;

          background:
            radial-gradient(
              circle,
              rgba(34,211,238,0.15),
              rgba(2,6,23,0.85)
            );
        }

        .hero-logo {
          position: absolute;

          width: 90%;

          height: 160px;

          object-fit: contain;

          opacity: 0;

          animation:
            heroRotate 20s linear infinite;
        }

        .hero-logo:nth-child(1) {
          animation-delay: 0s;
        }

        .hero-logo:nth-child(2) {
          animation-delay: 4s;
        }

        .hero-logo:nth-child(3) {
          animation-delay: 8s;
        }

        .hero-logo:nth-child(4) {
          animation-delay: 12s;
        }

        .hero-logo:nth-child(5) {
          animation-delay: 16s;
        }

        @keyframes heroRotate {

          0% {
            opacity: 0;
            transform: scale(.96);
          }

          4% {
            opacity: 1;
            transform: scale(1);
          }

          18% {
            opacity: 1;
            transform: scale(1);
          }

          20% {
            opacity: 0;
            transform: scale(1.03);
          }

          100% {
            opacity: 0;
          }

        }

        .hero-copy {
          text-align: center;
        }

        .hero-title {
          margin:
            8px 0 10px;

          font-size: 30px;

          line-height: 1.05;
        }

        .hero-description {
          max-width: 650px;

          margin:
            0 auto 16px;

          color: #dbe7f3;

          font-size: 16px;

          line-height: 1.5;
        }

        .hero-contact {
          display: inline-block;

          padding: 7px 16px;

          margin-bottom: 8px;

          border-radius: 999px;

          background:
            rgba(8,20,42,0.70);

          border:
            1px solid rgba(34,211,238,0.14);

          color: #7dd3fc;

          font-size: 13px;

          font-weight: 800;
        }

        .hero-buttons {
          display: flex;

          justify-content: center;

          flex-wrap: wrap;

          gap: 10px;
        }

        .hero-button {
          display: inline-flex;

          flex-direction: column;

          justify-content: center;

          align-items: center;

          min-width: 160px;

          min-height: 52px;

          padding: 9px 14px;

          border-radius: 14px;

          text-decoration: none;

          font-weight: 800;
        }

        .hero-button-primary {
          color: #082f49;

          background:
            linear-gradient(
              #67e8f9,
              #22d3ee
            );
        }

        .hero-button-secondary {
          color: #ffffff;

          background:
            rgba(8,20,42,0.75);

          border:
            1px solid rgba(34,211,238,0.15);
        }

        .button-subtitle {
          margin-top: 3px;

          font-size: 10px;

          opacity: .8;
        }

        /* ===============================================
           MAIN GRID
        =============================================== */

        .main-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 20px;

          align-items: start;
        }

        .column {
          display: grid;

          gap: 20px;
        }

        .section-card {
          border-radius: 22px;

          padding: 22px;

          background:
            linear-gradient(
              rgba(7,16,34,0.68),
              rgba(4,10,24,0.82)
            );

          border:
            1px solid rgba(34,211,238,0.14);
        }

        .section-title {
          margin: 0 0 8px;

          font-size: 28px;
        }

        .section-text {
          margin:
            0 0 18px;

          color: #94a3b8;

          line-height: 1.6;
        }

        /* ===============================================
           UPCOMING GAMES
        =============================================== */

        .upcoming-list {
          display: grid;

          gap: 12px;
        }

        .game-card {
          padding: 16px;

          border-radius: 18px;

          background:
            rgba(3,8,20,0.78);

          border:
            1px solid rgba(34,211,238,0.10);
        }

        .game-date {
          margin-bottom: 14px;

          color: #67e8f9;

          font-size: 19px;

          font-weight: 900;

          text-align: center;
        }

        .matchup {
          display: grid;

          grid-template-columns:
            1fr auto 1fr;

          align-items: center;

          gap: 14px;
        }

        .matchup-team {
          display: flex;

          flex-direction: column;

          align-items: center;

          gap: 8px;

          text-align: center;

          font-size: 18px;

          font-weight: 800;
        }

        .matchup-team img {
          width: 70px;

          height: 70px;

          object-fit: contain;
        }

        .versus {
          color: #94a3b8;

          font-weight: 900;
        }

        .game-details {
          margin-top: 14px;

          color: #cbd5e1;

          text-align: center;

          font-size: 17px;

          font-weight: 700;
        }

        /* ===============================================
           REMINDERS
        =============================================== */

        .reminders {
          display: grid;

          gap: 12px;
        }

        .reminder {
          display: flex;

          gap: 14px;

          align-items: flex-start;

          padding: 16px;

          border-radius: 16px;

          background:
            rgba(3,8,20,0.72);
        }

        .reminder-number {
          width: 34px;

          height: 34px;

          flex-shrink: 0;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 999px;

          color: #67e8f9;

          background:
            rgba(34,211,238,0.14);

          font-weight: 900;
        }

        .reminder-text {
          color: #e5e7eb;

          font-size: 17px;

          font-weight: 600;

          line-height: 1.5;
        }

        /* ===============================================
           STANDINGS
        =============================================== */

        .standings-table {
          width: 100%;

          border-collapse: collapse;
        }

        .standings-table th {
          color: #94a3b8;

          text-align: left;

          padding-bottom: 10px;
        }

        .standings-table td {
          padding:
            10px 4px;

          border-top:
            1px solid rgba(51,65,85,0.35);
        }

        .standings-table td:last-child {
          color: #67e8f9;

          font-weight: 900;
        }

        /* ===============================================
           PLAYERS OF WEEK
        =============================================== */

        .player-row {
          display: flex;

          gap: 16px;

          align-items: center;

          padding: 16px;

          margin-top: 12px;

          border-radius: 16px;

          background:
            rgba(3,8,20,0.75);
        }

        .player-star {
          width: 72px;

          height: 72px;

          object-fit: contain;

          flex-shrink: 0;
        }

        .player-rank {
          color: #67e8f9;

          font-size: 12px;

          font-weight: 900;

          text-transform: uppercase;
        }

        .player-name {
          margin-top: 3px;

          font-size: 23px;

          font-weight: 900;
        }

        .player-meta {
          margin-top: 4px;

          color: #67e8f9;

          font-weight: 700;
        }

        .player-blurb {
          margin-top: 7px;

          color: #e5e7eb;

          line-height: 1.45;
        }

        /* ===============================================
           HOCKEY TRUCK
        =============================================== */

        .truck-section {
          margin-top: 20px;
        }

        .truck-inner {
          display: flex;

          gap: 24px;

          align-items: center;

          padding: 18px;

          border-radius: 18px;

          background:
            rgba(3,8,20,0.75);
        }

        .truck-image {
          width: 290px;

          height: 140px;

          object-fit: contain;

          background: #000;

          border-radius: 16px;

          padding: 10px;
        }

        .truck-name {
          margin-bottom: 10px;

          font-size: 28px;

          font-weight: 900;
        }

        .truck-info {
          color: #e2e8f0;

          line-height: 1.9;
        }

        .truck-info a {
          color: #67e8f9;

          text-decoration: none;
        }

        /* ===============================================
           NEWS
        =============================================== */

        .news-section {
          margin-top: 20px;
        }

        .news-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(260px,1fr)
            );

          gap: 16px;
        }

        .news-card {
          padding: 16px;

          border-radius: 16px;

          background:
            rgba(3,8,20,0.75);
        }

        .news-title {
          font-size: 21px;

          font-weight: 900;

          line-height: 1.25;
        }

        .news-date {
          margin-top: 7px;

          color: #67e8f9;
        }

        .news-summary {
          margin-top: 10px;

          color: #e2e8f0;

          line-height: 1.6;
        }

        .section-link {
          display: inline-block;

          margin-top: 16px;

          color: #67e8f9;

          font-weight: 900;

          text-decoration: none;
        }

        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 850px) {

          .shell {
            padding: 14px;
          }

          .main-grid {
            grid-template-columns: 1fr;
          }

          .hero-grid {
            grid-template-columns: 1fr;
          }

          .hero-logo-box {
            min-height: 160px;
          }

          .matchup-team img {
            width: 60px;

            height: 60px;
          }

          .truck-inner {
            flex-direction: column;

            align-items: flex-start;
          }

          .truck-image {
            width: 100%;

            max-width: 320px;
          }

        }

        @media (max-width: 520px) {

          .shell {
            padding: 10px;
          }

          .announcement-label {
            max-width: 105px;

            padding: 0 8px;

            font-size: 9px;

            text-align: center;
          }

          .announcement-item {
            font-size: 13px;
          }

          .hero-title {
            font-size: 24px;
          }

          .hero-button {
            width: 100%;
          }

          .section-card {
            padding: 16px;
          }

          .section-title {
            font-size: 24px;
          }

          .matchup {
            grid-template-columns:
              1fr auto 1fr;

            gap: 8px;
          }

          .matchup-team {
            font-size: 15px;
          }

          .matchup-team img {
            width: 52px;

            height: 52px;
          }

          .player-row {
            align-items: flex-start;
          }

          .player-star {
            width: 58px;

            height: 58px;
          }

          .player-name {
            font-size: 20px;
          }

          .score-game {
            min-width: 78vw;
          }

        }

      `}</style>

      <div className="shell">

        {/* =================================================
            LEAGUE ANNOUNCEMENTS
        ================================================== */}

        <div className="announcement-bar">

          <div className="announcement-label">
            League Announcements
          </div>

          <div className="announcement-window">

            {announcements.map(
              (announcement, index) => (

                <div
                  key={index}

                  className="announcement-item"

                  style={{
                    animationDelay:
                      `${index * 25}s`,
                  }}
                >

                  <span
                    style={{
                      color: "#67e8f9",
                      marginRight: 10,
                    }}
                  >
                    •
                  </span>

                  {announcement}

                </div>

              )
            )}

          </div>

        </div>

        {/* =================================================
            RECENT SCORES / UPCOMING STRIP
        ================================================== */}

        <div className="score-strip">

          <div className="score-strip-header">

            <div className="score-strip-title">
              Recent Scores & Upcoming Games
            </div>

            <a
              href="/schedule"
              className="score-strip-link"
            >
              Full Schedule →
            </a>

          </div>

          {scoreStripGames.length === 0 ? (

            <div
              style={{
                padding: 14,
                color: "#cbd5e1",
              }}
            >
              No recent or upcoming games posted yet.
            </div>

          ) : (

            <div className="score-strip-games">

              {scoreStripGames.map((game) => {

                const isFinal =
                  game.stripType === "final";

                return (

                  <div
                    className="score-game"
                    key={`${game.stripType}-${game.id}`}
                  >

                    <div className="score-status">

                      {isFinal
                        ? "Final"
                        : `${formatGameDate(
                            game.game_date
                          )} • ${
                            game.game_time ||
                            "TBD"
                          }`
                      }

                    </div>

                    <div className="score-team">

                      <img
                        src={getTeamLogoSrc(
                          game.away_team?.name
                        )}
                        alt=""
                      />

                      <div className="score-team-name">
                        {game.away_team?.name}
                      </div>

                      <div className="score-number">
                        {isFinal
                          ? game.away_score
                          : ""}
                      </div>

                    </div>

                    <div className="score-team">

                      <img
                        src={getTeamLogoSrc(
                          game.home_team?.name
                        )}
                        alt=""
                      />

                      <div className="score-team-name">
                        {game.home_team?.name}
                      </div>

                      <div className="score-number">
                        {isFinal
                          ? game.home_score
                          : ""}
                      </div>

                    </div>

                    {!isFinal && (

                      <div
                        style={{
                          marginTop: 10,
                          color: "#67e8f9",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {game.rink ||
                          "Codey Arena"}
                      </div>

                    )}

                  </div>

                );

              })}

            </div>

          )}

        </div>

        {/* =================================================
            HERO
        ================================================== */}

        <section className="hero">

          <div className="hero-grid">

            <div className="hero-logo-box">

              {heroRotatingImages.map(
                (src, index) => (

                  <img
                    key={src}
                    src={src}
                    className="hero-logo"
                    alt="Cold Fusion Draft League logo"
                  />

                )
              )}

            </div>

            <div className="hero-copy">

              <div className="hero-contact">
                For more info, contact: Shane - cfhockeyleague@gmail.com
              </div>

              <h1 className="hero-title">
                Cold Fusion Summer Draft League
              </h1>

              <p className="hero-description">
                Competitive adult hockey featuring four
                drafted teams, league standings, stats,
                schedules, news and weekly highlights.
              </p>

              <div className="hero-buttons">

                <a
                  href="/schedule"
                  className="
                    hero-button
                    hero-button-primary
                  "
                >
                  View Schedule

                  <span className="button-subtitle">
                    League games and times
                  </span>
                </a>

                <a
                  href="/cf-waiver-2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    hero-button
                    hero-button-primary
                  "
                >
                  Printable Waiver

                  <span className="button-subtitle">
                    Download PDF Form
                  </span>
                </a>

                <a
                  href="/news"
                  className="
                    hero-button
                    hero-button-secondary
                  "
                >
                  Recent News

                  <span className="button-subtitle">
                    Game recaps and updates
                  </span>
                </a>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            TWO COLUMN CONTENT
        ================================================== */}

        <div className="main-grid">

          {/* LEFT COLUMN */}

          <div className="column">

            {/* UPCOMING GAMES */}

            <section className="section-card">

              <h2 className="section-title">
                Upcoming Games
              </h2>

              <p className="section-text">
                The next games on the league calendar.
              </p>

              {upcomingGames.length === 0 ? (

                <p style={{ color: "#cbd5e1" }}>
                  No upcoming games posted yet.
                </p>

              ) : (

                <div className="upcoming-list">

                  {upcomingGames.map((game) => (

                    <div
                      className="game-card"
                      key={game.id}
                    >

                      <div className="game-date">
                        {formatGameDate(
                          game.game_date
                        )}
                      </div>

                      <div className="matchup">

                        <div className="matchup-team">

                          <img
                            src={getTeamLogoSrc(
                              game.home_team?.name
                            )}
                            alt=""
                          />

                          <div>
                            {game.home_team?.name}
                          </div>

                        </div>

                        <div className="versus">
                          vs
                        </div>

                        <div className="matchup-team">

                          <img
                            src={getTeamLogoSrc(
                              game.away_team?.name
                            )}
                            alt=""
                          />

                          <div>
                            {game.away_team?.name}
                          </div>

                        </div>

                      </div>

                      <div className="game-details">

                        {game.game_time || "TBD"}

                        {" • "}

                        {game.rink ||
                          "Codey Arena"}

                        {" • "}

                        {game.status}

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </section>

            {/* LEAGUE REMINDERS */}

            <section className="section-card">

              <h2 className="section-title">
                League Reminders
              </h2>

              <p className="section-text">
                Important reminders for all players
                before and during game night.
              </p>

              <div className="reminders">

                <div className="reminder">

                  <div className="reminder-number">
                    1
                  </div>

                  <div className="reminder-text">
                    Remember, this isnt the pros.
                    Chill out, play some hockey,
                    and dont be an A-Hole.
                  </div>

                </div>

                <div className="reminder">

                  <div className="reminder-number">
                    2
                  </div>

                  <div className="reminder-text">
                    Players MUST check-in upon arrival.
                  </div>

                </div>

                <div className="reminder">

                  <div className="reminder-number">
                    3
                  </div>

                  <div className="reminder-text">
                    All players should have a jersey
                    number matching the number listed
                    on the roster.
                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* RIGHT COLUMN */}

          <div className="column">

            {/* STANDINGS */}

            <section className="section-card">

              <h2 className="section-title">
                Standings
              </h2>

              <p className="section-text">
                Current standings for all teams.
              </p>

              {standings.length === 0 ? (

                <p style={{ color: "#cbd5e1" }}>
                  No standings yet.
                </p>

              ) : (

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >

                  <table className="standings-table">

                    <thead>

                      <tr>

                        <th>Team</th>

                        <th>GP</th>

                        <th>W</th>

                        <th>L</th>

                        <th>OTL</th>

                        <th>T</th>

                        <th>PTS</th>

                      </tr>

                    </thead>

                    <tbody>

                      {standings.map((row) => (

                        <tr key={row.team}>

                          <td
                            style={{
                              fontWeight: 800,
                            }}
                          >
                            {row.team}
                          </td>

                          <td>
                            {row.gp}
                          </td>

                          <td>
                            {row.w}
                          </td>

                          <td>
                            {row.l}
                          </td>

                          <td>
                            {row.otl}
                          </td>

                          <td>
                            {row.t}
                          </td>

                          <td>
                            {row.pts}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

              <a
                href="/standings"
                className="section-link"
              >
                Full standings →
              </a>

            </section>

            {/* PLAYERS OF THE WEEK */}

            <section className="section-card">

              <h2 className="section-title">
                Players of the Week
              </h2>

              <p className="section-text">
                1st Star, 2nd Star, and 3rd Star
                from around the league.
              </p>

              {displayPlayers.map(
                (player, index) => {

                  const rank =
                    player.star_rank ||
                    index + 1;

                  return (

                    <div
                      key={
                        player.id ||
                        `player-${index}`
                      }
                      className="player-row"
                    >

                      <img
                        className="player-star"
                        src={getStarImageSrc(rank)}
                        alt={getStarLabel(rank)}
                      />

                      <div>

                        <div className="player-rank">
                          {getStarLabel(rank)}
                        </div>

                        <div className="player-name">
                          {player.player_name}
                        </div>

                        <div className="player-meta">

                          {player.team_name ||
                            "Team"}

                          {" • "}

                          {player.position ||
                            "Position"}

                        </div>

                        <div className="player-blurb">
                          {player.blurb}
                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </section>

          </div>

        </div>

        {/* =================================================
            HOCKEY TRUCK
        ================================================== */}

        <section
          className="
            section-card
            truck-section
          "
        >

          <h2 className="section-title">
            The Hockey Truck
          </h2>

          <p className="section-text">
            Providing ice hockey pro-shop services
            like skate sharpening and the sale of
            accessories on the go.
          </p>

          <div className="truck-inner">

            <img
              src="/hockeytruck.png"
              alt="The Hockey Truck"
              className="truck-image"
            />

            <div>

              <div className="truck-name">
                The Hockey Truck LLC.
              </div>

              <div className="truck-info">

                <strong>Phone:</strong>{" "}

                <a href="tel:9736464273">
                  973-646-4273
                </a>

                <br />

                <strong>Email:</strong>{" "}

                <a
                  href="
                    mailto:thehockeytruck@gmail.com
                  "
                >
                  thehockeytruck@gmail.com
                </a>

                <br />

                <strong>Instagram:</strong>{" "}

                <a
                  href="
                    https://www.instagram.com/thehockeytruck
                  "
                  target="_blank"
                  rel="noreferrer"
                >
                  thehockeytruck
                </a>

                <br />

                <strong>Website:</strong>{" "}

                <a
                  href="
                    https://www.thehockeytruck.com
                  "
                  target="_blank"
                  rel="noreferrer"
                >
                  www.thehockeytruck.com
                </a>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RECENT NEWS
        ================================================== */}

        <section
          className="
            section-card
            news-section
          "
        >

          <h2 className="section-title">
            Recent News
          </h2>

          <p className="section-text">
            Latest game summaries and league stories.
          </p>

          {recentNews.length === 0 ? (

            <p style={{ color: "#cbd5e1" }}>
              No news posted yet.
            </p>

          ) : (

            <div className="news-grid">

              {recentNews.map((post) => (

                <div
                  key={post.id}
                  className="news-card"
                >

                  <div className="news-title">
                    {post.title}
                  </div>

                  <div className="news-date">

                    {new Date(
                      post.created_at
                    ).toLocaleDateString()}

                  </div>

                  <div className="news-summary">
                    {post.summary}
                  </div>

                </div>

              ))}

            </div>

          )}

          <a
            href="/news"
            className="section-link"
          >
            View all news →
          </a>

        </section>

      </div>

    </main>
  );
}
