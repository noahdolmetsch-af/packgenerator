<script>
  /**
   * SN3+ «Bausteine je nach Lage» (mockup SN3f, Noah 13.10.2026 «SN3e–SN3g freigegeben»): one block
   * «je nach Lage» with its rule. Top: «Vorschlagen» (off: never suggested, but still there to choose
   * in Packen). «Kommt mit, wenn»: value, comparison, limit and unit, where the value comes from and the
   * standard. Then its items (× takes one out on «Speichern»), «Teile hinzufügen» (Gear in «Select») and
   * «Name». Bottom: «Zurücksetzen» (the standard rule into the form), «Abbrechen», «Speichern».
   * Nothing here touches a trip.
   *
   * block: a card of Bausteine (sets.js allSets + setView: key, name, items, inventory, g, missing);
   * rule: situation.js ruleOf(); onsave({ rule, out }): out = the item IDs to take out; onrename(); onclose().
   * «Gruppen überall» (Noah 18.10.2026): ondelete() asks to delete the block (built-in ones too).
   * v0.154.0 «Bausteine mehr» (mockup SN3i): a fixed second condition «und …» (NEED, e.g. «am See oder Fluss»,
   * with «noch von Hand»), a fixed «oder …» (OR: a pass, snow), the second limit of Erholung danach (ALT), and
   * for a bathing block the line that «Nasses trocken halten» comes with it.
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { X, Pencil, Plus, ChevronRight, Info, Trash2, Hand } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, tn, nameOf, num } from '../i18n.svelte.js';
  import { formatWeight, itemWeight, isInventory, knownWeight } from '../gear.js';
  import { blockIcon, blockTone } from '../blockicons.js';
  import { qtyOf } from '../sets.js';
  import { METRICS, NUMERIC, CMPS, DEFAULT_RULES, ruleOf, NEED, OR, ALT, BATHING_BLOCKS, OWN_RULE, ownRuleOf } from '../situation.js';
  import { cmpWord, unitOf, sourceLine, needLine, byHand } from '../situationtext.js';
  import { SETS } from '../gear.js';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { untilOf, seasonEnd } from '../tourenb/ruleuntil.js'; // Idee 50 (Touren b): a rule for one tour or a season

  let { block, rule, onsave, onrename, ondelete = null, onclose, own = false, until = null } = $props();
  // Paket H #260 «Regel-Editor»: own = an own block; every value can be its rule, the start is OWN_RULE

  let dialog;
  // svelte-ignore state_referenced_locally
  const start = own ? (ownRuleOf(rule) ?? { ...OWN_RULE }) : ruleOf(block.key, rule);
  let on = $state(start.on);
  let metric = $state(start.metric);
  let cmp = $state(start.cmp ?? 'gte');
  let limit = $state(start.limit != null ? String(start.limit) : '');
  let alt = $state(start.alt != null ? String(start.alt) : '');
  // Idee 50: how long the rule holds: always, one tour, or until a day (a season)
  const today = localDay();
  const season = seasonEnd(today);
  // svelte-ignore state_referenced_locally
  const u0 = untilOf(until);
  let holds = $state(u0?.tripId ? `trip:${u0.tripId}` : u0?.date ? 'date' : 'always');
  // svelte-ignore state_referenced_locally
  let holdDate = $state(u0?.date ?? season.date);
  const tripsQ = liveQuery(() => db.trips.toArray());
  const soon = $derived(
    ($tripsQ ?? [])
      .filter((x) => x && !x.finished && !x.skipped && (x.id === u0?.tripId || !x.startDate || x.startDate >= today))
      .sort((a, b) => String(a.startDate ?? '9999').localeCompare(String(b.startDate ?? '9999')))
      .slice(0, 8),
  );
  const untilNow = () => (holds.startsWith('trip:') ? { tripId: holds.slice(5) } : holds === 'date' ? untilOf({ date: holdDate }) : null);
  let out = $state([]); // items taken out, saved with «Speichern»
  let error = $state('');

  const std = $derived(own ? OWN_RULE : ruleOf(block.key, null));
  const bool = $derived(!!METRICS[metric]?.bool);
  const kept = $derived(block.items.filter((i) => !out.includes(i.id)));
  const Icon = $derived(blockIcon(block.key, block.name));
  const tone = $derived(blockTone(block.key, block.name));
  const toNum = (v) => (String(v).trim() === '' ? NaN : Number(String(v).replace(',', '.').replace(/[’']/g, '')));

  $effect(() => {
    dialog.showModal();
  });

  function reset() {
    const d = own ? OWN_RULE : DEFAULT_RULES[block.key];
    on = true;
    metric = d.metric;
    cmp = d.cmp ?? 'gte';
    limit = d.limit != null ? String(d.limit) : '';
    alt = d.alt != null ? String(d.alt) : '';
    out = [];
    error = '';
  }
  function pickMetric(m) {
    metric = m;
    if (m === std.metric) limit = String(std.limit);
    else if (own && !METRICS[m].bool && !String(limit).trim()) limit = '0';
  }

  async function save(e) {
    e?.preventDefault();
    const next = { on, metric };
    if (!bool) {
      const n = toNum(limit);
      const m = METRICS[metric];
      if (!Number.isFinite(n) || n < m.min || n > m.max) {
        error = t('The limit: a number from {min} to {max}.', { min: num(m.min), max: num(m.max) });
        return;
      }
      next.cmp = cmp;
      next.limit = n;
      if (ALT[block.key]) {
        const a = toNum(alt);
        if (!Number.isFinite(a) || a < ALT[block.key].min || a > ALT[block.key].max) {
          error = block.key === 'climb' ? t('The highest point: a number from 0 to 9000.') : t('The climbing a day: a number from 0 to 9000.');
          return;
        }
        next.alt = a;
      }
    }
    await onsave?.({ rule: next, out: [...out], until: untilNow() });
    dialog.close();
  }
</script>

<dialog use:keepTyped={'rule:' + block.key} class="sheet from-below rsheet" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="rs-h">
  <form onsubmit={save} novalidate>
    <div class="head">
      <div>
        <h2 id="rs-h">{block.name}</h2>
        <p class="sub num">{own ? t('Own building block with a rule') : t('Building block depending on the situation')} · {tn(kept.length, '{n} item', '{n} items')}{#if kept.length}{' · '}{knownWeight(block.g, block.missing)}{/if}</p>
      </div>
      <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
    </div>

    <div class="sugrow">
      <span class="tile tone-{tone}" aria-hidden="true"><Icon size={20} /></span>
      <span class="swt"><b id="rs-sug">{t('Suggest|rule')}</b><small>{t('Off: never comes by itself, but stays there to choose')}</small></span>
      <button type="button" class="switch" role="switch" aria-checked={on} aria-labelledby="rs-sug" onclick={() => (on = !on)}><span class="knob"></span></button>
    </div>

    <fieldset class="rule">
      <legend class="lbl">{t('Comes along when')}</legend>
      {#if own}
        <select class="sel ownm" aria-label={t('Value')} value={metric} onchange={(e) => pickMetric(e.currentTarget.value)}>
          {#each Object.keys(METRICS) as m (m)}<option value={m}>{t(METRICS[m].name)}</option>{/each}
        </select>
      {/if}
      {#if bool}
        {#if !own}<p class="boolr">{t(METRICS[metric].name)}</p>{/if}
      {:else}
        <div class="rrow">
          {#if !own}<select class="sel" aria-label={t('Value')} value={metric} onchange={(e) => pickMetric(e.currentTarget.value)}>
            {#each NUMERIC as m (m)}<option value={m}>{t(METRICS[m].name)}</option>{/each}
          </select>{/if}
          <select class="sel" aria-label={t('Comparison')} bind:value={cmp}>
            {#each CMPS as c (c)}<option value={c}>{cmpWord(c)}</option>{/each}
          </select>
          <span class="lim"><input class="inp num" type="text" inputmode="decimal" aria-label={t('Limit')} bind:value={limit} oninput={() => (error = '')} /><span class="unit">{unitOf(metric)}</span></span>
        </div>
        {#if block.key === 'climb'}
          <label class="rrow alt"><span>{t('or the highest point from')}</span><span class="lim"><input class="inp num" type="text" inputmode="numeric" aria-label={t('Highest point from')} bind:value={alt} oninput={() => (error = '')} /><span class="unit">{t('m above sea level')}</span></span></label>
        {:else if block.key === 'recovery'}
          <label class="rrow alt"><span>{t('or climbing a day from')}</span><span class="lim"><input class="inp num" type="text" inputmode="numeric" aria-label={t('Climbing a day from')} bind:value={alt} oninput={() => (error = '')} /><span class="unit">m</span></span></label>
        {/if}
      {/if}
      {#if OR[block.key]}<p class="extra">{OR[block.key] === 'pass' ? t('or a pass') : t('or snow')}</p>{/if}
      {#if NEED[block.key]}
        <!-- v0.154.0 (mockup SN3i): a fixed second condition, by hand where the app does not know it yet -->
        <p class="extra need">{needLine(block.key)}{#if byHand(block.key)}{' '}<span class="hchip"><Hand size={13} aria-hidden="true" />{t('still by hand')}</span>{/if}</p>
      {/if}
      <p class="src">{sourceLine(metric)}{#if !own && !bool && metric === std.metric}{' · '}{t('Standard: {v}', { v: `${num(std.limit)} ${unitOf(metric)}` })}{/if}{#if ALT[block.key]}{' · '}{t('Standard: {v}', { v: `${num(std.alt)} m` })}{/if}</p>
      {#if NEED[block.key] === 'lake'}<p class="src">{t('Lake or river is not known to the app yet: you tap it in Plan («Lake or river»). Later from the route.')}</p>{/if}
      {#if block.key === 'rain' && metric === 'rainPct'}
        <!-- v0.144.0 RE «Regen überall gleich» (Noah 1a): this limit is the one rain limit of the app -->
        <p class="everywhere" data-rain-everywhere><Info size={16} aria-hidden="true" /><span><b>{t('Counts everywhere in the app:')}</b> {t('Packing, rain gear, What to wear, the weather on Today, the suggestion of the day, the plan on the way.')} {t('One limit for everything: from {n} % a trip counts as wet.', { n: Number.isFinite(toNum(limit)) ? num(toNum(limit)) : num(std.limit) })}</span></p>
      {/if}
      {#if error}<p class="err" role="alert">{error}</p>{/if}
    </fieldset>

    <!-- Idee 50 (Touren b): «Regel mit Ablaufdatum» -->
    <fieldset class="rule hold" data-rule-holds>
      <legend class="lbl">{t('Holds|rule')}</legend>
      <select class="sel" aria-label={t('How long the rule holds')} bind:value={holds}>
        <option value="always">{t('Always|rule')}</option>
        {#each soon as x (x.id)}<option value={`trip:${x.id}`}>{t('Only for {trip}', { trip: x.title || t('Untitled trip') })}</option>{/each}
        <option value="date">{t('Until a day (season)')}</option>
      </select>
      {#if holds === 'date'}<input class="inp" type="date" bind:value={holdDate} min={today} aria-label={t('Holds until')} data-rule-until />{/if}
      <p class="src">{holds === 'always' ? t('The rule holds until you change it.') : t('Afterwards the app asks whether the rule stays.')}</p>
    </fieldset>

    {#if BATHING_BLOCKS.includes(block.key) && block.key !== 'drybag'}
      <p class="everywhere"><Info size={16} aria-hidden="true" /><span>{t('When {block} comes along, the app also suggests {dry}.', { block: `«${block.name}»`, dry: `«${t(SETS.drybag)}»` })}</span></p>
    {/if}
    <h3 class="lbl ih">{t('Items')}</h3>
    {#if kept.length}
      <ul class="its">
        {#each kept as i (i.id)}
          {@const n = qtyOf(block, i.id)}
          <li>
            <span class="in"><span class="nm">{nameOf(i)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span><small class="num">{isInventory(i) ? formatWeight(itemWeight(i)) : t('never packed')}</small></span>
            <button type="button" class="sq" aria-label={t('Remove {name} from {block}', { name: nameOf(i), block: block.name })} onclick={() => (out = [...out, i.id])}><X size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">{t('Still empty: it is only suggested once an item is in it.')}</p>
    {/if}
    <a class="btn add" href={`#/gear?fill=${encodeURIComponent(block.key)}`} onclick={() => dialog.close()}><Plus size={18} aria-hidden="true" />{t('Add items')}</a>
    <button type="button" class="namerow" onclick={() => onrename?.()}><Pencil size={18} aria-hidden="true" /><span>{t('Name|block')}</span><small>{block.name}</small><ChevronRight size={18} aria-hidden="true" /></button>
    {#if ondelete}<button type="button" class="namerow del" onclick={() => ondelete()}><Trash2 size={18} aria-hidden="true" /><span>{t('Delete building block')}</span><small></small><ChevronRight size={18} aria-hidden="true" /></button>{/if}

    <div class="foot">
      <button type="button" class="tp-link reset" onclick={reset}>{t('Reset|rule')}</button>
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .rsheet {
    width: min(580px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .sugrow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .tile {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 9px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .tile.tone-blue {
    background: var(--info-soft);
    color: var(--ink-2);
  }
  .tile.tone-amber {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .swt {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  .swt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .switch {
    position: relative;
    flex: none;
    width: 56px;
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
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line-strong);
    transition: background 0.15s;
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 8px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: left 0.15s;
  }
  .switch[aria-checked='true']::before {
    background: var(--accent);
  }
  .switch[aria-checked='true'] .knob {
    left: 28px;
  }
  .rule {
    margin: 16px 0 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .rule legend {
    margin-bottom: 6px;
  }
  .rrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .rrow .sel {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 44px;
  }
  .rrow .sel + .sel {
    flex: 0 1 110px;
  }
  .rrow.alt {
    margin-top: 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lim {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .lim .inp {
    width: 88px;
    min-height: 44px;
    text-align: center;
  }
  .unit {
    color: var(--ink-2);
  }
  .boolr {
    margin: 0;
    font-weight: 500;
  }
  .src,
  .err,
  .empty {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .err {
    color: var(--bad);
  }
  /* v0.154.0: the fixed «oder …» / «und …» of a block, «noch von Hand» */
  .extra {
    margin: 8px 0 0;
    font-weight: 600;
    color: var(--ink);
  }
  .hchip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 8px;
    border: 1px dashed var(--line-strong);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .everywhere {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .everywhere :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ih {
    display: block;
    margin: 18px 0 6px;
  }
  .its {
    list-style: none;
    margin: 0;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .its li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    padding: 4px 0;
  }
  .its li + li {
    border-top: 1px solid var(--line);
  }
  .in {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  .nm {
    overflow-wrap: break-word;
  }
  .in small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sq {
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
  }
  .namerow {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    margin-top: 12px;
    padding: 6px 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .namerow span {
    flex: 1 1 auto;
  }
  .namerow small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .namerow.del {
    color: var(--bad);
  }
  .reset {
    margin-right: auto;
    min-height: 44px;
  }
  @media (max-width: 719px) {
    .foot .btn.hi {
      flex: 1;
    }
  }
  .ownm { width: 100%; margin: 0 0 8px; }
</style>
