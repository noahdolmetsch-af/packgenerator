<script>
  import { localDay } from '../localday.js';
  import { partInfo, wear, replaceHint, kmSince, lastReplace, EXTRA } from '../care.js';
  import { t, num as fmtNum, dateOf } from '../i18n.svelte.js';
  import { UserRound, Store } from '@lucide/svelte';

  /**
   * One part of a bike: measure it, say how it is, see everything that was done to it.
   * onlog(entry) stores a new history entry; the page decides the rest (wishlist, km).
   */
  let { part, bike, by = 'self', onby, onlog, onclose } = $props();

  // v0.31.0 (answer 10a): who did the work is chosen here (me / bike shop), not at the top of the
  // page; the last choice is preselected and remembered (onby).
  // svelte-ignore state_referenced_locally
  let who = $state(by === 'shop' ? 'shop' : 'self');
  function pick(v) {
    who = v;
    onby?.(v);
  }

  // svelte-ignore state_referenced_locally
  const p = partInfo(part);
  let value = $state('');
  // svelte-ignore state_referenced_locally
  let model = $state(part.model ?? '');
  let note = $state('');
  // svelte-ignore state_referenced_locally
  let limit = $state(p.limit ?? '');
  let extra = $state({});
  const num = (v) => (String(v ?? '').trim() === '' ? null : Number(String(v).replace(',', '.')));
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  const ACTION = { check: 'Checked', service: 'Serviced', replace: 'Replaced' };
  const RESULT = { ok: 'OK', needed: 'Work needed', done: 'Done' };

  async function log(action, result) {
    const v = num(value);
    if (v != null && !Number.isFinite(v)) return (error = t('Type a number, e.g. 0.4'));
    const lim = num(limit);
    if (lim != null && !Number.isFinite(lim)) return (error = t('Replace at: type a number, e.g. 1.5'));
    const extras = Object.fromEntries((p.extra ?? []).map((k) => [k, num(extra[k])]).filter(([, x]) => x != null && Number.isFinite(x)));
    await onlog({
      date: localDay(),
      km: typeof bike.km === 'number' ? bike.km : null,
      value: v,
      action,
      result,
      by: who,
      model: model.trim() || null,
      note: note.trim(),
      ...extras,
      ...(lim != null && lim !== p.limit ? { limit: lim } : {}),
    });
    // v0.27.0 (Noah 1a): Escape during the save already closed (and unmounted) the dialog.
    if (dialog?.open) dialog.close();
  }

  const hint = $derived(replaceHint(part));
  const sinceNew = $derived(kmSince(bike, lastReplace(part)));
  const state = $derived(wear(part));
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="part-h">
  <p class="meta">{bike.name}</p>
  <h2 id="part-h" class="title">{t(p.name)}</h2>
  {#if p.hint}<p class="hint">{t(p.hint)}</p>{/if}
  <p class="facts num">
    {#if state}<span class="badge {state}">{state === 'ok' ? t('OK') : state === 'warn' ? t('Soon') : t('Worn|part')}</span>{/if}
    {#if sinceNew != null}{t('{km} km since it was new', { km: fmtNum(sinceNew) })}{:else if bike.km == null}{t("Set the bike's km to count km per part")}{/if}
  </p>

  <div class="grid">
    <label><span class="lbl">{t('Model')}</span><input class="inp" bind:value={model} placeholder={t('e.g. SRAM GX Eagle 12-speed')} /></label>
    <label><span class="lbl">{t('Measured')}{p.unit ? ` (${p.unit})` : ''}</span><input class="inp num" type="text" inputmode="decimal" bind:value={value} placeholder={p.unit ? t('optional') : t('no measurement')} disabled={!p.unit} /></label>
    {#if p.limit != null}<label><span class="lbl">{p.lowIsWorn ? t('Replace below ({unit}) on this bike', { unit: p.unit }) : t('Replace at ({unit}) on this bike', { unit: p.unit })}</span><input class="inp num" type="text" inputmode="decimal" bind:value={limit} /></label>{/if}
    {#each p.extra ?? [] as k (k)}
      <label><span class="lbl">{t(EXTRA[k].name)} ({EXTRA[k].unit})</span><input class="inp num" type="text" inputmode="decimal" bind:value={extra[k]} placeholder={t('optional')} /></label>
    {/each}
    <label class="wide"><span class="lbl">{t('Note')}</span><input class="inp" bind:value={note} placeholder={t('optional')} /></label>
  </div>
  <p class="err" role="alert">{error}</p>
  {#if hint}<p class="warnbox soft">{hint}</p>{/if}
  <div class="who" role="group" aria-labelledby="who-l">
    <span class="lbl" id="who-l">{t('Done by')}</span>
    <span class="seg">
      <button type="button" aria-pressed={who === 'self'} onclick={() => pick('self')}><UserRound size={16} aria-hidden="true" />{t('me|by')}</button>
      <button type="button" aria-pressed={who === 'shop'} onclick={() => pick('shop')}><Store size={16} aria-hidden="true" />{t('bike shop|by')}</button>
    </span>
  </div>
  <div class="foot">
    <button type="button" class="btn" onclick={() => log('check', 'ok')}>{t('OK')}</button>
    <button type="button" class="btn" onclick={() => log('check', 'needed')}>{t('Replace or work needed')}</button>
    <button type="button" class="btn hi" onclick={() => log('replace', 'done')}>{t('Replaced or done')}</button>
    {#if p.service}<button type="button" class="btn" onclick={() => log('service', 'done')}>{t(p.service)}</button>{/if}
  </div>

  <h3>{t('History')}</h3>
  {#if part.history?.length}
    <ol class="hist">
      {#each [...part.history].reverse() as h, n (n)}
        <li>
          <span class="num">{dateOf(h.date)}{h.km != null ? ` · ${fmtNum(h.km)} km` : ''}</span>
          <b>{t(h.action === 'check' ? RESULT[h.result] : h.action === 'replace' && !p.unit ? 'Done' : ACTION[h.action])}{h.value != null ? ` · ${h.value} ${p.unit}` : ''}</b>
          <span class="m">{[h.model, ...Object.keys(EXTRA).filter((k) => h[k] != null).map((k) => `${t(EXTRA[k].name.toLowerCase())} ${h[k]} ${EXTRA[k].unit}`), h.by === 'shop' ? t('bike shop') : h.by === 'self' ? t('me') : '', h.note, h.chf ? `CHF ${h.chf.toFixed(2)}` : ''].filter(Boolean).join(' · ')}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="hint">{t('Nothing recorded yet.')}</p>
  {/if}
  <div class="foot"><button type="button" class="btn" onclick={() => dialog?.close()}>{t('Close')}</button></div>
</dialog>

<style>
  .meta {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 6px;
  }
  h3 {
    margin: 18px 0 6px;
    font-size: 16px;
  }
  .hint {
    font-size: 14px;
    color: var(--ink-3);
    margin: 0 0 8px;
  }
  .facts {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 12px;
    font-size: 14px;
  }
  .badge {
    padding: 1px 8px;
    border-radius: 999px;
    font-weight: 700;
    font-size: var(--fs-small);
    background: var(--ok-soft);
    color: var(--ok);
  }
  .badge.warn {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .badge.worn {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .err {
    color: var(--bad);
    min-height: 1.2em;
    font-size: 14px;
    margin: 4px 0;
  }
  .warnbox {
    border: 1.5px solid var(--hi);
    background: var(--hi-soft);
    padding: 8px 10px;
    font-size: 14px;
  }
  .who {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 4px 0;
  }
  .who .lbl {
    margin: 0;
  }
  .seg {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 6px 16px;
    border: 0;
    background: var(--paper);
    font: 600 15px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--line);
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
  }
  .hist {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .hist li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
  }
  .hist .m {
    grid-column: 2;
    color: var(--ink-3);
  }
</style>
