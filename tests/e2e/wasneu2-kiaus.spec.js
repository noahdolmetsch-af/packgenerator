// v0.118.0 «Was ist neu 2» (mockups W1–W3, Noah 13.10.2026 00:02 «w1-w3 freigeben», answers 1a 2a 3a 4a 5a)
// (the part «KI-Helfer ausblenden» is gone with the removed AI helper, KI entfernen Schritt 7).
// W1: after an update «New since your last visit» shows every version since then fully open, each line a
// link to its place, the small things in their boxes, «Looos ›» to the first place. W2: Ich › Was ist neu with
// the newest version on top, one row «All functions», all versions open by month.
// The lists come from the app source. Fictional data only (home0460-fixture, test_data_gtp_ names), the clock
// on Friday 9 October 2026 (Europe/Zurich); SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { linkOf } from './newsgo-lib.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { BOXES, shortVersion } from '../../src/lib/whatsnew.js';
import { WHATS_NEW } from '../../src/lib/whatsnew-full.js';
import { READY, REMOVED_TILES, wallRecord } from '../../src/lib/home/tiles.js';


async function shot(page, info, name, full = false) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: full });
}
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// v0.127.0 A-U1 (changed on purpose, mockup A-U1, Noah 13.10.2026 answer 3a): the window of W1 became a calm banner
// on Today; every version since the last visit stays fully open under Ich › Was ist neu (W2)
test('W1: after an update a banner names the versions since the last visit, View opens Was ist neu', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  // this device got the update from three versions back (Today checks once when it opens)
  const from = WHATS_NEW[3];
  const since = WHATS_NEW.slice(0, 3);
  await page.goto('./#/me');
  await page.evaluate((v) => localStorage.setItem('whatsnew.seen', v), from.version);
  await page.goto('./#/');
  await expect(page.locator('dialog.news[open]')).toHaveCount(0);
  await expect(page.locator('.wall [data-tile]').first()).toBeVisible();
  // «Banner Was ist neu» (Noah 23.11.2026 «1-5a», changed on purpose): ONE line on Today, «since your last visit», not under Ich
  await expect.poll(() => page.evaluate(() => localStorage.getItem('wasneu.update'))).not.toBeNull();
  const banner = page.locator('[data-news-banner]');
  // «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a», changed on purpose): the line became a small card, the two newest news each with PR,
  // the first test step and the answers; «+N more» for the rest
  await expect(banner.getByRole('heading', { name: T('New since your last visit') })).toBeAttached();
  await expect(banner.locator('[data-news-title]').first()).toContainText(T('New: {title}', { title: T(since[0].title) }));
  await expect(banner.locator('[data-news-item]')).toHaveCount(2);
  await expect(banner.locator('[data-test-works]').first()).toBeVisible();
  await expect(banner.locator('[data-test-fails]').first()).toBeVisible();
  await expect(banner.locator('[data-news-more]')).toContainText(T('+{n} more', { n: since.length - 2 }));
  await noSideways(page);
  await shot(page, info, 'W1-neu-banner');
  await banner.locator('[data-news-title]').first().click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#/me/news');
  // the page holds the newest on top and the versions since then in the open group (SL1: rows by day)
  await expect(page.locator(`article[data-version="${since[0].version}"]`).first()).toBeAttached();
  // «New for you» holds exactly the versions since the last visit and opens every day group (two releases on
  // one day leave the older versions in a closed group otherwise; changed on purpose with 0.147.0)
  await page.locator('[data-only="you"]').click();
  await expect(page.locator('[data-only="you"] .num')).toHaveText(String(since.length));
  for (const e of since.slice(1)) await expect(page.locator(`[data-row="${e.version}"], article[data-version="${e.version}"]`).first()).toBeAttached();
  expect(errors).toEqual([]);
});

