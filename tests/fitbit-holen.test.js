// «Fitbit holt nicht mehr» (Noah 21.10.2026 «fitbit tägliche … werde werden nicht korrekt geliefert»):
// the server step «days» with a fake Redis and a fake Google. Fictional key, tokens and values only.
import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";
import { createDb } from "../src/lib/db.js";
import {
  fetchNow,
  LAST_KEY,
  VALUE_OF,
} from "../src/lib/health/client.svelte.js";
import { HEALTH_KEY, VALUES } from "../src/lib/health.js";
import { autoPick } from "../src/lib/sync/engine.js";
import { fitbitEmpty } from "../src/lib/health/emptyline.js";
import { SCOPES } from "../api/_lib/google.js";
import { MAIL_SCOPES } from "../api/_lib/googlemail.js";
import {
  HEALTH_TOKEN_KEY,
  makeHandler,
  pageSizeOf,
  SCOPES,
  TYPES,
} from "../api/_lib/google.js";
import { hash, KEYS } from "../api/_lib/oauth.js";

const REDIS = "https://redis.example.test";
const DEVICE = "test-device-key-not-real";
const NOW = Date.parse("2026-10-21T08:00:00Z");
const day = (d) => ({ year: 2026, month: 10, day: d });

function world({
  tokens = {
    access_token: "test-access",
    refresh_token: "test-refresh",
    expires_at: NOW + 3_600_000,
  },
  google = {},
  refresh = null,
} = {}) {
  const store = { "google:tokens": JSON.stringify(tokens) };
  const sets = { [KEYS]: new Set([hash(DEVICE)]) };
  const asked = [];
  const refreshed = [];
  const doFetch = vi.fn(async (url, init = {}) => {
    if (url === REDIS) {
      const [cmd, k, ...rest] = JSON.parse(init.body);
      if (cmd === "GET") return Response.json({ result: store[k] ?? null });
      if (cmd === "SET")
        return Response.json({ result: (store[k] = rest[0]) && "OK" });
      if (cmd === "SISMEMBER")
        return Response.json({ result: sets[k]?.has(rest[0]) ? 1 : 0 });
      return Response.json({ result: 1 });
    }
    if (String(url).startsWith("https://oauth2.googleapis.com/token")) {
      refreshed.push(Object.fromEntries(new URLSearchParams(init.body)));
      return refresh
        ? refresh()
        : Response.json({ access_token: "test-fresh", expires_in: 3600 });
    }
    asked.auth = init.headers?.Authorization ?? init.headers?.authorization;
    const u = new URL(url);
    const type = u.pathname.split("/dataTypes/")[1]?.split("/")[0];
    asked.push({ type, pageSize: u.searchParams.get("pageSize") });
    const answer = google[type];
    if (answer?.status)
      return Response.json(answer.json, { status: answer.status });
    if (typeof answer === "number")
      return new Response("no", { status: answer });
    return Response.json(answer ?? {});
  });
  const h = makeHandler({
    env: () => ({
      clientId: "test-id",
      clientSecret: "test-secret",
      redisUrl: REDIS,
      redisToken: "r",
    }),
    doFetch,
    now: () => NOW,
    account: {},
  });
  return { store, asked, refreshed, h };
}
const days = (w) =>
  w.h.main(
    new Request(
      "https://packgen-three.vercel.app/api/google?step=days&from=2026-10-19&to=2026-10-21",
      { headers: { Authorization: `Bearer ${DEVICE}` } },
    ),
  );

