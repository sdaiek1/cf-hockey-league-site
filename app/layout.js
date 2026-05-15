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
        <style>{`
          * {
            box-sizing: border-box;
          }

          html {
            -webkit-text-size-adjust: 100%;
          }

          body {
            overflow-x: hidden;
          }

          button,
          input,
          select,
          textarea {
            font-family: inherit;
          }

          a,
          button,
          summary {
            -webkit-tap-highlight-color: transparent;
          }

          .site-header-inner {
            max-width: 1220px;
            margin: 0 auto;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }

          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }

          .site-logo {
            width: 64px;
            height: 64px;
            object-fit: contain;
            border-radius: 12px;
            background: #0b1220;
            border: 1px solid #1e293b;
            padding: 6px;
            box-shadow: 0 0 18px rgba(34,211,238,0.16);
            flex-shrink: 0;
          }

          .brand-text {
            min-width: 0;
          }

          .site-title {
            color: white;
            text-decoration: none;
            font-size: 24px;
            font-weight: 800;
            line-height: 1.08;
            display: inline-block;
          }

          .site-subtitle {
            color: #94a3b8;
            font-size: 14px;
            margin-top: 4px;
            line-height: 1.35;
          }

          .site-disclaimer {
            color: #cbd5e1;
            font-style: italic;
          }

          .desktop-nav {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
            align-items: center;
          }

          .nav-link {
            text-decoration: none;
            color: #e2e8f0;
            background: rgba(17, 24, 39, 0.82);
            border: 1px solid #1f2937;
            padding: 10px 14px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 700;
            min-height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .nav-link-admin {
            color: #082f49;
            background: #22d3ee;
            border: 1px solid rgba(34,211,238,0.55);
            font-weight: 800;
            box-shadow: 0 0 16px rgba(34,211,238,0.28);
          }

          .mobile-menu {
            display: none;
            position: relative;
            flex-shrink: 0;
          }

          .mobile-menu summary {
            list-style: none;
            cursor: pointer;
            user-select: none;
          }

          .mobile-menu summary::-webkit-details-marker {
            display: none;
          }

          .mobile-menu-button {
            min-height: 44px;
            min-width: 44px;
            padding: 10px 13px;
            border-radius: 14px;
            border: 1px solid rgba(34,211,238,0.26);
            background: rgba(8,20,42,0.92);
            color: #e2e8f0;
            font-size: 22px;
            font-weight: 900;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 14px rgba(34,211,238,0.10);
          }

          .mobile-menu-panel {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: min(84vw, 320px);
            padding: 12px;
            border-radius: 18px;
            background: rgba(2, 6, 23, 0.98);
            border: 1px solid rgba(34,211,238,0.18);
            box-shadow: 0 24px 50px rgba(0,0,0,0.40);
            display: grid;
            gap: 8px;
          }

          .mobile-nav-link {
            text-decoration: none;
            color: #e2e8f0;
            background: rgba(17, 24, 39, 0.88);
            border: 1px solid #1f2937;
            padding: 13px 14px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 800;
            min-height: 46px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .mobile-nav-link::after {
            content: "›";
            color: #67e8f9;
            font-size: 22px;
            line-height: 1;
          }

          .mobile-admin-link {
            color: #082f49;
            background: #22d3ee;
            border-color: rgba(34,211,238,0.65);
          }

          .mobile-admin-link::after {
            color: #082f49;
          }

          @media (max-width: 980px) {
            .desktop-nav {
              display: none;
            }

            .mobile-menu {
              display: block;
            }

            .site-header-inner {
              flex-wrap: nowrap;
            }
          }

          @media (max-width: 768px) {
            body {
              background-attachment: scroll !important;
            }
          }

          @media (max-width: 640px) {
            .site-header-inner {
              padding: 10px 12px;
              gap: 10px;
            }

            .brand-wrap {
              gap: 10px;
              flex: 1;
              min-width: 0;
            }

            .site-logo {
              width: 50px;
              height: 50px;
              border-radius: 10px;
              padding: 5px;
            }

            .site-title {
              font-size: 18px;
              line-height: 1.08;
              max-width: 230px;
            }

            .site-subtitle {
              font-size: 11.5px;
              margin-top: 3px;
              max-width: 250px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            .mobile-menu-button {
              min-width: 44px;
              min-height: 44px;
              padding: 8px 12px;
            }

            .mobile-menu-panel {
              top: calc(100% + 8px);
              right: 0;
              width: min(88vw, 310px);
            }
          }

          @media (max-width: 390px) {
            .site-title {
              font-size: 16px;
              max-width: 185px;
            }

            .site-subtitle {
              max-width: 205px;
              font-size: 10.5px;
            }

            .site-logo {
              width: 46px;
              height: 46px;
            }
          }
        `}</style>

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
          <div className="site-header-inner">
            <div className="brand-wrap">
              <a href="/" style={{ display: "inline-flex", alignItems: "center" }}>
                <img
                  className="site-logo"
                  src="/logo1.png"
                  alt="Cold Fusion Summer Hockey League logo"
                />
              </a>

              <div className="brand-text">
                <a href="/" className="site-title">
                  Cold Fusion Summer Hockey League
                </a>

                <div className="site-subtitle">
                  Codey Arena • West Orange, NJ •{" "}
                  <span className="site-disclaimer">
                    *No Affiliation
                  </span>
                </div>
              </div>
            </div>

            <nav className="desktop-nav" aria-label="Main navigation">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </a>
              ))}

              <a href="/admin" className="nav-link nav-link-admin">
                Admin
              </a>
            </nav>

            <details className="mobile-menu">
              <summary aria-label="Open navigation menu">
                <span className="mobile-menu-button">☰</span>
              </summary>

              <nav className="mobile-menu-panel" aria-label="Mobile navigation">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="mobile-nav-link">
                    {link.label}
                  </a>
                ))}

                <a href="/admin" className="mobile-nav-link mobile-admin-link">
                  Admin
                </a>
              </nav>
            </details>
          </div>
        </header>

        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
