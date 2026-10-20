<script>
  /**
   * Paket T «Freie Zeit» › Erste Nacht (ideas 25, 26). A guided first overnight trip, close to home:
   *   1 a test question (what do you want to find out?)
   *   2 route, lunch and bed
   *   3 the day in your head: getting up, setting off, on the way, at a break, in the evening, at night;
   *     for each moment what you need, where it sits and whether it is within reach
   *   4 after the night: the answer to your question, then on to a real trip.
   * Everything is a suggestion: steps can be skipped, every thing changed, sorted and deleted.
   */
  import { Tent, Plus, Pencil, ChevronLeft, ChevronRight, Hand, RotateCcw, Route } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { cfgQuery, changeCfg, restoreCfg } from '../freidb.js';
  import { NIGHT_STEPS, PHASES, TEST_QUESTIONS, nightOf, phaseSummary, uid } from '../frei.js';
  import { ZONE } from '../trips.js';
  import { isArchived, isTestTrip } from '../testname.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, nameOf, bagName } from '../i18n.svelte.js';

  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const night = $derived(nightOf(cfg));
  const sum = $derived(phaseSummary(night.phases));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trips = $derived(($tripsQ ?? []).filter((x) => !isArchived(x) && !isTestTrip(x)).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))));
  const itemsQ = liveQuery(() => db.items.toArray());
  const items = $derived($itemsQ ?? []);
  const trip = $derived(trips.find((x) => x.id === night.tripId) ?? null);
  /** The things packed on the chosen trip with where they sit (to pick from in step 3). */
  const tripThings = $derived(
    (trip?.entries ?? [])
      .map((e) => ({ name: nameOf(items.find((i) => i.id === e.itemId)), where: bagName(t(ZONE[e.slot]?.name ?? '')) }))
      .filter((x) => x.name),
  );

  // The text fields: a local copy, saved when you leave the field (no write on every key press).
  let draft = $state(null);
  $effect(() => {
    if ($q !== undefined && !draft) draft = { question: night.question, route: night.route, lunch: night.lunch, bed: night.bed, after: night.after };
  });
  const save = (patch) => changeCfg((c) => ({ ...c, night: { ...nightOf(c), ...patch } }));
  const saveField = (k) => draft && save({ [k]: draft[k].trim() });
  const go = (step) => save({ step });
  function pickQuestion(text) {
    draft.question = t(text);
    saveField('question');
  }

  /* ---------- the things of the day ---------- */
  let edit = $state(null); // { phase, id?, name, where, reach }
  const openNew = (phase) => (edit = { phase, id: null, name: '', where: '', reach: false });
  const openEdit = (phase, x) => (edit = { phase, from: phase, id: x.id, name: x.name, where: x.where ?? '', reach: !!x.reach });
  async function saveThing() {
    const name = edit.name.trim();
    if (!name) return t('Please give it a name.');
    const rec = { id: edit.id ?? uid('nt'), name, where: edit.where.trim(), reach: edit.reach };
    await changeCfg((c) => {
      const n = nightOf(c);
      const phases = { ...n.phases };
      if (edit.from) phases[edit.from] = phases[edit.from].filter((x) => x.id !== rec.id);
      phases[edit.phase] = edit.from === edit.phase ? n.phases[edit.phase].map((x) => (x.id === rec.id ? rec : x)) : [...phases[edit.phase], rec];
      return { ...c, night: { ...n, phases } };
    });
  }
  async function removeThing() {
    const { from, id, name } = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name }) });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => { const n = nightOf(c); return { ...c, night: { ...n, phases: { ...n.phases, [from]: n.phases[from].filter((x) => x.id !== id) } } }; })),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  function reorder(phase, from, to) {
    return changeCfg((c) => {
      const n = nightOf(c);
      const list = [...n.phases[phase]];
      const [x] = list.splice(from, 1);
      list.splice(to, 0, x);
      return { ...c, night: { ...n, phases: { ...n.phases, [phase]: list } } };
    });
  }
  const step = (phase, i, dir) => {
    const to = Math.min(Math.max(i + dir, 0), night.phases[phase].length - 1);
    return to === i ? null : reorder(phase, i, to);
  };

  async function startOver() {
    const answer = await askDelete({ title: t('Start the first night again?'), text: t('Your question, plan and things are cleared. You can undo it right after.'), label: t('Start again') });
    if (answer !== 'delete') return;
    let before;
    await deleteWithUndo({ run: async () => (before = await changeCfg((c) => ({ ...c, night: {} }))), undo: () => restoreCfg(before), text: t('First night cleared.'), name: t('First night') });
    draft = { question: '', route: '', lunch: '', bed: '', after: '' };
  }
  const answered = $derived([!!night.question, !!(night.route || night.bed), sum.n > 0, !!night.after]);
