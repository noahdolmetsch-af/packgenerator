<script>
  /**
   * Mini-Tools «Mini-Umfrage» (idea 2): what the people asked see (#/mitmachen/<id>/<key>), one question
   * at a time with «Next» and «Back», every question can be left out. The answer is locked for the maker
   * alone (client.js sealFor); this device keeps a code to change it later (db.settings «mini-joined»).
   * poll: the survey read from the link (poll.js readPoll), id: the server id, end: until when answers go.
   */
  import { untrack } from 'svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { sendAnswer, MINI_ERRORS } from './client.js';
  import { readJoined, saveJoined } from './store.js';
  import { cleanPollAnswer, cleanName, answered, TEXT_MAX } from './poll.js';
  import { ChevronLeft, ChevronRight, Lock, Send } from '@lucide/svelte';

  let { poll, id, end } = $props();
  const p = untrack(() => poll);
  // step -1: the name (left out when anonymous); 0…n-1: the questions; n: check and send
  const first = p.anon ? 0 : -1;
  let step = $state(first);
  let name = $state('');
  let r = $state({});
  let mine = $state.raw(null);
  let sending = $state(false);
  let sent = $state('');
  let err = $state('');
  const n = p.qs.length;
  const q = $derived(step >= 0 && step < n ? p.qs[step] : null);
  const endFmt = (iso) => new Date(iso).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' });
  const done = $derived(p.qs.filter((x) => answered(x, r)).length);

  $effect(() => {
    untrack(async () => {
      try {
        const j = (await readJoined(db))[id];
        if (j) {
          mine = { aid: j.aid, del: j.del };
          name = j.name ?? '';
          r = { ...(j.r ?? {}) };
          sent = t('You already answered. You can change your answer and send it again.');
        }
      } catch {
        /* no storage in this browser: the answer can still be sent once */
      }
    });
  });

  function set(v) {
    r = { ...r, [q.id]: v };
  }
  function flip(i) {
    const now = Array.isArray(r[q.id]) ? r[q.id] : [];
    const next = now.includes(i) ? now.filter((x) => x !== i) : [...now, i].sort((x, y) => x - y);
    const copy = { ...r };
    if (next.length) copy[q.id] = next;
    else delete copy[q.id];
    r = copy;
  }
  function clear() {
    const copy = { ...r };
    delete copy[q.id];
    r = copy;
  }
  function next() {
    err = '';
    if (step === -1 && !cleanName(name)) return (err = t('Write your name first, so they know who answered.'));
    step = Math.min(n, step + 1);
  }
  const back = () => ((err = ''), (step = Math.max(first, step - 1)));

  async function send() {
    err = '';
    const answer = cleanPollAnswer({ name, r }, p);
    if (!Object.keys(answer.r).length) return (err = t('Answer at least one question.'));
    sending = true;
    try {
      const res = await sendAnswer(id, p.pk, answer, mine);
      mine = { aid: res.aid, del: res.del };
      try {
        await saveJoined(db, id, { aid: res.aid, del: res.del, ...answer, at: res.at });
      } catch {
        /* not kept here: the answer is sent all the same */
      }
      sent = t('Thank you, your answer is sent. You can change it until {day}.', { day: endFmt(end) });
    } catch (e) {
      err = t(MINI_ERRORS[e?.code] ?? MINI_ERRORS.server_error);
    } finally {
      sending = false;
    }
  }
  const SCALE = [1, 2, 3, 4, 5];
</script>

