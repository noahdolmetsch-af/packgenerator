<script>
  /**
   * Paket D «Mit Freunden»: what a friend sees when they open an ask. They answer in their own words
   * (and with a voice note of up to one minute where it fits) and send the answer back as a link or a
   * file. Nothing is saved on their device except their name for the next time.
   */
  import { untrack } from 'svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { topicOf, replyEnvelope, newId } from './freunde.js';
  import PhotoMarks from './PhotoMarks.svelte';
  import VoiceNote from './VoiceNote.svelte';
  import SendBox from './SendBox.svelte';
  import { X } from '@lucide/svelte';

  let { env, me = '', onname = null } = $props();
  const ask = $derived(env.ask);
  const T = $derived(topicOf(ask.topic));
  const today = localDay();
  const dayText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' }) : '');

  let name = $state(untrack(() => me));
  let a = $state({ text: '', day: '', ok: '', qs: {}, notes: {}, done: {}, take: {}, marks: {}, answers: {}, extra: [], voice: '', voiceS: 0 });
  let problem = $state('');
  let sent = $state(null);
  const tasks = $derived(ask.lines.filter((l) => !l.q));
  const questions = $derived(ask.lines.filter((l) => l.q));

  function send(e) {
    e.preventDefault();
    problem = '';
    if (!name.trim()) return (problem = t('Please write your name, so {name} knows who answers.', { name: env.by || t('your friend') }));
    onname?.(name.trim());
    sent = replyEnvelope(ask, $state.snapshot(a), name.trim(), today);
  }
  const flip = (k, id) => (a[k] = { ...a[k], [id]: !a[k][id] });
  const mark = (id, v) => (a.marks = { ...a.marks, [id]: a.marks[id] === v ? '' : v });
</script>