</script>

<div class="fz" data-page="nacht">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('First night')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('First night')}</h1>
  <p class="fz-intro">{t('One night out, not far from home. Not a test you can fail, just a rehearsal with a sleeping bag.')}</p>

  <ol class="fzn-steps" aria-label={t('Steps')}>
    {#each NIGHT_STEPS as s, i (s.key)}
      <li><button type="button" class="fz-chip" aria-pressed={night.step === i} aria-current={night.step === i ? 'step' : undefined} onclick={() => go(i)} data-night-step={s.key}>{i + 1}. {t(s.name)}{#if answered[i]}{' '}✓{/if}</button></li>
    {/each}
  </ol>

  {#if draft}
    <section class="fz-box" data-night-part={NIGHT_STEPS[night.step].key}>
      {#if night.step === 0}
        <h2 class="fz-h2"><Tent size={18} aria-hidden="true" /> {t('What do you want to find out?')}</h2>
        <p class="fz-note">{t('One question is enough. It turns a night in the woods into an experiment, which sounds far more scientific.')}</p>
        <div class="fz-chips">
          {#each TEST_QUESTIONS as tq (tq)}<button type="button" class="fz-chip" aria-pressed={draft.question === t(tq)} onclick={() => pickQuestion(tq)}>{t(tq)}</button>{/each}
        </div>
        <label class="fz-lab">{t('My test question')}<input class="inp" maxlength="200" bind:value={draft.question} onchange={() => saveField('question')} data-night-question /></label>
      {:else if night.step === 1}
        <h2 class="fz-h2"><Route size={18} aria-hidden="true" /> {t('Route and bed')}</h2>
        <p class="fz-note">{t('Short enough that the way home is never a drama. A bakery on the way does not hurt either.')}</p>
        <label class="fz-lab">{t('Route')}<input class="inp" maxlength="200" bind:value={draft.route} onchange={() => saveField('route')} placeholder={t('e.g. along the river, 40 km')} data-night-route /></label>
        <label class="fz-lab">{t('Lunch')}<input class="inp" maxlength="200" bind:value={draft.lunch} onchange={() => saveField('lunch')} placeholder={t('e.g. the bakery in the next village')} /></label>
        <label class="fz-lab">{t('Where I sleep')}<input class="inp" maxlength="200" bind:value={draft.bed} onchange={() => saveField('bed')} placeholder={t('e.g. campsite by the lake')} data-night-bed /></label>
        <label class="fz-lab">{t('Packing list (optional)')}
          <select class="inp" value={night.tripId ?? ''} onchange={(e) => save({ tripId: e.currentTarget.value || null })} data-night-trip>
            <option value="">{t('No trip in the app yet')}</option>
            {#each trips as x (x.id)}<option value={x.id}>{x.name}</option>{/each}
          </select>
        </label>
        <p class="fz-note">{t('Pack as usual on a trip; in step 3 you can pick from its list.')} <a href="#/trips">{t('To the trips')}</a></p>
      {:else if night.step === 2}
        <h2 class="fz-h2"><Hand size={18} aria-hidden="true" /> {t('Pack your day in your head')}</h2>
        <p class="fz-note">{t('Walk through the day once, from getting up to falling asleep. What do you need, where is it, can you reach it without unpacking everything?')}</p>
        {#if sum.n}<p class="fz-note" data-night-sum>{tn(sum.n, '{n} thing', '{n} things')} · {t('{n} within reach', { n: sum.reach })}{#if sum.noPlace}{' '}· {tn(sum.noPlace, '{n} without a place yet', '{n} without a place yet')}{/if}</p>{/if}
        {#each PHASES as p (p.key)}
          {@const list = night.phases[p.key]}
          <div class="fzn-phase" data-phase={p.key}>
            <div class="fz-row">
              <span class="fz-row-main"><b>{t(p.name)}</b></span>
              <button type="button" class="fz-icon" aria-label={t('Add to {name}', { name: t(p.name) })} onclick={() => openNew(p.key)} data-phase-add={p.key}><Plus size={18} aria-hidden="true" /></button>
            </div>
            {#if list.length}
              <ul class="fz-list" use:sortable={{ onmove: (from, to) => reorder(p.key, from, to) }}>
                {#each list as x, i (x.id)}
                  <li class="fz-row" data-sort-id={x.id}>
                    <SortGrip name={x.name} onstep={(dir) => step(p.key, i, dir)} />
                    <button type="button" class="fz-row-main" onclick={() => openEdit(p.key, x)}><b>{x.name}</b><small>{[x.where, x.reach ? t('within reach') : ''].filter(Boolean).join(' · ') || t('no place yet')}</small></button>
                    {#if !phone.matches}<SortArrows name={x.name} {i} n={list.length} onstep={(dir) => step(p.key, i, dir)} />{/if}
                    <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: x.name })} onclick={() => openEdit(p.key, x)}><Pencil size={18} aria-hidden="true" /></button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      {:else}
        <h2 class="fz-h2"><Tent size={18} aria-hidden="true" /> {t('After the night')}</h2>
        {#if night.question}<p class="fz-text"><b>{t('Your question:')}</b> {night.question}</p>{/if}
        <label class="fz-lab">{t('What I found out')}<textarea class="inp" rows="4" maxlength="2000" bind:value={draft.after} onchange={() => saveField('after')} placeholder={t('e.g. the bag was fine, the pillow was a joke')} data-night-after></textarea></label>
        <p class="fz-note">{t('Survived? Then the next trip may be a little longer.')} <a href="#/trips">{t('Plan a real trip')}</a></p>
      {/if}
      <div class="fz-acts">
        {#if night.step > 0}<button type="button" class="btn" onclick={() => go(night.step - 1)}><ChevronLeft size={16} aria-hidden="true" />{t('Back')}</button>{/if}
        {#if night.step < NIGHT_STEPS.length - 1}<button type="button" class="btn hi" onclick={() => go(night.step + 1)} data-night-next>{t('Next|step')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
      </div>
    </section>
    <div class="fz-acts"><button type="button" class="btn sm" onclick={startOver} data-night-reset><RotateCcw size={16} aria-hidden="true" />{t('Start again')}</button></div>
  {/if}
</div>

{#if edit}
  <FreiSheet title={edit.id ? t('Change thing') : t('A thing for this moment')} onsave={saveThing} ondelete={edit.id ? removeThing : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('What')}<input class="inp" maxlength="120" bind:value={edit.name} list="fzn-things" placeholder={t('e.g. head torch')} data-thing-name /></label>
    {#if tripThings.length}
      <datalist id="fzn-things">{#each tripThings as x, n (n)}<option value={x.name}>{x.where}</option>{/each}</datalist>
    {/if}
    <label class="fz-lab">{t('Where it sits')}<input class="inp" maxlength="80" bind:value={edit.where} onfocus={() => { if (!edit.where) edit.where = tripThings.find((x) => x.name === edit.name.trim())?.where ?? ''; }} placeholder={t('e.g. top tube bag')} /></label>
    <label class="fzn-check"><input type="checkbox" bind:checked={edit.reach} /> {t('Within reach without unpacking')}</label>
    <label class="fz-lab">{t('Moment')}
      <select class="inp" bind:value={edit.phase}>{#each PHASES as p (p.key)}<option value={p.key}>{t(p.name)}</option>{/each}</select>
    </label>
  </FreiSheet>
{/if}

<style>
  .fzn-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fzn-phase + .fzn-phase {
    border-top: 1px solid var(--line);
    padding-top: 6px;
  }
  .fzn-check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
</style>
