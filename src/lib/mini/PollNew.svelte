<script>
  /**
   * Mini-Tools «Mini-Umfrage» (Noah 28.10.2026, idea 2): make a short survey (#/me/mini/umfrage).
   * Start from a ready set of questions or empty, change everything, sort with arrows and drag,
   * then «Make the link». The survey is sealed into the link like «Find a date» (lib/mini/client.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { ME_KEY } from '../freunde/freunde.js';
  import { createQuestion, MINI_ERRORS } from './client.js';
  import { readMine, saveMine } from './store.js';
  import { KIND_POLL, QS_MAX, OPTS_MAX, TYPES, TEMPLATES, pollQuestion } from './poll.js';
  import { Share2, Plus, X, Lock } from '@lucide/svelte';

  const DAYS_OPEN = [7, 14, 30, 60];
  let uid = 0;
  const fresh = (q) => ({ uid: ++uid, type: q.type, text: q.text ? t(q.text) : '', opts: (q.opts ?? ['', '']).map((o) => (o ? t(o) : '')) });

  let tpl = $state('');
  let title = $state('');
  let note = $state('');
  let by = $state('');
  let anon = $state(false);
  let days = $state(14);
  let qs = $state([]);
  let formErr = $state('');
  let making = $state(false);

  const meQ = liveQuery(() => db.settings.get(ME_KEY));
  let bySeen = false;
  $effect(() => {
    if (!bySeen && $meQ !== undefined) {
      by = typeof $meQ?.value === 'string' ? $meQ.value : '';
      bySeen = true;
    }
  });

  function useTemplate(x) {
    tpl = x.key;
    title = x.title ? t(x.title) : '';
    qs = x.qs.map(fresh);
    formErr = '';
  }
  function addQ() {
    if (qs.length >= QS_MAX) return (formErr = t('At most {n} questions.', { n: QS_MAX }));
    qs = [...qs, fresh({ type: 'one' })];
  }
  function move(from, to) {
    if (to < 0 || to >= qs.length || from === to) return;
    const next = [...qs];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    qs = next;
  }
  const hasOpts = (type) => TYPES.find((x) => x.key === type)?.opts;
  const label = (q, i) => q.text || t('Question {n}', { n: i + 1 });

  async function make(e) {
    e?.preventDefault?.();
    formErr = '';
    if (!title.trim()) return (formErr = t('Write a title first, so people know what it is about.'));
    const poll = pollQuestion({ title, note, by, anon, qs });
    if (!poll) return (formErr = t('Write at least one question. A choice needs two answers to pick from.'));
    making = true;
    try {
      const srv = await createQuestion(poll, { days });
      const rec = { id: `mt-${Date.now().toString(36)}`, kind: KIND_POLL, title: poll.title, note: poll.note, by: poll.by, anon: poll.anon, qs: poll.qs, made: new Date().toISOString(), srv, answers: [], read: null, closed: false };
      await saveMine(db, [rec, ...(await readMine(db))]);
      location.hash = `#/me/mini/${encodeURIComponent(rec.id)}`;
    } catch (err) {
      formErr = t(MINI_ERRORS[err?.code] ?? MINI_ERRORS.server_error);
    } finally {
      making = false;
    }
  }
</script>

<VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Mini tools'), href: '#/me/mini' }]} title={t('Mini survey')} sub={t('A few short questions, shared by link; the app counts the answers')} />
<form class="ich-main pn-form" onsubmit={make} data-pn>
  <section class="card pn-box" aria-labelledby="pn-tpl-h">
    <h2 id="pn-tpl-h">{t('Start from')}</h2>
    <div class="pn-tpls" role="group" aria-label={t('Start from')}>
      {#each TEMPLATES as x (x.key)}
        <button type="button" class="pn-tpl" class:on={tpl === x.key} aria-pressed={tpl === x.key} onclick={() => useTemplate(x)} data-pn-tpl={x.key}>{x.title ? t(x.title) : t('Empty')}</button>
      {/each}
    </div>
    <p class="pn-help">{t('Everything stays changeable: questions, answers, order.')}</p>
  </section>

  <section class="card pn-box">
    <label class="pn-fld"><span>{t('Title')}</span><input type="text" bind:value={title} maxlength="80" placeholder={t('e.g. Autumn trip')} data-pn-title /></label>
    <label class="pn-fld"><span>{t('A note for the others (optional)')}</span><input type="text" bind:value={note} maxlength="200" data-pn-note /></label>
    <label class="pn-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={by} maxlength="40" autocomplete="given-name" data-pn-by /></label>
    <label class="pn-check"><input type="checkbox" bind:checked={anon} data-pn-anon /><span>{t('Anonymous: people answer without their name')}</span></label>
  </section>

  <section class="card pn-box" aria-labelledby="pn-qs-h">
    <div class="pn-h"><h2 id="pn-qs-h">{t('Questions')}</h2><span class="pn-help">{t('{n} of at most {max}', { n: qs.length, max: QS_MAX })}</span></div>
    {#if !qs.length}<p class="pn-help" data-pn-noq>{t('Pick a start above or add a question.')}</p>{/if}
    <ol class="pn-qs" use:sortable={{ onmove: move }} data-pn-qs>
      {#each qs as q, i (q.uid)}
        <li class="pn-q" data-pn-q={i}>
          <div class="pn-qh">
            <SortGrip name={label(q, i)} onstep={(dir) => move(i, i + dir)} />
            <b class="pn-n">{i + 1}</b>
            <label class="pn-type"><span class="sr">{t('Kind of question')}</span>
              <select bind:value={q.type} data-pn-type>
                {#each TYPES as x (x.key)}<option value={x.key}>{t(x.label)}</option>{/each}
              </select>
            </label>
            <SortArrows name={label(q, i)} {i} n={qs.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="pn-x" aria-label={t('Remove {name}', { name: label(q, i) })} onclick={() => (qs = qs.filter((x) => x.uid !== q.uid))} data-pn-del><X size={16} aria-hidden="true" /></button>
          </div>
          <label class="pn-fld"><span class="sr">{t('Question {n}', { n: i + 1 })}</span><input type="text" bind:value={q.text} maxlength="140" placeholder={t('Your question')} data-pn-text /></label>
          {#if hasOpts(q.type)}
            <ul class="pn-opts">
              {#each q.opts as _, j (j)}
                <li>
                  <input type="text" bind:value={q.opts[j]} maxlength="60" placeholder={t('Answer {n}', { n: j + 1 })} aria-label={t('Answer {n}', { n: j + 1 })} data-pn-opt={j} />
                  {#if q.opts.length > 2}<button type="button" class="pn-x" aria-label={t('Remove answer {n}', { n: j + 1 })} onclick={() => (q.opts = q.opts.filter((__, k) => k !== j))}><X size={16} aria-hidden="true" /></button>{/if}
                </li>
              {/each}
            </ul>
            {#if q.opts.length < OPTS_MAX}<div><button type="button" class="btn sm" onclick={() => (q.opts = [...q.opts, ''])} data-pn-addopt><Plus size={16} aria-hidden="true" />{t('Add an answer')}</button></div>{/if}
          {:else if q.type === 'scale'}
            <p class="pn-help">{t('People pick 1 to 5. Say in the question what 1 and 5 mean.')}</p>
          {/if}
        </li>
      {/each}
    </ol>
    <div><button type="button" class="btn" onclick={addQ} data-pn-add><Plus size={16} aria-hidden="true" />{t('Add a question')}</button></div>
  </section>

  <section class="card pn-box">
    <label class="pn-fld"><span>{t('Answers possible for')}</span>
      <select bind:value={days} data-pn-days>
        {#each DAYS_OPEN as n (n)}<option value={n}>{t('{n} days', { n })}</option>{/each}
      </select>
    </label>
    <p class="pn-help"><Lock size={14} aria-hidden="true" /> {t('Only you can read the answers. They are locked on the other person’s device; the server cannot read them and deletes them after these days.')}</p>
  </section>
  {#if formErr}<p class="pn-err" role="alert" data-pn-err>{formErr}</p>{/if}
  <div class="pn-acts"><button type="submit" class="btn hi" disabled={making} data-pn-make><Share2 size={18} aria-hidden="true" />{t('Make the link')}</button><a class="btn btn-link" href="#/me/mini">{t('Cancel')}</a></div>
</form>

<style>
  .pn-form {
    display: grid;
    gap: var(--sp-3);
  }
  .pn-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .pn-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .pn-h {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }
  .pn-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pn-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .pn-fld > span {
    font-weight: 600;
  }
  .pn-fld input,
  .pn-fld select,
  .pn-opts input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .pn-check {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    min-height: 44px;
  }
  .pn-check input {
    width: 20px;
    height: 20px;
  }
  .pn-tpls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .pn-tpl {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .pn-tpl.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .pn-qs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-3);
  }
  .pn-q {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .pn-qh {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .pn-n {
    flex: none;
    width: 24px;
    text-align: center;
  }
  .pn-type {
    flex: 1;
    min-width: 0;
  }
  .pn-type select {
    width: 100%;
    min-height: 44px;
  }
  .pn-opts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .pn-opts li {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
  .pn-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-2);
    cursor: pointer;
  }
  .pn-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .pn-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
