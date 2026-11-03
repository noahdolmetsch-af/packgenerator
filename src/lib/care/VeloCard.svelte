<script>
  /**
   * «Velo im Griff» (Noah 19.10.2026) on a bike's care page, above «Pflege für …»:
   * - #1009 the kind of the bike (road bike, gravel, mountain bike): which part template it follows
   *   and the speed for the hour estimate; a link to the templates;
   * - #193 the riding hours (Strava moving time, else km ÷ average speed: «≈») and the service of the
   *   whole bike by km, hours or days, whichever comes first, with «Service done» (Undo) and the sheet;
   * - #327 one row to the «Werkstatt-Spick» (torque values, breakdowns), which works offline.
   * bike: the bike AS STORED; km: its km; oncare(patch): stores fields on the bike.
   */
  import { Wrench, ChevronRight, ChevronDown, Check, Settings2, BookOpen, Shapes, Eye, EyeOff, MessageCircleQuestion, ListChecks } from '@lucide/svelte';
  import { PARTS, partName, partOnBike, isBlank } from '../care.js';
  import { t, num, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { bikesHash } from '../bikes.js';
  import { vig } from '../veloimgriff.svelte.js';
  import { kindName, kindsOffered, kindOf, setBikePart } from '../bikekind.js';
  import { hoursText, hoursOn, speedOf } from '../bikehours.js';
  import { serviceState, serviceDone, serviceSwitch } from '../bikeservice.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import ServiceSheet from './ServiceSheet.svelte';
  import ShowMore from '../ui/ShowMore.svelte';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS } from '../touren/kurz.js';

  let { bike, km = null, oncare } = $props();

  const today = localDay();
  const series = $derived(vig.hours[bike.id] ?? null);
  const kind = $derived(kindOf(bike));
  const sv = $derived(serviceState({ ...bike, km }, series, today));
  let sheet = $state(false);
  let showParts = $state(false);
  // the bike's own show/hide of each part (Noah 19.10.2026 «teile können eingeblendet werden oder ausgeblendet»)
  const partRows = $derived(
    PARTS.filter((p) => !p.legacy).map((p) => {
      const stored = (bike.parts ?? []).find((x) => x.key === p.key);
      return { key: p.key, name: partName(p), on: partOnBike(bike, p.key, vig.tpl), full: !!stored && !isBlank(stored) };
    }),
  );
  let busy = $state(false);
  // Gesamttest 21.10.2026 C7: on a phone the first PHONE_ROWS parts, then «Show n more».
  let partsAll = $state(false);
  const partShown = $derived(phone.matches && !partsAll ? partRows.slice(0, PHONE_ROWS) : partRows);

  async function store(patch) {
    if (busy) return;
    busy = true;
    try {
      await oncare?.($state.snapshot(patch));
    } finally {
      busy = false;
    }
  }
  async function done() {
    const before = $state.snapshot(bike.service ?? null);
    await store(serviceDone(bike, { day: today, km, hours: hoursOn(series, today) }));
    offerDone(t('Bike service saved: {date}.', { date: dateOf(today) }), () => oncare?.({ service: before ?? {} }));
  }
  const left = $derived.by(() => {
    if (!sv.on || sv.never) return '';
    const parts = [];
    if (sv.kmLeft != null) parts.push(sv.kmLeft > 0 ? t('{n} km', { n: num(sv.kmLeft) }) : t('now|due'));
    if (sv.hoursLeft != null) parts.push(sv.hoursLeft > 0 ? hoursText(sv.hoursLeft, sv.hoursEst) : t('now|due'));
    if (sv.next) parts.push(sv.daysLeft > 0 ? t('by {date}', { date: dateOf(sv.next) }) : t('now|due'));
    return parts.join(' · ');
  });
</script>

