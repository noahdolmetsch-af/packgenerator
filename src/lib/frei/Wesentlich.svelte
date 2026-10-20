<script>
  /**
   * Paket T «Freie Zeit» › Was mir wesentlich ist (ideas 14, 27). «In this phase of my life what matters
   * to me is …»: one sentence whenever you like, the earlier ones stay below (what stayed, what changed).
   * Private on this device and in your backup. «My big maybe»: the adventure that keeps coming back,
   * why it draws you and exactly ONE next step; done → the next one. Change, sort, delete everything.
   */
  import { Heart, Plus, Pencil, Check, Compass } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import DateInput from '../ui/DateInput.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { cfgQuery, changeCfg, restoreCfg, loadCfg, rowsQuery, putRow, deleteRow, restoreRow } from '../freidb.js';
  import { maybesOf, stepDone, essentialSpan, uid } from '../frei.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const essQ = rowsQuery('essential');
  const ess = $derived($essQ ?? []);
  const span = $derived(essentialSpan(ess));
  const fmtDay = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  let draft = $state('');
  async function addEss(e) {
    e.preventDefault();
    const tx = draft.trim();
    if (!tx) return;
    await putRow({ kind: 'essential', day: today, text: tx });
    draft = '';
    offerDone(t('Kept. It stays private on this device and in your backup.'));
  }
  let essEdit = $state(null);
  async function saveEss() {
    const tx = essEdit.text.trim();
    if (!tx) return t('Please write a sentence.');
    await putRow({ ...essEdit.row, text: tx });
  }
  async function removeEss() {
    const r = essEdit.row;
    const answer = await askDelete({ title: t('Delete this entry?'), lines: [r.text.slice(0, 80)] });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => deleteRow(r.id), undo: (rec) => restoreRow(rec), text: t('Entry deleted.'), name: r.text.slice(0, 40) });
  }

  /* ---------- the big maybes ---------- */
  const maybes = $derived(maybesOf(cfg));
  let edit = $state(null);
  const openNew = () => (edit = { id: null, title: '', moment: '', why: '', step: '', stepDue: null });
  const openEdit = (m) => (edit = { ...m });
  async function saveMaybe() {
    const title = edit.title.trim();
    if (!title) return t('Please give it a name.');
    const rec = { title, moment: edit.moment.trim(), why: edit.why.trim(), step: edit.step.trim(), stepDue: edit.stepDue || null };
    if (edit.id) await changeCfg((c) => ({ ...c, maybes: maybesOf(c).map((m) => (m.id === edit.id ? { ...m, ...rec } : m)) }));
    else await changeCfg((c) => ({ ...c, maybes: [...maybesOf(c), { id: uid('mb'), done: [], ...rec }] }));
  }
  async function removeMaybe() {
    const m = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: m.title }) });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({ run: async () => (before = await changeCfg((c) => ({ ...c, maybes: maybesOf(c).filter((x) => x.id !== m.id) }))), undo: () => restoreCfg(before), text: t('"{name}" deleted.', { name: m.title }), name: m.title });
  }
  async function finishStep(m) {
    const before = await changeCfg((c) => ({ ...c, maybes: maybesOf(c).map((x) => (x.id === m.id ? stepDone(x, today) : x)) }));
    offerDone(t('Step done. What is the next one?'), () => restoreCfg(before));
    const next = maybesOf(await loadCfg()).find((x) => x.id === m.id);
    if (next) openEdit(next);
  }
  const ids = () => maybes.map((m) => m.id);
  function reorder(id, to) {
    const list = [...maybes];
    const [m] = list.splice(list.findIndex((x) => x.id === id), 1);
    list.splice(to, 0, m);
    return changeCfg((c) => ({ ...c, maybes: list }));
  }
  const onmove = (from, to) => reorder(ids()[from], to);
  const step = (id, dir) => {
    const i = ids().indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids().length - 1);
    return to === i ? null : reorder(id, to);
  };
</script>