describe("Fitbit: the daily fetch on the server", () => {
  it("a value Google refuses no longer stops the others, and the app learns which one", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const w = world({
      google: {
        steps: {
          rollupDataPoints: [
            { civilStartTime: { date: day(20) }, steps: { countSum: "8000" } },
          ],
        },
        sleep: 500,
        "daily-resting-heart-rate": {
          dataPoints: [
            { dailyRestingHeartRate: { date: day(21), beatsPerMinute: "50" } },
          ],
        },
      },
    });
    const res = await days(w);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.missing).toEqual(["sleep"]);
    expect(body.days).toEqual([
      { date: "2026-10-20", steps: 8000 },
      { date: "2026-10-21", restingHr: 50 },
    ]);
    // one line in the log, without values
    expect(log.mock.calls.flat().join(" ")).toContain("missing sleep");
    log.mockRestore();
  });

  it("sleep is asked for 25 nights per page, as Google allows", async () => {
    const w = world();
    await days(w);
    expect(pageSizeOf("sleep")).toBe(25);
    expect(w.asked.find((a) => a.type === "sleep").pageSize).toBe("25");
    expect(
      w.asked.find((a) => a.type === "daily-resting-heart-rate").pageSize,
    ).toBe("200");
  });

  it("Google refuses every value: the app hears «google_scope», the log keeps Google's reason", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const refused = {
      status: 403,
      json: {
        error: {
          code: 403,
          status: "PERMISSION_DENIED",
          message: "Request had insufficient authentication scopes.",
          details: [{ reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }],
        },
      },
    };
    const w = world({
      google: Object.fromEntries(
        TYPES.map((t) => [t, t === "steps" ? refused : 403]),
      ),
    });
    const res = await days(w);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("google_scope");
    const lines = log.mock.calls.flat().join("\n");
    expect(lines).toContain(
      "google health 403 steps: PERMISSION_DENIED ACCESS_TOKEN_SCOPE_INSUFFICIENT Request had insufficient",
    );
    expect(lines).not.toContain("test-access");
    log.mockRestore();
  });

  it("a login Google no longer accepts stops at once with «google_login_needed»", async () => {
    const w = world({
      tokens: {
        access_token: "old",
        refresh_token: "test-refresh",
        expires_at: NOW - 1,
      },
      refresh: () => Response.json({ error: "invalid_grant" }, { status: 400 }),
    });
    const res = await days(w);
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("google_login_needed");
    expect(w.asked).toEqual([]);
  });

  it("the values are fetched with an access that carries only the Health rights", async () => {
    // Google Health refuses an access that also carries Mail, Calendar or Drive (DISALLOWED_OAUTH_SCOPES)
    const w = world({
      tokens: {
        access_token: "test-all-rights",
        refresh_token: "test-refresh",
        expires_at: NOW + 3_600_000,
        scope: [
          ...SCOPES,
          "https://www.googleapis.com/auth/gmail.readonly",
        ].join(" "),
      },
    });
    expect((await days(w)).status).toBe(200);
    expect(w.refreshed).toHaveLength(1);
    expect(w.refreshed[0]).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "test-refresh",
      scope: SCOPES.join(" "),
    });
    expect(w.asked.auth).toBe("Bearer test-fresh");
    // the login for everything else stays as it was
    const kept = JSON.parse(w.store["google:tokens"]);
    expect(kept).toMatchObject({
      access_token: "test-all-rights",
      refresh_token: "test-refresh",
    });
    expect(JSON.parse(w.store[HEALTH_TOKEN_KEY]).expires_at).toBeGreaterThan(
      NOW,
    );
    // a second fetch within the hour reuses the Health access
    await days(w);
    expect(w.refreshed).toHaveLength(1);
  });

  it("no Health rights in the login: the app hears «google_scope»", async () => {
    const w = world({
      refresh: () => Response.json({ error: "invalid_scope" }, { status: 400 }),
    });
    const res = await days(w);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("google_scope");
  });
});