test('W2 + SL1: Ich, Was ist neu: the newest on top, one row to all functions, the versions by day, a row opens with its boxes', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me/news');
  await expect(page.getByRole('heading', { level: 1, name: T('What is new') })).toBeVisible();
  await expect(page.locator('main').getByText(new RegExp(T('{n} updates since 0.1 · each with its own text · last {date}', { n: WHATS_NEW.length, date: 'X' }).split('X')[0]))).toBeVisible();
  const top = page.locator('.wn-top');
  await expect(top.getByRole('heading', { level: 2, name: T(WHATS_NEW[0].title) })).toBeVisible();
  // «Ausprobieren» (Noah 27.10.2026 «1a», changed on purpose): a line is a link when it has a place (newsgo-lib.js)
  await expect(top.locator('.vn-pts a')).toHaveCount(WHATS_NEW[0].points.filter((p) => linkOf(p)).length);
  await expect(top.getByRole('link', { name: T('Try it'), exact: true })).toBeVisible();
  await expect(page.locator('a.wn-allrow')).toHaveAttribute('href', '#/me/news?all&sort=new');

  // SL1 (changed on purpose, Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): every version after
  // the newest by day, the five newest days a group each, older days one group; only the newest open
  const days = [...new Set(WHATS_NEW.slice(1).map((e) => e.date))];
  const vers = page.locator('.wn-vers');
  await expect(vers.getByText(T('by day, the newest open'))).toBeVisible();
  const groups = vers.locator('[data-group]');
  await expect(groups).toHaveCount(Math.min(days.length, 6));
  expect(await groups.evaluateAll((els) => els.map((x) => x.dataset.group))).toEqual(days.length > 5 ? [...days.slice(0, 5), 'older'] : days);
  await expect(groups.first()).toHaveClass(/open/);
  await expect(vers.locator('[data-group].open')).toHaveCount(1);
  const inDay = WHATS_NEW.slice(1).filter((e) => e.date === days[0]).length;
  await expect(groups.first().locator('.ls-gh')).toContainText(inDay === 1 ? T('{n} update', { n: 1 }) : T('{n} updates', { n: inDay }));
  // 0.176.0 «Handy kurz» (changed on purpose): on a phone a day shows four rows when it has more than five
  const few = info.project.name === 'phone' ? 4 : 5;
  await expect(groups.first().locator('[data-row]')).toHaveCount(inDay <= few + 1 ? inDay : few);
  // a row opens to its points and its small things in their boxes, «Fixed» tinted
  const e = WHATS_NEW.slice(1).find((x) => x.date === days[0]);
  await vers.locator(`[data-row="${e.version}"]`).click();
  const card = vers.locator(`article[data-version="${e.version}"]`);
  await expect(card.locator('.vn-pts li')).toHaveCount(e.points.length);
  await expect(card.locator('.vn-small li')).toHaveCount(e.small?.length ?? 0);
  for (const b of BOXES) {
    const n = (e.small ?? []).filter((s) => s.box === b.key).length;
    if (n) await expect(card.locator(`.vn-small li[data-box="${b.key}"] .vn-kt`).first()).toHaveText(T(b.label));
  }
  // the older group opens on a tap; the very first version is in it
  await groups.last().locator('.ls-gh').click();
  await expect(groups.last()).toHaveClass(/open/);
  if (days.length > 5) {
    const more = groups.last().locator('.ls-more');
    await more.click();
    await expect(groups.last().locator('[data-row="0.1.0"]')).toBeAttached();
  }
  // the search keeps what fits and opens every group with a find
  await page.getByRole('searchbox', { name: T('Find an update') }).fill(e.version);
  await expect(vers.locator('[data-row]')).toHaveCount(1);
  await page.getByRole('searchbox', { name: T('Find an update') }).fill('');
  await noSideways(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, info, 'W2-alle-versionen');

  // a line of an open row leads to its place
  const withHref = WHATS_NEW.slice(1).find((x) => x.date === days[0] && x.points.some((p) => linkOf(p) && linkOf(p) !== '#/me/news'));
  if (withHref) {
    if (withHref.version !== e.version) await vers.locator(`[data-row="${withHref.version}"]`).click();
    await vers.locator(`article[data-version="${withHref.version}"] .vn-pts a`).first().click();
    // a point with action 'data' opens «Data and backup» (#/me/data) instead of its href (0.186.1);
    // «Ausprobieren» (27.10.2026): the line goes to its own place (newsgo-lib.js linkOf)
    const p0 = withHref.points.find((p) => linkOf(p));
    await expect.poll(() => new URL(page.url()).hash).toBe(p0.action === 'data' ? '#/me/data' : linkOf(p0));
  }
  expect(errors).toEqual([]);
});

test('KI entfernen: an old wall that still holds the removed tile «Helper» shows without it, and nothing breaks', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  const wall = [...READY, ...REMOVED_TILES.map((id) => ({ id, size: 's' }))];
  data.tables.settings.push({ key: 'homeWall', value: wallRecord(wall) });
  await openHome(page, context, info, { data });
  await expect(page.locator('.wall [data-tile="trip"]')).toBeVisible();
  await expect(page.locator(`.wall [data-tile="${REMOVED_TILES[0]}"]`)).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('English: the window reads in English too', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { lang: 'en' });
  await page.goto('./#/me/news');
  // the small things (and their box labels) exist only when the newest version has some; its buttons always read English
  await expect(page.locator('[data-news-try]').first()).toHaveText(T('Try it'));
  if (WHATS_NEW[0].small?.length) await expect(page.locator('.vn-kt').first()).toHaveText(/^(New|Nicer|Fixed|Faster)$/);
  expect(T("Let's go|news")).toBe("Let's go");
});
