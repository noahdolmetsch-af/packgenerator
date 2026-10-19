<script>
  import { UNDO_MS } from '../lib/ui/undo.js';
  /**
   * v0.26.0 (Noah 2a/2b, AP10): building blocks (code: item sets) on their own page, #/blocks.
   * v0.32.0 (finding 5, stage 1): the blocks in 3 groups, each card with "when it comes" and the
   * names of its items:
   *   - Always with you: the block "Standard" (v0.33.0: item.sets has 'standard', or the old role /
   *     "On every trip", plus the items On me; changed in the item dialog under "Comes along");
   *   - With the night: the blocks the overnight stay brings by itself (context.js CONTEXT_SETS);
   *   - To add: your own blocks (and Food, Hygiene, Comfort), one tap in "New trip" or in Pack's "Add material".
   * v0.66.0 «Bausteine neu»: a fourth group "On the ride" (Repair, Charging, Light in the dark, Race on
   * an event: suggested, deselectable per trip), and the way to «Bausteine prüfen» (#/blocks/check).
   * The rows and the changes (amount, remove, add items, rename, delete) fold away under "Change".
   * Built-in blocks (gear.js SETS) can be renamed but not deleted; own blocks can be renamed and
   * deleted. Every change can be undone for a few seconds. No data changes because of the groups.
   * SN3 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head with its path,
   * «Prüfen» as a normal button and «Neuer Baustein» as the main one; the groups as sections with a
   * white card, each block one row: its icon, the first names (or «noch leer»), count · weight right.
   * SN3+ «Bausteine je nach Lage» (mockups SN3e-a, SN3f; Noah 13.10.2026 «SN3e–SN3g freigegeben»): a fifth
   * group «Je nach Lage» with the seven blocks of situation.js, open; each row says when it comes
   * («kommt mit: unter 5 °C») and opens the rule sheet (RuleSheet.svelte). The other groups fold to one
   * row (answer «aufklappbar b»). Right: where the app knows the situation from and the look in Packen.
   * SN5+ F4 (Noah 13.10.2026 answer 3a): a block saved from the favourites is a copy; when the stars of its
   * trip kind change later, its row says so quietly («n Favoriten haben sich geändert · übernehmen?»):
   * one tap takes the changes over (Undo), «nein» only forgets them.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { formatWeight, itemWeight, OWNERSHIP, isInventory, sumKnown, knownWeight } from '../lib/gear.js';
  import { SETS_KEY, allSets, setView, setUse, qtyOf, addSet, blockLabel } from '../lib/sets.js';
  import { TEMPLATES_KEY, templatesWith } from '../lib/templates.js';
  import { tempRange } from '../lib/wardrobe.js';
  import { NIGHT_BLOCKS, RIDE_BLOCKS, OUTDOOR_BLOCKS } from '../lib/context.js';
  import { REVIEW_KEY, reviewOpen, reviewBlocks } from '../lib/blocksplit.js';
  import { blockKind, comesOf } from '../lib/gear/comes.js';
  import { assignSet, editSets, renameSetIn, setQtyIn, deleteSet } from '../lib/gear/assign.js';
  import { undoBulk } from '../lib/gear/bulk.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { Plus, X, Minus, Layers, ChevronRight, UserRound, Scale, ListChecks, Info, CloudRain, CloudSun, Route, MapPin, Hand, Zap, ZapOff, Star } from '@lucide/svelte';
  import Help from '../lib/ui/Help.svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import { blockIcon, blockTone } from '../lib/blockicons.js';
  import { RAIN_WORDS } from '../lib/packblocks.js';
  import { SITUATION_BLOCKS, rulesOf, setRule } from '../lib/situation.js';
  import { ruleLine, hitBadge } from '../lib/situationtext.js';
  import OptionButton from '../lib/ui/OptionButton.svelte';
  import RuleSheet from '../lib/gear/RuleSheet.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { favDrift, takeDrift } from '../lib/favplus.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const items = $derived($itemsQ ?? []);
  const sets = $derived(allSets($setsQ?.value));
  const cards = $derived(sets.map((s) => ({ ...s, ...setView(s, items), kind: blockKind(s.key) })));
  // With the night in the order the overnight stay brings them; to add: Light first, then your own.
  const nightCards = $derived(NIGHT_BLOCKS.map((k) => cards.find((c) => c.key === k)).filter(Boolean));
  const rideCards = $derived(RIDE_BLOCKS.map((k) => cards.find((c) => c.key === k)).filter(Boolean));
  // v0.66.0: «Bausteine prüfen» says when something from the update is still to check.
  const reviewQ = liveQuery(() => db.settings.get(REVIEW_KEY));
  const toCheck = $derived(reviewOpen($reviewQ?.value));
  // Impeccable runde 2 (Bausteine 2): the chip says how many blocks wait, and leads there
  const checkN = $derived(reviewBlocks($reviewQ?.value));
  const addCards = $derived(cards.filter((c) => c.kind === 'add'));
  // SN3+: the seven blocks «je nach Lage», their rules, an own rain block that follows the rule Regen
  const sitCards = $derived(SITUATION_BLOCKS.map((k) => cards.find((c) => c.key === k)).filter(Boolean));
  // Impeccable (18.10.2026): how many «Depending on the situation» blocks are still empty (they suggest nothing)
  const sitEmpty = $derived(sitCards.filter((s) => !s.inventory.length).length);
  const rules = $derived(rulesOf($setsQ?.value));
  const ownRain = $derived(addCards.filter((c) => !c.builtIn && RAIN_WORDS.test(c.name)));
  const sample = $derived(sitCards.find((c) => c.key === 'cold') ?? null);
  /** A folded group's line: what it does · its first three names … */
  const groupSub = (what, list) => [what, list.slice(0, 3).map(blockLabel).join(', ') + (list.length > 3 ? ' …' : '')].filter(Boolean).join(' · ');
  let ruling = $state(null); // the key of the block whose rule sheet is open
  const rulingCard = $derived(ruling ? cards.find((c) => c.key === ruling) ?? null : null);
  // Save the rule (on the block's record) and take out the items crossed out in the sheet; one Undo.
  async function saveRule(s, { rule, out }) {
    const res = await editSets(db, (v) => ({ value: setRule(v, s.key, rule) }));
    if (res.error) return;
    let snap = res.snap;
    if (out.length) {
      const r2 = await assignSet(db, out, s.key, { out: true });
      snap = { ...snap, items: r2.snap?.items ?? [] };
    }
    offer(t('{block}: saved.', { block: blockLabel(s) }), snap);
  }
  const tplCount = $derived(($tplQ?.value ?? []).length);
  // v0.39.0 (AP28, Noah 3a): templates are linked to their blocks; a quiet line says how many a change reaches.
  const inTemplates = (key) => templatesWith($tplQ?.value ?? [], key).length;
  // The block "Standard" (v0.33.0: the key 'standard' on item.sets, read with the old fields; On me shows in it).
  const standard = $derived.by(() => {
    const its = items.filter((i) => isInventory(i) && comesOf(i).standard);
    const { g, missing } = sumKnown(its.map(itemWeight));
    return { items: its, g, missing };
  });
  const NAMES_SHOWN = 5;
  // v0.40.0: the blocks an Outdoor night brings get the quiet word "outdoor" (the head says "with the night").
  const OUTDOOR = OUTDOOR_BLOCKS;

  let error = $state('');
  let undo = $state.raw(null); // { text, snap }
  let timer;
  function offer(text, snap) {
    clearTimeout(timer);
    undo = snap ? { text, snap } : { text };
    timer = setTimeout(() => (undo = null), UNDO_MS);
  }
  async function doUndo() {
    const snap = undo?.snap;
    clearTimeout(timer);
    undo = null;
    if (snap) await undoBulk(db, snap);
  }
  $effect(() => () => clearTimeout(timer));
  const errText = (code, name) => (code === 'taken' ? t('There is already a building block "{name}".', { name }) : t('Give the building block a name.'));

  // "+ New building block"
  let adding = $state(false);
  let addOpen = $state(false); // SN3+: the folded group «Zum Dazunehmen»
  let newName = $state('');
  async function create(event) {
    event.preventDefault();
    error = '';
    const name = newName.trim();
    const res = await editSets(db, (v) => addSet(v, name));
    if (res.error) return (error = errText(res.error, name));
    offer(t('Building block "{name}" made.', { name }), res.snap);
    addOpen = true; // SN3+: the new block shows in its group, which opens for it
    newName = '';
    adding = false;
  }
  // v0.72.0 «Feinschliff» (Umbenennen 1a): «Rename» opens the one rename sheet (before: a field
  // higher up in the block, without the keyboard). Undo as before, 10 s in the bar below.
  let renaming = $state(null); // the block
  const builtInName = (key) => allSets([]).find((x) => x.key === key)?.name ?? key;
  async function rename(s, value) {
    error = '';
    const name = value.trim();
    if (name === s.name || (!name && !s.builtIn)) return;
    const res = await renameSetIn(db, s.key, name);
    if (res.error) return errText(res.error, name);
    offer(t('Renamed to "{name}".', { name: name || builtInName(s.key) }), res.snap);
  }
  async function remove(s) {
    const n = s.items.length;
    const tn2 = inTemplates(s.key);
    if (!confirm([t('Delete the building block "{name}"?', { name: s.name }), tn(n, 'Its {n} item stays in your gear; only the building block goes.', 'Its {n} items stay in your gear; only the building block goes.'), ...(tn2 ? [tn(tn2, 'The template that holds it keeps its items as extras.', 'The {n} templates that hold it keep its items as extras.')] : []), t('You can undo this for a few seconds.')].join('\n\n'))) return;
    const res = await deleteSet(db, s.key);
    if (res.error) return;
    offer(t('Building block "{name}" deleted.', { name: s.name }), res.snap);
  }
  async function takeOut(s, item) {
    const res = await assignSet(db, [item.id], s.key, { out: true });
    offer(t('{name} taken out of {block}.', { name: nameOf(item), block: s.name }), res.snap);
  }
  async function amount(s, item, n) {
    const res = await setQtyIn(db, s.key, item.id, n);
    if (!res.error) offer(t('{name}: {n} in {block}.', { name: nameOf(item), n: Math.max(1, n), block: s.name }), res.snap);
  }
  // v0.43.0 (Mehrfachauswahl): "Select" in an open block, then "Remove" takes many out at once (one Undo).
  let selKey = $state(null);
  const picked = new SvelteSet();
  const selBlock = $derived(selKey ? cards.find((c) => c.key === selKey) ?? null : null);
  const chosen = $derived(selBlock ? selBlock.items.filter((i) => picked.has(i.id)) : []);
  function selectIn(key) {
    selKey = selKey === key ? null : key;
    picked.clear();
  }
  const flipPick = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));
  async function takeOutMany() {
    const s = selBlock;
    const ids = chosen.map((i) => i.id);
    if (!s || !ids.length) return;
    const res = await assignSet(db, ids, s.key, { out: true });
    offer(tn(res.n, '{n} item taken out of {block}.', '{n} items taken out of {block}.', { block: blockLabel(s) }), res.n ? res.snap : null);
    picked.clear();
  }
  // "+ Add items": Gear in "Select", only the items not in this block yet (Gear reads ?fill=).
  const fillHref = (s) => `#/gear?fill=${encodeURIComponent(s.key)}`;
  /** "Tent · Mat · Gloves × 2 · +4": the names of the items that get packed. */
  const namesOf = (list, s = null) => {
    const shown = list.slice(0, NAMES_SHOWN).map((i) => {
      const n = s ? qtyOf(s, i.id) : 1;
      return n !== 1 ? `${nameOf(i)} × ${n}` : nameOf(i);
    });
    return list.length > NAMES_SHOWN ? [...shown, `+${list.length - NAMES_SHOWN}`] : shown;
  };
  // SN5+ F4: take over (or forget) what changed in the favourites of a block made from them.
  async function drift(s, keep = false) {
    const res = await takeDrift(db, s.key, { keep });
    if (!res.snap) return;
    offer(keep ? t('{block}: the changes are not taken over.', { block: blockLabel(s) }) : tn(res.n, '{block}: {n} change taken over.', '{block}: {n} changes taken over.', { block: blockLabel(s) }), res.snap);
  }
  // SN3: the main button of the head opens the name field of a new block right under it.
  async function startNew() {
    adding = true;
    error = '';
    await Promise.resolve();
    document.getElementById('new-block-name')?.focus();
  }
