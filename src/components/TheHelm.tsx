import { forwardRef, useCallback, useMemo } from 'react'
import { useRadialMenu, type UseRadialMenuOptions, type UseRadialMenuReturn } from '@hooks'
import { type MenuItem, toCartesian, toDegrees } from '@core'
import { ArcSubMenu } from './ArcSubMenu'
import { DriftTrace } from './DriftTrace'

export interface TheHelmProps extends Omit<UseRadialMenuOptions, 'items'> {
  /** Menu items - required if not using external menu state */
  items?: MenuItem[]
  /** External menu state from useRadialMenu - if provided, items prop is ignored */
  menu?: UseRadialMenuReturn
  className?: string
  /** Show cursor trail path effect */
  showTrailPath?: boolean
  /** Show anchor line from menu edge to cursor when outside menu */
  showAnchorLine?: boolean
  /** @deprecated Use showTrailPath and showAnchorLine instead */
  showDriftTrace?: boolean
}

export const TheHelm = forwardRef<HTMLDivElement, TheHelmProps>(
  function TheHelm({ className = '', showTrailPath = false, showAnchorLine = false, showDriftTrace = false, menu: externalMenu, items = [], ...options }, ref) {
    // Support deprecated showDriftTrace prop (enables both features)
    const effectiveShowTrailPath = showTrailPath || showDriftTrace
    const effectiveShowAnchorLine = showAnchorLine || showDriftTrace
    // Use external menu if provided, otherwise create internal state
    const internalMenu = useRadialMenu({ items, ...options })
    const menu = externalMenu || internalMenu

    const {
      state,
      config,
      activeItems,
      itemAngles,
      hoveredIndex,
      flipState,
      velocity,
      pointerPosition,
      menuRef,
      selectItem,
    } = menu

    const handleItemClick = useCallback(
      (item: MenuItem) => {
        selectItem(item)
      },
      [selectItem]
    )

    const arcItems = useMemo(() => {
      return activeItems.map((item, index) => {
        const angle = itemAngles[index]
        const isHovered = index === hoveredIndex

        // Calculate position for the item
        const itemPosition = toCartesian(state.position, {
          angle,
          distance: (config.innerRadius + config.radius) / 2,
        })

        return {
          item,
          angle,
          angleDeg: toDegrees(angle),
          isHovered,
          position: itemPosition,
        }
      })
    }, [activeItems, itemAngles, hoveredIndex, state.position, config.innerRadius, config.radius])

    // Get the angle of the currently hovered item for DriftTrace
    const hoveredAngle = useMemo(() => {
      if (hoveredIndex < 0 || hoveredIndex >= itemAngles.length) return undefined
      return itemAngles[hoveredIndex]
    }, [hoveredIndex, itemAngles])

    if (!state.isOpen) return null

    return (
      <div
        ref={(el) => {
          menuRef(el)
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        className={className}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        role="menu"
        aria-label="Radial menu"
      >
        {/* Drift trace effect */}
        {(effectiveShowTrailPath || effectiveShowAnchorLine) && pointerPosition && (
          <DriftTrace
            position={pointerPosition}
            velocity={velocity}
            menuCenter={state.position}
            menuRadius={config.radius}
            hoveredAngle={hoveredAngle}
            showTrailPath={effectiveShowTrailPath}
            showAnchorLine={effectiveShowAnchorLine}
          />
        )}

        {/* Main menu container */}
        <div
          style={{
            position: 'absolute',
            left: state.position.x,
            top: state.position.y,
            transform: `translate(-50%, -50%) ${flipState.transform}`,
            pointerEvents: 'auto',
          }}
        >
          {/* Background ring */}
          <svg
            width={config.radius * 2 + 40}
            height={config.radius * 2 + 40}
            viewBox={`0 0 ${config.radius * 2 + 40} ${config.radius * 2 + 40}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer ring background */}
            <circle
              cx={config.radius + 20}
              cy={config.radius + 20}
              r={config.radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              opacity={0.5}
            />

            {/* Inner ring */}
            <circle
              cx={config.radius + 20}
              cy={config.radius + 20}
              r={config.innerRadius}
              fill="rgba(0,0,0,0.85)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />

            {/* Arc segments */}
            <ArcSubMenu
              items={arcItems}
              centerX={config.radius + 20}
              centerY={config.radius + 20}
              innerRadius={config.innerRadius}
              outerRadius={config.radius}
              onItemClick={handleItemClick}
            />
          </svg>

          {/* Item labels */}
          {arcItems.map(({ item, position, isHovered }) => (
            <button
              key={item.id}
              style={{
                position: 'absolute',
                left: position.x - state.position.x,
                top: position.y - state.position.y,
                transform: `translate(-50%, -50%) ${flipState.flipX || flipState.flipY ? flipState.transform : ''}`,
                backgroundColor: isHovered
                  ? 'rgba(100, 180, 255, 0.95)'
                  : 'rgba(30, 30, 40, 0.95)',
                color: isHovered ? 'white' : '#e4e4e7',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                transition: 'all 150ms ease',
                pointerEvents: 'auto',
                outline: 'none',
                boxShadow: isHovered ? '0 0 20px rgba(100, 180, 255, 0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
                scale: isHovered ? '1.1' : '1',
              }}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              role="menuitem"
              aria-disabled={item.disabled}
            >
              {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.shortcut && (
                <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>{item.shortcut}</span>
              )}
              {item.children && item.children.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px' }}>▸</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }
)

export default TheHelm
