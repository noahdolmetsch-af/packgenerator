<script>
  /**
   * One template (Noah, 4.10.2026, templates answer 7b), v0.39.0 (AP28, "Vorlagen neu"):
   *   - the name with a pencil to rename, ••• with Duplicate, Archive and Delete;
   *   - one line "Standard + Sleep + Rain + 1 extra · 21 items · 3.53 kg" and ONE orange "New trip from it";
   *   - Building blocks, linked (3a): a block's items come from the block as it is now; an item can
   *     be left out ("without", 1a); "+ Building block";
   *   - Extra: single items with amount, "+ Item";
   *   - Bike & bags: one line, the bags on tap (5a: bags only with a bike);
   *   - More: days and overnight stay, ready check, from the debriefs, used (7a).
   * Every change is saved at once (saveTemplates also rewrites the entries snapshot).
   */
  import { liveQuery } from 'dexie';
  import { Pencil, Link2, Plus, Minus, X, ChevronRight, Route } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, updateTemplate, saveTemplates, templateUse, tplByBike, tplDomain, duplicateTemplate, freeName, isLinked, linkTemplate } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { STANDARD } from '../lib/blocks2026.js';
  import { knownWeight, formatWeight, itemWeight } from '../lib/gear.js';
  import { domainName, DOMAIN } from '../lib/domains.js';
  import { sortBikes } from '../lib/bikes.js';
  import { templateHints, applyTemplateHint, rejectTemplateHint, TEMPLATE_AFTER, REJECT_FOR } from '../lib/debrief.js';
  import { changeTemplates } from '../lib/tpl/toast.svelte.js';
  import { newTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { blockRows, extraRows, blockChoices, summary } from '../lib/tpl/view.js';
  import Menu from '../lib/tpl/Menu.svelte';
  import ItemPicker from '../lib/tpl/ItemPicker.svelte';
  import BagSplit from '../lib/tpl/BagSplit.svelte';
  import DaysFields from '../lib/tpl/DaysFields.svelte';
  import ReadyFields from '../lib/tpl/ReadyFields.svelte';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';

  let { id } = $props();

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const list = $derived($tplQ?.value ?? []);
  const raw = $derived(list.find((x) => x.id === id) ?? null);
  const items = $derived($itemsQ ?? []);
  const setsValue = $derived($setsQ?.value ?? []);
  // An older template (before the update ran) is shown linked; the first change saves it linked.
  const tpl = $derived(raw && !isLinked(raw) ? linkTemplate(raw, items, setsValue) : raw);
  const bags = $derived($bagsQ ?? []);
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const trips = $derived($tripsQ ?? []);
  const today = localDay();
  const byBike = $derived(tpl ? tplByBike(tpl) : true);
  const sum = $derived(tpl ? summary(tpl, items, setsValue) : null);
  const blocks = $derived(tpl ? blockRows(tpl, items, setsValue) : []);
  const extras = $derived(tpl ? extraRows(tpl, items, setsValue) : []);
  const more = $derived(tpl ? blockChoices(items, setsValue, tplDomain(tpl)).filter((b) => !tpl.blocks?.includes(b.key)) : []);
  const use = $derived(tpl ? templateUse(tpl, trips, today) : { n: 0, last: null, trips: [] });
  const bike = $derived(tpl?.bikeId ? bikes.find((b) => b.id === tpl.bikeId) ?? null : null);

  let saved = $state(false);
  let timer;
  async function edit(fn) {
    if (raw && !isLinked(raw)) await saveTemplates(db, list.map((x) => (x.id === id ? linkTemplate(x, items, setsValue) : x)));
    await updateTemplate(db, id, fn);
    saved = true;
    clearTimeout(timer);
    timer = setTimeout(() => (saved = false), 2000);
  }
  $effect(() => () => clearTimeout(timer));

  /* ---------- name ---------- */
  let renaming = $state(false);
  let nameText = $state('');
  let error = $state('');
  function startRename() {
    nameText = tpl.name;
    error = '';
    renaming = true;
  }
  async function rename(e) {
    e?.preventDefault();
    const clean = nameText.trim();
    if (!clean) return (error = t('Give the template a name.'));
    if (list.some((x) => x.id !== id && x.name.toLowerCase() === clean.toLowerCase())) return (error = t('There is already a template "{name}".', { name: clean }));
    renaming = false;
    error = '';
    if (clean !== tpl.name) await edit((x) => ({ ...x, name: clean }));
  }

  /* ---------- ••• : duplicate, archive, delete (each with Undo) ---------- */
  async function change(fn, text, after = null) {
    await changeTemplates(fn, text);
    after?.();
  }
  const now = () => new Date().toISOString();
  function pickMenu(key) {
    if (key === 'dup') {
      const nid = `tpl-${Date.now().toString(36)}`;
      change((l) => [...l, duplicateTemplate(tpl, { id: nid, name: freeName(t('{name} copy', { name: tpl.name }), l), now: now() })], t('Copy made'), () => (location.hash = `#/pack/templates/${encodeURIComponent(nid)}`));
    }
    if (key === 'archive') change((l) => l.map((x) => (x.id === id ? { ...x, archivedAt: now() } : x)), t('{name} archived', { name: tpl.name }));
    if (key === 'restore') change((l) => l.map((x) => (x.id === id ? { ...x, archivedAt: null, keptAt: now() } : x)), t('{name} is back', { name: tpl.name }));
    if (key === 'delete') {
      if (!confirm(t('Delete the template "{name}"? Trips made from it stay. A backup file can bring it back.', { name: tpl.name }))) return;
      change((l) => l.filter((x) => x.id !== id), t('{name} deleted', { name: tpl.name }), () => (location.hash = '#/pack/templates'));
    }
  }
  const menu = $derived(
    tpl
      ? [
          { key: 'dup', label: t('Duplicate') },
          tpl.archivedAt ? { key: 'restore', label: t('Bring back') } : { key: 'archive', label: t('Archive') },
          { key: 'delete', label: t('Delete'), bad: true },
        ]
      : [],
  );

  /* ---------- building blocks ---------- */
  let openBlock = $state(null);
  let adding = $state(false);
  function addBlock(key) {
    adding = false;
    edit((x) => {
      const members = new Set(blockChoices(items, setsValue, tplDomain(x)).find((b) => b.key === key)?.members.map((i) => i.id) ?? []);
      return { ...x, blocks: [...(x.blocks ?? []), key], extras: (x.extras ?? []).filter((e) => !members.has(e.itemId)) };
    });
  }
  function removeBlock(key) {
    edit((x) => {
      const { [key]: _, ...without } = x.without ?? {};
      return { ...x, blocks: (x.blocks ?? []).filter((k) => k !== key), without };
    });
  }
  function toggleMember(key, itemId, on) {
    edit((x) => {
      const out = new Set(x.without?.[key] ?? []);
      if (on) out.delete(itemId);
      else out.add(itemId);
      const without = { ...(x.without ?? {}) };
      if (out.size) without[key] = [...out];
      else delete without[key];
      return { ...x, without };
    });
  }

  /* ---------- extras ---------- */
  let openExtra = $state(null);
  let picking = $state(false);
  const addExtra = (itemId) => edit((x) => ({ ...x, extras: [...(x.extras ?? []).filter((e) => e.itemId !== itemId), { itemId, qty: 1 }] }));
  const setExtraQty = (itemId, n) => edit((x) => ({ ...x, extras: (x.extras ?? []).map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, n)) } : e)) }));
  const removeExtra = (itemId) => edit((x) => ({ ...x, extras: (x.extras ?? []).filter((e) => e.itemId !== itemId) }));

  /* ---------- more ---------- */
  let openMore = $state(null);
  const toggleMore = (key) => (openMore = openMore === key ? null : key);
  const day = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(iso.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) }) : '');
  const nightWord = (x) => (x.overnight === 'outdoor' ? t('Outdoor') : x.overnight === 'lodging' ? t('Lodging') : t('no night'));
  const daysLine = $derived(tpl ? `${tn(tpl.days ?? 1, '{n} day', '{n} days')} · ${nightWord(tpl)}${byBike && tpl.hours ? ` · ${tpl.hours} h` : ''}` : '');
  // v0.19.0 / v0.28.0 (AP25): after 3 debriefs the template asks what you never used and what was missing.
  const doneN = $derived(($debriefsQ ?? []).filter((d) => d.status === 'done').length);
  const hints = $derived(tpl ? templateHints(tpl, trips, $debriefsQ ?? [], items) : []);
  const applyHint = (h) => edit((x) => applyTemplateHint(x, h, items, now(), doneN));
  const rejectHint = (h) => edit((x) => rejectTemplateHint(x, h, doneN));
  const tripTitle = $derived(Object.fromEntries(trips.map((x) => [x.id, x.title])));
  const logTrips = (x) => (x.trips ?? []).map((tid, n) => tripTitle[tid] ?? x.tripTitles?.[n] ?? tid).join(', ');
  const weight = (g, missing, n = 1) => (n ? knownWeight(g, missing) : '–');
