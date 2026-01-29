import type { MenuItem, MenuConfig } from '../core'
import { distributeAngles, toCartesian } from '../core'
import type { NavStackEntry } from './ray-menu-types'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Describe an arc path for SVG
 */
export function describeArc(
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

/**
 * Create SVG defs with glow filter
 */
export function createSvgDefs(): SVGDefsElement {
  const defs = document.createElementNS(SVG_NS, 'defs')
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', 'glow')
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')

  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', '3')
  blur.setAttribute('result', 'coloredBlur')

  const merge = document.createElementNS(SVG_NS, 'feMerge')
  const mergeNode1 = document.createElementNS(SVG_NS, 'feMergeNode')
  mergeNode1.setAttribute('in', 'coloredBlur')
  const mergeNode2 = document.createElementNS(SVG_NS, 'feMergeNode')
  mergeNode2.setAttribute('in', 'SourceGraphic')

  merge.appendChild(mergeNode1)
  merge.appendChild(mergeNode2)
  filter.appendChild(blur)
  filter.appendChild(merge)
  defs.appendChild(filter)

  return defs
}

/**
 * Create the main SVG element
 */
export function createMenuSvg(radius: number, isDropTarget: boolean): SVGSVGElement {
  const svgSize = radius * 2 + 40
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'ray-menu-svg')
  svg.setAttribute('width', String(svgSize))
  svg.setAttribute('height', String(svgSize))
  svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`)

  if (isDropTarget) {
    svg.style.pointerEvents = 'none'
  }

  svg.appendChild(createSvgDefs())
  return svg
}

/**
 * Create outer ring circle
 */
export function createOuterRing(radius: number): SVGCircleElement {
  const ring = document.createElementNS(SVG_NS, 'circle')
  ring.setAttribute('cx', String(radius + 20))
  ring.setAttribute('cy', String(radius + 20))
  ring.setAttribute('r', String(radius))
  ring.setAttribute('fill', 'none')
  ring.setAttribute('stroke', 'rgba(255,255,255,0.15)')
  ring.setAttribute('stroke-width', '2')
  ring.setAttribute('opacity', '0.5')
  return ring
}

/**
 * Create inner ring circle
 */
export function createInnerRing(
  radius: number,
  innerRadius: number,
  transparent: boolean
): SVGCircleElement {
  const ring = document.createElementNS(SVG_NS, 'circle')
  ring.setAttribute('cx', String(radius + 20))
  ring.setAttribute('cy', String(radius + 20))
  ring.setAttribute('r', String(innerRadius))
  ring.setAttribute('fill', transparent ? 'transparent' : 'rgba(0,0,0,0.85)')
  ring.setAttribute('stroke', 'rgba(255,255,255,0.1)')
  ring.setAttribute('stroke-width', '1')
  return ring
}

/**
 * Create an arc path element for a menu item
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  isHovered: boolean,
  isDisabled: boolean,
  index: number
): SVGPathElement {
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('class', 'ray-menu-arc')
  path.setAttribute('d', describeArc(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle))
  path.setAttribute('fill', isHovered ? 'rgba(100, 180, 255, 0.4)' : 'rgba(50, 50, 60, 0.6)')
  path.setAttribute('stroke', isHovered ? 'rgba(100, 180, 255, 0.7)' : 'rgba(255, 255, 255, 0.1)')
  path.setAttribute('stroke-width', isHovered ? '2' : '1')
  path.setAttribute('opacity', isDisabled ? '0.3' : isHovered ? '1' : '0.6')
  path.setAttribute('data-disabled', String(isDisabled))
  path.setAttribute('data-index', String(index))
  if (isHovered) path.setAttribute('filter', 'url(#glow)')
  return path
}

export interface CreateLabelOptions {
  item: MenuItem
  angle: number
  innerRadius: number
  outerRadius: number
  isHovered: boolean
  isFocused: boolean
  isDropTarget: boolean
  index: number
  showKeyHint: boolean
}

/**
 * Create a label element for a menu item
 */
export function createLabel(options: CreateLabelOptions): HTMLDivElement {
  const {
    item,
    angle,
    innerRadius,
    outerRadius,
    isHovered,
    isFocused,
    isDropTarget,
    index,
    showKeyHint,
  } = options

  const labelPos = toCartesian({ x: 0, y: 0 }, { angle, distance: (innerRadius + outerRadius) / 2 })

  const label = document.createElement('div')
  label.className = 'ray-menu-label'
  label.style.left = `${labelPos.x}px`
  label.style.top = `${labelPos.y}px`

  if (isDropTarget) {
    label.style.pointerEvents = 'none'
  }

  label.setAttribute('data-hovered', String(isHovered))
  label.setAttribute('data-focused', String(isFocused))
  label.setAttribute('data-disabled', String(item.disabled || false))
  label.setAttribute('data-index', String(index))

  // Key hint for keyboard navigation (1-9)
  if (showKeyHint && index < 9) {
    const keyHint = document.createElement('span')
    keyHint.className = 'ray-menu-key-hint'
    keyHint.textContent = String(index + 1)
    label.appendChild(keyHint)
  }

  const labelText = document.createElement('span')
  labelText.textContent = item.label
  label.appendChild(labelText)

  if (item.shortcut) {
    const shortcut = document.createElement('span')
    shortcut.className = 'ray-menu-shortcut'
    shortcut.textContent = item.shortcut
    label.appendChild(shortcut)
  }

  // Show submenu indicator for items with children or loadChildren
  const hasChildren = item.children && item.children.length > 0
  const canLoadChildren = typeof item.loadChildren === 'function'

  if (hasChildren || canLoadChildren) {
    const indicator = document.createElement('span')
    indicator.className = 'ray-menu-submenu-indicator'
    indicator.textContent = '▸'
    label.appendChild(indicator)
  }

  return label
}

/**
 * Create back indicator element for submenu navigation
 */
export function createBackIndicator(innerRadius: number, centerSafeZone: number): HTMLDivElement {
  const backZoneSize = (innerRadius - centerSafeZone) * 2

  const indicator = document.createElement('div')
  indicator.className = 'ray-menu-back-indicator'
  indicator.setAttribute('data-active', 'false')

  const backZone = document.createElement('div')
  backZone.className = 'back-zone'
  backZone.style.width = `${backZoneSize}px`
  backZone.style.height = `${backZoneSize}px`

  const progress = document.createElement('div')
  progress.className = 'back-progress'
  progress.style.width = `${backZoneSize + 6}px`
  progress.style.height = `${backZoneSize + 6}px`

  const icon = document.createElement('div')
  icon.className = 'back-icon'
  icon.textContent = '↩'

  indicator.appendChild(backZone)
  indicator.appendChild(progress)
  indicator.appendChild(icon)

  return indicator
}

/**
 * Render parent menu levels as dimmed concentric rings
 */
export function renderParentLevels(
  svg: SVGSVGElement,
  navStack: NavStackEntry[],
  config: MenuConfig,
  submenuRadiusStep: number,
  svgCenter: number
): void {
  if (navStack.length === 0) return

  navStack.forEach((entry, stackIndex) => {
    const levelRadius = config.radius + stackIndex * submenuRadiusStep
    const levelInnerRadius =
      stackIndex === 0 ? config.innerRadius : config.radius + (stackIndex - 1) * submenuRadiusStep

    const parentItems = entry.items
    const parentAngles = distributeAngles(parentItems.length, config.startAngle, config.sweepAngle)

    const selectedItemIndex = parentItems.findIndex((i) => i.id === entry.item.id)

    parentItems.forEach((_item, index) => {
      const angle = parentAngles[index]
      const segmentAngle = (Math.PI * 2) / parentItems.length
      const gap = 0.05
      const startAngle = angle - segmentAngle / 2 + gap / 2
      const endAngle = angle + segmentAngle / 2 - gap / 2

      const isSelected = index === selectedItemIndex

      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute(
        'd',
        describeArc(svgCenter + 20, svgCenter + 20, levelInnerRadius, levelRadius, startAngle, endAngle)
      )
      path.setAttribute('fill', isSelected ? 'rgba(100, 180, 255, 0.2)' : 'rgba(30, 30, 40, 0.3)')
      path.setAttribute('stroke', isSelected ? 'rgba(100, 180, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)')
      path.setAttribute('stroke-width', '1')
      path.setAttribute('opacity', '0.5')
      svg.appendChild(path)
    })

    // Back arrow indicator
    const backIndicatorAngle = entry.entryAngle + Math.PI
    const backIndicatorRadius = (levelInnerRadius + levelRadius) / 2
    const backIndicatorPos = {
      x: svgCenter + 20 + Math.cos(backIndicatorAngle) * backIndicatorRadius,
      y: svgCenter + 20 + Math.sin(backIndicatorAngle) * backIndicatorRadius,
    }

    const backArrow = document.createElementNS(SVG_NS, 'text')
    backArrow.setAttribute('x', String(backIndicatorPos.x))
    backArrow.setAttribute('y', String(backIndicatorPos.y))
    backArrow.setAttribute('text-anchor', 'middle')
    backArrow.setAttribute('dominant-baseline', 'middle')
    backArrow.setAttribute('fill', 'rgba(255, 255, 255, 0.3)')
    backArrow.setAttribute('font-size', '14')
    backArrow.textContent = '◂'
    svg.appendChild(backArrow)
  })
}
