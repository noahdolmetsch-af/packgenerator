<script>
  /**
   * «Velo-FAQ» (Noah 19.10.2026): Bikes › Care › «Bike FAQ» (#/bikes?tab=care&view=faq).
   * The question of the day on top (another one with a tap), a search over questions and answers, the
   * questions by topic (one fold each, with a wink and the place in the app), and the own questions at
   * the end (add, change, move with arrows and drag, delete with Undo). Works offline: it is all in the app.
   * Loaded only when opened (Bikes.svelte), so the start of the app stays small.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Search, Smile, Shuffle, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { bikesHash } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { FAQ, FAQ_TOPICS, FAQ_OWN, faqOfDay, nextFaq, searchFaq, normOwn, addOwn, changeOwn, removeOwn, restoreOwn, moveOwn } from '../velofaq.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { bikeId = null } = $props();

  const ownQ = liveQuery(() => db.settings.get(FAQ_OWN));
  const own = $derived(normOwn($ownQ?.value));
  const save = (list) => db.settings.put({ key: FAQ_OWN, value: $state.snapshot(list) });
  const read = async () => normOwn((await db.settings.get(FAQ_OWN))?.value);

  let day = $state(faqOfDay(localDay()));
  let query = $state('');
  const found = $derived(searchFaq(FAQ, query, t));
  const topics = $derived(FAQ_TOPICS.map((tp) => ({ ...tp, list: found.filter((f) => f.topic === tp.key) })).filter((tp) => tp.list.length));
  const ownFound = $derived(query.trim() ? own.filter((r) => `${r.q} ${r.a}`.toLowerCase().includes(query.trim().toLowerCase())) : own);

  let newQ = $state('');
  let newA = $state('');
  let editing = $state(null); // id of the own question in the form
  let msg = $state('');

  async function submit(e) {
    e?.preventDefault();
    if (!newQ.trim()) return (msg = t('Type a question.'));
    if (editing) {
      await save(changeOwn(await read(), editing, { q: newQ, a: newA }));
      offerDone(t('"{name}" saved.', { name: newQ.trim() }));
    } else {
      await save(addOwn(await read(), newQ, newA));
      offerDone(t('"{name}" added.', { name: newQ.trim() }));
    }
    newQ = '';
    newA = '';
    editing = null;
    msg = '';
  }
  function edit(r) {
    editing = r.id;
    newQ = r.q;
    newA = r.a;
    msg = '';
  }
  function cancel() {
    editing = null;
    newQ = '';
    newA = '';
    msg = '';
  }
  async function remove(r) {
    const answer = await askDelete({ title: t('Delete "{name}"?', { name: r.q }), text: t('Only your own question goes. The questions of the app stay.') });
    if (answer !== 'delete') return;
    if (editing === r.id) cancel();
    await deleteWithUndo({
      name: r.q,
      text: t('"{name}" deleted.', { name: r.q }),
      run: async () => {
        const res = removeOwn(await read(), r.id);
        await save(res.list);
        return res;
      },
      undo: async (res) => save(restoreOwn(await read(), res.row, res.at)),
    });
  }
  const move = async (from, to) => save(moveOwn(await read(), from, to));
</script>

<div class="faq">
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }) }]}
    title={t('Bike FAQ')}
    sub={t('Care, breakdowns and good to know, with a wink · works offline')}
  />

  {#if day}
    <section class="fqcard day" aria-labelledby="fq-day" data-faq-day={day.key}>
      <p class="kick" id="fq-day">{t('Question of the day')}</p>
      <h2>{t(day.q)}</h2>
      <p>{t(day.a)}</p>
      <p class="wink"><Smile size={16} aria-hidden="true" /><span>{t(day.wink)}</span></p>
      <button type="button" class="btn fbtn" onclick={() => (day = nextFaq(day.key))} data-faq-next><Shuffle size={16} aria-hidden="true" />{t('Another question')}</button>
    </section>
  {/if}

  <p class="quiet">{t('Tap a question to open the answer. The steps for the road are in the workshop cheat sheet.')}</p>
  <label class="find">
    <Search size={16} aria-hidden="true" />
    <input class="inp" type="search" placeholder={t('Search, e.g. chain or brake')} aria-label={t('Search the questions')} bind:value={query} data-faq-search />
  </label>

  {#each topics as tp (tp.key)}
    <section class="fqcard" aria-labelledby={`fq-${tp.key}`} data-faq-topic={tp.key}>
      <h2 id={`fq-${tp.key}`}>{t(tp.name)}</h2>
      {#each tp.list as f (f.key)}
        <details class="fold" data-faq={f.key}>
          <summary>{t(f.q)}</summary>
          <div class="ans">
            <p>{t(f.a)}</p>
            <p class="wink"><Smile size={16} aria-hidden="true" /><span>{t(f.wink)}</span></p>
            {#if f.link}<a class="go" href={f.link.href} data-faq-link>{t(f.link.label)}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
          </div>
        </details>
      {/each}
    </section>
  {/each}
  {#if query.trim() && !topics.length && !ownFound.length}
    <p class="quiet" role="status" data-faq-none>{t('No question fits. Add it as your own question below.')}</p>
  {/if}

  <section class="fqcard" aria-labelledby="fq-own">
    <h2 id="fq-own">{t('Your own questions')}</h2>
    {#if ownFound.length}
      <ul class="own" use:sortable={{ onmove: move }}>
        {#each ownFound as r, i (r.id)}
          <li data-sort-id={r.id} data-faq-own={r.id}>
            <SortGrip name={r.q} onstep={(dir) => move(i, i + dir)} />
            <details class="fold grow">
              <summary>{r.q}</summary>
              <div class="ans"><p>{r.a || t('No answer yet.')}</p></div>
            </details>
            <SortArrows name={r.q} {i} n={ownFound.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="ib" aria-label={t('Edit {name}', { name: r.q })} onclick={() => edit(r)} data-faq-edit><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: r.q })} onclick={() => remove(r)} data-faq-delete><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('Note what your bike shop told you, or what you learned on the road.')}</p>
    {/if}
    <form class="addrow" onsubmit={submit}>
      <input class="inp" type="text" maxlength="120" aria-label={t('Question')} placeholder={t('e.g. Which oil for my chain?')} bind:value={newQ} oninput={() => (msg = '')} data-faq-newq />
      <textarea class="inp" rows="3" maxlength="1000" aria-label={t('Answer')} placeholder={t('Your answer')} bind:value={newA} data-faq-newa></textarea>
      <div class="acts">
        <button type="submit" class="btn fbtn" data-faq-add>{#if editing}{t('Save')}{:else}<Plus size={16} aria-hidden="true" />{t('Add question')}{/if}</button>
        {#if editing}<button type="button" class="btn fbtn" onclick={cancel}>{t('Cancel')}</button>{/if}
      </div>
    </form>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  </section>
</div>

<style>
  .faq {
    min-width: 0;
  }
  .fqcard {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .day {
    background: var(--paper-2);
  }
  .day p {
    margin: 0 0 8px;
    overflow-wrap: break-word;
  }
  .kick {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .quiet {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
  }
  .find input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
  }
  .wink {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    color: var(--ink-2);
    font-style: italic;
  }
  .wink :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .fbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .fold {
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  .fold summary {
    display: flex;
    align-items: center;
    min-height: 48px;
    cursor: pointer;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .ans {
    padding: 0 0 12px;
  }
  .ans p {
    margin: 0 0 8px;
    overflow-wrap: break-word;
    white-space: pre-line;
  }
  .go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    font-weight: 500;
  }
  .own {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .own li {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 6px;
    border-top: 1px solid var(--line);
  }
  .own .fold {
    border-top: 0;
  }
  .grow {
    flex: 1 1 10rem;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .addrow {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .addrow .inp {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .err {
    margin: 4px 0;
    color: var(--bad);
  }
</style>
