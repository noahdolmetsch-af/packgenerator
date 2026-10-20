<script>
  /**
   * «Heute neu» N2 (Noah 20.10.2026 15:49 «5a»): «Dein Körper heute», the first tile of Heute. Four Fitbit
   * values of today next to yesterday (body.js) and the check of the moment: the Morgen-Check, from the evening
   * round time the Abend-Check (AbCard tells Heute how many questions wait; «Los» opens its window).
   * Observation only: the arrow says up or down, no colour for good or bad.
   */
  import { liveQuery } from 'dexie';
  import { Activity, ArrowUp, ArrowDown, ArrowRight, ClipboardList, Check, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { addDays } from '../health.js';
  import { bodyToday } from './body.js';
  import TileHead from './TileHead.svelte';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { today, due = 0, evening = false, open = false, onstart = () => {} } = $props();

  const hq = $derived(liveQuery(() => (db.healthDays ? db.healthDays.where('date').aboveOrEqual(addDays(today, -1)).toArray() : [])));
  const body = $derived(bodyToday($hq ?? [], today));
  const n1 = (x) => Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 });
  const LABEL = { pulse: 'Resting pulse|body', sleep: 'Sleep|body', score: 'Sleep score|body', azm: 'Active zone minutes|body' };
  const fmt = (r, x) => (x == null ? '–' : r.key === 'sleep' ? `${n1(x)} h` : r.key === 'score' && r.kind === 'efficiency' ? `${x} %` : String(Math.round(x)));
  const label = (r) => (r.key === 'score' && r.kind === 'efficiency' ? t('Sleep efficiency|body') : t(LABEL[r.key]));
</script>

<section class="bd surf" aria-labelledby="bd-h" data-section="body">
  <div class="hd">
    <TileHead icon={Activity} id="bd-h" title={t('Your body today')} />
    <a class="go" href="#/me/insights">{t('Details|body')}<ChevronRight size={16} aria-hidden="true" /></a>
  </div>
  {#if body.any}
    <dl class="vals">
      {#each body.rows as r (r.key)}
        <div data-body={r.key}>
          <dt>{label(r)}</dt>
          <dd>
            <b class="num">{fmt(r, r.now)}</b>
            {#if r.dir != null}
              <span class="yd" title={t('yesterday {v}', { v: fmt(r, r.before) })}>
                {#if r.dir > 0}<ArrowUp size={14} aria-hidden="true" />{:else if r.dir < 0}<ArrowDown size={14} aria-hidden="true" />{:else}<ArrowRight size={14} aria-hidden="true" />{/if}
                <span class="num">{t('yesterday {v}', { v: fmt(r, r.before) })}</span>
              </span>
            {:else if r.before != null}<span class="yd"><span class="num">{t('yesterday {v}', { v: fmt(r, r.before) })}</span></span>{/if}
          </dd>
        </div>
      {/each}
    </dl>
  {:else}
    <p class="empty">{t('Connect Fitbit and your resting pulse, sleep and active zone minutes show here.')} <a href="#/me/connections">{t('Connections|body')}</a></p>
  {/if}
  <!-- the check of the moment: Morgen-Check, from the evening round time the Abend-Check -->
  <div class="ck" class:done={!due} data-body-check={evening ? 'evening' : 'morning'}>
    <span class="ci" aria-hidden="true">{#if due}<ClipboardList size={18} />{:else}<Check size={18} strokeWidth={2.6} />{/if}</span>
    {#if due}
      <span class="ct">{tn(due, evening ? 'Evening check · {n} question' : 'Morning check · {n} question', evening ? 'Evening check · {n} questions' : 'Morning check · {n} questions')}</span>
      {#if !open}<button type="button" class="btn sm" onclick={onstart}>{t('Start|round')}</button>{/if}
    {:else}
      <span class="ct">{evening ? t('Evening check: nothing open') : t('Morning check: nothing open')}</span>
      <a class="lk" href={evening ? '#/check/evening' : '#/check/morning'}>{t('See|check')}</a>
    {/if}
  </div>
  <p class="note">{t('Only to look at: the arrow compares with yesterday.')}</p>
</section>

<style>
  .bd {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hd :global(.th) {
    flex: 1;
  }
  .go {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .vals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
    margin: 0;
  }
  .vals div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  .vals dt,
  .yd,
  .note,
  .empty {
    color: var(--ink-3);
    font-size: var(--fs-small);
    margin: 0;
  }
  .vals dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
  }
  .vals b {
    font-size: var(--fs-sub);
  }
  .yd {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .empty a {
    color: var(--hi);
    font-weight: 600;
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 10px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--hi) 8%, var(--paper));
  }
  .ck.done {
    background: transparent;
    border: 1px solid var(--line);
  }
  .ci {
    display: grid;
    color: var(--hi);
  }
  .ct {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .lk {
    color: var(--hi);
    font-weight: 600;
    font-size: var(--fs-small);
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  .note {
    margin-top: auto;
  }
</style>
