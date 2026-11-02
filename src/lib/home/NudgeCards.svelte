<script>
  /**
   * «Meilensteine aktiver machen» PR 2 (Noah 01.11.2026 «2a und b», «alle vier Stellen»): «Schon lange nicht» in the tile
   * «Aktiv heute». One quiet card per sport that waits too long (at most two): «Heute machen» opens the sport,
   * «Später» hides the card for three days, «Pause» pauses the sport (Undo in the message below). The span can be
   * set per sport on its page.
   */
  import { liveQuery } from 'dexie';
  import { Clock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { normAct } from '../flow.js';
  import { saveAct, putSetting } from '../flowdb.js';
  import { toast, actName } from '../flow/ui.svelte.js';
  import { lapsed, snooze, NUDGE_KEY, nudgesOf } from './nudge.js';
  import { t, tn } from '../i18n.svelte.js';
  import { TONE_KEY, toneOf, NUDGES, pick } from '../flow/tone.js';

  let { today } = $props();
  const q = $derived(
    liveQuery(async () => {
      const [acts, log, set, tn_] = await Promise.all([db.flowActs.toArray(), db.flowLog.toArray(), db.settings.get(NUDGE_KEY), db.settings.get(TONE_KEY)]);
      return { acts: acts.map(normAct), log, nudges: nudgesOf(set?.value), tone: toneOf(tn_?.value) };
    }),
  );
  const d = $derived($q);
  const rows = $derived(d ? lapsed(d.acts, d.log, today, d.nudges) : []);
  const later = (x) => putSetting(db, NUDGE_KEY, snooze(d.nudges, x.act.id, today));
  async function pause(x) {
    const before = x.act;
    await saveAct(db, { ...before, paused: true });
    toast(t('{name} paused', { name: actName(before) }), () => saveAct(db, { ...before, paused: false }));
  }
</script>

{#if rows.length}
  <div class="nu" data-nudges>
    <h3><Clock size={16} aria-hidden="true" />{t('Not for a while')}</h3>
    {#each rows as x (x.act.id)}
      <div class="nc" data-nudge={x.act.id}>
        <p><b>{actName(x.act)}</b> · {tn(x.days, 'one day ago', '{n} days ago')}</p>
        {#if d.tone !== 'off'}<p class="sub" data-nudge-saying>{t(pick(NUDGES, d.tone, `${x.act.id}${today}`), { sport: actName(x.act) })}</p>{/if}
        <div class="btns">
          <a class="nb p" href="#/flow/sport/{encodeURIComponent(`act:${x.act.id}`)}" data-nudge-go>{t('Do it today')}</a>
          <button type="button" class="nb" data-nudge-later onclick={() => later(x)}>{t('Later|nudge')}</button>
          <button type="button" class="nb" data-nudge-pause onclick={() => pause(x)}>{t('Pause|nudge')}</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .nu {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  .nc {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  p {
    margin: 0;
    font-size: var(--fs-small);
  }
  .sub {
    color: var(--ink-3);
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .nb {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small)/1 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .nb.p {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
</style>
