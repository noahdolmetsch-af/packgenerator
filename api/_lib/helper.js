/**
 * v0.77.0 «KI-Helfer» (Noah's answers 1–8, all ★a, 10.10.2026): the pure parts of POST /api/helper.
 *
 * One prompt and one answer schema per task (trip, search, debrief, checklist, maintenance). The
 * model answers by calling the tool `answer`; its input is checked here before the app sees it:
 * every item, block, bike, note or part id must exist in the request (invented ids are dropped),
 * lists are cut to their size, texts to their length.
 *
 * Forced tool use (tool_choice any/tool) is refused by the current models (Claude Sonnet 5.5 and
 * Opus 5.5 answer 400), so the request uses tool_choice auto with a strict tool and says in the
 * system prompt that the tool is the only way to answer; an answer without the tool is an error.
 *
 * Cost (Noah 7a): estimated from the answer's usage with the price table below (USD per million
 * tokens, Anthropic list prices of October 2026) and a fixed exchange rate. It is an ESTIMATE for the
 * monthly cap, not the invoice: the Anthropic console shows the real bill.
 */

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
/** Noah 15.10.2026 «1b»: the server's monthly cap is CHF 2 unless HELPER_MONTHLY_CHF says otherwise. */
export const DEFAULT_CAP_CHF = 2;
/**
 * Noah 15.10.2026 «2a, wobei nutzer dies ändern kann im frontend»: Sonnet stays the default, the app may
 * ask for one of these instead (Ich › KI-Helfer). Anything else falls back to the server's model.
 */
