export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const EVENT_DURATION_MINUTES = 90;

function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    Pterodactyls: "/Pterodactyls_Logo.png",
    IceHoles: "/IceHoles_Logo.png",
    "Flying V": "/FlyingV_Logo.png",
    "Mad Men": "/Mad_Men_Logo.png",
  };

  return TEAM_LOGOS[teamName] || "/logo.png";
}

function parseGameDateTime(gameDate, gameTime) {
  if (!gameDate || !gameTime) return null;

  const dateParts = String(gameDate).split("-");
  if (dateParts.length !== 3) return null;

  const [year, month, day] = dateParts.map(Number);
  if (!year || !month || !day) return null;

  const rawTime = String(gameTime).trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  const twelveHourMatch = rawTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  const twentyFourHourMatch = rawTime.match(/^(\d{1,2}):(\d{2})$/);

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]);
    minutes = Number(twelveHourMatch[2] || 0);
    const meridiem = twelveHourMatch[3];

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
  } else {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
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

function isUpcomingGame(game, nowEastern) {
  if (!game.game_date) return false;

  if (game.game_date > nowEastern.dateString) return true;
  if (game.game_date < nowEastern.dateString) return false;

  return parseGameTimeToMinutes(game.game_time) >= nowEastern.minutes;
}

function formatGoogleDate(date) {
  const pad = (n) => String(n).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function buildGoogleCalendarUrl(game) {
  const start = parseGameDateTime(game.game_date, game.game_time);
  if (!start) return null;

  const end = new Date(start.getTime() + EVENT_DURATION_MINUTES * 60 * 1000);

  const homeTeam = game.home_team?.name || "Home Team";
  const awayTeam = game.away_team?.name || "Away Team";
  const rink = game.rink || "Codey Arena";

  const title = `${homeTeam} vs ${awayTeam} — Cold Fusion Hockey League`;
  const details = [
    "Cold Fusion Hockey League game",
    "",
    `${homeTeam} vs ${awayTeam}`,
    `Location: ${rink}`,
    `Status: ${game.status || "Scheduled"}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details,
    location: `${rink}, West Orange, NJ`,
    ctz: "America/New_York",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDisplayDate(gameDate) {
  if (!gameDate) return "Date TBD";

  const date = new Date(`${gameDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return gameDate;

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function SchedulePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  const selectedTeam =
    typeof resolvedSearchParams?.team === "string"
      ? resolvedSearchParams.team
      : "all";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let games = [];
  let teams = [];
  let gamesError = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [
      { data: gamesData, error: gamesFetchError },
      { data: teamsData, error: teamsFetchError },
    ] = await Promise.all([
      supabase
        .from("games")
        .select(`
          id,
          game_date,
          game_time,
          rink,
          status,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        `)
        .neq("status", "Final")
        .order("game_date", { ascending: true }),
      supabase.from("teams").select("name").order("name", { ascending: true }),
    ]);

    if (gamesFetchError) {
      gamesError = gamesFetchError.message;
    } else {
      const nowEastern = getEasternNowParts();
      games = (gamesData || []).filter((game) => isUpcomingGame(game, nowEastern));
    }

    if (!gamesError && teamsFetchError) {
      gamesError = teamsFetchError.message;
    } else {
      teams = (teamsData || []).map((team) => team.name).filter(Boolean);
    }
  } else {
    gamesError = "Missing Supabase environment variables.";
  }

  const filteredGames =
    selectedTeam === "all"
      ? games
      : games.filter(
          (game) =>
            game.home_team?.name === selectedTeam ||
            game.away_team?.name === selectedTeam
        );

  const filterLabel =
    selectedTeam === "all"
      ? "View schedule for:"
      : `Viewing: ${selectedTeam} Schedule`;

  const pageWrap = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
    padding: 24,
    color: "#ffffff",
  };

  const shell = {
    maxWidth: 1000,
    margin: "0 auto",
  };

  const card = {
    background: "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  };

  const subCard = {
    background: "linear-gradient(180deg, #111827 0%, #0b1220 100%)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: 18,
    padding: 18,
  };

  const calendarButton = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    color: "#082f49",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    padding: "11px 15px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
    minHeight: 44,
    boxShadow: "0 8px 20px rgba(34,211,238,0.18)",
  };

  const filterWrap = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 24,
  };

  const selectStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.12)",
    background: "#0b1220",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    minWidth: 220,
    minHeight: 46,
  };

  const submitButton = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(34,211,238,0.18)",
    background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%)",
    color: "#082f49",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    minHeight: 46,
  };

  return (
    <main style={pageWrap} className="schedule-page">
      <style>{`
        .schedule-card {
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .schedule-card:hover {
          transform: translateY(-1px);
          border-color: rgba(34,211,238,0.22);
        }

        .schedule-matchup-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
          margin-top: 4px;
        }

        .schedule-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          min-width: 0;
        }

        .schedule-team-logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
        }

        .schedule-team-name {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.2;
        }

        .schedule-vs {
          font-size: 18px;
          font-weight: 800;
          color: #94a3b8;
          text-align: center;
        }

        .schedule-game-meta {
          color: #cbd5e1;
          margin-top: 16px;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          line-height: 1.35;
        }

        @media (max-width: 760px) {
          .schedule-page {
            padding: 14px !important;
          }

          .schedule-shell {
            max-width: 100% !important;
          }

          .schedule-main-card {
            padding: 18px !important;
            border-radius: 20px !important;
          }

          .schedule-title {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .schedule-intro {
            font-size: 15px !important;
            margin-bottom: 18px !important;
          }

          .schedule-filter-form {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }

          .schedule-filter-form select,
          .schedule-filter-form button {
            width: 100% !important;
          }

          .schedule-card {
            padding: 16px !important;
            border-radius: 18px !important;
          }

          .schedule-date {
            font-size: 17px !important;
            line-height: 1.3 !important;
            margin-bottom: 12px !important;
          }

          .schedule-matchup-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          .schedule-vs {
            margin: 0 !important;
            font-size: 14px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
          }

          .schedule-team {
            display: grid !important;
            grid-template-columns: 56px 1fr !important;
            align-items: center !important;
            text-align: left !important;
            gap: 12px !important;
            width: 100% !important;
            background: rgba(2,6,23,0.24) !important;
            border: 1px solid rgba(34,211,238,0.08) !important;
            border-radius: 14px !important;
            padding: 10px !important;
          }

          .schedule-team-logo {
            width: 50px !important;
            height: 50px !important;
          }

          .schedule-team-name {
            font-size: 17px !important;
          }

          .schedule-game-meta {
            margin-top: 14px !important;
            font-size: 16px !important;
          }

          .schedule-calendar-link {
            width: 100% !important;
            font-size: 15px !important;
          }
        }

        @media (max-width: 420px) {
          .schedule-page {
            padding: 10px !important;
          }

          .schedule-main-card {
            padding: 14px !important;
          }

          .schedule-title {
            font-size: 26px !important;
          }

          .schedule-team-name {
            font-size: 16px !important;
          }
        }
      `}</style>

      <div style={shell} className="schedule-shell">
        <section style={card} className="schedule-main-card">
          <h1
            className="schedule-title"
            style={{
              fontSize: 38,
              marginTop: 0,
              marginBottom: 8,
              letterSpacing: "-0.03em",
            }}
          >
            Schedule
          </h1>

          <p
            className="schedule-intro"
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: 24,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Upcoming games and league schedule at Codey Arena.
          </p>

          {!gamesError && (
            <form method="GET" style={filterWrap} className="schedule-filter-form">
              <label
                htmlFor="team"
                style={{
                  color: "#cbd5e1",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {filterLabel}
              </label>

              <select
                id="team"
                name="team"
                defaultValue={selectedTeam}
                style={selectStyle}
              >
                <option value="all">All Teams</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>

              <button type="submit" style={submitButton}>
                Go
              </button>
            </form>
          )}

          {gamesError ? (
            <p style={{ color: "#fca5a5" }}>Could not load schedule: {gamesError}</p>
          ) : filteredGames.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>
              {selectedTeam === "all"
                ? "No upcoming games posted yet."
                : `No upcoming games posted yet for ${selectedTeam}.`}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredGames.map((game) => {
                const googleCalendarUrl = buildGoogleCalendarUrl(game);

                return (
                  <div key={game.id} style={subCard} className="schedule-card">
                    <div
                      className="schedule-date"
                      style={{
                        color: "#67e8f9",
                        fontSize: 20,
                        fontWeight: 800,
                        textAlign: "center",
                        marginBottom: 14,
                      }}
                    >
                      {formatDisplayDate(game.game_date)}
                    </div>

                    <div className="schedule-matchup-grid">
                      <div className="schedule-team">
                        <img
                          className="schedule-team-logo"
                          src={getTeamLogoSrc(game.home_team?.name)}
                          alt={`${game.home_team?.name || "Home team"} logo`}
                        />
                        <div className="schedule-team-name">
                          {game.home_team?.name}
                        </div>
                      </div>

                      <div className="schedule-vs">vs</div>

                      <div className="schedule-team">
                        <img
                          className="schedule-team-logo"
                          src={getTeamLogoSrc(game.away_team?.name)}
                          alt={`${game.away_team?.name || "Away team"} logo`}
                        />
                        <div className="schedule-team-name">
                          {game.away_team?.name}
                        </div>
                      </div>
                    </div>

                    <div className="schedule-game-meta">
                      {game.game_time || "TBD"} • {game.rink || "Codey Arena"} •{" "}
                      {game.status}
                    </div>

                    {googleCalendarUrl ? (
                      <div style={{ textAlign: "center" }}>
                        <a
                          className="schedule-calendar-link"
                          href={googleCalendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={calendarButton}
                        >
                          Add to Google Calendar
                        </a>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 14,
                          color: "#94a3b8",
                          fontSize: 13,
                          fontStyle: "italic",
                          textAlign: "center",
                        }}
                      >
                        Add-to-calendar button will appear once a game time is set.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
