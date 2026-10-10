<script>
  /**
   * Hobby pages (H16a): the big milestone block, the same on A and A2: «Dein Jahr bisher», «Bald
   * erreichbar» (from 80 %), «Zuletzt erreicht» (the newest stars), «Alle», the reward and the record
   * wall. Only the next star of each milestone; stars reached stay. No confetti, no ranking.
   * list: the evaluated milestones to count (not off); all: the cards under «Alle»; allMore: a link
   * under «Alle» ({ href, label }); label(r): the activity's name for a milestone of one activity; records: flowms.js records(); reward, wishlist, onreward.
   */
  import { Trophy, Star, ListChecks, Gift } from '@lucide/svelte';
  import MsCard from './MsCard.svelte';
  import RewardRow from './RewardRow.svelte';
  import RecordWall from './RecordWall.svelte';
  import { soonList, recentStars, yearSummary } from '../../flowms.js';
  import { msName, starLine, dayWord, monthWord } from './words.js';
  import { t, tn } from '../../i18n.svelte.js';

  let { list = [], all = [], allMore = null, label = () => '', records = [], reward = null, wishlist = [], onreward, today, tuneHref = '' } = $props();
  const sum = $derived(yearSummary(list, today));
  const soon = $derived(soonList(list, 3));
  const recent = $derived(recentStars(list, 3));
</script>

<div class="msb">
  <div class="hero">
    <p class="hk">{t('Your year so far')}</p>
    <p class="hn">{tn(sum.year, '{n} star', '{n} stars')} · {t('{n} new in {month}', { n: sum.month, month: monthWord(today, 'long') })}</p>
    <p class="hs">{sum.soon ? tn(sum.soon, 'Calm onwards: {n} star is within reach.', 'Calm onwards: {n} stars are within reach.') : t('No star close right now. Every step counts.')}</p>
  </div>

  <h3 class="bh"><Trophy size={16} aria-hidden="true" />{t('Soon within reach')}</h3>
  {#if soon.length}
    <div class="grid">{#each soon as r (r.id)}<MsCard {r} kind="soon" sub={label(r)} />{/each}</div>
  {:else}
    <p class="none">{t('Nothing at 80 % yet. The next stars are under «All».')}</p>
  {/if}

  <h3 class="bh"><Star size={16} aria-hidden="true" />{t('Recently reached')}</h3>
  {#if recent.length}
    <ul class="recent">
      {#each recent as x (x.star.id)}
        <li><span class="rs" aria-hidden="true"><Star size={22} /></span><span><b>{msName(x.r.m)}{#if label(x.r)}<span class="ra"> · {label(x.r)}</span>{/if}</b><small>{starLine(x.star.star)} · {dayWord(x.star.day, today)}</small></span></li>
      {/each}
    </ul>
  {:else}
    <p class="none">{t('No star yet. The first ones come quickly.')}</p>
  {/if}

  {#if all.length}
    <h3 class="bh"><ListChecks size={16} aria-hidden="true" />{t('All')}{#if allMore}{' · '}<a class="more" href={allMore.href}>{allMore.label}</a>{/if}</h3>
    <div class="grid">{#each all as r (r.id)}<MsCard {r} sub={label(r)} />{/each}</div>
  {/if}

  <h3 class="bh"><Gift size={16} aria-hidden="true" />{t('Reward')}</h3>
  <RewardRow list={list.filter((r) => r.next)} {reward} {wishlist} onsave={onreward} />

  <h3 class="bh"><Trophy size={16} aria-hidden="true" />{t('Record wall')}</h3>
  <RecordWall list={records} {today} />
  <p class="note">{t('Only the next star per milestone. Stars reached stay, even when a streak breaks. No confetti, no ranking. The numbers are suggestions.')}{#if tuneHref}{' '}<a href={tuneHref}>{t('Change numbers')}</a>{/if}</p>
</div>

<style>
  .msb {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .hero {
    padding: 18px 22px;
    border-radius: var(--radius-card);
    background: var(--pc);
    color: var(--pc-ink);
  }
  .hero p {
    margin: 0;
  }
  .hk,
  .hs {
    font-size: var(--fs-small);
  }
  .hero .hn {
    margin: 4px 0;
    font: 800 var(--fs-title)/1.1 var(--font-brand);
  }
  .bh {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
    font: 600 var(--fs-small)/1.4 var(--font-body);
    color: var(--ink-2);
  }
  .more {
    position: relative;
    color: var(--accent);
    font-weight: 500;
  }
  .more::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 44px;
    transform: translateY(-50%);
  }
  .grid,
  .recent {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 899px) {
    .grid,
    .recent {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 599px) {
    .grid,
    .recent {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .ra {
    color: var(--ink-2);
    font-weight: 400;
  }
  .recent {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .recent li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid var(--warn-soft);
    border-radius: var(--radius-card);
    background: var(--warn-soft);
    line-height: 1.3;
  }
  .rs {
    flex: none;
    color: var(--l2);
    line-height: 0;
  }
  .rs :global(svg) {
    fill: var(--l2);
  }
  .recent b {
    display: block;
    font-weight: 600;
  }
  .recent small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .none,
  .note {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .note a {
    color: var(--accent);
  }
</style>
