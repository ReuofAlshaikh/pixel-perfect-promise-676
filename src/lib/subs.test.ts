import { describe, expect, it } from "vitest";
import { alerts, displayStatus, totals, type Subscription } from "./subs";

const today = new Date(2026, 10, 3);
const mk = (p: Partial<Subscription>): Subscription => ({
  id: "x", name: "X", plan: "", price: 10, cycle: "monthly", nextRenewal: "2026-11-20", category: "other", ...p,
});

describe("subscription rules", () => {
  it("alerts a renewal exactly 5 days ahead", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-08" })], today)).toHaveLength(1);
  });
  it("does not alert a renewal 6 days ahead", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-09" })], today)).toHaveLength(0);
  });
  it("marks an ending free trial as a trial alert", () => {
    expect(alerts([mk({ nextRenewal: "2026-11-05", trial: true })], today)[0].kind).toBe("trial");
  });
  it("counts yearly plans as price/12 per month", () => {
    expect(totals([mk({ price: 120, cycle: "yearly" })], today).monthly).toBe(10);
  });
  it("excludes canceled and expired from totals", () => {
    const t = totals([mk({ canceled: true }), mk({ nextRenewal: "2026-11-01" }), mk({})], today);
    expect(t.activeCount).toBe(1);
    expect(displayStatus(mk({ nextRenewal: "2026-11-01" }), today)).toBe("expired");
  });
});
