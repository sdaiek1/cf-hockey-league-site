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
            radial-gradient(circle at top left, rgba(34,211,238,0.14) 0%, rgba(2,6,23,0) 28%),
            radial-gradient(circle at top right, rgba(59,130,246,0.10) 0%, rgba(2,6,23,0) 30%),
            radial-gradient(circle at center, rgba(14,116,144,0.08) 0%, rgba(2,6,23,0) 45%),
            linear-gradient(180deg, #031525 0%, #020617 55%, #01040d 100%)
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
              linear-gradient(rgba(125,211,252,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(125,211,252,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 85%)"
          }}
        />

        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(15, 23, 42, 0.84)",
            borderBottom: "1px solid rgba(30, 41, 59, 0.9)",
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
                    background: "rgba(17, 24, 39, 0.75)",
                    border: "1px solid #1f2937",
                    padding: "10px 14px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
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
                  boxShadow: "0 0 16px rgba(34,211,238,0.24)"
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
