<script>
  /**
   * «Muster» on Zusammenhänge (Noah 23.11.2026): the days of the week and the recovery after a hard day. Two quiet cards that show only when
   * there is something clear to say (rules in muster.js); only looking, never a verdict.
   */
  import { CalendarDays, HeartPulse } from '@lucide/svelte';
  import { t, tn, num as fmt, locale } from '../i18n.svelte.js';
  import { weekdayPattern, recoveryOf } from './muster.js';
  import { SHORT, dayLong, dayShortName } from './words.js';

  let { series, today } = $props();
  const wd = $derived(weekdayPattern(series, today));
  const rec = $derived(recoveryOf(series, today));
  const showRec = $derived(rec && (rec.steps.length || rec.trend));
  /** The bars of one value: height from its lowest to its highest weekday. */
  function bars(w) {
    const ms = w.means.map((m) => m?.mean ?? null);
    const real = ms.filter((m) => m != null);
    const lo = Math.min(...real);
    const hi = Math.max(...real);
    return ms.map((m, i) => ({ i, m, h: m == null ? 0 : 18 + ((m - lo) / (hi - lo || 1)) * 82 }));
  }
</script>

{#if wd.length}
  <div class="card pad mu" data-weekdays>
    <b class="wh"><CalendarDays size={16} aria-hidden="true" /> {t('Days of the week')}</b>
    {#each wd as w (w.y)}
      <div class="wrow" data-weekday={w.y}>
        <p><b>{t(SHORT[w.y])}</b>: {t('lowest on {low} ({a}), highest on {high} ({b})', { low: dayLong(locale(), w.low), a: fmt(w.means[w.low].mean), high: dayLong(locale(), w.high), b: fmt(w.means[w.high].mean) })}</p>
        <div class="bars" role="img" aria-label={t('Mean of {y} for each day of the week', { y: t(SHORT[w.y]) })}>
          {#each bars(w) as b (b.i)}
            <span class="bar" class:lo={b.i === w.low} class:hi={b.i === w.high} class:none={b.m == null}><i style:height="{b.h}%"></i><small>{dayShortName(locale(), b.i)}</small></span>
          {/each}
        </div>
      </div>
    {/each}
    <p class="ich-hs">{t('Mean over your last 90 days. Only shown when the difference is clearly more than the swing from day to day.')}</p>
  </div>
{/if}

{#if showRec}
  <div class="card pad mu" data-recovery>
    <b class="wh"><HeartPulse size={16} aria-hidden="true" /> {t('Recovery')}</b>
    {#if rec.steps.length}
      <p>
        {t('After a day with more than {c} active zone minutes ({n} days):', { c: fmt(rec.cut), n: rec.n })}
        {#each rec.steps as s (s.k)}<span class="step num" data-recovery-step={s.k}>{tn(s.k, '{n} day later', '{n} days later')} {s.dev > 0 ? '+' : s.dev < 0 ? '−' : ''}{fmt(Math.abs(s.dev))}</span>{/each}
      </p>
      <p class="ich-hs">
        {t('Resting pulse against your normal of {n}.', { n: fmt(rec.normal) })}
        {#if rec.backAfter}{tn(rec.backAfter, 'Back to normal after {n} day.', 'Back to normal after {n} days.')}{:else if rec.peak <= 1}{t('Your resting pulse hardly rises after a hard day.')}{:else}{t('Not back to normal within {n} days.', { n: rec.steps.at(-1).k })}{/if}
      </p>
    {/if}
    {#if rec.trend}
      <p data-recovery-trend>{t('Resting pulse, last 30 days: {a}, the 30 days before: {b}.', { a: fmt(rec.trend.now), b: fmt(rec.trend.before) })} {rec.trend.diff <= -1 ? t('It went down.') : rec.trend.diff >= 1 ? t('It went up.') : t('About the same.')}</p>
    {/if}
  </div>
{/if}

<style>
  .mu {
    display: grid;
    gap: 8px;
    margin-bottom: 10px;
  }
  .mu p {
    margin: 0;
    overflow-wrap: break-word;
  }
  .wh {
    font-weight: 600;
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .wrow {
    display: grid;
    gap: 6px;
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    align-items: end;
    height: 84px;
    max-width: 360px;
  }
  .bar {
    display: grid;
    grid-template-rows: 1fr auto;
    height: 100%;
    justify-items: center;
    gap: 2px;
  }
  .bar i {
    display: block;
    align-self: end;
    width: 100%;
    background: var(--ink-3);
    opacity: 0.45;
    border-radius: 3px 3px 0 0;
  }
  .bar.hi i {
    background: var(--accent);
    opacity: 0.9;
  }
  .bar.lo i {
    background: var(--ink-2);
    opacity: 0.85;
  }
  .bar.none i {
    opacity: 0.1;
  }
  .bar small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .step {
    display: inline-block;
    margin-right: 10px;
    white-space: nowrap;
  }
</style>
