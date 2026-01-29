import type { Point, Velocity, TracePoint } from '../core'
import { distance, distributeAngles, generateTraceTrail } from '../core'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TRAIL_COLOR = 'rgba(100, 180, 255, 0.5)'

/**
 * Create a gradient stop element
 */
function createGradientStop(offset: string, color: string, opacity: string): SVGStopElement {
  const stop = document.createElementNS(SVG_NS, 'stop')
  stop.setAttribute('offset', offset)
  stop.setAttribute('stop-color', color)
  stop.setAttribute('stop-opacity', opacity)
  return stop
}

/**
 * Create the drift trace SVG element with defs
 */
export function createDriftTraceSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'ray-menu-drift-trace')
  svg.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9998;
  `

  const defs = document.createElementNS(SVG_NS, 'defs')

  // Trail gradient
  const trailGradient = document.createElementNS(SVG_NS, 'linearGradient')
  trailGradient.setAttribute('id', 'trailGradient')
  trailGradient.setAttribute('gradientUnits', 'userSpaceOnUse')
  trailGradient.appendChild(createGradientStop('0%', TRAIL_COLOR, '0'))
  trailGradient.appendChild(createGradientStop('100%', TRAIL_COLOR, '0.6'))

  // Anchor gradient
  const anchorGradient = document.createElementNS(SVG_NS, 'linearGradient')
  anchorGradient.setAttribute('id', 'anchorGradient')
  anchorGradient.setAttribute('gradientUnits', 'userSpaceOnUse')
  anchorGradient.appendChild(createGradientStop('0%', TRAIL_COLOR, '0.8'))
  anchorGradient.appendChild(createGradientStop('100%', TRAIL_COLOR, '0.2'))

  // Trail blur filter
  const trailBlur = document.createElementNS(SVG_NS, 'filter')
  trailBlur.setAttribute('id', 'trailBlur')
  trailBlur.setAttribute('x', '-50%')
  trailBlur.setAttribute('y', '-50%')
  trailBlur.setAttribute('width', '200%')
  trailBlur.setAttribute('height', '200%')
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', '2')
  trailBlur.appendChild(blur)

  defs.appendChild(trailGradient)
  defs.appendChild(anchorGradient)
  defs.appendChild(trailBlur)
  svg.appendChild(defs)

  return svg
}

export interface DriftTraceOptions {
  menuPosition: Point
  pointerPosition: Point
  positionHistory: Point[]
  timestampHistory: number[]
  velocity: Velocity
  currentRadius: number
  hoveredIndex: number
  itemCount: number
  startAngle: number
  sweepAngle: number
  showTrailPath: boolean
  showAnchorLine: boolean
}

/**
 * Update the drift trace SVG content
 */
export function updateDriftTrace(svg: SVGSVGElement, options: DriftTraceOptions): void {
  const {
    menuPosition,
    pointerPosition,
    positionHistory,
    timestampHistory,
    velocity,
    currentRadius,
    hoveredIndex,
    itemCount,
    startAngle,
    sweepAngle,
    showTrailPath,
    showAnchorLine,
  } = options

  const trailDuration = 300
  const maxPoints = 20

  // Clear existing content (except defs)
  const defs = svg.querySelector('defs')
  while (svg.lastChild && svg.lastChild !== defs) {
    svg.removeChild(svg.lastChild)
  }

  // Generate trail points
  const trailPoints: TracePoint[] = generateTraceTrail(
    positionHistory,
    timestampHistory,
    trailDuration,
    maxPoints
  )

  // Calculate velocity-based intensity
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2)
  const intensity = Math.min(1, speed / 500)

  // Calculate hovered angle for anchor line
  const itemAngles = distributeAngles(itemCount, startAngle, sweepAngle)
  const hoveredAngle = hoveredIndex >= 0 ? itemAngles[hoveredIndex] : undefined

  // Distance from center
  const distFromCenter = distance(menuPosition, pointerPosition)

  // Draw anchor line if enabled and outside menu radius
  if (showAnchorLine && hoveredAngle !== undefined && distFromCenter > currentRadius) {
    const anchorPoint = {
      x: menuPosition.x + Math.cos(hoveredAngle) * currentRadius,
      y: menuPosition.y + Math.sin(hoveredAngle) * currentRadius,
    }

    // Update anchor gradient positions
    const anchorGradient = svg.querySelector('#anchorGradient')
    if (anchorGradient) {
      anchorGradient.setAttribute('x1', String(anchorPoint.x))
      anchorGradient.setAttribute('y1', String(anchorPoint.y))
      anchorGradient.setAttribute('x2', String(pointerPosition.x))
      anchorGradient.setAttribute('y2', String(pointerPosition.y))
    }

    // Anchor line
    const anchorLine = document.createElementNS(SVG_NS, 'path')
    anchorLine.setAttribute(
      'd',
      `M ${anchorPoint.x},${anchorPoint.y} L ${pointerPosition.x},${pointerPosition.y}`
    )
    anchorLine.setAttribute('fill', 'none')
    anchorLine.setAttribute('stroke', 'url(#anchorGradient)')
    anchorLine.setAttribute('stroke-width', '2')
    anchorLine.setAttribute('stroke-linecap', 'round')
    anchorLine.setAttribute('stroke-dasharray', '8 4')
    anchorLine.setAttribute('opacity', '0.6')
    svg.appendChild(anchorLine)

    // Anchor point dot
    const anchorDot = document.createElementNS(SVG_NS, 'circle')
    anchorDot.setAttribute('cx', String(anchorPoint.x))
    anchorDot.setAttribute('cy', String(anchorPoint.y))
    anchorDot.setAttribute('r', '4')
    anchorDot.setAttribute('fill', TRAIL_COLOR)
    anchorDot.setAttribute('opacity', '0.9')
    svg.appendChild(anchorDot)
  }

  // Draw trail path if enabled
  if (showTrailPath) {
    if (trailPoints.length >= 2) {
      const pathData = 'M ' + trailPoints.map((p) => `${p.x},${p.y}`).join(' L ')

      const trailPath = document.createElementNS(SVG_NS, 'path')
      trailPath.setAttribute('d', pathData)
      trailPath.setAttribute('fill', 'none')
      trailPath.setAttribute('stroke', 'url(#trailGradient)')
      trailPath.setAttribute('stroke-width', String(3 + intensity * 2))
      trailPath.setAttribute('stroke-linecap', 'round')
      trailPath.setAttribute('stroke-linejoin', 'round')
      trailPath.setAttribute('filter', 'url(#trailBlur)')
      svg.appendChild(trailPath)
    }

    // Draw trail dots
    trailPoints.forEach((point, index) => {
      const dot = document.createElementNS(SVG_NS, 'circle')
      dot.setAttribute('cx', String(point.x))
      dot.setAttribute('cy', String(point.y))
      dot.setAttribute('r', String(2 + (index / trailPoints.length) * 3))
      dot.setAttribute('fill', TRAIL_COLOR)
      dot.setAttribute('opacity', String(point.opacity * 0.5))
      svg.appendChild(dot)
    })

    // Current position indicator
    const posDot = document.createElementNS(SVG_NS, 'circle')
    posDot.setAttribute('cx', String(pointerPosition.x))
    posDot.setAttribute('cy', String(pointerPosition.y))
    posDot.setAttribute('r', '6')
    posDot.setAttribute('fill', TRAIL_COLOR)
    posDot.setAttribute('opacity', '0.8')
    posDot.setAttribute('filter', 'url(#trailBlur)')
    svg.appendChild(posDot)

    // Direction indicator
    if (speed > 50) {
      const dirLine = document.createElementNS(SVG_NS, 'line')
      dirLine.setAttribute('x1', String(pointerPosition.x))
      dirLine.setAttribute('y1', String(pointerPosition.y))
      dirLine.setAttribute('x2', String(pointerPosition.x + (velocity.vx / speed) * 30))
      dirLine.setAttribute('y2', String(pointerPosition.y + (velocity.vy / speed) * 30))
      dirLine.setAttribute('stroke', TRAIL_COLOR)
      dirLine.setAttribute('stroke-width', '2')
      dirLine.setAttribute('stroke-linecap', 'round')
      dirLine.setAttribute('opacity', String(intensity * 0.5))
      svg.appendChild(dirLine)
    }
  }
}