<header>
  <p class="kick">{p.by ? t('{name} asks', { name: p.by }) : t('Mini survey')}</p>
  <h1 data-page-title tabindex="-1">{p.title}</h1>
  {#if p.note}<p class="sub">{p.note}</p>{/if}
  <p class="sub">{t('{n} short questions. Answers are possible until {day}.', { n, day: endFmt(end) })}{p.anon ? ` ${t('Anonymous: your name is not asked.')}` : ''}</p>
</header>

<div class="card pa-box" data-pa data-pa-step={step}>
  {#if step >= 0 && step < n}
    <p class="pa-of" aria-live="polite">{t('Question {i} of {n}', { i: step + 1, n })}</p>
    <div class="pa-track" aria-hidden="true"><b style={`width:${((step + 1) / n) * 100}%`}></b></div>
  {/if}

  {#if step === -1}
    <label class="pa-fld"><span>{t('Your name')}</span><input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-pa-name /></label>
  {:else if q}
    <fieldset class="pa-q" data-pa-q={q.id}>
      <legend>{q.text}</legend>
      {#if q.type === 'one'}
        <div class="pa-opts" role="radiogroup" aria-label={q.text}>
          {#each q.opts as o, i (i)}<button type="button" role="radio" class="pa-opt" class:on={r[q.id] === i} aria-checked={r[q.id] === i} onclick={() => set(i)} data-pa-opt={i}>{o}</button>{/each}
        </div>
      {:else if q.type === 'many'}
        <p class="pa-help">{t('Several answers possible.')}</p>
        <div class="pa-opts" role="group" aria-label={q.text}>
          {#each q.opts as o, i (i)}{@const on = Array.isArray(r[q.id]) && r[q.id].includes(i)}<button type="button" class="pa-opt" class:on aria-pressed={on} onclick={() => flip(i)} data-pa-opt={i}>{o}</button>{/each}
        </div>
      {:else if q.type === 'yesno'}
        <div class="pa-row" role="radiogroup" aria-label={q.text}>
          <button type="button" role="radio" class="pa-opt" class:on={r[q.id] === 1} aria-checked={r[q.id] === 1} onclick={() => set(1)} data-pa-opt="1">{t('Yes')}</button>
          <button type="button" role="radio" class="pa-opt" class:on={r[q.id] === 0} aria-checked={r[q.id] === 0} onclick={() => set(0)} data-pa-opt="0">{t('No')}</button>
        </div>
      {:else if q.type === 'scale'}
        <div class="pa-scale" role="radiogroup" aria-label={q.text}>
          {#each SCALE as s (s)}<button type="button" role="radio" class="pa-opt" class:on={r[q.id] === s} aria-checked={r[q.id] === s} onclick={() => set(s)} data-pa-opt={s}>{s}</button>{/each}
        </div>
      {:else}
        <label class="pa-fld"><span class="sr">{q.text}</span><textarea rows="3" maxlength={TEXT_MAX} value={r[q.id] ?? ''} oninput={(e) => (e.currentTarget.value.trim() ? set(e.currentTarget.value) : clear())} data-pa-text></textarea></label>
      {/if}
      {#if answered(q, r)}<button type="button" class="btn btn-link sm" onclick={clear}>{t('Clear my answer')}</button>{:else}<p class="pa-help">{t('You can leave a question out.')}</p>{/if}
    </fieldset>
  {:else}
    <h2 class="pa-h">{t('Ready to send')}</h2>
    <p class="pa-help" data-pa-done>{t('{done} of {n} questions answered.', { done, n })}</p>
  {/if}

  {#if err}<p class="pa-err" role="alert" data-pa-err>{err}</p>{/if}
  <div class="pa-acts">
    {#if step > first}<button type="button" class="btn" onclick={back} data-pa-back><ChevronLeft size={18} aria-hidden="true" />{t('Back')}</button>{/if}
    {#if step < n}
      <button type="button" class="btn hi" onclick={next} data-pa-next>{t('Next|step')}<ChevronRight size={18} aria-hidden="true" /></button>
    {:else}
      <button type="button" class="btn hi" onclick={send} disabled={sending} data-pa-send><Send size={18} aria-hidden="true" />{mine ? t('Send the changed answer') : t('Send my answer')}</button>
    {/if}
  </div>
  {#if sent}<p class="pa-ok" role="status" data-pa-sent>{sent}</p>{/if}
</div>
<p class="pa-help"><Lock size={14} aria-hidden="true" /> {t('No app and no account needed. Only the person who asked can read your answer; the server cannot read it and deletes it by itself.')}</p>

<style>
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  h1 {
    margin: 0;
    text-wrap: balance;
  }
  .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
  }
  .pa-box {
    display: grid;
    gap: var(--sp-3);
  }
  .pa-of {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .pa-track {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pa-track b {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .pa-q {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .pa-q legend {
    padding: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
    text-wrap: balance;
  }
  .pa-h {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .pa-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .pa-fld > span {
    font-weight: 600;
  }
  .pa-fld input,
  .pa-fld textarea {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
    font: inherit;
  }
  .pa-opts {
    display: grid;
    gap: 6px;
  }
  .pa-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .pa-scale {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .pa-opt {
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    padding: 8px 12px;
    cursor: pointer;
  }
  .pa-row .pa-opt,
  .pa-scale .pa-opt {
    text-align: center;
  }
  .pa-opt.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
    font-weight: 700;
  }
  .pa-opt:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .pa-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pa-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .pa-ok {
    margin: 0;
    font-weight: 600;
  }
  .pa-acts {
    display: flex;
    gap: var(--sp-2);
    justify-content: flex-end;
    flex-wrap: wrap;
  }
</style>
