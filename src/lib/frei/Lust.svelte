<script>
  /**
   * Paket T «Freie Zeit» › Worauf hab ich Lust? (ideas 01, 02, 10 of Noah's file). Choose a mood, your
   * energy, what you feel like afterwards and the time you have: three ideas that fit. «Worked» tells
   * the app; next time with the same energy that idea comes first (your own good experience wins).
   * Every idea can be changed, hidden or deleted, own ones added. Below: the technique of the week,
   * a new one every week; own ones with a link (e.g. a video), all changeable.
   */
  import { Dices, ThumbsUp, Pencil, X, Plus, Link2, EyeOff, GraduationCap } from '@lucide/svelte';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { cfgQuery, changeCfg, restoreCfg, rowsQuery, putRow } from '../freidb.js';
  import { MOODS, ENERGY, AFTER, TIMES, lustIdeasOf, lustPick, techniquesOf, techOfWeek, uid } from '../frei.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const logQ = rowsQuery('log');
  const log = $derived($logQ ?? []);
  const ideas = $derived(lustIdeasOf(cfg));
  // svelte-ignore state_referenced_locally
  let mood = $state(null);
  let energy = $state(null);
  let after = $state(null);
  let time = $state(null);
  const picks = $derived(lustPick(ideas, { mood, energy, after, time }, log));
  const chosen = $derived(!!(mood || energy || after || time));
  const name = (i) => (i.own || i.edited ? i.name : t(i.name));
  const whyWords = { mood: 'fits your mood', energy: 'fits your energy', after: 'fits what you want afterwards', worked: 'worked for you before' };

  async function worked(i) {
    await putRow({ kind: 'log', what: i.id, day: today, ok: true, energy, mood });
    offerDone(t('Noted: «{name}» worked. It comes first next time.', { name: name(i) }));
  }

  /* ---------- ideas: add, change, hide, delete ---------- */
  let manage = $state(false);
  let edit = $state(null);
  const blank = () => ({ id: null, std: false, name: '', mood: mood ? [mood] : [], energy: energy ? [energy] : [], after: after ? [after] : [], min: time ?? 30 });
  const openEdit = (i) => (edit = { id: i.id, std: !i.own, name: name(i), mood: [...(i.mood ?? [])], energy: [...(i.energy ?? [])], after: [...(i.after ?? [])], min: i.min ?? 30 });
  const toggle = (key, v) => (edit[key] = edit[key].includes(v) ? edit[key].filter((x) => x !== v) : [...edit[key], v]);
  async function saveIdea() {
    const n = edit.name.trim();
    if (!n) return t('Please give it a name.');
    const rec = { name: n, mood: edit.mood, energy: edit.energy, after: edit.after, min: Math.max(5, Number(edit.min) || 30) };
    if (!edit.id) await changeCfg((c) => ({ ...c, lustOwn: [...(c.lustOwn ?? []), { id: uid('idea'), ...rec }] }));
    else if (edit.std) await changeCfg((c) => ({ ...c, lustEdits: { ...(c.lustEdits ?? {}), [edit.id]: rec } }));
    else await changeCfg((c) => ({ ...c, lustOwn: (c.lustOwn ?? []).map((x) => (x.id === edit.id ? { ...x, ...rec } : x)) }));
  }
  async function removeIdea(i) {
    const label = name(i);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: label }), text: i.own ? '' : t('A built-in idea is hidden; «Reset the ideas» brings it back.') });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => (i.own ? { ...c, lustOwn: (c.lustOwn ?? []).filter((x) => x.id !== i.id) } : { ...c, lustHidden: [...(c.lustHidden ?? []), i.id] }))),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name: label }),
      name: label,
    });
  }
  async function resetIdeas() {
    const before = await changeCfg((c) => ({ ...c, lustHidden: [], lustEdits: {} }));
    offerDone(t('The built-in ideas are back as they were.'), () => restoreCfg(before));
  }

  /* ---------- technique of the week ---------- */
  const techs = $derived(techniquesOf(cfg));
  const tech = $derived(techOfWeek(techs, today));
  let techEdit = $state(null);
  const tName = (x) => (x.own || x.edited ? x.name : t(x.name));
  const tText = (x) => (x.own || x.edited ? x.text : t(x.text));
  const tSport = (x) => (x.own || x.edited ? x.sport : t(x.sport));
  const openTech = (x) => (techEdit = x ? { id: x.id, std: !x.own, name: tName(x), text: tText(x), sport: tSport(x), link: x.link ?? '' } : { id: null, std: false, name: '', text: '', sport: '', link: '' });
  async function saveTech() {
    const n = techEdit.name.trim();
    if (!n) return t('Please give it a name.');
    const rec = { name: n, text: techEdit.text.trim(), sport: techEdit.sport.trim(), link: techEdit.link.trim() };
    if (!techEdit.id) await changeCfg((c) => ({ ...c, techOwn: [...(c.techOwn ?? []), { id: uid('tech'), ...rec }] }));
    else if (techEdit.std) await changeCfg((c) => ({ ...c, techEdits: { ...(c.techEdits ?? {}), [techEdit.id]: rec } }));
    else await changeCfg((c) => ({ ...c, techOwn: (c.techOwn ?? []).map((x) => (x.id === techEdit.id ? { ...x, ...rec } : x)) }));
  }
  async function removeTech() {
    const x = techEdit;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: x.name }) });
    if (answer !== 'delete') return false;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => (x.std ? { ...c, techHidden: [...(c.techHidden ?? []), x.id] } : { ...c, techOwn: (c.techOwn ?? []).filter((y) => y.id !== x.id) }))),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name: x.name }),
      name: x.name,
    });
  }
