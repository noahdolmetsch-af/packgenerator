<script>
  /**
   * Paket O «Sportarten» (Noah 19.10.2026 «1b und dein Vorschlag … 2a und b … 3 a und b»), #/flow/sport/<id>:
   * one sport with the same seven basic blocks as every other one (#190): Ausrüstung, Packliste, Verlauf und
   * Fortschritt, Ziele, Pflege, Wetter, Fürs nächste Mal; its extra blocks (Gym: training plans, Tennis:
   * lessons and matches, Velo: commuting and loops, Gravel: water and gravel on the route, Downhill: the
   * protection check) and own blocks. «Bausteine anpassen» switches, renames, moves and adds them.
   * At the end what else the app can do for this sport (#218). Loaded only when opened.
   */
  import { SlidersHorizontal, ChevronRight } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import BlockEdit from '../../lib/sportpage/BlockEdit.svelte';
  import GearBlock from '../../lib/sportpage/GearBlock.svelte';
  import PackBlock from '../../lib/sportpage/PackBlock.svelte';
  import LogBlock from '../../lib/sportpage/LogBlock.svelte';
  import GoalsBlock from '../../lib/sportpage/GoalsBlock.svelte';
  import CareBlock from '../../lib/sportpage/CareBlock.svelte';
  import WeatherBlock from '../../lib/sportpage/WeatherBlock.svelte';
  import TextList from '../../lib/sportpage/TextList.svelte';
  import PlansBlock from '../../lib/sportpage/PlansBlock.svelte';
  import LessonsBlock from '../../lib/sportpage/LessonsBlock.svelte';
  import LoopsBlock from '../../lib/sportpage/LoopsBlock.svelte';
  import CommuteBlock from '../../lib/sportpage/CommuteBlock.svelte';
  import RouteBlock from '../../lib/sportpage/RouteBlock.svelte';
  import ParkDaysBlock from '../../lib/sportpage/ParkDaysBlock.svelte';
  import MilestoneSlot from '../../lib/sportpage/MilestoneSlot.svelte';
  import { DOMAINS } from '../../lib/domains.js';
  import { activeGoals } from '../../lib/flow.js';
  import { sortBikes } from '../../lib/bikes.js';
  import { sportBikeId } from '../../lib/sports.js';
  import { equipmentRows } from '../../lib/maingear.js';
  import { FEATURE, featureHref } from '../../lib/features.js';
  import { allSports, orderedSports, colorOf, blocksOf, sportCfg, patchSport, addExtra } from '../../lib/sportsbase.js';
  import { sportDays, featuresFor, PROTECT_PRESET, tripOfSport } from '../../lib/sportshelp.js';
  import { stravaOf } from '../../lib/sportsprogress.js';
  import { saveCfg } from '../../lib/sportsdb.js';
  import { sportsQuery } from '../../lib/sportpage/data.js';
  import { sportName, blockName } from '../../lib/sportpage/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t } from '../../lib/i18n.svelte.js';
  import '../../lib/sportpage/sport.css';

  let { id = '' } = $props();
  const today = localDay();
  const q = sportsQuery();
  const data = $derived($q);
  const cfg = $derived(data?.cfg ?? {});
  const list = $derived(data ? orderedSports(allSports({ domains: DOMAINS, acts: data.acts }), cfg) : []);
  const sport = $derived(list.find((s) => s.id === id) ?? null);
  const c = $derived(sport ? sportCfg(cfg, sport.id) : null);
  const color = $derived(sport ? colorOf(sport.id, list, cfg) : 'var(--line)');
  const blocks = $derived(sport ? blocksOf(sport.id, cfg).filter((b) => b.on) : []);
  const mine = $derived(sport && data ? data.items.filter((x) => x.sport === sport.id) : []);
  const strava = $derived(sport && data ? stravaOf(data.activities, sport.id) : []);
  const dayMap = $derived(sport && data ? sportDays(sport, { log: data.log, trips: data.trips, values: data.items, strava, today }) : new Map());
  const uses = $derived([...dayMap.values()].reduce((s, n) => s + n, 0));
  const mgKey = $derived(!sport || sport.bike ? null : sport.kind === 'act' ? sport.id : `dom:${sport.key}`);
  const gearRows = $derived(mgKey && data ? equipmentRows(data.gear, { trips: data.trips, log: data.log, today }).filter((r) => r.main.sport === mgKey) : []);
  const bike = $derived.by(() => {
    if (!sport?.bike || !data?.bikes.length) return null;
    const bikes = sortBikes(data.bikes);
    const bid = sportBikeId(sport.key, bikes, data.sportBikes, bikes[0].id);
    return bikes.find((b) => b.id === bid) ?? null;
  });
  const bag = $derived(sport?.kind === 'act' && data ? (data.bags.find((b) => b.actId === sport.key) ?? null) : null);
  const lastTrip = $derived(
    sport?.kind === 'trip' && data
      ? ([...data.trips].filter((tr) => tripOfSport(tr, sport.key) && tr.startDate && tr.startDate <= today).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null)
      : null,
  );
  const sportTrips = $derived(sport?.kind === 'trip' && data ? data.trips.filter((tr) => tripOfSport(tr, sport.key)) : []);
  const feats = $derived(sport ? featuresFor(sport, Object.keys(FEATURE)).map((fid) => FEATURE[fid]) : []);
  let editing = $state(false);
  const saveGoal = (goal) => saveCfg(patchSport(cfg, sport.id, { goal }));
  const linesOf = (key) => mine.filter((x) => x.block === key);
