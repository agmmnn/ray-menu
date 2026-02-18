import {
  type MenuItem,
  type MenuConfig,
  type Point,
  type FlipState,
  type EdgeBehavior,
  type Velocity,
  DEFAULT_CONFIG,
  angleFromCenter,
  distance,
  distributeAngles,
  getClosestItemIndex,
  detectEdgeConstraints,
  calculateSmartFlip,
  calculateVelocity,
} from "../core";

import type { NavStackEntry } from "./ray-menu-types";
export type {
  RayMenuDropDetail,
  RayMenuSubmenuDetail,
  RayMenuLoadErrorDetail,
  RayMenuEventMap,
} from "./ray-menu-types";

import { RAY_MENU_STYLES } from "./ray-menu-styles";
import {
  createMenuSvg,
  createOuterRing,
  createInnerRing,
  createArcPath,
  createLabel,
  createBackIndicator,
  renderParentLevels,
} from "./ray-menu-rendering";
import { createDriftTraceSvg, updateDriftTrace } from "./ray-menu-drift-trace";

const BaseElement =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {} as typeof HTMLElement);

export class RayMenu extends BaseElement {
  // State
  private _items: MenuItem[] = [];
  private _isOpen = false;
  private _isClosing = false;
  private _position: Point = { x: 0, y: 0 };
  private _hoveredIndex = -1;
  private _flipState: FlipState = {
    mode: "none",
    flipX: false,
    flipY: false,
    scaleX: 1,
    scaleY: 1,
    transform: "scale(1, 1)",
  };
  private _pointerPosition: Point | null = null;

  // Center area options
  private _centerTransparent = true;

  // Drift trace state
  private _showTrailPath = false;
  private _showAnchorLine = false;
  private _positionHistory: Point[] = [];
  private _timestampHistory: number[] = [];
  private _velocity: Velocity = { vx: 0, vy: 0 };
  private _driftTraceSvg: SVGSVGElement | null = null;

  // Drag/drop state
  private _isDropTarget = false;
  private _springLoadTimer: number | null = null;
  private _springLoadItemId: string | null = null;
  private _springLoadDelay = 500;

  // Submenu navigation state
  private _navStack: NavStackEntry[] = [];
  private _currentItems: MenuItem[] = [];
  private _submenuEntryConfirmed = false;
  private _backDwellTimer: number | null = null;
  private _centerSafeZone = 25;
  private _backDwellDelay = 150;
  private _backIndicatorEl: HTMLElement | null = null;
  private _backProgressRAF: number | null = null;

  // Drag-through detection config
  private _dragThroughVelocityThreshold = 200;
  private _dragThroughDistanceThreshold = 0.7;
  private _submenuRadiusStep = 60;
  private _instantDragThrough = false;

  // Keyboard navigation state
  private _focusedIndex = -1;
  private _keyboardActive = false;

  // Async loading state
  private _isLoading = false;
  private _loadingItemId: string | null = null;
  private _loadError: Error | null = null;
  private _loadingIndicatorEl: HTMLElement | null = null;

  // Scroll behavior state
  private _scrollBehavior: "close" | "keep" | "lock" | "none" = "close";
  private _scrollCloseThreshold = 10; // px
  private _initialScrollY = 0;
  private _initialScrollX = 0;
  private _documentPosition: Point = { x: 0, y: 0 }; // For 'keep' mode
  private _savedBodyOverflow = "";
  private _savedBodyPaddingRight = "";

  // Static/Dock mode state
  private _isStatic = false;
  private _defaultOpen = false;

  // Config
  private _config: MenuConfig = { ...DEFAULT_CONFIG };

  // Touch support state
  private _pointerDownPos: Point | null = null;
  private _pointerDownTime = 0;

  // Bound handlers
  private _handlePointerMove = this._onPointerMove.bind(this);
  private _handleClick = this._onClick.bind(this);
  private _handlePointerDown = this._onPointerDown.bind(this);
  private _handlePointerUp = this._onPointerUp.bind(this);
  private _handleKeyDown = this._onKeyDown.bind(this);
  private _handleDragOver = this._onDragOver.bind(this);
  private _handleScroll = this._onScroll.bind(this);

