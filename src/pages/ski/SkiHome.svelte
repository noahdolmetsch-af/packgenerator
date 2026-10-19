<script>
  /**
   * v0.97.0 «Skitouren», mockup A (Einfach-Muster): on top the main thing, the next ski tour with its
   * backpack check («Rucksack-Check n von m», a bar, the one main button, what is still open by group);
   * then three rows (Start-Check, Saison-Pflege with «n fällig», Nach der Tour) and «Mehr» folded:
   * the season in numbers, the ski learnings, the building blocks. Without a ski tour: «Skitour planen».
   * Noah 15.10.2026 «1a» (Planen und Unterwegs first): SKB1 «Letztes Mal hier» and SKB3 the daylight on the
   * card; SKB5 on the tour day, once started, the card «Unterwegs» on top: the time to the turnaround and
   * the decision points, each ticked with its time (lib/skiday.js).
   */
  import { MountainSnow, Siren, Phone, ChevronRight, ShieldCheck, Wrench, PenLine, Ellipsis, Lightbulb, Plus, Sunrise, History, Check } from '@lucide/svelte';
  import { skiQuery, setSki, setTripFields } from '../../lib/ski/skidb.js';
  import SnowBox from '../../lib/mountain/SnowBox.svelte';
  import { CALLS, telOf } from '../../lib/mountain/sos.js';
  import { lastHere, daylight, underWay, reachPoint, clockOf, leftText, pointsOf } from '../../lib/skiday.js';
  import { durationText, nextSkiTrip, checkGroups, checkCount, seasonStats, careTasks, careState, careDue, seasonHm, lastWithoutNotes, lastPastSki, hmOf, CARE_PHASES, SKI } from '../../lib/ski.js';
  import { newTrip } from '../../lib/nav.js';
  import { localDay } from '../../lib/localday.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import { t, tn, num, locale } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trips = $derived(data?.trips ?? []);

  const nx = $derived(data ? nextSkiTrip(trips, today) : null);
  const groups = $derived(nx ? checkGroups(nx.trip, data.items) : []);
  const count = $derived(checkCount(groups));
  const pct = $derived(count.total ? Math.round((count.packed / count.total) * 100) : 0);
  const open = $derived(groups.filter((g) => g.total > g.packed));
  const stats = $derived(seasonStats(trips, today));
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const nameOf = (trip) => trip?.ski?.peak?.trim() || trip?.title || t('Ski tour');

  /* SKB1, SKB3: the last time here and the daylight of the next tour */
  const before = $derived(nx?.upcoming ? lastHere(nx.trip, trips, today) : null);
  const light = $derived(nx?.upcoming ? daylight(nx.trip.startDate, nx.trip.place) : null);
  /* SKB5: on the way (the clock moves every half minute) */
  let now = $state(new Date());
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 30000);
    return () => clearInterval(id);
  });
  const onTour = $derived(trips.find((x) => underWay(x, today, now)) ?? null);
  const way = $derived(onTour ? underWay(onTour, today, now) : null);
  const reach = (id) => setSki(onTour.id, (ski) => ({ points: reachPoint(pointsOf({ ski }), id, clockOf(new Date())) }));

  /* the care row: the phase of now and what is due */
  const tasks = $derived(careTasks(data?.tasks));
  const hm = $derived(seasonHm(trips, stats.id, today));
  const due = $derived(careDue(tasks, data?.care ?? [], today, hm));
  const month = Number(today.slice(5, 7));
  const phase = $derived.by(() => {
    if (month >= 4 && month <= 9) return 'end';
    const start = tasks.filter((x) => x.phase === 'start');
    return start.every((x) => careState(x, data?.care ?? [], today, hm).state === 'ok') ? 'during' : 'start';
  });
  const phaseTasks = $derived(tasks.filter((x) => x.phase === phase));
  const phaseDone = $derived(phaseTasks.filter((x) => careState(x, data?.care ?? [], today, hm).state === 'ok').length);

  /* the after-the-tour row */
  const toNote = $derived(lastWithoutNotes(trips, today));
  const lastPast = $derived(lastPastSki(trips, today));
  const afterHref = $derived(toNote ? `#/ski/after/${encodeURIComponent(toNote.id)}` : lastPast ? `#/ski/after/${encodeURIComponent(lastPast.id)}` : '#/ski/after');
  const skiLearnings = $derived((data?.learnings ?? []).filter((l) => l.area === SKI).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 5));
</script>

