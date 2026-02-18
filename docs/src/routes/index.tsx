import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRayMenu } from "ray-menu/react";
import type { MenuItem } from "ray-menu/react";
import { toast, Toaster } from "sonner";
import { Copy, Check, ArrowRight, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

const menuItems: MenuItem[] = [
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

// ─── Fonts ──────────────────────────────────────────────
const font = {
  display: "'JetBrains Mono', monospace",
  mono: "'JetBrains Mono', monospace",
};

// ─── Theme-aware colors ─────────────────────────────────
function useColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme !== "light";

  return useMemo(
    () =>
      isDark
        ? {
            bg: "#06060e",
            surface: "#0c0c18",
            amber: "#e8943a",
            amberDim: "rgba(232, 148, 58, 0.12)",
            amberGlow: "rgba(232, 148, 58, 0.06)",
            amberButtonText: "#06060e",
            text: "rgba(255, 255, 255, 0.88)",
            textMuted: "rgba(255, 255, 255, 0.4)",
            textDim: "rgba(255, 255, 255, 0.2)",
            heading: "rgba(255, 255, 255, 0.92)",
            headingSub: "rgba(255, 255, 255, 0.75)",
            border: "rgba(255, 255, 255, 0.06)",
            borderHover: "rgba(255, 255, 255, 0.14)",
            circleBorder: "rgba(255, 255, 255, 0.1)",
            circleBorderHover: "rgba(255, 255, 255, 0.22)",
            circleGradient:
              "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
            circleGradientHover:
              "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            circleText: "rgba(255, 255, 255, 0.3)",
            copyIcon: "rgba(255, 255, 255, 0.25)",
            installBg: "rgba(255, 255, 255, 0.025)",
            codeBg: "rgba(255, 255, 255, 0.015)",
            codeInlineBg: "rgba(255, 255, 255, 0.04)",
            codeText: "rgba(255, 255, 255, 0.45)",
            dotFill: "rgba(255, 255, 255, 0.2)",
            grain: 0.025,
            toasterTheme: "dark" as const,
          }
        : {
            bg: "#f8f5f0",
            surface: "#f0ece6",
            amber: "#c47a20",
            amberDim: "rgba(196, 122, 32, 0.1)",
            amberGlow: "rgba(196, 122, 32, 0.05)",
            amberButtonText: "#fff",
            text: "rgba(30, 25, 18, 0.88)",
            textMuted: "rgba(30, 25, 18, 0.45)",
            textDim: "rgba(30, 25, 18, 0.25)",
            heading: "rgba(30, 25, 18, 0.92)",
            headingSub: "rgba(30, 25, 18, 0.7)",
            border: "rgba(30, 25, 18, 0.08)",
            borderHover: "rgba(30, 25, 18, 0.16)",
            circleBorder: "rgba(30, 25, 18, 0.1)",
            circleBorderHover: "rgba(30, 25, 18, 0.2)",
            circleGradient:
              "radial-gradient(circle, rgba(196,122,32,0.03) 0%, transparent 70%)",
            circleGradientHover:
              "radial-gradient(circle, rgba(196,122,32,0.06) 0%, transparent 70%)",
            circleText: "rgba(30, 25, 18, 0.3)",
            copyIcon: "rgba(30, 25, 18, 0.3)",
            installBg: "rgba(30, 25, 18, 0.03)",
            codeBg: "rgba(30, 25, 18, 0.025)",
            codeInlineBg: "rgba(30, 25, 18, 0.05)",
            codeText: "rgba(30, 25, 18, 0.5)",
            dotFill: "rgba(30, 25, 18, 0.15)",
            grain: 0.015,
            toasterTheme: "light" as const,
          },
    [isDark],
  );
}

// ─── Interactive Demo Circle ────────────────────────────
function DemoCircle({ c }: { c: ReturnType<typeof useColors> }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const circleRef = useRef<HTMLButtonElement>(null);
  const lastCloseTime = useRef(0);

  const menu = useRayMenu({
    items: menuItems,
    showAnchorLine: true,
    onSelect: (item: MenuItem) => {
      toast.success(`Selected: ${item.label}`);
      if (item.id === "docs") window.location.href = "/docs";
      else if (item.id === "github")
        window.open("https://github.com/agmmnn/ray-menu", "_blank");
      else if (item.id === "install") {
        navigator.clipboard.writeText("npm i ray-menu");
        toast.success("Copied to clipboard!");
      }
    },
    onOpen: () => setIsMenuOpen(true),
    onClose: () => {
      setIsMenuOpen(false);
      lastCloseTime.current = Date.now();
    },
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (Date.now() - lastCloseTime.current < 100) return;
      const rect = circleRef.current?.getBoundingClientRect();
      if (rect) {
        menu.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    [menu],
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
        <button
          ref={circleRef}
          onClick={handleClick}
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            border: `1px solid ${isMenuOpen ? c.amber : c.circleBorder}`,
            background: isMenuOpen ? c.amberDim : c.circleGradient,
            cursor: "pointer",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            outline: "none",
            position: "relative",
            boxShadow: isMenuOpen
              ? `0 0 40px ${c.amberDim}, inset 0 0 30px ${c.amberGlow}`
              : "none",
          }}
          onMouseEnter={(e) => {
            if (!isMenuOpen) {
              e.currentTarget.style.borderColor = c.circleBorderHover;
              e.currentTarget.style.background = c.circleGradientHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isMenuOpen) {
              e.currentTarget.style.borderColor = c.circleBorder;
              e.currentTarget.style.background = c.circleGradient;
            }
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: font.mono,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isMenuOpen ? c.amber : c.circleText,
              transition: "all 0.3s ease",
              opacity: isMenuOpen ? 0 : 1,
            }}
          >
            click
          </span>
        </button>
    </div>
  );
}

// ─── Copy Button ────────────────────────────────────────
function CopyButton({
  text,
  c,
}: {
  text: string;
  c: ReturnType<typeof useColors>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: copied ? c.amber : c.copyIcon,
        transition: "color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = c.amber)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = copied ? c.amber : c.copyIcon)
      }
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ─── Features ───────────────────────────────────────────
const features = [
  {
    title: "Zero dependencies",
    desc: "Pure TypeScript core. Nothing extra ships with your bundle.",
    icon: "◇",
  },
  {
    title: "Web Component",
    desc: "Works everywhere — React, Vue, Svelte, or plain HTML.",
    icon: "⬡",
  },
  {
    title: "Infinite selection",
    desc: "Items selected by angle, not distance. Move as far as you want.",
    icon: "∞",
  },
  {
    title: "Keyboard navigation",
    desc: "Arrow keys, number keys, escape. Fully accessible.",
    icon: "⌨",
  },
  {
    title: "Nested submenus",
    desc: "Drill into child menus with support for async loading.",
    icon: "◎",
  },
  {
    title: "CSS theming",
    desc: "Every visual property exposed as a CSS variable.",
    icon: "◑",
  },
];

// ─── Code Example ───────────────────────────────────────
const codeExample = `<ray-menu id="menu"></ray-menu>

<script type="module">
  import "ray-menu";

  const menu = document.querySelector("#menu");
  menu.items = [
    { id: "cut",   label: "Cut",   icon: "✂️" },
    { id: "copy",  label: "Copy",  icon: "📋" },
    { id: "paste", label: "Paste", icon: "📌" },
  ];

  addEventListener("contextmenu", (e) => {
    e.preventDefault();
    menu.open(e.clientX, e.clientY);
  });
</script>`;

// ─── Animated Section Wrapper ───────────────────────────
function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Theme Toggle ───────────────────────────────────────
function ThemeToggle({ c }: { c: ReturnType<typeof useColors> }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme !== "light";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: c.textMuted,
        transition: "color 0.2s",
        position: "relative",
        width: 20,
        height: 20,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
      onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
    >
      <Sun
        size={14}
        style={{
          position: "absolute",
          transition: "transform 0.2s, opacity 0.2s",
          transform: isDark ? "rotate(-90deg) scale(0)" : "rotate(0) scale(1)",
          opacity: isDark ? 0 : 1,
        }}
      />
      <Moon
        size={14}
        style={{
          position: "absolute",
          transition: "transform 0.2s, opacity 0.2s",
          transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0)",
          opacity: isDark ? 1 : 0,
        }}
      />
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────
function Home() {
  const c = useColors();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: font.mono,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <Toaster position="bottom-center" theme={c.toasterTheme} />

      {/* Background radial glow */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "60vh",
          background: `radial-gradient(ellipse at center, ${c.amberGlow} 0%, transparent 60%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: c.grain,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ── Nav ──────────────────────────────────── */}
        <Reveal>
          <nav
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "28px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: font.display,
                fontSize: 16,
                fontWeight: 600,
                color: c.heading,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img src="/logo.svg" alt="" width={20} height={20} />
              ray-menu
            </span>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <Link
                to="/docs/$"
                params={{ _splat: "" }}
                style={{
                  fontSize: 12,
                  color: c.textMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = c.textMuted)
                }
              >
                docs
              </Link>
              <Link
                to="/playground"
                style={{
                  fontSize: 12,
                  color: c.textMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = c.textMuted)
                }
              >
                playground
              </Link>
              <a
                href="https://github.com/agmmnn/ray-menu"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: c.textMuted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = c.textMuted)
                }
              >
                github
              </a>
              <ThemeToggle c={c} />
            </div>
          </nav>
        </Reveal>

        {/* ── Hero ─────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "60px 28px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Reveal delay={0.1}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 14px",
                borderRadius: 100,
                border: `1px solid ${c.amberDim}`,
                background: c.amberGlow,
                fontSize: 11,
                color: c.amber,
                fontFamily: font.mono,
                letterSpacing: "0.04em",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: c.amber,
                  opacity: 0.7,
                }}
              />
              v0.1.2
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <h1
              style={{
                fontFamily: font.display,
                fontSize: "clamp(38px, 6vw, 64px)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                color: c.heading,
                margin: 0,
                textAlign: "center",
              }}
            >
              Radial menus
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${c.amber}, #f4c87a)`,
                }}
              >
                for the web
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p
              style={{
                fontSize: 13,
                color: c.textMuted,
                lineHeight: 1.7,
                maxWidth: 340,
                textAlign: "center",
                margin: 0,
              }}
            >
              A framework-agnostic pie menu built as a
              <br />
              Web Component. Zero dependencies.
            </p>
          </Reveal>

          {/* Demo */}
          <Reveal delay={0.3}>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <DemoCircle c={c} />
            </div>
          </Reveal>

          {/* CTA row */}
          <Reveal delay={0.4}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: c.installBg,
                  padding: "7px 8px 7px 16px",
                  borderRadius: 8,
                  border: `1px solid ${c.border}`,
                }}
              >
                <code
                  style={{
                    fontSize: 12,
                    color: c.textMuted,
                    fontFamily: font.mono,
                  }}
                >
                  npm i ray-menu
                </code>
                <CopyButton text="npm i ray-menu" c={c} />
              </div>
              <Link
                to="/docs/$"
                params={{ _splat: "" }}
                style={{
                  fontSize: 12,
                  fontFamily: font.mono,
                  color: c.amberButtonText,
                  textDecoration: "none",
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: c.amber,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "opacity 0.2s",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Get started
                <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── Features ─────────────────────────────── */}
        <Reveal delay={0.5}>
          <section
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "80px 28px 60px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 1,
                background: c.border,
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${c.border}`,
              }}
            >
              {features.map((f) => (
                <div
                  key={f.title}
                  style={{
                    padding: "28px 24px",
                    background: c.bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        color: c.amber,
                        opacity: 0.7,
                        width: 20,
                        textAlign: "center",
                      }}
                    >
                      {f.icon}
                    </span>
                    <h3
                      style={{
                        fontFamily: font.display,
                        fontSize: 14,
                        fontWeight: 600,
                        color: c.headingSub,
                        margin: 0,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {f.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: c.textDim,
                      margin: 0,
                      lineHeight: 1.6,
                      paddingLeft: 30,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ── Code Example ─────────────────────────── */}
        <Reveal delay={0.55}>
          <section
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "20px 28px 80px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: font.display,
                    fontSize: "clamp(24px, 3vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: c.heading,
                    margin: 0,
                    marginBottom: 16,
                    lineHeight: 1.15,
                  }}
                >
                  Drop-in
                  <br />
                  simplicity
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: c.textMuted,
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 320,
                  }}
                >
                  Import the Web Component, set your items, and open on any
                  event. No build step required — works with a{" "}
                  <code
                    style={{
                      fontSize: 12,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: c.codeInlineBg,
                      color: c.amber,
                    }}
                  >
                    {"<script>"}
                  </code>{" "}
                  tag.
                </p>
                <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
                  <Link
                    to="/docs/$"
                    params={{ _splat: "web-component" }}
                    style={{
                      fontSize: 12,
                      fontFamily: font.mono,
                      color: c.amber,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.7")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Web Component docs
                    <ArrowRight size={12} />
                  </Link>
                  <Link
                    to="/docs/$"
                    params={{ _splat: "react" }}
                    style={{
                      fontSize: 12,
                      fontFamily: font.mono,
                      color: c.textMuted,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = c.textMuted)
                    }
                  >
                    React docs
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <div
                style={{
                  background: c.codeBg,
                  borderRadius: 12,
                  border: `1px solid ${c.border}`,
                  padding: "20px 22px",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 16,
                    opacity: 0.3,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dotFill,
                    }}
                  />
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dotFill,
                    }}
                  />
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dotFill,
                    }}
                  />
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: font.mono,
                    fontSize: 11.5,
                    lineHeight: 1.7,
                    color: c.codeText,
                    whiteSpace: "pre",
                    overflowX: "auto",
                  }}
                >
                  <code>{codeExample}</code>
                </pre>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Footer ───────────────────────────────── */}
        <footer
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "0 28px",
          }}
        >
          <div
            style={{
              height: 1,
              background: c.border,
            }}
          />
          <div
            style={{
              padding: "20px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              color: c.textDim,
            }}
          >
            <span
              style={{ fontFamily: font.display, letterSpacing: "-0.01em" }}
            >
              ray-menu
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              <a
                href="https://github.com/agmmnn/ray-menu"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: c.textDim,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = c.textMuted)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = c.textDim)
                }
              >
                GitHub
              </a>
              <span>MIT</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
