// Import merchants JSONL into the PocketBase `merchants` collection.
// Usage: PB_URL=... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node backend/import-merchants.mjs [file]
//   IMPORT_LIMIT=500 for a partial test run.
// Requires the `pocketbase` npm package (already a project dependency).
import PocketBase from "pocketbase";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const ADMIN = process.env.PB_ADMIN_EMAIL;
const PW = process.env.PB_ADMIN_PASSWORD;
const FILE = process.argv[2] || "backend/data/merchants.jsonl";
const LIMIT = process.env.IMPORT_LIMIT ? Number(process.env.IMPORT_LIMIT) : Infinity;

if (!ADMIN || !PW) { console.error("Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD"); process.exit(1); }

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(ADMIN, PW);
console.log(`authed as superuser @ ${PB_URL}; importing ${FILE} (limit ${LIMIT})`);

let n = 0, ok = 0, fail = 0;
const rl = createInterface({ input: createReadStream(FILE), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  if (n >= LIMIT) break;
  n++;
  let m;
  try { m = JSON.parse(line); } catch { fail++; continue; }
  try {
    await pb.collection("merchants").create({ name: m.name, mcc: m.mcc || "", category: m.category || "khac", method: m.method || "" });
    ok++;
  } catch (e) {
    fail++;
    if (fail <= 5) console.error("  create failed:", m.name, "-", e?.message || e);
  }
  if (n % 1000 === 0) console.log(`  ${n} processed … ok=${ok} fail=${fail}`);
}
console.log(`done: ${n} processed, ok=${ok}, fail=${fail}`);
