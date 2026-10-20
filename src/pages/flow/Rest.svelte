<script>
  /**
   * «Erholung» (mockup AK2, Noah 13.10.2026 «1-5a», «ich gebe hiermit alle mockups frei»):
   *   #/flow/rest   the recovery ring of the week, a hint after 3 active days in a row (tap = tick, «Nicht
   *                 heute» hides it for today), the recovery activities to tick, ideas to add, the last 14
   *                 days. Schlaf, Ruhepuls and HRV join with the Fitbit connection (bundle B, answer 3a).
   * The rules are pure and tested (lib/flowrest.js).
   */
  import { Plus, Check, Lightbulb, Moon } from '@lucide/svelte';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte'; // «Einstieg» on top (Noah «4a»)
  import { liveQuery } from 'dexie';
  import { db } from '../../lib/db.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import MoreAktiv from '../../lib/flow/kit/MoreAktiv.svelte';
  import ActIcon from '../../lib/flow/ActIcon.svelte';
  import { morePages } from '../../lib/flow/morepages.js';
  import { flowQuery, seedIfNeeded } from '../../lib/flow/data.svelte.js';
  import { flowStates, rings as ringsOf, ringFill } from '../../lib/flow.js';
  import { weekGoals } from '../../lib/flowweek.js';
  import { HINT_NO_KEY, restHint, restActs, restIdeas, restStrip } from '../../lib/flowrest.js';
  import { actFromTemplate } from '../../lib/flowsugg.js';
  import { putSetting, putActs, deleteAct } from '../../lib/flowdb.js';
  import { actName, tickWith, tapAct, toast } from '../../lib/flow/ui.svelte.js';
  import { localDay } from '../../lib/localday.js';
  import { phone } from '../../lib/media.svelte.js';
  import { t, tn, locale, lang } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = flowQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedIfNeeded(data);
  });
  const noQ = liveQuery(() => db.settings.get(HINT_NO_KEY));
  const acts = $derived(data?.acts ?? []);
  const log = $derived(data?.log ?? []);
  const states = $derived(data ? flowStates(acts, log, today, data.tripDays) : []);
  const rings = $derived(ringsOf(states, log, today));
  const pages = $derived(morePages({ openGoals: weekGoals(states).filter((g) => !g.met).length }));
  const hint = $derived(data ? restHint({ acts, log, today, hiddenOn: $noQ?.value ?? null }) : null);
  const list = $derived(restActs(acts, log, today));
  // at most 4 ideas at a time, so the list stays calm (the next ones come when one is added)
  const ideas = $derived(restIdeas(acts).slice(0, 4));
  const strip = $derived(restStrip(acts, log, today));
  const stretch = $derived(acts.find((a) => a.id === 'stretch' && !a.paused) ?? null);
  // the hint's choices: the recovery activities first, then stretching (it counts for «Bewegen» too)
  const choices = $derived([...list.map((x) => x.act), ...(stretch ? [stretch] : [])].slice(0, 3));

  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const ideaName = (i) => (lang.v === 'de' ? i.nameDe : i.name);
  const lastText = (x) => (x.today ? t('done today') : x.ago == null ? t('not yet') : x.ago === 1 ? t('yesterday') : t('last {n} days ago', { n: x.ago }));
  const tickAct = (a) => tickWith(a, { day: today });
  // a row is a checkbox: a second tap on the same day takes today's tick back (as «Heute abhaken»)
  const toggleAct = (a) => {
    const st = states.find((s) => s.act.id === a.id);
    return st ? tapAct(st, today) : tickAct(a);
  };
  async function addIdea(i) {
    const a = actFromTemplate(i, acts);
    await putActs(db, [a]);
    toast(t('{name} added', { name: ideaName(i) }), () => deleteAct(db, a.id));
  }
  const names = (ids) => new Intl.ListFormat(locale(), { type: 'conjunction' }).format(ids.map((id) => actName(acts.find((a) => a.id === id))).filter(Boolean));

  /* the ring: the recovery ring of the app (flow.js rings().rest) */
  const S = $derived(phone.matches ? 112 : 132);
  const R = $derived(S / 2 - 10);
  const C = $derived(2 * Math.PI * R);
