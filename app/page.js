<section
  style={{
    ...card,
    background: "linear-gradient(135deg, #0c4a6e 0%, #082f49 42%, #020617 100%)",
    border: "1px solid #164e63",
    padding: 30,
    marginBottom: 24
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "0.8fr 1.2fr",
      gap: 24,
      alignItems: "center"
    }}
  >
    <div
      style={{
        minHeight: 260,
        borderRadius: 24,
        background:
          "radial-gradient(circle at center, rgba(34,211,238,0.14) 0%, rgba(2,6,23,0.35) 45%, rgba(2,6,23,0.75) 100%)",
        border: "1px solid #1e3a5f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxShadow: "inset 0 0 40px rgba(34,211,238,0.08)"
      }}
    >
      <img
        src="/logo.png"
        alt="Cold Fusion Summer Hockey League logo"
        style={{
          maxWidth: "100%",
          maxHeight: 240,
          objectFit: "contain",
          filter: "drop-shadow(0 0 18px rgba(34,211,238,0.18))"
        }}
      />
    </div>

    <div>
      <div
        style={{
          display: "inline-block",
          padding: "7px 12px",
          borderRadius: 999,
          background: "rgba(15,23,42,0.72)",
          color: "#7dd3fc",
          border: "1px solid #164e63",
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 14
        }}
      >
        Codey Arena • West Orange, NJ
      </div>

      <h1
        style={{
          fontSize: 56,
          lineHeight: 1.02,
          marginTop: 0,
          marginBottom: 14
        }}
      >
        Cold Fusion Summer Hockey League
      </h1>

      <p
        style={{
          fontSize: 18,
          color: "#cbd5e1",
          maxWidth: 700,
          lineHeight: 1.7,
          marginBottom: 24
        }}
      >
        Competitive adult summer hockey with league news, upcoming games,
        standings, stats, team rosters, and featured stories all in one place.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="/schedule"
          style={{
            textDecoration: "none",
            color: "#082f49",
            background: "#22d3ee",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 800
          }}
        >
          View Schedule
        </a>
        <a
          href="/news"
          style={{
            textDecoration: "none",
            color: "white",
            background: "rgba(15,23,42,0.72)",
            border: "1px solid #1e3a5f",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 700
          }}
        >
          Recent News
        </a>
      </div>
    </div>
  </div>
</section>
