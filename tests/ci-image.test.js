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

  it('main goes online in one job (one wait for a free computer), and never cancels a running publish', () => {
    const online = deploy.slice(deploy.indexOf('\n  online:'));
    expect(online).toContain("if: github.ref == 'refs/heads/main'");
    expect(online).not.toMatch(/\n    needs:/);
    for (const step of ['npm test', 'npm run build', 'actions/upload-pages-artifact', 'actions/deploy-pages']) expect(online).toContain(step);
    expect(deploy.slice(deploy.indexOf('\njobs:')).match(/\n  [\w-]+:\n/g).map((s) => s.trim())).toEqual(['build:', 'e2e-part:', 'e2e-phone:', 'e2e-desktop:', 'online:']);
    expect(deploy).toContain("cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}");
  });

  it('the phone browser tests of a PR run only with the label «ok» (Noah 28.10.2026 «1a»)', () => {
    const job = (name) => deploy.slice(deploy.indexOf(`\n  ${name}:`), deploy.indexOf('\n\n', deploy.indexOf(`\n  ${name}:`)));
    expect(deploy).toContain('types: [opened, synchronize, reopened, labeled]');
    for (const name of ['e2e-part', 'e2e-phone']) {
      expect(job(name)).toContain("contains(github.event.pull_request.labels.*.name, 'ok')");
      expect(job(name)).toContain("github.event.label.name == 'ok'");
    }
    // the label run never builds or runs the Wächter again, and never cancels the running code check
    for (const name of ['build', 'e2e-desktop']) expect(job(name)).toContain("github.event.action != 'labeled'");
    expect(deploy).toMatch(/group: pages-\$\{\{ github\.ref \}\}\$\{\{ github\.event\.action == 'labeled'/);
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
