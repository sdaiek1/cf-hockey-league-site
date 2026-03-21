export const metadata = {
  title: "Cold Fusion Summer Hockey League",
  description: "Adult ice hockey league website"
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/news", label: "News" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
  { href: "/rosters", label: "Rosters" },
  { href: "/stats", label: "Stats" },
  { href: "/rules", label: "Rules" },
  { href: "/contact", label: "Contact" }
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          color: "white",
          minHeight: "100vh",
          backgroundColor: "#020617",
          backgroundImage: `
            radial-gradient(circle at 15% 10%, rgba(34,211,238,0.35) 0%, rgba(34,211,238,0.10) 18%, rgba(2,6,23,0) 38%),
            radial-gradient(circle at 85% 12%, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0.08) 20%, rgba(2,6,23,0) 40%),
            radial-gradient(circle at 50% 35%, rgba(6,182,212,0.12) 0%, rgba(2,6,23,0) 42%),
            linear-gradient(180deg, #0a2a43 0%, #041423 38%, #020617 100%)
          `,
          backgroundAttachment: "fixed"
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.22,
            backgroundImage: `
              linear-gradient(rgba(125,211,252,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(125,211,252,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
            zIndex: 0
          }}
        />

        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #22d3ee, #60a5fa, #22d3ee)",
            zIndex: 60
          }}
        />

        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(15, 23, 42, 0.88)",
            borderBottom: "1px solid #1e293b",
            backdropFilter: "blur(14px)"
          }}
        >
          <div
            style={{
              maxWidth: 1220,
              margin: "0 auto",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <a href="/" style={{ display: "inline-flex", alignItems: "center" }}>
                <img
                  src="/logo1.png"
                  alt="Cold Fusion Summer Hockey League logo"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    padding: 6,
                    boxShadow: "0 0 18px rgba(34,211,238,0.16)"
                  }}
                />
              </a>

              <div>
                <a
                  href="/"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontSize: 24,
                    fontWeight: 800
                  }}
                >
                  Cold Fusion Summer Hockey League
                </a>
                <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
                  Codey Arena • West Orange, NJ
                </div>
              </div>
            </div>

            <nav
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: "none",
                    color: "#e2e8f0",
                    background: "rgba(17, 24, 39, 0.82)",
                    border: "1px solid #1f2937",
                    padding: "10px 14px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700
                  }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/admin"
                style={{
                  textDecoration: "none",
                  color: "#082f49",
                  background: "#22d3ee",
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: "0 0 16px rgba(34,211,238,0.28)"
                }}
              >
                Admin
              </a>
            </nav>
          </div>
        </header>

        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
