<script>
  /**
   * «Tagebuch» › evening reminder (Noah 20.10.2026 «3a»): once the set time has come (21:00 unless changed
   * in the diary settings) and today has no entry yet, one calm window: «Write» opens a new entry, «Later»
   * asks again in an hour, «Not today» waits until tomorrow (the check-in window of rule 19). Only after the
   * first entry ever, never on the diary itself. The waiting time is kept on this device.
   */
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';
  import { later, notToday } from '../clear/comeback.js';
  import CheckWindow from '../clear/CheckWindow.svelte';
  import { JOURNAL_KEY, KIND, HREF } from './journal.js';
  import { remindDue } from './insights.js';

  let { hash = '' } = $props();
  const KEY = 'tb.remind';
  let show = $state(false);
  const readUntil = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null')?.until ?? null;
    } catch {
      return null;
    }
  };
  const keep = (rec) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(rec));
    } catch {
      /* asks again next time */
    }
  };
  async function check() {
    if (show || hash.startsWith(HREF)) return;
    try {
      const now = new Date();
      const today = localDay(now);
      const cfg = (await db.settings.get(JOURNAL_KEY))?.value ?? {};
      const hasAny = (await db.frei.where('kind').equals(KIND).limit(1).count()) > 0;
      const hasToday = hasAny && (await db.frei.where('day').equals(today).filter((r) => r.kind === KIND).count()) > 0;
      show = remindDue({ cfg, hasAny, hasToday, clock: now.toTimeString().slice(0, 5), now, until: readUntil(), onDiary: location.hash.startsWith(HREF) });
    } catch {
      /* no window */
    }
  }
  $effect(() => {
    check();
    const timer = setInterval(check, 5 * 60_000);
    const vis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', vis);
    return () => (clearInterval(timer), document.removeEventListener('visibilitychange', vis));
  });
  $effect(() => {
    if (hash.startsWith(HREF)) show = false;
  });
</script>

{#if show}
  <CheckWindow id="tbr" section="diary-reminder" title={t('A few lines for your diary?')} sub={t('Today has no entry yet.')}
    main={{ label: t('Write'), onclick: () => ((show = false), (location.hash = `${HREF}?neu`)) }}
    onlater={() => (keep(later({})), (show = false))}
    onnottoday={() => (keep(notToday({})), (show = false))}>
    <p class="tbr">{t('One sentence is enough. You can also dictate it. Turn this off in the diary settings.')}</p>
  </CheckWindow>
{/if}

<style>
  .tbr {
    margin: 0;
    color: var(--ink-2);
  }
</style>
