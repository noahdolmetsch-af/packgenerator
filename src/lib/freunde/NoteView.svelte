<script>
  /**
   * Paket D «Mit Freunden»: one answer of a friend, as they wrote it, with their name and the day.
   * ask: the ask it answers (yours as stored, or the copy inside the answer).
   */
  import { t, locale } from '../i18n.svelte.js';
  import { pairRows } from './freunde.js';
  import PhotoMarks from './PhotoMarks.svelte';

  let { note, ask = null } = $props();
  const a = $derived(note.answer ?? {});
  const lines = $derived(ask?.lines ?? []);
  const textOf = (id) => lines.find((l) => l.id === id)?.text ?? id;
  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const OK = { clear: 'Clear to me', unsure: 'Not sure yet', agree: 'Fine with me', other: 'We agreed on something else', done: 'I have understood everything' };
  const VERDICT = { take: 'take along', talk: 'talk about it', leave: 'leave at home', open: 'nobody marked it' };
  const MARK = { want: 'would like it', skip: 'could do without', '': '–' };
</script>

<article class="fr-note" data-fr-note={note.topic}>
  <p class="fr-by"><b>{note.by || t('A friend')}</b> · {dayText(note.at)}</p>
  {#if a.ok}<p class="fr-pill">{t(OK[a.ok])}</p>{/if}
  {#if a.day}<p class="fr-fine">{t('There on {date}', { date: dayText(a.day) })}</p>{/if}
  {#if a.text}<p class="fr-said-text">{a.text}</p>{/if}
  {#if a.voice}<audio controls src={a.voice}></audio>{/if}
  {#if a.qs}
    <ul class="fr-list">{#each Object.entries(a.qs) as [id, q] (id)}<li><b>{textOf(id)}:</b> {q}{#if note.solved?.[id]} <small>· {t('answered')}</small>{/if}</li>{/each}</ul>
  {/if}
  {#if note.topic === 'photo' && ask?.photo}<PhotoMarks photo={ask.photo} marks={ask.marks ?? []} extra={a.extra ?? []} />{/if}
  {#if a.notes}
    <ul class="fr-list">{#each (ask?.marks ?? []).filter((m) => a.notes[m.id]) as m (m.id)}<li><b>{ask.marks.indexOf(m) + 1}</b> {m.text ? `${m.text}: ` : ''}{a.notes[m.id]}</li>{/each}</ul>
  {/if}
  {#if a.extra?.length}
    <ul class="fr-list">{#each a.extra as m, i (m.id)}<li><b>{String.fromCharCode(65 + i)}</b> {m.text}</li>{/each}</ul>
  {/if}
  {#if note.topic === 'pair' && lines.length}
    <ul class="fr-list fr-pair">
      {#each pairRows(lines, a.marks ?? {}) as r (r.id)}
        <li class="v-{r.verdict}"><span>{r.text}</span><small>{t('you')}: {t(MARK[r.me])} · {note.by}: {t(MARK[r.them])}</small><b>{t(VERDICT[r.verdict])}</b></li>
      {/each}
    </ul>
  {/if}
  {#if a.done && note.topic !== 'pair'}
    <ul class="fr-list">{#each Object.keys(a.done) as id (id)}<li>✓ {textOf(id)} <small>· {note.by}, {dayText(note.at)}</small></li>{/each}</ul>
  {/if}
  {#if a.take}
    <ul class="fr-list">{#each Object.keys(a.take) as id (id)}<li>{t('{name} takes «{task}»', { name: note.by, task: textOf(id) })}</li>{/each}</ul>
  {/if}
  {#if a.answers}
    <ul class="fr-list">{#each Object.entries(a.answers) as [id, v] (id)}<li><b>{textOf(id)}</b> {v}</li>{/each}</ul>
  {/if}
</article>