</script>

{#snippet summary(key, name, id, list, sum, s = null)}
  {@const Icon = blockIcon(key, name)}
  <!-- SN3: one row per block: its icon, the first names (or «noch leer»), count · weight right -->
  <summary class="srow">
    <span class="sib" class:ok={key === 'standard'} aria-hidden="true"><Icon size={18} /></span>
    <span class="sm">
      <b><span class="nm" {id}>{name}</span>{#if s && (typeof s.minC === 'number' || typeof s.maxC === 'number')}{' '}<small class="quiet num">{tempRange(s.minC, s.maxC, t)}</small>{/if}{#if s && OUTDOOR.includes(s.key)}{' '}<small class="quiet">{t('outdoor|block')}</small>{/if}{#if s && !s.builtIn}{' '}<i class="nbadge">{t('own|block')}</i>{/if}</b>
      <small>{#if list.length}{namesOf(list, s).join(', ')}{:else}{t('still empty')}{/if}</small>
    </span>
    <!-- Count and weight right in one column; an unknown weight is the scale, never 0 g. -->
    <span class="sv num" aria-hidden="true">{#if list.length}{list.length}{' · '}{#if sum.missing === list.length}<Scale size={15} class="scale" />{:else}{sum.missing ? '~' : ''}{formatWeight(sum.g)}{/if}{:else}–{/if}</span>
    <span class="sr">{tn(list.length, '{n} item', '{n} items')}{list.length && sum.missing < list.length ? `, ${sum.missing ? t('known: {w}', { w: formatWeight(sum.g) }) : formatWeight(sum.g)}` : ''}{sum.missing ? `, ${t('{n} not weighed', { n: sum.missing })}` : ''}</span>
    <ChevronRight class="schev chev" size={18} aria-hidden="true" />
  </summary>
{/snippet}

{#snippet sitRow(s)}
  {@const Icon = blockIcon(s.key, s.name)}
  {@const r = rules[s.key]}
  <!-- SN3+: one row per block «je nach Lage»: icon, names, when it comes; a tap opens its rule -->
  <!-- Impeccable (18.10.2026): an empty block says what it does not do and offers «+ Items» right there -->
  <li class="blk" class:empty={!s.inventory.length} aria-labelledby="blk-{s.key}">
    <button type="button" class="srow sitrow" aria-haspopup="dialog" onclick={() => (ruling = s.key)}>
      <span class="sib tone-{blockTone(s.key, s.name)}" aria-hidden="true"><Icon size={18} /></span>
      <span class="sm">
        <b><span class="nm" id="blk-{s.key}">{blockLabel(s)}</span></b>
        <small>{#if s.inventory.length}{namesOf(s.inventory, s).join(', ')}{:else}{t('still empty: suggests nothing when packing')}{/if}</small>
        <span class="rchip" class:off={!r.on}>{#if r.on}<Zap size={14} aria-hidden="true" />{t('comes along:')} <b>{ruleLine(s.key, r)}</b>{:else}<ZapOff size={14} aria-hidden="true" />{t('Suggestion off')} · {ruleLine(s.key, r)}{/if}</span>
      </span>
      {#if s.inventory.length}<span class="sv num" aria-hidden="true">{s.inventory.length}{' · '}{#if s.missing === s.inventory.length}<Scale size={15} class="scale" />{:else}{s.missing ? '~' : ''}{formatWeight(s.g)}{/if}</span>{/if}
      <span class="sr">{tn(s.inventory.length, '{n} item', '{n} items')}</span>
      <ChevronRight class="schev" size={18} aria-hidden="true" />
    </button>
    {#if !s.inventory.length}<a class="btn sm addp" href={fillHref(s)} aria-label={t('Add items to {block}', { block: blockLabel(s) })}><Plus size={16} aria-hidden="true" />{t('Items|add')}</a>{/if}
  </li>
{/snippet}

{#snippet blockCard(s)}
  <li class="blk" aria-labelledby="blk-{s.key}">
    <details class="edit">
      {@render summary(s.key, blockLabel(s), `blk-${s.key}`, s.inventory, s, s)}
      <div class="body">
        <p class="note use">{setUse(s.builtIn ? s.key : null)}</p>
        {#if s.note}<p class="note">{s.note}</p>{/if}
        {#if inTemplates(s.key)}<p class="note intpl">{tn(inTemplates(s.key), 'In {n} template: it changes with this block.', 'In {n} templates: they change with this block.')}</p>{/if}
        {#if s.items.length}
          <!-- One header for the columns, quiet icon buttons in the rows (no "Remove" on every row). -->
          <div class="cols"><span aria-hidden="true">{t('Item')}</span>{#if s.items.length > 1}<button type="button" class="selb" aria-pressed={selKey === s.key} onclick={() => selectIn(s.key)}>{selKey === s.key ? t('Done') : t('Select')}</button>{/if}<span aria-hidden="true">{selKey === s.key ? '' : t('Amount')}</span></div>
          <ul class="rows">
            {#each s.items as item (item.id)}
              {@const inv = isInventory(item)}
              {@const n = qtyOf(s, item.id)}
              {#if selKey === s.key}
                <li class:off={!inv} class="pickli">
                  <label class="pick" class:on={picked.has(item.id)}>
                    <input type="checkbox" checked={picked.has(item.id)} onchange={() => flipPick(item.id)} aria-label={nameOf(item)} />
                    <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                    <small class="num w">{inv ? formatWeight(itemWeight(item)) : t(OWNERSHIP[item.ownership] ?? item.ownership)}</small>
                  </label>
                </li>
              {:else}
              <li class:off={!inv}>
                <span class="in">
                  <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                  <small>{#if inv}<span class="num">{formatWeight(itemWeight(item))}</span>{:else}{t(OWNERSHIP[item.ownership] ?? item.ownership)} · {t('never packed')}{/if}</small>
                </span>
                <span class="racts row-acts">
                  {#if inv}
                    <span class="step" role="group" aria-label={t('Amount of {name}', { name: nameOf(item) })}>
                      <button type="button" class="sq" disabled={n <= 1} aria-label={t('Fewer: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n - 1)}><Minus size={16} aria-hidden="true" /></button>
                      <button type="button" class="sq" disabled={n >= 20} aria-label={t('More: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n + 1)}><Plus size={16} aria-hidden="true" /></button>
                    </span>
                  {/if}
                  <button type="button" class="sq quietx" aria-label={t('Remove {name} from {block}', { name: nameOf(item), block: s.name })} title={t('Remove')} onclick={() => takeOut(s, item)}><X size={16} aria-hidden="true" /></button>
                </span>
              </li>
              {/if}
            {/each}
          </ul>
        {/if}
        <div class="acts">
          <a class="btn" href={fillHref(s)} aria-label={t('Add items to {block}', { block: s.name })}>+ {t('Add items')}</a>
          <button type="button" class="btn" aria-label={t('Rename {name}', { name: blockLabel(s) })} onclick={() => (renaming = s)}>{t('Rename')}</button>
          {#if !s.builtIn}<button type="button" class="btn del" onclick={() => remove(s)}>{t('Delete')}</button>{/if}
        </div>
      </div>
    </details>
    {#if !s.builtIn && s.fav}
      {@const d = favDrift(s, items)}
      {#if d?.n}
        <!-- SN5+ F4: the stars of its kind changed since the copy; a quiet line, never a must -->
        <p class="drift" role="note"><Star size={14} aria-hidden="true" /><span>{tn(d.n, '{n} favourite has changed', '{n} favourites have changed')} ·</span>
          <button type="button" class="dlink" onclick={() => drift(s)} aria-label={t('Take over the changed favourites into {block}', { block: blockLabel(s) })}>{t('take over?')}</button>
          <button type="button" class="dlink quiet" onclick={() => drift(s, true)} aria-label={t('Do not take over the changed favourites into {block}', { block: blockLabel(s) })}>{t('no|drift')}</button>
        </p>
      {/if}
    {/if}
  </li>
{/snippet}

<div class="blocks">
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Building blocks')} extra={headSub}>
    <!-- v0.66.0 (Noah 4a): one block after the other, every item keep / out / elsewhere; SN3: a normal button -->
    <!-- Impeccable runde 2 (Bausteine 2): the button says what it checks; how many wait is the chip under the title -->
    <Btn icon={ListChecks} label={t('Check building blocks')} explain={t('One building block after the other: keep, out or elsewhere')} href="#/blocks/check" />
    <Btn kind="hi" icon={Plus} label={t('New building block')} aria-expanded={adding} onclick={startNew} />
  </PathHead>
  {#if adding}
    <form class="newset card" onsubmit={create}>
      <label><span class="lbl">{t('Name of the new building block')}</span><input id="new-block-name" class="inp" bind:value={newName} placeholder={t('e.g. Rain')} /></label>
      <button type="submit" class="btn hi">{t('Create')}</button>
      <button type="button" class="btn" onclick={() => ((adding = false), (error = ''))}>{t('Cancel')}</button>
    </form>
  {/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}

  <!-- SN3+ «Bausteine je nach Lage» (mockup SN3e-a, answers 1a and «aufklappbar b»): only «Je nach Lage» is
       open; the other groups are one row each (name, the first names, the count), one tap opens them.
       Right on a computer (under it on a phone): where the app knows the situation from, and the look in Packen. -->
  <div class="groups">
    <div class="gcol">
      <Section fold title={t('Always with you')} sub={`${t('in every new trip')} · ${t('Standard|block')}`} count={1} id="g-always">
        <ul class="card slist">
          <li class="blk std" aria-labelledby="blk-standard">
            <details class="edit">
              {@render summary('standard', t('Standard|block'), 'blk-standard', standard.items, standard)}
              <div class="body">
                <p class="note use">{t('Comes into every new trip')}</p>
                {#if inTemplates('standard')}<p class="note intpl">{tn(inTemplates('standard'), 'In {n} template: it changes with this block.', 'In {n} templates: they change with this block.')}</p>{/if}
                {#if standard.items.length}
                  <p class="cols" aria-hidden="true"><span>{t('Item')}</span><span>{t('Weight')}</span></p>
                  <ul class="rows">
                    {#each standard.items as item (item.id)}
                      <li>
                        <span class="in"><span class="iname">{nameOf(item)}{#if comesOf(item).body}{' '}<small class="where"><UserRound size={14} aria-hidden="true" /> {t('On me')}</small>{/if}</span></span>
                        <small class="num w">{formatWeight(itemWeight(item))}</small>
                      </li>
                    {/each}
                  </ul>
                {/if}
                <p class="note">{t('To change: open the item in Gear, then "Comes along" → Standard.')}</p>
              </div>
            </details>
          </li>
        </ul>
      </Section>

      <Section title={t('Depending on the situation')} sub={`${t('come as a suggestion when the trip fits')} · ${tn(sitCards.length, '{n} building block', '{n} building blocks')}`} id="g-situation">
        {#if sitEmpty}<p class="shint emptyhint"><Info size={15} aria-hidden="true" /><span>{tn(sitEmpty, '{n} building block is still empty. Put in the items that should come along, for example in cold, heat or rain.', '{n} building blocks are still empty. Put in the items that should come along, for example in cold, heat or rain.')}</span></p>{/if}
        <ul class="card slist">
          {#each sitCards as s (s.key)}{@render sitRow(s)}{/each}
        </ul>
        {#if ownRain.length}<p class="shint"><CloudRain size={15} aria-hidden="true" /><span>{t('Your own block {names} follows the rule of {rain} too.', { names: ownRain.map((c) => `«${c.name}»`).join(', '), rain: blockLabel(sitCards.find((c) => c.key === 'rain') ?? { name: t('Rain|block') }) })}</span></p>{/if}
        <p class="shint"><Info size={15} aria-hidden="true" /><span>{t('Tap a block to change its rule, limit and items, or to switch the suggestion off. Never a must: in Pack it is dashed and can be left out.')}</span></p>
      </Section>

      <Section fold title={t('On the ride')} sub={groupSub(t('suggested, you can take it off'), rideCards)} count={rideCards.length} id="g-ride">
        <ul class="card slist">
          {#each rideCards as s (s.key)}{@render blockCard(s)}{/each}
        </ul>
      </Section>

      <Section fold title={t('With the night')} sub={groupSub(t('come by themselves'), nightCards)} count={nightCards.length} id="g-night">
        <ul class="card slist">
          {#each nightCards as s (s.key)}{@render blockCard(s)}{/each}
        </ul>
      </Section>

      <Section fold title={t('To add')} sub={groupSub(t('one tap when you make a trip'), addCards)} count={addCards.length} id="g-add" bind:open={addOpen}>
        <ul class="card slist">
          {#each addCards as s (s.key)}{@render blockCard(s)}{/each}
        </ul>
        <p class="shint"><Info size={15} aria-hidden="true" /><span>{t('Empty building blocks do not disturb: they only come along once an item is in them.')}</span></p>
        <p class="shint tl"><Layers size={15} aria-hidden="true" /><a class="tlink" href="#/pack/templates">{t('Templates')} <span class="num">({tplCount})</span></a></p>
      </Section>
    </div>

    <div class="gcol aside">
      <Section title={t('Where the app knows the situation from')} sub={t('only from what is already in the trip')} id="g-source">
        <ul class="card slist">
          <li class="srow"><span class="sib info" aria-hidden="true"><CloudSun size={18} /></span><span class="sm"><b>{t('Weather in Plan')}</b><small>{t('Cold, Heat, Rain · lowest and highest forecast over the days of the trip')}</small></span></li>
          <li class="srow"><span class="sib" aria-hidden="true"><Route size={18} /></span><span class="sm"><b>{t('Route (GPX)')}</b><small>{t('Pass & climbing, Long ride · climbing, highest point, riding time')}</small></span></li>
          <li class="srow"><span class="sib" aria-hidden="true"><MapPin size={18} /></span><span class="sm"><b>{t('Three buttons in Plan')}</b><small>{t('Pass, Abroad, Train · «Pass», the country, «Getting there: bike · train · car»')}</small></span></li>
        </ul>
      </Section>
      {#if sample}
        <Section title={t('How it looks in Pack')} sub={t('A block that fits comes as a dashed suggestion')} id="g-look">
          <div class="card look">
            <div class="lookbtn" inert aria-hidden="true">
              <OptionButton size="lg" pressed={false} icon={blockIcon(sample.key, sample.name)} tone={blockTone(sample.key, sample.name)} label={blockLabel(sample)} sub={sample.inventory.length ? `${tn(sample.inventory.length, '{n} item', '{n} items')} · ${knownWeight(sample.g, sample.missing)}` : t('still empty')} badge={hitBadge({ kind: 'cold', c: 3 })} />
            </div>
            <p class="shint"><Hand size={15} aria-hidden="true" /><span>{t('One tap adds it, another tap takes it off again.')}</span></p>
          </div>
        </Section>
      {/if}
    </div>
  </div>
</div>

{#snippet headSub()}
  <!-- v0.40.0 (design check, Noah 7a): one line instead of four, the rest behind "?" -->
  <p class="bsub">{tn(cards.length + 1, '{n} building block', '{n} building blocks')} · {t('groups of items that come along together')}
    <Help label={t('Building blocks')}>
      <p>{t('A building block is a group of items that comes along together. There are three kinds: always with you, with the night, and to add. Changing a block does not change trips you already made.')}</p>
      <p>{t('Tools are never called "not needed" in the debrief.')}</p>
    </Help>
    {#if toCheck}<a class="nbadge chk tap" href="#/blocks/check">{tn(checkN, '{n} building block to check', '{n} building blocks to check')} ›</a>{/if}
  </p>
{/snippet}

{#if selBlock}
  <!-- v0.43.0 (Mehrfachauswahl): the bar of a block's selection, with the Undo of the last change. -->
  <div class="undopad sel" aria-hidden="true"></div>
  <div class="undo selbar" role="region" aria-label={t('Selected items')}>
    {#if undo}<p class="ul" role="status"><span>{undo.text}</span>{#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}</p>{/if}
    <div class="bacts">
      <b class="num" aria-live="polite">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
      <button type="button" class="btn" disabled={chosen.length === selBlock.items.length} onclick={() => selBlock.items.forEach((i) => picked.add(i.id))}>{t('Select all')}</button>
      <button type="button" class="btn" disabled={!chosen.length} onclick={takeOutMany}>{t('Remove')}</button>
      <button type="button" class="btn" onclick={() => selectIn(null)}>{t('Done')}</button>
    </div>
  </div>
{:else if undo}
  <div class="undopad" aria-hidden="true"></div>
  <div class="undo" role="status">
    <span>{undo.text}</span>
    {#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}
  </div>
{/if}

{#if rulingCard}
  {@const s = rulingCard}
  <RuleSheet block={{ ...s, name: blockLabel(s) }} rule={s.rule ?? null} onsave={(res) => saveRule(s, res)} onrename={() => ((ruling = null), (renaming = s))} onclose={() => (ruling = null)} />
{/if}

{#if renaming}
  {@const r = renaming}
  <RenameSheet
    kicker={t('Building block')}
    title={t('Rename building block')}
    value={r.name}
    empty={r.builtIn ? builtInName(r.key) : ''}
    hint={[r.builtIn ? t('Empty: back to "{name}".', { name: builtInName(r.key) }) : '', inTemplates(r.key) ? tn(inTemplates(r.key), 'Changes with it in {n} template.', 'Changes with it in {n} templates.') : ''].filter(Boolean).join(' ')}
    onsave={(name) => rename(r, name)}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  /* SN3: the quiet link to the templates with a 44 px tap area */
  .tl {
    align-items: center;
  }
  .tlink {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-2);
  }
  .blocks {
    max-width: 1240px;
  }
  .bsub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-body);
  }
  .err {
    color: var(--bad);
  }
  /* SN3+: the groups left (one column), where the app knows the situation from right */
  .groups {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 1000px) {
    .groups {
      grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
      align-items: start;
    }
  }
  .gcol {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .sitrow {
    width: 100%;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  /* Impeccable (18.10.2026): an empty block row with its «+ Items» on the right */
  .blk.empty {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .blk.empty .sitrow {
    flex: 1 1 auto;
    min-width: 0;
  }
  /* .btn.sm also carries the class «sm» of the row text (Section): keep the button its own size */
  .blk.empty .addp {
    flex: none;
    gap: 4px;
  }
  /* on a phone the button goes under the text, in line with it (no squeezed row) */
  @media (max-width: 559px) {
    .blk.empty {
      flex-wrap: wrap;
      gap: 0;
    }
    .blk.empty .sitrow {
      flex-basis: 100%;
      flex-wrap: nowrap;
    }
    .blk.empty .addp {
      margin: -4px 0 12px 48px;
    }
  }
  .emptyhint {
    margin: 0 2px 10px;
  }
  .sitrow .sib.tone-blue {
    background: var(--info-soft);
  }
  .sitrow .sib.tone-amber {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .rchip {
    display: inline-block;
    max-width: 100%;
    margin-top: 6px;
    padding: 2px 10px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rchip :global(svg) {
    margin-right: 4px;
    vertical-align: -2px;
  }
  .sitrow .sm .rchip b {
    display: inline;
    font-weight: 600;
    color: var(--ink);
  }
  .rchip.off {
    border: 1px dashed var(--line-strong);
    background: transparent;
  }
  .look .lookbtn {
    padding-top: 10px;
  }
  .newset {
    margin: 0 0 var(--sp-5);
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
    width: 100%;
  }
  .newset label {
    display: grid;
    gap: 4px;
    flex: 1 1 200px;
    min-width: 0;
  }
  .blk {
    min-width: 0;
  }
  .nm {
    font-weight: 600;
  }
  .quiet {
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .body {
    padding: 0 0 10px 48px;
  }
  @media (max-width: 479px) {
    .body {
      padding-left: 12px;
    }
  }
  .note {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .note.use {
    margin-top: 0;
  }
  .edit > summary {
    cursor: pointer;
    list-style: none;
  }
  .edit > summary::-webkit-details-marker {
    display: none;
  }
  .edit[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  .blk .edit > summary.srow {
    border-top: 0;
  }
  .cols {
    display: flex;
    justify-content: space-between;
    margin: 8px 0 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .rows {
    list-style: none;
    margin: 4px 0 10px;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    min-height: 48px;
  }
  .rows li.off {
    color: var(--ink-3);
  }
  .in {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  .iname {
    overflow-wrap: break-word;
  }
  .in small,
  .w {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .w {
    margin-left: auto;
    text-align: right;
  }
  .where {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    color: var(--ink-3);
  }
  .racts {
    flex: none;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .step {
    display: flex;
    gap: 4px;
  }
  .sq {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .sq:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .quietx {
    border-color: transparent;
    color: var(--ink-3);
  }
  @media (hover: hover) and (pointer: fine) {
    .sq {
      width: 36px;
      height: 36px;
    }
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 4px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  .undopad {
    height: 80px;
  }
  /* v0.43.0 (Mehrfachauswahl): "Select" in the column header, rows with a box, the bar. */
  .cols {
    align-items: center;
  }
  .selb {
    min-height: 44px;
    margin: -8px 0;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 600 13px var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .rows li.pickli {
    padding: 0;
  }
  .pick {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    cursor: pointer;
  }
  .pick.on {
    background: var(--paper-2);
  }
  .pick input {
    width: 22px;
    height: 22px;
    margin: 0 0 0 2px;
    flex: none;
    accent-color: var(--ink);
  }
  .pick .iname {
    flex: 1;
    min-width: 0;
  }
  .undopad.sel {
    height: 150px;
  }
  .selbar {
    display: block;
  }
  .selbar .ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .selbar .ul span {
    flex: 1 1 160px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .bacts b {
    margin-right: auto;
  }
  .undo {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: var(--paper);
    border-top: 1.5px solid var(--line-strong);
    box-shadow: 0 -4px 14px var(--shadow);
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  @media (max-width: 719px) {
    .undo {
      bottom: calc(76px + env(safe-area-inset-bottom));
      padding-bottom: 8px;
    }
  }
  /* SN5+ F4: the quiet line of a block made from the favourites whose stars changed */
  .drift {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
    margin: -4px 0 8px 48px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .dlink {
    min-height: 32px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .dlink.quiet {
    color: var(--ink-3);
    font-weight: 400;
  }
  @media (pointer: coarse) {
    .dlink {
      min-height: 44px;
    }
  }
</style>
