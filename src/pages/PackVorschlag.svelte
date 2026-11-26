<script>
  /**
   * «Dein Vorschlag» (Warteliste 4, Baustein 1; Noah 22.11.2026 «1b», «5a»): #/pack/vorschlag. The list of a trip as an offer to look at:
   * pieces and weight, step by step with «Change», what was left out («take along anyway»), what is missing (the onion check), and
   * «Like last time?» with a comparison. «Take over the list» opens the packing list in Steps. Nothing is stored here and nothing is
   * guessed by an AI: the rules are in pack/vorschlag.js. Everything can be changed in the packing list; each action has one Undo.
   */
  import { liveQuery } from 'dexie';
  import { Sparkles, Undo2, Check } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf, num, locale } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { UNDO_MS } from '../lib/ui/undo.js';
  import { localDay } from '../lib/localday.js';
  import { formatWeight } from '../lib/gear.js';
  import { touched, addEntries } from '../lib/trips.js';
  import { CLOTHING_OFFSET, WEAR_RULE, wearRule, onionCheck, waitChill } from '../lib/wardrobe.js';
  import { SETTING, cleanChoice } from '../lib/pack/schritte.js';
  import { offerOf, leftOutRows, gapRows, likeLast, compareLists, tripForOffer } from '../lib/pack/vorschlag.js';

  const dataQ = liveQuery(async () => {
    const [trips, items, steps, off, rule] = await Promise.all([db.trips.toArray(), db.items.toArray(), db.settings.get(SETTING), db.settings.get(CLOTHING_OFFSET), db.settings.get(WEAR_RULE)]);
    return { trips, items, order: cleanChoice(steps?.value).order, offset: Number(off?.value) || 0, rule: wearRule(rule?.value) };
  });
  const d = $derived($dataQ ?? null);
  const currentId = (() => {
    try {
      return localStorage.getItem('pack.currentTrip');
    } catch {
      return null;
    }
  })();
  const trip = $derived(d ? tripForOffer(d.trips, currentId, localDay()) : null);
  const offer = $derived(trip && d ? offerOf(trip, d.items, d.order) : null);
  const byId = $derived(new Map((d?.items ?? []).map((i) => [i.id, i])));
  const left = $derived(trip && d ? leftOutRows(trip, d.items) : []);
  const check = $derived(trip && d ? onionCheck(trip, d.items, d.offset + d.rule.shift + waitChill(trip), d.rule) : null);
  const gaps = $derived(gapRows(check));
  const like = $derived(trip && d ? likeLast(trip, d.trips) : null);
  const diff = $derived(like && d ? compareLists(trip, like.trip, d.items) : null);
  let comparing = $state(false);
  let last = $state(null); // { text, before } the one Undo
  let timer = 0;

  const dayText = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const chips = $derived(
    trip
      ? [
          trip.startDate ? `${dayText(trip.startDate)} · ${tn(Math.max(1, Number(trip.days) || 1), '{n} day', '{n} days')}` : '',
          trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C` : '',
          trip.bike ?? '',
          trip.route?.km ? `${num(Math.round(trip.route.km))} km` : '',
        ].filter(Boolean)
      : [],
  );
  const kg = (g) => formatWeight(g);
  const names = (s) => s.ids.map((id) => nameOf(byId.get(id))).filter(Boolean).join(', ');

  /** A tap goes to the packing list; with a step, the list opens in Steps at that step (CalmPack reads it once). */
  function toList(step = null) {
    try {
      localStorage.setItem('pack.currentTrip', trip.id);
      sessionStorage.setItem('pg.packStep', step ?? offer?.steps[0]?.key ?? '');
    } catch {
      /* private window: the list opens as it was */
    }
    location.hash = '#/pack';
  }
  function remember(text, before) {
    clearTimeout(timer);
    last = { text, before, tripId: trip.id };
    timer = setTimeout(() => (last = null), UNDO_MS);
  }
  async function takeAlong(item, text) {
    const before = { entries: $state.snapshot(trip.entries ?? []), leftOut: $state.snapshot(trip.leftOut ?? []) };
    const entries = addEntries(before.entries, [item.id], before.entries.find((e) => e.itemId)?.slot ?? 'seat');
    await db.trips.update(trip.id, touched({ entries, leftOut: before.leftOut.filter((x) => x.itemId !== item.id) }));
    remember(text, before);
  }
  async function undo() {
    if (!last) return;
    const { tripId } = last;
    const before = $state.snapshot(last.before);
    clearTimeout(timer);
    last = null;
    await db.trips.update(tripId, touched(before));
  }
</script>

<div class="vs">
  <header>
    <Crumbs crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Pack'), href: '#/pack' }]} here={t('Your suggestion')} />
    <h1 class="title">{trip ? t('Your suggestion for {trip}', { trip: trip.title }) : t('Your suggestion')}</h1>
    <p class="page-sub">{t('Made from your answers and your gear. You can change everything.')}</p>
    {#if chips.length}<p class="chips" data-vs-chips>{#each chips as c}<span class="chip">{c}</span>{/each}<a class="chip lnk" href="#/pack">{t('Change answers')}</a></p>{/if}
  </header>

  {#if !d}
    <p class="hint" role="status">{t('Loading …')}</p>
  {:else if !trip || !offer?.n}
    <Empty icon={Sparkles} title={t('No suggestion yet')} text={t('Plan a tour first; the suggestion is made from its list and your gear.')} action={{ label: t('Plan a tour'), href: '#/trips' }} />
  {:else}
    <div class="grid">
      <section class="vcard main" aria-label={t('The list')} data-vs-offer>
        <div class="top">
          <div>
            <h2 class="num">{tn(offer.n, '{n} piece', '{n} pieces')} · {kg(offer.g)}</h2>
            {#if offer.unknown}<p class="note">{tn(offer.unknown, '{n} piece not weighed yet', '{n} pieces not weighed yet')}</p>{/if}
          </div>
          <button type="button" class="btn hi" onclick={() => toList()} data-vs-take>{t('Take over the list')}</button>
        </div>
        <ul class="steps">
          {#each offer.steps as s (s.key)}
            <li data-vs-step={s.key}>
              <span class="cnt num" aria-hidden="true">{s.n}</span>
              <div class="mid"><b>{t(s.name)}</b><small>{names(s)}{s.n > s.ids.length ? ' …' : ''}</small></div>
              <span class="w num">{s.g ? kg(s.g) : '–'}</span>
              <button type="button" class="btn sm" onclick={() => toList(s.key)} aria-label={t('Change {step}', { step: t(s.name) })}>{t('Change')}</button>
            </li>
          {/each}
        </ul>
      </section>

      <div class="side">
        {#if left.length}
          <section class="vcard" data-vs-left>
            <h2>{t('Left out')}</h2>
            <p class="note">{t('You took these off the list.')}</p>
            <ul class="rows">
              {#each left as r (r.item.id)}
                <li><span>{nameOf(r.item)}</span><button type="button" class="btn sm" onclick={() => takeAlong(r.item, t('{name} is on the list again.', { name: nameOf(r.item) }))} data-vs-along={r.item.id}>{t('+ Take along anyway')}</button></li>
              {/each}
            </ul>
          </section>
        {/if}
        {#if gaps.length}
          <section class="vcard" data-vs-gaps>
            <h2>{t('You are missing')}</h2>
            <ul class="rows">
              {#each gaps as g (g.key)}
                <li class="gap">
                  <span>{t(g.name)}{g.rain ? ` · ${t('rainproof')}` : ''}</span>
                  {#if g.fix}<button type="button" class="btn sm" onclick={() => takeAlong(g.fix, t('{name} is on the list.', { name: nameOf(g.fix) }))} data-vs-fix={g.key}>{t('Add {name}', { name: nameOf(g.fix) })}</button>{:else}<a class="btn sm" href="#/wardrobe">{t('To the wardrobe')}</a>{/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}
        {#if like}
          <section class="vcard" data-vs-like>
            <h2>{t('Like last time?')}</h2>
            <p class="note">{like.trip.title} · {t('{n} % alike', { n: like.share })}</p>
            <button type="button" class="btn sm" aria-expanded={comparing} onclick={() => (comparing = !comparing)} data-vs-compare>{comparing ? t('Hide the comparison') : t('Compare')}</button>
            {#if comparing && diff}
              <div class="cmp" data-vs-diff>
                <p><b>{t('Only now')}</b>: {diff.now.map((i) => nameOf(i)).join(', ') || t('nothing')}</p>
                <p><b>{t('Only last time')}</b>: {diff.before.map((i) => nameOf(i)).join(', ') || t('nothing')}</p>
                <p class="note">{tn(diff.same, '{n} piece on both lists', '{n} pieces on both lists')}</p>
              </div>
            {/if}
          </section>
        {/if}
      </div>
    </div>
    <p class="note next">{t('Next: pack step by step.')} <a href="#/pack" onclick={(e) => (e.preventDefault(), toList())}>{t('Open the packing list')}</a></p>
  {/if}

  {#if last}
    <p class="undo" role="status"><span><Check size={16} aria-hidden="true" /> {last.text}</span><button type="button" class="btn sm" onclick={undo}><Undo2 size={16} aria-hidden="true" />{t('Undo')}</button></p>
  {/if}
</div>

<style>
  .vs { max-width: 1100px; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  .note { color: var(--ink-3); font-size: var(--fs-small); margin: 0; overflow-wrap: break-word; }
  .hint { color: var(--ink-3); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin: var(--sp-2) 0 0; }
  .chip { display: inline-flex; align-items: center; min-height: 32px; max-width: 100%; padding: 4px 12px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--paper); color: var(--ink); font-size: var(--fs-small); overflow-wrap: break-word; }
  .chip.lnk { min-height: 44px; text-decoration: none; }
  .grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  @media (min-width: 900px) { .grid { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); align-items: start; } }
  .side { display: grid; gap: var(--sp-4); min-width: 0; }
  .vcard { background: var(--paper); border: 1px solid var(--card-line, var(--line)); border-radius: var(--radius-card, 12px); padding: var(--sp-4); min-width: 0; display: grid; gap: var(--sp-2); }
  h2 { margin: 0; font-size: var(--fs-sub); }
  .top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sp-3); }
  .steps, .rows { list-style: none; margin: 0; padding: 0; }
  .steps li { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto auto; align-items: center; gap: var(--sp-2) var(--sp-3); padding: var(--sp-3) 0; border-top: 1px solid var(--line); }
  .cnt { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--hi-soft); color: var(--ink); font-size: var(--fs-small); }
  .mid { display: grid; min-width: 0; }
  .mid small { color: var(--ink-3); font-size: var(--fs-small); overflow-wrap: break-word; }
  .w { color: var(--ink-2); }
  .rows li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sp-2); padding: var(--sp-2) 0; }
  .rows li.gap { background: var(--paper-2); padding: var(--sp-2) var(--sp-3); border-radius: 8px; }
  .cmp { display: grid; gap: var(--sp-2); }
  .cmp p { margin: 0; overflow-wrap: break-word; }
  .next a { margin-left: 4px; }
  .undo { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin: 0; padding: 10px 14px; border-radius: var(--radius-card, 12px); background: var(--ink); color: var(--paper); }
  .undo :global(.btn) { background: transparent; color: var(--paper); border-color: var(--paper); }
  @media (max-width: 420px) { .steps li { grid-template-columns: 32px minmax(0, 1fr) auto; } .steps li .btn { grid-column: 2 / -1; justify-self: start; } }
</style>
