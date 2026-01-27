import { useRef, useEffect, useMemo } from 'react'
import type { Point, Velocity, TracePoint } from '@core'
import { generateTraceTrail, distance } from '@core'

export interface DriftTraceProps {
  position: Point
  velocity: Velocity
  menuCenter: Point
  menuRadius?: number
  hoveredAngle?: number
  trailDuration?: number
  maxPoints?: number
  color?: string
  className?: string
}

export function DriftTrace({
  position,
  velocity,
  menuCenter,
  menuRadius = 120,
  hoveredAngle,
  trailDuration = 300,
  maxPoints = 20,
  color = 'rgba(100, 180, 255, 0.5)',
  className = '',
}: DriftTraceProps) {
  const historyRef = useRef<{ positions: Point[]; timestamps: number[] }>({
    positions: [],
    timestamps: [],
  })

  // Update history
  useEffect(() => {
    const now = Date.now()
    const history = historyRef.current

    history.positions.push({ ...position })
    history.timestamps.push(now)

    // Trim old entries
    while (history.timestamps.length > maxPoints) {
      history.positions.shift()
      history.timestamps.shift()
    }
  }, [position, maxPoints])

  // Generate trail points
  const trailPoints = useMemo((): TracePoint[] => {
    const { positions, timestamps } = historyRef.current
    return generateTraceTrail(positions, timestamps, trailDuration, maxPoints)
  }, [position, trailDuration, maxPoints])

  // Calculate speed for visual intensity
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2)
  const intensity = Math.min(1, speed / 500)

  // Calculate distance from menu center
  const distFromCenter = distance(menuCenter, position)

  // Calculate anchor point on the menu ring edge (for infinite selection visual)
  const anchorPoint = useMemo(() => {
    if (hoveredAngle === undefined) return null

    return {
      x: menuCenter.x + Math.cos(hoveredAngle) * menuRadius,
      y: menuCenter.y + Math.sin(hoveredAngle) * menuRadius,
    }
  }, [menuCenter, menuRadius, hoveredAngle])

  // Generate SVG path from trail points
  const pathData = useMemo(() => {
    if (trailPoints.length < 2) return ''

    const points = trailPoints.map((p) => `${p.x},${p.y}`).join(' L ')
    return `M ${points}`
  }, [trailPoints])

  // Generate the anchor-to-cursor line for infinite selection
  const anchorLineData = useMemo(() => {
    if (!anchorPoint || distFromCenter <= menuRadius) return ''
    return `M ${anchorPoint.x},${anchorPoint.y} L ${position.x},${position.y}`
  }, [anchorPoint, position, distFromCenter, menuRadius])

  if (trailPoints.length < 2 && !anchorLineData) return null

  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
      width="100%"
      height="100%"
    >
      <defs>
        <linearGradient id="trailGradient" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity={0.6 * intensity} />
        </linearGradient>
        <linearGradient
          id="anchorGradient"
          gradientUnits="userSpaceOnUse"
          x1={anchorPoint?.x || 0}
          y1={anchorPoint?.y || 0}
          x2={position.x}
          y2={position.y}
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
        <filter id="trailBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Anchor line for infinite selection - stretches from menu edge to cursor */}
      {anchorLineData && (
        <>
          <path
            d={anchorLineData}
            fill="none"
            stroke="url(#anchorGradient)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="8 4"
            opacity={0.6}
          />
          {/* Anchor point indicator on menu edge */}
          {anchorPoint && (
            <circle
              cx={anchorPoint.x}
              cy={anchorPoint.y}
              r={4}
              fill={color}
              opacity={0.9}
            />
          )}
        </>
      )}

      {/* Trail path */}
      {pathData && (
        <path
          d={pathData}
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth={3 + intensity * 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#trailBlur)"
        />
      )}

      {/* Trail dots with fading opacity */}
      {trailPoints.map((point, index) => (
        <circle
          key={`${point.timestamp}-${index}`}
          cx={point.x}
          cy={point.y}
          r={2 + (index / trailPoints.length) * 3}
          fill={color}
          opacity={point.opacity * 0.5}
        />
      ))}

      {/* Current position indicator */}
      <circle
        cx={position.x}
        cy={position.y}
        r={6}
        fill={color}
        opacity={0.8}
        filter="url(#trailBlur)"
      />

      {/* Direction indicator line */}
      {speed > 50 && (
        <line
          x1={position.x}
          y1={position.y}
          x2={position.x + (velocity.vx / speed) * 30}
          y2={position.y + (velocity.vy / speed) * 30}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={intensity * 0.5}
        />
      )}
    </svg>
  )
}

export default DriftTrace
