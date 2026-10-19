<script>
  /** Vorbereiten › Total weight along the route (36), Spares for the surface (34), Tool fits the bike (39). */
  import { CloudDownload } from '@lucide/svelte';
  import RaceBox from '../RaceBox.svelte';
  import { rigOf } from '../race.js';
  import { weightAlong, fetchRoads, sparesFor, toolCheck, sizeLabel } from '../more.js';
  import { cacheSet, cacheQuery } from '../store.js';
  import { kmOfKinds, lineOf } from '../prep-lib.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { ctx } = $props();

  // 36 · Weight along the route
  const rig = $derived(rigOf(ctx.trip, ctx.items));
  const bikeG = $derived(Number(ctx.bike?.weightG) || 0);
  const base = $derived((rig.g + bikeG) / 1000);
  const waterL = $derived(Number(ctx.stored.waterL) > 0 ? Number(ctx.stored.waterL) : 2.5);
  const foodKg = $derived(Number(ctx.stored.foodKg) > 0 ? Number(ctx.stored.foodKg) : 1.5);
  const along = $derived(
    ctx.plan && ctx.route?.km
      ? weightAlong({ base, totalKm: ctx.route.km, eta: ctx.plan.etaOf, waterAt: kmOfKinds(ctx.pois, ['water', 'shop', 'food', 'fuel']), foodAt: kmOfKinds(ctx.pois, ['shop', 'food', 'fuel']), waterL, foodKg })
      : null,
  );
  const line = $derived(along ? lineOf(along.points) : null);

  // 34 · Spares
  const roadsKey = $derived('race-roads:' + ctx.trip.id);
  const roadsQ = $derived(cacheQuery(roadsKey));
  let busy = $state(false);
  let msg = $state('');
  const roads = $derived($roadsQ ?? null);
  const osmShare = $derived(roads?.data?.gravelShare ?? null);
  const share = $derived(osmShare ?? (Number(ctx.stored.gravelPct) >= 0 && ctx.stored.gravelPct !== '' && ctx.stored.gravelPct != null ? Number(ctx.stored.gravelPct) : 0));
  const spares = $derived(ctx.route?.km ? sparesFor(ctx.route.km, share) : []);
  async function loadRoads() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      msg = t('You are offline. Try again with internet.');
      return;
    }
    busy = true;
    msg = '';
    try {
      const res = await fetchRoads(ctx.pts, ctx.route.km);
      await cacheSet(roadsKey, res);
      if (res.gravelShare == null) msg = t('OpenStreetMap knows no surface here: set the share yourself.');
    } catch (err) {
      console.error(err);
      msg = err?.message === 'busy' ? t('OpenStreetMap is busy. Try again in a minute.') : t('Loading did not work. Try again later.');
    } finally {
      busy = false;
    }
  }
  const age = (at) => (at ? new Date(at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');

  // 39 · Tool
  const bikeKey = $derived(ctx.bike?.id ?? 'none');
  const tools = $derived(ctx.stored.tools?.[bikeKey] ?? {});
  const check = $derived(toolCheck(tools.bolts ?? '', tools.tool ?? ''));
  const setTool = (patch) => ctx.save((s) => ({ ...s, tools: { ...(s.tools ?? {}), [bikeKey]: { ...(s.tools?.[bikeKey] ?? {}), ...patch } } }));
  const size = (s) => t(...sizeLabel(s));
</script>

<RaceBox
  id="prep-weight"
  title={t('Total weight along the route')}
  what="Shows how heavy bike, bags, water and food are along the route: full after a shop, light before the next one."
  why="You see where you carry the most, for example before a long climb without water."
  from="The weights of your packed things and your bike, the plan and the stops along the route."
>
  {#if along}
    <div class="rc-form">
      <div class="rc-grid three">
        <label class="rc-lab">{t('Water you carry (l)')}<input class="inp" type="number" min="0" max="10" step="0.25" value={waterL} onchange={(e) => ctx.save({ waterL: Number(e.currentTarget.value) || null })} data-race-water /></label>
        <label class="rc-lab">{t('Food you carry (kg)')}<input class="inp" type="number" min="0" max="10" step="0.1" value={foodKg} onchange={(e) => ctx.save({ foodKg: Number(e.currentTarget.value) || null })} data-race-foodkg /></label>
        <div class="rc-stat"><div><b>{num(Math.round(base * 10) / 10)}</b><small>{t('kg without food and water')}</small></div></div>
      </div>
    </div>
    <svg viewBox="0 0 300 90" width="100%" role="img" aria-label={t('Heaviest at km {km}: {kg} kg', { km: num(along.max.km), kg: num(along.max.kg) })} data-race-weight-line>
      <path d={line.d} fill="none" stroke="var(--accent, currentColor)" stroke-width="1.5" />
      <circle cx={line.x(along.max.km)} cy={line.y(along.max.kg)} r="3" fill="var(--ink, currentColor)" />
    </svg>
    <p class="rc-text"><b>{t('Heaviest at km {km}: {kg} kg', { km: num(along.max.km), kg: num(along.max.kg) })}</b> · {t('lightest {kg} kg', { kg: num(along.min.kg) })}</p>
    {#if !bikeG}<p class="rc-note">{t('The bike has no weight yet: add it under Bikes.')}</p>{/if}
    {#if rig.missing}<p class="rc-note">{t('{n} things without a weight count as 0 g.', { n: rig.missing })}</p>{/if}
  {:else}
    <p class="rc-empty">{t('Load the route and set the start (Strategy) first.')}</p>
  {/if}
</RaceBox>

<RaceBox
  id="prep-spares"
  title={t('Spares for the surface')}
  what="Suggests how many tubes, plugs, pads and chain links to take for the length and the gravel share."
  why="More gravel means more flats and faster wearing pads; you take enough without carrying too much."
  from="The surface of the roads along the route from OpenStreetMap (only when you tap), or your own guess."
>
  {#if ctx.route?.km}
    <button type="button" class="btn" onclick={loadRoads} disabled={busy || !ctx.pts?.length} data-race-roads>
      <CloudDownload size={16} aria-hidden="true" />{busy ? t('Loading…') : t('Check the surface on OpenStreetMap')}
    </button>
    {#if msg}<p class="rc-note" role="status">{msg}</p>{/if}
    {#if osmShare != null}
      <p class="rc-text">{t('About {pct} % gravel', { pct: osmShare })}</p>
      <p class="rc-src">{t('From OpenStreetMap, loaded {when}', { when: age(roads.at) })}</p>
    {:else}
      <label class="rc-lab">{t('Gravel share (%)')}<input class="inp" type="number" min="0" max="100" step="5" value={ctx.stored.gravelPct ?? ''} placeholder="0" onchange={(e) => ctx.save({ gravelPct: e.currentTarget.value === '' ? null : Number(e.currentTarget.value) })} data-race-gravel /></label>
    {/if}
    <ul class="rc-list" data-race-spares>
      {#each spares as s (s.key)}<li class="rc-row"><span class="rc-num">{s.n}</span><span>{t(s.key)}</span></li>{/each}
    </ul>
  {:else}
    <p class="rc-empty">{t('Load the route first.')}</p>
  {/if}
</RaceBox>

<RaceBox
  id="prep-tool"
  title={t('Tool fits the bike')}
  what="Compares the bolt sizes of your bike with the sizes of your multitool."
  why="On the road you notice too late that the Torx for the brake disc is missing."
  from="What you write here (per bike)."
>
  {#if ctx.bike}<p class="rc-note">{t('For {name}', { name: ctx.bike.name })}</p>{/if}
  <label class="rc-lab">{t('Bolts on the bike')}<input class="inp" value={tools.bolts ?? ''} placeholder={t('e.g. Hex 4, 5 · Torx T25')} onchange={(e) => setTool({ bolts: e.currentTarget.value })} data-race-bolts /></label>
  <label class="rc-lab">{t('Sizes of your tool')}<input class="inp" value={tools.tool ?? ''} placeholder={t('e.g. Hex 2, 2.5, 3, 4, 5, 6, 8 · Torx T25 · chain tool')} onchange={(e) => setTool({ tool: e.currentTarget.value })} data-race-tool /></label>
  {#if check.missing.length || check.ok.length}
    <ul class="rc-chips" data-race-toolcheck>
      {#each check.missing as s (s)}<li class="rc-chip rc-warn">{t('Missing: {size}', { size: size(s) })}</li>{/each}
      {#each check.ok as s (s)}<li class="rc-chip rc-ok">{size(s)} ✓</li>{/each}
    </ul>
    {#if !check.missing.length}<p class="rc-ok">{t('Your tool fits every bolt you listed.')}</p>{/if}
  {/if}
</RaceBox>
