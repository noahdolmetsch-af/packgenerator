// «Wi gaht's?» window of Heute (Noah 24.11.2026): it opens only when asked («Los» on Heute), one question per screen
// with «Weiter». These helpers open it and walk to a question. Fictional data only.
import { expect } from '@playwright/test';

const WINDOW = 'dialog[data-section="abfragen"]';

/** Press «Start» of the round on Heute (the row of «Up now» or the line of the body tile) and wait for the window. */
export async function openRound(page) {
  const start = page.locator('[data-row="check"] button, [data-body-check] button.btn').first();
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.locator(WINDOW)).toBeVisible();
  return page.locator(WINDOW);
}

/** Like openRound, but without a failure when nothing is due (no start button): returns null then. */
export async function openRoundIfDue(page) {
  const start = page.locator('[data-row="check"] button, [data-body-check] button.btn').first();
  await start.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
  if (!(await start.isVisible().catch(() => false))) return null;
  return openRound(page);
}

/**
 * One tap on «Weiter» or «Zurück», then wait until the screen has moved on. A second tap within about 100 ms of the first is
 * swallowed by the browser in the test (no click event), so each tap waits for its own result and settles a moment.
 */
async function tap(card, key) {
  const step = card.locator('[data-ab-step]');
  const before = await step.innerText();
  for (let t = 0; t < 3; t++) {
    await card.locator(`[data-ab-${key}]`).click();
    const moved = await expect(step).not.toHaveText(before, { timeout: 1500 }).then(() => true, () => false);
    if (moved) {
      await card.page().waitForTimeout(250);
      return;
    }
  }
  throw new Error(`«${key}» did not move the window on`);
}

/** Step with «Weiter» (then «Zurück») until the question is on the screen; returns its locator. */
export async function toQuestion(card, qid, max = 8) {
  const q = card.locator(`[data-q="${qid}"]`);
  for (const key of ['next', 'back']) {
    for (let i = 0; i < max && !(await q.isVisible().catch(() => false)); i++) {
      const btn = card.locator(`[data-ab-${key}]`);
      if (!(await btn.isVisible().catch(() => false))) break;
      await tap(card, key);
    }
  }
  await expect(q).toBeVisible();
  return q;
}

/** Walk with «Weiter» to the last question and press «Speichern». */
export async function saveRound(card) {
  for (let i = 0; i < 8 && !(await card.locator('[data-ab-save]').isVisible().catch(() => false)); i++) {
    if (!(await card.locator('[data-ab-next]').isVisible().catch(() => false))) break;
    await tap(card, 'next');
  }
  await card.locator('[data-ab-save]').click();
}

/** Walk with «Weiter» to the last question (its page also shows the ride line, the links and «more questions»). */
export async function toLastStep(card) {
  for (let i = 0; i < 8 && !(await card.locator('[data-ab-save]').isVisible().catch(() => false)); i++) {
    if (!(await card.locator('[data-ab-next]').isVisible().catch(() => false))) break;
    await tap(card, 'next');
  }
  await expect(card.locator('[data-ab-save]')).toBeVisible();
}

/** Walk through every question of the window and check that none matches the selector (one question per screen). */
export async function notAsked(card, selector) {
  await expect(card).toBeVisible();
  for (let i = 0; i < 10 && (await card.locator('[data-ab-back]').isVisible().catch(() => false)); i++) await tap(card, 'back');
  for (let i = 0; i < 10; i++) {
    await expect(card.locator(selector)).toHaveCount(0);
    if (!(await card.locator('[data-ab-next]').isVisible().catch(() => false))) break;
    await tap(card, 'next');
  }
}
