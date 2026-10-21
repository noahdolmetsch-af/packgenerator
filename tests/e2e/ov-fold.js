// Handy-Längenbudget (20.10.2026): on a phone «Überblick» and «Letzte 7 Tage» of Aktiv wait behind one row
// (Overview.svelte, data-ov-fold); tests that read them open it first. A computer shows them open.
import { expect } from '@playwright/test';

export async function openOverview(page) {
  const fold = page.locator('[data-ov-fold]');
  const open = page.locator('[data-overview]');
  await expect(fold.or(open).first()).toBeVisible();
  if ((await fold.count()) && !(await open.count())) await fold.locator('summary').click();
  await expect(open).toBeVisible();
}
