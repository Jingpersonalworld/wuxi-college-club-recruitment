import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectPages } from "./pagination.ts";

describe("Supabase page collection", () => {
  it("collects records across the default 1000-row API limit", async () => {
    const all = Array.from({ length: 1205 }, (_, i) => i);
    const result = await collectPages((from, to) => Promise.resolve(all.slice(from, to + 1)), 10000, 500);
    assert.equal(result.rows.length, 1205);
    assert.equal(result.truncated, false);
  });
  it("signals truncation instead of silently losing records", async () => {
    const all = Array.from({ length: 1205 }, (_, i) => i);
    const result = await collectPages((from, to) => Promise.resolve(all.slice(from, to + 1)), 1000, 500);
    assert.equal(result.rows.length, 1000);
    assert.equal(result.truncated, true);
  });
});
