<script>
  /**
   * Paket N #32/#287 (Noah 19.10.2026 «1a 2b»): one dream tour, open. Title, kind of tour, the months it
   * fits (the kind's suggestion until you change one; «Back to the suggestion»), days, a note and a link.
   * Changes are saved when the window closes. «Plan the tour» hands over to the page (PlanSheet).
   */
  import { backClose } from '../ui/backclose.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { MONTHS, seasonText, monthsOf, toggleMonth, resetMonths, suggested, kindName, routeFromGpx, linkKind } from '../dreams.js';
  import { shrinkImage } from '../photo.js';
  import CameraButton from '../ui/CameraButton.svelte';
  import StaticMap from '../ui/StaticMap.svelte';
  import { t } from '../i18n.svelte.js';
  import { X, Route, RotateCcw, Image as ImageIcon, Map as MapIcon, Trash2, ExternalLink } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { dream, kinds = [], onchange, onremove, onplan, onclose } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let d = $state(structuredClone($state.snapshot(dream)));
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const months = $derived(monthsOf(d, kinds));
  const pt = (p) => ({ lat: p[0], lon: p[1] });
  async function closeIt() {
    const v = $state.snapshot(d);
    if (!v.title?.trim()) v.title = dream.title;
    if (JSON.stringify(v) !== JSON.stringify(dream)) await onchange?.(v);
    dialog.close();
  }
  async function remove() {
    if ((await askDelete({ title: t('Delete the dream "{text}"?', { text: dream.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    if (await deleteWithUndo({ run: () => onremove?.(dream.id), undo: (snap) => onchange?.(dream, snap), text: t('"{name}" deleted.', { name: dream.title }), name: dream.title })) dialog.close();
  }
  // idea 1 (Noah 19.10.2026 «1-5 a»): a photo and a map (a GPX file, e.g. from komoot) for the dream
  let msg = $state('');
  async function addPhoto(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      d.photo = await shrinkImage(f, 1000, 0.75);
      msg = '';
    } catch (err) {
      msg = err.message || t('This photo could not be read.');
    }
  }
  async function addGpx(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    const r = routeFromGpx(await f.text(), f.name.replace(/\.gpx$/i, ''));
    if (!r) return (msg = t('No route found in this file.'));
    msg = '';
    d.route = r;
  }
  async function plan() {
    await closeIt();
    onplan?.($state.snapshot(d));
  }
</script>

<dialog use:backClose class="sheet vdlg dsheet" bind:this={dialog} {onclose} oncancel={(e) => (e.preventDefault(), closeIt())} aria-labelledby="dream-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="dream-h" class="title">{d.title || t('Dream')}</h2>
      <p class="vd-sub">{kindName(kinds, d.kind, t)} · {seasonText(months, (m) => t(MONTHS[m - 1]))}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
  </div>
  <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp" type="text" bind:value={d.title} maxlength="80" /></label>

  <p class="lbl">{t('Kind of tour')}</p>
  <div class="vd-chips" role="group" aria-label={t('Kind of tour')}>
    {#each kinds as k (k.key)}<button type="button" class="vd-chip" aria-pressed={d.kind === k.key} onclick={() => (d.kind = k.key)}>{kindName(kinds, k.key, t)}</button>{/each}
  </div>

  <p class="lbl">{t('Fits in')} <small class="q">· {suggested(d) ? t('suggested from the kind of tour') : t('chosen by you')}</small></p>
  <div class="months" role="group" aria-label={t('Fits in')} data-months>
    {#each MONTHS as m, i (m)}<button type="button" class="vd-chip mo" aria-pressed={months.includes(i + 1)} onclick={() => (d = toggleMonth(d, i + 1, kinds))}>{t(m)}</button>{/each}
  </div>
  {#if !suggested(d)}<button type="button" class="btn btn-link" onclick={() => (d = resetMonths(d))}><RotateCcw size={14} aria-hidden="true" />{t('Back to the suggestion')}</button>{/if}

  <div class="two">
    <label class="fld"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={d.days} /></label>
    <label class="fld"><span class="lbl">{t('Link')} <small class="q">· {t('optional')}</small></span><input class="inp" type="url" bind:value={d.url} placeholder="https://…" /></label>
  </div>
  {#if d.url && linkKind(d.url)}<p class="lnk"><a href={d.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden="true" />{t('Open in {where}', { where: linkKind(d.url) })}</a></p>{/if}

  <p class="lbl">{t('Picture and map')} <small class="q">· {t('optional')}</small></p>
  {#if d.photo}
    <div class="phw" data-dream-photo><img src={d.photo} alt={t('Photo of the dream')} /><button type="button" class="rm" aria-label={t('Remove photo')} onclick={() => (d.photo = null)}><Trash2 size={16} aria-hidden="true" /></button></div>
  {/if}
  {#if d.route}
    <div class="mapw" data-dream-map>
      <StaticMap line={d.route.line} marks={[{ ...pt(d.route.line[0]), kind: 'start' }, { ...pt(d.route.line.at(-1)), kind: 'end' }]} label={d.route.name || d.title} h={220} />
      <p class="rmeta"><span>{d.route.name ? `${d.route.name} · ` : ''}{t('{km} km', { km: d.route.km })}</span><button type="button" class="rm" aria-label={t('Remove the map')} onclick={() => (d.route = null)}><Trash2 size={16} aria-hidden="true" /></button></p>
    </div>
  {/if}
  <div class="adds" role="group" aria-label={t('Picture and map')}>
    <CameraButton onchange={addPhoto} icon />
    <label class="btn sm"><ImageIcon size={16} aria-hidden="true" />{d.photo ? t('Other photo') : t('Photo')}<input type="file" accept="image/*" hidden onchange={addPhoto} data-dream-photo-in /></label>
    <label class="btn sm"><MapIcon size={16} aria-hidden="true" />{d.route ? t('Other GPX file') : t('Map from a GPX file')}<input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" hidden onchange={addGpx} data-dream-gpx /></label>
  </div>
  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  <p class="q hint">{t('The map: export the route as a GPX file in komoot (or elsewhere) and load it here.')}</p>

  <label class="fld"><span class="lbl">{t('Note')} <small class="q">· {t('optional')}</small></span><textarea class="inp" rows="2" bind:value={d.note}></textarea></label>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={remove}>{t('Delete')}</button>
    {#if !d.tripId}<button type="button" class="btn" onclick={plan}><Route size={16} aria-hidden="true" />{t('Plan the tour')}</button>{/if}
    <button type="button" class="btn hi" onclick={closeIt}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .months {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin: 0 0 8px;
  }
  .mo {
    justify-content: center;
    min-width: 0;
    padding-inline: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10em, 1fr));
    gap: 0 12px;
  }
  .fld {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
  .hint {
    margin: 0 0 12px;
  }
  .lnk {
    margin: -4px 0 12px;
  }
  .lnk a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .adds {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 6px;
  }
  .phw,
  .mapw {
    position: relative;
    margin: 0 0 10px;
  }
  .phw img {
    display: block;
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 10px;
  }
  .phw .rm {
    position: absolute;
    top: 6px;
    right: 6px;
    background: var(--paper);
  }
  .rm {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 6px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .rmeta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin: 6px 0 0;
  }
  .err {
    color: var(--bad);
  }
</style>
