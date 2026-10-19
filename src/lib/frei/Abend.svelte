<script>
  /**
   * Paket T «Freie Zeit» › Mein Abend (ideas 11, 13, 15). Up to three evening rituals (more would be
   * stress again): tick them tonight, see evenings in a row, sort with arrows or drag, change or delete.
   * Your evening music as a link. Short texts to arrive: read them, or let the device read them out
   * (the browser's own voice, free, nothing leaves the device), stop any time. A question for your way:
   * by theme, «Another question», own ones. Everything changeable, nothing a must.
   */
  import { Moon, Check, Plus, X, Pencil, Music, Volume2, Square, Shuffle, Footprints } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { cfgQuery, changeCfg, restoreCfg } from '../freidb.js';
  import { ritualsOf, tickRitual, eveningsInRow, MAX_RITUALS, RITUAL_IDEAS, ARRIVE, QUESTION_GROUPS, questionsOf, nextOf, dayNo, uid } from '../frei.js';
  import { localDay } from '../localday.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, lang } from '../i18n.svelte.js';

  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const rituals = $derived(ritualsOf(cfg));
  const ticks = $derived(cfg.ticks ?? {});
  const row = $derived(eveningsInRow(rituals, ticks, today));
  const rName = (r) => (r.std ? t(r.name) : r.name);
  const offer = $derived(RITUAL_IDEAS.filter((x) => !rituals.some((r) => r.std && r.name === x)));

  const tick = (r) => changeCfg((c) => ({ ...c, ticks: tickRitual(c.ticks ?? {}, r.id, today) }));
  const isTicked = (r) => (ticks[r.id] ?? []).includes(today);
  async function addRitual(name, std = false) {
    if (rituals.length >= MAX_RITUALS) return offerDone(t('Three is the limit. Delete one first; more would be stress again.'));
    await changeCfg((c) => ({ ...c, rituals: [...ritualsOf(c), { id: uid('rit'), name, std }] }));
  }
  let own = $state('');
  async function addOwn(e) {
    e.preventDefault();
    const n = own.trim();
    if (!n) return;
    await addRitual(n);
    own = '';
  }
  let edit = $state(null);
  async function saveRitual() {
    const n = edit.name.trim();
    if (!n) return t('Please give it a name.');
    await changeCfg((c) => ({ ...c, rituals: ritualsOf(c).map((r) => (r.id === edit.id ? { ...r, name: n, std: false } : r)) }));
  }
  async function removeRitual() {
    const r = edit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: r.name }) });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({ run: async () => (before = await changeCfg((c) => ({ ...c, rituals: ritualsOf(c).filter((x) => x.id !== r.id) }))), undo: () => restoreCfg(before), text: t('"{name}" deleted.', { name: r.name }), name: r.name });
  }
  const ids = () => rituals.map((r) => r.id);
  function reorder(id, to) {
    const list = [...rituals];
    const [r] = list.splice(list.findIndex((x) => x.id === id), 1);
    list.splice(to, 0, r);
    return changeCfg((c) => ({ ...c, rituals: list }));
  }
  const onmove = (from, to) => reorder(ids()[from], to);
  const step = (id, dir) => {
    const i = ids().indexOf(id);
    const to = Math.min(Math.max(i + dir, 0), ids().length - 1);
    return to === i ? null : reorder(id, to);
  };

  /* ---------- music ---------- */
  const music = $derived(cfg.music ?? null);
  let musicEdit = $state(null);
  async function saveMusic() {
    const url = musicEdit.url.trim();
    await changeCfg((c) => ({ ...c, music: url ? { name: musicEdit.name.trim(), url } : null }));
  }

  /* ---------- arrive: read or listen ---------- */
  const arrive = $derived([...ARRIVE.filter((a) => !(cfg.arriveHidden ?? []).includes(a.id)).map((a) => ({ ...a, std: true })), ...(cfg.arriveOwn ?? []).map((a) => ({ ...a, std: false }))]);
  let open = $state(null);
  let speaking = $state(false);
  const aName = (a) => (a.std ? t(a.name) : a.name);
  const aText = (a) => (a.std ? t(a.text) : a.text);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  function speak(a) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(aText(a));
    u.lang = lang.v === 'de' ? 'de-CH' : 'en-GB';
    u.rate = 0.85;
    u.onend = () => (speaking = false);
    u.onerror = () => (speaking = false);
    speaking = true;
    window.speechSynthesis.speak(u);
  }
  function stop() {
    if (canSpeak) window.speechSynthesis.cancel();
    speaking = false;
  }
  $effect(() => () => canSpeak && window.speechSynthesis.cancel());
  let arriveEdit = $state(null);
  async function saveArrive() {
    const n = arriveEdit.name.trim();
    const tx = arriveEdit.text.trim();
    if (!n || !tx) return t('Please give it a name and a text.');
    if (arriveEdit.id) await changeCfg((c) => ({ ...c, arriveOwn: (c.arriveOwn ?? []).map((a) => (a.id === arriveEdit.id ? { ...a, name: n, text: tx } : a)) }));
    else await changeCfg((c) => ({ ...c, arriveOwn: [...(c.arriveOwn ?? []), { id: uid('arr'), name: n, text: tx }] }));
  }
  async function removeArrive(a) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: aName(a) }) });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => (a.std ? { ...c, arriveHidden: [...(c.arriveHidden ?? []), a.id] } : { ...c, arriveOwn: (c.arriveOwn ?? []).filter((x) => x.id !== a.id) }))),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name: aName(a) }),
      name: aName(a),
    });
    if (open === a.id) open = null;
  }

  /* ---------- a question for your way ---------- */
  const questions = $derived(questionsOf(cfg));
  let group = $state('');
  const inGroup = $derived(questions.filter((x) => !group || x.group === group));
  let qPick = $state(null);
  const question = $derived(inGroup.find((x) => x.id === qPick) ?? inGroup[dayNo(today) % Math.max(inGroup.length, 1)] ?? null);
  const qText = (x) => (x.own || x.edited ? x.text : t(x.text));
  let qEdit = $state(null);
  async function saveQuestion() {
    const tx = qEdit.text.trim();
    if (!tx) return t('Please write the question.');
    if (!qEdit.id) {
      const id = uid('q');
      await changeCfg((c) => ({ ...c, qOwn: [...(c.qOwn ?? []), { id, text: tx, group: qEdit.group }] }));
      qPick = id;
    } else if (qEdit.std) await changeCfg((c) => ({ ...c, qEdits: { ...(c.qEdits ?? {}), [qEdit.id]: { text: tx, group: qEdit.group } } }));
    else await changeCfg((c) => ({ ...c, qOwn: (c.qOwn ?? []).map((x) => (x.id === qEdit.id ? { ...x, text: tx, group: qEdit.group } : x)) }));
  }
  async function removeQuestion() {
    const x = qEdit;
    const answer = await askDelete({ title: t('Delete this question?'), lines: [x.text] });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => (x.std ? { ...c, qHidden: [...(c.qHidden ?? []), x.id] } : { ...c, qOwn: (c.qOwn ?? []).filter((y) => y.id !== x.id) }))),
      undo: () => restoreCfg(before),
      text: t('Question deleted.'),
      name: x.text,
    });
    qPick = null;
  }