</script>

<div class="hob sp" style="--sc:{color}">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }, { href: '#/flow/sports', label: t('Sports|page') }]} here={sport ? sportName(sport) : ''} />
    {#if sport}
      <PageHead title={sportName(sport)} text={t('Your blocks for this sport. Everything is a suggestion: switch off, rename or add blocks.')}>
        <p class="shead"><span class="swatch" style="background:{color}"></span><ActIcon icon={sport.icon} ring={sport.ring} /><button type="button" class="btn" aria-pressed={editing} onclick={() => (editing = !editing)} data-adjust><SlidersHorizontal size={16} aria-hidden="true" />{t('Adjust blocks')}</button></p>
      </PageHead>
    {:else if data}
      <PageHead title={t('Sports|page')} text={t('This sport is no longer there. It may be hidden or deleted.')} />
      <a class="lnk" href="#/flow/sports">{t('All sports')}</a>
    {/if}
  </header>

  {#if sport && data}
    {#if editing}<BlockEdit {sport} {cfg} {color} items={mine} onclose={() => (editing = false)} />{/if}

    {#each blocks as b (b.key)}
      <section class="card blk" aria-labelledby="bl-{b.key}" data-block={b.key}>
        <div class="hl"><h2 id="bl-{b.key}">{blockName(b)}</h2></div>
        {#if b.key === 'gear'}<GearBlock {sport} {gearRows} {bike} />
        {:else if b.key === 'pack'}<PackBlock {sport} {bag} {lastTrip} />
        {:else if b.key === 'log'}<LogBlock {sport} {dayMap} items={mine} activities={strava} {today} {color} />
        {:else if b.key === 'goals'}<GoalsBlock {sport} goals={sport.act ? activeGoals(sport.act, today) : []} own={c.goal} {dayMap} {today} onsave={saveGoal} />
        {:else if b.key === 'care'}<CareBlock {sport} items={mine} {uses} {gearRows} {today} />
        {:else if b.key === 'weather'}<WeatherBlock {sport} days={data.days} {today} />
        {:else if b.key === 'next'}<TextList sport={sport.id} block="next" kind="note" items={linesOf('next')} placeholder={t('e.g. take the warmer gloves')} empty={t('Nothing yet. Write down what you want to do differently next time.')} />
        {:else if b.key === 'plans'}<PlansBlock {sport} items={mine} {today} />
        {:else if b.key === 'lessons'}<LessonsBlock {sport} items={mine} {today} kind="lesson" />
        {:else if b.key === 'matches'}<LessonsBlock {sport} items={mine} {today} kind="match" />
        {:else if b.key === 'loops'}<LoopsBlock {sport} items={mine} />
        {:else if b.key === 'commute'}<CommuteBlock activities={data.activities} log={data.log} {today} />
        {:else if b.key === 'route'}<RouteBlock {sport} items={mine} trips={sportTrips} {today} {color} />
        {:else if b.key === 'protect'}<TextList sport={sport.id} block="protect" kind="check" items={linesOf('protect')} preset={PROTECT_PRESET} placeholder={t('e.g. neck brace')} empty={t('No list yet. Take the suggestion and change it.')} />
          {#if !c.extras.includes('parkdays')}<button type="button" class="chip dash" onclick={() => saveCfg(addExtra(cfg, sport.id, 'parkdays'))} data-add-extra="parkdays">{t('Also note each bike park day')}</button>{/if}
        {:else if b.key === 'parkdays'}<ParkDaysBlock {sport} items={mine} {today} hasProtect={blocks.some((x) => x.key === 'protect')} />
        {:else if b.type === 'notes'}<TextList sport={sport.id} block={b.key} kind="note" items={linesOf(b.key)} placeholder={t('New note')} empty={t('No note yet.')} />
        {:else}<TextList sport={sport.id} block={b.key} kind="check" items={linesOf(b.key)} placeholder={t('New line')} empty={t('No line yet.')} />
        {/if}
      </section>
    {:else}
      <p class="card none">{t('All blocks are switched off. «Adjust blocks» switches them on again.')}</p>
    {/each}

    <!-- «Meilensteine als Belohnung» (Noah 22.10.2026 «1a–5a»): the milestone slot of every sport with a tile -->
    <MilestoneSlot {sport} {today} />

    {#if feats.length}
      <section class="card" aria-labelledby="ft-h" data-sport-features>
        <h2 id="ft-h">{t('What the app can do for {sport}', { sport: sportName(sport) })}</h2>
        <ul class="feat">
          {#each feats as f (f.id)}
            {@const href = featureHref(f, { bikeId: bike?.id ?? null })}
            {#if href}<li><a {href}><span class="t"><b>{t(f.title)}</b><small>{t(f.text)}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>{/if}
          {/each}
        </ul>
        <a class="lnk" href="#/features">{t('Everything the app can do')}</a>
      </section>
    {/if}
  {/if}
</div>
