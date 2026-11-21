<script>
  /**
   * «Velo-Inspektion» (Noah 19.10.2026 «1a 2a 3a 4a 5a»): one inspection running, point by point.
   * The points of the level (5a: quick ⊂ monthly ⊂ full) that fit the bike, grouped by area. Each point:
   * OK / Watch / Fix myself / Bike shop, a value where it is measured (with the limit as a colour), a note,
   * photos (4a), and «So geht's» (2a). Every change is saved at once as a draft: «Später weitermachen»
   * just leaves; «Fertig» writes the part history and the problems (inspectdb.js) and offers Undo.
   * bike: as stored; level; list: the person's checklist; onfinished(): back to the overview.
   */
  import { Check, BookOpen, Camera, X, ChevronDown, ChevronLeft, ChevronRight, ListOrdered, Store, Wrench, Eye, Lightbulb } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import DrawOn from '../draw/DrawOn.svelte'; // Paket NE 1146: draw on a point's photo
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { bikesHash } from '../bikes.js';
  import { ensureParts, partOnBike, fits, PART } from '../care.js';
  import { bikePartOn } from '../bikekind.js';
  import { kindOf } from '../bikekind.js';
  import { shrinkImage } from '../photo.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { LEVEL, WHO } from './items.js';
  import { checklist, progress, setResult, readValue, valueState, wearTrend, STATES, bikeSettings } from './inspect.js';
  import { draftFor, saveDraft, finishInspection, undoFinish } from './inspectdb.js';
  import { pointName, areaName, levelName } from './names.js';
  import HowTo from './HowTo.svelte';

  let { bike, level, list, onfinished } = $props();

  const today = localDay();
  const kind = $derived(kindOf(bike));
  const parts = $derived(ensureParts(bike));
  // a fork part is on every bike (spec), but its suspension points only fit a suspension fork, unless the bike shows it itself
  const hasPart = (k) => parts.some((p) => p.key === k) && partOnBike(bike, k) && (!PART[k]?.suspension || fits(bike, PART[k]) || bikePartOn(bike, k) === true);
  const groups = $derived(checklist(list, level, kind, hasPart));
  // «2a»: soon or worn measured parts go on the wishlist when finished (switchable per bike)
  const buy = $derived(bikeSettings(bike).buy);
  const points = $derived(groups.flatMap((g) => g.points));

  let insp = $state(null);
  let howto = $state(null);
  let busy = $state(false);
  let photoBusy = $state(null);
  let err = $state('');
  let open = $state({}); // point id → details open (note, photos)

  $effect(() => {
    if (!insp) draftFor(db, bike, level, today).then((d) => (insp = d));
  });
  const res = (id) => insp?.results?.find((r) => r.id === id) ?? null;
  const prog = $derived(insp ? progress(insp, points) : { done: 0, total: points.length });

  async function change(id, patch) {
    insp = setResult(insp, id, patch);
    try {
      await saveDraft(db, $state.snapshot(insp));
      err = '';
    } catch (e) {
      console.error(e);
      err = t('Could not save. Try again.');
    }
  }
  function setValue(p, text) {
    const v = readValue(text);
    if (Number.isNaN(v)) return change(p.id, { valueText: text, value: null, bad: true });
    const st = valueState(p.measure, v);
    const now = res(p.id)?.state;
    // a worn value suggests «Fix myself» (one tap changes it); an OK value suggests OK
    const auto = !now || now === 'ok' || now === 'fix' ? (st === 'worn' ? 'fix' : st === 'ok' || st === 'warn' ? (st === 'warn' ? 'watch' : 'ok') : now) : now;
    return change(p.id, { valueText: text, value: v, bad: false, state: auto ?? now ?? null });
  }
  async function addPhoto(p, file) {
    photoBusy = p.id;
    try {
      const url = await shrinkImage(file, 900, 0.72);
      await change(p.id, { photos: [...(res(p.id)?.photos ?? []), url] });
    } catch (e) {
      err = e.message;
    } finally {
      photoBusy = null;
    }
  }
  const removePhoto = (p, i) => change(p.id, { photos: (res(p.id)?.photos ?? []).filter((_, n) => n !== i) });
  const allOk = (g) => Promise.all(g.points.filter((p) => !res(p.id)?.state && !p.measure).map((p) => change(p.id, { state: 'ok' })));

  async function finish() {
    if (busy || !insp) return;
    busy = true;
    try {
      const snap = await finishInspection(db, $state.snapshot(insp), $state.snapshot(points), { name: pointName, prefix: t(LEVEL[level].name) });
      const n = snap.tasks.length;
      const w = snap.wishes?.length ?? 0;
      const said = n ? tn(n, '{level} saved. {n} point is now in the problems.', '{level} saved. {n} points are now in the problems.', { level: levelName(level) }) : t('{level} saved. Everything noted.', { level: levelName(level) });
      offerDone(w ? `${said} ${tn(w, '{n} part is on the wishlist.', '{n} parts are on the wishlist.')}` : said, () => undoFinish(db, snap));
      onfinished?.();
    } catch (e) {
      console.error(e);
      err = t('Could not save. Try again.');
    } finally {
      busy = false;
    }
  }

  /* ---------- «Begleiter» (Noah 21.11.2026 «2a»): tools first, one point per step, a summary at the end ---------- */
  // mode: 'prep' (what you need, what to look at first) · 'steps' (one point at a time) · 'summary' · 'list' (all points, as before)
  let mode = $state(null);
  let idx = $state(0);
  let ready = $state({});
  const pastQ = liveQuery(() => db.inspections.where('bikeId').equals(bike.id).toArray());
  const past = $derived(($pastQ ?? []).filter((x) => x.done && x.id !== insp?.id).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.doneAt ?? '').localeCompare(String(a.doneAt ?? ''))));
  $effect(() => {
    if (!insp || mode !== null) return;
    if (prog.done === 0) mode = 'prep';
    else {
      const first = points.findIndex((p) => !res(p.id)?.state);
      idx = Math.max(0, first);
      mode = first < 0 ? 'summary' : 'steps';
    }
  });
  const allTools = $derived([...new Set(points.flatMap((p) => p.tools ?? []))]);
  const nameOf = $derived(Object.fromEntries(points.map((p) => [p.id, pointName(p)])));
  /** What the last finished inspection found that still needs a look: [{ id, name, state, note }]. */
  const lookFirst = $derived((past[0]?.results ?? []).filter((r) => ['watch', 'fix', 'shop'].includes(r.state) && nameOf[r.id]).map((r) => ({ id: r.id, name: nameOf[r.id], state: r.state, note: r.note ?? '' })));
  const stateName = (k) => t(STATES.find((x) => x.key === k)?.name ?? '');
  /** One line: how this point stood last time. */
  function lastText(p) {
    for (const x of past) {
      const r = x.results?.find((q) => q.id === p.id && (q.state || q.value != null));
      if (!r) continue;
      const bits = [r.state ? stateName(r.state) : '', r.value != null ? `${fmt(r.value)} ${p.measure?.unit ?? ''}`.trim() : '', r.note ? `«${r.note}»` : ''].filter(Boolean);
      return `${dateOf(x.date)}: ${bits.join(' · ')}`;
    }
    return '';
  }
  const cur = $derived(mode === 'steps' ? points[Math.min(idx, points.length - 1)] ?? null : null);
  const curGroup = $derived(cur ? groups.find((g) => g.points.some((q) => q.id === cur.id)) ?? null : null);
  /** The km left until the limit at the value typed now, from the part's history (chain, pads, rotors). */
  function trendFor(p) {
    const v = res(p.id)?.value;
    const part = p.part ? parts.find((x) => x.key === p.part) : null;
    if (!part || !p.measure || p.measure.limit == null || typeof v !== 'number' || typeof bike.km !== 'number') return null;
    return wearTrend(part, { limit: p.measure.limit, low: !!p.measure.low, extra: [{ km: bike.km, value: v }] });
  }
  const go = (n) => {
    if (n >= points.length) mode = 'summary';
    else idx = Math.max(0, n);
  };
  const byState = (k) => points.filter((p) => res(p.id)?.state === k);
  const todo = $derived([...byState('fix'), ...byState('shop'), ...byState('watch')]);
  const unanswered = $derived(points.filter((p) => !res(p.id)?.state));
  const STATE_ICON = { ok: Check, watch: Eye, fix: Wrench, shop: Store };
  const fmt = (n) => String(n).replace('.', ',');
  const limitText = (m) => (m?.limit != null ? (m.low ? t('replace at {v} {unit} or less', { v: fmt(m.limit), unit: m.unit }) : t('replace at {v} {unit}', { v: fmt(m.limit), unit: m.unit })) : '');