  static get observedAttributes() {
    return [
      "radius",
      "inner-radius",
      "infinite-selection",
      "center-deadzone",
      "infinite-threshold",
      "edge-behavior",
      "show-trail-path",
      "show-anchor-line",
      "center-transparent",
      "instant-drag-through",
      "scroll-behavior",
      "scroll-threshold",
      "start-angle",
      "sweep-angle",
      "static",
      "default-open",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._initStyles();
  }

  // --- Public API ---

  get items(): MenuItem[] {
    return this._items;
  }

  set items(value: MenuItem[]) {
    this._items = value;
    if (this._isOpen && !this._isClosing) this._render();
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get isDropTarget(): boolean {
    return this._isDropTarget;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  get submenuDepth(): number {
    return this._navStack.length;
  }

  open(x: number, y: number): void {
    const position = { x, y };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const edgeState = detectEdgeConstraints(
      position,
      this._config.radius,
      viewport,
    );

    if (this._config.edgeBehavior === "flip" || this._config.smartFlip) {
      this._flipState = calculateSmartFlip(
        position,
        this._config.radius,
        edgeState,
      );
    }

    if (this._config.edgeBehavior === "shift" || this._config.edgeDetection) {
      this._position = {
        x: position.x + edgeState.offset.x,
        y: position.y + edgeState.offset.y,
      };
    } else {
      this._position = position;
    }

    this._isOpen = true;
    this._hoveredIndex = -1;
    this._navStack = [];
    this._currentItems = [...this._items];
    this._submenuEntryConfirmed = true;

    // Initialize scroll tracking
    this._initialScrollX = window.scrollX;
    this._initialScrollY = window.scrollY;
    this._documentPosition = {
      x: this._position.x + this._initialScrollX,
      y: this._position.y + this._initialScrollY,
    };

    // Apply scroll behavior
    if (this._scrollBehavior === "lock") {
      this._lockScroll();
    }

    this._render();
    this._addGlobalListeners();

    this.dispatchEvent(new CustomEvent("ray-open", { detail: this._position }));
  }

  close(): void {
    // In default-open (dock) mode, just reset selection state don't actually close
    if (this._defaultOpen && this._isStatic) {
      this._hoveredIndex = -1;
      this._focusedIndex = -1;
      this._keyboardActive = false;
      this._navStack = [];
      this._currentItems = [...this._items];
      this._render();
      return;
    }

    // Animate out then clean up
    const container = this.shadowRoot?.querySelector(
      ".ray-menu-container",
    ) as HTMLElement | null;
    const cleanup = () => {
      this._isOpen = false;
      this._isClosing = false;
      this._isDropTarget = false;
      this._hoveredIndex = -1;
      this._focusedIndex = -1;
      this._keyboardActive = false;
      this._isLoading = false;
      this._loadingItemId = null;
      this._loadError = null;
      this._pointerPosition = null;
      this._positionHistory = [];
      this._timestampHistory = [];
      this._velocity = { vx: 0, vy: 0 };
      this._navStack = [];
      this._currentItems = [];
      this._clearSpringLoad();
      this._clearBackDwell();
      this._removeBackIndicator();
      this._removeLoadingIndicator();
      this._clearContainer();
      this._removeDriftTrace();
      window.removeEventListener("dragover", this._handleDragOver);

      // Restore scroll if locked
      if (this._scrollBehavior === "lock") {
        this._unlockScroll();
      }
    };

    this._removeGlobalListeners();
    this._isClosing = true;

    // Skip animation for drop target mode (drag events fire after browser animation)
    if (this._isDropTarget) {
      cleanup();
    } else if (container) {
      container.setAttribute("data-closing", "true");
      container.addEventListener("animationend", cleanup, { once: true });
      // Fallback in case animationend doesn't fire (e.g. prefers-reduced-motion)
      setTimeout(cleanup, 200);
    } else {
      cleanup();
    }

    this.dispatchEvent(new CustomEvent("ray-close"));
  }

  toggle(x: number, y: number): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open(x, y);
    }
  }

  goBack(): boolean {
    return this._exitSubmenu();
  }

  goToRoot(): void {
    while (this._navStack.length > 0) {
      this._exitSubmenu();
    }
  }

  // --- Drag & Drop API ---

  openAsDropTarget(x: number, y: number): void {
    this._isDropTarget = true;
    this.open(x, y);
    window.addEventListener("dragover", this._handleDragOver);
  }

  updateHoverFromPoint(x: number, y: number): void {
    if (!this._isOpen) return;

    this._pointerPosition = { x, y };
    this._trackVelocity();
    this._checkSubmenuEntryConfirmation();
    this._checkDragThrough();
    this._checkDragBack();

    const newIndex = this._calculateHoveredIndex(this._pointerPosition);

    if (newIndex !== this._hoveredIndex) {
      this._hoveredIndex = newIndex;
      this._updateSelectionState();
      this._handleSpringLoad();
    }
  }

  dropOnHovered(data?: unknown): MenuItem | null {
    if (
      !this._isOpen ||
      this._hoveredIndex < 0 ||
      this._hoveredIndex >= this._currentItems.length
    ) {
      this.close();
      return null;
    }

    const item = this._currentItems[this._hoveredIndex];
    if (item.disabled || item.selectable === false) {
      this.close();
      return null;
    }

    this.dispatchEvent(new CustomEvent("ray-drop", { detail: { item, data } }));
    item.onSelect?.();
    this.dispatchEvent(new CustomEvent("ray-select", { detail: item }));

    this.close();
    return item;
  }

  cancelDrop(): void {
    this._clearSpringLoad();
    this.close();
  }

  getHoveredItem(): MenuItem | null {
    if (
      this._hoveredIndex >= 0 &&
      this._hoveredIndex < this._currentItems.length
    ) {
      return this._currentItems[this._hoveredIndex];
    }
    return null;
  }

  // --- Lifecycle ---

  connectedCallback(): void {
    // Apply static mode if attribute is set
    if (this.hasAttribute("static")) {
      this._isStatic = true;
      this._updateStaticMode();
    }

    // Handle default-open attribute
    if (this.hasAttribute("default-open")) {
      this._defaultOpen = true;
      // Open at center of component or computed position
      requestAnimationFrame(() => {
        const rect = this.getBoundingClientRect();
        this.open(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    }

    this._render();
  }

  private _updateStaticMode(): void {
    if (!this.shadowRoot) return;

    const host = this.shadowRoot.host as HTMLElement;
    if (this._isStatic) {
      // Switch to relative positioning for dock mode
      host.style.position = "relative";
      host.style.width = "auto";
      host.style.height = "auto";
      host.style.top = "auto";
      host.style.left = "auto";
    } else {
      // Reset to fixed overlay mode
      host.style.position = "";
      host.style.width = "";
      host.style.height = "";
      host.style.top = "";
      host.style.left = "";
    }
  }

  disconnectedCallback(): void {
    this._removeGlobalListeners();
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ): void {
    switch (name) {
      case "radius":
        this._config.radius = Number(newValue) || DEFAULT_CONFIG.radius;
        break;
      case "inner-radius":
        this._config.innerRadius =
          Number(newValue) || DEFAULT_CONFIG.innerRadius;
        break;
      case "infinite-selection":
        this._config.infiniteSelection =
          newValue !== null && newValue !== "false";
        break;
      case "center-deadzone":
        this._config.centerDeadzone =
          Number(newValue) || DEFAULT_CONFIG.centerDeadzone;
        break;
      case "infinite-threshold":
        this._config.infiniteThreshold =
          Number(newValue) || DEFAULT_CONFIG.infiniteThreshold;
        break;
      case "edge-behavior":
        this._config.edgeBehavior =
          (newValue as EdgeBehavior) || DEFAULT_CONFIG.edgeBehavior;
        break;
      case "show-trail-path":
        this._showTrailPath = newValue !== null && newValue !== "false";
        break;
      case "show-anchor-line":
        this._showAnchorLine = newValue !== null && newValue !== "false";
        break;
      case "center-transparent":
        this._centerTransparent = newValue !== "false";
        break;
      case "instant-drag-through":
        this._instantDragThrough = newValue !== null && newValue !== "false";
        break;
      case "scroll-behavior":
        if (newValue === "keep" || newValue === "lock" || newValue === "none") {
          this._scrollBehavior = newValue;
        } else {
          this._scrollBehavior = "close";
        }
        break;
      case "scroll-threshold":
        this._scrollCloseThreshold = Number(newValue) || 10;
        break;
      case "start-angle":
        // Convert degrees to radians, default is -90 (top)
        this._config.startAngle =
          newValue !== null
            ? (Number(newValue) * Math.PI) / 180
            : DEFAULT_CONFIG.startAngle;
        break;
      case "sweep-angle":
        // Convert degrees to radians, default is 360 (full circle)
        this._config.sweepAngle =
          newValue !== null
            ? (Number(newValue) * Math.PI) / 180
            : DEFAULT_CONFIG.sweepAngle;
        break;
      case "static":
        this._isStatic = newValue !== null && newValue !== "false";
        this._updateStaticMode();
        break;
      case "default-open":
        this._defaultOpen = newValue !== null && newValue !== "false";
        break;
    }
    if (this._isOpen) this._render();
  }

  // --- Event Handlers ---

  private _onPointerMove(e: PointerEvent): void {
    if (!this._isOpen) return;

    this._pointerPosition = { x: e.clientX, y: e.clientY };
    const newIndex = this._calculateHoveredIndex(this._pointerPosition);

    // Deactivate keyboard mode when mouse moves significantly
    if (this._keyboardActive) {
      this._keyboardActive = false;
      this._focusedIndex = -1;
      this._setKeyboardActiveAttribute(false);
    }

    if (newIndex !== this._hoveredIndex) {
      this._hoveredIndex = newIndex;
      this._updateSelectionState();
    }

    const needsVelocity =
      this._showTrailPath || this._showAnchorLine || this._isDropTarget;
    if (needsVelocity) {
      this._trackVelocity();

      if (this._isDropTarget) {
        this._checkSubmenuEntryConfirmation();
        this._checkDragThrough();
        this._checkDragBack();
      }

      if (this._showTrailPath || this._showAnchorLine) {
        this._updateDriftTrace();
      }
    } else if (this._driftTraceSvg) {
      this._removeDriftTrace();
    }
  }

  private _onDragOver(e: DragEvent): void {
    if (!this._isOpen || !this._isDropTarget) return;
    this.updateHoverFromPoint(e.clientX, e.clientY);
  }

  private _onClick(e: MouseEvent): void {
    if (!this._isOpen) return;

    const dist = distance(this._position, { x: e.clientX, y: e.clientY });
    const currentInnerRadius = this._getCurrentInnerRadius();

    if (dist < currentInnerRadius) {
      if (this._navStack.length > 0) {
        this._exitSubmenu();
      } else {
        this.close();
      }
      return;
    }

    if (
      this._hoveredIndex >= 0 &&
      this._hoveredIndex < this._currentItems.length
    ) {
      const item = this._currentItems[this._hoveredIndex];
      if (!item.disabled) {
        this._selectItem(item);
      }
    } else {
      this.close();
    }
  }

  private _onPointerDown(e: PointerEvent): void {
    if (!this._isOpen || e.pointerType !== "touch") return;
    this._pointerDownPos = { x: e.clientX, y: e.clientY };
    this._pointerDownTime = Date.now();
  }

  private _onPointerUp(e: PointerEvent): void {
    if (!this._isOpen || e.pointerType !== "touch" || !this._pointerDownPos)
      return;

    const elapsed = Date.now() - this._pointerDownTime;
    const dist = distance(this._pointerDownPos, { x: e.clientX, y: e.clientY });
    this._pointerDownPos = null;

    // Treat as tap if within deadzone distance and time < 300ms
    if (dist < 20 && elapsed < 300) {
      this._onClick(e as unknown as MouseEvent);
    }
  }

  private _onScroll(): void {
    if (!this._isOpen) return;
    if (this._scrollBehavior === "none" || this._scrollBehavior === "lock")
      return;

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    if (this._scrollBehavior === "close") {
      const deltaX = Math.abs(currentScrollX - this._initialScrollX);
      const deltaY = Math.abs(currentScrollY - this._initialScrollY);

      if (
        deltaX > this._scrollCloseThreshold ||
        deltaY > this._scrollCloseThreshold
      ) {
        this.close();
      }
    } else if (this._scrollBehavior === "keep") {
      // Update menu position to stay fixed to document position
      const viewportX = this._documentPosition.x - currentScrollX;
      const viewportY = this._documentPosition.y - currentScrollY;
      this._position = { x: viewportX, y: viewportY };

      // Update container position
      if (this.shadowRoot) {
        const container = this.shadowRoot.querySelector(
          ".ray-menu-container",
        ) as HTMLElement;
        if (container) {
          container.style.left = `${this._position.x}px`;
          container.style.top = `${this._position.y}px`;
        }
      }
    }
  }

  private _lockScroll(): void {
    // Calculate scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Save current styles
    this._savedBodyOverflow = document.body.style.overflow;
    this._savedBodyPaddingRight = document.body.style.paddingRight;

    // Apply scroll lock with scrollbar compensation
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private _unlockScroll(): void {
    // Restore original styles
    document.body.style.overflow = this._savedBodyOverflow;
    document.body.style.paddingRight = this._savedBodyPaddingRight;
    this._savedBodyOverflow = "";
    this._savedBodyPaddingRight = "";
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (!this._isOpen) return;

    const itemCount = this._currentItems.length;
    if (itemCount === 0) return;

    switch (e.key) {
      case "Escape":
        this.close();
        e.preventDefault();
        break;

      case "ArrowLeft":
        this._activateKeyboardMode();
        this._moveFocus(-1);
        e.preventDefault();
        break;

      case "ArrowRight":
        this._activateKeyboardMode();
        this._moveFocus(1);
        e.preventDefault();
        break;

      case "ArrowUp":
        // Go back to parent or close
        if (this._navStack.length > 0) {
          this._exitSubmenu();
        } else {
          this.close();
        }
        e.preventDefault();
        break;

      case "ArrowDown":
      case "Enter":
      case " ":
        // Select focused item or enter submenu
        if (this._focusedIndex >= 0 && this._focusedIndex < itemCount) {
          const item = this._currentItems[this._focusedIndex];
          if (!item.disabled) {
            this._selectItem(item);
          }
        } else if (this._keyboardActive && itemCount > 0) {
          // No focus yet, focus first item
          this._focusedIndex = 0;
          this._updateSelectionState();
        } else {
          // Activate keyboard mode
          this._activateKeyboardMode();
        }
        e.preventDefault();
        break;

      case "Home":
        this._activateKeyboardMode();
        this._focusedIndex = 0;
        this._updateSelectionState();
        e.preventDefault();
        break;

      case "End":
        this._activateKeyboardMode();
        this._focusedIndex = itemCount - 1;
        this._updateSelectionState();
        e.preventDefault();
        break;

      case "Backspace":
        // Go back to parent menu
        if (this._navStack.length > 0) {
          this._exitSubmenu();
        }
        e.preventDefault();
        break;

      default:
        // Number keys 1-9 for quick select
        if (e.key >= "1" && e.key <= "9") {
          const index = parseInt(e.key, 10) - 1;
          if (index < itemCount) {
            this._activateKeyboardMode();
            this._focusedIndex = index;
            const item = this._currentItems[index];
            if (!item.disabled) {
              this._selectItem(item);
            }
          }
          e.preventDefault();
        }
        break;
    }
  }

  // --- Private Methods ---

  private _initStyles(): void {
    if (!this.shadowRoot) return;
    const style = document.createElement("style");
    style.textContent = RAY_MENU_STYLES;
    this.shadowRoot.appendChild(style);
  }

  private _addGlobalListeners(): void {
    window.addEventListener("pointermove", this._handlePointerMove);
    window.addEventListener("click", this._handleClick);
    window.addEventListener("pointerdown", this._handlePointerDown);
    window.addEventListener("pointerup", this._handlePointerUp);
    window.addEventListener("keydown", this._handleKeyDown);
    if (this._scrollBehavior === "close" || this._scrollBehavior === "keep") {
      window.addEventListener("scroll", this._handleScroll, { passive: true });
    }
  }

  private _removeGlobalListeners(): void {
    window.removeEventListener("pointermove", this._handlePointerMove);
    window.removeEventListener("click", this._handleClick);
    window.removeEventListener("pointerdown", this._handlePointerDown);
    window.removeEventListener("pointerup", this._handlePointerUp);
    window.removeEventListener("keydown", this._handleKeyDown);
    window.removeEventListener("scroll", this._handleScroll);
  }

  private _trackVelocity(): void {
    if (!this._pointerPosition) return;

    const now = Date.now();
    this._positionHistory.push({ ...this._pointerPosition });
    this._timestampHistory.push(now);

    while (this._positionHistory.length > 20) {
      this._positionHistory.shift();
      this._timestampHistory.shift();
    }

    this._velocity = calculateVelocity(
      this._positionHistory,
      this._timestampHistory,
    );
  }

  private _getCurrentRadius(): number {
    return (
      this._config.radius + this._navStack.length * this._submenuRadiusStep
    );
  }

  private _getCurrentInnerRadius(): number {
    if (this._navStack.length === 0) {
      return this._config.innerRadius;
    }
    return (
      this._config.radius +
      (this._navStack.length - 1) * this._submenuRadiusStep
    );
  }

  private _calculateHoveredIndex(pointer: Point): number {
    const dist = distance(this._position, pointer);
    const currentInnerRadius = this._getCurrentInnerRadius();
    const currentRadius = this._getCurrentRadius();

    const deadzone = this._config.infiniteSelection
      ? Math.max(this._config.centerDeadzone, currentInnerRadius)
      : currentInnerRadius;

    if (dist < deadzone) return -1;

    if (!this._config.infiniteSelection && dist > currentRadius * 1.5) {
      return -1;
    }

    if (
      this._config.infiniteSelection &&
      this._config.infiniteThreshold > 0 &&
      dist > this._config.infiniteThreshold
    ) {
      return -1;
    }

    let angle = angleFromCenter(this._position, pointer);
    angle = this._adjustAngleForFlip(angle);

    const itemAngles = distributeAngles(
      this._currentItems.length,
      this._config.startAngle,
      this._config.sweepAngle,
    );

    return getClosestItemIndex(angle, itemAngles);
  }

  private _adjustAngleForFlip(angle: number): number {
    let adjusted = angle;
    if (this._flipState.flipX) {
      adjusted = Math.PI - adjusted;
    }
    if (this._flipState.flipY) {
      adjusted = -adjusted;
    }
    return adjusted;
  }

  private _selectItem(item: MenuItem): void {
    const hasChildren = item.children && item.children.length > 0;
    const canLoadChildren = typeof item.loadChildren === "function";

    // Items with children enter submenu instead of selecting
    if (hasChildren || canLoadChildren) {
      const angle = this._pointerPosition
        ? angleFromCenter(this._position, this._pointerPosition)
        : this._config.startAngle;
      this._enterSubmenu(item, angle, true);
      return;
    }

    // Non-selectable items without children do nothing
    if (item.selectable === false) {
      return;
    }

    item.onSelect?.();
    this.dispatchEvent(new CustomEvent("ray-select", { detail: item }));
    this.close();
  }

  // --- Submenu Navigation ---

  private _clearSpringLoad(): void {
    if (this._springLoadTimer !== null) {
      window.clearTimeout(this._springLoadTimer);
      this._springLoadTimer = null;
    }
    this._springLoadItemId = null;
  }

  private async _enterSubmenu(
    item: MenuItem,
    entryAngle: number,
    confirmedEntry = false,
  ): Promise<void> {
    // Check if we need to load children
    const hasChildren = item.children && item.children.length > 0;
    const canLoadChildren = typeof item.loadChildren === "function";

    if (!hasChildren && !canLoadChildren) return;

    // If children need to be loaded
    if (!hasChildren && canLoadChildren) {
      await this._loadChildrenAsync(item, entryAngle, confirmedEntry);
      return;
    }

    // Children already exist, enter directly
    this._performSubmenuEntry(item, entryAngle, confirmedEntry);
  }

  private async _loadChildrenAsync(
    item: MenuItem,
    entryAngle: number,
    confirmedEntry: boolean,
  ): Promise<void> {
    if (!item.loadChildren) return;

    // Show loading state
    this._isLoading = true;
    this._loadingItemId = item.id;
    this._loadError = null;
    this._showLoadingIndicator(item);

    this.dispatchEvent(new CustomEvent("ray-load-start", { detail: item }));

    try {
      const children = await item.loadChildren();

      // Check if menu is still open and we're still loading this item
      if (!this._isOpen || this._loadingItemId !== item.id) {
        return;
      }

      // Cache the loaded children on the item
      item.children = children;

      this._isLoading = false;
      this._loadingItemId = null;
      this._removeLoadingIndicator();

      this.dispatchEvent(
        new CustomEvent("ray-load-complete", { detail: item }),
      );

      // Now enter the submenu with loaded children
      if (children.length > 0) {
        this._performSubmenuEntry(item, entryAngle, confirmedEntry);
      }
    } catch (error) {
      if (!this._isOpen || this._loadingItemId !== item.id) {
        return;
      }

      this._isLoading = false;
      this._loadingItemId = null;
      this._loadError =
        error instanceof Error ? error : new Error(String(error));
      this._showErrorIndicator(this._loadError);

      this.dispatchEvent(
        new CustomEvent("ray-load-error", {
          detail: { item, error: this._loadError },
        }),
      );

      // Auto-clear error after delay
      setTimeout(() => {
        if (this._loadError) {
          this._loadError = null;
          this._removeLoadingIndicator();
        }
      }, 2000);
    }
  }

  private _performSubmenuEntry(
    item: MenuItem,
    entryAngle: number,
    confirmedEntry: boolean,
  ): void {
    if (!item.children?.length) return;

    this._navStack.push({
      item,
      entryAngle,
      items: [...this._currentItems],
    });

    this._currentItems = item.children;
    this._hoveredIndex = -1;
    this._focusedIndex = this._keyboardActive ? 0 : -1;
    this._submenuEntryConfirmed = confirmedEntry;
    this._clearSpringLoad();
    this._clearBackDwell();
    this._render();

    this.dispatchEvent(
      new CustomEvent("ray-submenu-enter", {
        detail: { item, depth: this._navStack.length },
      }),
    );
  }

  private _exitSubmenu(): boolean {
    if (this._navStack.length === 0) return false;

    const entry = this._navStack.pop()!;
    this._currentItems = entry.items;
    this._hoveredIndex = -1;
    // Focus the parent item we came from when using keyboard
    this._focusedIndex = this._keyboardActive
      ? this._currentItems.findIndex((i) => i.id === entry.item.id)
      : -1;
    this._clearSpringLoad();
    this._render();

    this.dispatchEvent(
      new CustomEvent("ray-submenu-exit", {
        detail: { item: entry.item, depth: this._navStack.length },
      }),
    );
    return true;
  }

  private _checkDragThrough(): void {
    if (!this._instantDragThrough) return;
    if (!this._pointerPosition || this._hoveredIndex < 0) return;

    const item = this._currentItems[this._hoveredIndex];
    const hasChildren = item?.children && item.children.length > 0;
    const canLoadChildren = typeof item?.loadChildren === "function";

    if (!hasChildren && !canLoadChildren) return;

    const dist = distance(this._position, this._pointerPosition);
    const currentRadius = this._getCurrentRadius();

    const angle = angleFromCenter(this._position, this._pointerPosition);
    const radialVelocity =
      this._velocity.vx * Math.cos(angle) + this._velocity.vy * Math.sin(angle);

    const velocityTrigger = radialVelocity > this._dragThroughVelocityThreshold;
    const distanceTrigger =
      dist > currentRadius * this._dragThroughDistanceThreshold;

    if (velocityTrigger && distanceTrigger) {
      this._enterSubmenu(item, angle);
    }
  }

  private _checkSubmenuEntryConfirmation(): void {
    if (this._submenuEntryConfirmed || this._navStack.length === 0) return;
    if (!this._pointerPosition) return;

    const dist = distance(this._position, this._pointerPosition);
    const currentInnerRadius = this._getCurrentInnerRadius();
    const currentRadius = this._getCurrentRadius();

    if (dist >= currentInnerRadius && dist <= currentRadius * 1.2) {
      this._submenuEntryConfirmed = true;
    }
  }

  private _clearBackDwell(): void {
    if (this._backDwellTimer !== null) {
      window.clearTimeout(this._backDwellTimer);
      this._backDwellTimer = null;
    }
    if (this._backProgressRAF !== null) {
      cancelAnimationFrame(this._backProgressRAF);
      this._backProgressRAF = null;
    }
    this._updateBackIndicator(false);
  }

  private _checkDragBack(): void {
    if (!this._pointerPosition || this._navStack.length === 0) return;
    if (!this._submenuEntryConfirmed) return;

    const dist = distance(this._position, this._pointerPosition);
    const backZoneOuter = this._config.innerRadius;

    if (dist < this._centerSafeZone) {
      this._clearBackDwell();
      return;
    }

    if (dist < backZoneOuter && dist >= this._centerSafeZone) {
      this._updateBackIndicator(true);

      if (this._backDwellTimer === null) {
        this._backDwellTimer = window.setTimeout(() => {
          this._backDwellTimer = null;
          this._exitSubmenu();
        }, this._backDwellDelay);
      }
    } else {
      this._clearBackDwell();
    }
  }

  private _handleSpringLoad(): void {
    const item = this.getHoveredItem();

    if (!item || item.id !== this._springLoadItemId) {
      this._clearSpringLoad();
    }

    // Check if item has children or can load children
    const hasChildren = item?.children && item.children.length > 0;
    const canLoadChildren = typeof item?.loadChildren === "function";

    if (
      (hasChildren || canLoadChildren) &&
      item &&
      item.id !== this._springLoadItemId
    ) {
      this._springLoadItemId = item.id;
      this._springLoadTimer = window.setTimeout(() => {
        const angle = angleFromCenter(this._position, this._pointerPosition!);
        this._enterSubmenu(item, angle, true);
      }, this._springLoadDelay);
    }
  }

  // --- Back Indicator ---

  private _createBackIndicator(container: HTMLElement): void {
    if (this._navStack.length === 0) {
      this._removeBackIndicator();
      return;
    }

    const indicator = createBackIndicator(
      this._config.innerRadius,
      this._centerSafeZone,
    );
    container.appendChild(indicator);
    this._backIndicatorEl = indicator;
  }

  private _updateBackIndicator(active: boolean): void {
    if (this._backIndicatorEl) {
      this._backIndicatorEl.setAttribute("data-active", String(active));
    }
  }

  private _removeBackIndicator(): void {
    if (this._backIndicatorEl) {
      this._backIndicatorEl.remove();
      this._backIndicatorEl = null;
    }
  }

  // --- Loading Indicator ---

  private _showLoadingIndicator(item: MenuItem): void {
    this._removeLoadingIndicator();

    if (!this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(".ray-menu-container");
    if (!container) return;

    // Mark the item label as loading
    const labels = container.querySelectorAll(".ray-menu-label");
    labels.forEach((label) => {
      const index = parseInt(label.getAttribute("data-index") || "-1", 10);
      if (index >= 0 && this._currentItems[index]?.id === item.id) {
        label.setAttribute("data-loading", "true");
        // Add spinner to label
        const spinner = document.createElement("span");
        spinner.className = "ray-menu-label-spinner";
        label.appendChild(spinner);
      }
    });

    // Create center loading indicator
    const indicator = document.createElement("div");
    indicator.className = "ray-menu-loading-indicator";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-live", "polite");

    const spinner = document.createElement("div");
    spinner.className = "ray-menu-loading-spinner";

    const text = document.createElement("div");
    text.className = "ray-menu-loading-text";
    text.textContent = "Loading...";

    indicator.appendChild(spinner);
    indicator.appendChild(text);
    container.appendChild(indicator);

    this._loadingIndicatorEl = indicator;
  }

  private _showErrorIndicator(error: Error): void {
    this._removeLoadingIndicator();

    if (!this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(".ray-menu-container");
    if (!container) return;

    const indicator = document.createElement("div");
    indicator.className = "ray-menu-error-indicator";

    const icon = document.createElement("div");
    icon.className = "ray-menu-error-icon";
    icon.textContent = "⚠";

    const text = document.createElement("div");
    text.className = "ray-menu-error-text";
    text.textContent = error.message || "Failed to load";

    indicator.appendChild(icon);
    indicator.appendChild(text);
    container.appendChild(indicator);

    this._loadingIndicatorEl = indicator;
  }

  private _removeLoadingIndicator(): void {
    if (this._loadingIndicatorEl) {
      this._loadingIndicatorEl.remove();
      this._loadingIndicatorEl = null;
    }

    // Remove loading state from labels
    if (!this.shadowRoot) return;
    const labels = this.shadowRoot.querySelectorAll(
      '.ray-menu-label[data-loading="true"]',
    );
    labels.forEach((label) => {
      label.removeAttribute("data-loading");
      const spinner = label.querySelector(".ray-menu-label-spinner");
      if (spinner) spinner.remove();
    });
  }

  // --- Rendering ---

  private _clearContainer(): void {
    if (!this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(".ray-menu-container");
    if (container) {
      container.remove();
    }
  }

  private _activateKeyboardMode(): void {
    if (!this._keyboardActive) {
      this._keyboardActive = true;
      this._setKeyboardActiveAttribute(true);
      // Start focus at first item if not already set
      if (this._focusedIndex < 0) {
        this._focusedIndex = 0;
      }
      this._updateSelectionState();
    }
  }

  private _moveFocus(delta: number): void {
    const itemCount = this._currentItems.length;
    if (itemCount === 0) return;

    // Find next non-disabled item
    let newIndex = this._focusedIndex;
    let attempts = 0;

    do {
      newIndex = (newIndex + delta + itemCount) % itemCount;
      attempts++;
    } while (this._currentItems[newIndex]?.disabled && attempts < itemCount);

    if (newIndex !== this._focusedIndex) {
      this._focusedIndex = newIndex;
      this._updateSelectionState();
    }
  }

  private _setKeyboardActiveAttribute(active: boolean): void {
    if (!this.shadowRoot) return;
    const container = this.shadowRoot.querySelector(".ray-menu-container");
    if (container) {
      container.setAttribute("data-keyboard-active", String(active));
    }
  }

  private _updateSelectionState(): void {
    if (!this.shadowRoot) return;

    const arcs = this.shadowRoot.querySelectorAll(".ray-menu-arc");
    arcs.forEach((arc, index) => {
      const isHovered = index === this._hoveredIndex;
      const isFocused = index === this._focusedIndex && this._keyboardActive;
      const item = this._currentItems[index];
      const pathEl = arc as SVGPathElement;

      pathEl.setAttribute("data-hovered", String(isHovered));
      pathEl.setAttribute("data-focused", String(isFocused));
      pathEl.setAttribute("data-disabled", String(!!item?.disabled));
    });

    const labels = this.shadowRoot.querySelectorAll(".ray-menu-label");
    let activeDescendantId = "";
    labels.forEach((label, index) => {
      const isHovered = index === this._hoveredIndex;
      const isFocused = index === this._focusedIndex && this._keyboardActive;
      const isActive = isHovered || isFocused;
      label.setAttribute("data-hovered", String(isHovered));
      label.setAttribute("data-focused", String(isFocused));
      label.setAttribute("aria-current", String(isActive));
      if (isActive) {
        activeDescendantId = label.id;
      }
    });

    // Update aria-activedescendant on the container
    const container = this.shadowRoot.querySelector(".ray-menu-container");
    if (container) {
      if (activeDescendantId) {
        container.setAttribute("aria-activedescendant", activeDescendantId);
      } else {
        container.removeAttribute("aria-activedescendant");
      }
    }
  }

  private _render(): void {
    if (!this.shadowRoot) return;

    this._clearContainer();

    if (!this._isOpen || this._currentItems.length === 0) {
      return;
    }

    const radius = this._getCurrentRadius();
    const innerRadius = this._getCurrentInnerRadius();
    const itemAngles = distributeAngles(
      this._currentItems.length,
      this._config.startAngle,
      this._config.sweepAngle,
    );

    // Create container
    const container = document.createElement("div");
    container.className = "ray-menu-container";
    container.setAttribute("role", "menu");
    container.setAttribute("aria-label", "Menu");
    container.style.left = `${this._position.x}px`;
    container.style.top = `${this._position.y}px`;
    container.style.setProperty(
      "--ray-flip-transform",
      this._flipState.transform,
    );

    if (this._isDropTarget) {
      container.setAttribute("data-drop-target", "true");
    }

    if (this._keyboardActive) {
      container.setAttribute("data-keyboard-active", "true");
    }

    // Create SVG
    const svg = createMenuSvg(radius, this._isDropTarget);
    svg.appendChild(
      createOuterRing(radius, this._config.startAngle, this._config.sweepAngle),
    );
    svg.appendChild(
      createInnerRing(
        radius,
        innerRadius,
        this._centerTransparent,
        this._config.startAngle,
        this._config.sweepAngle,
      ),
    );

    // Render parent levels
    renderParentLevels(
      svg,
      this._navStack,
      this._config,
      this._submenuRadiusStep,
      radius,
    );

    // Arc segments and labels
    this._currentItems.forEach((item, index) => {
      const angle = itemAngles[index];
      const isHovered = index === this._hoveredIndex;
      const isFocused = index === this._focusedIndex && this._keyboardActive;
      const segmentAngle = this._config.sweepAngle / this._currentItems.length;
      const gap = 0.05;
      const startAngle = angle - segmentAngle / 2 + gap / 2;
      const endAngle = angle + segmentAngle / 2 - gap / 2;

      const path = createArcPath(
        radius + 20,
        radius + 20,
        innerRadius,
        radius,
        startAngle,
        endAngle,
        isHovered || isFocused,
        item.disabled || false,
        index,
      );
      svg.appendChild(path);

      const label = createLabel({
        item,
        angle,
        innerRadius,
        outerRadius: radius,
        isHovered,
        isFocused,
        isDropTarget: this._isDropTarget,
        index,
        showKeyHint: true,
      });
      container.appendChild(label);
    });

    container.appendChild(svg);
    this._createBackIndicator(container);
    this.shadowRoot.appendChild(container);
  }

  // --- Drift Trace ---

  private _removeDriftTrace(): void {
    if (this._driftTraceSvg) {
      this._driftTraceSvg.remove();
      this._driftTraceSvg = null;
    }
  }

  private _updateDriftTrace(): void {
    if (!this.shadowRoot || !this._pointerPosition) return;

    if (!this._driftTraceSvg) {
      this._driftTraceSvg = createDriftTraceSvg();
      this.shadowRoot.appendChild(this._driftTraceSvg);
    }

    updateDriftTrace(this._driftTraceSvg, {
      menuPosition: this._position,
      pointerPosition: this._pointerPosition,
      positionHistory: this._positionHistory,
      timestampHistory: this._timestampHistory,
      velocity: this._velocity,
      currentRadius: this._getCurrentRadius(),
      hoveredIndex: this._hoveredIndex,
      itemCount: this._currentItems.length,
      startAngle: this._config.startAngle,
      sweepAngle: this._config.sweepAngle,
      showTrailPath: this._showTrailPath,
      showAnchorLine: this._showAnchorLine,
    });
  }
}

// Register the custom element
if (
  typeof customElements !== "undefined" &&
  !customElements.get("ray-menu")
) {
  customElements.define("ray-menu", RayMenu);
}

// Extend HTMLElementTagNameMap for TypeScript support
declare global {
  interface HTMLElementTagNameMap {
    "ray-menu": RayMenu;
  }
}
