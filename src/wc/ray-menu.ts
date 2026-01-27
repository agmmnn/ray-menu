import {
  type MenuItem,
  type MenuConfig,
  type Point,
  type FlipState,
  type EdgeBehavior,
  type Velocity,
  type TracePoint,
  DEFAULT_CONFIG,
  angleFromCenter,
  distance,
  distributeAngles,
  getClosestItemIndex,
  detectEdgeConstraints,
  calculateSmartFlip,
  toCartesian,
  calculateVelocity,
  generateTraceTrail,
} from '../core'

export interface RayMenuDropDetail {
  item: MenuItem
  data?: unknown
}

export interface RayMenuEventMap {
  'ray-select': CustomEvent<MenuItem>
  'ray-drop': CustomEvent<RayMenuDropDetail>
  'ray-spring-load': CustomEvent<MenuItem>
  'ray-open': CustomEvent<Point>
  'ray-close': CustomEvent<void>
}

export class RayMenu extends HTMLElement {
  // State
  private _items: MenuItem[] = []
  private _isOpen = false
  private _position: Point = { x: 0, y: 0 }
  private _hoveredIndex = -1
  private _flipState: FlipState = {
    mode: 'none',
    flipX: false,
    flipY: false,
    scaleX: 1,
    scaleY: 1,
    transform: 'scale(1, 1)',
  }
  private _pointerPosition: Point | null = null

  // Drift trace state
  private _showTrailPath = false
  private _showAnchorLine = false
  private _positionHistory: Point[] = []
  private _timestampHistory: number[] = []
  private _velocity: Velocity = { vx: 0, vy: 0 }
  private _driftTraceSvg: SVGSVGElement | null = null

  // Drag/drop state
  private _isDropTarget = false
  private _springLoadTimer: number | null = null
  private _springLoadItemId: string | null = null
  private _springLoadDelay = 500


  // Config
  private _config: MenuConfig = { ...DEFAULT_CONFIG }

  // Bound handlers
  private _handlePointerMove = this._onPointerMove.bind(this)
  private _handleClick = this._onClick.bind(this)
  private _handleKeyDown = this._onKeyDown.bind(this)
  private _handleDragOver = this._onDragOver.bind(this)

  static get observedAttributes() {
    return [
      'radius',
      'inner-radius',
      'infinite-selection',
      'center-deadzone',
      'infinite-threshold',
      'edge-behavior',
      'show-trail-path',
      'show-anchor-line',
    ]
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._initStyles()
  }

  // --- Public API ---

  get items(): MenuItem[] {
    return this._items
  }

