<script>
  /**
   * Paket Q #137 «Stimmt das noch?» (Noah 19.10.2026 «5a»): once a year one window with the values that
   * grow old (yearcheck.js). «Stimmt» ticks one, «Ändern» leads to its place. «Alles geprüft» closes
   * it for a year; «Später» and «Heute nicht» as everywhere (rule 19). Ich › Daten opens it any time.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { YEAR_KEY, OPEN_HASH, startYear, yearDue, yearValues, CHANGES, changeOf } from './yearcheck.js';
  import { later, notToday } from './comeback.js';
  import CheckWindow from './CheckWindow.svelte';

  let { hash = '' } = $props();
  let rec = $state(null);
  let values = $state(null);
  let ok = $state([]);
  // Einzelidee Heute 8: a move or a new sport checks just what it touches
  let change = $state(null);
  const picked = $derived(changeOf(change));
  const asked = $derived(hash.startsWith(OPEN_HASH));

  async function load() {
    const [rider, home, name, docs] = await Promise.all([db.settings.get('riderWeightG'), db.settings.get('homePlace'), db.settings.get('userName'), db.docs?.toArray?.().then((l) => l.filter((d) => !d.noteId)) ?? []]);
    values = yearValues({ riderG: rider?.value ?? null, home: home?.value ?? null, name: typeof name?.value === 'string' ? name.value : '', docs });
    ok = [];
  }
  $effect(() => {
    (async () => {
      const stored = (await db.meta.get(YEAR_KEY))?.rec ?? null;
      const first = startYear(stored);
      if (first) await db.meta.put({ key: YEAR_KEY, rec: first });
      rec = first ?? stored;
      if (yearDue(rec)) await load();
    })();
  });
  $effect(() => {
    if (asked) {
      load();
      const m = hash.match(/change=(\w+)/);
      if (m && changeOf(m[1])) change = m[1];
    }
  });
  const keep = (r) => db.meta.put({ key: YEAR_KEY, rec: r });
  const done = () => keep({ at: new Date().toISOString(), until: null });
  function close() {
    values = null;
    if (asked) history.replaceState(null, '', '#/me/data');
  }
</script>

{#if values}
  <CheckWindow id="yc" section="yearcheck" title={t('Still right?')} sub={t('Once a year: are these values still right?')}
    main={{ label: t('All checked'), onclick: () => (done(), close()) }}
    onlater={() => (keep(later(rec ?? { at: new Date().toISOString() })), close())}
    onnottoday={() => (keep(notToday(rec ?? { at: new Date().toISOString() })), close())}>
    {#if values.length}
      <ul class="yc">
        {#each values as v (v.key)}
          <li data-yc={v.key} class:ok={ok.includes(v.key)}>
            <span class="yc-m"><b>{t(v.label, v.labelVars)}</b><small>{t(v.value, v.vars)}</small></span>
            {#if ok.includes(v.key)}<span class="yc-ok">{t('Right|check')}</span>
            {:else}
              <button type="button" class="btn sm" onclick={() => (ok = [...ok, v.key])}>{t('Still right')}</button>
              <a class="btn sm" href={v.href} onclick={() => (done(), (values = null))}>{t('Change')}</a>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p>{t('Nothing to check: no weight, home place or papers with an end date yet.')}</p>
    {/if}
    <div class="yc-ch" data-yc-change>
      <b>{t('Something changed?')}</b>
      <small>{t('Then check only what it touches.')}</small>
      <div class="yc-row" role="group" aria-label={t('Something changed?')}>
        {#each CHANGES as c (c.key)}<button type="button" class="btn sm" aria-pressed={change === c.key} onclick={() => (change = change === c.key ? null : c.key)} data-yc-change-pick={c.key}>{t(c.name)}</button>{/each}
      </div>
      {#if picked}
        <ul class="yc">
          {#each picked.checks as v (v.key)}
            <li data-yc-life={v.key} class:ok={ok.includes(`${picked.key}:${v.key}`)}>
              <span class="yc-m"><b>{t(v.label)}</b><small>{t(v.hint)}</small></span>
              {#if ok.includes(`${picked.key}:${v.key}`)}<span class="yc-ok">{t('Right|check')}</span>
              {:else}
                <button type="button" class="btn sm" onclick={() => (ok = [...ok, `${picked.key}:${v.key}`])}>{t('Still right')}</button>
                <a class="btn sm" href={v.href} onclick={() => (values = null)}>{t('Change')}</a>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </CheckWindow>
{/if}

<style>
  .yc {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .yc li {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .yc-m {
    display: grid;
    flex: 1;
    min-width: 160px;
  }
  .yc-ch {
    display: grid;
    gap: 6px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .yc-ch > small {
    color: var(--ink-2);
  }
  .yc-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .yc-row [aria-pressed='true'] {
    border-color: var(--hi);
    color: var(--hi);
    font-weight: 600;
  }
  .yc-m small,
  .yc-ok {
    color: var(--ink-2);
  }
</style>
