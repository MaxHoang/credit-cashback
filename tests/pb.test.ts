import { describe, it, expect, vi } from "vitest";
import { pb, profileFromRecord, saveProfile, DEFAULT_PROFILE } from "../src/lib/pb";

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

describe("saveProfile", () => {
  it("persists to the account and refreshes authStore so picks survive a reload", async () => {
    pb.authStore.save("tok", { id: "u1", owned_cards: [], picks: {} } as never);
    const updated = { id: "u1", owned_cards: ["cake-freedom"], picks: { "cake-freedom": { flex: ["an-uong"] } } };
    const update = vi.fn().mockResolvedValue(updated);
    vi.spyOn(pb, "collection").mockReturnValue({ update } as never);

    await saveProfile({ owned_cards: ["cake-freedom"], picks: { "cake-freedom": { flex: ["an-uong"] } } });

    expect(update).toHaveBeenCalledWith("u1", expect.objectContaining({ owned_cards: ["cake-freedom"] }));
    // authStore now carries the saved picks (what loadProfile reads after a reload)
    expect((pb.authStore.record as unknown as { owned_cards: string[] }).owned_cards).toEqual(["cake-freedom"]);
    pb.authStore.clear();
    vi.restoreAllMocks();
  });
});
