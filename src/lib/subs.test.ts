import { describe, expect, it } from "vitest";
import { sortSubs, alerts, displayStatus, totals, type Subscription } from "./subs";

const today = new Date(2026, 10, 3);
const mk = (p: Partial<Subscription>): Subscription => ({
  id: "x", name: "X", plan: "", price: 10, cycle: "monthly", nextRenewal: "2026-11-20", category: "other", ...p,
  it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});

describe("subscription rules", () => {
  it("alerts a renewal exactly 5 days ahead", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-08" })], today)).toHaveLength(1);
    it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
  it("does not alert a renewal 6 days ahead", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-09" })], today)).toHaveLength(0);
    it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
  it("marks an ending free trial as a trial alert", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-05", trial: true })], today)[0].kind).toBe("trial");
    it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
  it("counts yearly plans as price/12 per month", () => {
    expect(totals([mk({ price: 120, cycle: "yearly" })], today).monthly).toBe(10);
    it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
  it("excludes canceled and expired from totals", () => {
    const t = totals([mk({ canceled: true }), mk({ nextRenewal: "2026-11-01" }), mk({})], today);
    expect(t.activeCount).toBe(1);
    expect(displayStatus(mk({ nextRenewal: "2026-11-01" }), today)).toBe("expired");
    it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
  it("renewal sort puts expired and canceled last", () => {
    const out = sortSubs([mk({ id: "e", nextRenewal: "2026-11-01" }), mk({ id: "c", canceled: true, nextRenewal: "2026-11-10" }), mk({ id: "a", nextRenewal: "2026-12-01" })], "renewal", today);
    expect(out.map((s) => s.id)).toEqual(["a", "e", "c"]);
  });
});
