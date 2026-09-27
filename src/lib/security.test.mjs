import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTrackingNumber, createQueryCode, hashQueryCode, verifyQueryCode, csvCell } from "./security.ts";

describe("tracking credentials", () => {
  it("creates non-identical, readable tracking numbers", () => {
    const a = createTrackingNumber();
    const b = createTrackingNumber();
    assert.match(a, /^TD-[A-Z0-9]{10}$/);
    assert.notEqual(a, b);
  });
  it("stores a hash instead of the query code", () => {
    const code = createQueryCode();
    const hash = hashQueryCode(code);
    assert.equal(hash.includes(code), false);
    assert.equal(verifyQueryCode(code, hash), true);
    assert.equal(verifyQueryCode("wrong", hash), false);
  });
});

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas", () => {
    assert.equal(csvCell('=HYPERLINK("https://example.com")'), '"\'=HYPERLINK(""https://example.com"")"');
  });
});
