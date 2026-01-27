import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  type MenuItem,
  type MenuConfig,
  type MenuState,
  type Point,
  DEFAULT_CONFIG,
  angleFromCenter,
  distance,
  distributeAngles,
  getClosestItemIndex,
  detectEdgeConstraints,
  calculateSmartFlip,
  calculateVelocity,
  type FlipState,
  type EdgeState,
  type Velocity,
} from '@core'

export interface UseRadialMenuOptions {
  items: MenuItem[]
  config?: Partial<MenuConfig>
  onSelect?: (item: MenuItem) => void
  onOpen?: (position: Point) => void
  onClose?: () => void
}

export interface UseRadialMenuReturn {
  /** Current menu state */
  state: MenuState
  /** Merged configuration */
  config: MenuConfig
  /** Open the menu at a position */
  open: (position: Point) => void
  /** Close the menu */
  close: () => void
  /** Toggle menu at position */
  toggle: (position: Point) => void
  /** Handle pointer move for hover detection */
  handlePointerMove: (event: PointerEvent | { clientX: number; clientY: number }) => void
  /** Handle item selection */
  selectItem: (item: MenuItem) => void
  /** Navigate into submenu */
  enterSubmenu: (itemId: string) => void
  /** Navigate back from submenu */
  exitSubmenu: () => void
  /** Current active items (considering submenu) */
  activeItems: MenuItem[]
  /** Angles for each active item */
  itemAngles: number[]
  /** Current hovered index */
  hoveredIndex: number
  /** Edge detection state */
  edgeState: EdgeState | null
  /** Flip state for positioning */
  flipState: FlipState
  /** Pointer velocity for drift trace */
  velocity: Velocity
  /** Current pointer position */
  pointerPosition: Point | null
  /** Ref callback for the menu container */
  menuRef: (element: HTMLElement | null) => void
  /** Bind handlers to a trigger element */
  getTriggerProps: () => {
    onContextMenu: (e: React.MouseEvent) => void
    onClick: (e: React.MouseEvent) => void
  }
}

/**
 * Adjust pointer angle to account for flip transformation
 * When the menu is flipped, we need to mirror the angle accordingly
 */
function adjustAngleForFlip(angle: number, flipState: FlipState): number {
  let adjusted = angle

  if (flipState.flipX) {
    // Mirror horizontally: reflect across Y axis
    adjusted = Math.PI - adjusted
  }

  if (flipState.flipY) {
    // Mirror vertically: reflect across X axis
    adjusted = -adjusted
  }

  return adjusted
}

