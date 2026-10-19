<script>
  /**
   * Vorbereiten › Paperwork (40), Drop bags (21), My why (23), Bad-weather plan (28), Laundry plan (37),
   * Briefing sheet (33).
   */
  import { BellPlus, Plus, FileText } from '@lucide/svelte';
  import RaceBox from '../RaceBox.svelte';
  import EditList from '../EditList.svelte';
  import { db } from '../../db.js';
  import { addTodo } from '../../merkendb.js';
  import { offerDone } from '../../ui/rename.svelte.js';
  import { BAD_WEATHER, nightRows, newId } from '../race.js';
  import { laundryPlan } from '../more.js';
  import { showStd, keepStd, PAPER_ROWS, paperDue, whenOf } from '../prep-lib.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { ctx } = $props();
  const start = $derived(ctx.trip.startDate ?? '');
  const tr = (s) => t(s);

  // 40 · Paperwork
  const papersStored = $derived(Array.isArray(ctx.stored.papers) ? ctx.stored.papers : PAPER_ROWS);
  const papers = $derived(showStd(papersStored, ['text'], tr));
  const savePapers = (list) => ctx.save({ papers: keepStd(list, papersStored, ['text'], tr) });
  const setPaper = (id, patch) => savePapers(papers.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const hotelNights = $derived(nightRows(ctx.race, ctx.plan).filter((n) => n.kind === 'hotel').length);
  const day = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  async function remind(r) {
    const res = await addTodo(db, { text: r.text, due: paperDue(r, start) || null });
    if (res) offerDone(t('Added to your to-dos.'), res.undo);
  }

  // 21 · Drop bags
  const bags = $derived(ctx.race.dropBags.map((b) => ({ ...b, text: b.where ?? b.text ?? '' })));
  const saveBags = (list) => ctx.save({ dropBags: list.map(({ text, ...b }) => ({ ...b, where: text })) });
  const depots = $derived(ctx.pois.filter((p) => p.kind === 'depot' && !ctx.race.dropBags.some((b) => Math.abs((Number(b.km) || 0) - p.km) < 2)));
  const eta = (km) => (ctx.plan && Number.isFinite(Number(km)) && km !== '' && km != null ? whenOf(ctx.plan.etaOf(Number(km)), locale()) : '');
  const addDepot = (p) => saveBags([...bags, { id: newId('bag'), text: p.name || t('Depot'), km: Math.round(p.km), what: '', hours: p.hours ?? '' }]);

  // 23 · My why
  const whyOn = $derived(ctx.stored.whyOn !== false);

  // 28 · Bad weather
  const bwStored = $derived(Array.isArray(ctx.stored.badWeather) ? ctx.stored.badWeather : BAD_WEATHER.map((b) => ({ ...b, std: true })));
  const bw = $derived(showStd(bwStored, ['when', 'then'], tr).map((b) => ({ ...b, text: b.when ?? '' })));
  const saveBw = (list) => ctx.save({ badWeather: keepStd(list.map(({ text, ...b }) => ({ ...b, when: text })), bwStored, ['when', 'then'], tr) });

  // 37 · Laundry
  const sets = $derived(Number(ctx.stored.sets) > 0 ? Number(ctx.stored.sets) : 2);
  const wash = $derived(ctx.plan ? laundryPlan({ days: ctx.plan.days.length, sets, hotelDays: nightRows(ctx.race, ctx.plan).filter((n) => n.kind === 'hotel').map((n) => n.i + 1) }) : null);
  const washText = $derived(wash?.washes.length ? t('Wash on {list}.', { list: wash.washes.map((w) => t(w.where === 'hotel' ? 'day {d} (hotel)' : 'day {d} (rinse)', { d: w.day })).join(', ') }) : '');
</script>

<RaceBox
  id="prep-papers"
  title={t('Paperwork')}
  what="The things to sign up, pay and book before the race, each with a date."
  why="Nothing is forgotten: entry, licence, tracker, insurance, travel and the beds."
  from="A list as the app comes, yours to change; the dates count back from the start."
>
  <EditList rows={papers} onchange={savePapers} label={t('What to do')} addLabel={t('Add')} placeholder={t('e.g. Book the train to the start')} name={t('Paperwork')} testid="papers" blank={{ done: false }}>
    {#snippet sub(r)}
      <small>
        {paperDue(r, start) ? t('due {date}', { date: day(paperDue(r, start)) }) : t('no date')}
        {#if r.id === 'pp-hotels' && hotelNights} · {t('{n} nights in a hotel in the plan', { n: hotelNights })}{/if}
      </small>
    {/snippet}
    {#snippet row(r)}
      <label class="rc-icon"><input type="checkbox" checked={!!r.done} aria-label={t('Done: {name}', { name: r.text })} onchange={(e) => setPaper(r.id, { done: e.currentTarget.checked })} data-race-paper-done /></label>
      <button type="button" class="rc-icon" aria-label={t('To my reminders: {name}', { name: r.text })} title={t('To my reminders')} onclick={() => remind(r)} data-race-paper-remind><BellPlus size={18} aria-hidden="true" /></button>
    {/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('Due on')}<input class="inp" type="date" value={paperDue(edit, start)} onchange={(e) => (edit.due = e.currentTarget.value)} /></label>
    {/snippet}
  </EditList>
</RaceBox>

<RaceBox
  id="prep-dropbags"
  title={t('Drop bags')}
  what="Where your bags wait along the route, what is in them and when they open; with the time you are expected there."
  why="You pack the right things into the right bag and arrive while the depot is open."
  from="What you write here, the depots in the stop file and the plan."
>
  {#each depots as p (p.id)}
    <div class="rc-inline">
      <span class="rc-text">{t('Depot at km {km}', { km: num(Math.round(p.km)) })}{p.name ? ` · ${p.name}` : ''}</span>
      <button type="button" class="btn sm" onclick={() => addDepot(p)} data-race-depot-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </div>
  {/each}
  <EditList rows={bags} onchange={saveBags} label={t('Where')} addLabel={t('Add')} placeholder={t('e.g. Hotel at the halfway point')} name={t('Drop bag')} testid="dropbags" blank={{ km: null, what: '', hours: '' }}>
    {#snippet sub(r)}
      <small>{[r.km != null && r.km !== '' ? t('km {km}', { km: num(r.km) }) : '', eta(r.km) ? t('you there {when}', { when: eta(r.km) }) : '', r.hours, r.what].filter(Boolean).join(' · ')}</small>
    {/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('At km')}<input class="inp" type="number" min="0" step="1" bind:value={edit.km} /></label>
      <label class="rc-lab">{t('What is in it')}<textarea class="inp" rows="2" maxlength="500" bind:value={edit.what}></textarea></label>
      <label class="rc-lab">{t('Opening hours')}<input class="inp" bind:value={edit.hours} maxlength="120" placeholder={t('e.g. Sat 8–22')} /></label>
    {/snippet}
  </EditList>
</RaceBox>

<RaceBox
  id="prep-why"
  title={t('My why')}
  what="A few sentences why you ride this race."
  why="At night, tired and cold, they help you go on or stop calmly."
  from="What you write here."
>
  <EditList rows={ctx.race.why} onchange={(list) => ctx.save({ why: list })} label={t('Sentence')} addLabel={t('Add')} placeholder={t('e.g. I want to see the sunrise on the pass.')} name={t('Sentence')} testid="why" />
  <label class="rc-inline"><input type="checkbox" checked={whyOn} onchange={(e) => ctx.save({ whyOn: e.currentTarget.checked })} data-race-why-on />{t('Show it in race mode at a long night stop')}</label>
</RaceBox>

<RaceBox
  id="prep-badweather"
  title={t('Bad-weather plan')}
  what="What you do when the weather turns: if this, then that."
  why="You decide now, rested, and not in the rain at night."
  from="A list as the app comes, yours to change."
>
  <EditList rows={bw} onchange={saveBw} label={t('When')} addLabel={t('Add')} placeholder={t('e.g. Snow on the pass')} name={t('Plan|weather')} testid="badweather" blank={{ then: '' }}>
    {#snippet sub(r)}{#if r.then}<small>{r.then}</small>{/if}{/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('Then')}<textarea class="inp" rows="3" maxlength="500" bind:value={edit.then}></textarea></label>
    {/snippet}
  </EditList>
  <p class="rc-note">{t('When the weather turns, race mode shows the nearest shelters and stations.')}</p>
</RaceBox>

<RaceBox
  id="prep-laundry"
  title={t('Laundry plan')}
  what="Says on which days to wash, from the sets of clothes you take and the nights in a hotel."
  why="You take fewer clothes and still ride in clean shorts."
  from="The days of the plan and your nights (Strategy)."
>
  <label class="rc-lab">{t('Sets of riding clothes')}<input class="inp" type="number" min="1" max="10" step="1" value={sets} onchange={(e) => ctx.save({ sets: Number(e.currentTarget.value) || null })} data-race-sets /></label>
  {#if wash}
    <p class="rc-text" data-race-laundry>{washText || t('With {n} sets you need not wash.', { n: sets })}</p>
  {:else}
    <p class="rc-empty">{t('Load the route and set the start (Strategy) first.')}</p>
  {/if}
</RaceBox>

<RaceBox
  id="prep-brief"
  title={t('Briefing sheet')}
  what="One page: plan, beds with phone, depot, shop gaps, Sunday, emergency numbers — to print or save as PDF."
  why="On paper it works without battery and signal, and your family knows your plan."
  from="Everything you set for this race."
  soft
>
  <a class="btn hi" href="#/race/brief/{encodeURIComponent(ctx.trip.id)}" data-race-brief-link><FileText size={16} aria-hidden="true" />{t('Open the briefing sheet')}</a>
</RaceBox>
