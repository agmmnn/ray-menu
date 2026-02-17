import { describe, it, expect } from "vitest";
import {
  getAvailableSpace,
  detectEdgeConstraints,
  clampToViewport,
  calculateAngularOffset,
} from "../../src/core/edge";

const viewport = { width: 1024, height: 768 };

describe("getAvailableSpace", () => {
  it("calculates space from center", () => {
    const space = getAvailableSpace({ x: 512, y: 384 }, viewport);
    expect(space.top).toBe(384);
    expect(space.right).toBe(512);
    expect(space.bottom).toBe(384);
    expect(space.left).toBe(512);
  });

  it("respects padding", () => {
    const space = getAvailableSpace({ x: 512, y: 384 }, viewport, 10);
    expect(space.top).toBe(374);
    expect(space.right).toBe(502);
  });

  it("handles corner position", () => {
    const space = getAvailableSpace({ x: 0, y: 0 }, viewport);
    expect(space.top).toBe(0);
    expect(space.left).toBe(0);
    expect(space.right).toBe(1024);
    expect(space.bottom).toBe(768);
  });
});

describe("detectEdgeConstraints", () => {
  it("detects no constraints in center", () => {
    const state = detectEdgeConstraints({ x: 512, y: 384 }, 100, viewport);
    expect(state.isConstrained).toBe(false);
    expect(state.offset.x).toBe(0);
    expect(state.offset.y).toBe(0);
  });

  it("detects left edge constraint", () => {
    const state = detectEdgeConstraints({ x: 50, y: 384 }, 100, viewport);
    expect(state.constrained.left).toBe(true);
    expect(state.offset.x).toBeGreaterThan(0);
    expect(state.isConstrained).toBe(true);
  });

  it("detects right edge constraint", () => {
    const state = detectEdgeConstraints({ x: 980, y: 384 }, 100, viewport);
    expect(state.constrained.right).toBe(true);
    expect(state.offset.x).toBeLessThan(0);
  });

  it("detects top edge constraint", () => {
    const state = detectEdgeConstraints({ x: 512, y: 50 }, 100, viewport);
    expect(state.constrained.top).toBe(true);
    expect(state.offset.y).toBeGreaterThan(0);
  });

  it("detects bottom edge constraint", () => {
    const state = detectEdgeConstraints({ x: 512, y: 730 }, 100, viewport);
    expect(state.constrained.bottom).toBe(true);
    expect(state.offset.y).toBeLessThan(0);
  });

  it("detects corner constraints", () => {
    const state = detectEdgeConstraints({ x: 50, y: 50 }, 100, viewport);
    expect(state.constrained.top).toBe(true);
    expect(state.constrained.left).toBe(true);
  });
});

describe("clampToViewport", () => {
  it("keeps points inside viewport unchanged", () => {
    const point = clampToViewport({ x: 500, y: 400 }, viewport);
    expect(point.x).toBe(500);
    expect(point.y).toBe(400);
  });

  it("clamps negative coordinates", () => {
    const point = clampToViewport({ x: -10, y: -20 }, viewport);
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it("clamps coordinates beyond viewport", () => {
    const point = clampToViewport({ x: 2000, y: 1000 }, viewport);
    expect(point.x).toBe(1024);
    expect(point.y).toBe(768);
  });

  it("respects padding", () => {
    const point = clampToViewport({ x: 0, y: 0 }, viewport, 10);
    expect(point.x).toBe(10);
    expect(point.y).toBe(10);
  });
});

describe("calculateAngularOffset", () => {
  it("returns 0 when no constraints", () => {
    const state = detectEdgeConstraints({ x: 512, y: 384 }, 100, viewport);
    expect(calculateAngularOffset(state)).toBe(0);
  });

  it("returns PI for right-constrained", () => {
    const state = detectEdgeConstraints({ x: 980, y: 384 }, 100, viewport);
    expect(calculateAngularOffset(state)).toBeCloseTo(Math.PI);
  });
});
