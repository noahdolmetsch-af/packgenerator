// Noah 26.10.2026 «1a»: the browser tests on GitHub run in the official Playwright image instead of
// installing Chromium each time. The image must have the same version as @playwright/test, or the
// tests would look for a browser the image does not have. When Playwright is updated, update the
// image tag in .github/workflows/deploy.yml too.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const deploy = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

describe('CI Playwright image', () => {
  const want = (pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test']).replace(/^[^\d]*/, '');
  const tags = [...deploy.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/g)].map((m) => m[1]);

  it('the browser jobs use the image', () => {
    expect(tags.length).toBe(2);
    expect(deploy).not.toContain('playwright install');
  });

  it('every image tag matches @playwright/test', () => {
    for (const tag of tags) expect(tag, 'update the image tag in deploy.yml').toBe(want);
  });
});
