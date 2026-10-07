<script>
  import { db } from '../db.js';
  import { RIDES, RAIN_ITEM } from '../layers.js';
  import { CATEGORIES, CATEGORY, BAGS, BAG, OWNERSHIP, ROLES, SETS, formatWeight, itemWeight, nextId, parseGrams } from '../gear.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { DOMAINS, itemDomains, domainName } from '../domains.js';

  /**
   * item: the item to show, or null for "Add item".
   * readOnly: on the phone the inventory is for looking things up and weighing only,
   * so there the dialog shows the details plus a weight field.
   */
  let { item, items, readOnly = false, preset = {}, onsaved = null, onclose } = $props();

  // svelte-ignore state_referenced_locally
  const isNew = !item;
  // A copy to edit; nothing is saved until "Save".
  // svelte-ignore state_referenced_locally
  let draft = $state(
    item
      ? { ...item, role: item.role ?? '', model: item.model ?? '', grams: item.weightG ?? '', domains: itemDomains(item), favNote: item.favNote ?? '', ...layerFields(item) }
      : { id: '', name: '', brand: '', model: '', category: 'elec', grams: '', qty: 1, defaultBag: 'top', ownership: 'owned', role: '', note: '', sets: [], kits: [], domains: ['bikepacking'], ...preset, ...layerFields(preset) },
  );
  // Layers (round C answer 2): kept as text while editing, numbers in the database.
  function layerFields(src) {
    return { ride: src.ride ?? '', rain: src.rain ?? '', coldBelow: src.coldBelow ?? '', perHours: src.perHours ?? '', waterL: src.waterL ?? '', maxQty: src.maxQty ?? '', replaces: src.replaces ?? '', altFor: src.altFor ?? '' };
  }
  const numOrNull = (v) => (String(v).trim() === '' || !Number.isFinite(Number(String(v).replace(',', '.'))) ? null : Number(String(v).replace(',', '.')));
  let error = $state('');
  let dialog;

  $effect(() => {
    dialog.showModal();
  });

  async function save(event) {
    event.preventDefault();
    if (!draft.name.trim()) return (error = t('Give the item a name.'));
    let weightG = null;
    if (String(draft.grams).trim() !== '') {
      weightG = parseGrams(draft.grams);
      if (weightG == null) return (error = t('Weight: whole grams from 1 to 30,000, or leave it empty.'));
    }
    const { grams, ...rest } = $state.snapshot(draft); // a plain copy for the database
    const record = {
      ...rest,
      id: isNew ? nextId(items, rest.category) : rest.id,
      name: rest.name.trim(),
      qty: Math.max(1, Number(rest.qty) || 1),
      role: rest.role || null,
      always: rest.always ? true : null,
      favorite: rest.favorite ? true : null,
      favNote: rest.favorite ? rest.favNote?.trim() || null : (item?.favNote ?? null),
      domains: rest.domains?.length ? rest.domains : ['bikepacking'],
      ride: rest.ride || null,
      rain: rest.rain || null,
      coldBelow: numOrNull(rest.coldBelow),
      perHours: numOrNull(rest.perHours),
      waterL: numOrNull(rest.waterL),
      maxQty: numOrNull(rest.maxQty),
      replaces: rest.replaces || null,
      altFor: rest.altFor || null,
      weightG,
      weightStatus: weightG == null ? 'missing' : weightG !== item?.weightG ? 'measured' : item.weightStatus,
      updatedAt: new Date().toISOString(),
    };
    await db.items.put(record);
    await onsaved?.(record);
    dialog.close();
  }

  async function remove() {
    if (!confirm(t('Delete "{name}" from your gear? A backup file can bring it back.', { name: nameOf(item) }))) return;
    await db.items.delete(item.id);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="item-h">
  <form onsubmit={save} novalidate>
    <p class="meta">
      <span class="sw" style:background={CATEGORY[draft.category]?.color}></span>
      {t(CATEGORY[draft.category]?.name ?? '')}{draft.id ? ` · ${draft.id}` : ''}
    </p>
    <h2 id="item-h" class="title">{isNew ? t('Add item') : nameOf(item)}</h2>

    {#if readOnly}
      <dl class="facts">
        {#if item.brand}<div><dt>{t('Brand')}</dt><dd>{item.brand}</dd></div>{/if}
        {#if item.model}<div><dt>{t('Model')}</dt><dd>{item.model}</dd></div>{/if}
        <div><dt>{t('Default bag')}</dt><dd>{BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–'}</dd></div>
        <div><dt>{t('Status')}</dt><dd>{t(OWNERSHIP[item.ownership] ?? '')}</dd></div>
        {#if item.role}<div><dt>{t('Role')}</dt><dd>{t(ROLES[item.role] ?? '')}</dd></div>{/if}
        {#if item.always}<div><dt>{t('Trips')}</dt><dd>{t('On every trip')}</dd></div>{/if}
        {#if item.favorite}<div><dt>{t('Favourite')}</dt><dd>★ {item.favNote || t('Tested, one of my best items')}</dd></div>{/if}
        <div><dt>{t('Areas')}</dt><dd>{itemDomains(item).map((d) => t(domainName(d))).join(', ')}</dd></div>
        {#if item.ride}<div><dt>{t('Layer')}</dt><dd>{t(RIDES.find((r) => r.key === item.ride)?.name ?? '')}</dd></div>{/if}
        {#if item.coldBelow != null}<div><dt>{t('Add when colder than')}</dt><dd>{item.coldBelow} °C</dd></div>{/if}
        {#if item.rain}<div><dt>{t('Rain')}</dt><dd>{t(RAIN_ITEM[item.rain] ?? '')}</dd></div>{/if}
        {#if item.perHours}<div><dt>{t('Amount')}</dt><dd>{t('1 per {n} h', { n: item.perHours })}{item.maxQty ? `, ${t('at most {n}', { n: item.maxQty })}` : ''}</dd></div>{/if}
        {#if item.replaces}<div><dt>{t('When worn, instead of')}</dt><dd>{nameOf(items.find((i) => i.id === item.replaces)) || item.replaces}</dd></div>{/if}
        {#if item.sets?.length}<div><dt>{t('Overnight set')}</dt><dd>{item.sets.map((s) => (SETS[s] ? t(SETS[s]) : s)).join(', ')}</dd></div>{/if}
        {#if item.qty > 1}<div><dt>{t('Quantity')}</dt><dd>{item.qty} × {formatWeight(item.weightG)} = {formatWeight(itemWeight(item))}</dd></div>{/if}
      </dl>
      {#if item.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
      {#if item.note}<p class="note">{item.note}</p>{/if}
      <label class="lbl" for="i-g">{t('Weight of one piece (g)')}</label>
      <input id="i-g" class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} />
    {:else}
      <div class="grid">
        <label class="wide"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={draft.name} required /></label>
        <label><span class="lbl">{t('Brand')}</span><input class="inp" bind:value={draft.brand} placeholder={t('e.g. {x}', { x: 'Garmin' })} /></label>
        <label><span class="lbl">{t('Model / colour')}</span><input class="inp" bind:value={draft.model} placeholder={t('e.g. {x}', { x: 'Edge 1040 Solar' })} /></label>
        <label>
          <span class="lbl">{t('Category')}</span>
          <select class="sel" bind:value={draft.category} disabled={!isNew} title={isNew ? '' : t('The category is part of the ID')}>
            {#each CATEGORIES as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
          </select>
        </label>
        <label><span class="lbl">{t('Weight of one piece (g)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.grams} placeholder={t('not weighed')} /></label>
        <label><span class="lbl">{t('Quantity')}</span><input class="inp num" type="number" min="1" bind:value={draft.qty} /></label>
        <label>
          <span class="lbl">{t('Default bag')}</span>
          <select class="sel" bind:value={draft.defaultBag}>
            {#each BAGS as b (b.key)}<option value={b.key}>{t(b.name)}</option>{/each}
          </select>
        </label>
        <label>
          <span class="lbl">{t('Status')}</span>
          <select class="sel" bind:value={draft.ownership}>
            {#each Object.entries(OWNERSHIP) as [k, v] (k)}<option value={k}>{t(v)}</option>{/each}
          </select>
        </label>
        <label>
          <span class="lbl">{t('Role on every ride')}</span>
          <select class="sel" bind:value={draft.role}>
            <option value="">{t('No role')}</option>
            {#each Object.entries(ROLES) as [k, v] (k)}<option value={k}>{t(v)}</option>{/each}
          </select>
        </label>
        <label class="cb wide always"><input type="checkbox" bind:checked={draft.always} /> {t('On every trip (always with me: every new trip gets it)')}</label>
        <label class="cb wide always"><input type="checkbox" bind:checked={draft.favorite} /> ★ {t('Favourite (tested, one of my best items)')}</label>
        {#if draft.favorite}
          <label class="wide"><span class="lbl">{t('Why it is a favourite')}</span><input class="inp" bind:value={draft.favNote} placeholder={t('e.g. Warm, packs small, never let me down')} /></label>
        {/if}
        <!-- v0.21.0 (package 5): one inventory, an item can belong to several areas. -->
        <fieldset class="wide sets">
          <legend class="lbl">{t('Areas (new trips of an area suggest its items)')}</legend>
          {#each DOMAINS as d (d.key)}
            {@const on = draft.domains?.includes(d.key)}
            <label class="cb"><input type="checkbox" checked={on} disabled={on && draft.domains.length === 1} onchange={(e) => (draft.domains = e.currentTarget.checked ? [...(draft.domains ?? []), d.key] : (draft.domains ?? []).filter((x) => x !== d.key))} /> {t(d.name)}</label>
          {/each}
        </fieldset>
        <fieldset class="wide sets">
          <legend class="lbl">{t('Overnight sets (Pack adds them with one switch)')}</legend>
          {#each Object.entries(SETS) as [k, v] (k)}
            <label class="cb"><input type="checkbox" checked={draft.sets?.includes(k)} onchange={(e) => (draft.sets = e.currentTarget.checked ? [...(draft.sets ?? []), k] : (draft.sets ?? []).filter((x) => x !== k))} /> {t(v).replace(/^(Night|Nacht): /, '')}</label>
          {/each}
        </fieldset>
        <fieldset class="wide layers">
          <legend class="lbl">{t('Layers (Pack adds them for the ride and the weather)')}</legend>
          <label><span class="lbl">{t('From this ride on')}</span>
            <select class="sel" bind:value={draft.ride}>
              <option value="">–</option>
              {#each RIDES.filter((r) => r.key !== 'every') as r (r.key)}<option value={r.key}>{t(r.name)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Add when colder than (°C)')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.coldBelow} placeholder={t('e.g. {x}', { x: '10' })} /></label>
          <label><span class="lbl">{t('When it rains')}</span>
            <select class="sel" bind:value={draft.rain}>
              <option value="">–</option>
              {#each Object.entries(RAIN_ITEM) as [k, v] (k)}<option value={k}>{v === 'Rain' ? t('Always take it') : t('Offer it')}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('1 piece per … riding hours')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.perHours} placeholder={t('e.g. {x}', { x: '3' })} /></label>
          <label><span class="lbl">{t('At most … pieces')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={draft.maxQty} placeholder={t('e.g. {x}', { x: '2' })} /></label>
          <label><span class="lbl">{t('When worn, instead of')}</span>
            <select class="sel" bind:value={draft.replaces}>
              <option value="">–</option>
              {#each items.filter((i) => (i.role === 'worn' || i.role === 'standard') && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Can be taken instead of')}</span>
            <select class="sel" bind:value={draft.altFor}>
              <option value="">–</option>
              {#each items.filter((i) => i.ride && i.id !== draft.id) as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
            </select>
          </label>
          <label><span class="lbl">{t('Water in it (L)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.waterL} placeholder={t('e.g. {x}', { x: '0.75' })} /></label>
        </fieldset>
        <label class="wide"><span class="lbl">{t('Note')}</span><textarea class="inp" rows="2" bind:value={draft.note}></textarea></label>
      </div>
      {#if item?.learning}<p class="note"><b>{t('Learning:')}</b> {item.learning}</p>{/if}
    {/if}

    <p class="err" role="alert">{error}</p>
    <div class="foot">
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      {#if !isNew && !readOnly}<button type="button" class="btn del" onclick={remove}>{t('Delete')}</button>{/if}
    </div>
  </form>
</dialog>

<style>
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  h2 {
    font-size: 32px;
    margin: 4px 0 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .sets {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }
  .layers {
    border: 0;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px 12px;
  }
  .layers legend {
    margin-bottom: 4px;
  }
  .sets legend {
    margin-bottom: 4px;
  }
  .cb {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .facts {
    display: grid;
    gap: 6px;
    margin: 0 0 12px;
  }
  .facts div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 4px;
  }
  dt {
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
  }
  .note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 10px 0;
  }
  .err {
    color: #b42318;
    min-height: 1.2em;
    font-size: 14px;
  }
  .foot {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .del {
    margin-left: auto;
    border-color: #b42318;
    color: #b42318;
  }
</style>
