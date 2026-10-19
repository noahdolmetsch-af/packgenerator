<script>
  /**
   * «Bausteine» (mockup BS7): «Eigener Baustein», new or changed. Title, kind (text, checklist, values),
   * the points or labels, a standard text, where it shows (Workshop order, Bike pass, both), for all
   * bikes or only this one, and whether it goes into the text to the bike shop. The definition is for
   * all bikes, the text, the ticks and the values belong to each bike (B5 a).
   */
  import { X, Plus } from '@lucide/svelte';
  import { backClose } from '../../ui/backclose.js';
  import { t } from '../../i18n.svelte.js';
  import { newOwn, OWN_KINDS, bikeBlocks } from '../../sheetblocks.js';
  import { readGlob, saveOwn } from './blockstore.js';
  import SortGrip from '../../ui/SortGrip.svelte';
  import BlockSwitch from './BlockSwitch.svelte';
  import { sortable } from '../../ui/sortable.js';
  import '../velo-dlg.css';

  let { def = null, bike, bikes = [], sheet = 'pass', onclose, onsaved } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // svelte-ignore state_referenced_locally
  const start = def ?? { title: '', kind: 'check', sheets: [sheet], toShop: true, std: '', points: [], labels: [] };
  let title = $state(start.title);
  let kind = $state(start.kind);
  let where = $state(start.sheets.length > 1 ? 'both' : start.sheets[0]);
  let forAll = $state(true);
  let toShop = $state(start.toShop !== false);
  let std = $state(start.std ?? '');
  let points = $state((start.points ?? []).map((p) => ({ ...p })));
  let labels = $state((start.labels ?? []).map((l) => ({ ...l })));
  let fresh = $state('');
  let msg = $state('');
  let busy = $state(false);

  // the kind changes only while no bike has written something into the block (6.2)
  // svelte-ignore state_referenced_locally
  const locked = !!def && bikes.some((b) => bikeBlocks(b).own[def.ownId ?? def.id]);
  const KIND = { text: ['Text|block', 'Free text, one per bike'], check: ['Checklist', 'Points to tick'], values: ['Values|block', 'Labels with a value per bike'] };
  const WHERE = [
    ['order', 'Workshop order|sheet'],
    ['pass', 'Bike pass'],
    ['both', 'both|sheets'],
  ];

  function addPoint() {
    const text = fresh.trim();
    if (!text) return;
    if (kind === 'check') points = [...points, { id: uid('p'), text }];
    else labels = [...labels, { id: uid('l'), text, unit: '' }];
    fresh = '';
  }
  const movePoint = (from, to) => {
    const list = kind === 'check' ? [...points] : [...labels];
    const [x] = list.splice(from, 1);
    list.splice(to, 0, x);
    if (kind === 'check') points = list;
    else labels = list;
  };

  async function save() {
    msg = '';
    if (fresh.trim()) addPoint();
    const glob = await readGlob();
    const sheets = where === 'both' ? ['pass', 'order'] : [where];
    const res = newOwn(glob, { id: def?.ownId ?? def?.id ?? uid('b'), title, kind, sheets, toShop: sheets.includes('order') ? toShop : true, std, points: $state.snapshot(points), labels: $state.snapshot(labels) });
    if (res.error) return (msg = t(res.error));
    busy = true;
    try {
      const undo = await saveOwn(res.def, { only: !def && !forAll ? bike.id : null });
      onsaved?.(res.def, undo);
      dialog.close();
    } catch (err) {
      msg = err.message || t('This could not be saved.');
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet vdlg from-below ownb" bind:this={dialog} use:backClose {onclose} aria-labelledby="ownb-h" data-testid="own-block">
  <div class="vd-head">
    <div class="vd-t"><h2 id="ownb-h">{def ? t('Edit own block') : t('New own block')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <label class="fld"><span class="flbl">{t('Title')}</span><input class="inp" maxlength="40" bind:value={title} placeholder={t('e.g. Before dropping it off')} /></label>

  <div class="fld">
    <span class="flbl" id="ownb-kind">{t('Kind')}</span>
    <div class="vd-chips" role="group" aria-labelledby="ownb-kind">
      {#each OWN_KINDS as k (k)}<button type="button" class="vd-chip" aria-pressed={kind === k} disabled={locked && kind !== k} onclick={() => (kind = k)}>{t(KIND[k][0])}</button>{/each}
    </div>
    <small class="hint">{locked ? t('The kind can only change while the block is empty on all bikes.') : t(KIND[kind][1])}</small>
  </div>

  {#if kind === 'text'}
    <label class="fld"><span class="flbl">{t('Standard text (optional)')}</span><textarea class="inp" rows="2" bind:value={std}></textarea><small class="hint">{t('Shows on every bike until you write its own text.')}</small></label>
  {:else}
    {@const list = kind === 'check' ? points : labels}
    <div class="fld">
      <span class="flbl">{kind === 'check' ? t('Points') : t('Values|block')}</span>
      <ul class="pts" use:sortable={{ onmove: movePoint }}>
        {#each list as p, i (p.id)}
          <li data-sort-id={p.id}>
            <SortGrip name={p.text} onstep={(d) => i + d >= 0 && i + d < list.length && movePoint(i, i + d)} />
            <input class="inp" aria-label={kind === 'check' ? t('Point') : t('Label')} bind:value={p.text} />
            {#if kind === 'values'}<input class="inp unit" aria-label={t('Unit (optional)')} placeholder={t('Unit (optional)')} bind:value={p.unit} />{/if}
            <button type="button" class="xb" aria-label={t('Remove {name}', { name: p.text })} onclick={() => (kind === 'check' ? (points = points.filter((x) => x.id !== p.id)) : (labels = labels.filter((x) => x.id !== p.id)))}><X size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
      <div class="add">
        <input class="inp" bind:value={fresh} placeholder={kind === 'check' ? t('e.g. Take off the bags') : t('Label')} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addPoint())} />
        <button type="button" class="lk" onclick={addPoint}><Plus size={16} aria-hidden="true" />{kind === 'check' ? t('Add point') : t('Add value')}</button>
      </div>
    </div>
  {/if}

  <div class="fld">
    <span class="flbl" id="ownb-where">{t('Show on')}</span>
    <div class="vd-chips" role="group" aria-labelledby="ownb-where">
      {#each WHERE as [k, name] (k)}<button type="button" class="vd-chip" aria-pressed={where === k} onclick={() => (where = k)}>{t(name)}</button>{/each}
    </div>
  </div>

  {#if !def}
    <div class="fld">
      <span class="flbl" id="ownb-for">{t('For|bikes')}</span>
      <div class="vd-chips" role="group" aria-labelledby="ownb-for">
        <button type="button" class="vd-chip" aria-pressed={forAll} onclick={() => (forAll = true)}>{t('For all bikes')}</button>
        <button type="button" class="vd-chip" aria-pressed={!forAll} onclick={() => (forAll = false)}>{t('Only for {bike}', { bike: bike.name })}</button>
      </div>
    </div>
  {/if}

  {#if where !== 'pass'}
    <div class="shop">
      <span><b>{t('In the text to the bike shop')}</b><small>{t('Off: only on the sheet and the PDF, for you.')}</small></span>
      <BlockSwitch on={toShop} label={t('In the text to the bike shop')} onchange={(v) => (toShop = v)} />
    </div>
  {/if}

  {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" disabled={busy} onclick={save} data-own-save>{t('Save')}</button>
  </div>
</dialog>

<style>
  .fld {
    display: grid;
    gap: 6px;
    margin: 0 0 14px;
  }
  .flbl {
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pts {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pts li {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--paper);
  }
  .pts .inp {
    flex: 1;
    min-width: 0;
  }
  .pts .unit {
    flex: 0 0 90px;
  }
  .xb {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .add {
    display: grid;
    gap: 4px;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: 500 var(--fs-small) var(--font-body);
    text-decoration: underline;
    cursor: pointer;
    justify-self: start;
  }
  .shop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .shop span {
    display: grid;
    gap: 2px;
  }
  .shop small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
  }
</style>
