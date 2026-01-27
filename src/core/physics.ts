/**
 * Physics utilities for smooth animations and interactions
 * Used for drift traces, momentum, and spring animations
 */

import type { Point } from './angle'

export interface Velocity {
  vx: number
  vy: number
}

export interface SpringConfig {
  /** Stiffness coefficient (higher = faster) */
  stiffness: number
  /** Damping coefficient (higher = less bouncy) */
  damping: number
  /** Mass (higher = more momentum) */
  mass: number
}

export interface DriftConfig {
  /** Friction coefficient (0-1, higher = faster stop) */
  friction: number
  /** Minimum velocity before stopping */
  minVelocity: number
}

export const DEFAULT_SPRING: SpringConfig = {
  stiffness: 180,
  damping: 20,
  mass: 1,
}

export const DEFAULT_DRIFT: DriftConfig = {
  friction: 0.92,
  minVelocity: 0.1,
}

/**
 * Calculate velocity from position history
 */
export function calculateVelocity(
  positions: Point[],
  timestamps: number[]
): Velocity {
  if (positions.length < 2) {
    return { vx: 0, vy: 0 }
  }

  const last = positions.length - 1
  const dt = (timestamps[last] - timestamps[last - 1]) / 1000 // Convert to seconds

  if (dt <= 0) {
    return { vx: 0, vy: 0 }
  }

  return {
    vx: (positions[last].x - positions[last - 1].x) / dt,
    vy: (positions[last].y - positions[last - 1].y) / dt,
  }
}

/**
 * Apply drift physics (deceleration over time)
 */
export function applyDrift(
  position: Point,
  velocity: Velocity,
  config: DriftConfig = DEFAULT_DRIFT
): { position: Point; velocity: Velocity; stopped: boolean } {
  const newVelocity: Velocity = {
    vx: velocity.vx * config.friction,
    vy: velocity.vy * config.friction,
  }

  const speed = Math.sqrt(newVelocity.vx ** 2 + newVelocity.vy ** 2)
  const stopped = speed < config.minVelocity

  if (stopped) {
    return {
      position,
      velocity: { vx: 0, vy: 0 },
      stopped: true,
    }
  }

  return {
    position: {
      x: position.x + newVelocity.vx * 0.016, // Assuming 60fps
      y: position.y + newVelocity.vy * 0.016,
    },
    velocity: newVelocity,
    stopped: false,
  }
}

/**
 * Spring physics calculation (single step)
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig = DEFAULT_SPRING,
  dt: number = 0.016
): { value: number; velocity: number } {
  const displacement = current - target
  const springForce = -config.stiffness * displacement
  const dampingForce = -config.damping * velocity
  const acceleration = (springForce + dampingForce) / config.mass

  const newVelocity = velocity + acceleration * dt
  const newValue = current + newVelocity * dt

  return {
    value: newValue,
    velocity: newVelocity,
  }
}

/**
 * 2D spring animation step
 */
export function springStep2D(
  current: Point,
  target: Point,
  velocity: Velocity,
  config: SpringConfig = DEFAULT_SPRING,
  dt: number = 0.016
): { position: Point; velocity: Velocity } {
  const x = springStep(current.x, target.x, velocity.vx, config, dt)
  const y = springStep(current.y, target.y, velocity.vy, config, dt)

  return {
    position: { x: x.value, y: y.value },
    velocity: { vx: x.velocity, vy: y.velocity },
  }
}

/**
 * Check if spring animation has settled
 */
export function isSpringSettled(
  current: Point,
  target: Point,
  velocity: Velocity,
  positionThreshold: number = 0.5,
  velocityThreshold: number = 0.1
): boolean {
  const positionDiff = Math.sqrt(
    (current.x - target.x) ** 2 + (current.y - target.y) ** 2
  )
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2)

  return positionDiff < positionThreshold && speed < velocityThreshold
}

/**
 * Lerp (linear interpolation) between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Lerp between two points
 */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  }
}

/**
 * Ease functions for animations
 */
export const ease = {
  linear: (t: number) => t,
  quadIn: (t: number) => t * t,
  quadOut: (t: number) => t * (2 - t),
  quadInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  cubicOut: (t: number) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elasticOut: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
} as const

/**
 * Drift trace point with timestamp for trail effect
 */
export interface TracePoint extends Point {
  timestamp: number
  opacity: number
}

/**
 * Generate drift trace trail points
 */
export function generateTraceTrail(
  positions: Point[],
  timestamps: number[],
  trailDuration: number = 300, // ms
  maxPoints: number = 20
): TracePoint[] {
  const now = timestamps[timestamps.length - 1] || Date.now()
  const trail: TracePoint[] = []

  for (let i = Math.max(0, positions.length - maxPoints); i < positions.length; i++) {
    const age = now - timestamps[i]
    if (age <= trailDuration) {
      trail.push({
        ...positions[i],
        timestamp: timestamps[i],
        opacity: 1 - age / trailDuration,
      })
    }
  }

  return trail
}