<div class="fz" data-page="wesentlich">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('What matters to me')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('What matters to me')}</h1>
  <p class="fz-intro">{t('A quiet page for the big things. Write when you feel like it; nothing here is checked, scored or shared.')}</p>

  <section class="fz-box fz-soft" aria-labelledby="fzw-h">
    <h2 id="fzw-h" class="fz-h2"><Heart size={18} aria-hidden="true" /> {t('In this phase of my life what matters to me is …')}</h2>
    <form class="fz-form" onsubmit={addEss}>
      <textarea class="inp" rows="3" maxlength="2000" bind:value={draft} aria-label={t('In this phase of my life what matters to me is …')} placeholder={t('e.g. more time outside with friends')} data-ess-draft></textarea>
      <div class="fz-acts"><button type="submit" class="btn hi" data-ess-save>{t('Keep it')}</button></div>
    </form>
    {#if ess.length}
      <p class="fz-note">{span ? tn(span, 'Your entries cover {n} month.', 'Your entries cover {n} months.') : tn(ess.length, '{n} entry', '{n} entries')}</p>
      <ul class="fz-list" data-ess-list>
        {#each ess as r (r.id)}
          <li class="fz-row">
            <button type="button" class="fz-row-main" onclick={() => (essEdit = { row: r, text: r.text })}><b>{r.text}</b><small>{fmtDay(r.day)}</small></button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="fz-form" aria-labelledby="fzw-mb-h">
    <h2 id="fzw-mb-h" class="fz-h2"><Compass size={18} aria-hidden="true" /> {t('My big maybe')}</h2>
    <p class="fz-note">{t('The adventure that keeps popping up. Why it draws you, and exactly one next step to find out more.')}</p>
    {#if !maybes.length}<p class="fz-empty">{t('No big maybe yet. Which one would it be?')}</p>{/if}
    <ul class="fz-list fzw-mbs" use:sortable={{ onmove }}>
      {#each maybes as m, n (m.id)}
        <li class="fz-box" data-sort-id={m.id} data-maybe={m.id}>
          <div class="fz-row">
            <SortGrip name={m.title} onstep={(dir) => step(m.id, dir)} />
            <button type="button" class="fz-row-main" onclick={() => openEdit(m)}><b>{m.title}</b>{#if m.moment}<small>{m.moment}</small>{/if}</button>
            {#if !phone.matches}<SortArrows name={m.title} i={n} n={maybes.length} onstep={(dir) => step(m.id, dir)} />{/if}
            <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: m.title })} onclick={() => openEdit(m)}><Pencil size={18} aria-hidden="true" /></button>
          </div>
          {#if m.why}<p class="fz-text"><b>{t('Why it draws me:')}</b> {m.why}</p>{/if}
          {#if m.step}
            <div class="fzw-step">
              <span class="fz-kick">{t('Next step')}{#if m.stepDue}{' '}· {fmtDay(m.stepDue)}{/if}</span>
              <p class="fz-text">{m.step}</p>
              <div class="fz-acts"><button type="button" class="btn sm" onclick={() => finishStep(m)} data-step-done><Check size={16} aria-hidden="true" />{t('Step done')}</button></div>
            </div>
          {:else}
            <button type="button" class="btn sm" onclick={() => openEdit(m)}><Plus size={16} aria-hidden="true" />{t('Choose the next step')}</button>
          {/if}
          {#if m.done?.length}<p class="fz-note">{tn(m.done.length, '{n} step done', '{n} steps done')}: {m.done.map((d) => d.text).join(' · ')}</p>{/if}
        </li>
      {/each}
    </ul>
    <div class="fz-acts"><button type="button" class="btn" onclick={openNew} data-new-maybe><Plus size={16} aria-hidden="true" />{t('A big maybe')}</button></div>
  </section>
</div>

{#if essEdit}
  <FreiSheet title={t('Change entry')} sub={fmtDay(essEdit.row.day)} onsave={saveEss} ondelete={removeEss} onclose={() => (essEdit = null)}>
    <textarea class="inp" rows="5" maxlength="2000" bind:value={essEdit.text} aria-label={t('Text')}></textarea>
  </FreiSheet>
{/if}
{#if edit}
  <FreiSheet title={edit.id ? t('Change big maybe') : t('A big maybe')} onsave={saveMaybe} ondelete={edit.id ? removeMaybe : null} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('What is it?')}<input class="inp" maxlength="120" bind:value={edit.title} placeholder={t('e.g. Cross the Alps by bike')} data-maybe-title /></label>
    <label class="fz-lab">{t('The moment I would love to live')}<textarea class="inp" rows="3" maxlength="1000" bind:value={edit.moment}></textarea></label>
    <label class="fz-lab">{t('Why it draws me')}<textarea class="inp" rows="3" maxlength="1000" bind:value={edit.why}></textarea></label>
    <label class="fz-lab">{t('Exactly one next step')}<input class="inp" maxlength="200" bind:value={edit.step} placeholder={t('e.g. read one travel report')} data-maybe-step /></label>
    <div class="fz-lab"><span>{t('By when (optional)')}</span><DateInput bind:value={edit.stepDue} /></div>
  </FreiSheet>
{/if}

<style>
  .fzw-mbs {
    gap: 10px;
  }
  .fzw-mbs > li + li {
    border-top: 1px solid var(--card-line);
  }
  .fzw-step {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
</style>
