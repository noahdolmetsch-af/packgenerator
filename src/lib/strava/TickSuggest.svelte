<script>
  /**
   * Package G #156 (Noah 19.10.2026 «1a», switchable to «erst vorschlagen»): the Strava activities that
   * wait for «Zählen» or «Nicht zählen», when ticking is set to «suggest first». Shown on Aktiv and on
   * Ich › Verbindungen; nothing shows when nothing waits.
   */
  import { liveQuery } from 'dexie';
  import { Check, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { OPEN_KEY, answer } from '../stravaticks.js';
  import { actName } from '../flow/ui.svelte.js';
  import { dayShort } from '../flow/words.js';
  import { t, tn } from '../i18n.svelte.js';

  let { link = true } = $props();
  const q = liveQuery(async () => ({ open: (await db.settings.get(OPEN_KEY))?.value ?? [], acts: await db.flowActs.toArray() }));
  const open = $derived(($q?.open ?? []).slice().sort((a, b) => b.day.localeCompare(a.day)));
  const actOf = (id) => ($q?.acts ?? []).find((a) => a.id === id);
  let busy = $state('');
  async function go(id, take) {
    busy = id;
    try {
      await answer(id, take);
    } finally {
      busy = '';
    }
  }
</script>

{#if open.length}
  <section class="ts card" aria-labelledby="ts-h" data-section="strava-suggest">
    <h3 id="ts-h">{tn(open.length, 'From Strava: {n} activity to count?', 'From Strava: {n} activities to count?')}</h3>
    <ul>
      {#each open.slice(0, 8) as s (s.id)}
        <li data-suggest={s.id}>
          <span class="m"><b>{actName(actOf(s.actId)) || s.actId}</b><small>{dayShort(s.day)}{s.name ? ` · ${s.name}` : ''}{s.min ? ` · ${t('{n} min', { n: s.min })}` : ''}</small></span>
          <button type="button" class="btn sm hi" disabled={busy === s.id} onclick={() => go(s.id, true)}><Check size={16} aria-hidden="true" />{t('Count|tick')}</button>
          <button type="button" class="btn sm" disabled={busy === s.id} onclick={() => go(s.id, false)} aria-label={t('Do not count')}><X size={16} aria-hidden="true" /><span class="ts-lbl">{t('Do not count')}</span></button>
        </li>
      {/each}
    </ul>
    {#if link}<a class="link" href="#/me/connections">{t('Tick by itself instead: Me › Connections')}</a>{/if}
  </section>
{/if}

<style>
  .ts {
    display: grid;
    gap: var(--s2, 8px);
    padding: var(--s3, 12px);
  }
  h3 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .m small {
    color: var(--ink-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn.sm {
    min-height: 44px;
  }
  @media (max-width: 420px) {
    .ts-lbl {
      display: none;
    }
  }
</style>
