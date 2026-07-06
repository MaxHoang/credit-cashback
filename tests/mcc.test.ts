import { describe, it, expect } from "vitest";
import { mccToCategory } from "../src/data/mcc";
import { CATEGORY_IDS } from "../src/data/categories";
import { recordToMerchant } from "../src/lib/pb";

describe("mccToCategory (first-principles: cashback follows the merchant's real MCC)", () => {
  it("maps ride-hailing / transport MCCs to du-lich (Grab, Be, Gojek = 4121)", () => {
    expect(mccToCategory("4121")).toBe("du-lich"); // taxis & ride-hailing
    expect(mccToCategory("4111")).toBe("du-lich"); // local transport
    expect(mccToCategory("4511")).toBe("du-lich"); // airlines
  });

  it("maps streaming / digital-media MCCs to giai-tri (Netflix 4899, Spotify/YouTube 5815)", () => {
    expect(mccToCategory("4899")).toBe("giai-tri");
    expect(mccToCategory("5815")).toBe("giai-tri");
    expect(mccToCategory("7832")).toBe("giai-tri"); // cinema
  });

  it("maps digital-goods / software MCCs to mua-sam-online (App Store/Play 5818, apps 5817)", () => {
    expect(mccToCategory("5818")).toBe("mua-sam-online");
    expect(mccToCategory("5817")).toBe("mua-sam-online");
    expect(mccToCategory("5734")).toBe("mua-sam-online"); // computer software
  });

  it("maps health/education/insurance MCCs correctly", () => {
    expect(mccToCategory("8011")).toBe("suc-khoe-giao-duc");
    expect(mccToCategory("8211")).toBe("suc-khoe-giao-duc");
    expect(mccToCategory("6300")).toBe("bao-hiem");
  });

  it("returns null for AMBIGUOUS MCCs so hand-curated category wins (5411 super vs convenience)", () => {
    expect(mccToCategory("5411")).toBeNull();
    expect(mccToCategory("5499")).toBeNull();
    expect(mccToCategory("0000")).toBeNull();
    expect(mccToCategory("")).toBeNull();
  });

  it("only ever returns valid category ids", () => {
    for (const mcc of ["4121", "4899", "5818", "8011", "5541", "5812"]) {
      const c = mccToCategory(mcc);
      if (c) expect(CATEGORY_IDS.has(c)).toBe(true);
    }
  });
});

describe("recordToMerchant applies the canonical MCC map over a wrong stored category", () => {
  it("corrects Grab wrongly stored as 'khac' → du-lich via MCC 4121", () => {
    expect(recordToMerchant({ name: "GRAB", mcc: "4121", category: "khac" }).category).toBe("du-lich");
  });
  it("keeps the stored category for ambiguous MCCs (5411 stays as curated)", () => {
    expect(recordToMerchant({ name: "SOME MART", mcc: "5411", category: "tien-loi" }).category).toBe("tien-loi");
  });
  it("falls back to khac when neither MCC nor stored category is valid", () => {
    expect(recordToMerchant({ name: "X", mcc: "0000", category: "bogus" }).category).toBe("khac");
  });
});
