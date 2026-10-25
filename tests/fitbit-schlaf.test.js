// Fitbit sleep stopped at 12 Oct (Noah 22.10.2026): Google sent the nights, but not as civil day and time.
// The wake-up day now also comes from a civil string or from the moment with its offset. Fictional nights.
import { describe, it, expect } from "vitest";
import { civilOf, daysFrom } from "../api/_lib/googledays.js";

const summary = { minutesAsleep: "420", minutesInSleepPeriod: "460" };
const night = (interval) => ({
  sleep: { interval, metadata: { mainSleep: true }, summary },
});

describe("Fitbit sleep: the wake-up day in every form Google sends", () => {
  it("civil day and time as objects", () => {
    expect(
      civilOf(
        {
          civilEndTime: {
            date: { year: 2026, month: 10, day: 21 },
            time: { hours: 7, minutes: 5 },
          },
        },
        "end",
      ),
    ).toEqual({ date: "2026-10-21", time: { hours: 7, minutes: 5 } });
  });
  it("civil time as text", () => {
    expect(civilOf({ civilEndTime: "2026-10-21T07:05:00" }, "end")).toEqual({
      date: "2026-10-21",
      time: { hours: 7, minutes: 5 },
    });
  });
  it("the moment with Google's offset", () => {
    expect(
      civilOf(
        { endTime: "2026-10-20T23:30:00Z", endUtcOffset: "7200s" },
        "end",
      ),
    ).toEqual({ date: "2026-10-21", time: { hours: 1, minutes: 30 } });
  });
  it("only the moment: Zurich time", () => {
    expect(civilOf({ startTime: "2026-10-20T21:15:00Z" }, "start")).toEqual({
      date: "2026-10-20",
      time: { hours: 23, minutes: 15 },
    });
  });
  it("nothing usable gives null", () => {
    expect(civilOf({}, "end")).toBeNull();
    expect(civilOf(undefined, "end")).toBeNull();
  });
  it("a night with only moments lands on its wake-up day, with bed and wake times", () => {
    const days = daysFrom(
      {
        sleep: [
          night({
            startTime: "2026-10-20T21:15:00Z",
            startUtcOffset: "7200s",
            endTime: "2026-10-21T05:05:00Z",
            endUtcOffset: "7200s",
          }),
        ],
      },
      "2026-10-20",
      "2026-10-21",
    );
    const d = days.find((x) => x.date === "2026-10-21");
    expect(d.sleep).toMatchObject({
      asleepMin: 420,
      start: "23:15",
      end: "07:05",
    });
  });
});
