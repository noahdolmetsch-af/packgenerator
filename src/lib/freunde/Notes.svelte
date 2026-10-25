<script>
  /**
   * Paket D «Mit Freunden»: what friends sent you and what you asked. Each contribution stays a
   * separate entry with name and date (it never changes your own). Open questions of the flat sitter
   * show on top until you answer them; requests for your shelf go step by step: yes, handed over
   * (a lending list in Gear › Lent out remembers it), or no.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { NOTES_KEY, ASKS_KEY, WANT, topicOf, groupNotes, openQuestions, solveQuestion, stepRequest, ticksOf, tasksOf, askEnvelope } from './freunde.js';
  import { changeKey, putKey } from './store.js';
  import { newLend, putLend, saveLends } from '../lend.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import NoteView from './NoteView.svelte';
  import SendBox from './SendBox.svelte';
  import { Trash2, Check, Link, X, HandHelping } from '@lucide/svelte';

  let { me = '' } = $props();
  const today = localDay();
  const notesQ = liveQuery(() => db.settings.get(NOTES_KEY));
  const asksQ = liveQuery(() => db.settings.get(ASKS_KEY));
  const notes = $derived(Array.isArray($notesQ?.value) ? $notesQ.value : []);
  const asks = $derived(Array.isArray($asksQ?.value) ? $asksQ.value : []);
  const groups = $derived(groupNotes(notes));
  const questions = $derived(openQuestions(notes, asks));
  const requests = $derived(notes.filter((n) => n.kind === 'request' && n.state !== 'declined' && n.state !== 'handed'));
  const doneRequests = $derived(notes.filter((n) => n.kind === 'request' && (n.state === 'declined' || n.state === 'handed')));
  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long' }) : '');
  const askOf = (g) => asks.find((a) => a.id === g.askId) ?? null;
  let problem = $state('');
  let again = $state(null);

  async function changeNote(id, fn, text) {
    problem = '';
    try {
      const before = await changeKey(NOTES_KEY, [], (list) => list.map((n) => (n.id === id ? fn(n) : n)));
      if (text) offerDone(text, () => putKey(NOTES_KEY, before));
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const solve = (q) => changeNote(q.noteId, (n) => solveQuestion(n, q.lineId), t('Marked as answered.'));

  async function del(n) {
    if ((await askDelete({ title: t('Delete the contribution of {name}?', { name: n.by || t('a friend') }), text: t('Only this contribution goes; your own entries stay.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => changeKey(NOTES_KEY, [], (list) => list.filter((x) => x.id !== n.id)), undo: (before) => putKey(NOTES_KEY, before), text: t('Contribution deleted.'), name: n.by || '' });
  }
  async function delAsk(a) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: a.title }), text: t('Only your ask goes from this list. The answers you kept stay.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => changeKey(ASKS_KEY, [], (list) => list.filter((x) => x.id !== a.id)), undo: (before) => putKey(ASKS_KEY, before), text: t('«{name}» deleted.', { name: a.title }), name: a.title });
  }

  /* requests for the shelf: yes → handed over (a lending list) → back in Gear › Lent out */
  const yes = (n) => changeNote(n.id, (x) => stepRequest(x, 'promised', today), t('You said yes to {name}.', { name: n.by }));
  const no = (n) => changeNote(n.id, (x) => stepRequest(x, 'declined', today), t('Request of {name} declined.', { name: n.by }));
  async function hand(n) {
    problem = '';
    const ids = (await db.items.bulkGet(n.items.map((x) => x.id))).filter(Boolean).map((i) => i.id);
    const lend = newLend({ person: n.by, itemIds: ids, due: n.until, note: t('From your shelf') }, today);
    try {
      const before = await putLend(lend);
      await changeKey(NOTES_KEY, [], (list) => list.map((x) => (x.id === n.id ? stepRequest(x, 'handed', today, { lendId: lend.id }) : x)));
      offerDone(t('Handed over: Gear › Lent out remembers who has what.'), async () => {
        await saveLends(before);
        await changeKey(NOTES_KEY, [], (list) => list.map((x) => (x.id === n.id ? { ...x, state: 'promised', lendId: undefined } : x)));
      });
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const STATE = { new: 'new', promised: 'you said yes', handed: 'handed over', declined: 'declined' };
  const wantLabel = (k) => t(WANT.find((h) => h.key === k)?.label ?? 'borrow');
</script>

{#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}

{#if questions.length}
  <section class="fr-card fr-warn" data-fr-questions aria-labelledby="fr-q-h">
    <h3 id="fr-q-h" class="title">{tn(questions.length, '{n} open question before you leave', '{n} open questions before you leave')}</h3>
    <ul class="fr-list">
      {#each questions as q (`${q.noteId}-${q.lineId}`)}
        <li class="fr-line"><span class="fr-tx"><b>{q.by}</b> {t('about')} «{q.line}»: {q.q}</span><button type="button" class="btn sm" onclick={() => solve(q)}><Check size={16} aria-hidden="true" />{t('Answered')}</button></li>
      {/each}
    </ul>
  </section>
{/if}

{#if requests.length}
  <section class="fr-sec" aria-labelledby="fr-r-h">
    <h3 id="fr-r-h" class="title">{t('Requests for your shelf')}</h3>
    {#each requests as n (n.id)}
      <article class="fr-card" data-fr-request={n.state}>
        <p class="fr-by"><b>{n.by}</b> · {dayText(n.at)} · {t(STATE[n.state])}</p>
        <ul class="fr-list">{#each n.items as x (x.id)}<li>{x.n} · {wantLabel(x.w)}</li>{/each}</ul>
        {#if n.from || n.until}<p class="fr-fine">{[dayText(n.from), dayText(n.until)].filter(Boolean).join(' – ')}</p>{/if}
        {#if n.note}<p class="fr-quote">{n.note}</p>{/if}
        <div class="fr-row">
          {#if n.state === 'new'}<button type="button" class="btn hi" onclick={() => yes(n)}><Check size={16} aria-hidden="true" />{t('Say yes')}</button>{/if}
          {#if n.state === 'promised'}<button type="button" class="btn hi" onclick={() => hand(n)}><HandHelping size={16} aria-hidden="true" />{t('Handed over')}</button>{/if}
          <button type="button" class="btn" onclick={() => no(n)}><X size={16} aria-hidden="true" />{t('Say no')}</button>
        </div>
      </article>
    {/each}
  </section>
{/if}

<section class="fr-sec" aria-labelledby="fr-n-h">
  <h3 id="fr-n-h" class="title">{t('Contributions of friends')}</h3>
  {#if groups.length}
    {#each groups as g (g.key)}
      {@const a = askOf(g)}
      <article class="fr-card" data-fr-group={g.topic}>
        <p class="fr-from">{t(topicOf(g.topic)?.title ?? 'Ask friends')}</p>
        <h4 class="fr-h">{g.title}</h4>
        {#if a && g.topic === 'duties'}
          {@const ticks = ticksOf(notes, a.id)}
          <ul class="fr-list">{#each a.lines as l (l.id)}<li>{ticks[l.id] ? '✓' : '○'} {l.text}{#if ticks[l.id]} <small>· {ticks[l.id].map((x) => `${x.by}, ${dayText(x.at)}`).join('; ')}</small>{/if}</li>{/each}</ul>
        {:else if a && g.topic === 'workshop'}
          {@const tasks = tasksOf(notes, a.id)}
          <ul class="fr-list">{#each a.lines.filter((l) => !l.q) as l (l.id)}<li>{tasks[l.id]?.done?.length ? '✓' : '○'} {l.text}{#if tasks[l.id]?.take?.length} <small>· {t('takes it')}: {tasks[l.id].take.join(', ')}</small>{/if}{#if tasks[l.id]?.done?.length} <small>· {t('done')}: {tasks[l.id].done.map((x) => x.by).join(', ')}</small>{/if}</li>{/each}</ul>
        {/if}
        {#each g.notes as n (n.id)}
          <div class="fr-noterow">
            <NoteView note={n} ask={a ?? null} />
            <button type="button" class="btn btn-link" aria-label={t('Delete the contribution of {name}?', { name: n.by || t('a friend') })} onclick={() => del(n)}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        {/each}
      </article>
    {/each}
  {:else}
    <p class="fr-fine">{t('Nothing yet. When a friend answers, open their link here: their answer shows first, and you decide whether to keep it.')}</p>
  {/if}
</section>

{#if asks.length}
  <section class="fr-sec" aria-labelledby="fr-a-h">
    <h3 id="fr-a-h" class="title">{t('What you asked')}</h3>
    <ul class="fr-list">
      {#each asks as a (a.id)}
        <li class="fr-line" data-fr-myask>
          <span class="fr-tx">{t(topicOf(a.topic)?.title ?? 'Ask friends')}: <b>{a.title}</b> <small>· {dayText(a.at)} · {tn(notes.filter((n) => n.askId === a.id).length, '{n} answer', '{n} answers')}</small></span>
          <button type="button" class="btn sm" onclick={() => (again = again?.ask?.id === a.id ? null : askEnvelope(a, me, a.at))}><Link size={16} aria-hidden="true" />{t('Link again')}</button>
          <button type="button" class="btn btn-link" aria-label={t('Delete «{name}»?', { name: a.title })} onclick={() => delAsk(a)}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
        {#if again?.ask?.id === a.id}<li><SendBox env={again} ondone={() => (again = null)} /></li>{/if}
      {/each}
    </ul>
  </section>
{/if}
{#if doneRequests.length}<p class="fr-fine">{tn(doneRequests.length, '{n} request is closed (handed over or declined).', '{n} requests are closed (handed over or declined).')}</p>{/if}
