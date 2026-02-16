import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";

const menuItems = [
  { id: "docs", label: "Docs", icon: "📚" },
  { id: "github", label: "GitHub", icon: "⭐" },
  { id: "examples", label: "Examples", icon: "🎯" },
  { id: "install", label: "Install", icon: "📦" },
  { id: "api", label: "API", icon: "🔧" },
  { id: "themes", label: "Themes", icon: "🎨" },
];

export const Route = createFileRoute("/")({
  component: Home,
});

function DemoCircle() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const circleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<any>(null);

  useEffect(() => {
    if (menuRef.current) {
      setReady(true);
      return;
    }

    import("../lib/ray-menu-client").then(({ createRayMenu }) =>
      createRayMenu()
    ).then((el) => {
      el.items = menuItems;
      el.setAttribute("show-anchor-line", "");
      document.body.appendChild(el);
      menuRef.current = el;
      setReady(true);

      el.addEventListener("ray-select", (e: Event) => {
        const item = (e as CustomEvent).detail;
        if (item.id === "docs") window.location.href = "/docs";
        else if (item.id === "github")
          window.open("https://github.com/agmmnn/ray-menu", "_blank");
      });
      el.addEventListener("ray-open", () => setIsMenuOpen(true));
      el.addEventListener("ray-close", () => setIsMenuOpen(false));
    });
  }, []);

  const handleClick = useCallback(() => {
    const rect = circleRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (rect && menu) {
      menu.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, []);

  return (
    <button
      ref={circleRef}
      onClick={handleClick}
      className="group relative"
      style={{
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "transparent",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: isMenuOpen
          ? "0 0 0 1px rgba(255,255,255,0.2)"
          : undefined,
        outline: "none",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
      }
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: 13,
          letterSpacing: "0.04em",
          fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
          transition: "opacity 0.2s",
          opacity: isMenuOpen ? 0 : 1,
        }}
      >
        click
      </span>
    </button>
  );
}

const features = [
  { title: "Zero deps", desc: "Pure TypeScript. No runtime dependencies." },
  { title: "Web Component", desc: "Works in any framework or plain HTML." },
  { title: "Infinite select", desc: "Selection by angle, not distance." },
  { title: "Keyboard nav", desc: "Arrow keys, number keys, escape." },
  { title: "Submenus", desc: "Nested menus with async loading." },
  { title: "CSS variables", desc: "Theme every visual property." },
];

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#fff",
        fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap"
      />

      {/* Nav */}
      <nav
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "24px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
          ray-menu
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          <Link
            to="/docs/$"
            params={{ _splat: "" }}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
            }}
          >
            docs
          </Link>
          <a
            href="https://github.com/agmmnn/ray-menu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              textDecoration: "none",
            }}
          >
            github
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "80px 24px 100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Radial menus for
            <br />
            the web
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.6,
              maxWidth: 380,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Framework-agnostic pie menu.
            <br />
            Web Component. Zero dependencies.
          </p>
        </div>

        <DemoCircle />

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <code
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.03)",
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            npm i ray-menu
          </code>
          <Link
            to="/docs/$"
            params={{ _splat: "" }}
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
            }
          >
            Read docs →
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Features */}
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 0,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: "24px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <footer
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
        }}
      >
        <span>ray-menu</span>
        <span>MIT</span>
      </footer>
    </div>
  );
}
