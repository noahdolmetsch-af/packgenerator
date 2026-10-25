<script>
  /**
   * Paket N «Pläne und Träume» (Noah 19.10.2026 «4b», «5 a und nutzer kann b ausschalten und ausblenden»):
   * Ich › Mein Kompass (#/me/compass), its own page apart from the notes.
   * - Goals (#1047): a goal with a day becomes steps (GoalCard); once a week «Wie läuft's?» (GoalCheck).
   * - Boxes (#337): resolutions, dreams, to remember, ideas; each a group: add, rename, delete (entries stay).
   * - Ideas in order (#338): every box is a list ordered with arrows and drag; an entry can be ticked
   *   done or become a goal.
   * - Settings at the bottom: AI suggestions for steps on or off, and the button hidden or shown.
   * Data: settings COMPASS_KEY (compass.js), in every backup.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { db } from '../lib/db.js';
  import { COMPASS_KEY, compassOf, boxName, addBox, renameBox, deleteBox, entriesOf, addEntry, editEntry, removeEntry, moveEntry, newGoal, entryToGoal } from '../lib/compass.js';
  import { isSetUp } from '../lib/helper/client.svelte.js';
  import { sortable } from '../lib/ui/sortable.js';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import GroupActions from '../lib/ui/GroupActions.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import DateInput from '../lib/ui/DateInput.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import GoalCard from '../lib/compass/GoalCard.svelte';
  import GoalCheck from '../lib/compass/GoalCheck.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { Plus, Trash2, Target, Settings2 } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const q = liveQuery(() => db.settings.get(COMPASS_KEY));
  const c = $derived(compassOf($q?.value));
  const save = (next) => db.settings.put({ key: COMPASS_KEY, value: $state.snapshot(next) });
  const openGoals = $derived(c.goals.filter((g) => !g.done));
  const doneGoals = $derived(c.goals.filter((g) => g.done));
  const orphans = $derived(entriesOf(c, ''));

  // goals
  let goalTitle = $state('');
  let goalDue = $state('');
  let goalMsg = $state('');
  async function addGoal(e) {
    e.preventDefault();
    if (!goalTitle.trim()) return (goalMsg = t('Write your goal in a few words.'));
    goalMsg = '';
    await save({ ...c, goals: [newGoal({ title: goalTitle, due: goalDue }), ...c.goals] });
    goalTitle = '';
    goalDue = '';
  }
  const putGoal = (g) => save({ ...c, goals: c.goals.some((x) => x.id === g.id) ? c.goals.map((x) => (x.id === g.id ? g : x)) : [g, ...c.goals] });
  async function removeGoal(id) {
    const g = c.goals.find((x) => x.id === id);
    if (!g || (await askDelete({ title: t('Delete the goal "{text}"?', { text: g.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({ run: async () => (await save({ ...c, goals: c.goals.filter((x) => x.id !== id) }), g), undo: (snap) => putGoal(snap), text: t('"{name}" deleted.', { name: g.title }), name: g.title });
  }

  // entries
  let typed = $state({});
  let emptyIn = $state(null); // Tote Knöpfe (Klick-Rundgang 22.10.2026): «+» with an empty field says why
  async function add(box, e) {
    e.preventDefault();
    const tx = (typed[box] ?? '').trim();
    if (!tx) return (emptyIn = box);
    emptyIn = null;
    await save(addEntry(c, box, tx));
    typed[box] = '';
  }
  async function dropEntry(en) {
    await deleteWithUndo({ run: async () => (await save(removeEntry(c, en.id)), $state.snapshot(c)), undo: (snap) => save(snap), text: t('"{name}" deleted.', { name: en.text.slice(0, 40) }), name: en.text.slice(0, 40) });
  }

  // boxes (groups)
  let newBox = $state('');
  let boxEmpty = $state(false);
  let deleting = $state.raw(null);
  async function makeBox(e) {
    e.preventDefault();
    if (!newBox.trim()) return (boxEmpty = true);
    boxEmpty = false;
    await save(addBox(c, newBox));
    newBox = '';
  }
  async function removeBox(b, to) {
    const name = boxName(c.boxes, b.key, t);
    const before = $state.snapshot(c);
    await deleteWithUndo({ run: async () => (await save(deleteBox(before, b.key, to)), before), undo: (snap) => save(snap), text: t('Box «{name}» deleted.', { name }), name });
  }
  const setAi = (patch) => save({ ...c, ai: { ...c.ai, ...patch } });
</script>

<div class="ich-page compass" data-page="compass">
  <VeloHead crumbs={[{ label: t('Plan|place'), href: '#/week' }]} title={t('My compass')} sub={t('Goals in steps, resolutions, dreams, ideas')} />
  <p class="cp-intro">{t('A fixed place for what you want to reach and what is on your mind. A goal with a day becomes small steps; once a week the app asks how it is going.')}</p>
  <AreaIntro place="compass" />

  <GoalCheck />

  <section class="ich-sec" aria-labelledby="cp-goals" data-goals>
    <div class="ich-h"><div><h2 id="cp-goals">{t('Goals')} <small class="n num">{openGoals.length}</small></h2><p class="ich-hs">{t('Type the steps yourself; the app spreads the dates.')}</p></div></div>
    <form class="card cap" onsubmit={addGoal}>
      <label class="capt"><span class="lbl">{t('New goal')}</span><input class="inp" type="text" bind:value={goalTitle} maxlength="80" placeholder={t('e.g. Ride the Alpenbrevet')} /></label>
      <label class="capd"><span class="lbl">{t('Reach it by')} <small class="q">· {t('optional')}</small></span><DateInput bind:value={goalDue} /></label>
      <button type="submit" class="btn hi"><Plus size={16} aria-hidden="true" />{t('Add goal')}</button>
      {#if goalMsg}<p class="err" role="alert">{goalMsg}</p>{/if}
    </form>
    <div class="goals">
      {#each openGoals as g (g.id)}<GoalCard goal={g} ai={c.ai} onchange={putGoal} onremove={removeGoal} />{/each}
    </div>
    {#if doneGoals.length}
      <details class="reached"><summary>{tn(doneGoals.length, '{n} goal finished', '{n} goals finished')}</summary><div class="goals">{#each doneGoals as g (g.id)}<GoalCard goal={g} ai={c.ai} onchange={putGoal} onremove={removeGoal} />{/each}</div></details>
    {/if}
  </section>

  {#snippet boxList(key, rows)}
    <ul class="card ich-list" use:sortable={{ onmove: (from, to) => save(moveEntry(c, key, from, to)) }}>
      {#each rows as en, i (en.id)}
        <li data-sort-id={en.id} data-entry={en.id}>
          <div class="erow">
            <SortGrip name={en.text} onstep={(dir) => save(moveEntry(c, key, i, i + dir))} />
            <label class="ck"><input type="checkbox" checked={!!en.done} onchange={(e) => save(editEntry(c, en.id, { done: e.currentTarget.checked }))} /><span class:done={en.done}>{en.text}</span></label>
            {#if !en.goalId}<button type="button" class="btn sm" onclick={() => save(entryToGoal(c, en.id, { id: `goal-${Date.now().toString(36)}` }))}><Target size={14} aria-hidden="true" />{t('Make a goal')}</button>{/if}
            <SortArrows name={en.text} {i} n={rows.length} onstep={(dir) => save(moveEntry(c, key, i, i + dir))} />
            <button type="button" class="rm" aria-label={t('Remove {name}', { name: en.text })} onclick={() => dropEntry(en)}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        </li>
      {/each}
    </ul>
  {/snippet}

  {#each c.boxes as b (b.key)}
    {@const rows = entriesOf(c, b.key)}
    <section class="ich-sec" data-box={b.key}>
      <GroupActions name={boxName(c.boxes, b.key, t)} count={rows.length} allowEmpty={!b.key.startsWith('box-')}
        renameExplain={t('only the name changes; the entries stay')} deleteExplain={t('only the box goes; its entries stay')}
        deleteAsk="" onrename={(v) => save(renameBox(c, b.key, v))} ondelete={() => (deleting = b)}>
        <h2>{boxName(c.boxes, b.key, t)} <small class="n num">{rows.length}</small></h2>
      </GroupActions>
      {#if rows.length}{@render boxList(b.key, rows)}{/if}
      <form class="addrow" onsubmit={(e) => add(b.key, e)}>
        <input class="inp" type="text" bind:value={typed[b.key]} maxlength="200" placeholder={t('Write something into «{name}»', { name: boxName(c.boxes, b.key, t) })} aria-label={t('New entry in {name}', { name: boxName(c.boxes, b.key, t) })} />
        <button type="submit" class="btn" aria-label={t('Add')}><Plus size={16} aria-hidden="true" /></button>
      </form>
      {#if emptyIn === b.key}<p class="rc-note" role="status" data-compass-empty>{t('Write something first, then tap «+».')}</p>{/if}
    </section>
  {/each}

  {#if orphans.length}
    <section class="ich-sec" data-box="">
      <div class="ich-h"><div><h2>{t('No box')} <small class="n num">{orphans.length}</small></h2><p class="ich-hs">{t('From a deleted box. They stay until you delete them.')}</p></div></div>
      {@render boxList('', orphans)}
    </section>
  {/if}

  <section class="ich-sec" aria-labelledby="cp-more">
    <div class="ich-h"><div><h2 id="cp-more"><Settings2 size={16} aria-hidden="true" /> {t('Boxes and AI')}</h2></div></div>
    <div class="card ich-body more">
      <form class="addrow" onsubmit={makeBox}>
        <input class="inp" type="text" bind:value={newBox} maxlength="40" placeholder={t('Own box')} aria-label={t('Own box')} />
        <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add box')}</button>
      </form>
      {#if boxEmpty}<p class="rc-note" role="status">{t('Give the box a name first.')}</p>{/if}
      <label class="ck"><input type="checkbox" checked={!c.ai.off} onchange={(e) => setAi({ off: !e.currentTarget.checked })} data-ai-on /><span>{t('AI suggests steps for a goal')}</span></label>
      <label class="ck"><input type="checkbox" checked={c.ai.hidden} onchange={(e) => setAi({ hidden: e.currentTarget.checked })} data-ai-hide /><span>{t('Hide the button «Suggest steps»')}</span></label>
      <label class="ck"><input type="checkbox" checked={c.onToday} onchange={(e) => save({ ...c, onToday: e.currentTarget.checked })} data-on-today /><span>{t('Show the next step on Today')}</span></label>
      <p class="ich-help">{isSetUp() ? t('Uses your AI helper and its monthly limit. Only the goal and its steps are sent.') : t('Needs the AI helper (Me › AI helper). Without it you type the steps yourself.')}</p>
    </div>
  </section>
</div>

{#if deleting}
  {@const b = deleting}
  <GroupDeleteSheet
    title={t('Delete the box «{name}»?', { name: boxName(c.boxes, b.key, t) })}
    count={entriesOf(c, b.key).length}
    what={(n) => tn(n, '{n} entry', '{n} entries')}
    none={t('No box')}
    noneHint={t('The entries stay, under «No box». Nothing is deleted.')}
    targets={c.boxes.filter((x) => x.key !== b.key).map((x) => ({ id: x.key, name: boxName(c.boxes, x.key, t) }))}
    onconfirm={(to) => removeBox(b, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .compass {
    max-width: 900px;
  }
  .cp-intro {
    max-width: 65ch;
    margin: 0 0 var(--sp-4);
    color: var(--ink-2);
  }
  .cap {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
    padding: 10px 12px;
    margin: 0 0 var(--sp-3);
  }
  .capt {
    display: grid;
    gap: 4px;
    flex: 2 1 14em;
    min-width: 0;
  }
  .capd {
    display: grid;
    gap: 4px;
    flex: 1 1 10em;
  }
  .capt .inp {
    width: 100%;
    box-sizing: border-box;
  }
  .goals {
    display: grid;
    gap: var(--sp-3);
  }
  .reached {
    margin-top: var(--sp-3);
  }
  .reached summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  .erow {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
  }
  .ck {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
  }
  .ck input {
    width: 20px;
    height: 20px;
    flex: none;
  }
  .done {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  .rm {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
    flex: none;
  }
  .addrow {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }
  .addrow .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
  .more {
    display: grid;
    gap: 6px;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
  @media (max-width: 600px) {
    .erow {
      flex-wrap: wrap;
    }
  }
</style>