</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Analysis|place') }]} here={t('Recovery|page')} />
    <MoreAktiv items={pages} on="rest" />
    <PageHead title={t('Recovery|page')} text={t('So that after the bike, tennis and gym the pause has its place too')} />
  </header>
  <AreaIntro place="rest" />

  {#if data}
    <section class="card hero" aria-label={t('Recovery this week')} data-rest-ring>
      <svg width={S} height={S} viewBox="0 0 {S} {S}" role="img" aria-label={t('{n} of {m} this week', { n: rings.rest.n, m: rings.rest.of })}>
        <circle cx={S / 2} cy={S / 2} r={R} fill="none" class="track" stroke-width="12" />
        {#if ringFill(rings.rest) > 0}<circle cx={S / 2} cy={S / 2} r={R} fill="none" class="fill" stroke-width="12" stroke-linecap="round" stroke-dasharray="{C * ringFill(rings.rest)} {C}" transform="rotate(-90 {S / 2} {S / 2})" />{/if}
        <text x="50%" y="48%" text-anchor="middle" class="big">{rings.rest.n}/{rings.rest.of}</text>
        <text x="50%" y="63%" text-anchor="middle" class="sm">{t('Recover|ring')}</text>
      </svg>
      <div class="hv">
        <b>{t('This week {n} of {m}', { n: rings.rest.n, m: rings.rest.of })}</b>
        <small>{t('Move {a} of {b} · Mindful {c} of {d}', { a: rings.move.n, b: rings.move.of, c: rings.mind.n, d: rings.mind.of })}</small>
        <p class="later"><Moon size={16} aria-hidden="true" />{t('Sleep, resting pulse and HRV come here with the Fitbit connection, as observation only.')}</p>
      </div>
    </section>

    <div class="lay">
      <div class="col">
        {#if hint}
          <div class="note" data-rest-hint>
            <Lightbulb size={18} aria-hidden="true" />
            <span>
              <b>{t('{n} active days in a row', { n: hint.n })}</b>{#if hint.acts.length}{' '}({names(hint.acts)}){/if}. {t('A suggestion for today:')}
              <span class="chips">
                {#each choices as a (a.id)}<button type="button" class="chip" onclick={() => tickAct(a)} data-hint-act={a.id}>{actName(a)}</button>{/each}
                <button type="button" class="chip dash" onclick={() => putSetting(db, HINT_NO_KEY, today)} data-hint-no>{t('Not today')}</button>
              </span>
            </span>
          </div>
        {/if}

        <Sec id="rest-tick" title={t('Tick off recovery')} sub={rings.rest.of ? tn(rings.rest.of, 'goal {n} per week', 'goal {n} per week') : ''}>
          <ul class="card rows">
            {#each list as x (x.act.id)}
              <li data-rest={x.act.id}>
                <button type="button" class="tk" role="checkbox" aria-checked={x.today} onclick={() => toggleAct(x.act)} aria-label={t('Tick {name}', { name: actName(x.act) })}>
                  <span class="bx" class:y={x.today}>{#if x.today}<Check size={16} aria-hidden="true" />{/if}</span>
                  <ActIcon icon={x.act.icon} ring="rest" />
                  <span class="t"><b>{actName(x.act)}</b><small>{lastText(x)}</small></span>
                </button>
              </li>
            {:else}
              <li class="none">{t('No recovery activity yet. Add one below.')}</li>
            {/each}
          </ul>
          {#if ideas.length}
            <p class="sub">{t('Add more recovery (changeable, deletable):')}</p>
            <div class="chips">{#each ideas as i (i.id)}<button type="button" class="chip dash" onclick={() => addIdea(i)} data-rest-idea={i.id}><Plus size={16} aria-hidden="true" />{ideaName(i)}</button>{/each}</div>
          {/if}
          <a class="chip dash own" href="#/flow/new"><Plus size={16} aria-hidden="true" />{t('own recovery')}</a>
        </Sec>
      </div>

      <aside class="col">
        <Sec id="rest-strip" title={t('The last 14 days')} sub={t('● recovery · ○ active')}>
          <div class="card strip" data-rest-strip>
            {#each strip as d (d.day)}
              <span class="dd" class:today={d.day === today}>
                <i class:rest={d.rest} class:move={d.move && !d.rest} aria-hidden="true"></i>
                <small>{fmt(d.day, { weekday: 'short' }).replace('.', '').slice(0, 2)}</small>
                <span class="vh">{fmt(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: {d.rest ? t('recovery|day') : d.move ? t('active') : t('nothing ticked')}</span>
              </span>
            {/each}
          </div>
          <p class="foot">{tn(strip.filter((d) => d.rest).length, '{n} recovery day in 14 days', '{n} recovery days in 14 days')}</p>
        </Sec>
      </aside>
    </div>
  {/if}
</div>

<style>
  /* the look of «Woche» and «Sporttasche»; the ring in the recovery colour (--l3) */
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
    gap: var(--sp-3);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .hero {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-5);
    padding: var(--sp-4) var(--sp-5);
  }
  .track {
    stroke: var(--l3-soft);
  }
  .fill {
    stroke: var(--l3);
  }
  .big {
    fill: var(--ink);
    font: 700 var(--fs-page) var(--font-body);
  }
  .sm {
    fill: var(--ink-3);
    font: 400 var(--fs-small) var(--font-body);
  }
  .hv {
    display: flex;
    flex: 1 1 240px;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .hv b {
    font-size: var(--fs-section);
  }
  .hv small,
  .sub,
  .foot {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .later {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: var(--sp-2) 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .later :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .note > :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--hi);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .chip.dash {
    border: 1.5px dashed var(--line-strong);
    background: none;
    color: var(--ink-2);
  }
  .own {
    margin-top: var(--sp-2);
  }
  .rows {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  .rows li {
    border-top: 1px solid var(--line);
  }
  .rows li:first-child {
    border-top: 0;
  }
  .tk {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .bx {
    display: grid;
    flex: none;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
  }
  .bx.y {
    border-color: var(--l3);
    background: var(--l3);
    color: var(--paper);
  }
  .t {
    flex: 1;
    min-width: 0;
  }
  .t b {
    display: block;
    font-weight: 600;
  }
  .t small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none {
    padding: var(--sp-3) 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sub {
    margin: var(--sp-3) 0 0;
  }
  .strip {
    display: grid;
    grid-template-columns: repeat(14, minmax(0, 1fr));
    gap: 4px;
    padding: var(--sp-4);
  }
  .dd {
    display: grid;
    justify-items: center;
    gap: 4px;
    min-width: 0;
  }
  .dd i {
    display: block;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 50%;
  }
  .dd i.rest {
    border-color: var(--l3);
    background: var(--l3);
  }
  .dd i.move {
    border-color: var(--hi);
  }
  .dd small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .dd.today small {
    color: var(--ink);
    font-weight: 600;
  }
  .foot {
    margin: var(--sp-2) 0 0;
  }
</style>
