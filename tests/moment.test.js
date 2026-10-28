// «Heute als Begleiter» PR 1: the moment you are in, and the moment of every function (src/lib/moment.js).
// Dates in calendar days (plain YYYY-MM-DD strings, addDays of phase.js).
import { describe, it, expect } from "vitest";
import {
  momentOf,
  loopOf,
  MOMENTS,
  LOOP,
  BASE,
  FEATURE_MOMENTS,
  momentOfFeature,
  featuresOf,
  PLAN_DAYS,
  BACK_DAYS,
} from "../src/lib/moment.js";
import { addDays } from "../src/lib/phase.js";
import { FEATURES } from "../src/lib/features.js";

const D0 = "2026-10-14"; // a Wednesday
const day = (n) => addDays(D0, n);
const es = (n, packed = 0) =>
  Array.from({ length: n }, (_, k) => ({
    itemId: `i${k}`,
    slot: "seat",
    qty: 1,
    packed: k < packed,
  }));
const trip = (extra = {}) => ({
  id: "test_data_gtp_jura",
  title: "test_data_gtp_ Jura-Runde",
  domain: "bikepacking",
  bikeId: "b1",
  startDate: day(9),
  days: 3,
  entries: es(10),
  status: "planned",
  ...extra,
});
const at = (extra = {}) =>
  momentOf({ today: D0, hour: 14, weekday: 3, ...extra });

describe("momentOf: the rules from top to bottom", () => {
  it("1 Unterwegs: a trip runs today", () => {
    const t = trip({ startDate: day(-1) });
    expect(at({ trips: [t] })).toEqual({ key: "unterwegs", trip: t, rule: 1 });
  });
  it("the start day before packing is finished is still Packen", () => {
    const t = trip({ startDate: D0, entries: es(10, 3) });
    expect(at({ trips: [t] })).toMatchObject({ key: "packen", rule: 3 });
    expect(at({ trips: [{ ...t, packedAt: `${D0}T07:00` }] })).toMatchObject({
      key: "unterwegs",
      rule: 1,
    });
  });
  it("2 Zurück: over with the debrief open, for BACK_DAYS days", () => {
    const t = trip({ startDate: day(-5) }); // ended day(-3)
    expect(at({ trips: [t] })).toMatchObject({
      key: "zurueck",
      trip: t,
      rule: 2,
    });
    expect(at({ trips: [t], debriefDone: () => true }).key).not.toBe("zurueck");
    const old = trip({ startDate: day(-BACK_DAYS - 5) });
    expect(at({ trips: [old] }).key).toBe("lust");
  });
  it("Unterwegs wins over an open debrief", () => {
    const back = trip({ id: "a", startDate: day(-6) });
    const now = trip({ id: "b", startDate: day(-1) });
    expect(at({ trips: [back, now] })).toMatchObject({
      key: "unterwegs",
      trip: now,
    });
  });
  it("3 Packen: two days before the start, or packing has begun", () => {
    expect(at({ trips: [trip({ startDate: day(2) })] })).toMatchObject({
      key: "packen",
      rule: 3,
    });
    expect(at({ trips: [trip({ startDate: day(3) })] }).key).toBe("planen");
    expect(
      at({ trips: [trip({ startDate: day(8), entries: es(10, 1) })] }),
    ).toMatchObject({ key: "packen", rule: 3 });
    expect(at({ trips: [trip({ startDate: day(3) })], packDays: 3 }).key).toBe(
      "packen",
    );
  });
  it("4 Tour planen: a trip with a date in the next PLAN_DAYS days, the soonest one", () => {
    const far = trip({ id: "far", startDate: day(12) });
    const near = trip({ id: "near", startDate: day(6) });
    expect(at({ trips: [far, near] })).toEqual({
      key: "planen",
      trip: near,
      rule: 4,
    });
    expect(at({ trips: [trip({ startDate: day(PLAN_DAYS + 1) })] }).key).toBe(
      "lust",
    );
  });
  it("a skipped trip counts for nothing", () => {
    expect(
      at({ trips: [trip({ startDate: day(1), skipped: true })] }).key,
    ).toBe("lust");
  });
  it("5 Velo und Material: care is due and no trip is near", () => {
    expect(at({ careDue: 4 })).toEqual({ key: "velo", trip: null, rule: 5 });
    expect(at({ careDue: 4, trips: [trip({ startDate: day(1) })] }).key).toBe(
      "packen",
    );
  });
  it("6 Alltag und Woche: Sunday evening or something in the inbox", () => {
    expect(at({ weekday: 0, hour: 17 })).toMatchObject({
      key: "alltag",
      rule: 6,
    });
    expect(at({ weekday: 0, hour: 16 }).key).toBe("lust");
    expect(at({ inbox: 2 })).toMatchObject({ key: "alltag", rule: 6 });
  });
  it("7 Körper und Training: the morning without a trip", () => {
    expect(at({ hour: 6 })).toMatchObject({ key: "koerper", rule: 7 });
    expect(at({ hour: 10 }).key).toBe("koerper");
    expect(at({ hour: 11 }).key).toBe("lust");
  });
  it("8 Lust und Ideen: otherwise, also with no data at all", () => {
    expect(at()).toEqual({ key: "lust", trip: null, rule: 8 });
    expect(momentOf({ today: D0 }).key).toBe("lust");
  });
});

describe("loopOf: the strip Lust › Planen › Packen › Unterwegs › Zurück", () => {
  it("marks what is done and what comes next", () => {
    expect(loopOf("packen")).toEqual({
      done: ["lust", "planen"],
      now: "packen",
      next: "unterwegs",
    });
    expect(loopOf("zurueck").next).toBe(null);
    expect(loopOf("velo")).toBe(null);
    expect(LOOP.every((k) => MOMENTS.includes(k))).toBe(true);
  });
});

describe("FEATURE_MOMENTS: every function of the catalogue has exactly one moment", () => {
  const listed = Object.values(FEATURE_MOMENTS).flat();
  it("uses only the eight moments and the base", () => {
    expect(Object.keys(FEATURE_MOMENTS).sort()).toEqual(
      [...MOMENTS, BASE].sort(),
    );
  });
  it("lists no function twice and none that does not exist", () => {
    const twice = listed.filter((id, i) => listed.indexOf(id) !== i);
    expect(twice).toEqual([]);
    const known = new Set(FEATURES.map((f) => f.id));
    expect(listed.filter((id) => !known.has(id))).toEqual([]);
  });
  it("misses no function (a new one goes in the list of its moment)", () => {
    const have = new Set(listed);
    expect(FEATURES.map((f) => f.id).filter((id) => !have.has(id))).toEqual([]);
  });
  it("answers by id", () => {
    expect(momentOfFeature("f.onion")).toBe("packen");
    expect(momentOfFeature("nope")).toBe(null);
    expect(featuresOf("packen")).toContain("f.onion");
  });
});
