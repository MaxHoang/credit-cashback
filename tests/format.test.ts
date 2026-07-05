import { describe, it, expect } from "vitest";
import { formatVnd, formatPct } from "../src/lib/format";

describe("format", () => {
  it("formats VND with dot separators + symbol", () => {
    expect(formatVnd(1299000)).toBe("1.299.000 ₫");
  });
  it("formats zero VND", () => {
    expect(formatVnd(0)).toBe("0 ₫");
  });
  it("formats percent from decimal", () => {
    expect(formatPct(0.1)).toBe("10%");
    expect(formatPct(0.001)).toBe("0,1%");
  });
});
