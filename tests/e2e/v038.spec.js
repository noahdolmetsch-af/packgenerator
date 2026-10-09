// v0.38.0 "Heute und Menü" (Noah's answers 1a-13a): Today's ready light and quick buttons, the menu
// "More", Gear's compact rows with "Compact | With bag" and swipe, and Bike care as one list.
// Fictional data only (test_data_gtp_ names, tests/e2e/v038-fixture.js). Phone and desktop.
// V038_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { P, SPARK, v038Start, day } from './v038-fixture.js';

const db = (page, table, id) =>
  page.evaluate(
    ([table, id]) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction(table).objectStore(table).get(id);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    [table, id],
  );
const chain = async (page) => (await db(page, 'bikes', SPARK)).parts.find((p) => p.key === 'chain').history;
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shot = async (page, info, name, fullPage = false) => {
  if (process.env.V038_SHOTS) await page.screenshot({ path: `${process.env.V038_SHOTS}/${name}-${info.project.name}.png`, fullPage });
};

/** A finger swipe on a row (Chrome DevTools touch events: pointer events with pointerType "touch"). */
async function swipe(page, locator, dx, dy = 0) {
  const box = await locator.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / 12, y: y + (dy * i) / 12 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

// v0.46.0 «Startseite neu» (Noah 24a, 25a): "Bikes ready?" with its quick buttons became small
// bike cards (a dot and always a word, one line, a tap opens Bike care); the quick jobs are
// "Lubed ✓" in "Important today" and the command line (tests/e2e/home-0460.spec.js); "Jump to" is gone.
test('Today: a bike card per bike with a dot and a word; a tap opens its Bike care', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/');
  const cards = page.locator('section.bikes a.bk');
  await expect(cards.first()).toBeVisible();
  // Every bike: a dot and always a word (never colour alone).
  for (const w of await cards.locator('.nm .sr').allTextContents()) expect(w.replace(/^,\s*/, '').trim()).toMatch(/^(Bereit|Bald fällig|Fällig|\d+ fällig|Keine Daten)$/);
  const spark = cards.filter({ hasText: `${P} Scott Spark 960` });
  await expect(spark).toHaveAttribute('href', new RegExp(`tab=care.*bike=${SPARK}`));
  await noSideways(page);
  await shot(page, info, 'heute', true);
  await spark.click();
  await expect(page).toHaveURL(/#\/bikes\?tab=care/);
  expect(errors).toEqual([]);
});

test('More: top right with the Inbox count, grouped, language; the search finds pages', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto('./#/');
  const more = page.locator('.more-btn');
  await expect(more).toHaveAttribute('aria-label', 'Mehr, Inbox: 2 zum Einordnen');
  // v0.47.1 (Noah): only a dot on the button, no number (the count stays in the label).
  await expect(more.locator('.mdot')).toBeVisible();
  await expect(more).not.toContainText('2');
  // The bar has the 4 places and "+"; the profile menu is gone.
  await expect(page.locator('details.profile-menu')).toHaveCount(0);
  await more.click();
  const sheet = page.locator('dialog.more');
  await expect(sheet).toBeVisible();
  for (const g of ['Planen', 'Rückblick', 'Material', 'App']) await expect(sheet.getByRole('heading', { name: g, exact: true })).toBeVisible();
  await expect(sheet.getByRole('link', { name: /Inbox/ })).toContainText('2');
  await noSideways(page);
  await shot(page, info, 'mehr');
  await sheet.getByRole('link', { name: 'Vergangene Touren' }).click();
  await expect(page).toHaveURL(/#\/pack\/past/);
  await expect(sheet).toBeHidden();

  // Language in "More".
  await more.click();
  await sheet.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('.more-btn')).toHaveAttribute('aria-label', 'More, Inbox: 2 to sort');
  await page.keyboard.press('Escape');

  // The search finds pages and actions ("vorl" → Templates).
  // v0.49.0: Past trips has its own search; this is the app search.
  const field = page.getByRole('searchbox', { name: /^What do you want to do/ });
  if (!(await field.isVisible())) await page.getByRole('button', { name: 'Search everything' }).click();
  await field.fill('templ');
  const res = page.getByRole('region', { name: 'Search results' });
  await expect(res.getByRole('button', { name: /^Templates/ })).toBeVisible();
  await res.getByRole('button', { name: /^Templates/ }).click();
  await expect(page).toHaveURL(/#\/pack\/templates/);
  expect(errors).toEqual([]);
});

test('Gear: compact rows, "With bag" remembered; ••• has every action; swipe on a phone', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  // v0.47.2: the rows with swipe and ••• are the list display ("Cards · List")
  await page.evaluate(() => localStorage.setItem('gear.display', 'list'));
  await page.goto(`./#/gear?q=${encodeURIComponent(`${P} Rain`)}`);
  const rows = page.locator('li.gr');
  await expect(rows.first()).toBeVisible();
  await expect(page.locator('li.gr .bg')).toHaveCount(0);
  const seg = page.getByRole('group', { name: 'Tasche zeigen' });
  await expect(seg.getByRole('button', { name: 'Kompakt' })).toHaveAttribute('aria-pressed', 'true');
  await seg.getByRole('button', { name: 'Mit Tasche' }).click();
  await expect(page.locator('li.gr .bg').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('group', { name: 'Tasche zeigen' }).getByRole('button', { name: 'Mit Tasche' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('group', { name: 'Tasche zeigen' }).getByRole('button', { name: 'Kompakt' }).click();
  await noSideways(page);

  // ••• on a used item: Archive, never Delete (that is the red button in the item).
  const jacket = page.locator(`li.gr[data-item="${P}KL05"]`);
  await jacket.getByRole('button', { name: 'Aktionen', exact: true }).click();
  const menu = page.locator('dialog.rowmenu');
  await expect(menu.getByRole('button', { name: /^Archivieren/ })).toBeVisible();
  await expect(menu.getByRole('button', { name: /^Löschen/ })).toHaveCount(0);
  await expect(menu).toContainText(/Auf \d+ Touren? dabei/);
  await menu.getByRole('button', { name: 'Schliessen' }).click();

  if (info.project.name === 'phone') {
    await jacket.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    // Up and down stays the scroll: a vertical move does not open the row.
    await swipe(page, jacket.locator('.face'), 4, 120);
    await expect(jacket).not.toHaveClass(/open/);
    // Right: Favourite and Assign ….
    await swipe(page, jacket.locator('.face'), 160);
    await expect(jacket.getByRole('button', { name: 'Zuordnen …' })).toBeVisible();
    const wasFav = !!(await db(page, 'items', `${P}KL05`)).favorite;
    const favBtn = jacket.getByRole('button', { name: wasFav ? 'Kein Favorit' : 'Favorit', exact: true });
    await expect(favBtn).toBeVisible();
    await shot(page, info, 'material-swipe-rechts');
    await favBtn.click();
    await expect.poll(async () => !!(await db(page, 'items', `${P}KL05`)).favorite).toBe(!wasFav);
    // A long swipe left on a used item archives it (Gone), with Undo.
    await swipe(page, jacket.locator('.face'), -300);
    await expect.poll(async () => (await db(page, 'items', `${P}KL05`)).ownership).toBe('gone');
    await page.getByRole('button', { name: 'Rückgängig' }).click();
    await expect.poll(async () => (await db(page, 'items', `${P}KL05`)).ownership).toBe('owned');
    // An item never on a trip: a short swipe shows Delete; the long swipe deletes, with Undo.
    await page.goto(`./#/gear?q=${encodeURIComponent(`${P} Arm warmers`)}`);
    const warm = page.locator(`li.gr[data-item="${P}KL04"]`);
    // v0.47.2: the views sit above the list; bring the row to the middle, away from the bottom bar
    await warm.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await swipe(page, warm.locator('.face'), -100);
    await expect(warm.getByRole('button', { name: 'Löschen' })).toBeVisible();
    await shot(page, info, 'material-swipe-links');
    await swipe(page, warm.locator('.face'), -300);
    await expect.poll(async () => await db(page, 'items', `${P}KL04`)).toBeUndefined();
    await page.getByRole('button', { name: 'Rückgängig' }).click();
    await expect.poll(async () => (await db(page, 'items', `${P}KL04`))?.name).toBe(`${P} Arm warmers`);
  } else {
    // Computer: the actions are quiet and show written out on hover and keyboard focus.
    const acts = jacket.locator('.acts');
    await page.locator('main h1').first().click(); // the focus leaves the row (back from •••)
    await page.mouse.move(0, 0);
    await expect(acts).toHaveCSS('opacity', '0');
    await jacket.hover();
    await expect(acts).toHaveCSS('opacity', '1');
    await page.mouse.move(0, 0);
    await jacket.locator('button.main').focus();
    await expect(acts).toHaveCSS('opacity', '1');
    await acts.getByRole('button', { name: 'Archivieren' }).click();
    await expect.poll(async () => (await db(page, 'items', `${P}KL05`)).ownership).toBe('gone');
    await page.getByRole('button', { name: 'Rückgängig' }).click();
    await expect.poll(async () => (await db(page, 'items', `${P}KL05`)).ownership).toBe('owned');
  }
  expect(errors).toEqual([]);
});

test('Bike care: one list, due first, "n ok" folded with the names, tyres inside the row', async ({ page, context }, info) => {
  const errors = await v038Start(page, context, info, expect);
  await page.goto(`./#/bikes?tab=care&bike=${SPARK}`);
  const spark = page.locator(`#care-${SPARK}`);
  const rows = spark.locator('li.pt');
  await expect(rows.first()).toBeVisible();
  // Overdue on top.
  await expect(rows.first().locator('.st')).toHaveText('überfällig');
  // The rest folded: "n ok" with the names.
  const fold = spark.locator('.okfold');
  await expect(fold).toHaveText(/\d+ ok/);
  await expect(fold).toContainText('Kette');
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await expect(rows.filter({ has: page.getByRole('button', { name: /^Kette/ }) })).toHaveCount(0);
  await fold.click();
  await expect(rows.filter({ has: page.getByRole('button', { name: /^Kette/ }) })).toHaveCount(1);
  // Tubeless or tube sits inside the expanded tyre row.
  const tyreGroup = spark.getByRole('group', { name: 'Vorne: Schlauch oder tubeless' });
  await expect(tyreGroup).toHaveCount(0);
  await spark.getByRole('button', { name: /^Reifen \+ Dichtmilch/ }).click();
  await expect(tyreGroup.getByRole('button', { name: 'Tubeless' })).toHaveAttribute('aria-pressed', 'true');
  await expect(spark.getByRole('button', { name: 'Erfassen …' })).toBeVisible();
  // The filter: one segmented toggle.
  const seg = page.getByRole('group', { name: 'Teile zeigen' });
  for (const name of ['Alle', 'Fällig', 'von mir', 'Velomech']) await expect(seg.getByRole('button', { name, exact: true })).toBeVisible();
  // Phone: compact rows; computer: a table with the column heads once.
  if (info.project.name === 'desktop') await expect(spark.locator('.th')).toBeVisible();
  else await expect(spark.locator('.th')).toBeHidden();
  await noSideways(page);
  await shot(page, info, 'pflege', true);
  await seg.getByRole('button', { name: 'Fällig', exact: true }).click();
  await expect(spark.locator('.okfold')).toHaveCount(0);
  for (const st of await spark.locator('li.pt .st').allTextContents()) expect(['fällig', 'überfällig', 'Arbeit nötig']).toContain(st.trim());
  await seg.getByRole('button', { name: 'Alle', exact: true }).click();
  expect(errors).toEqual([]);
});