</script>

<div class="fz" data-page="abend">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('My evening')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('My evening')}</h1>
  <p class="fz-intro">{t('How do you want to notice the day is over? Three small rituals, your music, a moment to arrive.')}</p>

  <section class="fz-box" aria-labelledby="fza-rit-h" data-rituals>
    <h2 id="fza-rit-h" class="fz-h2"><Moon size={18} aria-hidden="true" /> {t('My rituals')}</h2>
    <p class="fz-note">{tn(rituals.length, '{n} of 3 rituals', '{n} of 3 rituals')}{#if row} · {tn(row, '{n} evening in a row', '{n} evenings in a row')}{/if}</p>
    {#if !rituals.length}<p class="fz-empty">{t('No ritual yet. Pick one below or write your own.')}</p>{/if}
    <ul class="fz-list" use:sortable={{ onmove }}>
      {#each rituals as r, n (r.id)}
        <li class="fz-row" data-sort-id={r.id} data-ritual={r.id}>
          <SortGrip name={rName(r)} onstep={(dir) => step(r.id, dir)} />
          <button type="button" class="fz-row-main fza-tick" aria-pressed={isTicked(r)} onclick={() => tick(r)} data-ritual-tick>
            <b>{#if isTicked(r)}<Check size={16} aria-hidden="true" class="fz-done" /> {/if}{rName(r)}</b>
            <small>{isTicked(r) ? t('done tonight') : t('tap when done')}</small>
          </button>
          {#if !phone.matches}<SortArrows name={rName(r)} i={n} n={rituals.length} onstep={(dir) => step(r.id, dir)} />{/if}
          <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: rName(r) })} onclick={() => (edit = { id: r.id, name: rName(r) })}><Pencil size={18} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
    {#if rituals.length < MAX_RITUALS}
      <div class="fz-chips">{#each offer as x (x)}<button type="button" class="fz-chip" onclick={() => addRitual(x, true)} data-ritual-add={x}><Plus size={14} aria-hidden="true" /> {t(x)}</button>{/each}</div>
      <form class="fz-inline" onsubmit={addOwn}>
        <input class="inp" maxlength="60" bind:value={own} aria-label={t('Your own ritual')} placeholder={t('Your own ritual')} />
        <button type="submit" class="btn sm">{t('Add')}</button>
      </form>
    {/if}
  </section>

  <section class="fz-box" aria-labelledby="fza-mus-h">
    <h2 id="fza-mus-h" class="fz-h2"><Music size={18} aria-hidden="true" /> {t('My evening music')}</h2>
    {#if music}
      <div class="fz-acts">
        <a class="btn hi" href={music.url} target="_blank" rel="noopener" data-music>{music.name || t('Play')}</a>
        <button type="button" class="btn sm" onclick={() => (musicEdit = { name: music.name ?? '', url: music.url })}><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
      </div>
    {:else}
      <p class="fz-note">{t('A playlist or a song as a link, e.g. from Spotify or YouTube.')}</p>
      <div class="fz-acts"><button type="button" class="btn sm" onclick={() => (musicEdit = { name: '', url: '' })} data-music-add><Plus size={16} aria-hidden="true" />{t('Add music')}</button></div>
    {/if}
  </section>

  <section class="fz-box" aria-labelledby="fza-arr-h" data-arrive>
    <h2 id="fza-arr-h" class="fz-h2">{t('To arrive')}</h2>
    <p class="fz-note">{canSpeak ? t('Read it, or let your device read it out. Stop any time.') : t('Read it slowly. Stop any time.')}</p>
    <ul class="fz-list">
      {#each arrive as a (a.id)}
        <li>
          <div class="fz-row">
            <button type="button" class="fz-row-main" aria-expanded={open === a.id} onclick={() => (open = open === a.id ? null : a.id)} data-arrive-open={a.id}><b>{aName(a)}</b></button>
            {#if !a.std}<button type="button" class="fz-icon" aria-label={t('Change {name}', { name: aName(a) })} onclick={() => (arriveEdit = { id: a.id, name: a.name, text: a.text })}><Pencil size={18} aria-hidden="true" /></button>{/if}
            <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: aName(a) })} onclick={() => removeArrive(a)}><X size={18} aria-hidden="true" /></button>
          </div>
          {#if open === a.id}
            <p class="fz-text fza-read" data-arrive-text>{aText(a)}</p>
            {#if canSpeak}
              <div class="fz-acts fza-pad">
                {#if speaking}<button type="button" class="btn sm" onclick={stop} data-stop><Square size={16} aria-hidden="true" />{t('Stop')}</button>
                {:else}<button type="button" class="btn sm" onclick={() => speak(a)} data-speak><Volume2 size={16} aria-hidden="true" />{t('Read it to me')}</button>{/if}
              </div>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
    <div class="fz-acts"><button type="button" class="btn sm" onclick={() => (arriveEdit = { id: null, name: '', text: '' })}><Plus size={16} aria-hidden="true" />{t('Your own text')}</button></div>
  </section>

  <section class="fz-box" aria-labelledby="fza-q-h" data-way-question>
    <h2 id="fza-q-h" class="fz-h2"><Footprints size={18} aria-hidden="true" /> {t('A question for your way')}</h2>
    <div class="fz-chips" role="group" aria-label={t('Theme')}>
      <button type="button" class="fz-chip" aria-pressed={!group} onclick={() => ((group = ''), (qPick = null))}>{t('All')}</button>
      {#each QUESTION_GROUPS as g (g.key)}<button type="button" class="fz-chip" aria-pressed={group === g.key} onclick={() => ((group = g.key), (qPick = null))}>{t(g.name)}</button>{/each}
    </div>
    {#if question}
      <p class="fz-big" data-question>{qText(question)}</p>
      <p class="fz-note">{t('No answer needed. Whatever turns up on the way may stay.')}</p>
      <div class="fz-acts">
        <button type="button" class="btn sm" onclick={() => (qPick = nextOf(inGroup, question.id)?.id ?? null)} data-next-question><Shuffle size={16} aria-hidden="true" />{t('Another question')}</button>
        <button type="button" class="btn sm" onclick={() => (qEdit = { id: question.id, std: !question.own, text: qText(question), group: question.group })}><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
      </div>
    {:else}
      <p class="fz-empty">{t('No question in this theme. Write your own.')}</p>
    {/if}
    <div class="fz-acts"><button type="button" class="btn sm" onclick={() => (qEdit = { id: null, std: false, text: '', group: group || 'connect' })} data-new-question><Plus size={16} aria-hidden="true" />{t('Your own question')}</button></div>
  </section>
</div>

{#if edit}
  <FreiSheet title={t('Change ritual')} onsave={saveRitual} ondelete={removeRitual} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="60" bind:value={edit.name} /></label>
  </FreiSheet>
{/if}
{#if musicEdit}
  <FreiSheet title={t('My evening music')} onsave={saveMusic} onclose={() => (musicEdit = null)}>
    <label class="fz-lab">{t('Name (optional)')}<input class="inp" maxlength="60" bind:value={musicEdit.name} placeholder={t('e.g. Slow evening')} /></label>
    <label class="fz-lab">{t('Link')}<input class="inp" type="url" maxlength="600" bind:value={musicEdit.url} data-music-url /></label>
    <p class="fz-note">{t('An empty link removes the music.')}</p>
  </FreiSheet>
{/if}
{#if arriveEdit}
  <FreiSheet title={arriveEdit.id ? t('Change text') : t('Your own text')} onsave={saveArrive} onclose={() => (arriveEdit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="60" bind:value={arriveEdit.name} /></label>
    <label class="fz-lab">{t('Text')}<textarea class="inp" rows="6" maxlength="2000" bind:value={arriveEdit.text}></textarea></label>
  </FreiSheet>
{/if}
{#if qEdit}
  <FreiSheet title={qEdit.id ? t('Change question') : t('Your own question')} onsave={saveQuestion} ondelete={qEdit.id ? removeQuestion : null} onclose={() => (qEdit = null)}>
    <label class="fz-lab">{t('Question')}<input class="inp" maxlength="200" bind:value={qEdit.text} data-question-text /></label>
    <label class="fz-lab">{t('Theme')}
      <select class="inp" bind:value={qEdit.group}>{#each QUESTION_GROUPS as g (g.key)}<option value={g.key}>{t(g.name)}</option>{/each}</select>
    </label>
  </FreiSheet>
{/if}

<style>
  .fza-tick[aria-pressed='true'] b {
    color: var(--ink-2);
  }
  .fza-read {
    padding: 4px 0 8px;
  }
  .fza-pad {
    padding-bottom: 10px;
  }
</style>
