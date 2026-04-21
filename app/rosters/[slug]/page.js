export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

function slugifyTeamName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePosition(position = "") {
  return String(position).trim().toLowerCase();
}

export default async function TeamRosterPage({ params }) {
  const { slug } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return <div style={{ padding: 24, color: "white" }}>Missing Supabase environment variables.</div>;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: players = [], error } = await supabase
    .from("players")
    .select(`
      id,
      player_name,
      jersey_number,
      position,
      team:team_id(id, name)
    `)
    .order("player_name", { ascending: true });

  if (error) {
    return <div style={{ padding: 24, color: "white" }}>Could not load roster: {error.message}</div>;
  }

  const teamPlayers = players.filter(
    (player) => player.team?.name && slugifyTeamName(player.team.name) === slug
  );

  if (teamPlayers.length === 0) {
    notFound();
  }

  const teamName = teamPlayers[0].team.name;

  const goalies = teamPlayers.filter((p) => {
    const pos = normalizePosition(p.position);
    return pos === "g" || pos === "goalie" || pos === "goalkeeper";
  });

  const skaters = teamPlayers.filter((p) => {
    const pos = normalizePosition(p.position);
    return !(pos === "g" || pos === "goalie" || pos === "goalkeeper");
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(3,7,18,0.98) 100%)",
        padding: 24,
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <section
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
          }}
        >
          <Link
            href="/rosters"
            style={{
              display: "inline-block",
              marginBottom: 20,
              color: "#67e8f9",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Rosters
          </Link>

          <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>{teamName}</h1>
          <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 28 }}>
            Team roster for the current season.
          </p>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, marginBottom: 14 }}>Goalies</h2>
            {goalies.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No goalies listed.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {goalies.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      background: "#111827",
                      border: "1px solid rgba(148,163,184,0.12)",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    #{player.jersey_number || "-"} — {player.player_name} ({player.position || "G"})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: 26, marginBottom: 14 }}>Skaters</h2>
            {skaters.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No skaters listed.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {skaters.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      background: "#111827",
                      border: "1px solid rgba(148,163,184,0.12)",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    #{player.jersey_number || "-"} — {player.player_name} ({player.position || "Skater"})
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
