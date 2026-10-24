<script>
  /**
   * v0.123.0 «Trophäen-Vitrine» (mockup TV1, Noah 13.10.2026 «tv1-tv2 freigeben»): all stars reached
   * in one place, by area (over all, then each activity) and by year. Per milestone its highest star as
   * a round badge, per area the next open star dashed. Right: the years and the next stars within reach.
   *   #/flow/trophies            all
   *   #/flow/trophies?y=2026     only the stars of that year
   *   #/flow/trophies?area=<key> one area ('cross' or an activity's id)
   * Only the stars that exist today (flowms.js). Package G (#231–#233): the data areas bike, Fitbit and everyday.
   */
  import { Star, ChevronRight } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { msContext, allMilestones, newStars, showcase } from '../../lib/flowms.js';
  import { saveStars } from '../../lib/flowdb.js';
  import { tileName, msName, stageName, val, monthWord, areaWord } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { liveQuery } from 'dexie';
  import { GB_KEY, bookOf, gbStars } from '../../lib/gipfelbuch.js';
  import { t, tn } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = hobbyQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedHobby(data);
  });

  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays, extra: data.extra, challenges: data.challenges }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const list = $derived(ctx ? allMilestones(ctx, stored, data.tune) : []);
  $effect(() => {
    const fresh = newStars(list, stored);
    if (fresh.length) saveStars(db, fresh);
  });

  const year = $derived(/^\d{4}$/.test(params.get('y') ?? '') ? params.get('y') : null);
  const area = $derived(params.get('area') || null);
  const all = $derived(showcase(list));
  const sc = $derived(showcase(list, year));
  const groups = $derived(area ? sc.groups.filter((g) => g.key === area) : sc.groups);
  const areaName = (key) => (key === 'cross' ? t('Over all') : areaWord(key) || tileName(data?.acts.find((a) => a.id === key)) || key);
  const chips = $derived([
    { href: '#/flow/trophies', label: t('All'), on: !year && !area },
    ...all.years.map((y) => ({ href: `#/flow/trophies?y=${y.year}`, label: y.year, on: year === y.year && !area })),
    ...all.groups.map((g) => ({ href: `#/flow/trophies?area=${encodeURIComponent(g.key)}`, label: areaName(g.key), on: area === g.key && !year })),
    ...(gbAll.length ? [{ href: '#/flow/trophies?area=gipfelbuch', label: t('Summit book'), on: area === 'gipfelbuch' && !year }] : []),
  ]);
  // 0.165.0 «Gipfelbuch für alle» (Noah 4a): the stars of the summit book as their own area
  const gbQ = liveQuery(async () => gbStars(bookOf((await db.settings.get(GB_KEY))?.value)));
  const gbAll = $derived($gbQ ?? []);
  const gb = $derived(year ? gbAll.filter((s) => s.day.startsWith(year)) : gbAll);
  const gbShow = $derived(gb.length > 0 && (!area || area === 'gipfelbuch'));
  const gbName = (s) => (s.kind === 'pass2000' ? t('First pass over 2000 m') : s.kind === 'passes' ? t('{n} passes by bike', { n: s.n }) : s.kind === 'top' ? t('Highest point {year}', { year: s.year }) : t('5 new places in {year}', { year: s.year }));
  const when = (x) => `${stageName(x.star)} · ${monthWord(x.day)} ${x.day.slice(0, 4)}`;
  const left = (r) => t('{n} of {m}', { n: val(r.value, r.m.unit), m: val(r.target, r.m.unit) });
