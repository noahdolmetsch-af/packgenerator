<script>
  /** Paket U «Rennen», Race mode · 10 Ess-Protokoll: one big «Eaten» button, per hour and the gaps. */
  import { Utensils } from '@lucide/svelte';
  import Box from './Box.svelte';
  import { foodStats, hhmm, hm } from '../race.js';
  import { putRace } from '../store.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { t, num } from '../../i18n.svelte.js';

  let { ctx, now } = $props();
  const food = $derived(ctx.race.food);
  const target = $derived(Number(ctx.stored.foodPerH) > 0 ? Number(ctx.stored.foodPerH) : 1);
  const stats = $derived(foodStats(food, { start: ctx.plan?.start, now, blocks: ctx.plan?.blocks ?? [] }));
  const gaps = $derived([...stats.gaps].sort((a, b) => b.h - a.h).slice(0, 3));

  async function change(patch, text) {
    const before = await ctx.save(patch);
    offerDone(text, () => putRace(ctx.trip.id, before));
  }
  const eat = () => change({ food: [...food, new Date().toISOString()] }, t('Eating noted at {time}.', { time: hhmm(Date.now()) }));
  const dropLast = () => change({ food: food.slice(0, -1) }, t('Last entry removed.'));
</script>

<Box id="ride-food" title={t('Food log')} what="One tap each time you eat; the app counts per hour and shows the long gaps." why="Most riders eat too little in a long race; a gap shows before the legs do." from="Your taps, kept in this race. The hours come from your plan (sleep does not count).">
  <button type="button" class="btn hi rm-tap" onclick={eat} data-race-food-eat><Utensils size={20} aria-hidden="true" />{t('Eaten')}</button>
  <div class="rc-stat">
    <div><b>{stats.perH == null ? '–' : num(stats.perH)}</b><small>{t('per hour (goal {n})', { n: num(target) })}</small></div>
    <div><b>{food.length}</b><small>{t('times in total')}</small></div>
    <div><b>{stats.last ? hhmm(stats.last) : '–'}</b><small>{t('last time')}</small></div>
  </div>
  {#if stats.perH != null && stats.perH < target}<p class="rc-text rc-warn">{t('Less than your goal: eat something at the next stop.')}</p>{/if}
  {#if gaps.length}
    <p class="rc-note">{t('Longest gaps')}: {gaps.map((g) => `${hhmm(g.from)}–${hhmm(g.to)} (${hm(g.h)})`).join(' · ')}</p>
  {/if}
  <div class="rc-acts">
    <label class="rc-lab">{t('Goal per hour')}<input class="inp rc-num" type="number" min="0.5" max="6" step="0.5" value={target} onchange={(e) => ctx.save({ foodPerH: Number(e.currentTarget.value) || 1 })} data-race-food-goal /></label>
    {#if food.length}<button type="button" class="btn sm" onclick={dropLast} data-race-food-undo>{t('Remove the last entry')}</button>{/if}
  </div>
</Box>
