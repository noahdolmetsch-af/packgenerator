<script>
  /**
   * Paket C › Eigene kleine Experimente (#/me/ruhig/versuche; 996 Ideen UC-254-I1): «Experiment mit Ende».
   * A question, what you change, a time span and a clear end, then a short look back. Logic: versuche.js.
   */
  import { FlaskConical, Plus, Check, X, Pencil, Trash2, RotateCcw } from '@lucide/svelte';
  import Card from './Card.svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { settingQ, saveSetting } from './store.js';
  import { dmy } from './base.js';
  import { EXP_KEY, EXP_DAYS, EXP_EXAMPLES, KEEP, expsOf, newExp, expEnd, expState, expProgress, expTick, expNote, expReview, expStop, expAgain } from './versuche.js';

  const today = localDay();
  const q = settingQ(EXP_KEY);
  const exps = $derived(expsOf($q));
  const save = (list) => saveSetting(EXP_KEY, list);
  const change = (id, fn) => save(exps.map((e) => (e.id === id ? fn(e) : e)));
  let open = $state({ exp: true });

  let nq = $state('');
  let nchange = $state('');
  let ndays = $state(7);
  let nfrom = $state(today);
  function add(e) {
    e.preventDefault();
    const x = newExp({ q: nq, change: nchange, from: nfrom, days: ndays });
    if (!x) return;
    save([x, ...exps]);
    nq = '';
    nchange = '';
  }
  const STATE = { soon: 'Starts on {day}', running: 'Day {n} of {days}', review: 'Over: your look back', stopped: 'Stopped: your look back', done: 'Finished' };
  let learned = $state({});
  let keep = $state({});
  let note = $state('');
  let editing = $state('');
  let eq = $state('');
  async function remove(x) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: x.q }), text: t('The try with its ticks and the look back go.') });
    if (ok !== 'delete') return;
    const before = exps;
    await deleteWithUndo({ run: () => save(exps.filter((e) => e.id !== x.id)).then(() => before), undo: (s) => save(s), text: t('«{name}» deleted.', { name: x.q }), name: x.q });
  }
</script>

