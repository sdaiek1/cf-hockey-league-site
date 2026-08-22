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
        "Season Dates: Sept 2nd to Oct 7th, Wednesday Nights 9 & 10:30pm",
        "Teams: 4 teams",
        "Teams Drafted 16 skaters 1 Goalie",
        "Regular Season: 5 games",
        "All teams qualify for playoffs",
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
        "Roster limit: 17 players per team",
        "No Roster Changes Permitted",
        "Players Do Not need to check in prior to games",
        "Players must sign a waiver before their first game",
        "Players must wear a jersey number matching the submitted roster",
        "No playoff eligibility required"
      ]
    },
    {
      title: "Gameplay & Discipline",
      items: [
        "Blue line icing",
        "Tag-up offsides",
        "Stick penalties such as high sticking and slashing are 4-minute penalties",
        "All other penalties follow USA Hockey rules",
        "Abuse of officials can result in ejection and 1 game suspension",
        "Deliberate body checking and deliberate head contact can result in suspensions"
      ]
    },
    {
      title: "Championship Prize",
      items: [
        "Championship team receives a $200 Verona Inn gift card"
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
