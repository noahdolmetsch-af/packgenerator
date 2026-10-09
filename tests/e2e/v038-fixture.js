// v0.38.0 "Heute und Menü": one fictional data set for Today, More, Gear and Bike care (all names
// start with test_data_gtp_). Built from pf-fixture.json: three bikes, the Spark with a history
// (own work, workshop visits, things due), a trip a year ago with a learning, two debriefed past
// trips with items never used (dead weight) and two notes to sort (Inbox).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const P = 'test_data_gtp_';
export const SPARK = `${P}spark`;
export const SCALE = `${P}scale`;
export const GRAVEL = `${P}gravel`;
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
export const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));

export function v038Data() {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const T = fix.tables;
  const spark = T.bikes.find((b) => b.id === SPARK);
  const e = (n, km, over) => ({ date: day(n), km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
  spark.tyreSetup = { front: 'tubeless', rear: 'tubeless' };
  spark.kmDate = day(-2);
  spark.parts = [
    { key: 'chain', model: 'Shimano XT', history: [e(-30, 4900, { action: 'service', result: 'done' }), e(-9, 4950, { value: 0.3 })] },
    { key: 'padsF', model: '', history: [e(-9, 4950, { value: 55 })] },
    { key: 'padsR', model: '', history: [e(-9, 4950, { value: 70 })] },
    { key: 'cassette', model: '', history: [] },
    { key: 'tyres', model: 'Maxxis Rekon', history: [e(-100, 4500, { action: 'service', result: 'done', sealantMl: 60 })] },
    { key: 'bolts', model: '', history: [e(-20, 4930)] },
  ];
  T.visits = [
    { id: `${P}v1`, bikeId: SPARK, date: day(-200), km: 3900, shop: `${P} Velo shop`, totalChf: 129, parts: [{ part: 'cassette', action: 'replace', chf: 129, what: `${P} Kassette` }] },
    { id: `${P}v3`, bikeId: SPARK, date: day(-400), km: 2500, shop: `${P} Velo shop`, parts: [{ part: 'fork', action: 'service', chf: 180 }, { part: 'shock', action: 'service', chf: 150 }] },
  ];
  // Two debriefed rides in the past: the old rain jacket and the down jacket went along, never used.
  const items = (ids) => ids.map((id) => ({ itemId: `${P}${id}`, slot: 'seat', qty: 1, packed: true }));
  const ride = (id, title, n, bikeId, ids) => ({ id: `${P}${id}`, domain: 'bikepacking', title: `${P} ${title}`, startDate: day(n), days: 2, bikeId, bike: T.bikes.find((b) => b.id === bikeId).name, setup: {}, entries: items(ids), ready: [], status: 'done', finished: day(n + 1), createdAt: `${day(n - 5)}T08:00:00.000Z` });
  T.trips.push(
    ride('herbst', 'Herbstrunde', -365, GRAVEL, ['KL13', 'SL04', 'KL05']),
    ride('sommer', 'Sommertour', -90, SPARK, ['KL13', 'SL04', 'KL05', 'WZ01']),
  );
  T.debriefs = [
    { tripId: `${P}herbst`, status: 'done', km: 140, items: { [`${P}KL13`]: 'unused', [`${P}SL04`]: 'unused' }, missing: [], note: '' },
    { tripId: `${P}sommer`, status: 'done', km: 210, items: { [`${P}KL13`]: 'unused', [`${P}SL04`]: 'unused' }, missing: [], note: '' },
  ];
  T.learnings.push({ id: `${P}L2`, topic: 'gear', rule: `${P} Pack the gloves on top`, itemIds: [], source: `${P} Herbstrunde` });
  T.notes = [
    { id: `${P}n1`, text: `${P} Bell rattles`, status: 'open', at: `${day(-1)}T07:00:00.000Z` },
    { id: `${P}n2`, text: `${P} New bottle cage?`, status: 'open', at: `${day(0)}T07:00:00.000Z` },
  ];
  return fix;
}

export function v038File(info) {
  const path = info.outputPath('v038-fixture.json');
  writeFileSync(path, JSON.stringify(v038Data()));
  return path;
}

/** Import the file through "Your data" (Replace all data), German, nothing leaves the preview. */
export async function v038Start(page, context, info, expect, lang = 'de') {
  const file = v038File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((l) => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', l);
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  }, lang);
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = page.locator('details.data');
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(lang === 'de' ? 'Backup importieren' : 'Import backup').setInputFiles(file);
  await data.getByRole('button', { name: lang === 'de' ? 'Alle Daten ersetzen' : 'Replace all data' }).press('Enter');
  await expect(data.getByText(lang === 'de' ? /importiert.*alle Daten ersetzt/i : /replaced all data/i)).toBeVisible();
  return errors;
}
