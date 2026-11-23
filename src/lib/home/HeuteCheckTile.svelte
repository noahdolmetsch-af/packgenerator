<script>
  /**
   * «Heute-Check» (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): a tile that is always on Heute, also when
   * everything is answered. It shows how many answers there are today and leads straight to the questionnaire
   * (the page of the round: Morgen-Check, from the evening round time Abend-Rückblick) with the analyses one tap
   * away on the same page. `due` and `evening` come from AbCard through Home.svelte (open questions of the round).
   * Observation only: plain counts, no judgement.
   */
  import { ListChecks, ChevronRight, TrendingUp } from '@lucide/svelte';
  import TileHead from './TileHead.svelte';
  import { abQuery, hintQuery } from '../abdb.js';
  import { db } from '../db.js';
  import { afterMorning, stampOf, configOf } from '../abfragen.js';
  import { t, tn, num as fmt } from '../i18n.svelte.js';

  let { today, due = 0, evening = false, isnew = false } = $props();
  const late = afterMorning(stampOf()); // from 11:00: «Open from this morning» (17.11.2026)
  const query = $derived(abQuery(today));
  const data = $derived($query);
  const n = $derived((data?.answers ?? []).filter((a) => a.day === today).length);
  // the strongest lever of «Zusammenhänge» as one line (Noah 23.11.2026 «Heute-Zeile»): worked out on this device, loaded when Heute is ready
  // (the insights code stays out of the start), and only when there is one; a tap opens the page with the days behind it
  let lever = $state(null);
  $effect(() => {
    let gone = false;
    const sub = hintQuery().subscribe({
      next: async (h) => {
        try {
          const [E, W, A, F] = await Promise.all([import('../erkenntnisse.js'), import('../erkenntnisse/words.js'), import('../erkenntnisse/aktiv.js'), import('../flow/ui.svelte.js')]);
          const acts = await A.countedActs(db);
          if (gone) return;
          const ownAll = E.ownNumberQuestions(configOf(h.cfg).own);
          const own = E.ownNumberQuestions(ownAll, h.ownOff);
          const series = E.seriesOf({ rows: h.rows, health: h.health, log: h.log, days: E.lastDays(today, E.WINDOW_DAYS + 1), weather: h.weather, events: h.events, own, acts });
          const row = E.leversOf(E.insights(series, today, { own }), 1)[0];
          const name = (key) => (key.startsWith('act:') ? F.actName(acts.acts.find((a) => a.id === key.slice(4))) : (ownAll.find((q) => `own:${q.id}` === key)?.text ?? ''));
          lever = row ? { line: W.leverLine(t, fmt, name, row), tip: W.tipOf(t, name, row) } : null;
        } catch {
          lever = null;
        }
      },
      error: () => (lever = null),
    });
    return () => {
      gone = true;
      sub.unsubscribe();
    };
  });
  const href = $derived(evening ? '#/check/evening' : '#/check/morning');
</script>

<section class="hc surf" aria-labelledby="hc-h" data-section="heutecheck">
  <div class="hd">
    <TileHead icon={ListChecks} id="hc-h" title={t("Today's check")} {isnew} />
  </div>
  <p class="st" data-hc-state>
    {#if due}
      {tn(due, evening ? 'Evening check · {n} question open' : late ? 'Open from this morning · {n} question' : 'Morning check · {n} question open', evening ? 'Evening check · {n} questions open' : late ? 'Open from this morning · {n} questions' : 'Morning check · {n} questions open')}
    {:else}
      {evening ? t('Evening check: nothing open') : t('Morning check: nothing open')}
    {/if}
  </p>
  <p class="was" data-hc-count>{n ? tn(n, '{n} answer today', '{n} answers today') : t('No answers yet today.')}</p>
  {#if lever}<a class="lv" href="#/me/insights" data-hc-lever><TrendingUp size={14} aria-hidden="true" /><span><b>{lever.line}</b> <small>{lever.tip}</small></span></a>{/if}
  <a class="btn hi open" {href} data-hc-open>{t('Open questionnaire')}<ChevronRight size={16} aria-hidden="true" /></a>
  <p class="lks"><a href="#/me/insights" data-hc-links>{t('What goes together')}</a><a href="#/me/history">{t('All answers')}</a></p>
</section>

<style>
  .hc {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
  .lv {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    color: var(--ink-2);
    text-decoration: none;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .lv :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .lv b {
    font-weight: 500;
  }
  .lv small {
    color: var(--ink-3);
  }
  .open {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  .st,
  .was {
    margin: 0;
    overflow-wrap: break-word;
  }
  .was {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
  }
  .lks a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--hi);
    font-size: var(--fs-small);
  }
</style>
