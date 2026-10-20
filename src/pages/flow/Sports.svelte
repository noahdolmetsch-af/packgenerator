<script>
  /**
   * Paket O «Sportarten» (Noah 19.10.2026), #/flow/sports: every sport in one list, each with its colour
   * (#121), and the activity mosaic over all sports and Meditation with their goals (#96). A row opens the
   * sport's own page (Sport.svelte) with the same basic blocks. Order: arrows and drag (rule «Pfeile und Ziehen»).
   * Loaded only when opened (Flow.svelte imports it on demand).
   */
  import { ChevronRight, Pencil } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import { sortable } from '../../lib/ui/sortable.js';
  import { DOMAINS } from '../../lib/domains.js';
  import { activeGoals } from '../../lib/flow.js';
  import { allSports, orderedSports, colorOf, moveId, sportCfg } from '../../lib/sportsbase.js';
  import { sportDays, mosaic, timesIn, lastDay, goalOf } from '../../lib/sportshelp.js';
  import { stravaOf } from '../../lib/sportsprogress.js';
  import { saveCfg } from '../../lib/sportsdb.js';
  import { sportsQuery } from '../../lib/sportpage/data.js';
  import { sportName } from '../../lib/sportpage/words.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, tn, locale } from '../../lib/i18n.svelte.js';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import '../../lib/sportpage/sport.css';

  const today = localDay();
  const q = sportsQuery();
  const data = $derived($q);
  const cfg = $derived(data?.cfg ?? {});
  const list = $derived(data ? orderedSports(allSports({ domains: DOMAINS, acts: data.acts }), cfg) : []);
  const rows = $derived(
    data
      ? list.map((s) => {
          const dayMap = sportDays(s, { log: data.log, trips: data.trips, values: data.items, strava: stravaOf(data.activities, s.id), today });
          return { sport: s, dayMap, goal: goalOf(s, sportCfg(cfg, s.id).goal, s.act ? activeGoals(s.act, today) : []) };
        })
      : [],
  );
  let showAll = $state(false);
  const n = $derived(phone.matches ? 14 : 28);
  const grid = $derived(mosaic(rows, today, n));
  const shown = $derived(showAll ? grid : grid.filter((r) => r.active || r.goal));
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });

  async function move(id, to) {
    const ids = moveId(
      list.map((s) => s.id),
      id,
      to,
    );
    await saveCfg({ ...cfg, _order: ids });
  }
  const step = (s, dir) => move(s.id, list.indexOf(s) + dir);
  const dragged = (from, to) => move(list[from].id, to);
</script>

<div class="hob sp">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }]} here={t('Sports|page')} />
    <PageHead title={t('Sports|page')} text={t('Every sport with the same blocks: equipment, packing list, history and progress, goals, care, weather and «For next time». Switch off what you do not need.')} />
    <AreaIntro place="sports" />
  </header>

  {#if data}
    <section class="card mos" aria-labelledby="mos-h" data-mosaic>
      <div class="hl">
        <h2 id="mos-h">{t('All sports at a glance')}</h2>
        <span class="small">{tn(n, 'last {n} day', 'last {n} days')}</span>
      </div>
      <p class="small">{t('One square per day you did the sport, in its colour. On the right: how far you are with its goal.')}</p>
      {#if shown.length}
        <ul class="mrows">
          {#each shown as r (r.sport.id)}
            {@const c = colorOf(r.sport.id, list, cfg)}
            <li data-mosaic-row={r.sport.id}>
              <a class="mn" href="#/flow/sport/{encodeURIComponent(r.sport.id)}"><i class="dot" style="background:{c}"></i>{sportName(r.sport)}</a>
              <span class="cells" style="--n:{n}" aria-label={t('{name}: {k} of the last {n} days', { name: sportName(r.sport), k: r.cells.filter((x) => x.n).length, n })}>
                {#each r.cells as x (x.day)}<i class="cell" class:on={x.n > 0} style={x.n ? `background:${c}` : ''} title={fmt(x.day, { weekday: 'short', day: 'numeric', month: 'short' })}></i>{/each}
              </span>
              <span class="mg num" class:met={r.met}>{#if r.goal}{t('{n} of {m}', { n: r.times, m: r.goal.count })}<small>{tn(r.goal.days, '{n} day', '{n} days')}</small>{/if}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{t('Nothing done in this time yet. Tick an activity in Aktiv or finish a trip, then it shows here.')}</p>
      {/if}
      {#if grid.length > shown.length || showAll}
        <button type="button" class="lnk" onclick={() => (showAll = !showAll)} data-mosaic-all>{showAll ? t('Only the active ones') : tn(grid.length - shown.length, 'Show {n} more sport', 'Show {n} more sports')}</button>
      {/if}
    </section>

    <section class="card" aria-labelledby="sl-h">
      <div class="hl"><h2 id="sl-h">{t('Your sports')}</h2></div>
      <p class="small">{t('Tap a sport to see its blocks. Drag or use the arrows to change the order.')}</p>
      <ul class="slist" use:sortable={{ onmove: dragged }} data-sport-list>
        {#each list as s, i (s.id)}
          {@const r = rows.find((x) => x.sport.id === s.id)}
          {@const last = r ? lastDay(r.dayMap) : null}
          <li data-sort-id={s.id} data-sport={s.id}>
            <SortGrip name={sportName(s)} onstep={(d) => step(s, d)} />
            <a class="srow" href="#/flow/sport/{encodeURIComponent(s.id)}">
              <i class="bar" style="background:{colorOf(s.id, list, cfg)}"></i>
              <ActIcon icon={s.icon} ring={s.ring} />
              <span class="t"><b>{sportName(s)}</b><small>{#if last}{tn(timesIn(r.dayMap, today, 30), '{n}× in 30 days', '{n}× in 30 days')}{' · '}{t('last {date}', { date: fmt(last, { day: 'numeric', month: 'short' }) })}{:else}{t('not done yet')}{/if}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
            <SortArrows name={sportName(s)} {i} n={list.length} onstep={(d) => step(s, d)} />
          </li>
        {/each}
      </ul>
      <p class="small edit"><Pencil size={14} aria-hidden="true" /> {t('Add, rename or hide sports:')} <a href="#/me/lists?domains">{t('sports of a trip')}</a> · <a href="#/flow/goals">{t('activities of Aktiv')}</a></p>
    </section>
  {/if}
</div>