<div class="sk">
  <header class="sk-head">
    <span class="sk-badge" aria-hidden="true"><MountainSnow size={26} /></span>
    <div>
      <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Ski tours')}</h1>
      <p class="sk-sub num">{t('Season {id}', { id: stats.id })} · {tn(stats.tours, '{n} tour|ski', '{n} tours')} · {num(stats.hm)} {t('m climbed|short')}</p>
    </div>
  </header>

  {#if data}
    <div class="sk-cols">
      <div>
        {#if way}
          <section class="surf sk-pad way" aria-label={t('On the way')} data-under-way>
            <p class="sk-kicker">{t('On the way')} · {nameOf(onTour)}</p>
            {#if way.turnAt}
              <p class="sk-title num" class:late={way.left < 0}>{way.left >= 0 ? t('{left} to the turnaround ({time})', { left: leftText(way.left), time: way.turnAt }) : t('Turnaround {time} was {left} ago', { time: way.turnAt, left: leftText(way.left) })}</p>
            {:else}
              <p class="sk-quiet">{t('No turnaround time set.')} <a href="#/ski/start/{encodeURIComponent(onTour.id)}">{t('Start check')}</a></p>
            {/if}
            {#if way.points.length}
              <ul class="sk-list wp">
                {#each way.points as p (p.id)}
                  <li><button type="button" class="sk-tick" role="checkbox" aria-checked={!!p.at} onclick={() => reach(p.id)} data-point={p.name}>
                    <span class="sk-box" aria-hidden="true">{#if p.at}<Check size={18} strokeWidth={3} />{/if}</span>
                    <span class="sk-tt"><b>{p.name}</b>{#if p.at}<small class="num">{t('reached at {time}', { time: p.at })}</small>{/if}</span>
                  </button></li>
                {/each}
              </ul>
            {/if}
          </section>
        {/if}
        {#if nx}
          {@const trip = nx.trip}
          <section class="surf sk-pad main" aria-label={t('Next ski tour')} data-trip={trip.id}>
            <p class="sk-kicker">{nx.upcoming ? t('Next ski tour') : t('Last ski tour')} · {longDay(trip.startDate)}</p>
            <p class="sk-title">{nameOf(trip)}{#if hmOf(trip)}{" · "}{num(hmOf(trip))} {t('m climbed|short')}{/if}</p>
            <div class="sk-count chk"><b>{t('Backpack check')}</b><span class="num">{t('{n} of {m}', { n: count.packed, m: count.total })}</span></div>
            <span class="sk-bar" role="progressbar" aria-label={t('Backpack check')} aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}><i style:width="{pct}%"></i></span>
            {#if before}<p class="sk-quiet line" data-last-here><History size={16} aria-hidden="true" /><span>{t('Last time here: {day}', { day: longDay(before.day) })}{#if before.activeMin}{' · '}{t('{time} moving', { time: durationText(before.activeMin) })}{/if}{#if before.note}{' · «'}{before.note}{'»'}{/if}</span></p>{/if}
            <!-- Paket J #160 (Noah «… als sichtbar auf der skitouren seite»): freezing level and fresh snow -->
            {#if nx.upcoming}<SnowBox trip={trip} compact save={(f) => setTripFields(trip.id, f)} />{/if}
            {#if light}<p class="sk-quiet line num" data-daylight><Sunrise size={16} aria-hidden="true" /><span>{light.rough ? t('Light from {rise} to {set} (roughly, in Switzerland)', light) : t('Light from {rise} to {set}', light)}</span></p>{/if}
            <a class="btn hi sk-go" href="#/ski/check/{encodeURIComponent(trip.id)}" data-to="check">{t('Open the backpack check')}<ChevronRight size={20} aria-hidden="true" /></a>
            {#if open.length}
              <p class="sk-quiet">{t('Still open: {list}', { list: open.map((g) => `${t(g.name)} ${g.total - g.packed}`).join(' · ') })}</p>
            {:else if count.total}
              <p class="sk-quiet">{t('Everything packed.')}</p>
            {:else}
              <p class="sk-quiet">{t('The list of this tour is empty. Add items in Pack.')}</p>
            {/if}
            {#if !nx.upcoming}
              <button type="button" class="btn plan" onclick={() => newTrip('standard', SKI)}><Plus size={18} aria-hidden="true" />{t('Plan a ski tour')}</button>
            {/if}
          </section>
        {:else}
          <Empty text={t('No ski tour yet. Plan one: the backpack check, the start check and the care follow.')} action={{ label: t('Plan a ski tour'), onclick: () => newTrip('standard', SKI) }} />
        {/if}
      </div>

      <div>
        <ul class="surf sk-rows">
          <li>
            <a class="sk-row" href={nx?.upcoming ? `#/ski/start/${encodeURIComponent(nx.trip.id)}` : '#/ski/start'} data-row="start">
              <span class="sk-ri" aria-hidden="true"><ShieldCheck size={20} /></span>
              <span class="sk-rt"><b>{t('Start check at the car park')}</b><small>{t('Transceiver, battery, group check, bulletin, turnaround time · 30 seconds')}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="sk-row" href="#/ski/care" data-row="care">
              <span class="sk-ri" aria-hidden="true"><Wrench size={20} /></span>
              <span class="sk-rt"><b>{t('Season care')}</b><small>{t('{phase}: {n} of {m} done', { phase: t(CARE_PHASES.find((p) => p.key === phase).name), n: phaseDone, m: phaseTasks.length })}</small></span>
              {#if due}<span class="pill warn num" data-due={due}>{t('{n} due', { n: due })}</span>{/if}
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="sk-row" href={afterHref} data-row="after">
              <span class="sk-ri" aria-hidden="true"><PenLine size={20} /></span>
              <span class="sk-rt"><b>{t('After the tour')}</b><small>{#if toNote}{t('Last tour: {name}, not noted yet', { name: nameOf(toNote) })}{:else if lastPast}{t('Last tour: {name} · noted', { name: nameOf(lastPast) })}{:else}{t('After your first tour: peak, metres climbed, three questions')}{/if}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a class="sk-row" href="#/mountain" data-row="mountain">
              <span class="sk-ri" aria-hidden="true"><Siren size={20} /></span>
              <span class="sk-rt"><b>{t('Mountain and emergency')}</b><small>{t('Emergency position, map with steep slopes, emergency QR, grades')}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </li>
        </ul>
        <!-- Paket J #217: the emergency numbers, also offline -->
        <p class="sk-quiet sos-line" data-sos-line><Phone size={15} aria-hidden="true" /><span>{t('Emergency:')}</span>{#each CALLS as c, i (c.key)}{#if i}<span aria-hidden="true">·</span>{/if}<a href={telOf(c.number)} data-call={c.number}>{t(c.label)}</a>{/each}</p>

        <details class="surf more">
          <summary class="sk-row">
            <span class="sk-ri q" aria-hidden="true"><Ellipsis size={20} /></span>
            <span class="sk-rt"><b>{t('More')}</b><small>{t('Season in numbers · peaks · learnings · building blocks')}</small></span>
            <ChevronRight size={18} aria-hidden="true" class="chev" />
          </summary>
          <div class="more-in">
            <h2 class="mh">{t('Season {id}', { id: stats.id })}</h2>
            <div class="stats">
              <p><span class="bignum num">{stats.tours}</span><small>{t('Tours|ski')}</small></p>
              <p><span class="bignum num">{num(stats.hm)}</span><small>{t('Metres climbed')}</small></p>
              <p><span class="bignum num">{stats.peaks.length}</span><small>{t('Peaks')}</small></p>
            </div>
            {#if stats.peaks.length}
              <ul class="sk-list peaks">
                {#each stats.peaks as p (p.tripId)}<li><a class="sk-row" href="#/ski/after/{encodeURIComponent(p.tripId)}"><span class="sk-rt"><b>{p.name}</b><small class="num">{longDay(p.day)}{#if p.hm}{" · "}{num(p.hm)} {t('m climbed|short')}{/if}</small></span><ChevronRight size={18} aria-hidden="true" /></a></li>{/each}
              </ul>
            {/if}
            <h2 class="mh">{t('Learnings|ski')}</h2>
            {#if skiLearnings.length}
              {#each skiLearnings as l (l.id)}<p class="sk-tip"><Lightbulb size={16} aria-hidden="true" /><span>{l.rule}</span></p>{/each}
            {:else}
              <p class="sk-quiet">{t('Your answers in «After the tour» become learnings here and in the backpack check.')}</p>
            {/if}
            <a class="sk-row blocks" href="#/blocks" data-to="blocks">
              <span class="sk-rt"><b>{t('Building blocks')}</b><small>{t('What comes along on every ski tour')}</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
          </div>
        </details>
      </div>
    </div>
  {/if}
</div>

<style>
  .main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .chk {
    margin-top: 4px;
  }
  .plan {
    align-self: flex-start;
    min-height: 44px;
  }
  .more {
    padding: 0 18px;
  }
  .more summary {
    list-style: none;
    cursor: pointer;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .more-in {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 0 16px;
  }
  .mh {
    margin: 8px 0 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .stats p {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
  }
  .stats small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .peaks {
    border-top: 1px solid var(--line);
  }
  .blocks {
    border-top: 1px solid var(--line);
  }
  .line {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .way {
    margin-bottom: 14px;
  }
  .late {
    color: var(--warn);
  }
  .sos-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 10px 0 14px;
  }
  .sos-line a {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    color: var(--ink);
    font-weight: 600;
  }
</style>
