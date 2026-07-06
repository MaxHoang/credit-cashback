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

  it("maps digital services/goods/streaming to dich-vu-so (Netflix 4899, App Store 5818, apps 5817)", () => {
    expect(mccToCategory("4899")).toBe("dich-vu-so");
    expect(mccToCategory("5815")).toBe("dich-vu-so");
    expect(mccToCategory("5818")).toBe("dich-vu-so");
    expect(mccToCategory("5817")).toBe("dich-vu-so");
    expect(mccToCategory("7832")).toBe("giai-tri"); // physical cinema stays entertainment
  });

  it("does NOT auto-map generic 8999 (Momo/ZaloPay handled via curated entries; 8999 is a catch-all)", () => {
    expect(mccToCategory("8999")).toBeNull();
    expect(mccToCategory("6540")).toBe("vi-dien-tu"); // specific stored-value load code
  });

  it("maps supermarket 5411 → sieu-thi and convenience 5499 → tien-loi (ISO standard)", () => {
    expect(mccToCategory("5411")).toBe("sieu-thi");
    expect(mccToCategory("5499")).toBe("tien-loi");
  });

  it("maps health/education/insurance MCCs correctly", () => {
    expect(mccToCategory("8011")).toBe("suc-khoe-giao-duc");
    expect(mccToCategory("8211")).toBe("suc-khoe-giao-duc");
    expect(mccToCategory("6300")).toBe("bao-hiem");
  });

  it("returns null for genuinely ambiguous / unknown MCCs so curated category wins", () => {
    expect(mccToCategory("5399")).toBeNull(); // general merch
    expect(mccToCategory("5311")).toBeNull(); // department store
    expect(mccToCategory("0000")).toBeNull();
    expect(mccToCategory("")).toBeNull();
  });

  it("only ever returns valid category ids", () => {
    for (const mcc of ["4121", "4899", "5818", "8011", "5541", "5812", "8999", "5411"]) {
      const c = mccToCategory(mcc);
      if (c) expect(CATEGORY_IDS.has(c)).toBe(true);
    }
  });
});

describe("recordToMerchant applies the canonical MCC map over a wrong stored category", () => {
  it("corrects Grab wrongly stored as 'khac' → du-lich via MCC 4121", () => {
    expect(recordToMerchant({ name: "GRAB", mcc: "4121", category: "khac" }).category).toBe("du-lich");
  });
  it("corrects a 5411 merchant stored as tien-loi → sieu-thi (ISO grocery)", () => {
    expect(recordToMerchant({ name: "SOME MART", mcc: "5411", category: "tien-loi" }).category).toBe("sieu-thi");
  });
  it("keeps the stored category for ambiguous MCCs (5399 stays as curated)", () => {
    expect(recordToMerchant({ name: "GEN STORE", mcc: "5399", category: "mua-sam-offline" }).category).toBe("mua-sam-offline");
  });
  it("falls back to khac when neither MCC nor stored category is valid", () => {
    expect(recordToMerchant({ name: "X", mcc: "0000", category: "bogus" }).category).toBe("khac");
  });
});
