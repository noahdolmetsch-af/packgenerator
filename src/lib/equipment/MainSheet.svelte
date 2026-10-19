<script>
  /**
   * AU1 «Ausrüstung» (Noah 15.10.2026 «1-5a»): one sheet to make an item of Material main equipment
   * (3a: it comes from Material) or to change it: the item, its sport, what its counter counts and its
   * care steps, each with an interval in its own unit. The care steps come filled in as suggestions
   * (maingear.js careSuggest); each can be changed or removed.
   * mode 'use': one use by hand (a day, and hours or km for those counters).
   * onsave(values) saves; it may return a text to show as the error.
   */
  import { tick } from 'svelte';
  import { X, Plus, Trash2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import DateInput from '../ui/DateInput.svelte';
  import { UNITS, careSuggest, unitSuggest } from '../maingear.js';
  import { localDay } from '../localday.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import '../ui/daumen.css';

  let { mode = 'add', item = null, main = null, items = [], sports = [], sportName, sport: sportStart = null, onsave, onclose } = $props();

  const today = localDay();
  // svelte-ignore state_referenced_locally
  let f = $state({
    itemId: item?.id ?? null,
    sport: main?.sport ?? sportStart ?? sports[0]?.key ?? '',
    unit: main?.unit ?? 'uses',
    since: main?.since ?? '',
    care: (main?.care ?? []).map((c) => ({ ...c })),
    day: today,
    n: 1,
    amount: '',
  });
  // svelte-ignore state_referenced_locally
  let touched = $state(!!main); // the care rows were filled once (by hand or as suggestions)
  let query = $state('');
  let error = $state('');
  let dialog;
  let first = $state(null);
  $effect(() => {
    dialog.showModal();
    tick().then(() => first?.focus());
  });

  const picked = $derived(items.find((i) => i.id === f.itemId) ?? item);
  const found = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist' && i.ownership !== 'to-buy' && !i.main);
    return (q ? list.filter((i) => nameOf(i).toLowerCase().includes(q)) : list).slice(0, 8);
  });
  // the suggestions follow the item and the sport until the care rows are touched
  $effect(() => {
    if (mode === 'use' || touched || !f.sport) return;
    const name = picked ? nameOf(picked) : '';
    f.care = careSuggest(f.sport, name).map((c) => ({ ...c }));
    f.unit = unitSuggest(f.sport, name);
  });
  const unitName = (u) => (u === 'hours' ? t('hours') : u === 'km' ? t('km') : u === 'days' ? t('days') : t('uses'));

  function addCare() {
    touched = true;
    f.care = [...f.care, { name: '', every: 10, unit: f.unit }];
  }
  function dropCare(i) {
    touched = true;
    f.care = f.care.filter((_, j) => j !== i);
  }

  async function save(e) {
    e?.preventDefault();
    if (mode !== 'use' && !f.itemId) return (error = t('Choose an item from your gear.'));
    if (mode !== 'use' && !f.sport) return (error = t('Choose a sport.'));
    const v = mode === 'use' ? { day: f.day, n: main?.unit === 'uses' || main?.unit === 'days' ? Number(f.n) || 1 : 1, h: main?.unit === 'hours' ? Number(f.amount) || 0 : 0, km: main?.unit === 'km' ? Number(f.amount) || 0 : 0 } : { itemId: f.itemId, sport: f.sport, unit: f.unit, since: f.since, care: f.care };
    const res = await onsave?.(v);
    if (typeof res === 'string') return (error = res);
    dialog.close();
  }
  const title = $derived(mode === 'use' ? t('Log a use') : mode === 'edit' ? t('Change equipment') : t('Add equipment'));
</script>