</script>

{#snippet pointBody(p)}
    {@const r = res(p.id)}
    {@const vs = p.measure ? valueState(p.measure, r?.value) : null}
      <div class="top">
        <div class="nm">
          <b>{pointName(p)}</b>
          <small>{t(WHO.find((w) => w.key === p.who)?.name ?? 'Yourself')}{#if p.measure?.limit != null}{' '}· {limitText(p.measure)}{/if}</small>
        </div>
        <button type="button" class="btn sm how" onclick={() => (howto = p)} data-howto-open><BookOpen size={16} aria-hidden="true" />{t('How it works')}</button>
      </div>
      {#if p.measure}
        <label class="val">
          <span>{t('Value')}</span>
          <input class="inp num" type="text" inputmode="decimal" value={r?.valueText ?? (r?.value != null ? fmt(r.value) : '')} aria-label={t('Value for {name} in {unit}', { name: pointName(p), unit: p.measure.unit })} onchange={(e) => setValue(p, e.currentTarget.value)} data-point-value />
          <span class="unit">{p.measure.unit}</span>
          {#if r?.bad}<span class="vs bad" role="alert">{t('Type a number, e.g. 0,4')}</span>
          {:else if vs === 'worn'}<span class="vs bad">{t('worn: replace')}</span>{#if buy && p.part}<span class="vs" data-point-wish>{t('goes on the wishlist')}</span>{/if}
          {:else if vs === 'warn'}<span class="vs warn">{t('soon')}</span>{#if buy && p.part}<span class="vs" data-point-wish>{t('goes on the wishlist')}</span>{/if}
          {:else if vs === 'ok'}<span class="vs ok">{t('OK|inspect')}</span>{/if}
        </label>
      {/if}
      <div class="states" role="group" aria-label={t('State of {name}', { name: pointName(p) })}>
        {#each STATES as s (s.key)}
          {@const Icon = STATE_ICON[s.key]}
          <button type="button" class="stb {s.key}" aria-pressed={r?.state === s.key} onclick={() => change(p.id, { state: r?.state === s.key ? null : s.key })} data-state={s.key}><Icon size={16} aria-hidden="true" />{t(s.name)}</button>
        {/each}
      </div>
      <button type="button" class="more" aria-expanded={!!open[p.id] || !!r?.note || !!r?.photos?.length} onclick={() => (open = { ...open, [p.id]: !open[p.id] })} data-point-more>
        <ChevronDown size={14} aria-hidden="true" />{t('Note and photo')}{#if r?.photos?.length}{' '}· <Camera size={14} aria-hidden="true" /> {r.photos.length}{/if}
      </button>
      {#if open[p.id] || r?.note || r?.photos?.length}
        <div class="extra">
          <label class="note"><span class="lbl">{t('Note')}</span><textarea class="inp" rows="2" maxlength="300" value={r?.note ?? ''} onchange={(e) => change(p.id, { note: e.currentTarget.value.trim() })} data-point-note></textarea></label>
          {#if r?.photos?.length}
            <ul class="photos">
              {#each r.photos as src, i (i)}
                <li><img {src} alt={t('Photo {n} of {name}', { n: i + 1, name: pointName(p) })} /><button type="button" class="ib" aria-label={t('Remove photo {n}', { n: i + 1 })} onclick={() => removePhoto(p, i)}><X size={14} aria-hidden="true" /></button><DrawOn {src} list={r.photos} inks={r.inks} icon cls="ib drw" onsave={({ list, inks }) => change(p.id, { photos: list, inks })} /></li>
              {/each}
            </ul>
          {/if}
          <PhotoPick busy={photoBusy === p.id} has={!!r?.photos?.length} again="Another photo" onfile={(f) => addPhoto(p, f)} />
        </div>
      {/if}
{/snippet}

<div class="run" data-inspect-run={level}>
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike.id, open: true }) }, { label: t('Inspections'), href: bikesHash({ tab: 'care', view: 'inspect', bike: bike.id }) }]}
    title={`${levelName(level)} · ${bike.name}`}
    sub={`${t(LEVEL[level].text)} ${t('About {n} minutes.', { n: LEVEL[level].mins })}`}
  />

  {#if mode === 'prep'}
    <section class="rb" data-run-prep>
      <h2 class="rb-h">{t('1. What you need')}</h2>
      {#if allTools.length}
        <p class="hint">{t('Tap what is ready. This is only for you, nothing is saved.')}</p>
        <div class="rb-tools" role="group" aria-label={t('Tools')}>
          {#each allTools as x (x)}<button type="button" class="rb-tool" aria-pressed={!!ready[x]} onclick={() => (ready = { ...ready, [x]: !ready[x] })} data-run-tool>{ready[x] ? '✓ ' : ''}{t(x)}</button>{/each}
        </div>
      {:else}<p class="hint">{t('No special tools needed.')}</p>{/if}
      <h2 class="rb-h">{t('2. Look at this first')}</h2>
      {#if lookFirst.length}
        <ul class="rb-first" data-run-first>
          {#each lookFirst as x (x.id)}<li><b>{x.name}</b> <span class="rb-st {x.state}">{stateName(x.state)}</span>{#if x.note}<small>«{x.note}»</small>{/if}</li>{/each}
        </ul>
        <p class="hint">{t('From the last check on {date}.', { date: dateOf(past[0].date) })}</p>
      {:else if past.length}<p class="hint">{t('Nothing was open after the last check on {date}.', { date: dateOf(past[0].date) })}</p>
      {:else}<p class="hint">{t('This is the first check of this bike. Nothing to look at first.')}</p>{/if}
      <div class="rb-nav">
        <button type="button" class="btn hi" onclick={() => ((idx = 0), (mode = 'steps'))} data-run-go>{t('Start: point 1 of {n}', { n: points.length })}</button>
        <button type="button" class="btn" onclick={() => (mode = 'list')} data-run-list>{t('All points as a list')}</button>
      </div>
    </section>
  {:else if mode === 'summary'}
    <section class="rb" data-run-summary>
      <h2 class="rb-h">{t('{level} is done', { level: levelName(level) })}</h2>
      <p class="rb-count"><span class="rb-st ok">{tn(byState('ok').length, '{n} OK', '{n} OK')}</span> <span class="rb-st watch">{t('{n} to watch', { n: byState('watch').length })}</span> <span class="rb-st fix">{t('{n} to fix', { n: byState('fix').length + byState('shop').length })}</span>{#if unanswered.length}{' '}<span class="rb-st">{tn(unanswered.length, '{n} point left out', '{n} points left out')}</span>{/if}</p>
      <h3 class="rb-h2">{t('What to do')}</h3>
      {#if todo.length}
        <ul class="rb-todo" data-run-todo>
          {#each todo as p (p.id)}
            {@const r = res(p.id)}
            <li><span class="rb-who {r.state}">{r.state === 'shop' ? t('Bike shop') : r.state === 'fix' ? t('Fix myself') : t('Watch|inspect')}</span><span><b>{pointName(p)}</b>{#if r.value != null}{' · '}{fmt(r.value)} {p.measure?.unit ?? ''}{/if}{#if r.note}<small>«{r.note}»</small>{/if}</span></li>
          {/each}
        </ul>
        <p class="hint">{t('«Fix myself» and «Bike shop» become problems of the bike; the bike shop ones go into the workshop order. Values go into the part history.')}</p>
      {:else}<p class="hint">{t('Nothing to do. Everything is in the green.')}</p>{/if}
      {#if unanswered.length}<p class="hint"><button type="button" class="lnk" onclick={() => ((idx = points.findIndex((p) => !res(p.id)?.state)), (mode = 'steps'))} data-run-open>{t('Go to the first point left out')}</button></p>{/if}
      {#if err}<p class="err" role="alert">{err}</p>{/if}
      <div class="rb-nav">
        <button type="button" class="btn" onclick={() => ((idx = points.length - 1), (mode = 'steps'))}><ChevronLeft size={16} aria-hidden="true" />{t('Back')}</button>
        <button type="button" class="btn hi" disabled={busy || !insp} onclick={finish} data-inspect-finish><Check size={16} aria-hidden="true" />{t('Done · save {done} of {total}', { done: prog.done, total: prog.total })}</button>
      </div>
    </section>
  {:else}
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label={t('Progress')}>
    <span style="width: {prog.total ? Math.round((prog.done / prog.total) * 100) : 0}%"></span>
  </div>
  <p class="prog" data-inspect-progress>{t('{done} of {total} points', { done: prog.done, total: prog.total })}{#if insp?.date && insp.date !== today}{' '}· {t('started {date}', { date: dateOf(insp.date) })}{/if}</p>
  {#if mode === 'list'}
  <p class="hint">{t('Tap a state for every point. «So geht’s» shows tools, steps and when the bike shop is better. Everything is saved at once.')}</p>
  {/if}

  {#if mode === 'steps' && cur}
    {@const r = res(cur.id)}
    {@const tr = trendFor(cur)}
    {@const lt = lastText(cur)}
    <nav class="rb-strip" aria-label={t('Points')}>
      {#each points as q, i (q.id)}<button type="button" class="rb-seg {res(q.id)?.state ?? 'none'}" class:cur={i === idx} aria-label={`${i + 1}. ${pointName(q)}`} aria-current={i === idx ? 'step' : undefined} onclick={() => go(i)}></button>{/each}
    </nav>
    <section class="rb" data-run-step={cur.id}>
      <p class="rb-kick">{t('Point {n} of {total}', { n: idx + 1, total: points.length })}{#if curGroup}{' · '}{areaName(curGroup.area)}{/if}</p>
      <div class="pt st-{r?.state ?? 'none'}" data-point={cur.id}>
        {#if cur.tools?.length}<ul class="rb-tools-in" aria-label={t('Tools')}>{#each cur.tools as x (x)}<li><Wrench size={14} aria-hidden="true" />{t(x)}</li>{/each}</ul>{/if}
        {#if cur.steps?.length}<h3 class="rb-h2"><ListOrdered size={16} aria-hidden="true" />{t('Steps')}</h3><ol class="rb-how">{#each cur.steps as x, n (n)}<li>{t(x)}</li>{/each}</ol>{/if}
        {#if cur.own && cur.note}<p class="rb-txt">{cur.note}</p>{/if}
        {#if cur.tip}<p class="rb-tip"><Lightbulb size={16} aria-hidden="true" /><span>{t(cur.tip)}</span></p>{/if}
        {#if cur.shop}<p class="rb-shop"><Store size={16} aria-hidden="true" /><span><b>{t('When to go to the bike shop')}</b> {t(cur.shop)}</span></p>{/if}
        {#if lt}<p class="rb-last" data-run-last>{t('Last time')}: {lt}</p>{/if}
        {@render pointBody(cur)}
        {#if tr}<p class="rb-trend" data-run-trend>{tr.kmLeft > 0 ? t('At this value about {km} km are left until {limit} {unit}.', { km: num(tr.kmLeft), limit: fmt(cur.measure.limit), unit: cur.measure.unit }) : t('At this value the limit of {limit} {unit} is reached.', { limit: fmt(cur.measure.limit), unit: cur.measure.unit })}</p>{/if}
      </div>
      <div class="rb-nav">
        <button type="button" class="btn" disabled={idx === 0} onclick={() => go(idx - 1)} data-run-prev><ChevronLeft size={16} aria-hidden="true" />{t('Back')}</button>
        <button type="button" class="btn hi" onclick={() => go(idx + 1)} data-run-next>{idx === points.length - 1 ? t('Finish|step') : t('Next|step')}<ChevronRight size={16} aria-hidden="true" /></button>
      </div>
      <p class="rb-sub"><button type="button" class="lnk" onclick={() => (mode = 'list')} data-run-list>{t('All points as a list')}</button> · <a class="lnk" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id })} data-inspect-later>{t('Continue later')}</a></p>
    </section>
  {:else}
    <p class="rb-sub"><button type="button" class="lnk" onclick={() => ((idx = Math.max(0, points.findIndex((p) => !res(p.id)?.state))), (mode = 'steps'))} data-run-steps>{t('Step by step')}</button></p>
  {#each groups as g (g.area.id)}
    <section class="area" aria-labelledby="ar-{g.area.id || 'none'}">
      <div class="ah">
        <h2 id="ar-{g.area.id || 'none'}">{areaName(g.area)}</h2>
        <button type="button" class="btn sm" onclick={() => allOk(g)} data-area-ok>{t('Rest OK')}</button>
      </div>
      <ul class="pts">
        {#each g.points as p (p.id)}
          {@const r = res(p.id)}
          <li class="pt st-{r?.state ?? 'none'}" data-point={p.id}>
            {@render pointBody(p)}
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  {#if err}<p class="err" role="alert">{err}</p>{/if}
  <div class="foot">
    <a class="btn" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id })} data-inspect-later>{t('Continue later')}</a>
    <button type="button" class="btn hi" disabled={busy || !insp} onclick={finish} data-inspect-finish><Check size={16} aria-hidden="true" />{t('Done · save {done} of {total}', { done: prog.done, total: prog.total })}</button>
  </div>
  <p class="hint">{t('«Fix myself» and «Bike shop» become problems of the bike; the bike shop ones go into the workshop order. Values go into the part history.')}</p>
  {/if}
  {/if}
</div>

{#if howto}
  <HowTo point={howto} name={pointName(howto)} part={parts.find((x) => x.key === howto.part) ?? null} bikeId={bike.id} onclose={() => (howto = null)} />
{/if}

<style>
  .run {
    min-width: 0;
  }
  .bar {
    height: 8px;
    border-radius: 99px;
    background: var(--line);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }
  .prog {
    margin: 6px 0 0;
    font-weight: 500;
  }
  .hint {
    margin: 4px 0 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .area {
    margin: 0 0 14px;
    padding: 12px 14px 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .ah {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .ah h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .pts {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }
  .pt {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px 10px;
  }
  .nm {
    display: grid;
    min-width: 0;
    flex: 1 1 12rem;
  }
  .nm b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  small,
  .unit {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .how {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .val {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 8px 0 0;
  }
  .val .inp {
    width: 6rem;
    min-height: 44px;
  }
  .vs {
    padding: 2px 8px;
    border-radius: 99px;
    font-size: var(--fs-small);
  }
  .vs.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .vs.warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .vs.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .states {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
  }
  .stb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .stb[aria-pressed='true'].ok {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .stb[aria-pressed='true'].watch {
    background: var(--warn-soft);
    border-color: var(--warn);
  }
  .stb[aria-pressed='true'].fix,
  .stb[aria-pressed='true'].shop {
    background: var(--bad-soft);
    border-color: var(--bad);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin: 2px 0 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .extra {
    display: grid;
    gap: 8px;
  }
  .note {
    display: grid;
    gap: 4px;
  }
  .note textarea {
    width: 100%;
    box-sizing: border-box;
  }
  .photos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .photos li {
    position: relative;
  }
  .photos img {
    width: 88px;
    height: 88px;
    object-fit: cover;
    border-radius: 8px;
  }
  .photos .ib,
  .photos :global(.drw) {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .photos :global(.drw) {
    right: auto;
    left: 2px;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin: 6px 0 4px;
  }
  .foot .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .err {
    color: var(--bad);
  }
  /* «Begleiter»: prep, one point per step, summary */
  .rb {
    margin: 12px 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .rb-h {
    margin: 0 0 6px;
    font-size: var(--fs-sub);
  }
  .rb-h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 12px 0 4px;
    font-size: var(--fs-body);
  }
  .rb-kick,
  .rb-sub {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rb-sub {
    margin: 10px 0 0;
  }
  .rb-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 14px;
  }
  .rb-tool {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
    max-width: 100%;
    overflow-wrap: break-word;
  }
  .rb-tool[aria-pressed='true'] {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .rb-first,
  .rb-todo {
    list-style: none;
    margin: 4px 0 6px;
    padding: 0;
  }
  .rb-first li,
  .rb-todo li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .rb-first li:first-child,
  .rb-todo li:first-child {
    border-top: 0;
  }
  .rb-first small,
  .rb-todo small {
    display: block;
    color: var(--ink-2);
  }
  .rb-st,
  .rb-who {
    display: inline-block;
    padding: 1px 9px;
    border-radius: 99px;
    background: var(--line);
    font-size: var(--fs-small);
  }
  .rb-st.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .rb-st.watch,
  .rb-who.watch {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .rb-st.fix,
  .rb-st.shop,
  .rb-who.fix,
  .rb-who.shop {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .rb-count {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 4px;
  }
  .rb-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin: 14px 0 0;
  }
  .rb-strip {
    display: flex;
    gap: 4px;
    margin: 10px 0 0;
  }
  .rb-seg {
    flex: 1 1 0;
    min-width: 6px;
    height: 14px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: var(--line-strong);
    cursor: pointer;
  }
  .rb-seg.ok {
    background: var(--ok);
  }
  .rb-seg.watch {
    background: var(--warn);
  }
  .rb-seg.fix,
  .rb-seg.shop {
    background: var(--bad);
  }
  .rb-seg.cur {
    outline: 2px solid var(--ink);
    outline-offset: 1px;
  }
  .rb-tools-in {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 6px;
    padding: 0;
    list-style: none;
  }
  .rb-tools-in li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: var(--fs-small);
  }
  .rb-how {
    margin: 4px 0 8px;
    padding-left: 22px;
  }
  .rb-how li {
    margin: 3px 0;
  }
  .rb-tip,
  .rb-shop {
    display: flex;
    gap: 8px;
    margin: 8px 0;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rb-tip {
    background: var(--ok-soft);
  }
  .rb-shop {
    background: var(--warn-soft);
  }
  .rb-last,
  .rb-trend {
    margin: 8px 0;
    padding-left: 10px;
    border-left: 3px solid var(--line-strong);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rb-who {
    white-space: nowrap;
  }
  .rb-sub .lnk,
  .hint .lnk {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
