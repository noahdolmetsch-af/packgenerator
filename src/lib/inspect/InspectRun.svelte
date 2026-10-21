<script>
  /**
   * «Velo-Inspektion» (Noah 19.10.2026 «1a 2a 3a 4a 5a»): one inspection running, point by point.
   * The points of the level (5a: quick ⊂ monthly ⊂ full) that fit the bike, grouped by area. Each point:
   * OK / Watch / Fix myself / Bike shop, a value where it is measured (with the limit as a colour), a note,
   * photos (4a), and «So geht's» (2a). Every change is saved at once as a draft: «Später weitermachen»
   * just leaves; «Fertig» writes the part history and the problems (inspectdb.js) and offers Undo.
   * bike: as stored; level; list: the person's checklist; onfinished(): back to the overview.
   */
  import { Check, BookOpen, Camera, X, ChevronDown, Store, Wrench, Eye } from '@lucide/svelte';
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
  import { checklist, progress, setResult, readValue, valueState, STATES, bikeSettings } from './inspect.js';
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
  const STATE_ICON = { ok: Check, watch: Eye, fix: Wrench, shop: Store };
  const fmt = (n) => String(n).replace('.', ',');
  const limitText = (m) => (m?.limit != null ? (m.low ? t('replace at {v} {unit} or less', { v: fmt(m.limit), unit: m.unit }) : t('replace at {v} {unit}', { v: fmt(m.limit), unit: m.unit })) : '');
</script>

<div class="run" data-inspect-run={level}>
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike.id, open: true }) }, { label: t('Inspections'), href: bikesHash({ tab: 'care', view: 'inspect', bike: bike.id }) }]}
    title={`${levelName(level)} · ${bike.name}`}
    sub={`${t(LEVEL[level].text)} ${t('About {n} minutes.', { n: LEVEL[level].mins })}`}
  />

  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={prog.total} aria-valuenow={prog.done} aria-label={t('Progress')}>
    <span style="width: {prog.total ? Math.round((prog.done / prog.total) * 100) : 0}%"></span>
  </div>
  <p class="prog" data-inspect-progress>{t('{done} of {total} points', { done: prog.done, total: prog.total })}{#if insp?.date && insp.date !== today}{' '}· {t('started {date}', { date: dateOf(insp.date) })}{/if}</p>
  <p class="hint">{t('Tap a state for every point. «So geht’s» shows tools, steps and when the bike shop is better. Everything is saved at once.')}</p>

  {#each groups as g (g.area.id)}
    <section class="area" aria-labelledby="ar-{g.area.id || 'none'}">
      <div class="ah">
        <h2 id="ar-{g.area.id || 'none'}">{areaName(g.area)}</h2>
        <button type="button" class="btn sm" onclick={() => allOk(g)} data-area-ok>{t('Rest OK')}</button>
      </div>
      <ul class="pts">
        {#each g.points as p (p.id)}
          {@const r = res(p.id)}
          {@const vs = p.measure ? valueState(p.measure, r?.value) : null}
          <li class="pt st-{r?.state ?? 'none'}" data-point={p.id}>
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
</style>
