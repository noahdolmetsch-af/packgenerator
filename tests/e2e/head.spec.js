// v0.98.0 Design-Refresh R2 «Heller Kopf» (G4/G5 A★, Noah 11.10 23:10 «Runde 1 alles ★ und G1–G12
// freigegeben»): the top bar and the sidebar are light; on a phone «Neu» (+) sits in the top bar next to
// the search and the round + over the page is gone; on a computer the sidebar shows the pages of the
// chosen place only and «Ich» is a card at the bottom.
import { test, expect } from './clock.js';
import { PLACE_TABS } from '../../src/lib/nav.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const token = (page, name) =>
  page.evaluate((n) => {
    const probe = document.createElement('div');
    probe.style.background = `var(${n})`;
    document.body.append(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return c;
  }, name);

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('the bars are light; «Neu» is at the top on a phone and in the sidebar on a computer', async ({ page }, info) => {
  await page.goto('./#/gear');
  await expect(page.locator('main')).not.toBeEmpty();
  // no round + over the page any more
  await expect(page.locator('button.fab')).toHaveCount(0);

  if (info.project.name === 'phone') {
    const head = page.locator('header.top');
    expect(await bg(head)).toBe(await bg(page.locator('body')));
    const search = head.getByRole('button', { name: T('Search everything') });
    const plus = head.getByRole('button', { name: T('New'), exact: true });
    const me = head.locator('a.me');
    const [s, p, m] = [await search.boundingBox(), await plus.boundingBox(), await me.boundingBox()];
    // search, then +, then «Ich», in one row at the top, each a 44 px target
    expect(s.x).toBeLessThan(p.x);
    expect(p.x).toBeLessThan(m.x);
    expect(Math.abs(s.y + s.height / 2 - (p.y + p.height / 2))).toBeLessThan(4);
    for (const b of [s, p, m]) expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
    await plus.click();
    await expect(page.locator('dialog.sheet.new')).toBeVisible();
    await page.keyboard.press('Escape');
  } else {
    const side = page.locator('aside.side');
    expect(await bg(side)).toBe(await token(page, '--paper'));
    await expect(side.locator('.logo .mark')).toHaveText('PG');
    await expect(side.locator('.newbtn')).toBeVisible();
    // only the chosen place shows its pages
    await expect(side.locator('.tabs')).toHaveCount(1);
    // «Alles finden 2» (Noah 22.10.2026 «5a»): Vorrat and Ausgeliehen are tabs of Material now (read from nav.js)
    await expect(side.locator('li[data-place="gear"] .tabs a')).toHaveCount(PLACE_TABS.gear.length);
    await expect(side.locator('li[data-place="gear"] .tabs a[aria-current="page"]')).toHaveText(T('All|gear'));
    // «Ich» as a card at the bottom of the sidebar
    const me = side.locator('a.me');
    await expect(me).toContainText(T('Data, Inbox, Help'));
    // measured on the sticky inner column (one screen high): since A-U2 the empty Material page is taller
    // than the screen, and the aside itself grows with the page
    const [mb, sb] = [await me.boundingBox(), await side.locator('.in').boundingBox()];
    expect(sb.y + sb.height - (mb.y + mb.height)).toBeLessThan(24);
    // another place: its pages open, the others close
    await side.locator('li[data-place="trips"] > a.pa').click();
    await expect(side.locator('.tabs')).toHaveCount(1);
    await expect(side.locator('li[data-place="trips"] .tabs')).toBeVisible();
  }
  await noSideways(page);
});
