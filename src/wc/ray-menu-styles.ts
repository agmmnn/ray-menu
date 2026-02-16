/**
 * CSS styles for the RayMenu web component
 *
 * Theming via CSS Variables
 * -------------------------
 * All visual properties can be customized using CSS variables with the `--ray-*` prefix.
 * These variables pierce the Shadow DOM, allowing external styling.
 *
 * Example:
 * ```css
 * ray-menu {
 *   --ray-bg: #1a1a2e;
 *   --ray-text: #ffffff;
 *   --ray-accent: #ff6b6b;
 * }
 * ```
 *
 * Shadcn UI Integration:
 * ```css
 * ray-menu {
 *   --ray-bg: hsl(var(--popover));
 *   --ray-text: hsl(var(--popover-foreground));
 *   --ray-accent: hsl(var(--accent));
 *   --ray-accent-text: hsl(var(--accent-foreground));
 *   --ray-border: hsl(var(--border));
 *   --ray-radius: var(--radius);
 * }
 * ```
 */
export const RAY_MENU_STYLES = `
  :host {
    /* ===== Color Tokens ===== */
    --ray-bg: rgba(30, 30, 40, 0.95);
    --ray-text: #e4e4e7;
    --ray-border: rgba(255, 255, 255, 0.15);
    --ray-accent: rgba(100, 180, 255, 0.95);
    --ray-accent-text: white;
    --ray-accent-glow: rgba(100, 180, 255, 0.4);
    --ray-muted: rgba(255, 255, 255, 0.6);
    --ray-disabled-opacity: 0.5;
    
    /* ===== Arc/Segment Colors ===== */
    --ray-arc-fill: rgba(50, 50, 60, 0.6);
    --ray-arc-fill-hover: rgba(100, 180, 255, 0.4);
    --ray-arc-stroke: rgba(255, 255, 255, 0.1);
    --ray-arc-stroke-hover: rgba(100, 180, 255, 0.7);
    --ray-ring-stroke: rgba(255, 255, 255, 0.15);
    --ray-center-fill: rgba(0, 0, 0, 0.85);
    
    /* ===== Spacing Tokens ===== */
    --ray-padding-x: 12px;
    --ray-padding-y: 6px;
    --ray-gap: 8px;
    
    /* ===== Typography Tokens ===== */
    --ray-font-family: system-ui, -apple-system, sans-serif;
    --ray-font-size: 14px;
    --ray-font-weight: 500;
    --ray-shortcut-size: 12px;
    --ray-hint-size: 11px;
    
    /* ===== Effects Tokens ===== */
    --ray-radius: 8px;
    --ray-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    --ray-shadow-hover: 0 0 20px rgba(100, 180, 255, 0.4);
    --ray-transition: 150ms ease;
    --ray-scale-hover: 1.1;
    --ray-scale-focus: 1.05;
    
    /* ===== State Colors ===== */
    --ray-error: #f87171;
    --ray-loading-track: rgba(255, 255, 255, 0.1);
    --ray-loading-spinner: rgba(100, 180, 255, 0.9);
    
    /* ===== Layout (non-customizable) ===== */
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  }

  .ray-menu-container {
    position: absolute;
    pointer-events: auto;
  }

  .ray-menu-container[data-drop-target="true"] {
    pointer-events: none;
  }

  .ray-menu-container[data-drop-target="true"]::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--ray-accent-glow) 0%, transparent 70%);
    animation: dropTargetPulse 1.5s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes dropTargetPulse {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }

  .ray-menu-svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ray-menu-arc {
    cursor: pointer;
    transition: all var(--ray-transition);
  }

  .ray-menu-arc[data-disabled="true"] {
    cursor: not-allowed;
  }

  /* ===== SVG Element Styles ===== */
  .ray-menu-outer-ring {
    fill: none;
    stroke: var(--ray-ring-stroke);
    stroke-width: 2;
    opacity: 0.5;
  }

  .ray-menu-inner-ring {
    fill: var(--ray-center-fill);
    stroke: var(--ray-arc-stroke);
    stroke-width: 1;
  }

  .ray-menu-inner-ring[data-transparent="true"] {
    fill: transparent;
  }

  .ray-menu-arc {
    fill: var(--ray-arc-fill);
    stroke: var(--ray-arc-stroke);
    stroke-width: 1;
    opacity: 0.6;
  }

  .ray-menu-arc[data-hovered="true"] {
    fill: var(--ray-arc-fill-hover);
    stroke: var(--ray-arc-stroke-hover);
    stroke-width: 2;
    opacity: 1;
    filter: url(#glow);
  }

  .ray-menu-arc[data-disabled="true"] {
    opacity: 0.3;
  }

  .ray-menu-parent-arc {
    fill: rgba(30, 30, 40, 0.3);
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 1;
    opacity: 0.5;
  }

  .ray-menu-parent-arc[data-selected="true"] {
    fill: var(--ray-accent-glow);
    stroke: var(--ray-accent);
  }

  .ray-menu-back-arrow {
    fill: var(--ray-muted);
    font-size: 14px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .ray-menu-label {
    position: absolute;
    z-index: 1;
    transform: translate(-50%, -50%);
    background: var(--ray-bg);
    color: var(--ray-text);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius);
    padding: var(--ray-padding-y) var(--ray-padding-x);
    font-size: var(--ray-font-size);
    font-weight: var(--ray-font-weight);
    font-family: var(--ray-font-family);
    white-space: nowrap;
    cursor: pointer;
    pointer-events: auto;
    transition: all var(--ray-transition);
    box-shadow: var(--ray-shadow);
    display: flex;
    align-items: center;
    gap: var(--ray-gap);
  }

  .ray-menu-label[data-hovered="true"] {
    background: var(--ray-accent);
    color: var(--ray-accent-text);
    transform: translate(-50%, -50%) scale(var(--ray-scale-hover));
    box-shadow: var(--ray-shadow-hover);
  }

  .ray-menu-label[data-focused="true"] {
    background: var(--ray-accent);
    color: var(--ray-accent-text);
    transform: translate(-50%, -50%) scale(var(--ray-scale-focus));
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), var(--ray-shadow-hover);
  }

  .ray-menu-label[data-hovered="true"][data-focused="true"] {
    transform: translate(-50%, -50%) scale(var(--ray-scale-hover));
  }

  .ray-menu-label[data-disabled="true"] {
    opacity: var(--ray-disabled-opacity);
    cursor: not-allowed;
  }

  .ray-menu-label .ray-menu-key-hint {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 18px;
    height: 18px;
    background: var(--ray-accent-text);
    color: var(--ray-bg);
    border-radius: 4px;
    font-size: var(--ray-hint-size);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--ray-transition);
  }

  .ray-menu-container[data-keyboard-active="true"] .ray-menu-label .ray-menu-key-hint {
    opacity: 1;
  }

  .ray-menu-back-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ray-menu-back-indicator .back-zone {
    position: absolute;
    border-radius: 50%;
    border: 2px dashed var(--ray-border);
    transition: all var(--ray-transition);
  }

  .ray-menu-back-indicator[data-active="true"] .back-zone {
    border-color: var(--ray-accent);
    background: var(--ray-accent-glow);
  }

  .ray-menu-back-indicator .back-progress {
    position: absolute;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: var(--ray-loading-spinner);
    animation: none;
  }

  .ray-menu-back-indicator[data-active="true"] .back-progress {
    animation: backProgressSpin 0.15s linear forwards;
  }

  @keyframes backProgressSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .ray-menu-back-indicator .back-icon {
    font-size: 16px;
    color: var(--ray-muted);
    transition: all var(--ray-transition);
  }

  .ray-menu-back-indicator[data-active="true"] .back-icon {
    color: var(--ray-accent);
    transform: scale(1.2);
  }

  .ray-menu-shortcut {
    font-size: var(--ray-shortcut-size);
    opacity: 0.6;
  }

  .ray-menu-submenu-indicator {
    font-size: var(--ray-shortcut-size);
  }

  .ray-menu-loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ray-gap);
  }

  .ray-menu-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--ray-loading-track);
    border-top-color: var(--ray-loading-spinner);
    border-radius: 50%;
    animation: loadingSpin 0.8s linear infinite;
  }

  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }

  .ray-menu-loading-text {
    font-size: var(--ray-shortcut-size);
    color: var(--ray-muted);
  }

  .ray-menu-error-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ray-gap);
    color: var(--ray-error);
  }

  .ray-menu-error-icon {
    font-size: 24px;
  }

  .ray-menu-error-text {
    font-size: var(--ray-shortcut-size);
    max-width: 150px;
    text-align: center;
  }

  .ray-menu-label[data-loading="true"] {
    opacity: var(--ray-muted);
    pointer-events: none;
  }

  .ray-menu-label .ray-menu-label-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--ray-loading-track);
    border-top-color: var(--ray-loading-spinner);
    border-radius: 50%;
    animation: loadingSpin 0.8s linear infinite;
  }
`;