<section class="fr-card fr-answer" data-fr-answer={ask.topic} aria-labelledby="fr-an-h">
  <p class="fr-from">{t('{name} asks you', { name: env.by || t('A friend') })}{env.at ? ` · ${dayText(env.at)}` : ''}</p>
  <h2 id="fr-an-h" class="title">{t(T.title)}: {ask.title}</h2>
  {#if ask.date || ask.place}<p class="fr-fine">{[dayText(ask.date), ask.place].filter(Boolean).join(' · ')}</p>{/if}
  {#if ask.text}<p class="fr-quote">{ask.text}</p>{/if}

  {#if sent}
    <p class="fr-ok" role="status">{t('Thank you! Now send your answer back to {name}.', { name: env.by || t('your friend') })}</p>
    <SendBox env={sent} text={t('My answer: {what}', { what: ask.title })} />
  {:else}
    <form class="fr-form" onsubmit={send}>
      {#if ask.topic === 'photo' && ask.photo}
        <p class="fr-fine">{t('Write something to each point. Tap the photo to set a point of your own.')}</p>
        <PhotoMarks photo={ask.photo} marks={ask.marks ?? []} extra={a.extra} onadd={(x, y) => (a.extra = [...a.extra, { id: newId('x'), x, y, text: '' }].slice(0, 12))} />
        {#each ask.marks ?? [] as m, i (m.id)}
          <label class="fr-f"><span><b class="fr-num">{i + 1}</b> {m.text || t('Point {n}', { n: i + 1 })}</span><input bind:value={a.notes[m.id]} /></label>
        {/each}
        {#each a.extra as m, i (m.id)}
          <div class="fr-line"><b class="fr-num them">{String.fromCharCode(65 + i)}</b><input class="fr-in" bind:value={m.text} placeholder={t('Your point')} aria-label={t('Your point')} /><button type="button" class="btn btn-link" aria-label={t('Remove')} onclick={() => (a.extra = a.extra.filter((x) => x.id !== m.id))}><X size={16} /></button></div>
        {/each}
      {:else if ask.topic === 'costs'}
        <ul class="fr-list">{#each ask.lines as l (l.id)}<li>{l.text}</li>{/each}</ul>
        <div class="fr-seg" role="group" aria-label={t('Your answer')}>
          <button type="button" class:on={a.ok === 'agree'} aria-pressed={a.ok === 'agree'} onclick={() => (a.ok = 'agree')}>{t('Fine with me')}</button>
          <button type="button" class:on={a.ok === 'other'} aria-pressed={a.ok === 'other'} onclick={() => (a.ok = 'other')}>{t('We agreed on something else')}</button>
        </div>
      {:else if ask.topic === 'handover'}
        <p class="fr-fine">{t('Unclear? Write your question next to the task.')}</p>
        {#each ask.lines as l (l.id)}
          <label class="fr-f"><span>{l.text}</span><input bind:value={a.qs[l.id]} placeholder={t('Your question, optional')} /></label>
        {/each}
        <label class="fr-check"><input type="checkbox" checked={a.ok === 'done'} onchange={(e) => (a.ok = e.currentTarget.checked ? 'done' : '')} /> {t('I have understood everything')}</label>
      {:else if ask.topic === 'duties'}
        <p class="fr-fine">{t('Tick what you take care of and have ready.')}</p>
        {#each ask.lines as l (l.id)}
          <label class="fr-check"><input type="checkbox" checked={!!a.done[l.id]} onchange={() => flip('done', l.id)} /> {l.text}</label>
        {/each}
      {:else if ask.topic === 'pair'}
        <p class="fr-fine">{t('Mark what you would like to have along and what you could do without.')}</p>
        {#each ask.lines as l (l.id)}
          <div class="fr-line">
            <span class="fr-tx">{l.text}</span>
            <span class="fr-seg" role="group" aria-label={l.text}>
              <button type="button" class:on={a.marks[l.id] === 'want'} aria-pressed={a.marks[l.id] === 'want'} onclick={() => mark(l.id, 'want')}>{t('I would like it')}</button>
              <button type="button" class:on={a.marks[l.id] === 'skip'} aria-pressed={a.marks[l.id] === 'skip'} onclick={() => mark(l.id, 'skip')}>{t('I could do without')}</button>
            </span>
          </div>
        {/each}
      {:else if ask.topic === 'workshop'}
        {#if tasks.length}
          <fieldset class="fr-lines"><legend>{t('Tasks')}</legend>
            {#each tasks as l (l.id)}
              <div class="fr-line">
                <span class="fr-tx">{l.text}{l.who ? ` · ${t('for {name}', { name: l.who })}` : ''}</span>
                <label class="fr-check"><input type="checkbox" checked={!!a.take[l.id]} onchange={() => flip('take', l.id)} /> {t('I take it')}</label>
                <label class="fr-check"><input type="checkbox" checked={!!a.done[l.id]} onchange={() => flip('done', l.id)} /> {t('Done')}</label>
              </div>
            {/each}
          </fieldset>
        {/if}
        {#each questions as l (l.id)}<label class="fr-f"><span>{l.text}</span><input bind:value={a.answers[l.id]} /></label>{/each}
      {:else if ask.topic === 'level'}
        <div class="fr-seg" role="group" aria-label={t('Your answer')}>
          <button type="button" class:on={a.ok === 'clear'} aria-pressed={a.ok === 'clear'} onclick={() => (a.ok = 'clear')}>{t('Clear to me')}</button>
          <button type="button" class:on={a.ok === 'unsure'} aria-pressed={a.ok === 'unsure'} onclick={() => (a.ok = 'unsure')}>{t('Not sure yet')}</button>
        </div>
      {:else if ask.topic === 'place'}
        <label class="fr-f"><span>{t('When you were there')}</span><input type="date" bind:value={a.day} max={today} /></label>
      {/if}

      <label class="fr-f"><span>{ask.topic === 'level' ? t('In your own words: what does it mean for you?') : ask.topic === 'story' || ask.topic === 'summit' ? t('Your view') : ask.topic === 'place' ? t('What you found there') : t('A note')} {#if ask.topic !== 'level'}<small>{t('optional')}</small>{/if}</span>
        <textarea rows="4" bind:value={a.text} data-fr-answer-text></textarea>
      </label>
      {#if T.voice}<VoiceNote voice={a.voice} voiceS={a.voiceS} onchange={(v) => ((a.voice = v.voice), (a.voiceS = v.voiceS))} />{/if}
      <label class="fr-f"><span>{t('Your name')}</span><input bind:value={name} autocomplete="given-name" data-fr-name /></label>
      {#if problem}<p class="fr-err" role="alert">{problem}</p>{/if}
      <div class="fr-row"><button type="submit" class="btn hi" data-fr-reply>{t('Make my answer')}</button></div>
      <p class="fr-fine">{t('Your answer stays your own: it goes only to who asked you, with your name and today’s date.')}</p>
    </form>
  {/if}
</section>
