// Noah 26.10.2026 «1a»: the browser tests on GitHub run in the official Playwright image instead of
// installing Chromium each time. The image must have the same version as @playwright/test, or the
// tests would look for a browser the image does not have. When Playwright is updated, update the
// image tag in .github/workflows/deploy.yml and volle-pruefung.yml too.
// Noah 27.10.2026 «1a 2a»: pull requests run the phone tests and the Wächter on the computer (deploy.yml),
// main goes online right after the build, and the rest runs at night (volle-pruefung.yml).
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

  it('a «Schwer» PR runs everything only with the label «voll», and «e2e (phone)» stays red without it (Noah 24.11.2026 «a»)', () => {
    const job = (name) => deploy.slice(deploy.indexOf(`\n  ${name}:`), deploy.indexOf('\n\n', deploy.indexOf(`\n  ${name}:`)));
    for (const name of ['e2e-part', 'e2e-phone']) {
      expect(job(name)).toContain("contains(github.event.pull_request.labels.*.name, 'voll')");
      expect(job(name)).toContain("github.event.label.name == 'voll'");
    }
    // the parts hand the label to the scope; the gate asks the scope whether the PR is Schwer
    expect(job('e2e-part')).toContain("contains(github.event.pull_request.labels.*.name, 'voll') && '--voll'");
    expect(job('e2e-phone')).toContain('steps.scope.outputs.schwer == \'yes\' && !contains(github.event.pull_request.labels.*.name, \'voll\')');
    expect(job('e2e-phone')).toContain('exit 1');
  });

  it('keeps the check names the branch rule asks for', () => {
    expect(deploy).toContain('name: e2e (phone)');
    expect(deploy).toContain('name: e2e (desktop)');
    expect(deploy).toMatch(/\n  build:\n/);
  });

  it('the full tests run once a night (not after every merge) and report a red one', () => {
    const v = files['volle-pruefung.yml'];
    expect(v).toContain('schedule:');
    expect(v).not.toContain('workflow_run');
    expect(v).toContain('tests/e2e/gesamttest');
    expect(v).toContain('gh issue create');
  });

  it('a red night run names what is red and the PRs merged since the last green run', () => {
    const v = files['volle-pruefung.yml'];
    expect(v).toContain('Name the suspects');
    expect(v).toContain('gh run list --workflow volle-pruefung.yml --status success');
    expect(v).toContain('actions: read');
  });
});

describe('the night run says what is NEW red (Noah 21.11.2026 «d plus b»)', () => {
  const v = files['volle-pruefung.yml'];
  it('every job leaves the names of its failed tests and the report job compares them with the night before', () => {
    expect(v).toContain('rot-e2e-');
    expect(v).toContain('rot-gesamttest-');
    expect(v).toContain('scripts/nacht-vergleich.mjs');
    expect(v).toContain('name: rot-liste');
  });
  it('an issue that is already open gets a comment (a mail) only for something new', () => {
    expect(v).toContain('NEU');
    expect(v).toContain('Nothing new red since the night before');
  });
});

describe('the night run has as many browser parts as it divides the specs into (Noah 21.11.2026 «1a»)', () => {
  const v = files['volle-pruefung.yml'];
  it('the matrix, the --shard=n/N and the number of lists the report expects agree', () => {
    const n = (/shard: \[([\d, ]+)\]\n    steps:/.exec(v)?.[1] ?? '').split(',').length;
    expect(n).toBe(7);
    expect(v).toContain(`--shard=\${{ matrix.shard }}/${n}`);
    const gesamt = (/shard: \[1, 2\]/.test(v) ? 2 : 0) * 2; // the Gesamttest: phone and computer
    expect(v).toContain(`rot-liste.txt ${n * 2 + gesamt} >`);
  });
});

describe('Probe specs stay out of the CI runs', () => {
  // tests/e2e/tmp-durchklick came onto main with #990 by mistake: 9 probes with 30 to 60 minute timeouts that
  // slowed every phone part. They run only by hand (TMP_DURCHKLICK=1).
  const config = readFileSync(new URL('../playwright.config.js', import.meta.url), 'utf8');
  it('playwright.config.js ignores tmp-durchklick unless TMP_DURCHKLICK is set', () => {
    expect(config).toMatch(/process\.env\.TMP_DURCHKLICK \? \[\] : \['\*\*\/tmp-durchklick\/\*\*'\]/);
  });
  it('no workflow sets TMP_DURCHKLICK', () => {
    for (const s of Object.values(files)) expect(s).not.toContain('TMP_DURCHKLICK');
  });
});

describe('Online-Rot melden (online-rot.yml)', () => {
  // Noah 21.11.2026 «ja»: a red going-online run of main sends a mail at once, a green one closes the issue again.
  const w = read('online-rot.yml');
  it('watches only the finished run of «Build and deploy» on main, never a cancelled one', () => {
    expect(w).toMatch(/workflow_run:\s*\n\s*workflows: \['Build and deploy'\]\s*\n\s*types: \[completed\]\s*\n\s*branches: \[main\]/);
    expect(w).toContain("github.event.workflow_run.event == 'push'");
    expect(w).toContain("conclusion != 'cancelled'");
    expect(readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')).toMatch(/^name: Build and deploy$/m);
  });
  it('opens or comments on a labelled issue when red, closes it when green, with GITHUB_TOKEN only', () => {
    expect(w).toContain('gh issue create');
    expect(w).toContain('gh issue comment');
    expect(w).toContain('gh issue close');
    expect(w).toMatch(/if: env\.CONCLUSION != 'success'/);
    expect(w).toMatch(/if: env\.CONCLUSION == 'success'/);
    expect(w).toMatch(/issues: write/);
    expect(w).not.toMatch(/secrets\./);
  });
  it('never puts the commit text into the script (it goes through the environment)', () => {
    const scripts = w.split('\n').filter((l) => !/^\s*(#|COMMIT_MESSAGE:)/.test(l)).join('\n');
    expect(scripts).not.toContain('head_commit.message');
    expect(w).toMatch(/COMMIT_MESSAGE: \$\{\{ github\.event\.workflow_run\.head_commit\.message \}\}/);
  });
});

describe('the night run keeps a wobbly list (Noah 21.11.2026 «4»)', () => {
  const v = files['volle-pruefung.yml'];
  it('every job leaves the names of its flaky tests next to the red ones, in the same artifact', () => {
    for (const kind of ['e2e', 'gesamttest']) {
      expect(v).toMatch(new RegExp(`test-summary\\.mjs pw-report\\.json [^\\n]*rot-${kind}-[^\\n]* wackel-${kind}-`));
      expect(v).toMatch(new RegExp(`path: \\|\\n\\s+rot-${kind}-[^\\n]*\\n\\s+wackel-${kind}-`));
    }
  });
  it('the report job counts the nights per test, keeps the list between runs, and opens an issue only for a repeated wobbler', () => {
    expect(v).toContain('scripts/wackel-liste.mjs');
    expect(v).toContain('name: wackel-liste');
    expect(v).toContain('gh run download "$id" -n wackel-liste');
    expect(v).toContain('gh issue create --title \'Wackel-Tests');
    expect(v).toContain('[ "${NEU2:-0}" != "0" ] && gh issue comment'); // a mail only when a test reaches its second night
    expect(v).toContain('gh issue close');
  });
  it('the list does not disturb the comparison of the red ones (it counts only rot-*.txt files)', () => {
    expect(v).toContain('rot-liste.txt 18 >');
    expect(readFileSync(new URL('../scripts/nacht-vergleich.mjs', import.meta.url), 'utf8')).toContain("/^rot-.*\\.txt$/");
  });
});
