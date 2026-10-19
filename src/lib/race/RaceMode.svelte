<script>
  /**
   * Paket U «Rennen» · 17 Renn-Modus: only what you need on the bike, calm and power-saving (light, big
   * black text, no images, no maps, no animations). Where you are (km) → the next checkpoint with the
   * cut-off speed (25), the next shop, water and bed (2, 27), the next small goal (29), then the boxes:
   * food (10), sun cream (30), ride on or sleep (18), tiredness (3), my why (23), contact points (14),
   * plan vs actual (1) and bad weather now (28). The clock moves once a minute.
   */
  import { Minus, Plus, Check, CloudLightning } from '@lucide/svelte';
  import Box from './ride/Box.svelte';
  import FoodLog from './ride/FoodLog.svelte';
  import RideOrSleep from './ride/RideOrSleep.svelte';
  import Contacts from './ride/Contacts.svelte';
  import { TIRED, BAD_WEATHER, checkpointRows, cutoffNeed, lastActual, miniGoals, hhmm, hm, localOf, dayOfMs } from './race.js';
  import { nextSupply, openAt, wxAt, uvAdvice, WX_CACHE, POI_KIND } from './outside.js';
  import { creamDue } from './more.js';
  import { cacheQuery, putRace } from './store.js';
  import { etaFrom, ahead, nextCheckpoint, nextGoal, wxNear } from './ride-lib.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { ctx } = $props();
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(id);
  });

  const wxQ = cacheQuery(WX_CACHE + ctx.trip.id);
  const wx = $derived($wxQ?.data ?? null);
  const total = $derived(ctx.route?.km ?? 0);
  const km = $derived(Math.max(0, Math.min(total || Infinity, ctx.race.currentKm)));
  const plan = $derived(ctx.plan);
  const eta = $derived(etaFrom(plan, km, now));
  const when = (ms) => (ms == null ? '' : dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}`);
  const kindName = (p) => p.name || t(POI_KIND[p.kind]?.name ?? 'Other stop');

  /* where you are */
  function setKm(v) {
    const k = Math.round(Math.max(0, Math.min(total || 99999, Number(v) || 0)) * 10) / 10;
    ctx.save({ currentKm: k });
  }

  /* the big lines */
  const rows = $derived(checkpointRows(ctx.race, plan));
  const cp = $derived(nextCheckpoint(rows, km));
  const need = $derived(cp?.cutMs ? cutoffNeed({ fromKm: km, now, toKm: Number(cp.km), cutMs: cp.cutMs, blocks: plan?.blocks ?? [] }) : null);
  const shop = $derived(nextSupply(ctx.pois, km, eta));
  const water = $derived(ahead(ctx.pois, km, ['water'])[0] ?? null);
  const bed = $derived(ahead(ctx.pois, km + 0.05, ['sleep'])[0] ?? null);
  const goal = $derived(nextGoal(miniGoals(ctx.race, total), ctx.race.goalsDone, ctx.pois, km));
  const stateOf = (s) => (s.open === true ? (s.closes ? t('open, closes {time}', { time: s.closes }) : t('open')) : s.open === false ? (s.opens ? t('closed, opens {time}', { time: s.opens }) : t('closed')) : t('opening hours unknown'));
  const bufferH = $derived(plan ? (plan.etaOf(km) - now) / 36e5 : 0); // + = ahead of the plan

  async function tickGoal() {
    if (!goal?.key) return;
    const before = await ctx.save({ goalsDone: [...ctx.race.goalsDone, goal.key] });
    offerDone(t('Goal ticked.'), () => putRace(ctx.trip.id, before));
  }

  /* 23 my why */
  const tiredNow = $derived(ctx.race.tired.at(-1)?.v ?? 0);
  const whyRows = $derived(ctx.race.why.filter((w) => w.text));
  const showWhy = $derived(ctx.stored.whyOn !== false && whyRows.length > 0 && (new Date(now).getHours() >= 20 || tiredNow >= 4));

  /* 30 sun cream */
  const uv = $derived(wxAt(wxNear(wx, ctx.pts, km), now)?.uv ?? null);
  const creamAt = $derived(Date.parse(ctx.stored.creamAt ?? ''));
  const due = $derived(creamDue(uv, Number.isFinite(creamAt) ? creamAt : null, now));
  const uvTip = $derived(uvAdvice(uv));

  /* 1 plan vs actual */
  const last = $derived(lastActual(rows));
  let cpPick = $state('');
  const pickRow = $derived(rows.find((r) => r.id === cpPick) ?? cp ?? rows.at(-1) ?? null);
  async function atCheckpoint() {
    if (!pickRow) return;
    const at = localOf(Date.now());
    const before = await ctx.save({ checkpoints: ctx.race.checkpoints.map((c) => (c.id === pickRow.id ? { ...c, actual: at } : c)), currentKm: Number(pickRow.km) || km });
    offerDone(t('«{name}» at {time} noted.', { name: pickRow.name || t('Checkpoint'), time: at.slice(11) }), () => putRace(ctx.trip.id, before));
  }
  const diffText = (h) => (Math.abs(h) < 1 / 60 ? t('exactly on plan') : h < 0 ? t('{t} ahead of plan', { t: hm(-h) }) : t('{t} behind plan', { t: hm(h) }));

  /* 3 tiredness */
  async function tired(v) {
    const before = await ctx.save({ tired: [...ctx.race.tired, { at: new Date().toISOString(), v }] });
    offerDone(t('Tiredness noted.'), () => putRace(ctx.trip.id, before));
  }

  /* 28 bad weather */
  let bad = $state(false);
  const roofs = $derived(ahead(ctx.pois, km, ['shelter', 'station'], 20));
  const plans = $derived(ctx.race.badWeather ? ctx.race.badWeather.map((b) => ({ ...b, own: true })) : BAD_WEATHER);
</script>

<div class="rm" data-race-mode>
  {#if showWhy}
    <section class="rc-box rc-soft" data-race-box="ride-why" aria-label={t('My why')}>
      <h2 class="rc-h2">{t('Why you are doing this')}</h2>
      {#each whyRows as w (w.id)}<p class="rm-why">{w.text}</p>{/each}
      <button type="button" class="btn sm" onclick={() => ctx.save({ whyOn: false })} data-race-why-off>{t('Do not show this in race mode')}</button>
    </section>
  {/if}

  <section class="rc-box" data-race-box="ride-km">
    <label class="rm-kmlab" for="rm-km">{t('I am at km')}</label>
    <div class="rm-km">
      <button type="button" class="btn" onclick={() => setKm(km - 10)} aria-label={t('10 km back')} data-race-km-minus><Minus size={18} aria-hidden="true" />10</button>
      <input id="rm-km" class="inp rm-kminp" type="number" min="0" step="0.1" inputmode="decimal" value={km} onchange={(e) => setKm(e.currentTarget.value)} data-race-km />
      <button type="button" class="btn" onclick={() => setKm(km + 10)} aria-label={t('10 km on')} data-race-km-plus><Plus size={18} aria-hidden="true" />10</button>
    </div>
    {#if plan}<button type="button" class="btn sm" onclick={() => setKm(plan.kmAt(now))} data-race-km-plan>{t('Use the plan (km {km} now)', { km: num(Math.round(plan.kmAt(now))) })}</button>{/if}
    {#if total}<p class="rc-note">{t('{left} km to the finish', { left: num(Math.round(total - km)) })}</p>{/if}
  </section>

  <section class="rc-box rm-lines" data-race-box="ride-next" aria-label={t('What comes next')}>
    {#if cp}
      <div class="rm-line" data-race-next="checkpoint">
        <small>{t('Next checkpoint')}</small>
        <b>{cp.name || t('Checkpoint')} · {t('{km} km to go', { km: num(Math.round(cp.km - km)) })}</b>
        {#if eta}<span>{t('planned around {time}', { time: when(eta(Number(cp.km))) })}</span>{/if}
        {#if need}
          <span class:rc-warn={need.kmh > 25} data-race-cutoff>{Number.isFinite(need.kmh) ? t('You need Ø {kmh} km/h to make the cut-off at {time}', { kmh: num(Math.round(need.kmh)), time: when(cp.cutMs) }) : t('The cut-off at {time} cannot be reached any more.', { time: when(cp.cutMs) })}</span>
        {/if}
      </div>
    {/if}
    {#if shop}
      <div class="rm-line" data-race-next="shop">
        <small>{t('Next food')}</small>
        <b>{kindName(shop.poi)} · {t('in {km} km', { km: num(shop.km) })}</b>
        <span>{shop.at ? `${t('there around {time}', { time: when(shop.at) })} · ` : ''}{stateOf(shop.state)}</span>
      </div>
    {/if}
    {#if water}
      <div class="rm-line" data-race-next="water">
        <small>{t('Next water')}</small>
        <b>{kindName(water)} · {t('in {km} km', { km: num(Math.round((water.km - km) * 10) / 10) })}</b>
        {#if eta}<span>{t('there around {time}', { time: when(eta(water.km)) })}</span>{/if}
      </div>
    {/if}
    {#if bed}
      <div class="rm-line" data-race-next="bed">
        <small>{t('Next bed')}</small>
        <b>{kindName(bed)} · {t('in {km} km', { km: num(Math.round((bed.km - km) * 10) / 10) })}</b>
        <span>{eta ? t('there around {time}', { time: when(eta(bed.km)) }) : ''}{bed.hours && eta ? ` · ${stateOf(openAt(bed.hours, new Date(eta(bed.km))))}` : ''}</span>
        {#if bed.phone}<a href="tel:{bed.phone}">{bed.phone}</a>{/if}
      </div>
    {/if}
    {#if !cp && !shop && !water && !bed}<p class="rc-empty">{t('No checkpoints or places yet. Add them under «Prepare» and «Along the route».')}</p>{/if}
    {#if goal}
      <div class="rm-goal" data-race-goal>
        <b>{t('To the next stop: {km} km', { km: num(Math.round((goal.km - km) * 10) / 10) })}</b>
        <span class="rc-note">{goal.kind === 'goal' ? (goal.key === 'finish' ? t('Finish') : goal.name || t('km {km}', { km: num(goal.km) })) : `${goal.name || t(POI_KIND[goal.kind]?.name ?? 'Other stop')}`}</span>
        {#if goal.key}<button type="button" class="btn sm" onclick={tickGoal} data-race-goal-done><Check size={16} aria-hidden="true" />{t('Reached')}</button>{/if}
      </div>
    {/if}
  </section>

  <div class="rc-grid">
    <FoodLog {ctx} {now} />

    <Box id="ride-cream" title={t('Sun cream')} what="Notes when you put sun cream on and says when it is time again (every 2 hours from UV 3)." why="Sunburn on day 1 costs sleep and strength for the whole race." from="The UV forecast at your km from the weather you loaded under «Along the route» (Open-Meteo), and your taps.">
      {#if due}<p class="rm-due rc-warn" data-race-cream-due>{t('Cream again')}</p>{/if}
      <p class="rc-text">{uv == null ? t('No UV forecast for now. Load the weather under «Along the route».') : `${t('UV now {n}', { n: num(Math.round(uv)) })} · ${t(uvTip.key)}`}</p>
      {#if Number.isFinite(creamAt)}<p class="rc-note">{t('Last time at {time}', { time: when(creamAt) })}</p>{/if}
      <button type="button" class="btn hi rm-tap" onclick={() => ctx.save({ creamAt: new Date().toISOString() })} data-race-cream>{t('Creamed')}</button>
    </Box>

    <RideOrSleep {ctx} {now} {km} {wx} {bufferH} />

    <Box id="ride-tired" title={t('Tiredness check')} what="One tap: how tired you feel now, from fresh to microsleep danger." why="Tiredness creeps up; the last entries show the trend and feed «Ride on or sleep?»." from="Your taps, kept in this race. An observation, not a diagnosis.">
      <div class="rc-chips" role="group" aria-label={t('How tired are you?')}>
        {#each TIRED as x (x.v)}<button type="button" class="rc-chip" aria-pressed={tiredNow === x.v} onclick={() => tired(x.v)} data-race-tired={x.v}>{t(x.name)}</button>{/each}
      </div>
      {#if ctx.race.tired.length}
        <p class="rc-note">{ctx.race.tired.slice(-5).map((x) => `${when(Date.parse(x.at))} ${t(TIRED.find((y) => y.v === x.v)?.name ?? 'Fine')}`).join(' · ')}</p>
      {/if}
    </Box>

    <Contacts {ctx} {now} />

    <Box id="ride-actual" title={t('Plan vs actual')} what="One tap at a checkpoint notes the time; the app shows how far ahead or behind your plan you are." why="You know at once if the plan still holds, and the report after the race uses these times." from="Your checkpoints from «Prepare», your plan, your taps.">
      {#if rows.length}
        <label class="rc-lab">{t('Checkpoint')}
          <select class="inp" bind:value={cpPick} data-race-cp-pick>
            <option value="">{t('The next one')}</option>
            {#each rows as r (r.id)}<option value={r.id}>{r.name || t('Checkpoint')} · km {num(Math.round(r.km))}</option>{/each}
          </select>
        </label>
        <button type="button" class="btn hi" onclick={atCheckpoint} data-race-cp-now>{t('I am at «{name}» now', { name: pickRow?.name || t('Checkpoint') })}</button>
        {#if last?.diffH != null}<p class="rc-text" class:rc-ok={last.diffH <= 0} class:rc-warn={last.diffH > 0} data-race-diff>{last.name}: {diffText(last.diffH)}</p>{/if}
      {:else}
        <p class="rc-empty">{t('No checkpoints yet. Add them under «Prepare».')}</p>
      {/if}
    </Box>

    <Box id="ride-bad" title={t('Bad weather now')} what="Shows the shelters and stations in the next 20 km and your own plans for bad weather." why="In a storm you need a roof fast, not a search." from="Shelters and stations from your stop file and OpenStreetMap, your plans from «Prepare».">
      <button type="button" class="btn" aria-expanded={bad} onclick={() => (bad = !bad)} data-race-bad><CloudLightning size={18} aria-hidden="true" />{t('Bad weather now')}</button>
      {#if bad}
        {#if roofs.length}
          <ul class="rc-list">
            {#each roofs as p (p.id ?? `${p.kind}${p.km}`)}<li class="rc-row"><span class="rc-row-main"><b>{kindName(p)}</b><small>{t(POI_KIND[p.kind]?.name ?? 'Other stop')} · {t('in {km} km', { km: num(Math.round((p.km - km) * 10) / 10) })}</small></span></li>{/each}
          </ul>
        {:else}
          <p class="rc-empty">{t('No shelter or station known in the next 20 km.')}</p>
        {/if}
        {#each plans as b (b.id)}
          <p class="rc-text"><b>{b.own ? b.when : t(b.when)}:</b> {b.own ? b.then : t(b.then)}</p>
        {/each}
      {/if}
    </Box>
  </div>
  <label class="rc-inline rc-note"><input type="checkbox" checked={ctx.stored.whyOn !== false} onchange={(e) => ctx.save({ whyOn: e.currentTarget.checked })} data-race-why-on />{t('Show my why in the evening and when I am very tired')}</label>
</div>

<style>
  .rm {
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--ink);
  }
  .rm :global(*) {
    animation: none !important;
    transition: none !important;
  }
  .rm-kmlab {
    font: 700 var(--fs-section) var(--font-body);
  }
  .rm-km {
    display: flex;
    gap: 8px;
  }
  .rm-kminp {
    flex: 1 1 auto;
    min-width: 0;
    font: 800 var(--fs-page) var(--font-body);
    text-align: center;
  }
  .rm-lines {
    gap: 14px;
  }
  .rm-line,
  .rm-goal {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .rm-line small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rm-line b,
  .rm-goal b {
    font: 700 var(--fs-title)/1.25 var(--font-body);
  }
  .rm-line span {
    font-size: var(--fs-body);
  }
  .rm-goal {
    padding-top: 10px;
    border-top: 1px solid var(--line);
    align-items: flex-start;
  }
  .rm-why {
    margin: 0;
    font: 600 var(--fs-title)/1.3 var(--font-body);
    white-space: pre-line;
  }
  .rm-due {
    margin: 0;
    font: 700 var(--fs-title) var(--font-body);
  }
  .rm :global(.rm-tap) {
    min-height: 56px;
    font-size: var(--fs-title);
  }
</style>
