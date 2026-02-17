import { describe, it, expect } from "vitest";
import {
  calculateFlipState,
  getFlipStateFromMode,
  calculateSmartFlip,
  getFlipRotationAdjustment,
  adjustAnglesForFlip,
  DEFAULT_FLIP_CONFIG,
} from "../../src/core/flip";
import { detectEdgeConstraints } from "../../src/core/edge";

describe("getFlipStateFromMode", () => {
  it("returns no flip for none", () => {
    const state = getFlipStateFromMode("none");
    expect(state.flipX).toBe(false);
    expect(state.flipY).toBe(false);
    expect(state.scaleX).toBe(1);
    expect(state.scaleY).toBe(1);
    expect(state.transform).toBe("scale(1, 1)");
  });

  it("returns horizontal flip", () => {
    const state = getFlipStateFromMode("horizontal");
    expect(state.flipX).toBe(true);
    expect(state.flipY).toBe(false);
    expect(state.scaleX).toBe(-1);
    expect(state.scaleY).toBe(1);
  });

  it("returns vertical flip", () => {
    const state = getFlipStateFromMode("vertical");
    expect(state.flipX).toBe(false);
    expect(state.flipY).toBe(true);
  });

  it("returns both flip", () => {
    const state = getFlipStateFromMode("both");
    expect(state.flipX).toBe(true);
    expect(state.flipY).toBe(true);
    expect(state.scaleX).toBe(-1);
    expect(state.scaleY).toBe(-1);
  });
});

describe("calculateFlipState", () => {
  it("no flip when in top-left area", () => {
    const state = calculateFlipState({ x: 100, y: 100 }, 1024, 768);
    expect(state.mode).toBe("none");
  });

  it("flips horizontally when on right side", () => {
    const state = calculateFlipState({ x: 900, y: 100 }, 1024, 768);
    expect(state.flipX).toBe(true);
  });

  it("flips vertically when on bottom", () => {
    const state = calculateFlipState({ x: 100, y: 600 }, 1024, 768);
    expect(state.flipY).toBe(true);
  });

  it("flips both in bottom-right corner", () => {
    const state = calculateFlipState({ x: 900, y: 600 }, 1024, 768);
    expect(state.mode).toBe("both");
  });

  it("respects non-auto config", () => {
    const state = calculateFlipState({ x: 900, y: 600 }, 1024, 768, {
      ...DEFAULT_FLIP_CONFIG,
      auto: false,
      mode: "horizontal",
    });
    expect(state.mode).toBe("horizontal");
  });
});

describe("calculateSmartFlip", () => {
  const viewport = { width: 1024, height: 768 };

  it("no flip when centered", () => {
    const edge = detectEdgeConstraints({ x: 512, y: 384 }, 100, viewport);
    const state = calculateSmartFlip({ x: 512, y: 384 }, 100, edge);
    expect(state.mode).toBe("none");
  });

  it("flips when constrained on right with more space on left", () => {
    const edge = detectEdgeConstraints({ x: 980, y: 384 }, 100, viewport);
    const state = calculateSmartFlip({ x: 980, y: 384 }, 100, edge);
    expect(state.flipX).toBe(true);
  });
});

describe("getFlipRotationAdjustment", () => {
  it("returns 0 for no flip", () => {
    expect(getFlipRotationAdjustment(getFlipStateFromMode("none"))).toBe(0);
  });

  it("returns PI for horizontal flip", () => {
    expect(
      getFlipRotationAdjustment(getFlipStateFromMode("horizontal")),
    ).toBeCloseTo(Math.PI);
  });

  it("returns PI for both flip", () => {
    expect(
      getFlipRotationAdjustment(getFlipStateFromMode("both")),
    ).toBeCloseTo(Math.PI);
  });
});

describe("adjustAnglesForFlip", () => {
  it("returns same angles for no flip", () => {
    const angles = [0, Math.PI / 2, Math.PI];
    const result = adjustAnglesForFlip(angles, getFlipStateFromMode("none"));
    expect(result).toEqual(angles);
  });

  it("mirrors angles for horizontal flip", () => {
    const angles = [0];
    const result = adjustAnglesForFlip(
      angles,
      getFlipStateFromMode("horizontal"),
    );
    // normalizeAngleSigned returns [-PI, PI), so PI maps to -PI
    expect(Math.abs(result[0])).toBeCloseTo(Math.PI);
  });
});