<dialog class="sheet from-below mgs" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="mgs-h" data-main-sheet>
  <form onsubmit={save} novalidate>
    <div class="head">
      <div class="hd">{#if picked && mode !== 'add'}<p class="kick">{nameOf(picked)}</p>{/if}<h2 id="mgs-h">{title}</h2></div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>

    {#if mode === 'use'}
      <div class="two">
        <label class="fld"><span class="lbl">{t('Day')}</span><DateInput bind:value={f.day} max={today} /></label>
        {#if main?.unit === 'hours'}<label class="fld"><span class="lbl">{t('Hours')}</span><input class="inp num" bind:this={first} type="text" inputmode="decimal" bind:value={f.amount} maxlength="5" data-mg-amount /></label>
        {:else if main?.unit === 'km'}<label class="fld"><span class="lbl">{t('Kilometres')}</span><input class="inp num" bind:this={first} type="text" inputmode="decimal" bind:value={f.amount} maxlength="6" data-mg-amount /></label>
        {:else}<label class="fld"><span class="lbl">{t('Uses')}</span><input class="inp num" bind:this={first} type="text" inputmode="numeric" bind:value={f.n} maxlength="3" data-mg-amount /></label>{/if}
      </div>
    {:else}
      {#if mode === 'add' && !item}
        <fieldset class="fld">
          <legend class="lbl">{t('Item from your gear')}</legend>
          <input class="inp" bind:this={first} type="search" bind:value={query} placeholder={t('Search Material')} autocomplete="off" data-mg-search />
          <ul class="pick" role="list">
            {#each found as i (i.id)}
              <li><label class="opt"><input type="radio" name="mg-item" value={i.id} bind:group={f.itemId} onchange={() => (error = '')} /><span>{nameOf(i)}</span></label></li>
            {:else}
              <li class="none">{t('No item found. Add it under Material first.')}</li>
            {/each}
          </ul>
        </fieldset>
      {/if}
      <fieldset class="fld">
        <legend class="lbl">{t('Sport')}</legend>
        <div class="chips">
          {#each sports as s (s.key)}<button type="button" class="chip" aria-pressed={f.sport === s.key} onclick={() => (f.sport = s.key)} data-mg-sport={s.key}>{sportName(s)}</button>{/each}
        </div>
      </fieldset>
      <fieldset class="fld">
        <legend class="lbl">{t('The counter counts')}</legend>
        <div class="chips">
          {#each UNITS as u (u)}<button type="button" class="chip" aria-pressed={f.unit === u} onclick={() => ((f.unit = u), (touched = true))} data-mg-unit={u}>{unitName(u)}</button>{/each}
        </div>
      </fieldset>
      <fieldset class="fld">
        <legend class="lbl">{t('Care')}</legend>
        {#each f.care as c, i (i)}
          <div class="care" data-mg-care>
            <input class="inp" bind:value={c.name} oninput={() => (touched = true)} maxlength="60" aria-label={t('Care step')} placeholder={t('e.g. Wax the base')} />
            <span class="ev">{t('every')}</span>
            <input class="inp num every" bind:value={c.every} oninput={() => (touched = true)} inputmode="numeric" maxlength="4" aria-label={t('Interval')} />
            <select class="inp unit" bind:value={c.unit} onchange={() => (touched = true)} aria-label={t('Unit|care')}>{#each UNITS as u (u)}<option value={u}>{unitName(u)}</option>{/each}</select>
            <button type="button" class="ib" aria-label={t('Remove this care step')} onclick={() => dropCare(i)}><Trash2 size={18} aria-hidden="true" /></button>
          </div>
        {:else}
          <p class="hint">{t('No care step. Add one if you like.')}</p>
        {/each}
        <button type="button" class="btn sm add" onclick={addCare} data-mg-addcare><Plus size={16} aria-hidden="true" />{t('Add a care step')}</button>
      </fieldset>
      <label class="fld"><span class="lbl">{t('Counts from (optional)')}</span><DateInput bind:value={f.since} max={today} /></label>
      <p class="hint">{t('Uses come by themselves from your trips and from Aktiv. All of it is a suggestion: change or remove what does not fit.')}</p>
    {/if}
    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <div class="foot daumen-foot">
      <button type="submit" class="btn hi" data-mg-save>{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  .mgs {
    width: min(560px, calc(100vw - 24px));
  }
  form {
    display: grid;
    gap: 14px;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .hd {
    min-width: 0;
  }
  .kick {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .head .ib {
    margin: -6px -6px 0 0;
  }
  .fld {
    display: grid;
    gap: 6px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .fld .inp {
    width: 100%;
    min-height: 48px;
    box-sizing: border-box;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 12px;
  }
  .pick {
    display: grid;
    gap: 2px;
    max-height: 260px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 8px;
    border-radius: 8px;
    cursor: pointer;
  }
  .opt:has(input:checked) {
    background: var(--paper-2);
    font-weight: 600;
  }
  .opt input {
    width: 20px;
    height: 20px;
    margin: 0;
  }
  .none,
  .hint,
  .err {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .care {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 64px minmax(0, 110px) 44px;
    gap: 6px;
    align-items: center;
  }
  .care .inp {
    min-height: 44px;
  }
  .ev {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 519px) {
    .care {
      grid-template-columns: auto 64px minmax(0, 1fr) 44px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
    }
    .care .inp:first-child {
      grid-column: 1 / -1;
    }
  }
  .add {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .foot {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
</style>
