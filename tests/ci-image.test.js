// Noah 26.10.2026 «1a»: the browser tests on GitHub run in the official Playwright image instead of
// installing Chromium each time. The image must have the same version as @playwright/test, or the
// tests would look for a browser the image does not have. When Playwright is updated, update the
// image tag in .github/workflows/deploy.yml and volle-pruefung.yml too.
// Noah 27.10.2026 «1a 2a»: pull requests run the phone tests and the Wächter on the computer (deploy.yml),
// main goes online right after the build, and the rest runs after going online (volle-pruefung.yml).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const read = (f) => readFileSync(new URL(`../.github/workflows/${f}`, import.meta.url), 'utf8');
const files = { 'deploy.yml': read('deploy.yml'), 'volle-pruefung.yml': read('volle-pruefung.yml') };
const tagsOf = (s) => [...s.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/g)].map((m) => m[1]);

describe('CI Playwright image', () => {
  const want = (pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test']).replace(/^[^\d]*/, '');

  it('the browser jobs use the image', () => {
    expect(tagsOf(files['deploy.yml']).length).toBe(2); // phone parts + Wächter on the computer
    expect(tagsOf(files['volle-pruefung.yml']).length).toBe(2); // browser tests + Gesamttest
    for (const s of Object.values(files)) expect(s).not.toContain('playwright install');
  });

  it('every image tag matches @playwright/test', () => {
    for (const [f, s] of Object.entries(files)) for (const tag of tagsOf(s)) expect(tag, `update the image tag in ${f}`).toBe(want);
  });
});

describe('Schnellspur (Weg zu online)', () => {
  const deploy = files['deploy.yml'];

  it('going online waits only for the build, and main never cancels a running publish', () => {
    expect(deploy).toMatch(/\n  deploy:\n(?:.*\n)*?    needs: \[build\]\n/);
    expect(deploy).toContain("cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}");
  });

  it('keeps the check names the branch rule asks for', () => {
    expect(deploy).toContain('name: e2e (phone)');
    expect(deploy).toContain('name: e2e (desktop)');
    expect(deploy).toMatch(/\n  build:\n/);
  });

  it('the full tests run after going online and report a red one', () => {
    const v = files['volle-pruefung.yml'];
    expect(v).toContain("workflows: ['Build and deploy']");
    expect(v).toContain('tests/e2e/gesamttest');
    expect(v).toContain('gh issue create');
  });
});