</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }, { href: '#/flow/milestones', label: t('Milestones') }]} here={t('Trophy showcase')} />
    <PageHead title={t('Trophy showcase')} text={t('All your stars in one place · by area and year · reached ones stay · no ranking')} />
  </header>

  {#if data}
    <div class="tools">
      <nav class="chips" aria-label={t('Filter by year or area')}>
        {#each chips as c (c.href)}<a class="chip" href={c.href} aria-current={c.on ? 'page' : undefined}>{c.label}</a>{/each}
      </nav>
      <a class="btn" href="#/flow/milestones?tune=1">{t('Change stages')}</a>
    </div>

    <div class="lay">
      <div class="col">
        {#each groups as g (g.key)}
          <section class="grp" data-area={g.key} aria-labelledby="tv-{g.key}">
            <h2 id="tv-{g.key}">{areaName(g.key)}</h2>
            <p class="sub">{tn(g.count, '{n} star', '{n} stars')}{year ? ` · ${year}` : ''}</p>
            <ul class="card badges">
              {#each g.items as x (x.id)}
                <li data-star={x.id}><span class="b" aria-hidden="true"><Star size={18} /></span><b>{msName(x.r.m)}</b><small>{when(x)}</small></li>
              {/each}
              {#if g.next && !year}
                <li class="open" data-next={g.next.id}><span class="b" aria-hidden="true"><Star size={18} /></span><b>{msName(g.next.m)}</b><small>{t('next: {what}', { what: stageName(g.next.next) })}</small></li>
              {/if}
            </ul>
          </section>
        {:else}
          {#if !gbShow}<p class="card none">{t('No stars here yet. The next ones are under «Milestones».')}</p>{/if}
        {/each}
        {#if gbShow}
          <section class="grp" data-area="gipfelbuch" aria-labelledby="tv-gipfelbuch">
            <h2 id="tv-gipfelbuch">{t('Summit book')}</h2>
            <p class="sub">{tn(gb.length, '{n} star', '{n} stars')}{year ? ` · ${year}` : ''} · <a href="#/flow/gipfelbuch">{t('Open the summit book')}</a></p>
            <ul class="card badges">
              {#each [...gb].reverse() as x (x.id)}
                <li data-star={x.id}><span class="b" aria-hidden="true"><Star size={18} /></span><b>{gbName(x)}</b><small>{x.name} · {monthWord(x.day)} {x.day.slice(0, 4)}</small></li>
              {/each}
            </ul>
          </section>
        {/if}
        {#if !area && sc.waiting.length}<p class="wait" data-waiting>{t('No star yet: {list}', { list: sc.waiting.map(areaName).join(', ') })}</p>{/if}
      </div>

      <aside class="col">
        {#if all.years.length}
          <Sec id="tv-years" title={t('By year')} sub={t('tap to see all stars of the year')}>
            <ul class="card rows">
              {#each all.years as y (y.year)}
                <li><a href="#/flow/trophies?y={y.year}" aria-current={year === y.year ? 'page' : undefined}><span><b>{y.year}</b><small>{t('most: {area}', { area: areaName(y.top) })}</small></span><span class="v num">{tn(y.count, '{n} star', '{n} stars')}<ChevronRight size={16} aria-hidden="true" /></span></a></li>
              {/each}
            </ul>
          </Sec>
        {/if}
        {#if all.soon.length}
          <Sec id="tv-soon" title={t('Next within reach')} sub={t('only the next star per milestone')}>
            <ul class="card rows">
              {#each all.soon as r (r.id)}
                <li data-soon={r.id}><span><b>{msName(r.m)}</b><small>{areaName(r.m.actId ?? r.m.area ?? 'cross')}</small></span><span class="v num">{left(r)}</span></li>
              {/each}
            </ul>
          </Sec>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<style>
  /* the look of Meilensteine (Milestones.svelte) and of the trophy shelf (TrophyShelf.svelte) */
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2) var(--sp-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    min-width: 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
  }
  .chip[aria-current='page'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .grp h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.2rem) / 1.25 var(--font-body);
  }
  .sub {
    margin: 2px 0 var(--sp-2);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .badges {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: var(--sp-4) var(--sp-2);
    margin: 0;
    padding: var(--sp-4);
    list-style: none;
  }
  .badges li {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 4px;
    min-width: 0;
    text-align: center;
  }
  .b {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 2px solid var(--hi);
    border-radius: 50%;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .open .b {
    border-style: dashed;
    border-color: var(--ink-3);
    background: none;
    color: var(--ink-3);
  }
  .badges b {
    font: 600 var(--fs-tiny) / 1.25 var(--font-body);
    overflow-wrap: break-word;
    hyphens: auto;
    max-width: 100%;
  }
  .badges small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .rows {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 56px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .rows a {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }
  .rows b {
    display: block;
    font-weight: 600;
  }
  .rows small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .v {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    white-space: nowrap;
  }
  .wait {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
    padding: var(--sp-3) var(--sp-4);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
