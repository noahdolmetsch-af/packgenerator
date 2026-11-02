<script>
  /**
   * «Meilensteine aktiver machen» PR 5 (Noah «5a»): on Monday and Tuesday, inside the tile «Aktiv heute»: the stars of last
   * week, newest first (at most five), each opens its sport. «Schliessen» hides the card until next Monday.
   */
  import { liveQuery } from 'dexie';
  import { Star } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { readNextStars } from './nextstars.js';
  import { cardMonday, weekStars, WEEK_KEY, SHOWN } from './weekstars.js';
  import { TONE_KEY, toneOf, pick } from '../flow/tone.js';
  import { msName } from '../flow/hobby/words.js';
  import { actName } from '../flow/ui.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();
  const monday = $derived(cardMonday(today));
  const q = $derived(
    liveQuery(async () => {
      const [d, tn_] = await Promise.all([readNextStars(db, today), db.settings.get(TONE_KEY)]);
      return { ...d, tone: toneOf(tn_?.value) };
    }),
  );
  const d = $derived($q);
  const all = $derived(d && monday && d.weekDone !== monday ? weekStars(d.acts, d.ctx, d.stored, d.tune, monday) : []);
  const rows = $derived(all.slice(0, SHOWN));
  const saying = $derived(d?.tone === 'off' ? '' : t(pick(WEEK_SAYINGS, d?.tone ?? 'funny', monday ?? ''), { n: all.length }));
  const close = () => putSetting(db, WEEK_KEY, { done: monday });
  const WEEK_SAYINGS = {
    funny: ['Last week you were busy. The stars noticed.', 'Last week was a good one, and here is the proof.'],
    calm: ['A good week, step by step.', 'Here is what last week brought.'],
  };
</script>

{#if rows.length}
  <div class="ws" data-week-stars>
    <div class="hd">
      <h3><Star size={16} aria-hidden="true" />{tn(all.length, 'Last week: one new star', 'Last week: {n} new stars')}</h3>
      <button type="button" class="lk" data-week-stars-close onclick={close}>{t('Close')}</button>
    </div>
    {#if saying}<p class="sub" data-week-stars-saying>{saying}</p>{/if}
    <ul>
      {#each rows as x (`${x.actId}${x.r.id}${x.star}`)}
        <li>
          <a href="#/flow/sport/{encodeURIComponent(`act:${x.actId}`)}"><b>{actName(x.act)} · {msName(x.r.m)}</b><span class="wk">{t('Star {k}', { k: x.star })}</span></a>
        </li>
      {/each}
    </ul>
    {#if all.length > rows.length}<p class="sub">{t('and {n} more', { n: all.length - rows.length })}</p>{/if}
  </div>
{/if}

<style>
  .ws {
    display: grid;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  .sub {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  a b {
    font-weight: 600;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .wk {
    color: var(--ink-3);
    white-space: nowrap;
  }
  .lk {
    min-height: 44px;
    padding: 0 4px;
    background: none;
    border: 0;
    color: var(--ink-3);
    font: 600 var(--fs-small)/1 var(--font-body);
    cursor: pointer;
    text-decoration: underline;
  }
</style>
