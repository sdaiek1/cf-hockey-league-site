import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Cold Fusion Summer Draft Hockey League",
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
            max-width: 1480px;
            margin: 0 auto;
            padding: 12px 18px;
            display: grid;
            grid-template-columns: minmax(380px, 1fr) auto;
            align-items: center;
            gap: 18px;
          }

          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 15px;
            min-width: 0;
          }

          .site-logo {
            width: 74px;
            height: 74px;
            object-fit: contain;
            border-radius: 14px;
            background: #0b1220;
            border: 1px solid #1e293b;
            padding: 6px;
            box-shadow: 0 0 22px rgba(34,211,238,0.20);
            flex-shrink: 0;
          }

          .brand-text {
            min-width: 0;
          }

          .site-title {
            color: white;
            text-decoration: none;
            font-size: 25px;
            font-weight: 900;
            line-height: 1.02;
            display: inline-block;
            letter-spacing: -0.03em;
            max-width: 520px;
          }

          .site-meta-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 5px;
            line-height: 1.2;
          }

          .site-subtitle {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 700;
          }

          .site-disclaimer-pill {
            color: #cbd5e1;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            border: 1px solid rgba(148,163,184,0.20);
            background: rgba(15,23,42,0.72);
            border-radius: 999px;
            padding: 4px 8px;
            white-space: nowrap;
          }

          .desktop-nav {
            display: flex;
            gap: 8px;
            flex-wrap: nowrap;
            justify-content: flex-end;
            align-items: center;
            min-width: 0;
          }

          .nav-link {
            text-decoration: none;
            color: #e2e8f0;
            background: rgba(17, 24, 39, 0.82);
            border: 1px solid #1f2937;
            padding: 9px 13px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 800;
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
          }

          .nav-link-admin {
            color: #082f49;
            background: #22d3ee;
            border: 1px solid rgba(34,211,238,0.55);
            font-weight: 900;
            box-shadow: 0 0 16px rgba(34,211,238,0.28);
            padding-left: 18px;
            padding-right: 18px;
          }

          .mobile-menu {
            display: none;
            position: relative;
            flex-shrink: 0;
            justify-self: end;
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

          @media (max-width: 1240px) {
            .site-header-inner {
              grid-template-columns: 1fr auto;
            }

            .desktop-nav {
              display: none;
            }

            .mobile-menu {
              display: block;
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
              grid-template-columns: 1fr auto;
            }

            .brand-wrap {
              gap: 10px;
              min-width: 0;
            }

            .site-logo {
              width: 58px;
              height: 58px;
              border-radius: 11px;
              padding: 5px;
            }

            .site-title {
              font-size: 18px;
              line-height: 1.08;
              max-width: 230px;
            }

            .site-meta-row {
              gap: 5px;
              margin-top: 3px;
            }

            .site-subtitle {
              font-size: 11.5px;
            }

            .site-disclaimer-pill {
              font-size: 9px;
              padding: 3px 6px;
              max-width: 215px;
              overflow: hidden;
              text-overflow: ellipsis;
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
              font-size: 10.5px;
            }

            .site-disclaimer-pill {
              font-size: 8.5px;
              max-width: 185px;
            }

            .site-logo {
              width: 52px;
              height: 52px;
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

                <div className="site-meta-row">
                  <span className="site-subtitle">
                    Codey Arena • West Orange, NJ
                  </span>

                  <span className="site-disclaimer-pill">
                    Privately Run • Not Affiliated
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

        <Analytics />
      </body>
    </html>
  );
}