</script>

<div class="te">
  <p class="back"><a href="#/pack/templates">← {t('Templates')}</a></p>
  {#if !tpl}
    <p class="empty">{list.length || $tplQ ? t('This template no longer exists.') : ''}</p>
  {:else}
    <header class="dhead">
      <div class="t1">
        {#if renaming}
          <form class="rn" onsubmit={rename}>
            <label class="sr" for="tpl-name">{t('Name')}</label>
            <!-- svelte-ignore a11y_autofocus -->
            <input id="tpl-name" class="inp big-inp" bind:value={nameText} autofocus onkeydown={(e) => e.key === 'Escape' && ((renaming = false), (error = ''))} />
            <button type="submit" class="btn">{t('Save')}</button>
          </form>
        {:else}
          <h1 class="title big">{tpl.name}</h1>
          <button type="button" class="icb" aria-label={t('Rename {name}', { name: tpl.name })} onclick={startRename}><Pencil size={20} aria-hidden="true" /></button>
        {/if}
        <Menu label={t('More for {name}', { name: tpl.name })} actions={menu} onpick={pickMenu} />
      </div>
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <p class="dmeta num"><b>{sum.line}</b> · {tn(sum.n, '{n} item', '{n} items')} · {weight(sum.g, sum.missing, sum.n)}{#if !byBike} · {t(domainName(tplDomain(tpl)))}{/if}{#if tpl.archivedAt}<i class="badge">{t('Archived')}</i>{/if}{#if saved}<span class="ok" role="status"> · {t('Saved ✓')}</span>{/if}</p>
      {#if tpl.note}<p class="tnote">{tpl.note}</p>{/if}
    </header>
    <div class="cta">
      <button type="button" class="btn hi" onclick={() => newTrip(tpl.id)}><Route size={18} aria-hidden="true" /> {t('New trip from it')}</button>
    </div>

    <div class="dgrid">
      <div>
        <section aria-labelledby="h-blocks">
          <div class="sh"><h2 id="h-blocks">{t('Building blocks')}</h2>{#if more.length}<button type="button" class="shadd" aria-expanded={adding} onclick={() => (adding = !adding)}><Plus size={16} aria-hidden="true" /> {t('Building block')}</button>{/if}</div>
          {#if adding}
            <ul class="picklist">
              {#each more as b (b.key)}<li><button type="button" class="pick" onclick={() => addBlock(b.key)}><Plus size={16} aria-hidden="true" /><span class="t">{b.name}</span><span class="n num">{b.n}</span><span class="w num">{weight(b.g, b.missing, b.n)}</span></button></li>{/each}
            </ul>
          {/if}
          <ul class="rows">
            {#each blocks as b (b.key)}
              <li class="blk">
                <button type="button" class="bmain" aria-expanded={openBlock === b.key} onclick={() => (openBlock = openBlock === b.key ? null : b.key)}>
                  <Link2 size={18} aria-hidden="true" />
                  <span class="t">{b.name}{#if b.without}<small>{tn(b.without, 'without {n}', 'without {n}|plural')}</small>{/if}</span>
                  <span class="n num">{b.n}</span><span class="w num">{weight(b.g, b.missing, b.n)}</span>
                </button>
                {#if b.key !== STANDARD}<Menu label={t('More for {name}', { name: b.name })} actions={[{ key: 'show', label: openBlock === b.key ? t('Hide items') : t('Show items') }, { key: 'remove', label: t('Remove from template'), bad: true }]} onpick={(k) => (k === 'remove' ? removeBlock(b.key) : (openBlock = openBlock === b.key ? null : b.key))} />{:else}<span class="icb-pad"></span>{/if}
                {#if openBlock === b.key}
                  <ul class="members">
                    {#each b.members as m (m.item.id)}
                      <li>
                        <label class="mem"><input type="checkbox" checked={m.on} onchange={(e) => toggleMember(b.key, m.item.id, e.currentTarget.checked)} /><span class="t" class:off={!m.on}>{nameOf(m.item)}</span><span class="w num">{itemWeight(m.item) == null ? '–' : formatWeight(itemWeight(m.item))}</span></label>
                      </li>
                    {:else}
                      <li class="note">{t('No items in this building block yet.')}</li>
                    {/each}
                  </ul>
                  <p class="note">{t('Untick an item to leave it out of this template only.')} <a href="#/blocks">{t('Change the building block')}</a></p>
                {/if}
              </li>
            {/each}
          </ul>
          <p class="note link"><Link2 size={14} aria-hidden="true" /> {t('Linked: change a building block and this template changes with it.')}</p>
        </section>

        <section aria-labelledby="h-extra">
          <div class="sh"><h2 id="h-extra">{t('Extra')}</h2><button type="button" class="shadd" aria-expanded={picking} onclick={() => (picking = !picking)}><Plus size={16} aria-hidden="true" /> {t('Item')}</button></div>
          <ul class="rows">
            {#each extras as e (e.itemId)}
              <li class="extra">
                <span class="t">{e.item ? nameOf(e.item) : e.itemId}</span>
                <span class="n num">{e.qty}×</span><span class="w num">{e.g == null ? '–' : formatWeight(e.g)}</span>
                <button type="button" class="icb" aria-label={t('Change {name}', { name: e.item ? nameOf(e.item) : e.itemId })} aria-expanded={openExtra === e.itemId} onclick={() => (openExtra = openExtra === e.itemId ? null : e.itemId)}><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
                {#if openExtra === e.itemId}
                  <div class="ectl">
                    <span class="qty" role="group" aria-label={t('Amount')}>
                      <button type="button" aria-label={t('Fewer')} disabled={e.qty <= 1} onclick={() => setExtraQty(e.itemId, e.qty - 1)}><Minus size={16} aria-hidden="true" /></button>
                      <span class="num">{e.qty}×</span>
                      <button type="button" aria-label={t('More')} disabled={e.qty >= 20} onclick={() => setExtraQty(e.itemId, e.qty + 1)}><Plus size={16} aria-hidden="true" /></button>
                    </span>
                    <button type="button" class="btn sm del" onclick={() => removeExtra(e.itemId)}><X size={16} aria-hidden="true" /> {t('Remove')}</button>
                  </div>
                {/if}
              </li>
            {:else}
              <li class="note none">{t('No single items.')}</li>
            {/each}
          </ul>
          {#if picking}<div class="pickwrap"><ItemPicker {tpl} {items} {setsValue} onadd={addExtra} autofocus /></div>{/if}
        </section>
      </div>

      <div>
        {#if byBike}
          <section aria-labelledby="h-bike">
            <div class="sh"><h2 id="h-bike">{t('Bike & bags')}</h2></div>
            <ul class="info">
              <li>
                <button type="button" class="irow" aria-expanded={openMore === 'bike'} onclick={() => toggleMore('bike')}>
                  <span>{bike ? bike.name : t('Without bike')}</span><span class="v num">{bike ? tn(Object.values(tpl.setup ?? {}).filter(Boolean).length, '{n} bag', '{n} bags') : t('chosen with the trip')}</span><ChevronRight class="chev" size={18} aria-hidden="true" />
                </button>
                {#if openMore === 'bike'}<div class="inner"><BagSplit {tpl} {items} {setsValue} {bags} {bikes} onchange={edit} /></div>{/if}
              </li>
            </ul>
          </section>
        {:else}
          <section aria-labelledby="h-bags">
            <div class="sh"><h2 id="h-bags">{t('Bags')}</h2></div>
            <p class="note">{(DOMAIN[tplDomain(tpl)]?.packs ?? []).map((p) => t(p.name)).join(', ')} · {t('chosen with the trip')}</p>
          </section>
        {/if}
        <section aria-labelledby="h-more">
          <div class="sh"><h2 id="h-more">{t('More')}</h2></div>
          <ul class="info">
            <li>
              <button type="button" class="irow" aria-expanded={openMore === 'days'} onclick={() => toggleMore('days')}><span>{t('Days, overnight')}</span><span class="v num">{daysLine}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
              {#if openMore === 'days'}<div class="inner"><DaysFields {tpl} {byBike} onchange={edit} /></div>{/if}
            </li>
            <li>
              <button type="button" class="irow" aria-expanded={openMore === 'ready'} onclick={() => toggleMore('ready')}><span>{t('Ready check')}</span><span class="v num">{(tpl.ready ?? []).length || t('usual')}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
              {#if openMore === 'ready'}<div class="inner"><ReadyFields {tpl} onchange={edit} /></div>{/if}
            </li>
            <li>
              <button type="button" class="irow" aria-expanded={openMore === 'hints'} onclick={() => toggleMore('hints')}><span>{t('From your debriefs')}</span><span class="v num">{#if hints.length}<i class="badge">{tn(hints.length, '{n} suggestion', '{n} suggestions')}</i>{:else if doneN < TEMPLATE_AFTER}{t('{done} of {n}', { done: doneN, n: TEMPLATE_AFTER })}{:else}{t('none|suggestions')}{/if}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
              {#if openMore === 'hints'}
                <div class="inner hints">
                  {#if doneN < TEMPLATE_AFTER}<p class="note">{t('After {n} debriefs the templates learn what you never use and what was missing ({done} of {n} done).', { n: TEMPLATE_AFTER, done: doneN })}</p>{/if}
                  {#if hints.length}
                    <p class="note">{t('Not used does not mean not needed: you decide.')}</p>
                    <ul>
                      {#each hints as h (h.id)}
                        <li class="hint-row" data-hint={h.id}>
                          <b>{h.kind === 'out' ? t('Take {name} out of the template?', { name: h.name }) : t('Put {name} into the template?', { name: h.name })}</b>
                          <details class="src">
                            <summary>{h.kind === 'out' ? t('{count} of {of} trips not used', { count: h.count, of: h.of }) : t('Missing on {count} of {of} trips', { count: h.count, of: h.of })}</summary>
                            <span class="srcl">{h.kind === 'out' ? t('Not needed on:') : t('Missing on:')}</span>
                            <ul class="trips">
                              {#each h.trips as tr (tr.id)}<li><span class="tt">{tr.title}</span> <small>{[day(tr.startDate), tr.ctx].filter(Boolean).join(' · ')}</small></li>{/each}
                            </ul>
                          </details>
                          <div class="hacts">
                            <button type="button" class="btn sm" onclick={() => applyHint(h)}>{h.kind === 'out' ? t('Take out') : t('Put in')}</button>
                            <button type="button" class="btn sm" onclick={() => rejectHint(h)}>{t('Not now')}</button>
                          </div>
                        </li>
                      {/each}
                    </ul>
                    <p class="note">{t('"Not now" asks again after {n} more debriefs.', { n: REJECT_FOR })}</p>
                  {/if}
                  {#if tpl.hintLog?.length}
                    <details class="hist">
                      <summary>{t('History')} ({tpl.hintLog.length})</summary>
                      <ul>
                        {#each [...tpl.hintLog].reverse() as x, n (n)}
                          <li><b>{x.decision === 'applied' ? t('Applied') : t('Not now')}</b>: {x.kind === 'out' ? t('Take out: {name}', { name: x.name ?? x.itemId }) : t('Put in: {name}', { name: x.name ?? x.itemId })} <small>{day(x.at)}{#if x.trips?.length}{' · '}{t('from {trips}', { trips: logTrips(x) })}{/if}</small></li>
                        {/each}
                      </ul>
                    </details>
                  {/if}
                </div>
              {/if}
            </li>
            <li>
              <button type="button" class="irow" aria-expanded={openMore === 'used'} onclick={() => toggleMore('used')}><span>{t('Used|template')}</span><span class="v num">{use.n ? `${tn(use.n, '{n} trip', '{n} trips')} · ${t('last {date}', { date: day(use.last) })}` : t('not used yet')}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
              {#if openMore === 'used'}
                <div class="inner">
                  {#if use.trips.length}
                    <ul class="trips">{#each use.trips as tr (tr.id)}<li><span class="tt">{tr.title}</span> <small class="num">{day(tr.startDate)}</small></li>{/each}</ul>
                  {/if}
                  <p class="note">{t('Counts trips started or ridden from this template, not planned ones. Trips stay copies: a later change of the template does not change them.')}</p>
                </div>
              {/if}
            </li>
          </ul>
        </section>
      </div>
    </div>
  {/if}
</div>


<style>
  .te {
    max-width: 1040px;
  }
  .back {
    margin: 0;
  }
  .dhead {
    display: grid;
    gap: 4px;
    margin: 4px 0 8px;
  }
  .t1 {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .t1 h1 {
    flex: 1;
    min-width: 0;
  }
  .big {
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .rn {
    flex: 1;
    display: flex;
    gap: 8px;
    min-width: 0;
  }
  .big-inp {
    font-size: 20px;
    font-weight: 600;
  }
  .icb {
    flex: none;
    width: 44px;
    height: 44px;
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-2);
    border-radius: 8px;
    cursor: pointer;
  }
  .icb:hover {
    background: var(--paper-2);
  }
  .icb-pad {
    width: 44px;
  }
  .dmeta {
    margin: 0;
    color: var(--ink-2);
    font-size: 15px;
    overflow-wrap: break-word;
  }
  .dmeta b {
    color: var(--ink);
  }
  .ok {
    color: var(--ok);
  }
  .err {
    color: var(--bad);
    margin: 0;
  }
  .srcl {
    display: block;
    margin-top: 6px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .tnote {
    margin: 0;
    color: var(--ink-2);
    font-style: italic;
    overflow-wrap: break-word;
  }
  .badge {
    display: inline-block;
    margin-left: 8px;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    white-space: nowrap;
  }
  .cta {
    display: flex;
    margin: 8px 0 12px;
  }
  .cta .btn.hi {
    flex: 1;
    min-height: 48px;
  }
  @media (min-width: 720px) {
    .cta .btn.hi {
      flex: none;
    }
  }
  .dgrid {
    display: grid;
    gap: 8px 40px;
  }
  @media (min-width: 900px) {
    .dgrid {
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      align-items: start;
    }
  }
  section {
    margin-bottom: 16px;
  }
  /* Light section headers. */
  .sh {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .sh h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-3);
  }
  .shadd {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    border: 0;
    background: none;
    font: 600 14px var(--font-body);
    color: var(--ink);
    padding: 0 2px;
    cursor: pointer;
  }
  .rows,
  .picklist,
  .members,
  .info {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .blk {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .bmain,
  .pick {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px 10px;
    min-height: 52px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    padding: 0;
    cursor: pointer;
    width: 100%;
  }
  .bmain :global(svg) {
    color: var(--ink-3);
  }
  .pick {
    border-bottom: 1px solid var(--line);
    min-height: 48px;
  }
  .t {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .t small {
    display: block;
    color: var(--ink-3);
    font-size: 13px;
  }
  .n {
    color: var(--ink-3);
    font-size: 14px;
    text-align: right;
  }
  .w {
    text-align: right;
    min-width: 60px;
    white-space: nowrap;
  }
  .members {
    grid-column: 1 / -1;
    padding: 0 0 4px 32px;
  }
  .mem {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-size: 15px;
    cursor: pointer;
  }
  .mem input {
    width: 20px;
    height: 20px;
  }
  .off {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .blk > .note {
    grid-column: 1 / -1;
    padding: 0 0 8px 32px;
  }
  .note {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--ink-3);
  }
  .note.link {
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
  .note.none {
    padding: 10px 0;
    margin: 0;
    border-bottom: 1px solid var(--line);
  }
  .extra {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto 44px;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .extra :global(.chev),
  .irow :global(.chev) {
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .extra [aria-expanded='true'] :global(.chev),
  .irow[aria-expanded='true'] :global(.chev) {
    transform: rotate(90deg);
  }
  .ectl {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    padding: 0 0 10px;
  }
  .qty {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .qty button {
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line);
    background: var(--paper);
    border-radius: 6px;
    display: grid;
    place-items: center;
    color: var(--ink);
    cursor: pointer;
  }
  .qty button:disabled {
    opacity: 0.4;
  }
  .del {
    border-color: var(--bad);
    color: var(--bad);
  }
  .pickwrap {
    margin-top: 12px;
  }
  .irow {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 20px;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: 400 16px var(--font-body);
    text-align: left;
    padding: 0;
    cursor: pointer;
  }
  .irow > span:first-child {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .v {
    color: var(--ink-2);
    font-size: 15px;
    text-align: right;
  }
  .inner {
    padding: 4px 0 8px;
    border-bottom: 1px solid var(--line);
  }
  .hints ul,
  .trips,
  .hist ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .hint-row {
    display: grid;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .src summary,
  .hist summary {
    cursor: pointer;
    min-height: 44px;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  .trips li,
  .hist li {
    font-size: 14px;
    overflow-wrap: break-word;
  }
  .trips small,
  .hist small {
    color: var(--ink-3);
  }
  .hacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hacts .btn {
    min-height: 44px;
  }
</style>
