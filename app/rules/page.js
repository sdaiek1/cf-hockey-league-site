export default function RulesPage() {
  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  const sectionCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 18
  };

  const rulesSections = [
    {
      title: "League Overview",
      items: [
        "Season Dates: First week of June 2026 to end of August 2026",
        "Teams: 6 teams",
        "Cost: $6,000 per team",
        "Regular Season: 14 games",
        "Top 4 teams qualify for playoffs",
        "Standings points: Win 3, Tie 2, OTL 1, Loss 0"
      ]
    },
    {
      title: "Game Format",
      items: [
        "Warm-up: 5 minutes",
        "Three 15-minute periods",
        "Overtime: 4 minutes running time, 3-on-3",
        "Shootout if still tied and time permits",
        "Same overtime/shootout format applies in playoffs"
      ]
    },
    {
      title: "Rosters & Eligibility",
      items: [
        "Roster limit: 25 players per team",
        "Roster changes allowed until July 1st",
        "*Changes to roster due to IR are an exception*",
        "Players must check in and present ID",
        "Players must sign a waiver before their first game",
        "Players must wear a jersey number matching the submitted roster",
        "Playoff eligibility requires at least 6 regular season games"
      ]
    },
    {
      title: "Gameplay & Discipline",
      items: [
        "Blue line icing",
        "Tag-up offsides",
        "Stick penalties such as high sticking and slashing are 4-minute penalties",
        "All other penalties follow USA Hockey rules",
        "Abuse of officials can result in ejection",
        "Deliberate body checking and deliberate head contact can result in suspensions"
      ]
    },
    {
      title: "Championship Prize",
      items: [
        "Championship team receives a $400 Verona Inn gift card and trophy"
      ]
    }
  ];

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Rules</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          League format, gameplay rules, player eligibility, and discipline policies.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16
          }}
        >
          {rulesSections.map((section) => (
            <div key={section.title} style={sectionCard}>
              <h2 style={{ marginTop: 0, fontSize: 24 }}>{section.title}</h2>
              <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
