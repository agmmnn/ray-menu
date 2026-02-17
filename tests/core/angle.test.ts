import { describe, it, expect } from "vitest";
import {
  angleFromCenter,
  distance,
  distributeAngles,
  getClosestItemIndex,
  normalizeAngle,
  normalizeAngleSigned,
  toDegrees,
  toRadians,
  angleDifference,
  isAngleInSector,
  toPolar,
  toCartesian,
} from "../../src/core/angle";

describe("angleFromCenter", () => {
  it("returns 0 for point to the right", () => {
    expect(angleFromCenter({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
  });

  it("returns PI/2 for point below", () => {
    expect(angleFromCenter({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
      Math.PI / 2,
    );
  });

  it("returns -PI/2 for point above", () => {
    expect(angleFromCenter({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(
      -Math.PI / 2,
    );
  });

  it("returns PI for point to the left", () => {
    expect(
      Math.abs(angleFromCenter({ x: 0, y: 0 }, { x: -1, y: 0 })),
    ).toBeCloseTo(Math.PI);
  });
});

describe("distance", () => {
  it("returns 0 for same point", () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("calculates correct distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("is commutative", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(distance(a, b)).toBe(distance(b, a));
  });
});

describe("distributeAngles", () => {
  it("returns empty for 0 items", () => {
    expect(distributeAngles(0)).toEqual([]);
  });

  it("returns start angle for 1 item", () => {
    expect(distributeAngles(1)).toEqual([-Math.PI / 2]);
  });

  it("distributes 4 items evenly around full circle", () => {
    const angles = distributeAngles(4);
    expect(angles).toHaveLength(4);
    // Each should be PI/2 apart
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i] - angles[i - 1]).toBeCloseTo(Math.PI / 2);
    }
  });

  it("respects custom start angle and sweep", () => {
    const angles = distributeAngles(2, 0, Math.PI);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(Math.PI / 4);
    expect(angles[1]).toBeCloseTo((3 * Math.PI) / 4);
  });
});

describe("getClosestItemIndex", () => {
  it("returns -1 for empty array", () => {
    expect(getClosestItemIndex(0, [])).toBe(-1);
  });

  it("returns 0 for single item", () => {
    expect(getClosestItemIndex(0, [Math.PI])).toBe(0);
  });

  it("finds closest item by angle", () => {
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    expect(getClosestItemIndex(0.1, angles)).toBe(0);
    expect(getClosestItemIndex(Math.PI / 2 + 0.1, angles)).toBe(1);
  });
});

describe("normalizeAngle", () => {
  it("keeps angles in [0, 2PI) unchanged", () => {
    expect(normalizeAngle(1)).toBeCloseTo(1);
  });

  it("wraps negative angles", () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("wraps angles > 2PI", () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });
});

describe("normalizeAngleSigned", () => {
  it("keeps angles in [-PI, PI)", () => {
    expect(normalizeAngleSigned(0)).toBeCloseTo(0);
    expect(normalizeAngleSigned(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });

  it("wraps 3PI/2 to -PI/2", () => {
    expect(normalizeAngleSigned((3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
  });
});

describe("toDegrees / toRadians", () => {
  it("converts radians to degrees", () => {
    expect(toDegrees(Math.PI)).toBeCloseTo(180);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
  });

  it("converts degrees to radians", () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it("round-trips", () => {
    expect(toRadians(toDegrees(1.5))).toBeCloseTo(1.5);
  });
});

describe("angleDifference", () => {
  it("returns 0 for same angle", () => {
    expect(angleDifference(1, 1)).toBeCloseTo(0);
  });

  it("returns shortest path", () => {
    expect(angleDifference(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(angleDifference(0, -Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
  });
});

describe("isAngleInSector", () => {
  it("detects angle in sector", () => {
    expect(isAngleInSector(0.5, 0, Math.PI)).toBe(true);
  });

  it("rejects angle outside sector", () => {
    expect(isAngleInSector(2, 0, 1)).toBe(false);
  });
});

describe("toPolar / toCartesian", () => {
  it("round-trips", () => {
    const center = { x: 0, y: 0 };
    const point = { x: 3, y: 4 };
    const polar = toPolar(center, point);
    const result = toCartesian(center, polar);
    expect(result.x).toBeCloseTo(point.x);
    expect(result.y).toBeCloseTo(point.y);
  });
});
