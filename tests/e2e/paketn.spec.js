// Paket N «Pläne und Träume» (19.10.2026): notes linked with each other (#10) and Ich › Was kommt (#68).
// In German, on a phone and a computer: two notes are written, one is linked from the other, the link
// shows on both, «Auf einen Blick» counts it, a #tag searches; Ich › Was kommt shows the packages.
// No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import DE from '../../src/lib/i18n/de/index.js';
import { PACKAGES } from '../../src/lib/wascommt.js';
import { ready } from './settle.js';

// a 2×2 PNG (fictional picture)
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==';
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function prep(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test('notes: link one note with another, the link shows on both', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/notes');
  await ready(page);
  const cap = page.locator('form.cap textarea');
  for (const text of ['test_data_gtp_ Jura #herbst', 'test_data_gtp_ Packliste #herbst']) {
    await cap.fill(text);
    await page.locator('form.cap button[type="submit"]').click();
    await expect(page.locator('li.ncard', { hasText: text.split(' #')[0] })).toHaveCount(1);
  }
  const stats = page.locator('[data-note-stats]');
  await expect(stats).toContainText('#herbst');

  await page.locator('li.ncard', { hasText: 'Jura' }).locator('button').click();
  const sheet = page.locator('dialog.nsheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-note-links]')).toContainText(T('Maybe related'));
  await sheet.getByRole('button', { name: T('Link a note') }).click();
  await sheet.getByRole('searchbox', { name: T('Search a note to link') }).fill('Packliste');
  await sheet.locator('[data-note-links] button', { hasText: 'Packliste' }).click();
  await expect(sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' })).toHaveCount(1);
  await noSideScroll(page);

  // one tap opens the linked note; it shows the link back
  await sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' }).click();
  const other = page.locator('dialog.nsheet');
  await expect(other.locator('#note-h')).toContainText('Packliste');
  await expect(other.locator('[data-note-links]')).toContainText(T('links here'));
  await other.getByRole('button', { name: T('Done') }).click();
  await expect(stats).toContainText(T('{n} notes linked with others').replace('{n}', '2'));

  // a #tag searches
  await stats.getByRole('button', { name: /#herbst/ }).click();
  await expect(page.locator('.notes label.search input')).toHaveValue('#herbst');
  expect(errors).toEqual([]);
});

test('Ich › Was kommt shows the packages', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  await page.locator('a[data-row="next"]').click();
  await expect(page).toHaveURL(/#\/me\/next$/);
  const root = page.locator('[data-page="was-kommt"]');
  await expect(root.locator('h1, h2').first()).toBeVisible();
  await expect(root.locator('[data-package]')).toHaveCount(PACKAGES.length);
  await expect(root.locator('[data-package="N"]')).toContainText(T('Plans and dreams'));
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('Touren › Träume: a dream with its season in the year band', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/trips/dreams');
  await ready(page);
  const root = page.locator('[data-page="dreams"]');
  await root.locator('form.cap input').fill('test_data_gtp_ Furka Pass');
  await root.locator('form.cap button[type="submit"]').click();
  await expect(root.locator('[data-dream]')).toHaveCount(1);
  await expect(root.locator('[data-dream]')).toContainText(T('Alpine passes'));
  // July fits, January does not
  await expect(root.locator('[data-month="7"] .num')).toHaveText('1');
  await expect(root.locator('[data-month="1"] .num')).toHaveText('0');
  await noSideScroll(page);

  await root.locator('[data-dream] button.open').click();
  const sheet = page.locator('dialog.dsheet');
  await sheet.locator('[data-months] button').nth(5).click(); // June on
  await expect(sheet).toContainText(T('chosen by you'));
  // idea 1: a photo and a map from a GPX file
  const pts = Array.from({ length: 30 }, (_, i) => `<trkpt lat="${46.5 + i / 200}" lon="${8.4 + i / 300}"></trkpt>`).join('');
  await sheet.locator('[data-dream-gpx]').setInputFiles({ name: 'test_data_gtp_furka.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(`<gpx><trk><trkseg>${pts}</trkseg></trk></gpx>`) });
  await expect(sheet.locator('[data-dream-map] .smap svg')).toBeVisible();
  await sheet.locator('[data-dream-photo-in]').setInputFiles({ name: 'test_data_gtp_bild.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') });
  await expect(sheet.locator('[data-dream-photo] img')).toBeVisible();
  await noSideScroll(page);
  await sheet.getByRole('button', { name: T('Done') }).click();
  await expect(root.locator('[data-dream] img.thumb')).toBeVisible();
  await expect(root.locator('[data-dream]')).toContainText(' km');
  await expect(root.locator('[data-month="6"] .num')).toHaveText('1');
  await root.locator('[data-month="6"]').click();
  await expect(root.locator('#dr-list')).toContainText(T('Dreams in {month}').replace('{month}', T('Jun|month')));
  await expect(root.locator('[data-races]')).toBeVisible();
  await root.locator('[data-kinds] summary').click();
  await expect(root.locator('[data-kinds]')).toContainText(T('Jura and foothills'));
  expect(errors).toEqual([]);
});

test('Ich › Mein Kompass: a goal gets steps with dates, «Wie läuft\'s?», an idea becomes a goal', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/');
  await ready(page);
  await viaTab(page, 'week', '#/me/compass'); // UI-Ziele #6: Planen › Kompass
  await expect(page).toHaveURL(/#\/me\/compass$/);
  const root = page.locator('[data-page="compass"]');
  await root.locator('[data-goals] form.cap input[type="text"]').first().fill('test_data_gtp_ Alpenbrevet');
  await root.locator('[data-goals] form.cap button[type="submit"]').click();
  const goal = root.locator('article[data-goal]');
  await expect(goal).toHaveCount(1);
  await goal.locator('textarea').fill('Route zeichnen\nTraining planen');
  await goal.getByRole('button', { name: T('Add steps') }).click();
  await expect(goal.locator('.steps li')).toHaveCount(2);
  await expect(goal.locator('[data-ai-steps]')).toHaveCount(0); // AI helper not set up here
  await expect(root.locator('[data-goal-check]')).toBeVisible();
  await root.locator('[data-goal-check]').getByRole('button', { name: T('Going well') }).click();
  await expect(root.locator('[data-goal-check]')).toHaveCount(0);
  await expect(root.locator('[data-on-today]')).toBeChecked();

  const ideas = root.locator('[data-box="ideas"]');
  await ideas.locator('form.addrow input').fill('test_data_gtp_ Ostsee umrunden');
  await ideas.locator('form.addrow button').click();
  await expect(ideas.locator('[data-entry]')).toHaveCount(1);
  await ideas.getByRole('button', { name: T('Make a goal') }).click();
  await expect(root.locator('article[data-goal]')).toHaveCount(2);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('notes: start from a template, read the format, add a sketch and a link', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/notes');
  await ready(page);
  const tpls = page.locator('[data-templates]');
  await expect(tpls.locator('button')).toHaveCount(4);
  await tpls.locator('button').nth(3).click();
  await expect(page.locator('form.cap textarea')).not.toHaveValue('');
  await page.locator('form.cap textarea').fill('test_data_gtp_ Format\n## Kopf\n**fett**');
  await page.locator('form.cap button[type="submit"]').click();
  await page.locator('li.ncard', { hasText: 'Format' }).locator('button').first().click();
  const sheet = page.locator('dialog.nsheet');
  await expect(sheet).toBeVisible();
  // Paket NE 1147: a note is written formatted (no marks); «Write with marks» shows the text with marks,
  // first as a reading view, one tap goes back to editing
  const ed = sheet.locator('[data-rt-edit]');
  await expect(ed.locator('h4, h3')).toHaveText('Kopf');
  await expect(ed.locator('strong')).toHaveText('fett');
  await sheet.locator('[data-edit-mode]').click();
  await expect(sheet.getByRole('textbox', { name: T('Text') })).toHaveValue(/## Kopf/);
  await sheet.locator('[data-edit-mode]').click();
  await expect(ed.locator('strong')).toHaveText('fett');

  // Paket NE 1146: «Sketch» opens the drawing pad (it replaced the small sketch field)
  await sheet.locator('[data-add-sketch]').click();
  const pad = page.locator('dialog[data-draw]');
  const cv = pad.locator('[data-draw-canvas]');
  await expect(cv).toBeVisible();
  const box = await cv.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 60, { steps: 5 });
  await page.mouse.up();
  await pad.locator('[data-draw-save]').click();
  await expect(pad).toHaveCount(0);
  await expect(sheet.locator('[data-note-photo]')).toHaveCount(1);

  for (const u of ['https://example.org/a', 'https://example.org/b']) {
    await sheet.locator('[data-note-adds] button', { hasText: T('Link') }).click();
    await sheet.getByRole('textbox', { name: T('Web address') }).fill(u);
    await sheet.locator('form.lform button[type="submit"]').click();
  }
  await expect(sheet.locator('[data-note-link]')).toHaveCount(2);
  await noSideScroll(page);

  // idea 4 / N15: the note as an article
  await sheet.locator('[data-note-read]').click();
  const reader = page.locator('dialog[data-note-reader]');
  await expect(reader.locator('h1')).toContainText('Format');
  await expect(reader.locator('.md strong')).toHaveText('fett');
  await expect(reader.locator('img')).toHaveCount(1);
  await noSideScroll(page);
  await reader.getByRole('button', { name: T('Edit the note') }).click();
  await expect(reader).toHaveCount(0);
  await expect(sheet).toBeVisible();
  expect(errors).toEqual([]);
});

test('Heute: the next step of a goal in Mein Kompass, ticked off there', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me/compass');
  await ready(page);
  const root = page.locator('[data-page="compass"]');
  await root.locator('[data-goals] form.cap input[type="text"]').first().fill('test_data_gtp_ Rumpf');
  await root.locator('[data-goals] form.cap button[type="submit"]').click();
  const goal = root.locator('article[data-goal]');
  await goal.locator('textarea').fill('Plan schreiben');
  await goal.getByRole('button', { name: T('Add steps') }).click();
  await expect(goal.locator('.steps li')).toHaveCount(1);
  // make the step due today: its date field to today (Europe/Zurich)
  const today = await page.evaluate(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }));
  await page.evaluate((day) => new Promise((res, rej) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const st = r.result.transaction('settings', 'readwrite').objectStore('settings');
      const g = st.get('compass');
      g.onsuccess = () => {
        const v = g.result.value;
        v.goals[0].steps[0].date = day;
        const p = st.put({ key: 'compass', value: v });
        p.onsuccess = () => (r.result.close(), res());
        p.onerror = rej;
      };
    };
  }), today);
  await page.goto('./#/');
  await ready(page);
  const more = page.locator('.imp button.more');
  if (await more.count()) await more.click();
  const row = page.locator('li[data-row="compass"]');
  await expect(row).toContainText('Plan schreiben');
  await row.getByRole('button', { name: T('Done ✓') }).click();
  await expect(page.locator('li[data-row="compass"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
