import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { MousePointer, ArrowRight, Zap, Layers, Palette, Keyboard, GitBranch, Box } from "lucide-react";
import { TheHelm, useRadialMenu } from "ray-menu/react";
import type { MenuItem } from "ray-menu/core";

export const Route = createFileRoute("/")({
  component: Home,
});

const menuItems: MenuItem[] = [
  { id: "docs", label: "Documentation", icon: "📚" },
  { id: "github", label: "GitHub", icon: "⭐" },
  { id: "examples", label: "Examples", icon: "🎯" },
  { id: "install", label: "Install", icon: "📦" },
  { id: "api", label: "API", icon: "🔧" },
  { id: "themes", label: "Themes", icon: "🎨" },
];

function HeroSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <HeroButtonWithCallback onMenuStateChange={setIsMenuOpen} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isMenuOpen ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="mt-12 text-sm text-white/30"
      >
        Click to open the radial menu
      </motion.p>
    </section>
  );
}

function HeroButtonWithCallback({ onMenuStateChange }: { onMenuStateChange: (isOpen: boolean) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const menu = useRadialMenu({
    items: menuItems,
    onSelect: (item) => {
      if (item.id === "docs") {
        window.location.href = "/docs";
      } else if (item.id === "github") {
        window.open("https://github.com/agmmnn/ray-menu", "_blank");
      }
    },
    onOpen: () => onMenuStateChange(true),
    onClose: () => onMenuStateChange(false),
  });

  const cursors = useMemo(() => {
    const result: Array<{
      id: string;
      finalX: number;
      finalY: number;
      delay: number;
      rotation: number;
      opacity: number;
      scale: number;
    }> = [];
    const circles = [120, 160, 200];
    const cursorsPerCircle = [6, 10, 14];

    circles.forEach((radius, circleIndex) => {
      const count = cursorsPerCircle[circleIndex];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const rotationOutward = Math.atan2(y, x) * (180 / Math.PI);

        result.push({
          id: `cursor-${circleIndex}-${i}`,
          finalX: x,
          finalY: y,
          delay: circleIndex * 0.02 + i * 0.01,
          rotation: rotationOutward,
          opacity: 1 - circleIndex * 0.2,
          scale: 1 - circleIndex * 0.15,
        });
      }
    });

    return result;
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      menu.open({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  const isMenuOpen = menu.state.isOpen;

  return (
    <>
      <div
        ref={buttonRef}
        className="relative cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Outer glow ring - Always visible */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
            transform: "scale(4)",
          }}
          animate={{
            opacity: isMenuOpen ? 0.8 : (isHovered ? 1 : 0.5),
            scale: isMenuOpen ? 5 : 4,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Flying Cursors - Hidden when menu is open */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            rotate: -360,
            opacity: isMenuOpen ? 0 : 1,
            scale: isMenuOpen ? 0.8 : 1,
          }}
          transition={{
            rotate: {
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            },
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
          }}
        >
          {cursors.map((cursor) => (
            <motion.div
              key={cursor.id}
              className="absolute pointer-events-none"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: cursor.finalX,
                y: cursor.finalY,
                opacity: isHovered ? cursor.opacity * 0.9 : cursor.opacity * 0.5,
                scale: cursor.scale,
              }}
              transition={{
                duration: 0.8,
                delay: cursor.delay,
                ease: [0.23, 1, 0.32, 1],
                opacity: { duration: 0.3 },
              }}
            >
              <MousePointer
                className="w-4 h-4 text-white/60"
                style={{
                  filter: isHovered
                    ? "drop-shadow(0 0 12px rgba(255,255,255,0.6))"
                    : "drop-shadow(0 0 6px rgba(255,255,255,0.3))",
                  transform: `rotate(${cursor.rotation}deg)`,
                  transition: "filter 0.3s ease",
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Button - Hidden when menu is open */}
        <motion.div
          className="relative backdrop-blur-xl bg-white/[0.08] border border-white/[0.15] px-10 py-5 rounded-full overflow-hidden"
          style={{
            boxShadow: isHovered
              ? "0 0 60px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 0 40px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          animate={{
            opacity: isMenuOpen ? 0 : 1,
            scale: isMenuOpen ? 0.9 : 1,
          }}
          whileHover={isMenuOpen ? {} : { scale: 1.02 }}
          whileTap={isMenuOpen ? {} : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent" />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-0"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
            }}
            animate={isHovered && !isMenuOpen ? {
              opacity: [0, 1, 0],
              x: ["-100%", "100%"],
            } : {}}
            transition={{
              duration: 1,
              ease: "easeInOut",
            }}
          />

          <span className="relative z-10 text-white/90 text-lg font-light tracking-wide">
            Try Ray Menu
          </span>
        </motion.div>
      </div>

      <TheHelm menu={menu} showAnchorLine />
    </>
  );
}

const features = [
  {
    icon: Zap,
    title: "Zero Dependencies",
    description: "Pure TypeScript core. Ship minimal JavaScript.",
  },
  {
    icon: Box,
    title: "Framework Agnostic",
    description: "Web Component works anywhere. React bindings included.",
  },
  {
    icon: Layers,
    title: "Infinite Selection",
    description: "Sectors extend infinitely based on angle.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description: "Full accessibility with customizable keys.",
  },
  {
    icon: GitBranch,
    title: "Nested Submenus",
    description: "Async-loaded submenus with smooth transitions.",
  },
  {
    icon: Palette,
    title: "CSS Theming",
    description: "Customize everything with CSS variables.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white overflow-hidden">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,119,198,0.15), transparent),
              radial-gradient(ellipse 60% 40% at 80% 50%, rgba(78,67,118,0.1), transparent),
              radial-gradient(ellipse 50% 30% at 20% 80%, rgba(67,78,118,0.08), transparent)
            `,
          }}
        />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-medium tracking-tight text-white/90">
            ray-menu
          </Link>
          <div className="flex items-center gap-8">
            <Link
              to="/docs/$"
              params={{ _splat: "" }}
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Docs
            </Link>
            <a
              href="https://github.com/agmmnn/ray-menu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        {/* Title Section - Fixed at top */}
        <section className="px-6 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-3">
              <span className="text-white/90">Radial menus</span>
              {" "}
              <span className="text-white/40">for the modern web</span>
            </h1>
            <p className="text-base text-white/40 max-w-lg mx-auto font-light">
              A framework-agnostic library with zero dependencies. Web Component + React bindings.
            </p>
          </motion.div>
        </section>

        {/* Demo Area - Large space for interactive button */}
        <HeroSection />

        {/* Features */}
        <section className="px-6 py-24 border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group p-8 rounded-2xl hover:bg-white/[0.02] transition-colors duration-300"
                >
                  <feature.icon className="w-5 h-5 text-white/30 mb-4 group-hover:text-white/50 transition-colors" />
                  <h3 className="text-white/80 font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 border-t border-white/[0.06]">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-light text-white/80 mb-6">Ready to get started?</h2>
              <div className="flex items-center justify-center gap-4">
                <Link
                  to="/docs/$"
                  params={{ _splat: "" }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] rounded-full text-white/80 text-sm transition-colors"
                >
                  Read the docs
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/agmmnn/ray-menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white/50 hover:text-white/70 text-sm transition-colors"
                >
                  View on GitHub
                </a>
              </div>
              <div className="mt-8">
                <code className="text-sm text-white/30 bg-white/[0.03] px-4 py-2 rounded-lg border border-white/[0.06]">
                  npm install ray-menu
                </code>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/30">
            <span>ray-menu</span>
            <span>MIT License</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
