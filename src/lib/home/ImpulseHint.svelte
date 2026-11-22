<script>
  /**
   * Paket T «Freie Zeit» (Noah 19.10.2026 «2a»): one quiet row on Heute with an impulse. Since 21.11.2026
   * (Noah «mit dieser») every day, not only without a ride idea, and it fits the weather of the day and the
   * free time before the next appointment (calendar on). Off with the switch on the page Impulse;
   * «More» opens the page Impulse of Freie Zeit.
   */
  import { Sparkles } from '@lucide/svelte';
  import { cfgQuery } from '../freidb.js';
  import { todayImpulse, impulseHref, collsOf } from '../frei.js';
  import { t } from '../i18n.svelte.js';
  import { suggest, watchSuggest } from '../clear/suggest.svelte.js'; // Einzelidee 36: «Ideas for free time» can be off
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { prefsOf, AGENDA_KEY } from '../agenda.js';
  import { freeMinutes } from '../frei/lustwoche.js';

  // dry: today's weather from Heute (true / false / null without a forecast); now: Date of Heute
  let { today, dry = null, now = new Date() } = $props();
  const q = cfgQuery();
  watchSuggest();
  const prefQ = liveQuery(() => db.settings.get(AGENDA_KEY));
  const evQ = liveQuery(() => db.gEvents.where('day').aboveOrEqual(today).limit(300).toArray().catch(() => []));
  const free = $derived($prefQ && prefsOf($prefQ.value).calendar && $evQ ? freeMinutes($evQ, now.getTime()) : null);
  const imp = $derived($q === undefined || !suggest.on.impulse ? null : todayImpulse($q, today, { dry, free }));
  const title = $derived(imp ? (imp.own || imp.edited ? imp.title : t(imp.title)) : '');
</script>

{#if imp}
  <div class="ih" data-impulse-today={imp.id}>
    <Sparkles size={20} aria-hidden="true" />
    <span class="it"><b>{t('Impulse for today')}:</b> <span>{title}</span>{#each imp.why as w (w)}<span class="why" data-impulse-why={w}>{' '}· {#if w === 'weather'}{t('fits the weather')}{:else}{t('fits your free time')}{/if}</span>{/each}</span>
    <a class="btn" href={impulseHref(imp, collsOf($q))}>{t('Try it')}</a>
    <a class="linkq" href="#/flow/impulse?i={imp.id}">{t('More impulses')}</a>
  </div>
{/if}

<style>
  .ih {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink-2);
  }
  .it {
    flex: 1 1 200px;
    min-width: 0;
    color: var(--ink);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .why {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .linkq {
    display: inline-block;
    padding-block: 12px; /* F03: a 44 px tap area, the layout stays (negative margin) */
    margin-block: -12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
