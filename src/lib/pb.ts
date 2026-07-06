/// <reference types="vite/client" />
import PocketBase from "pocketbase";
import type { Merchant, Profile, Suggestion } from "./types";
import { CATEGORY_IDS } from "../data/categories";

export const PB_URL = import.meta.env.VITE_PB_URL ?? "http://localhost:8090";
export const pb = new PocketBase(PB_URL);

// Long-tail merchant lookup against the backend `merchants` collection (53k VN
// merchants → MCC → category). Used as a fallback when a query isn't in the
// bundled curated set. Backend down / unreachable → [] (search degrades to the
// curated data, never throws).
export function recordToMerchant(rec: Record<string, unknown>): Merchant {
  const cat = typeof rec.category === "string" && CATEGORY_IDS.has(rec.category) ? rec.category : "khac";
  return { name: String(rec.name ?? ""), aliases: [], mcc: String(rec.mcc ?? ""), category: cat };
}

export function merchantsToSuggestions(ms: Merchant[]): Suggestion[] {
  return ms.map((m) => ({ kind: "merchant", label: m.name, categoryId: m.category }));
}

export async function searchMerchants(q: string, limit = 6): Promise<Merchant[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  try {
    const res = await pb.collection("merchants").getList(1, limit, {
      filter: pb.filter("name ~ {:q}", { q: term }),
      skipTotal: true,
    });
    return res.items.map((r) => recordToMerchant(r as unknown as Record<string, unknown>));
  } catch {
    return [];
  }
}

export const DEFAULT_PROFILE: Profile = { owned_cards: [], picks: {} };

export function profileFromRecord(rec: Record<string, unknown>): Profile {
  return {
    owned_cards: Array.isArray(rec.owned_cards) ? (rec.owned_cards as string[]) : [],
    picks: (rec.picks && typeof rec.picks === "object" ? rec.picks : {}) as Profile["picks"],
  };
}

export async function loginWithGoogle(): Promise<Profile> {
  const auth = await pb.collection("users").authWithOAuth2({ provider: "google" });
  return profileFromRecord(auth.record as unknown as Record<string, unknown>);
}

export function logout(): void { pb.authStore.clear(); }
export function isLoggedIn(): boolean { return pb.authStore.isValid; }
export function currentUser() { return pb.authStore.record; }

export async function saveProfile(p: Profile): Promise<void> {
  const id = pb.authStore.record?.id;
  if (!id) throw new Error("not logged in");
  await pb.collection("users").update(id, p);
}

export function loadProfile(): Profile {
  return pb.authStore.record ? profileFromRecord(pb.authStore.record as unknown as Record<string, unknown>) : DEFAULT_PROFILE;
}
