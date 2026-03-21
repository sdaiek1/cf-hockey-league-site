export default function ContactPage() {
  const card = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: 20
  };

  const subCard = {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 18
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: 20 }}>
      <section style={card}>
        <h1 style={{ fontSize: 40, marginTop: 0, marginBottom: 10 }}>Contact</h1>
        <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
          League questions, registration inquiries, and admin access.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16
          }}
        >
          <div style={subCard}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>League Contact</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
              Shane Daiek
            </div>
          </div>

          <div style={subCard}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Email</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>
              shane.daiek@gmail.com
            </div>
          </div>

          <div style={subCard}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Home Rink</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>
              Codey Arena
            </div>
            <div style={{ color: "#cbd5e1", marginTop: 6 }}>
              West Orange, New Jersey
            </div>
          </div>

          <div style={subCard}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Admin</div>
            <a
              href="/admin"
              style={{
                display: "inline-block",
                marginTop: 8,
                color: "#67e8f9",
                fontWeight: 800,
                textDecoration: "none"
              }}
            >
              Open admin dashboard
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