<section class="vig" aria-labelledby="vig-h-{bike.id}" data-velo-card>
  <h3 id="vig-h-{bike.id}"><Wrench size={18} aria-hidden="true" />{t('Bike service')}</h3>
  <p class="lead">{t('The service of the whole bike: by km, riding hours or days, whichever comes first.')}</p>

  <div class="row hours" data-velo-hours>
    <span class="k">{t('Riding hours')}</span>
    <span class="v num">{series?.total != null ? hoursText(series.total, series.est > 0.005) : t('not known yet')}</span>
  </div>
  {#if series?.total != null && series.est > 0.005}
    <p class="hint">{t('≈ estimated: km without a time from Strava count with {n} km/h ({kind}).', { n: num(speedOf(bike)), kind: kindName(kind, t) })}</p>
  {/if}

  <div class="svc" class:due={sv.due} class:off={!sv.on} data-velo-service>
    <div class="st">
      {#if !sv.on}
        <b>{t('off: no reminder')}</b>
      {:else if sv.never}
        <b>{t('Last service not recorded yet')}</b>
        <small>{t('Tap «Service done» after the next service, or enter the last one.')}</small>
      {:else}
        <b>{sv.due ? t('Service due') : t('Next service')}{left ? `: ${left}` : ''}</b>
        <small>{t('Last: {date}', { date: dateOf(sv.last.day) })}{sv.last.km != null ? ` · ${num(sv.last.km)} km` : ''}</small>
      {/if}
    </div>
    <div class="acts">
      {#if sv.on}<button type="button" class="btn {sv.due ? 'hi' : ''}" disabled={busy} onclick={done} data-service-done><Check size={16} aria-hidden="true" />{t('Service done')}</button>{/if}
      <button type="button" class="btn" onclick={() => (sheet = true)} data-service-edit><Settings2 size={16} aria-hidden="true" />{t('Set up|service')}</button>
      <button type="button" class="switch" role="switch" aria-checked={sv.on} disabled={busy} aria-label={t('Reminder: bike service')} onclick={() => store(serviceSwitch(bike, !sv.on))}><span class="knob"></span></button>
    </div>
  </div>

  <div class="kind">
    <span class="k" id="vig-kind-{bike.id}">{t('Kind of bike')}</span>
    <Seg options={kindsOffered(kind).map((k) => ({ key: k.id, name: kindName(k.id, t) }))} value={kind} labelledby="vig-kind-{bike.id}" full={false} small onchange={(k) => store({ kind: k })} />
  </div>
  <p class="hint">{t('The kind sets which parts the bike gets and the speed for the hour estimate.')} <a href="#/me/lists?bikeKinds" data-bike-kinds>{t('Change the kinds')} ›</a></p>

  <button type="button" class="lnk fold" aria-expanded={showParts} onclick={() => (showParts = !showParts)} data-parts-fold><ChevronDown size={16} aria-hidden="true" />{t('Show or hide parts of this bike')}</button>
  {#if showParts}
    <p class="hint">{t('Hidden parts do not show on this bike. A part with entries always stays.')}</p>
    <ul class="parts" data-bike-parts>
      {#each partShown as r (r.key)}
        <li data-bike-part={r.key} class:off={!r.on && !r.full}>
          <span>{r.name}{#if r.full}<small> · {t('has entries')}</small>{/if}</span>
          <button type="button" class="btn" aria-pressed={r.on || r.full} disabled={busy || r.full} aria-label={r.on || r.full ? t('Hide «{name}»', { name: r.name }) : t('Show «{name}»', { name: r.name })} onclick={() => store(setBikePart(bike, r.key, !r.on))}>{#if r.on || r.full}<Eye size={16} aria-hidden="true" />{t('Shown')}{:else}<EyeOff size={16} aria-hidden="true" />{t('Hidden')}{/if}</button>
        </li>
      {/each}
    </ul>
    {#if partShown.length < partRows.length}<ShowMore n={partRows.length - partShown.length} onclick={() => (partsAll = true)} data-bike-parts-more />{/if}
  {/if}

  <nav class="links" aria-label={t('More for the bike')}>
    <a href={bikesHash({ tab: 'care', view: 'templates', bike: bike.id })} data-link-templates><Shapes size={16} aria-hidden="true" /><span>{t('Part template')}<small>{t('Which parts a {kind} gets', { kind: kindName(kind, t) })}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
    <!-- Velo-Idee 76 «Werkstatt-Runden» -->
    <a href={bikesHash({ tab: 'care', view: 'rounds', bike: bike.id })} data-link-rounds><ListChecks size={16} aria-hidden="true" /><span>{t('Workshop rounds')}<small>{t('Your own routines: jobs, tools, material')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
    <a href={bikesHash({ tab: 'care', view: 'spick', bike: bike.id })} data-link-spick><BookOpen size={16} aria-hidden="true" /><span>{t('Workshop cheat sheet')}<small>{t('Torque values and breakdown help, also offline')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
    <!-- «Velo-FAQ» (Noah 19.10.2026) -->
    <a href={bikesHash({ tab: 'care', view: 'faq', bike: bike.id })} data-link-faq><MessageCircleQuestion size={16} aria-hidden="true" /><span>{t('Bike FAQ')}<small>{t('Care, breakdowns and myths, with a wink')}</small></span><ChevronRight size={16} aria-hidden="true" /></a>
  </nav>
</section>

{#if sheet}<ServiceSheet {bike} {km} {series} onsave={store} onclose={() => (sheet = false)} />{/if}

<style>
  .vig {
    margin: 0 0 14px;
    padding: 14px 16px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lead,
  .hint {
    margin: 4px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 8px 0 0;
    border-top: 1px solid var(--line);
  }
  .k {
    color: var(--ink-2);
  }
  .svc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .svc.due .st b {
    color: var(--warn-ink, var(--ink));
  }
  .svc.off .st b {
    color: var(--ink-2);
  }
  .st {
    display: grid;
    min-width: 0;
    flex: 1 1 14rem;
  }
  .st b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .kind {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .parts {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: grid;
  }
  .parts li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  .parts li span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .parts li.off span {
    color: var(--ink-3);
  }
  .parts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .links {
    display: grid;
    border-top: 1px solid var(--line);
  }
  .links a {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .links a + a {
    border-top: 1px solid var(--line);
  }
  .links a span {
    display: grid;
    min-width: 0;
  }
  .switch {
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 28px;
  }
</style>
