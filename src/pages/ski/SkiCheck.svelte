<script>
  /**
   * v0.97.0 «Skitouren», mockup B «Rucksack-Check»: the trip's list in the five ski groups (Noah's
   * order); a tap packs or unpacks an item (the same field Pack uses), «n von m» on top. The ski
   * learnings (from «Nach der Tour») sit under their group. On a computer three columns, on a phone one.
   * #/ski/check (the next ski tour) or #/ski/check/<trip id>.
   */
  import { ChevronLeft, Check, Lightbulb } from '@lucide/svelte';
  import { skiQuery, togglePack } from '../../lib/ski/skidb.js';
  import { nextSkiTrip, checkGroups, checkCount, learningsByGroup, SKI } from '../../lib/ski.js';
  import { newTrip, openTrip } from '../../lib/nav.js';
  import { localDay } from '../../lib/localday.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import { t, nameOf, locale } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();
  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trip = $derived(data ? (id ? (data.trips.find((x) => x.id === id) ?? null) : (nextSkiTrip(data.trips, today)?.trip ?? null)) : null);
  const groups = $derived(trip ? checkGroups(trip, data.items) : []);
  const count = $derived(checkCount(groups));
  const pct = $derived(count.total ? Math.round((count.packed / count.total) * 100) : 0);
  const tips = $derived(learningsByGroup(data?.learnings ?? []));
  // desktop: three columns as in the mockup (hardware + safety · clothing + food · protection)
  const COL = { hardware: 1, safety: 1, clothing: 2, food: 2, protect: 3 };
  const col = (n) => groups.filter((g) => COL[g.key] === n);
  const shortDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

{#snippet group(g)}
  <section class="surf sk-pad grp" aria-labelledby="g-{g.key}" data-group={g.key}>
    <div class="sk-gh"><h2 id="g-{g.key}">{t(g.name)}</h2><span class="num">{g.packed}/{g.total}</span></div>
    {#each tips[g.key] as l (l.id)}<p class="sk-tip" data-tip={g.key}><Lightbulb size={16} aria-hidden="true" /><span>{l.rule}</span></p>{/each}
    <ul class="sk-list">
      {#each g.rows as r (`${r.entry.itemId}|${r.entry.slot}`)}
        <li>
          <button type="button" class="sk-tick" role="checkbox" aria-checked={!!r.entry.packed} onclick={() => togglePack(trip.id, r.entry.itemId, r.entry.slot)} data-item={r.item.id}>
            <span class="sk-box" aria-hidden="true">{#if r.entry.packed}<Check size={18} strokeWidth={3} />{/if}</span>
            <span class="sk-tt">{nameOf(r.item)}{#if r.entry.qty > 1}{" "}<span class="num">× {r.entry.qty}</span>{/if}</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/snippet}

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Backpack check')}</h1>
  {#if data && !trip}
    <Empty text={t('No ski tour yet. Plan one: the backpack check, the start check and the care follow.')} action={{ label: t('Plan a ski tour'), onclick: () => newTrip('standard', SKI) }} />
  {:else if trip}
    <div class="top">
      <div class="sk-count"><span class="sk-quiet">{trip.ski?.peak?.trim() || trip.title} · {shortDay(trip.startDate)}</span><b class="num" data-count>{t('{n} of {m}', { n: count.packed, m: count.total })}</b></div>
      <span class="sk-bar" role="progressbar" aria-label={t('Backpack check')} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}><i style:width="{pct}%"></i></span>
    </div>
    {#each tips.general as l (l.id)}<p class="sk-tip" data-tip="general"><Lightbulb size={16} aria-hidden="true" /><span>{l.rule}</span></p>{/each}
    {#if groups.length}
      <div class="sk-cols three">
        {#each [1, 2, 3] as n (n)}
          {#if col(n).length}<div>{#each col(n) as g (g.key)}{@render group(g)}{/each}</div>{/if}
        {/each}
      </div>
      <p class="sk-quiet sk-center">{t('Groups like your list · tap an item = packed · everything changeable')}</p>
    {:else}
      <Empty text={t('The list of this tour is empty. Add items in Pack.')} action={{ label: t('Open in Pack'), href: '#/pack', onclick: () => openTrip(trip.id) }} />
    {/if}
  {/if}
</div>

<style>
  .top {
    display: grid;
    gap: 2px;
  }
  .grp {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  /* on a phone the groups follow each other in Noah's order (the columns are only a computer's) */
  @media (max-width: 959px) {
    .sk-cols.three {
      display: flex;
      flex-direction: column;
    }
    .sk-cols.three > div {
      display: contents;
    }
    [data-group='hardware'] {
      order: 1;
    }
    [data-group='safety'] {
      order: 2;
    }
    [data-group='clothing'] {
      order: 3;
    }
    [data-group='protect'] {
      order: 4;
    }
    [data-group='food'] {
      order: 5;
    }
  }
</style>
