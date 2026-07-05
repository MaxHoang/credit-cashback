import { describe, it, expect } from "vitest";
import { profileFromRecord, DEFAULT_PROFILE } from "../src/lib/pb";

describe("profile mapping", () => {
  it("maps a PocketBase record to a Profile with defaults", () => {
    const p = profileFromRecord({ owned_cards: ["tcb-spark"], picks: { "cake-freedom": { flex: ["an-uong"] } }, default_spend_tier: "m30_100" });
    expect(p.owned_cards).toEqual(["tcb-spark"]);
    expect(p.picks["cake-freedom"].flex).toEqual(["an-uong"]);
    expect(p.default_spend_tier).toBe("m30_100");
  });
  it("falls back to defaults for missing/empty fields", () => {
    const p = profileFromRecord({});
    expect(p).toEqual(DEFAULT_PROFILE);
  });
});
