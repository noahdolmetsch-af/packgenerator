<script>
  /**
   * «Strava-Fahrt vollständig» (Noah 19.10.2026 «2a»): what else Strava knows about this activity, under
   * the values: the kind (race, workout, long), commute and indoor, the device, new best times and
   * achievements, «How hard was it?» (1–10), the highest and lowest point, the temperature low/high,
   * the steepest 200 m, and Strava's own comment. Loaded only on the activity page (TrainingAct).
   * Observation only: nothing is rated.
   */
  import { Trophy, Briefcase, House, Cpu, Gauge, Mountain, Thermometer, TrendingUp, Flag, MessageSquareText } from '@lucide/svelte';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const WORKOUT = { race: 'Race|kind', workout: 'Workout|kind', long: 'Long ride|kind' };
  const tags = $derived.by(() => {
    if (!act) return [];
    const out = [];
    if (act.workout && WORKOUT[act.workout]) out.push({ key: 'workout', icon: Flag, text: t(WORKOUT[act.workout]) });
    if (act.commute) out.push({ key: 'commute', icon: Briefcase, text: t('Commute|act') });
    if (act.trainer) out.push({ key: 'trainer', icon: House, text: t('Indoor|act') });
    if (act.device) out.push({ key: 'device', icon: Cpu, text: act.device });
    return out;
  });
  const facts = $derived.by(() => {
    if (!act) return [];
    const out = [];
    if (act.prs > 0) out.push({ key: 'prs', icon: Trophy, b: String(act.prs), small: act.prs === 1 ? t('new best time') : t('new best times') });
    else if (act.achv > 0) out.push({ key: 'achv', icon: Trophy, b: String(act.achv), small: t('achievements on Strava') });
    if (act.rpe != null) out.push({ key: 'rpe', icon: Gauge, b: `${act.rpe} / 10`, small: t('How hard was it? (your answer in Strava)') });
    if (act.elevHigh != null) out.push({ key: 'high', icon: Mountain, b: act.elevLow != null ? `${num(act.elevLow)}–${num(act.elevHigh)} m` : `${num(act.elevHigh)} m`, small: act.elevLow != null ? t('Lowest to highest point') : t('Highest point') });
    if (act.tempMin != null && act.tempMax != null && act.tempMin !== act.tempMax) out.push({ key: 'temp', icon: Thermometer, b: `${num(act.tempMin)}–${num(act.tempMax)} °C`, small: t('Coolest to warmest') });
    if (act.steep != null) out.push({ key: 'steep', icon: TrendingUp, b: `${num(act.steep)} %`, small: t('Steepest 200 m') });
    return out;
  });
  const desc = $derived(typeof act?.desc === 'string' ? act.desc.trim() : '');
</script>

{#if tags.length || facts.length || desc}
  <div class="card rf" data-section="ride-facts">
    {#if tags.length}
      <ul class="tags" aria-label={t('About this activity')}>
        {#each tags as g (g.key)}<li class="pill" data-tag={g.key}><g.icon size={14} aria-hidden="true" />{g.text}</li>{/each}
      </ul>
    {/if}
    {#if facts.length}
      <div class="facts num">
        {#each facts as f (f.key)}
          <span data-fact={f.key}><f.icon size={16} aria-hidden="true" /><b>{f.b}</b><small>{f.small}</small></span>
        {/each}
      </div>
    {/if}
    {#if desc}
      <figure class="desc" data-strava-desc>
        <figcaption><MessageSquareText size={14} aria-hidden="true" />{t('Your comment in Strava')}</figcaption>
        <blockquote>{desc}</blockquote>
      </figure>
    {/if}
  </div>
{/if}

<style>
  .rf {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tags li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }
  .facts span {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: 'i b' 'i s';
    align-items: center;
    gap: 0 8px;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--paper-2);
  }
  .facts span :global(svg) {
    grid-area: i;
    color: var(--ink-2);
  }
  .facts b {
    grid-area: b;
    font: 700 var(--fs-body) / 1.25 var(--font-body);
  }
  .facts small {
    grid-area: s;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .desc {
    margin: 0;
  }
  .desc figcaption {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .desc blockquote {
    margin: 4px 0 0;
    white-space: pre-line;
    overflow-wrap: break-word;
  }
</style>