</script>

{#snippet chips(list, value, set, label, fmt = (x) => t(x.name))}
  <div class="fz-lab"><span>{label}</span>
    <div class="fz-chips" role="group" aria-label={label}>
      {#each list as x (x.key ?? x)}
        {@const k = x.key ?? x}
        <button type="button" class="fz-chip" aria-pressed={value === k} onclick={() => set(value === k ? null : k)} data-choice={k}>{fmt(x)}</button>
      {/each}
    </div>
  </div>
{/snippet}

<div class="fz" data-page="lust">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('What am I up for?')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('What am I up for?')}</h1>
  <p class="fz-intro">{t('Tap what fits right now. Nothing is a must: one choice is enough, all four make it precise.')}</p>

  <section class="fz-box" aria-label={t('Your choice')}>
    {@render chips(MOODS, mood, (v) => (mood = v), t('I feel like'))}
    {@render chips(ENERGY, energy, (v) => (energy = v), t('My energy'))}
    {@render chips(AFTER, after, (v) => (after = v), t('Afterwards I want'))}
    {@render chips(TIMES, time, (v) => (time = v), t('Time I have'), (m) => (m >= 60 ? tn(m / 60, '{n} hour', '{n} hours') : t('{n} min', { n: m })))}
  </section>

  <section class="fz-form" aria-labelledby="fzl-h">
    <h2 id="fzl-h" class="fz-h2"><Dices size={18} aria-hidden="true" /> {chosen ? t('This could fit') : t('A few ideas to start')}</h2>
    {#if !picks.length}<p class="fz-empty">{t('No idea left. Add your own below.')}</p>{/if}
    <div class="fz-grid three">
      {#each picks as p, n (p.idea.id)}
        <article class="fz-box" class:fz-soft={n === 0 && chosen} data-pick={p.idea.id}>
          <h3 class="fzl-t">{name(p.idea)}</h3>
          <p class="fz-note">{t('{n} min', { n: p.idea.min })}{#each p.why as w (w)} · {t(whyWords[w])}{/each}</p>
          <div class="fz-acts"><button type="button" class="btn sm" onclick={() => worked(p.idea)} data-worked><ThumbsUp size={16} aria-hidden="true" />{t('Did it, it worked')}</button></div>
        </article>
      {/each}
    </div>
    <div class="fz-acts">
      <button type="button" class="btn" onclick={() => (edit = blank())} data-new-idea><Plus size={16} aria-hidden="true" />{t('Your own idea')}</button>
      <button type="button" class="btn" aria-expanded={manage} onclick={() => (manage = !manage)} data-manage-ideas><Pencil size={16} aria-hidden="true" />{t('All ideas ({n})', { n: ideas.length })}</button>
    </div>
    {#if manage}
      <ul class="fz-box fz-list" data-ideas>
        {#each ideas as i (i.id)}
          <li class="fz-row">
            <button type="button" class="fz-row-main" onclick={() => openEdit(i)}><b>{name(i)}</b><small>{[...i.mood.map((k) => t(MOODS.find((x) => x.key === k)?.name ?? k)), t('{n} min', { n: i.min })].join(' · ')}</small></button>
            <button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: name(i) })} onclick={() => removeIdea(i)} data-idea-del>{#if i.own}<X size={18} aria-hidden="true" />{:else}<EyeOff size={18} aria-hidden="true" />{/if}</button>
          </li>
        {/each}
        <li class="fz-row"><button type="button" class="btn sm" onclick={resetIdeas}>{t('Reset the ideas')}</button></li>
      </ul>
    {/if}
  </section>

  <section class="fz-box" aria-labelledby="fzl-tech-h" data-technique>
    <h2 id="fzl-tech-h" class="fz-h2"><GraduationCap size={18} aria-hidden="true" /> {t('Technique of the week')}</h2>
    {#if tech}
      <span class="fz-kick">{tSport(tech)}</span>
      <p class="fz-big">{tName(tech)}</p>
      <p class="fz-text">{tText(tech)}</p>
      <div class="fz-acts">
        {#if tech.link}<a class="btn sm" href={tech.link} target="_blank" rel="noopener"><Link2 size={16} aria-hidden="true" />{t('Open the link')}</a>{/if}
        <button type="button" class="btn sm" onclick={() => openTech(tech)}><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
      </div>
    {:else}
      <p class="fz-empty">{t('No technique left. Add your own.')}</p>
    {/if}
    <details class="fzl-more">
      <summary>{tn(techs.length, '{n} technique in the rotation', '{n} techniques in the rotation')}</summary>
      <ul class="fz-list">
        {#each techs as x (x.id)}<li class="fz-row"><button type="button" class="fz-row-main" onclick={() => openTech(x)}><b>{tName(x)}</b><small>{tSport(x)}</small></button></li>{/each}
      </ul>
    </details>
    <div class="fz-acts"><button type="button" class="btn sm" onclick={() => openTech(null)} data-new-tech><Plus size={16} aria-hidden="true" />{t('Your own technique')}</button></div>
  </section>
</div>

{#if edit}
  <FreiSheet title={edit.id ? t('Change idea') : t('Your own idea')} onsave={saveIdea} onclose={() => (edit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="80" bind:value={edit.name} data-idea-name /></label>
    {#each [['mood', MOODS, 'I feel like'], ['energy', ENERGY, 'My energy'], ['after', AFTER, 'Afterwards I want']] as [key, list, label] (key)}
      <div class="fz-lab"><span>{t(label)}</span>
        <div class="fz-chips">{#each list as x (x.key)}<button type="button" class="fz-chip" aria-pressed={edit[key].includes(x.key)} onclick={() => toggle(key, x.key)}>{t(x.name)}</button>{/each}</div>
      </div>
    {/each}
    <label class="fz-lab">{t('Minutes')}<input class="inp fzl-min" type="number" min="5" max="600" step="5" bind:value={edit.min} /></label>
  </FreiSheet>
{/if}
{#if techEdit}
  <FreiSheet title={techEdit.id ? t('Change technique') : t('Your own technique')} onsave={saveTech} ondelete={techEdit.id ? removeTech : null} onclose={() => (techEdit = null)}>
    <label class="fz-lab">{t('Name')}<input class="inp" maxlength="80" bind:value={techEdit.name} data-tech-name /></label>
    <label class="fz-lab">{t('Sport')}<input class="inp" maxlength="40" bind:value={techEdit.sport} /></label>
    <label class="fz-lab">{t('What to do')}<textarea class="inp" rows="3" maxlength="600" bind:value={techEdit.text}></textarea></label>
    <label class="fz-lab">{t('Link (e.g. a video)')}<input class="inp" type="url" maxlength="600" bind:value={techEdit.link} /></label>
  </FreiSheet>
{/if}

<style>
  .fzl-t {
    margin: 0;
    font: 700 var(--fs-body)/1.3 var(--font-body);
  }
  .fzl-min {
    max-width: 140px;
  }
  .fzl-more summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
