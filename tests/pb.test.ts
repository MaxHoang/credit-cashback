import { describe, it, expect } from "vitest";
import { profileFromRecord, DEFAULT_PROFILE } from "../src/lib/pb";

describe("profile mapping", () => {
  it("maps a PocketBase record to a Profile with defaults", () => {
    const p = profileFromRecord({ owned_cards: ["tcb-spark"], picks: { "cake-freedom": { flex: ["an-uong"] } } });
    expect(p.owned_cards).toEqual(["tcb-spark"]);
    expect(p.picks["cake-freedom"].flex).toEqual(["an-uong"]);
  });
  it("falls back to defaults for missing/empty fields", () => {
    const p = profileFromRecord({});
    expect(p).toEqual(DEFAULT_PROFILE);
  });
});
