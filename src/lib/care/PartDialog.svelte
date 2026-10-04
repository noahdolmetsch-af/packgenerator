<script>
  import { partInfo, wear, replaceHint, kmSince, lastReplace, EXTRA } from '../care.js';

  /**
   * One part of a bike: measure it, say how it is, see everything that was done to it.
   * onlog(entry) stores a new history entry; the page decides the rest (wishlist, km).
   */
  let { part, bike, by, onlog, onclose } = $props();

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
    if (v != null && !Number.isFinite(v)) return (error = 'Type a number, e.g. 0.4');
    const lim = num(limit);
    if (lim != null && !Number.isFinite(lim)) return (error = 'Replace at: type a number, e.g. 1.5');
    const extras = Object.fromEntries((p.extra ?? []).map((k) => [k, num(extra[k])]).filter(([, x]) => x != null && Number.isFinite(x)));
    await onlog({
      date: new Date().toISOString().slice(0, 10),
      km: typeof bike.km === 'number' ? bike.km : null,
      value: v,
      action,
      result,
      by,
      model: model.trim() || null,
      note: note.trim(),
      ...extras,
      ...(lim != null && lim !== p.limit ? { limit: lim } : {}),
    });
    dialog.close();
  }

  const hint = $derived(replaceHint(part));
  const sinceNew = $derived(kmSince(bike, lastReplace(part)));
  const state = $derived(wear(part));
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="part-h">
  <p class="meta">{bike.name}</p>
  <h2 id="part-h" class="title">{p.name}</h2>
  {#if p.hint}<p class="hint">{p.hint}</p>{/if}
  <p class="facts num">
    {#if state}<span class="badge {state}">{state === 'ok' ? 'OK' : state === 'warn' ? 'Soon' : 'Worn'}</span>{/if}
    {#if sinceNew != null}{sinceNew.toLocaleString('en')} km since it was new{:else if bike.km == null}Set the bike's km to count km per part{/if}
  </p>

  <div class="grid">
    <label><span class="lbl">Model</span><input class="inp" bind:value={model} placeholder="e.g. SRAM GX Eagle 12-speed" /></label>
    <label><span class="lbl">Measured{p.unit ? ` (${p.unit})` : ''}</span><input class="inp num" type="text" inputmode="decimal" bind:value={value} placeholder={p.unit ? 'optional' : 'no measurement'} disabled={!p.unit} /></label>
    {#if p.limit != null}<label><span class="lbl">{p.lowIsWorn ? 'Replace below' : 'Replace at'} ({p.unit}) on this bike</span><input class="inp num" type="text" inputmode="decimal" bind:value={limit} /></label>{/if}
    {#each p.extra ?? [] as k (k)}
      <label><span class="lbl">{EXTRA[k].name} ({EXTRA[k].unit})</span><input class="inp num" type="text" inputmode="decimal" bind:value={extra[k]} placeholder="optional" /></label>
    {/each}
    <label class="wide"><span class="lbl">Note</span><input class="inp" bind:value={note} placeholder="optional" /></label>
  </div>
  <p class="err" role="alert">{error}</p>
  {#if hint}<p class="warnbox soft">{hint}</p>{/if}
  <div class="foot">
    <button type="button" class="btn" onclick={() => log('check', 'ok')}>OK</button>
    <button type="button" class="btn" onclick={() => log('check', 'needed')}>Replace or work needed</button>
    <button type="button" class="btn hi" onclick={() => log('replace', 'done')}>Replaced or done</button>
    {#if p.service}<button type="button" class="btn" onclick={() => log('service', 'done')}>{p.service}</button>{/if}
  </div>
  <p class="by">Done by {by === 'shop' ? 'the bike shop' : 'me'} (change at the top of Bike care)</p>

  <h3>History</h3>
  {#if part.history?.length}
    <ol class="hist">
      {#each [...part.history].reverse() as h, n (n)}
        <li>
          <span class="num">{h.date}{h.km != null ? ` · ${h.km.toLocaleString('en')} km` : ''}</span>
          <b>{h.action === 'check' ? RESULT[h.result] : h.action === 'replace' && !p.unit ? 'Done' : ACTION[h.action]}{h.value != null ? ` · ${h.value} ${p.unit}` : ''}</b>
          <span class="m">{[h.model, ...Object.keys(EXTRA).filter((k) => h[k] != null).map((k) => `${EXTRA[k].name.toLowerCase()} ${h[k]} ${EXTRA[k].unit}`), h.by === 'shop' ? 'bike shop' : h.by === 'self' ? 'me' : '', h.note].filter(Boolean).join(' · ')}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="hint">Nothing recorded yet.</p>
  {/if}
  <div class="foot"><button type="button" class="btn" onclick={() => dialog.close()}>Close</button></div>
</dialog>

<style>
  .meta {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    font-size: 32px;
    margin: 4px 0 6px;
  }
  h3 {
    margin: 18px 0 6px;
    font-size: 16px;
  }
  .hint,
  .by {
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
    font-size: 12px;
    background: #d9eedf;
    color: #2f7a4f;
  }
  .badge.warn {
    background: var(--hi-soft);
    color: var(--ink);
  }
  .badge.worn {
    background: #f6d5d0;
    color: #b42318;
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
    color: #b42318;
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