  set items(value: MenuItem[]) {
    this._items = value
    if (this._isOpen) this._render()
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  get isDropTarget(): boolean {
    return this._isDropTarget
  }

  open(x: number, y: number): void {
    const position = { x, y }
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const edgeState = detectEdgeConstraints(position, this._config.radius, viewport)

    // Calculate flip state
    if (this._config.edgeBehavior === 'flip' || this._config.smartFlip) {
      this._flipState = calculateSmartFlip(position, this._config.radius, edgeState)
    }

    // Adjust position based on edge behavior
    if (this._config.edgeBehavior === 'shift' || this._config.edgeDetection) {
      this._position = {
        x: position.x + edgeState.offset.x,
        y: position.y + edgeState.offset.y,
      }
    } else {
      this._position = position
    }

    this._isOpen = true
    this._hoveredIndex = -1
    this._render()
    this._addGlobalListeners()

    this.dispatchEvent(new CustomEvent('ray-open', { detail: this._position }))
  }

  close(): void {
    this._isOpen = false
    this._isDropTarget = false
    this._hoveredIndex = -1
    this._pointerPosition = null
    this._positionHistory = []
    this._timestampHistory = []
    this._velocity = { vx: 0, vy: 0 }
    this._clearSpringLoad()
    this._clearContainer()
    this._removeDriftTrace()
    this._removeGlobalListeners()
    window.removeEventListener('dragover', this._handleDragOver)

    this.dispatchEvent(new CustomEvent('ray-close'))
  }

  toggle(x: number, y: number): void {
    if (this._isOpen) {
      this.close()
    } else {
      this.open(x, y)
    }
  }

  // --- Drag & Drop API ---

  /**
   * Open the menu as a drop target at the specified position.
   * Use this when a drag operation starts and the menu should appear.
   */
  openAsDropTarget(x: number, y: number): void {
    this._isDropTarget = true
    this.open(x, y)
    // Add global dragover listener to track cursor even over menu elements
    window.addEventListener('dragover', this._handleDragOver)
  }

  /**
   * Update hover selection from external coordinates.
   * Call this from your drag library's move handler.
   * @param x - Client X coordinate
   * @param y - Client Y coordinate
   */
  updateHoverFromPoint(x: number, y: number): void {
    if (!this._isOpen) return

    this._pointerPosition = { x, y }
    const newIndex = this._calculateHoveredIndex(this._pointerPosition)

    if (newIndex !== this._hoveredIndex) {
      this._hoveredIndex = newIndex
      this._updateHoverState()
      this._handleSpringLoad()
    }
  }

  /**
   * Trigger a drop on the currently hovered item.
   * Call this from your drag library's drop/end handler.
   * @param data - Optional data payload from the drag operation
   * @returns The selected item, or null if no valid selection
   */
  dropOnHovered(data?: unknown): MenuItem | null {
    if (!this._isOpen || this._hoveredIndex < 0 || this._hoveredIndex >= this._items.length) {
      this.close()
      return null
    }

    const item = this._items[this._hoveredIndex]
    if (item.disabled) {
      this.close()
      return null
    }

    // Check if item is selectable (defaults to true)
    if (item.selectable === false) {
      this.close()
      return null
    }

    // Fire ray-drop event with item and data
    this.dispatchEvent(new CustomEvent('ray-drop', {
      detail: { item, data }
    }))

    // Also fire ray-select for consistency
    item.onSelect?.()
    this.dispatchEvent(new CustomEvent('ray-select', { detail: item }))

    this.close()
    return item
  }

  /**
   * Cancel the drop target mode without selecting.
   * Call this when the drag is cancelled.
   */
  cancelDrop(): void {
    this._clearSpringLoad()
    this.close()
  }

  /**
   * Get the currently hovered item (useful for preview during drag).
   */
  getHoveredItem(): MenuItem | null {
    if (this._hoveredIndex >= 0 && this._hoveredIndex < this._items.length) {
      return this._items[this._hoveredIndex]
    }
    return null
  }

  private _clearSpringLoad(): void {
    if (this._springLoadTimer !== null) {
      window.clearTimeout(this._springLoadTimer)
      this._springLoadTimer = null
    }
    this._springLoadItemId = null
  }

  private _handleSpringLoad(): void {
    const item = this.getHoveredItem()

    // Clear if no item or item changed
    if (!item || item.id !== this._springLoadItemId) {
      this._clearSpringLoad()
    }

    // Start spring-load timer for items with children
    if (item?.children?.length && item.id !== this._springLoadItemId) {
      this._springLoadItemId = item.id
      this._springLoadTimer = window.setTimeout(() => {
        console.log('Spring-load: Enter submenu', item.id, item.label)
        // TODO: Actually open submenu in future
        this.dispatchEvent(new CustomEvent('ray-spring-load', { detail: item }))
      }, this._springLoadDelay)
    }
  }

  // --- Lifecycle ---

  connectedCallback(): void {
    this._render()
  }

  disconnectedCallback(): void {
    this._removeGlobalListeners()
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    switch (name) {
      case 'radius':
        this._config.radius = Number(newValue) || DEFAULT_CONFIG.radius
        break
      case 'inner-radius':
        this._config.innerRadius = Number(newValue) || DEFAULT_CONFIG.innerRadius
        break
      case 'infinite-selection':
        this._config.infiniteSelection = newValue !== null && newValue !== 'false'
        break
      case 'center-deadzone':
        this._config.centerDeadzone = Number(newValue) || DEFAULT_CONFIG.centerDeadzone
        break
      case 'infinite-threshold':
        this._config.infiniteThreshold = Number(newValue) || DEFAULT_CONFIG.infiniteThreshold
        break
      case 'edge-behavior':
        this._config.edgeBehavior = (newValue as EdgeBehavior) || DEFAULT_CONFIG.edgeBehavior
        break
      case 'show-trail-path':
        this._showTrailPath = newValue !== null && newValue !== 'false'
        break
      case 'show-anchor-line':
        this._showAnchorLine = newValue !== null && newValue !== 'false'
        break
    }
    if (this._isOpen) this._render()
  }

  // --- Event Handlers ---

  private _onPointerMove(e: PointerEvent): void {
    if (!this._isOpen) return

    this._pointerPosition = { x: e.clientX, y: e.clientY }
    const newIndex = this._calculateHoveredIndex(this._pointerPosition)

    if (newIndex !== this._hoveredIndex) {
      this._hoveredIndex = newIndex
      this._updateHoverState()
    }

    // Track position history for trail/anchor visuals
    if (this._showTrailPath || this._showAnchorLine) {
      const now = Date.now()
      this._positionHistory.push({ ...this._pointerPosition })
      this._timestampHistory.push(now)

      // Trim old entries (keep last 20)
      while (this._positionHistory.length > 20) {
        this._positionHistory.shift()
        this._timestampHistory.shift()
      }

      // Calculate velocity
      this._velocity = calculateVelocity(this._positionHistory, this._timestampHistory)

      // Update visual traces
      this._updateDriftTrace()
    } else if (this._driftTraceSvg) {
      // Clean up if both features disabled
      this._removeDriftTrace()
    }
  }

  private _onDragOver(e: DragEvent): void {
    if (!this._isOpen || !this._isDropTarget) return

    // Update hover from drag position (works even when dragging over menu elements)
    this.updateHoverFromPoint(e.clientX, e.clientY)
  }

  private _onClick(e: MouseEvent): void {
    if (!this._isOpen) return

    const dist = distance(this._position, { x: e.clientX, y: e.clientY })
    if (dist < this._config.centerDeadzone) {
      return
    }

    if (this._hoveredIndex >= 0 && this._hoveredIndex < this._items.length) {
      const item = this._items[this._hoveredIndex]
      if (!item.disabled) {
        this._selectItem(item)
      }
    } else {
      this.close()
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._isOpen) {
      this.close()
    }
  }

  // --- Private Methods ---

  private _initStyles(): void {
    if (!this.shadowRoot) return

    const style = document.createElement('style')
    style.textContent = `
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
      .ray-menu-label[data-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ray-menu-shortcut {
        font-size: 12px;
        opacity: 0.6;
      }
      .ray-menu-submenu-indicator {
        font-size: 12px;
      }
    `
    this.shadowRoot.appendChild(style)
  }

  private _addGlobalListeners(): void {
    window.addEventListener('pointermove', this._handlePointerMove)
    window.addEventListener('click', this._handleClick)
    window.addEventListener('keydown', this._handleKeyDown)
  }

  private _removeGlobalListeners(): void {
    window.removeEventListener('pointermove', this._handlePointerMove)
    window.removeEventListener('click', this._handleClick)
    window.removeEventListener('keydown', this._handleKeyDown)
  }

  private _calculateHoveredIndex(pointer: Point): number {
    const dist = distance(this._position, pointer)
    const deadzone = this._config.infiniteSelection
      ? this._config.centerDeadzone
      : this._config.innerRadius

    if (dist < deadzone) return -1

    if (!this._config.infiniteSelection && dist > this._config.radius * 1.5) {
      return -1
    }

    if (
      this._config.infiniteSelection &&
      this._config.infiniteThreshold > 0 &&
      dist > this._config.infiniteThreshold
    ) {
      return -1
    }

    let angle = angleFromCenter(this._position, pointer)
    angle = this._adjustAngleForFlip(angle)

    const itemAngles = distributeAngles(
      this._items.length,
      this._config.startAngle,
      this._config.sweepAngle
    )

    return getClosestItemIndex(angle, itemAngles)
  }

  private _adjustAngleForFlip(angle: number): number {
    let adjusted = angle
    if (this._flipState.flipX) {
      adjusted = Math.PI - adjusted
    }
    if (this._flipState.flipY) {
      adjusted = -adjusted
    }
    return adjusted
  }

  private _selectItem(item: MenuItem): void {
    // Check if item is selectable (defaults to true)
    if (item.selectable === false) {
      // TODO: Handle submenus for non-selectable items
      return
    }

    item.onSelect?.()
    this.dispatchEvent(new CustomEvent('ray-select', { detail: item }))
    this.close()
  }

  private _clearContainer(): void {
    if (!this.shadowRoot) return
    const container = this.shadowRoot.querySelector('.ray-menu-container')
    if (container) {
      container.remove()
    }
  }

  private _updateHoverState(): void {
    if (!this.shadowRoot) return

    // Update arcs
    const arcs = this.shadowRoot.querySelectorAll('.ray-menu-arc')
    arcs.forEach((arc, index) => {
      const isHovered = index === this._hoveredIndex
      const item = this._items[index]
      const pathEl = arc as SVGPathElement

      pathEl.setAttribute('fill', isHovered ? 'rgba(100, 180, 255, 0.4)' : 'rgba(50, 50, 60, 0.6)')
      pathEl.setAttribute('stroke', isHovered ? 'rgba(100, 180, 255, 0.7)' : 'rgba(255, 255, 255, 0.1)')
      pathEl.setAttribute('stroke-width', isHovered ? '2' : '1')
      pathEl.setAttribute('opacity', item?.disabled ? '0.3' : isHovered ? '1' : '0.6')
      pathEl.setAttribute('filter', isHovered ? 'url(#glow)' : '')
    })

    // Update labels
    const labels = this.shadowRoot.querySelectorAll('.ray-menu-label')
    labels.forEach((label, index) => {
      const isHovered = index === this._hoveredIndex
      label.setAttribute('data-hovered', String(isHovered))
    })
  }

  private _render(): void {
    if (!this.shadowRoot) return

    this._clearContainer()

    if (!this._isOpen || this._items.length === 0) {
      return
    }

    const { radius, innerRadius } = this._config
    const itemAngles = distributeAngles(
      this._items.length,
      this._config.startAngle,
      this._config.sweepAngle
    )

    // Create container
    const container = document.createElement('div')
    container.className = 'ray-menu-container'
    container.style.left = `${this._position.x}px`
    container.style.top = `${this._position.y}px`
    container.style.transform = `translate(-50%, -50%) ${this._flipState.transform}`
    // Drop target mode: disable pointer events and add visual feedback
    if (this._isDropTarget) {
      container.setAttribute('data-drop-target', 'true')
    }

    // Create SVG
    const svgSize = radius * 2 + 40
    const svgNS = 'http://www.w3.org/2000/svg'

    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('class', 'ray-menu-svg')
    svg.setAttribute('width', String(svgSize))
    svg.setAttribute('height', String(svgSize))
    svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`)
    // Disable pointer events in drop target mode
    if (this._isDropTarget) {
      svg.style.pointerEvents = 'none'
    }

    // Add defs with glow filter
    const defs = document.createElementNS(svgNS, 'defs')
    const filter = document.createElementNS(svgNS, 'filter')
    filter.setAttribute('id', 'glow')
    filter.setAttribute('x', '-50%')
    filter.setAttribute('y', '-50%')
    filter.setAttribute('width', '200%')
    filter.setAttribute('height', '200%')

    const blur = document.createElementNS(svgNS, 'feGaussianBlur')
    blur.setAttribute('stdDeviation', '3')
    blur.setAttribute('result', 'coloredBlur')

    const merge = document.createElementNS(svgNS, 'feMerge')
    const mergeNode1 = document.createElementNS(svgNS, 'feMergeNode')
    mergeNode1.setAttribute('in', 'coloredBlur')
    const mergeNode2 = document.createElementNS(svgNS, 'feMergeNode')
    mergeNode2.setAttribute('in', 'SourceGraphic')

    merge.appendChild(mergeNode1)
    merge.appendChild(mergeNode2)
    filter.appendChild(blur)
    filter.appendChild(merge)
    defs.appendChild(filter)
    svg.appendChild(defs)

    // Outer ring
    const outerRing = document.createElementNS(svgNS, 'circle')
    outerRing.setAttribute('cx', String(radius + 20))
    outerRing.setAttribute('cy', String(radius + 20))
    outerRing.setAttribute('r', String(radius))
    outerRing.setAttribute('fill', 'none')
    outerRing.setAttribute('stroke', 'rgba(255,255,255,0.15)')
    outerRing.setAttribute('stroke-width', '2')
    outerRing.setAttribute('opacity', '0.5')
    svg.appendChild(outerRing)

    // Inner ring
    const innerRing = document.createElementNS(svgNS, 'circle')
    innerRing.setAttribute('cx', String(radius + 20))
    innerRing.setAttribute('cy', String(radius + 20))
    innerRing.setAttribute('r', String(innerRadius))
    innerRing.setAttribute('fill', 'rgba(0,0,0,0.85)')
    innerRing.setAttribute('stroke', 'rgba(255,255,255,0.1)')
    innerRing.setAttribute('stroke-width', '1')
    svg.appendChild(innerRing)

    // Arc segments and labels
    this._items.forEach((item, index) => {
      const angle = itemAngles[index]
      const isHovered = index === this._hoveredIndex
      const segmentAngle = (Math.PI * 2) / this._items.length
      const gap = 0.05
      const startAngle = angle - segmentAngle / 2 + gap / 2
      const endAngle = angle + segmentAngle / 2 - gap / 2

      // Arc path
      const path = document.createElementNS(svgNS, 'path')
      path.setAttribute('class', 'ray-menu-arc')
      path.setAttribute('d', this._describeArc(radius + 20, radius + 20, innerRadius, radius, startAngle, endAngle))
      path.setAttribute('fill', isHovered ? 'rgba(100, 180, 255, 0.4)' : 'rgba(50, 50, 60, 0.6)')
      path.setAttribute('stroke', isHovered ? 'rgba(100, 180, 255, 0.7)' : 'rgba(255, 255, 255, 0.1)')
      path.setAttribute('stroke-width', isHovered ? '2' : '1')
      path.setAttribute('opacity', item.disabled ? '0.3' : isHovered ? '1' : '0.6')
      path.setAttribute('data-disabled', String(item.disabled || false))
      path.setAttribute('data-index', String(index))
      if (isHovered) path.setAttribute('filter', 'url(#glow)')
      svg.appendChild(path)

      // Label - position relative to container center (0, 0)
      const labelPos = toCartesian(
        { x: 0, y: 0 },
        { angle, distance: (innerRadius + radius) / 2 }
      )

      const label = document.createElement('div')
      label.className = 'ray-menu-label'
      label.style.left = `${labelPos.x}px`
      label.style.top = `${labelPos.y}px`
      // Disable pointer events in drop target mode
      if (this._isDropTarget) {
        label.style.pointerEvents = 'none'
      }
      label.setAttribute('data-hovered', String(isHovered))
      label.setAttribute('data-disabled', String(item.disabled || false))
      label.setAttribute('data-index', String(index))

      const labelText = document.createElement('span')
      labelText.textContent = item.label
      label.appendChild(labelText)

      if (item.shortcut) {
        const shortcut = document.createElement('span')
        shortcut.className = 'ray-menu-shortcut'
        shortcut.textContent = item.shortcut
        label.appendChild(shortcut)
      }

      if (item.children && item.children.length > 0) {
        const indicator = document.createElement('span')
        indicator.className = 'ray-menu-submenu-indicator'
        indicator.textContent = '▸'
        label.appendChild(indicator)
      }

      container.appendChild(label)
    })

    container.appendChild(svg)
    this.shadowRoot.appendChild(container)
  }

  private _describeArc(
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): string {
    const startOuter = {
      x: x + outerRadius * Math.cos(startAngle),
      y: y + outerRadius * Math.sin(startAngle),
    }
    const endOuter = {
      x: x + outerRadius * Math.cos(endAngle),
      y: y + outerRadius * Math.sin(endAngle),
    }
    const startInner = {
      x: x + innerRadius * Math.cos(endAngle),
      y: y + innerRadius * Math.sin(endAngle),
    }
    const endInner = {
      x: x + innerRadius * Math.cos(startAngle),
      y: y + innerRadius * Math.sin(startAngle),
    }

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ')
  }

  private _removeDriftTrace(): void {
    if (this._driftTraceSvg) {
      this._driftTraceSvg.remove()
      this._driftTraceSvg = null
    }
  }

  private _createGradientStop(svgNS: string, offset: string, color: string, opacity: string): Element {
    const stop = document.createElementNS(svgNS, 'stop')
    stop.setAttribute('offset', offset)
    stop.setAttribute('stop-color', color)
    stop.setAttribute('stop-opacity', opacity)
    return stop
  }

  private _updateDriftTrace(): void {
    if (!this.shadowRoot || !this._pointerPosition) return

    const svgNS = 'http://www.w3.org/2000/svg'
    const trailDuration = 300
    const maxPoints = 20
    const color = 'rgba(100, 180, 255, 0.5)'

    // Create or get drift trace SVG
    if (!this._driftTraceSvg) {
      this._driftTraceSvg = document.createElementNS(svgNS, 'svg')
      this._driftTraceSvg.setAttribute('class', 'ray-menu-drift-trace')
      this._driftTraceSvg.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9998;
      `

      // Add defs
      const defs = document.createElementNS(svgNS, 'defs')

      // Trail gradient
      const trailGradient = document.createElementNS(svgNS, 'linearGradient')
      trailGradient.setAttribute('id', 'trailGradient')
      trailGradient.setAttribute('gradientUnits', 'userSpaceOnUse')
      trailGradient.appendChild(this._createGradientStop(svgNS, '0%', color, '0'))
      trailGradient.appendChild(this._createGradientStop(svgNS, '100%', color, '0.6'))

      // Anchor gradient
      const anchorGradient = document.createElementNS(svgNS, 'linearGradient')
      anchorGradient.setAttribute('id', 'anchorGradient')
      anchorGradient.setAttribute('gradientUnits', 'userSpaceOnUse')
      anchorGradient.appendChild(this._createGradientStop(svgNS, '0%', color, '0.8'))
      anchorGradient.appendChild(this._createGradientStop(svgNS, '100%', color, '0.2'))

      // Trail blur filter
      const trailBlur = document.createElementNS(svgNS, 'filter')
      trailBlur.setAttribute('id', 'trailBlur')
      trailBlur.setAttribute('x', '-50%')
      trailBlur.setAttribute('y', '-50%')
      trailBlur.setAttribute('width', '200%')
      trailBlur.setAttribute('height', '200%')
      const blur = document.createElementNS(svgNS, 'feGaussianBlur')
      blur.setAttribute('stdDeviation', '2')
      trailBlur.appendChild(blur)

      defs.appendChild(trailGradient)
      defs.appendChild(anchorGradient)
      defs.appendChild(trailBlur)
      this._driftTraceSvg.appendChild(defs)

      this.shadowRoot.appendChild(this._driftTraceSvg)
    }

    // Keep local reference for TypeScript (guaranteed non-null after above)
    const traceSvg = this._driftTraceSvg

    // Clear existing content (except defs)
    const defs = traceSvg.querySelector('defs')
    while (traceSvg.lastChild && traceSvg.lastChild !== defs) {
      traceSvg.removeChild(traceSvg.lastChild)
    }

    // Generate trail points
    const trailPoints: TracePoint[] = generateTraceTrail(
      this._positionHistory,
      this._timestampHistory,
      trailDuration,
      maxPoints
    )

    // Calculate velocity-based intensity
    const speed = Math.sqrt(this._velocity.vx ** 2 + this._velocity.vy ** 2)
    const intensity = Math.min(1, speed / 500)

    // Calculate hovered angle for anchor line
    const itemAngles = distributeAngles(
      this._items.length,
      this._config.startAngle,
      this._config.sweepAngle
    )
    const hoveredAngle = this._hoveredIndex >= 0 ? itemAngles[this._hoveredIndex] : undefined

    // Distance from center
    const distFromCenter = distance(this._position, this._pointerPosition)

    // Draw anchor line if enabled and outside menu radius
    if (this._showAnchorLine && hoveredAngle !== undefined && distFromCenter > this._config.radius) {
      const anchorPoint = {
        x: this._position.x + Math.cos(hoveredAngle) * this._config.radius,
        y: this._position.y + Math.sin(hoveredAngle) * this._config.radius,
      }

      // Update anchor gradient positions
      const anchorGradient = traceSvg.querySelector('#anchorGradient')
      if (anchorGradient) {
        anchorGradient.setAttribute('x1', String(anchorPoint.x))
        anchorGradient.setAttribute('y1', String(anchorPoint.y))
        anchorGradient.setAttribute('x2', String(this._pointerPosition.x))
        anchorGradient.setAttribute('y2', String(this._pointerPosition.y))
      }

      // Anchor line
      const anchorLine = document.createElementNS(svgNS, 'path')
      anchorLine.setAttribute('d', `M ${anchorPoint.x},${anchorPoint.y} L ${this._pointerPosition.x},${this._pointerPosition.y}`)
      anchorLine.setAttribute('fill', 'none')
      anchorLine.setAttribute('stroke', 'url(#anchorGradient)')
      anchorLine.setAttribute('stroke-width', '2')
      anchorLine.setAttribute('stroke-linecap', 'round')
      anchorLine.setAttribute('stroke-dasharray', '8 4')
      anchorLine.setAttribute('opacity', '0.6')
      traceSvg.appendChild(anchorLine)

      // Anchor point dot
      const anchorDot = document.createElementNS(svgNS, 'circle')
      anchorDot.setAttribute('cx', String(anchorPoint.x))
      anchorDot.setAttribute('cy', String(anchorPoint.y))
      anchorDot.setAttribute('r', '4')
      anchorDot.setAttribute('fill', color)
      anchorDot.setAttribute('opacity', '0.9')
      traceSvg.appendChild(anchorDot)
    }

    // Draw trail path if enabled
    if (this._showTrailPath) {
      if (trailPoints.length >= 2) {
        const pathData = 'M ' + trailPoints.map(p => `${p.x},${p.y}`).join(' L ')

        const trailPath = document.createElementNS(svgNS, 'path')
        trailPath.setAttribute('d', pathData)
        trailPath.setAttribute('fill', 'none')
        trailPath.setAttribute('stroke', 'url(#trailGradient)')
        trailPath.setAttribute('stroke-width', String(3 + intensity * 2))
        trailPath.setAttribute('stroke-linecap', 'round')
        trailPath.setAttribute('stroke-linejoin', 'round')
        trailPath.setAttribute('filter', 'url(#trailBlur)')
        traceSvg.appendChild(trailPath)
      }

      // Draw trail dots
      trailPoints.forEach((point, index) => {
        const dot = document.createElementNS(svgNS, 'circle')
        dot.setAttribute('cx', String(point.x))
        dot.setAttribute('cy', String(point.y))
        dot.setAttribute('r', String(2 + (index / trailPoints.length) * 3))
        dot.setAttribute('fill', color)
        dot.setAttribute('opacity', String(point.opacity * 0.5))
        traceSvg.appendChild(dot)
      })

      // Current position indicator
      const posDot = document.createElementNS(svgNS, 'circle')
      posDot.setAttribute('cx', String(this._pointerPosition.x))
      posDot.setAttribute('cy', String(this._pointerPosition.y))
      posDot.setAttribute('r', '6')
      posDot.setAttribute('fill', color)
      posDot.setAttribute('opacity', '0.8')
      posDot.setAttribute('filter', 'url(#trailBlur)')
      traceSvg.appendChild(posDot)

      // Direction indicator
      if (speed > 50) {
        const dirLine = document.createElementNS(svgNS, 'line')
        dirLine.setAttribute('x1', String(this._pointerPosition.x))
        dirLine.setAttribute('y1', String(this._pointerPosition.y))
        dirLine.setAttribute('x2', String(this._pointerPosition.x + (this._velocity.vx / speed) * 30))
        dirLine.setAttribute('y2', String(this._pointerPosition.y + (this._velocity.vy / speed) * 30))
        dirLine.setAttribute('stroke', color)
        dirLine.setAttribute('stroke-width', '2')
        dirLine.setAttribute('stroke-linecap', 'round')
        dirLine.setAttribute('opacity', String(intensity * 0.5))
        traceSvg.appendChild(dirLine)
      }
    }
  }
}

// Register the custom element
customElements.define('ray-menu', RayMenu)

// Extend HTMLElementTagNameMap for TypeScript support
declare global {
  interface HTMLElementTagNameMap {
    'ray-menu': RayMenu
  }
}
