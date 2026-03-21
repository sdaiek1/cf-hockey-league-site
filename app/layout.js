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
          background: "#020617",
          color: "white"
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(15, 23, 42, 0.94)",
            borderBottom: "1px solid #1e293b",
            backdropFilter: "blur(10px)"
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
                    padding: 6
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
                    background: "#111827",
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
                  fontWeight: 800
                }}
              >
                Admin
              </a>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
