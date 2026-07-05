/// <reference types="vite/client" />
import PocketBase from "pocketbase";
import type { Profile } from "./types";

export const PB_URL = import.meta.env.VITE_PB_URL ?? "http://localhost:8090";
export const pb = new PocketBase(PB_URL);

export const DEFAULT_PROFILE: Profile = { owned_cards: [], picks: {}, default_spend_tier: "m10_30" };

export function profileFromRecord(rec: Record<string, unknown>): Profile {
  return {
    owned_cards: Array.isArray(rec.owned_cards) ? (rec.owned_cards as string[]) : [],
    picks: (rec.picks && typeof rec.picks === "object" ? rec.picks : {}) as Profile["picks"],
    default_spend_tier: (typeof rec.default_spend_tier === "string" && rec.default_spend_tier ? rec.default_spend_tier : "m10_30") as Profile["default_spend_tier"],
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