describe("Fitbit: the app remembers how the last fetch went", () => {
  const now = new Date("2026-10-21T07:55:00+02:00");
  const fresh = async () => {
    const db = createDb(`fitbit-holen-${Math.random()}`);
    await db.settings.put({
      key: HEALTH_KEY,
      value: { connected: true, values: ["sleep", "steps"] },
    });
    return db;
  };
  it("a failed fetch stays on this device with its reason, also after a reload", async () => {
    const db = await fresh();
    const err = Object.assign(new Error("x"), { code: "google_login_needed" });
    expect(
      await fetchNow({ db, now, c: async () => Promise.reject(err) }),
    ).toBeNull();
    expect(await db.meta.get(LAST_KEY)).toMatchObject({
      ok: false,
      code: "google_login_needed",
      at: now.toISOString(),
    });
  });
  it("a good fetch says which chosen values Google did not give", async () => {
    const db = await fresh();
    const c = async () => ({
      ok: true,
      days: [{ date: "2026-10-21", steps: 9000, restingHr: 50 }],
      missing: ["sleep", "daily-resting-heart-rate"],
    });
    const res = await fetchNow({ db, now, c });
    // resting heart rate is not chosen here, so only sleep counts as missing
    expect(res.missing).toEqual(["sleep"]);
    expect(await db.meta.get(LAST_KEY)).toMatchObject({
      ok: true,
      code: "",
      missing: ["sleep"],
    });
    expect((await db.settings.get(HEALTH_KEY)).value.lastSync).toBe(
      now.toISOString(),
    );
  });
  it("every server name maps to a value of the app", () => {
    expect([...new Set(Object.values(VALUE_OF))].sort()).toEqual(
      [...VALUES].sort(),
    );
  });
});

describe("Fitbit: two devices", () => {
  it("the fetch marks (also the one-time refetch) never become a question", () => {
    const mine = {
      key: HEALTH_KEY,
      value: {
        connected: true,
        lastSync: "2026-10-21T05:00:00Z",
        until: "2026-10-21",
        fill: 2,
      },
    };
    const theirs = {
      key: HEALTH_KEY,
      value: {
        connected: true,
        lastSync: "2026-10-19T05:00:00Z",
        until: "2026-10-19",
      },
    };
    expect(autoPick("settings", HEALTH_KEY, mine, theirs)).toBe("same");
    expect(autoPick("settings", HEALTH_KEY, theirs, mine)).toBe("same");
  });
});

describe("Fitbit: a later Google login keeps the Fitbit ticks", () => {
  it("connecting Mail asks again for the Fitbit values this login already allows", async () => {
    const w = world({
      tokens: {
        access_token: "a",
        refresh_token: "r",
        expires_at: NOW + 3_600_000,
        scope: [...SCOPES, "openid"].join(" "),
      },
    });
    const res = await w.h.main(
      new Request("https://packgen-three.vercel.app/api/google?step=start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEVICE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services: ["mail"] }),
      }),
    );
    const u = new URL((await res.json()).url);
    const asked = u.searchParams.get("scope").split(" ");
    expect(asked).toEqual(expect.arrayContaining([...MAIL_SCOPES, ...SCOPES]));
    expect(asked).not.toContain("openid");
    expect(u.searchParams.get("include_granted_scopes")).toBe("true");
  });
});

describe("Fitbit: Heute without a value says why", () => {
  it("not connected, a failed fetch, or simply nothing new yet", () => {
    expect(fitbitEmpty({ prefs: { connected: false } })).toMatchObject({
      why: "off",
      href: "#/me/connections",
    });
    expect(
      fitbitEmpty({
        prefs: { connected: true },
        error: "",
        lastTry: { ok: false, code: "google_scope" },
      }),
    ).toMatchObject({
      why: "failed",
      text: "Fitbit is connected, but Google refuses the values right now.",
      href: "#/me/fitbit",
    });
    expect(
      fitbitEmpty({
        prefs: { connected: true },
        error: "network",
        lastTry: null,
      }).text,
    ).toBe("Fitbit is connected, but the last fetch did not work.");
    expect(
      fitbitEmpty({
        prefs: { connected: true },
        lastTry: { ok: true },
        last: { date: "2026-10-19" },
      }),
    ).toMatchObject({ why: "none", date: "2026-10-19" });
  });
});
