/**
 * Smart Hybrid Flip Logic
 * Determines optimal menu orientation based on pointer position and viewport constraints
 */

import type { Point } from './angle'
import type { EdgeState } from './edge'
import { normalizeAngleSigned, toDegrees } from './angle'

export type FlipMode = 'none' | 'horizontal' | 'vertical' | 'both'

export interface FlipState {
  mode: FlipMode
  /** Whether horizontal flip is active */
  flipX: boolean
  /** Whether vertical flip is active */
  flipY: boolean
  /** Transform scale values */
  scaleX: number
  scaleY: number
  /** CSS transform string */
  transform: string
}

export interface FlipConfig {
  /** Enable automatic flipping based on position */
  auto: boolean
  /** Threshold (0-1) of viewport width/height before flipping */
  threshold: number
  /** Flip mode preference when auto is false */
  mode: FlipMode
}

export const DEFAULT_FLIP_CONFIG: FlipConfig = {
  auto: true,
  threshold: 0.6,
  mode: 'none',
}

/**
 * Calculate flip state based on menu position relative to viewport
 * Uses "Smart Hybrid" approach: considers both position and available space
 */
export function calculateFlipState(
  position: Point,
  viewportWidth: number,
  viewportHeight: number,
  config: FlipConfig = DEFAULT_FLIP_CONFIG
): FlipState {
  if (!config.auto) {
    return getFlipStateFromMode(config.mode)
  }

  const xRatio = position.x / viewportWidth
  const yRatio = position.y / viewportHeight

  const flipX = xRatio > config.threshold
  const flipY = yRatio > config.threshold

  let mode: FlipMode = 'none'
  if (flipX && flipY) mode = 'both'
  else if (flipX) mode = 'horizontal'
  else if (flipY) mode = 'vertical'

  return getFlipStateFromMode(mode)
}

/**
 * Get flip state from a specific mode
 */
export function getFlipStateFromMode(mode: FlipMode): FlipState {
  const flipX = mode === 'horizontal' || mode === 'both'
  const flipY = mode === 'vertical' || mode === 'both'
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1

  return {
    mode,
    flipX,
    flipY,
    scaleX,
    scaleY,
    transform: `scale(${scaleX}, ${scaleY})`,
  }
}

/**
 * Smart flip calculation that considers edge constraints
 * More sophisticated than simple threshold-based flipping
 */
export function calculateSmartFlip(
  _position: Point,
  _menuRadius: number,
  edgeState: EdgeState
): FlipState {
  const { available, constrained } = edgeState

  // Determine flip based on which side has more space
  const flipX = constrained.right && available.left > available.right
  const flipY = constrained.bottom && available.top > available.bottom

  let mode: FlipMode = 'none'
  if (flipX && flipY) mode = 'both'
  else if (flipX) mode = 'horizontal'
  else if (flipY) mode = 'vertical'

  return getFlipStateFromMode(mode)
}

/**
 * Calculate the rotation angle adjustment needed after flip
 * Ensures menu items maintain their visual order after flipping
 */
export function getFlipRotationAdjustment(flipState: FlipState): number {
  if (flipState.mode === 'both') {
    return Math.PI
  } else if (flipState.flipX) {
    return Math.PI
  } else if (flipState.flipY) {
    return Math.PI
  }
  return 0
}

/**
 * Adjust item angles based on flip state to maintain visual consistency
 */
export function adjustAnglesForFlip(
  angles: number[],
  flipState: FlipState
): number[] {
  if (flipState.mode === 'none') return angles

  return angles.map((angle) => {
    let adjusted = angle

    if (flipState.flipX) {
      // Mirror horizontally: angle -> PI - angle
      adjusted = Math.PI - adjusted
    }

    if (flipState.flipY) {
      // Mirror vertically: angle -> -angle
      adjusted = -adjusted
    }

    return normalizeAngleSigned(adjusted)
  })
}

/**
 * Determine optimal arc direction based on pointer quadrant
 * Returns whether arc should sweep clockwise or counter-clockwise
 */
export function getOptimalArcDirection(
  pointerAngle: number,
  flipState: FlipState
): 'cw' | 'ccw' {
  const degrees = toDegrees(pointerAngle)

  // Default to clockwise, flip to CCW based on quadrant and flip state
  const inLeftHalf = Math.abs(degrees) > 90

  if (flipState.flipX) {
    return inLeftHalf ? 'cw' : 'ccw'
  }

  return inLeftHalf ? 'ccw' : 'cw'
}
