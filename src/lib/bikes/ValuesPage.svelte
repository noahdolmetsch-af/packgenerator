<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * «Bugfix Dateneingabe» D2–D4 (Noah 13.10.2026, «1a 2a 3b 4b 5a», «D1–D4 freigegeben»): «Enter values»,
   * every value of one bike on one page, in groups (valuefields.js). Each field saves as soon as it is
   * left; «Next» on the phone's keyboard goes to the next field. «Choose fields» (D3) shows or hides
   * fields for all bikes, only on this page; «+ Own field» (D4) adds a field with name, unit, kind
   * and group. Reached from Equipment («Enter values») and from «Change values» on the sheets.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { FIELDS_KEY, VALUE_GROUPS, valueGroups, valueOf, setValue, toggleField, showAll, addOwnField, renameOwnField, removeOwnField, fieldsOf } from '../valuefields.js';
  import { t, num } from '../i18n.svelte.js';
  import Help from '../ui/Help.svelte'; // FE14
  import { FIELD_HELP } from '../daumen.js';
  const VALUE_HELP = { 'fit:pressureF': 'pressure', 'fit:pressureR': 'pressure', 'fit:forkSag': 'sag', 'fit:shockSag': 'sag' };
  import { Plus, Trash2, Bike as BikeIcon } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import { wantBike } from '../nav.js';
  import VeloHead from './VeloHead.svelte';
  import PressureHint from './PressureHint.svelte'; // «Werte messen» W4a
  import '../ui/daumen.css'; // FE1

  let { bikeId = null, onbike } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const fieldsQ = liveQuery(() => db.settings.get(FIELDS_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const stored = $derived($fieldsQ?.value ?? null);
  const page = $derived(bike ? valueGroups(bike, stored) : { groups: [], filled: 0, total: 0 });
  const order = $derived(page.groups.flatMap((g) => g.rows.map((r) => r.id)));

  const show = (v) => (v == null || v === '' ? '' : typeof v === 'number' ? num(v) : String(v));
  const saveFields = (value) => db.settings.put({ key: FIELDS_KEY, value: JSON.parse(JSON.stringify(value)) });

  /* ---------- one field: saved when it is left; Enter goes to the next one ---------- */
  async function save(row, text) {
    const b = await db.bikes.get(bike.id);
    if (!b || show(valueOf(b, row)) === text.trim()) return;
    await db.bikes.update(b.id, setValue(b, row, text));
  }
  function next(e, id) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const n = order.indexOf(id);
    const to = order[n + 1];
    if (to) document.getElementById(`ve-${to}`)?.focus();
    else e.currentTarget.blur();
  }

  /* ---------- D3: choose fields (for all bikes, only here) ---------- */
  let chooseDlg = $state();
  let choosing = $state(false);
  const all = $derived(valueGroups(null, stored, { all: true }));
  const hiddenN = $derived(fieldsOf(stored).hidden.length);
  const shownN = $derived(all.groups.reduce((s, g) => s + g.rows.length, 0) - hiddenN);
  $effect(() => {
    if (choosing && chooseDlg && !chooseDlg.open) chooseDlg.showModal();
  });

  /* ---------- D4: an own field ---------- */
  let ownDlg = $state();
  let own = $state(null); // { name, unit, num, group }
  let ownErr = $state('');
  $effect(() => {
    if (own && ownDlg && !ownDlg.open) ownDlg.showModal();
  });
  const newOwn = (group) => {
    ownErr = '';
    own = { name: '', unit: '', num: true, group };
  };
  async function addOwn() {
    const r = addOwnField(stored, $state.snapshot(own));
    if (!r) {
      ownErr = t('Give the field a name.');
      return;
    }
    await saveFields(r.fields);
    ownDlg?.close();
  }
</script>

<div class="vp">
  {#if !bikes.length && $bikesQ}
    <h1 class="title">{t('Enter values')}</h1>
    <!-- v0.127.0 A-U2: the shared empty building block -->
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }}>{t('Or import your data on the')} <a href="#/">{t('start page')}</a>.</Empty>
  {:else if bike}
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: bike.name, href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Equipment|tab'), href: bikesHash({ tab: 'compare', bike: bike.id }) }]}
      here={t('Enter values')}
      title={t('Enter values')}
      sub={[bike.name, t('{n} of {all} fields filled', { n: page.filled, all: page.total }), t('every entry saves at once')].join(' · ')}
    >
      <button type="button" class="btn" onclick={() => (choosing = true)}>{t('Choose fields')}</button>
      <!-- FE1: on a phone «Done» sits at the bottom, in reach of the thumb -->
      <span class="daumen"><a class="btn hi" href={bikesHash({ tab: 'compare', bike: bike.id })}>{t('Done')}</a></span>
    </VeloHead>
    {#if bikes.length > 1}
      <div class="bchips" role="group" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<button type="button" class="bchip" aria-pressed={b.id === bike.id} onclick={() => onbike?.(b.id)}>{b.name}</button>{/each}
      </div>
    {/if}
    <p class="note">{t('«Next» on the keyboard goes to the next field. Empty fields may stay empty.')}</p>

    {#key bike.id}
      <div class="grid">
        {#each page.groups as g (g.key)}
          <section class="card grp" aria-labelledby="vp-{g.key}">
            <h2 id="vp-{g.key}">{t(g.name)}<small>{t('{n} of {all}|filled', { n: g.filled, all: g.total })}</small></h2>
            {#each g.rows as r (r.id)}
              <div class="row">
                <!-- FE14: a difficult value gets a «?» next to its label (outside it, so the field keeps its name) -->
                <label class="l" for="ve-{r.id}">{t(r.label)}{#if r.own}<span class="own">{t('own field')}</span>{/if}</label>{#if VALUE_HELP[r.id]}<Help field="ve-{r.id}" text={t(FIELD_HELP[VALUE_HELP[r.id]])} />{/if}
                <span class="in">
                  <input
                    id="ve-{r.id}"
                    class="box"
                    class:txt={!r.num}
                    type="text"
                    inputmode={r.num ? 'decimal' : 'text'}
                    enterkeyhint={r.id === order[order.length - 1] ? 'done' : 'next'}
                    autocomplete="off"
                    value={show(r.value)}
                    placeholder="–"
                    onkeydown={(e) => next(e, r.id)}
                    onchange={(e) => save(r, e.currentTarget.value)}
                  />
                  {#if r.num || r.unit}<span class="u">{r.unit}</span>{/if}
                </span>
              </div>
              <!-- «Werte messen» W4a: under the target pressure, a suggestion and «calculate» -->
              {#if r.id === 'fit:pressureR' || (r.id === 'fit:pressureF' && !g.rows.some((x) => x.id === 'fit:pressureR'))}<div class="phrow"><PressureHint bikeId={bike.id} /></div>{/if}
            {/each}
            <button type="button" class="add" onclick={() => newOwn(g.key)}><Plus size={16} aria-hidden="true" />{t('Own field')}</button>
          </section>
        {/each}
      </div>
    {/key}
  {/if}
</div>

{#if choosing}
  <dialog use:backClose class="sheet" bind:this={chooseDlg} onclose={() => (choosing = false)} aria-labelledby="vp-ch-h">
    <p class="meta">{t('For all bikes')}</p>
    <h2 id="vp-ch-h" class="title">{t('Choose fields')}</h2>
    <p class="quiet">{t('{shown} shown · {hidden} hidden. For all bikes and only here when entering. Bike pass, Pick-up check and Equipment still show everything. The values stay saved.', { shown: shownN, hidden: hiddenN })}</p>
    {#each all.groups as g (g.key)}
      <h3 class="gh">{t(g.name)}</h3>
      {#each g.rows as r (r.id)}
        <div class="srow">
          {#if r.own}
            <input class="inp oname" type="text" aria-label={t('Name of the own field')} value={r.label} onchange={(e) => saveFields(renameOwnField(stored, r.id, e.currentTarget.value))} />
            <button type="button" class="icon" aria-label={t('Delete own field {name}', { name: r.label })} onclick={() => saveFields(removeOwnField(stored, r.id))}><Trash2 size={18} /></button>
          {:else}
            <span class="sl" class:off={r.hidden}>{t(r.label)}{#if r.hidden}<small>{t('hidden')}</small>{/if}</span>
          {/if}
          <button type="button" class="switch" role="switch" aria-checked={!r.hidden} aria-label={t('Show {field}', { field: r.own ? r.label : t(r.label) })} onclick={() => saveFields(toggleField(stored, r.id, r.hidden))}><span class="knob"></span></button>
        </div>
      {/each}
    {/each}
    <div class="acts sticky">
      <button type="button" class="btn hi" onclick={() => chooseDlg.close()}>{t('Done')}</button>
      <button type="button" class="btn" disabled={!hiddenN} onclick={() => saveFields(showAll(stored))}>{t('Show all')}</button>
    </div>
  </dialog>
{/if}

{#if own}
  <dialog use:backClose class="sheet" bind:this={ownDlg} onclose={() => (own = null)} aria-labelledby="vp-own-h">
    <p class="meta">{t('For all bikes')}</p>
    <h2 id="vp-own-h" class="title">{t('Own field')}</h2>
    <p class="quiet">{t('A value the app does not know yet. Every bike gets the field empty, you fill it where it fits.')}</p>
    <form method="dialog" onsubmit={(e) => (e.preventDefault(), addOwn())}>
      <label class="fld">
        <span class="lbl">{t('Name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp" type="text" autocomplete="off" bind:value={own.name} autofocus />
      </label>
      <label class="fld">
        <span class="lbl">{t('Unit (free, may stay empty)')}</span>
        <input class="inp" type="text" autocomplete="off" bind:value={own.unit} />
      </label>
      <p class="lbl">{t('Kind')}</p>
      <div class="chips" role="group" aria-label={t('Kind')}>
        <button type="button" class="chip" aria-pressed={own.num} onclick={() => (own.num = true)}>{t('Number')}</button>
        <button type="button" class="chip" aria-pressed={!own.num} onclick={() => (own.num = false)}>{t('Text')}</button>
      </div>
      <p class="lbl">{t('Group')}</p>
      <div class="chips" role="group" aria-label={t('Group')}>
        {#each VALUE_GROUPS as g (g.key)}<button type="button" class="chip" aria-pressed={own.group === g.key} onclick={() => (own.group = g.key)}>{t(g.name)}</button>{/each}
      </div>
      {#if ownErr}<p class="err" role="alert">{ownErr}</p>{/if}
      <div class="acts">
        <button type="submit" class="btn hi">{t('Add field')}</button>
        <button type="button" class="btn" onclick={() => ownDlg.close()}>{t('Cancel')}</button>
      </div>
      <p class="quiet">{t('Rename or delete it later under «Choose fields».')}</p>
    </form>
  </dialog>
{/if}

<style>
  .bchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: -4px 0 16px;
  }
  .bchip,
  .chip {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .bchip[aria-pressed='true'],
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .note {
    margin: 0 0 14px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .grid {
    display: grid;
    gap: 14px;
  }
  @media (min-width: 900px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }
  }
  .grp {
    padding: 14px 16px 6px;
  }
  .grp h2 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 4px;
    font-size: var(--fs-section);
  }
  .grp h2 small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  /* FE14: while a «?» is open, its sentence takes its own line below the row */
  .row:has(> :global(.help)) {
    flex-wrap: wrap;
  }
  .row :global(.help) {
    order: 3;
    margin: 0 0 4px;
  }
  .l {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .own {
    display: inline-block;
    margin-left: 6px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    vertical-align: middle;
  }
  .in {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .box {
    width: 104px;
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid var(--line-strong);
    border-radius: 10px;
    background: var(--input, var(--paper));
    color: var(--ink);
    font: var(--fs-sub) var(--font-body);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .box.txt {
    width: 152px; /* ends where a number field's unit ends */
    text-align: left;
  }
  .box:focus {
    outline: 0;
    border: 2px solid var(--hi);
    box-shadow: 0 0 0 3px var(--hi-soft);
  }
  .u {
    width: 42px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 380px) {
    .box {
      width: 88px;
    }
    .box.txt {
      width: 128px;
    }
    .u {
      width: 34px;
    }
  }
  .add {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    padding: 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--hi);
    font: 600 var(--fs-body, 16px) var(--font-body);
    cursor: pointer;
  }
  .gh {
    margin: 14px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .srow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-top: 1px solid var(--line);
  }
  .sl {
    flex: 1;
    min-width: 0;
    font-weight: 500;
  }
  .sl.off {
    color: var(--ink-3);
  }
  .sl small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .oname {
    flex: 1;
    min-width: 0;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .switch {
    position: relative;
    flex: none;
    width: 52px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 26px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line);
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 7px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--input);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .switch[aria-checked='true']::before {
    background: var(--hi);
  }
  .switch[aria-checked='true'] .knob {
    left: 25px;
  }
  .fld {
    display: block;
    margin: 0 0 12px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 12px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0 4px;
  }
  .acts.sticky {
    position: sticky;
    bottom: -12px;
    padding: 8px 0 12px;
    background: var(--paper);
  }
  .err {
    color: var(--bad);
  }
  .phrow {
    margin: -4px 0 8px;
  }
</style>
