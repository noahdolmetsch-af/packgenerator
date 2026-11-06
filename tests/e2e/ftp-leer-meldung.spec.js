// «FTP: leeres Feld» (Durchklick Etappe 5, Bericht Frage 1a, Noah 06.11.2026): ein leeres Feld nimmt die eigene FTP weg;
// die Meldung sagt dann «Eigene FTP entfernt», nicht «FTP gespeichert». Erfundene Zahlen, kein echtes Netz.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = (en) => DE[en] ?? en;

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training');
  await ready(page);
  await put(page, { settings: [{ key: 'training.ftp', value: { own: 250 } }] });
  await page.reload();
  await ready(page);
}

test('FTP: ein leeres Feld sagt «Eigene FTP entfernt», eine Zahl «FTP gespeichert»', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context);
  const sec = page.locator('section[aria-labelledby="ftp-h"]');
  const card = sec.locator('[data-section="ftp"]');
  await sec.getByRole('button', { name: new RegExp(`^${T('change')}`) }).click();
  const input = page.locator('[data-ftp-input]');
  await input.fill('260');
  await page.locator('[data-ftp-save]').click();
  await expect(page.getByText(T('FTP saved.'))).toBeVisible();
  await expect(card).toContainText('260');
  await sec.getByRole('button', { name: new RegExp(`^${T('change')}`) }).click();
  await input.fill('');
  await page.locator('[data-ftp-save]').click();
  await expect(page.getByText(T('Own FTP removed.'))).toBeVisible();
  await expect(card).not.toContainText('260');
  expect(errors).toEqual([]);
});
