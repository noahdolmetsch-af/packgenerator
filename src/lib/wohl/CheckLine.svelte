<script>
  /**
   * Paket P in the Morgen- and Abend-Check window (AbCard, Paket C): a few calm lines under the questions.
   * Morning: the recipe as a suggestion when your battery is low (Idee 3 «3a»), and one moment from your
   * jar of good moments (Idee 1 «1a»). Evening: today's ride in numbers, km, Hm and pulse (#221), and the
   * recipe of your day (#249). Observation only; nothing to do, nothing shows without data.
   */
  import { liveQuery } from 'dexie';
  import { Bike, Sunrise, Sparkles, Heart, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { historyQuery } from '../abdb.js';
  import { lastDays } from '../flow.js';
  import { dayData, recipe, rideNumbers, morningTip, jarNotes, jarPick, FACT } from '../wohl.js';
  import { t, locale } from '../i18n.svelte.js';

  let { today, evening = false } = $props();
  const days = lastDays(today, 60);
  const hist = historyQuery();
  const rows = $derived($hist?.rows ?? []);
  const extraQ = liveQuery(async () => {
    const [km, health] = await Promise.all([db.kmBook.where('date').aboveOrEqual(days[0]).toArray(), db.healthDays ? db.healthDays.where('date').aboveOrEqual(days[0]).toArray() : []]);
    return { km, health };
  });
  const ex = $derived($extraQ);
  const data = $derived(ex ? dayData({ rows, km: ex.km, health: ex.health, days }) : []);
  const f1 = (v) => (v == null ? '–' : Number(v).toLocaleString(locale(), { maximumFractionDigits: 1 }));
  const fact = (k) => t(FACT[k].label);

  const seed = Math.random();
  const ride = $derived(evening && ex ? rideNumbers(ex.km, today) : null);
  const rec = $derived(evening ? (recipe(data, today) ?? recipe(data, days.at(-2))) : null);
  const recToday = $derived(evening && !!recipe(data, today));
  const tip = $derived(!evening ? morningTip(data, rows, today, 20) : null);
  const moment = $derived(!evening ? (jarPick(jarNotes(rows), seed, 1)[0] ?? null) : null);
  const any = $derived(!!(ride || rec || tip || moment));
</script>

{#if any}
  <div class="wcl" data-check-wohl={evening ? 'evening' : 'morning'}>
    {#if ride}
      <p data-check-ride><Bike size={16} aria-hidden="true" /><span><b class="num">{t('Today on the bike: {km} km', { km: f1(ride.km) })}</b>{#if ride.hm != null}{' · '}<span class="num">{ride.hm} Hm</span>{/if}{#if ride.hrAvg != null}{' · '}<span class="num">{t('pulse {n}', { n: ride.hrAvg })}</span>{/if}</span></p>
    {/if}
    {#if rec}
      <p data-check-recipe><Sparkles size={16} aria-hidden="true" /><span><b>{recToday ? t('Recipe of today') : t('Recipe of yesterday')}:</b> {rec.parts.length ? rec.parts.map(fact).join(', ') : t('nothing of your usual good parts')}</span></p>
    {/if}
    {#if tip}
      <p data-check-tip><Sunrise size={16} aria-hidden="true" /><span><b>{t('Battery at {n}: a small suggestion', { n: f1(tip.akku) })}</b> {t(tip.text)}</span></p>
    {/if}
    {#if moment}
      <p data-check-jar><Heart size={16} aria-hidden="true" /><span><b>{t('From your jar:')}</b> «{moment.text}»</span></p>
    {/if}
    <a class="ab-lnk" href="#/me/wohl">{t('What is good for me')}<ChevronRight size={14} aria-hidden="true" /></a>
  </div>
{/if}

<style>
  .wcl {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  p {
    margin: 0;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  p :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  b {
    color: var(--ink);
    font-weight: 600;
  }
</style>