<ul class="rh-cards">
  <Card id="exp" icon={FlaskConical} title={t('Experiment with an end')} lead={t('A question, what you change, how long; then a short look back')} bind:open={open.exp}>
    <p class="rh-help">{t('A try is never a routine: after the last day it asks what you learned and ends. You decide whether you keep it.')}</p>
    <form class="rh-new" onsubmit={add}>
      <label class="rh-field"><span>{t('Your question')}</span><input class="inp" bind:value={nq} placeholder={t('e.g. Do I sleep better without a screen after 21:00?')} data-exp-q /></label>
      <label class="rh-field"><span>{t('What you change')}</span><input class="inp" bind:value={nchange} placeholder={t('e.g. No phone after 21:00')} /></label>
      <div class="rh-row">
        <label class="rh-field"><span>{t('From')}</span><input class="inp" type="date" bind:value={nfrom} /></label>
        <label class="rh-field"><span>{t('How long')}</span><select class="inp" bind:value={ndays}>{#each EXP_DAYS as d (d)}<option value={d}>{tn(d, '{n} day', '{n} days')}</option>{/each}</select></label>
      </div>
      {#if !exps.length}<div class="rh-chips">{#each EXP_EXAMPLES as x (x.q)}<button type="button" class="rh-chip" onclick={() => ((nq = t(x.q)), (nchange = t(x.change)))}>{t(x.q)}</button>{/each}</div>{/if}
      <button type="submit" class="btn hi" disabled={!nq.trim()} data-exp-add><Plus size={16} aria-hidden="true" />{t('Start the experiment')}</button>
    </form>
  </Card>

  {#each exps as x (x.id)}
    {@const st = expState(x, today)}
    {@const p = expProgress(x, today)}
    <li class="rh-card rh-exp" data-exp={x.id} data-state={st}>
      <div class="rh-body rh-top">
        <div class="rh-row rh-eh">
          {#if editing === x.id}
            <form class="rh-row rh-grow2" onsubmit={(e) => (e.preventDefault(), eq.trim() && change(x.id, (o) => ({ ...o, q: eq.trim() })), (editing = ''))}><input class="inp" bind:value={eq} aria-label={t('Your question')} /><button class="btn sm" type="submit">{t('Save')}</button></form>
          {:else}
            <h3 class="rh-sub rh-grow2">{x.q}</h3>
            <button type="button" class="rh-x" aria-label={t('Rename')} onclick={() => ((editing = x.id), (eq = x.q))}><Pencil size={16} /></button>
          {/if}
          <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(x)}><Trash2 size={16} /></button>
        </div>
        {#if x.change}<p class="rh-help">{x.change}</p>{/if}
        <p class="rh-help"><span class="rh-tag" class:ok={st === 'done'} class:warn={st === 'review' || st === 'stopped'}>{t(STATE[st], { day: dmy(x.from), n: p.day, days: x.days })}</span> · {dmy(x.from)} – {dmy(expEnd(x))}{#if p.yes || p.no}{' '}· {t('{yes} yes, {no} no', { yes: p.yes, no: p.no })}{/if}</p>
        {#if st === 'running'}
          <div class="rh-row" aria-label={t('Today')}>
            <span>{t('Today, did you do it?')}</span>
            <button type="button" class="rh-chip" aria-pressed={x.ticks[today] === 'yes'} onclick={() => change(x.id, (o) => expTick(o, today, 'yes'))} data-exp-yes><Check size={14} aria-hidden="true" /> {t('yes')}</button>
            <button type="button" class="rh-chip" aria-pressed={x.ticks[today] === 'no'} onclick={() => change(x.id, (o) => expTick(o, today, 'no'))}><X size={14} aria-hidden="true" /> {t('no')}</button>
          </div>
          <form class="rh-row" onsubmit={(e) => (e.preventDefault(), change(x.id, (o) => expNote(o, today, note)), (note = ''))}><input class="inp" bind:value={note} placeholder={x.notes[today] ?? t('A short note for today (optional)')} aria-label={t('A short note for today')} /><button class="btn sm" type="submit" disabled={!note.trim()}>{t('Keep')}</button></form>
          <button type="button" class="btn sm btn-link" onclick={() => change(x.id, (o) => expStop(o, today))}>{t('End early')}</button>
        {:else if st === 'review' || st === 'stopped'}
          {#if Object.keys(x.notes).length}<ul class="rh-list">{#each Object.entries(x.notes).sort() as [d, n] (d)}<li><span class="rh-grow">{n}<small>{dmy(d)}</small></span></li>{/each}</ul>{/if}
          <label class="rh-field"><span>{t('What did you learn?')}</span><textarea class="inp" bind:value={learned[x.id]} data-exp-learned></textarea></label>
          <div class="rh-chips">{#each KEEP as k (k.key)}<button type="button" class="rh-chip" aria-pressed={keep[x.id] === k.key} onclick={() => (keep[x.id] = k.key)}>{t(k.label)}</button>{/each}</div>
          <button type="button" class="btn hi" disabled={!(learned[x.id] ?? '').trim() && !keep[x.id]} onclick={() => change(x.id, (o) => expReview(o, { learned: learned[x.id] ?? '', keep: keep[x.id] ?? '' }, today))} data-exp-review>{t('Finish the experiment')}</button>
        {:else if st === 'done'}
          {#if x.review.learned}<p class="rh-note">{x.review.learned}</p>{/if}
          {#if x.review.keep}<p class="rh-help">{t(KEEP.find((k) => k.key === x.review.keep).label)} · {dmy(x.review.at)}</p>{/if}
          <button type="button" class="btn sm" onclick={() => { const n = expAgain(x, today); if (n) save([n, ...exps]); }}><RotateCcw size={14} aria-hidden="true" />{t('Try again from today')}</button>
        {/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  .rh-new {
    display: grid;
    gap: var(--sp-3);
  }
  .rh-top {
    padding-top: var(--sp-4);
  }
  .rh-eh {
    flex-wrap: nowrap;
  }
  .rh-grow2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow-wrap: break-word;
  }
</style>
