/**
 * Core module exports
 * Pure TypeScript logic independent of React
 */

// Angle calculations
export {
  angleFromCenter,
  toDegrees,
  toRadians,
  normalizeAngle,
  normalizeAngleSigned,
  distance,
  toPolar,
  toCartesian,
  angleDifference,
  isAngleInSector,
  distributeAngles,
  getClosestItemIndex,
} from "./angle";

// Edge detection
export {
  getAvailableSpace,
  detectEdgeConstraints,
  calculateAngularOffset,
  clampToViewport,
  getSubmenuPosition,
} from "./edge";

// Smart flip logic
export {
  calculateFlipState,
  getFlipStateFromMode,
  calculateSmartFlip,
  getFlipRotationAdjustment,
  adjustAnglesForFlip,
  getOptimalArcDirection,
  DEFAULT_FLIP_CONFIG,
} from "./flip";

// Physics and animations
export {
  calculateVelocity,
  applyDrift,
  springStep,
  springStep2D,
  isSpringSettled,
  lerp,
  lerpPoint,
  ease,
  generateTraceTrail,
  DEFAULT_SPRING,
  DEFAULT_DRIFT,
} from "./physics";

// Types
export * from "./types";
export type { Point, PolarCoord } from "./angle";
export type { Viewport, EdgeState, EdgeConstraints } from "./edge";
export type { FlipState, FlipMode, FlipConfig } from "./flip";
export type {
  Velocity,
  SpringConfig,
  DriftConfig,
  TracePoint,
} from "./physics";
