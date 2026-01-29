/**
 * CSS styles for the RayMenu web component
 */
export const RAY_MENU_STYLES = `
  :host {
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
    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
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
    transition: all 150ms ease;
  }
  .ray-menu-arc[data-disabled="true"] {
    cursor: not-allowed;
  }
  .ray-menu-label {
    position: absolute;
    transform: translate(-50%, -50%);
    background: rgba(30, 30, 40, 0.95);
    color: #e4e4e7;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    white-space: nowrap;
    cursor: pointer;
    pointer-events: auto;
    transition: all 150ms ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ray-menu-label[data-hovered="true"] {
    background: rgba(100, 180, 255, 0.95);
    color: white;
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 0 20px rgba(100, 180, 255, 0.4);
  }
  .ray-menu-label[data-focused="true"] {
    background: rgba(100, 180, 255, 0.85);
    color: white;
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 20px rgba(100, 180, 255, 0.4);
  }
  .ray-menu-label[data-hovered="true"][data-focused="true"] {
    transform: translate(-50%, -50%) scale(1.1);
  }
  .ray-menu-label[data-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ray-menu-label .ray-menu-key-hint {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 18px;
    height: 18px;
    background: rgba(255, 255, 255, 0.9);
    color: rgba(30, 30, 40, 0.95);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 150ms ease;
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
    border: 2px dashed rgba(255, 255, 255, 0.2);
    transition: all 150ms ease;
  }
  .ray-menu-back-indicator[data-active="true"] .back-zone {
    border-color: rgba(100, 180, 255, 0.6);
    background: rgba(100, 180, 255, 0.1);
  }
  .ray-menu-back-indicator .back-progress {
    position: absolute;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: rgba(100, 180, 255, 0.9);
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
    color: rgba(255, 255, 255, 0.3);
    transition: all 150ms ease;
  }
  .ray-menu-back-indicator[data-active="true"] .back-icon {
    color: rgba(100, 180, 255, 0.9);
    transform: scale(1.2);
  }
  .ray-menu-shortcut {
    font-size: 12px;
    opacity: 0.6;
  }
  .ray-menu-submenu-indicator {
    font-size: 12px;
  }
`