export function useRadialMenu(options: UseRadialMenuOptions): UseRadialMenuReturn {
  const { items, config: configOverrides, onSelect, onOpen, onClose } = options

  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...configOverrides }),
    [configOverrides]
  )

  const [state, setState] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    activeItemId: null,
    hoveredItemId: null,
    submenuStack: [],
  })

  const [pointerPosition, setPointerPosition] = useState<Point | null>(null)
  const [edgeState, setEdgeState] = useState<EdgeState | null>(null)
  const [flipState, setFlipState] = useState<FlipState>({
    mode: 'none',
    flipX: false,
    flipY: false,
    scaleX: 1,
    scaleY: 1,
    transform: 'scale(1, 1)',
  })

  const menuRef = useRef<HTMLElement | null>(null)
  const positionHistory = useRef<{ positions: Point[]; timestamps: number[] }>({
    positions: [],
    timestamps: [],
  })

  // Calculate active items based on submenu stack
  const activeItems = useMemo(() => {
    let current = items
    for (const id of state.submenuStack) {
      const parent = current.find((item) => item.id === id)
      if (parent?.children) {
        current = parent.children
      } else {
        break
      }
    }
    return current
  }, [items, state.submenuStack])

  // Calculate angles for active items
  const itemAngles = useMemo(
    () => distributeAngles(activeItems.length, config.startAngle, config.sweepAngle),
    [activeItems.length, config.startAngle, config.sweepAngle]
  )

  // Calculate hovered index from pointer position, accounting for flip and infinite selection
  const hoveredIndex = useMemo(() => {
    if (!pointerPosition || !state.isOpen) return -1

    const dist = distance(state.position, pointerPosition)

    // Check center dead zone - no selection within this radius
    const deadzone = config.infiniteSelection ? config.centerDeadzone : config.innerRadius
    if (dist < deadzone) return -1

    // For non-infinite selection, also check outer bound
    if (!config.infiniteSelection && dist > config.radius * 1.5) return -1

    // For infinite selection with threshold, check max distance
    if (config.infiniteSelection && config.infiniteThreshold > 0 && dist > config.infiniteThreshold) {
      return -1
    }

    // Get raw angle from menu center to pointer
    let angle = angleFromCenter(state.position, pointerPosition)

    // Adjust angle to account for flip transformation
    angle = adjustAngleForFlip(angle, flipState)

    return getClosestItemIndex(angle, itemAngles)
  }, [
    pointerPosition,
    state.isOpen,
    state.position,
    config.innerRadius,
    config.radius,
    config.infiniteSelection,
    config.centerDeadzone,
    config.infiniteThreshold,
    itemAngles,
    flipState,
  ])

  // Calculate velocity from position history
  const velocity = useMemo(() => {
    const { positions, timestamps } = positionHistory.current
    return calculateVelocity(positions, timestamps)
  }, [pointerPosition])

  const open = useCallback(
    (position: Point) => {
      // Detect edge constraints
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      const newEdgeState = detectEdgeConstraints(position, config.radius, viewport)
      setEdgeState(newEdgeState)

      // Calculate flip state based on edge behavior
      let newFlipState: FlipState = {
        mode: 'none',
        flipX: false,
        flipY: false,
        scaleX: 1,
        scaleY: 1,
        transform: 'scale(1, 1)',
      }

      const shouldFlip = config.edgeBehavior === 'flip' || config.smartFlip
      if (shouldFlip) {
        newFlipState = calculateSmartFlip(position, config.radius, newEdgeState)
        setFlipState(newFlipState)
      } else {
        setFlipState(newFlipState)
      }

      // Adjust position based on edge behavior
      let adjustedPosition = position
      if (config.edgeBehavior === 'shift' || config.edgeDetection) {
        adjustedPosition = {
          x: position.x + newEdgeState.offset.x,
          y: position.y + newEdgeState.offset.y,
        }
      }

      setState((prev) => ({
        ...prev,
        isOpen: true,
        position: adjustedPosition,
        submenuStack: [],
        hoveredItemId: null,
      }))

      positionHistory.current = { positions: [], timestamps: [] }
      onOpen?.(adjustedPosition)
    },
    [config.radius, config.edgeDetection, config.smartFlip, config.edgeBehavior, onOpen]
  )

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      activeItemId: null,
      hoveredItemId: null,
      submenuStack: [],
    }))
    setPointerPosition(null)
    setEdgeState(null)
    onClose?.()
  }, [onClose])

  const toggle = useCallback(
    (position: Point) => {
      if (state.isOpen) {
        close()
      } else {
        open(position)
      }
    },
    [state.isOpen, open, close]
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent | { clientX: number; clientY: number }) => {
      if (!state.isOpen) return

      const point = { x: event.clientX, y: event.clientY }
      setPointerPosition(point)

      // Track position history for velocity
      const now = Date.now()
      const history = positionHistory.current
      history.positions.push(point)
      history.timestamps.push(now)

      // Keep only recent history (last 100ms)
      while (history.timestamps.length > 0 && now - history.timestamps[0] > 100) {
        history.positions.shift()
        history.timestamps.shift()
      }
    },
    [state.isOpen]
  )

  const selectItem = useCallback(
    (item: MenuItem) => {
      if (item.disabled) return

      if (item.children && item.children.length > 0) {
        // Enter submenu
        setState((prev) => ({
          ...prev,
          submenuStack: [...prev.submenuStack, item.id],
          activeItemId: item.id,
        }))
      } else {
        // Execute action
        item.onSelect?.()
        onSelect?.(item)
        close()
      }
    },
    [onSelect, close]
  )

  const enterSubmenu = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      submenuStack: [...prev.submenuStack, itemId],
      activeItemId: itemId,
    }))
  }, [])

  const exitSubmenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      submenuStack: prev.submenuStack.slice(0, -1),
      activeItemId: prev.submenuStack[prev.submenuStack.length - 2] || null,
    }))
  }, [])

  const setMenuRef = useCallback((element: HTMLElement | null) => {
    menuRef.current = element
  }, [])

  const getTriggerProps = useCallback(
    () => ({
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault()
        open({ x: e.clientX, y: e.clientY })
      },
      onClick: (e: React.MouseEvent) => {
        toggle({ x: e.clientX, y: e.clientY })
      },
    }),
    [open, toggle]
  )

  // Global pointer move listener
  useEffect(() => {
    if (!state.isOpen) return

    const handleMove = (e: PointerEvent) => handlePointerMove(e)
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [state.isOpen, handlePointerMove])

  // Close on click outside
  useEffect(() => {
    if (!state.isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', handleClick)
    }
  }, [state.isOpen, close])

  // Close on escape
  useEffect(() => {
    if (!state.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.submenuStack.length > 0) {
          exitSubmenu()
        } else {
          close()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen, state.submenuStack.length, close, exitSubmenu])

  return {
    state,
    config,
    open,
    close,
    toggle,
    handlePointerMove,
    selectItem,
    enterSubmenu,
    exitSubmenu,
    activeItems,
    itemAngles,
    hoveredIndex,
    edgeState,
    flipState,
    velocity,
    pointerPosition,
    menuRef: setMenuRef,
    getTriggerProps,
  }
}

export default useRadialMenu