export const MODEL_CHOICES = ['claude-sonnet-5-5', 'claude-haiku-5-5'];
export const pickModel = (wanted, fallback = DEFAULT_MODEL) => (MODEL_CHOICES.includes(wanted) ? wanted : fallback);
/** Fixed rate for the estimate (USD → CHF), October 2026. */
export const USD_TO_CHF = 0.9;
/** USD per million tokens: input, output. Unknown models count as the most expensive row. */
export const PRICES = {
  'claude-sonnet-5-5': { in: 2, out: 10 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-opus-5-5': { in: 4, out: 20 },
  'claude-opus-5': { in: 5, out: 25 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-haiku-5-5': { in: 0.1, out: 0.5 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'claude-fable-5-1': { in: 10, out: 50 },
};
const WORST = { in: 10, out: 50 };

/** The estimated cost of one answer in CHF (cache writes 1.25×, cache reads 0.1× the input price). */
export function costChf(model, usage = {}) {
  const p = PRICES[model] ?? WORST;
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const input = n(usage.input_tokens) + 1.25 * n(usage.cache_creation_input_tokens) + 0.1 * n(usage.cache_read_input_tokens);
  const usd = (input * p.in + n(usage.output_tokens) * p.out) / 1e6;
  return Math.round(usd * USD_TO_CHF * 1e6) / 1e6;
}

/** The month of a moment in Zurich time: "2026-10". */
export const monthKey = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 7);
export const spendKey = (month) => `helper:spend:${month}`;

/* ---------- small schema helpers (strict tools: every property required, no extra ones) ---------- */
const S = { type: 'string' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const arr = (items) => ({ type: 'array', items });

const COMMON = `You are the packing and bike-care helper inside "Pack Generator", a personal app for bikepacking and travel.
Answer ONLY by calling the tool "answer" exactly once; never answer in plain text.
Write every text in the language given as "lang" ("de" = Swiss Standard German: use "ss", never "ß"; "en" = English).
Keep texts short and concrete, one line each. Everything you give is a suggestion the person can change.
Use only ids that appear in the input. Prefer the person's OWN items (from the input) over generic advice.
Never ask questions back. Never mention that you are an AI.`;

/** The tasks: system prompt, answer schema, effort and output size. */
export const TASKS = {
  trip: {
    effort: 'medium',
    maxTokens: 8000,
    system: `${COMMON}
Task: the person describes a trip in a few words ("question"). Understand it and propose:
- conditions: area (a key of "areas", or "" when unclear), bikeId (an id of "bikes" when a bike is named or clearly fits, else ""), days (whole days, 0 when not said), overnight ("none", "lodging" or "outdoor"; "" when unclear; bivvy and tent are "outdoor"), cook (true only for cooking outdoors), tempMin / tempMax in °C (null when unknown; one temperature given: use it as tempMin and add about 6 °C for tempMax), rain ("rain" when rain is expected, "none" when dry, "" when unknown);
- blocks: keys of "blocks" that fit (at most 4), e.g. a cold block for cold nights;
- items: 4 to 6 extra items from "items" (their ids) that the trip needs beyond the usual list, each with a short reason that starts with the condition it answers (e.g. "weil 5 °C: warm am Lager"). Use the person's learnings when they fit and say so in the reason;
- note: one short sentence or "".`,
    schema: obj({
      conditions: obj({
        area: S,
        bikeId: S,
        days: { type: 'integer' },
        overnight: { type: 'string', enum: ['none', 'lodging', 'outdoor', ''] },
        cook: { type: 'boolean' },
        tempMin: { type: ['number', 'null'] },
        tempMax: { type: ['number', 'null'] },
        rain: { type: 'string', enum: ['none', 'rain', ''] },
      }),
      blocks: arr(S),
      items: arr(obj({ id: S, reason: S })),
      note: S,
    }),
  },
  search: {
    effort: 'low',
    maxTokens: 4000,
    system: `${COMMON}
Task: answer the person's question ("question") in two or three sentences, using their own gear ("items").
Give the answer as segments: plain text segments with itemId "", and each named item as its own segment with its id in itemId and its name as text.
Set suggestTrip to true when the question is about what to pack for a trip.`,
    schema: obj({ answer: arr(obj({ text: S, itemId: S })), suggestTrip: { type: 'boolean' } }),
  },
  debrief: {
    effort: 'medium',
    maxTokens: 6000,
    system: `${COMMON}
Task: after a trip, turn the person's quick notes from the way ("notes") into at most 3 learnings for next time, and draft a summary.
- learnings: each with rule (what was learned, as a short statement, e.g. "Bei 5 °C waren die Handschuhe zu dünn"), action (what to do next time, e.g. "unter 8 °C die Winterhandschuhe einpacken"; prefer the person's own items) and noteKey (the key of the note it comes from, or ""). Skip what an existing learning ("learnings") already says.
- summary: 2 to 3 sentences about how the trip went, from the notes, the trip and what was not used or missing.`,
    schema: obj({ learnings: arr(obj({ rule: S, action: S, noteKey: S })), summary: S }),
  },
  checklist: {
    effort: 'medium',
    maxTokens: 8000,
    system: `${COMMON}
Task: check a packing list ("list") for this trip ("trip") before packing. Give at most 3 hints per group, only real ones (empty groups are fine):
- missing: what is probably missing for these conditions. Prefer an item of "own" (set itemId and its name); only when the person has nothing fitting, give a generic name with itemId "". Reason: why, from the trip (e.g. "Oktober, 3 Tage: Schauer möglich").
- double: two or more list items that do the same job (itemIds), which one to remove (removeId, one of itemIds) and why.
- heavy: a heavy list item (itemId) with a lighter alternative from "own" (altId, or "" when there is none) and a reason that names the alternative and the weight saved.
Use "unusedBefore" (items not used on earlier trips) and "learnings" when they help.`,
    schema: obj({
      missing: arr(obj({ itemId: S, name: S, reason: S })),
      double: arr(obj({ itemIds: arr(S), removeId: S, reason: S })),
      heavy: arr(obj({ itemId: S, altId: S, reason: S })),
    }),
  },
  maintenance: {
    effort: 'medium',
    maxTokens: 8000,
    system: `${COMMON}
Task: maintenance suggestions for one bike ("bike", "parts", "rides", "notes"). For each part that deserves attention give:
- key: the part's key from "parts";
- status: "soon" (due soon), "check" (measure or look now) or "ok" (fine for now; only for a wear part worth a word, e.g. the cassette after a chain change);
- reason: one line from the data: km since the last replacement or service, wet or rainy km, metres climbed, the person's notes and problems, the part's interval. Name the numbers (e.g. "2'850 km seit Wechsel, bei Nässe gefahren");
- check: the concrete check or action, e.g. chain: measure with a chain wear gauge (0.5 % replace on 11/12-speed, 0.75 % at the latest); brake pads: replace below 1 mm pad thickness (a squeal or long descents are reasons to look); rotors: measure against the minimum thickness printed on the rotor; tyres: tread worn flat in the middle, cuts, sidewalls; tubeless sealant: top up after about 3 months (dry in summer); cassette: check at the next chain change (after 2 to 3 chains).
At most 8 parts, the most urgent first. Do not invent parts. This is not a workshop diagnosis: suggest what to check.`,
    schema: obj({
      parts: arr(obj({ key: S, status: { type: 'string', enum: ['soon', 'check', 'ok'] }, reason: S, check: S })),
    }),
  },
  // Paket N #1047 «Hilf mir planen» (Noah 19.10.2026 «5 a und b»): a goal becomes steps with dates.
  steps: {
    effort: 'low',
    maxTokens: 3000,
    system: `${COMMON}
Task: the person has a goal ("goal") they want to reach by a day ("due", YYYY-MM-DD; "today" is today). Split it into 3 to 6 small, concrete steps in a sensible order, each with a date between today and due (YYYY-MM-DD), the first soon.
Leave out what the person already has as a step ("have"). Each step: one short line that starts with a verb, e.g. "Route auf der Karte zeichnen". No health or medical advice.`,
    schema: obj({ steps: arr(obj({ text: S, date: S })) }),
  },
  // Paket L2 «Bilderkennung» (Noah 19.10.2026 «5a und b»): optional, only after a tap in the app, the one
  // photo of laid-out gear goes to the helper (input.picture: { type, data } base64). The default stays the
  // recognition on the device; the photo is not stored anywhere by the app or this server.
  vision: {
    effort: 'low',
    maxTokens: 3000,
    system: `${COMMON}
Task: the input comes with one photo of things laid out (gear, clothes, food) for a trip.
- mode "tick": "items" is the person's packing list (id, name). For every thing you can see on the photo, give found with the id of the list item it is (itemId) and its name; a visible thing that is not on the list gets itemId "" and a short name.
- mode "new": "items" is the gear the person already has. For every thing on the photo give itemId when it clearly is one of these items, else itemId "" and a short, plain name for a new item (e.g. "Stirnlampe", "Daunenjacke").
List each thing once, at most 30. Do not guess things you cannot see. Never describe people.`,
    schema: obj({ found: arr(obj({ itemId: S, name: S })) }),
  },
};
export const TASK_NAMES = Object.keys(TASKS);

/** The photo types the vision task takes, and its largest size (base64 characters). */
export const PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PICTURE_MAX = 1_400_000;
/** The picture of a vision request, checked: { type, data } or null. */
export function pictureOf(input) {
  const p = input?.picture;
  if (!p || typeof p !== 'object' || !PICTURE_TYPES.includes(p.type) || typeof p.data !== 'string') return null;
  if (!p.data.length || p.data.length > PICTURE_MAX || !/^[A-Za-z0-9+/]+=*$/.test(p.data)) return null;
  return { type: p.type, data: p.data };
}

/** The Messages API request for one task (no key in it: the header is added by the caller). */
export function buildRequest(task, input, model = DEFAULT_MODEL) {
  const def = TASKS[task];
  return {
    model,
    max_tokens: def.maxTokens,
    output_config: { effort: def.effort },
    system: def.system,
    tools: [{ name: 'answer', description: `Give the ${task} answer to the app.`, strict: true, input_schema: def.schema }],
    tool_choice: { type: 'auto', disable_parallel_tool_use: true },
    messages: [{ role: 'user', content: task === 'vision' ? visionContent(input) : `Input (JSON):\n${JSON.stringify(input)}` }],
  };
}

/** The vision message: the photo, then the rest of the input as JSON. */
function visionContent(input) {
  const pic = pictureOf(input);
  const { picture, ...rest } = input ?? {};
  return [...(pic ? [{ type: 'image', source: { type: 'base64', media_type: pic.type, data: pic.data } }] : []), { type: 'text', text: `Input (JSON):\n${JSON.stringify(rest)}` }];
}

/* ---------- checking the answer ---------- */
const str = (v, n = 200) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
const list = (v) => (Array.isArray(v) ? v : []);
const ids = (rows, key = 'id') => new Set(list(rows).map((r) => (r && typeof r === 'object' ? String(r[key] ?? '') : '')).filter(Boolean));
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null);
const uniq = (rows, key) => {
  const seen = new Set();
  return rows.filter((r) => (seen.has(r[key]) ? false : (seen.add(r[key]), true)));
};

/** The model's tool input, checked against the request: only known ids, bounded lists and texts. */
export function validate(task, input = {}, out = {}) {
  const o = out && typeof out === 'object' ? out : {};
  if (task === 'trip') {
    const c = o.conditions && typeof o.conditions === 'object' ? o.conditions : {};
    const areas = ids(input.areas, 'key');
    const bikes = ids(input.bikes);
    const blocks = ids(input.blocks, 'key');
    const items = ids(input.items);
    return {
      conditions: {
        area: areas.has(c.area) ? c.area : '',
        bikeId: bikes.has(c.bikeId) ? c.bikeId : '',
        days: num(c.days, 0, 60) ?? 0,
        overnight: ['none', 'lodging', 'outdoor'].includes(c.overnight) ? c.overnight : '',
        cook: c.cook === true,
        tempMin: num(c.tempMin, -30, 45),
        tempMax: num(c.tempMax, -30, 45),
        rain: ['none', 'rain'].includes(c.rain) ? c.rain : '',
      },
      blocks: [...new Set(list(o.blocks).filter((k) => blocks.has(k)))].slice(0, 4),
      items: uniq(list(o.items).filter((r) => r && items.has(r.id)).map((r) => ({ id: r.id, reason: str(r.reason, 160) })), 'id').slice(0, 6),
      note: str(o.note, 200),
    };
  }
  if (task === 'search') {
    const items = ids(input.items);
    const answer = list(o.answer)
      .filter((s) => s && typeof s.text === 'string' && s.text.length)
      .slice(0, 24)
      .map((s) => ({ text: s.text.replace(/\s+/g, ' ').slice(0, 300), itemId: items.has(s.itemId) ? s.itemId : '' }));
    return { answer, suggestTrip: o.suggestTrip === true };
  }
  if (task === 'debrief') {
    const notes = ids(input.notes, 'key');
    const learnings = list(o.learnings)
      .filter((l) => l && str(l.rule))
      .slice(0, 3)
      .map((l) => ({ rule: str(l.rule, 160), action: str(l.action, 200), noteKey: notes.has(l.noteKey) ? l.noteKey : '' }));
    return { learnings, summary: str(o.summary, 700) };
  }
  if (task === 'checklist') {
    const onList = ids(input.list);
    const own = ids(input.own);
    const missing = list(o.missing)
      .map((r) => ({ itemId: own.has(r?.itemId) ? r.itemId : '', name: str(r?.name, 80), reason: str(r?.reason, 160) }))
      .filter((r) => r.itemId || r.name)
      .slice(0, 3);
    const double = list(o.double)
      .map((r) => {
        const its = [...new Set(list(r?.itemIds).filter((id) => onList.has(id)))];
        return { itemIds: its, removeId: its.includes(r?.removeId) ? r.removeId : its.at(-1) ?? '', reason: str(r?.reason, 160) };
      })
      .filter((r) => r.itemIds.length >= 2)
      .slice(0, 3);
    const heavy = list(o.heavy)
      .filter((r) => r && onList.has(r.itemId))
      .map((r) => ({ itemId: r.itemId, altId: own.has(r.altId) ? r.altId : '', reason: str(r.reason, 160) }))
      .slice(0, 3);
    return { missing: uniq(missing.filter((r) => r.itemId), 'itemId').concat(missing.filter((r) => !r.itemId)), double, heavy: uniq(heavy, 'itemId') };
  }
  if (task === 'maintenance') {
    const parts = ids(input.parts, 'key');
    const rows = list(o.parts)
      .filter((p) => p && parts.has(p.key) && ['soon', 'check', 'ok'].includes(p.status))
      .map((p) => ({ key: p.key, status: p.status, reason: str(p.reason, 160), check: str(p.check, 160) }));
    return { parts: uniq(rows, 'key').slice(0, 8) };
  }
  if (task === 'steps') {
    const today = /^\d{4}-\d{2}-\d{2}$/.test(input.today ?? '') ? input.today : '';
    const due = /^\d{4}-\d{2}-\d{2}$/.test(input.due ?? '') ? input.due : '';
    const steps = list(o.steps)
      .filter((x) => x && typeof x.text === 'string' && x.text.trim())
      .map((x) => {
        const d = /^\d{4}-\d{2}-\d{2}$/.test(x.date ?? '') ? x.date : '';
        return { text: str(x.text, 120), date: d && (!today || d >= today) && (!due || d <= due) ? d : '' };
      });
    return { steps: steps.slice(0, 6) };
  }
  if (task === 'vision') {
    const items = new Map(list(input.items).filter((r) => r && typeof r === 'object').map((r) => [String(r.id ?? ''), str(r.name, 80)]));
    const rows = list(o.found)
      .map((r) => {
        const id = items.has(r?.itemId) && r.itemId ? r.itemId : '';
        return { itemId: id, name: id ? items.get(id) : str(r?.name, 80) };
      })
      .filter((r) => r.itemId || r.name);
    return { found: uniq(rows.filter((r) => r.itemId), 'itemId').concat(rows.filter((r) => !r.itemId)).slice(0, 30) };
  }
  return {};
}

/** Keys a request body must never carry (the app never sends them; a second line of defence). */
const FORBIDDEN = /^(photo|photos|image|picture|receipt|receipts|invoice|totalChf|chf|priceChf|code|token|helperCode|health|aktiv)$/i;
export function forbiddenKey(value, depth = 0) {
  if (depth > 8 || !value || typeof value !== 'object') return null;
  for (const [k, v] of Object.entries(value)) {
    if (FORBIDDEN.test(k)) return k;
    if (typeof v === 'string' && v.startsWith('data:')) return k;
    const deep = forbiddenKey(v, depth + 1);
    if (deep) return deep;
  }
  return null;
}
