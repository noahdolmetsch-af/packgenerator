<script>
  import Crumbs from '../lib/ui/Crumbs.svelte'; // P3b I2a: the full path back
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
   * SN3 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): the head with its path, «Neue
   * Tour» and «…» (rename, duplicate, archive, delete); the building blocks as big option buttons (as in
   * the trip window): green with ✓ = in it, white with + = add, dashed = on most trips from it; the
   * single items of a block fold away. Right: «Rahmen» (bike and bags, days, ready check) and what the
   * debriefs suggest, then a quiet line how often it was used.
   */
  import { liveQuery } from 'dexie';
  import { Pencil, Link2, Plus, Minus, X, ChevronRight, Route, Copy, Archive, Undo2, Trash2, Bike, Backpack, CalendarDays, ListChecks, Star, History } from '@lucide/svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Section from '../lib/ui/Section.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import OptionButton from '../lib/ui/OptionButton.svelte';
  import MoreActions from '../lib/ui/MoreActions.svelte';
  import Fold from '../lib/ui/Fold.svelte';
  import TripState from '../lib/ui/TripState.svelte';
  import { blockIcon, blockTone } from '../lib/blockicons.js';
  import { activeBlocks } from '../lib/context.js';
  import { tripStateInfo } from '../lib/tripstate.js';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, updateTemplate, saveTemplates, templateUse, tplByBike, tplDomain, duplicateTemplate, freeName, isLinked, linkTemplate } from '../lib/templates.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { STANDARD } from '../lib/blocks2026.js';
  import { nightName } from '../lib/context.js';
  import { knownWeight, formatWeight, itemWeight } from '../lib/gear.js';
  import { domainName, DOMAIN } from '../lib/domains.js';
  import { sortBikes } from '../lib/bikes.js';
  import { templateHints, applyTemplateHint, rejectTemplateHint, TEMPLATE_AFTER, REJECT_FOR } from '../lib/debrief.js';
  import { changeTemplates } from '../lib/tpl/toast.svelte.js';
  import { newTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { blockRows, extraRows, blockChoices, summary, blockHints } from '../lib/tpl/view.js';
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
  const ridesQ = liveQuery(() => db.rides.toArray());
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
  // SN3: «…» of the page (ui/MoreActions): rename, duplicate, archive or bring back, delete.
  const menu = $derived(
    tpl
      ? [
          { name: t('Rename'), icon: Pencil, run: startRename },
          { name: t('Duplicate'), icon: Copy, run: () => pickMenu('dup') },
          tpl.archivedAt ? { name: t('Bring back'), icon: Undo2, run: () => pickMenu('restore') } : { name: t('Archive'), explain: t('Not offered for new trips any more; nothing is deleted'), icon: Archive, run: () => pickMenu('archive') },
          { name: t('Delete'), icon: Trash2, run: () => pickMenu('delete') },
        ]
      : [],
  );

  /* ---------- building blocks ---------- */
  // SN3: one tap adds or leaves out a whole block; Standard stays (it is in every template).
  const hintOf = $derived(tpl ? blockHints(tpl, use.trips, activeBlocks) : {});
  const weightOf = (b) => (b.n && b.missing === b.n ? t('not weighed') : weight(b.g, b.missing, b.n));
  const subOf = (b) => [tn(b.n, '{n} item', '{n} items'), weightOf(b), b.without ? tn(b.without, 'without {n}', 'without {n}|plural') : ''].filter(Boolean).join(' · ');
  const leftOut = $derived(blocks.reduce((n, b) => n + b.without, 0));
  function addBlock(key) {
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
  let membersOpen = $state(false);
  const addExtra = (itemId) => edit((x) => ({ ...x, extras: [...(x.extras ?? []).filter((e) => e.itemId !== itemId), { itemId, qty: 1 }] }));
  const setExtraQty = (itemId, n) => edit((x) => ({ ...x, extras: (x.extras ?? []).map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(20, n)) } : e)) }));
  const removeExtra = (itemId) => edit((x) => ({ ...x, extras: (x.extras ?? []).filter((e) => e.itemId !== itemId) }));

  /* ---------- more ---------- */
  let openMore = $state(null);
  const toggleMore = (key) => (openMore = openMore === key ? null : key);
  const day = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(iso.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) }) : '');
  const nightWord = (x) => (x.overnight === 'outdoor' || x.overnight === 'lodging' ? t(nightName(x)) : t('no night'));
  const daysLine = $derived(tpl ? `${tn(tpl.days ?? 1, '{n} day', '{n} days')} · ${nightWord(tpl)}${byBike && tpl.hours ? ` · ${tpl.hours} h` : ''}` : '');
  // v0.19.0 / v0.28.0 (AP25): after 3 debriefs the template asks what you never used and what was missing.
  const doneN = $derived(($debriefsQ ?? []).filter((d) => d.status === 'done').length);
  const hints = $derived(tpl ? templateHints(tpl, trips, $debriefsQ ?? [], items) : []);
  const applyHint = (h) => edit((x) => applyTemplateHint(x, h, items, now(), doneN));
  const rejectHint = (h) => edit((x) => rejectTemplateHint(x, h, doneN));
  const tripTitle = $derived(Object.fromEntries(trips.map((x) => [x.id, x.title])));
  const logTrips = (x) => (x.trips ?? []).map((tid, n) => tripTitle[tid] ?? x.tripTitles?.[n] ?? tid).join(', ');
  const weight = (g, missing, n = 1) => (n ? knownWeight(g, missing) : '–');
  // SN3: the head line «4 Bausteine · 14 Teile · 2.21 kg · Gravel Grinder» and the last use with its state.
  const headLine = $derived(tpl && sum ? [tn(blocks.length, '{n} building block', '{n} building blocks'), tn(sum.n, '{n} item', '{n} items'), weight(sum.g, sum.missing, sum.n), byBike ? (bike?.name ?? '') : t(domainName(tplDomain(tpl)))].filter(Boolean).join(' · ') : '');
  const lastTrip = $derived(use.trips[0] ?? null);
  const lastState = $derived(lastTrip ? tripStateInfo(lastTrip, { debrief: ($debriefsQ ?? []).find((d) => d.tripId === lastTrip.id) ?? null, rides: $ridesQ ?? [], today }).state : null);
</script>

<div class="te">
  {#if !tpl}
    <Crumbs crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Templates'), href: '#/pack/templates' }]} here={t('Template')} />
    <p class="empty">{list.length || $tplQ ? t('This template no longer exists.') : ''}</p>
  {:else}
    <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Templates'), href: '#/pack/templates' }]} here={tpl.name} title={tpl.name} heading={renaming ? renameField : null} extra={headExtra}>
      <Btn kind="hi" icon={Route} label={t('New trip')} explain={t('New trip from it')} onclick={() => newTrip(tpl.id)} />
      <MoreActions title={tpl.name} label={t('More for {name}', { name: tpl.name })} actions={menu} />
    </PathHead>

    <div class="dgrid">
      <div class="dcol">
        <Section title={t('Building blocks')} sub={t('tap to add or leave out')} id="h-blocks">
          <div class="card bcard">
            <div class="ogrid" role="group" aria-labelledby="h-blocks">
              {#each blocks as b (b.key)}
                <OptionButton size="lg" pressed icon={blockIcon(b.key, b.name)} tone={blockTone(b.key, b.name)} label={b.name} sub={subOf(b)} explain={b.key === STANDARD ? t('Standard is in every template') : t('Leaves {block} out of this template', { block: b.name })} explainSub={b.members.filter((m) => m.on).map((m) => nameOf(m.item)).join(' · ')} onclick={() => (b.key === STANDARD ? (membersOpen = true) : removeBlock(b.key))} />
              {/each}
              {#each more as b (b.key)}
                <OptionButton size="lg" pressed={false} icon={blockIcon(b.key, b.name)} tone={blockTone(b.key, b.name)} label={b.name} sub={subOf({ ...b, without: 0 })} badge={hintOf[b.key] ? t('on {n} of {of} trips', hintOf[b.key]) : ''} explain={t('Adds {block} to this template', { block: b.name })} explainSub={b.members.map((m) => nameOf(m)).join(' · ')} onclick={() => addBlock(b.key)} />
              {/each}
            </div>
            <Fold label={t('Single items of the blocks')} summary={leftOut ? tn(leftOut, '{n} left out', '{n} left out') : t('all in it')} bind:open={membersOpen}>
              {#each blocks as b (b.key)}
                <p class="mh">{b.name}</p>
                <ul class="members">
                  {#each b.members as m (m.item.id)}
                    <li>
                      <label class="mem"><input type="checkbox" checked={m.on} onchange={(e) => toggleMember(b.key, m.item.id, e.currentTarget.checked)} /><span class="t" class:off={!m.on}>{nameOf(m.item)}</span><span class="w num">{itemWeight(m.item) == null ? '–' : formatWeight(itemWeight(m.item))}</span></label>
                    </li>
                  {:else}
                    <li class="note">{t('No items in this building block yet.')}</li>
                  {/each}
                </ul>
              {/each}
              <p class="note">{t('Untick an item to leave it out of this template only.')} <a href="#/blocks">{t('Change the building block')}</a></p>
            </Fold>
            <p class="shint"><Link2 size={15} aria-hidden="true" /><span>{t('Linked: change a building block and this template changes with it.')}</span></p>
          </div>
        </Section>

        <Section title={t('Single items')} sub={t('what is in no building block')} id="h-extra">
          <div class="card ecard">
            {#if extras.length}
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
                {/each}
              </ul>
            {/if}
            <div class="erow">
              {#if !extras.length}<p class="none">{t('No single items.')}</p>{/if}
              <Btn icon={Plus} label={t('Item')} aria-expanded={picking} onclick={() => (picking = !picking)} />
            </div>
            {#if picking}<div class="pickwrap"><ItemPicker {tpl} {items} {setsValue} onadd={addExtra} autofocus /></div>{/if}
          </div>
        </Section>
      </div>

      <div class="dcol">
        <Section title={t('Frame|template')} sub={t('comes into every new trip, changeable there')} id="h-frame">
          <ul class="card slist info">
            {#if byBike}
              <li>
                <button type="button" class="srow irow" aria-expanded={openMore === 'bike'} onclick={() => toggleMore('bike')}>
                  <span class="sib" aria-hidden="true"><Bike size={18} /></span>
                  <span class="sm"><b>{bike ? bike.name : t('Without bike')}</b><small>{bike ? tn(Object.values(tpl.setup ?? {}).filter(Boolean).length, '{n} bag', '{n} bags') : t('chosen with the trip')}</small></span>
                  <ChevronRight class="schev chev" size={18} aria-hidden="true" />
                </button>
                {#if openMore === 'bike'}<div class="inner"><BagSplit {tpl} {items} {setsValue} {bags} {bikes} onchange={edit} /></div>{/if}
              </li>
            {:else}
              <li class="srow">
                <span class="sib" aria-hidden="true"><Backpack size={18} /></span>
                <span class="sm"><b>{t('Bags')}</b><small>{(DOMAIN[tplDomain(tpl)]?.packs ?? []).map((p) => t(p.name)).join(', ')} · {t('chosen with the trip')}</small></span>
              </li>
            {/if}
            <li>
              <button type="button" class="srow irow" aria-expanded={openMore === 'days'} onclick={() => toggleMore('days')}>
                <span class="sib" aria-hidden="true"><CalendarDays size={18} /></span>
                <span class="sm"><b>{t('Days, overnight')}</b><small class="num">{daysLine}</small></span>
                <ChevronRight class="schev chev" size={18} aria-hidden="true" />
              </button>
              {#if openMore === 'days'}<div class="inner"><DaysFields {tpl} {byBike} onchange={edit} /></div>{/if}
            </li>
            <li>
              <button type="button" class="srow irow" aria-expanded={openMore === 'ready'} onclick={() => toggleMore('ready')}>
                <span class="sib" aria-hidden="true"><ListChecks size={18} /></span>
                <span class="sm"><b>{t('Ready check')}</b><small>{(tpl.ready ?? []).length ? tn(tpl.ready.length, '{n} point', '{n} points') : t('usual')}</small></span>
                <ChevronRight class="schev chev" size={18} aria-hidden="true" />
              </button>
              {#if openMore === 'ready'}<div class="inner"><ReadyFields {tpl} onchange={edit} /></div>{/if}
            </li>
          </ul>
        </Section>

        <Section title={t('From your debriefs')} sub={t('from rated trips with this template')} id="h-hints">
          <div class="card hcard hints">
            {#if hints.length}
              <ul class="slist hl">
                {#each hints as h (h.id)}
                  <li class="srow hint-row" data-hint={h.id}>
                    <span class="sib rated" aria-hidden="true"><Star size={18} /></span>
                    <span class="sm">
                      <b>{h.kind === 'out' ? t('Take {name} out of the template?', { name: h.name }) : t('Put {name} into the template?', { name: h.name })}</b>
                      <details class="src">
                        <summary>{h.kind === 'out' ? t('{count} of {of} trips not used', { count: h.count, of: h.of }) : t('Missing on {count} of {of} trips', { count: h.count, of: h.of })}</summary>
                        <span class="srcl">{h.kind === 'out' ? t('Not needed on:') : t('Missing on:')}</span>
                        <ul class="trips">
                          {#each h.trips as tr (tr.id)}<li><span class="tt">{tr.title}</span> <small>{[day(tr.startDate), tr.ctx].filter(Boolean).join(' · ')}</small></li>{/each}
                        </ul>
                      </details>
                    </span>
                    <span class="rowacts">
                      <Btn label={h.kind === 'out' ? t('Take out') : t('Put in')} onclick={() => applyHint(h)} />
                      <Btn kind="quiet" label={t('Not now')} onclick={() => rejectHint(h)} />
                    </span>
                  </li>
                {/each}
              </ul>
              <p class="note">{t('Not used does not mean not needed: you decide.')} {t('"Not now" asks again after {n} more debriefs.', { n: REJECT_FOR })}</p>
            {:else if doneN < TEMPLATE_AFTER}
              <p class="note">{t('After {n} debriefs the templates learn what you never use and what was missing ({done} of {n} done).', { n: TEMPLATE_AFTER, done: doneN })}</p>
            {:else}
              <p class="note">{t('Nothing to change right now.')}</p>
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
        </Section>

        <details class="used">
          <summary><History size={15} aria-hidden="true" /><span>{t('Used|template')}: {use.n ? `${tn(use.n, '{n} trip', '{n} trips')}, ${t('last {name}', { name: lastTrip?.title ?? '' })}` : t('not used yet')}</span>{#if lastState}<TripState state={lastState} />{/if}</summary>
          {#if use.trips.length}
            <ul class="trips">{#each use.trips as tr (tr.id)}<li><span class="tt">{tr.title}</span> <small class="num">{day(tr.startDate)}</small></li>{/each}</ul>
          {/if}
          <p class="note">{t('Counts trips started or ridden from this template, not planned ones. Trips stay copies: a later change of the template does not change them.')}</p>
        </details>
      </div>
    </div>
  {/if}
</div>

{#snippet renameField()}
  <form class="rn" onsubmit={rename}>
    <label class="sr" for="tpl-name">{t('Name')}</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="tpl-name" class="inp big-inp" bind:value={nameText} autofocus onkeydown={(e) => e.key === 'Escape' && ((renaming = false), (error = ''))} />
    <button type="submit" class="btn">{t('Save')}</button>
  </form>
{/snippet}

{#snippet headExtra()}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <p class="dmeta num">{headLine}{#if tpl.archivedAt}<i class="badge">{t('Archived')}</i>{/if}{#if saved}<span class="ok" role="status"> · {t('Saved ✓')}</span>{/if}</p>
  {#if tpl.note}<p class="tnote">{tpl.note}</p>{/if}
{/snippet}

<style>
  .te {
    max-width: 1240px;
  }
  .back {
    margin: 0;
  }
  .rn {
    display: flex;
    gap: 8px;
    min-width: 0;
  }
  .big-inp {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .dmeta {
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .ok {
    color: var(--ok);
  }
  .err {
    margin: 4px 0 0;
    color: var(--bad);
  }
  .tnote {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-style: italic;
    overflow-wrap: break-word;
  }
  .badge {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-style: normal;
    font-weight: 600;
    white-space: nowrap;
  }
  .dgrid {
    display: grid;
    gap: var(--sp-5);
  }
  @media (min-width: 1100px) {
    .dgrid {
      grid-template-columns: minmax(0, 1fr) 420px;
      align-items: start;
    }
  }
  .dcol {
    display: grid;
    gap: var(--sp-5);
    min-width: 0;
  }
  .ogrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
    gap: 16px 10px;
    padding-top: 6px;
    margin-bottom: var(--sp-3);
  }
  .mh {
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .members,
  .rows,
  .hints ul,
  .trips,
  .hist ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .mem {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
  }
  .mem input {
    width: 20px;
    height: 20px;
  }
  .t {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .off {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .note {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .n {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  .w {
    min-width: 60px;
    text-align: right;
    white-space: nowrap;
  }
  .extra {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto 44px;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .icb {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .icb:hover {
    background: var(--paper-2);
  }
  .extra :global(.chev),
  .irow :global(.chev) {
    transition: transform 0.15s;
  }
  .extra [aria-expanded='true'] :global(.chev),
  .irow[aria-expanded='true'] :global(.chev) {
    transform: rotate(90deg);
  }
  .ectl {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
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
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
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
  .erow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-3);
    margin-top: var(--sp-2);
  }
  .rows + .erow {
    margin-top: var(--sp-3);
  }
  .none {
    flex: 1 1 160px;
    margin: 0;
    color: var(--ink-2);
  }
  .pickwrap {
    margin-top: 12px;
  }
  .irow {
    width: 100%;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .inner {
    padding: 4px 0 12px;
  }
  .hl {
    padding: 0;
  }
  .src summary,
  .hist summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .srcl {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .trips li,
  .hist li {
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .trips small,
  .hist small {
    color: var(--ink-3);
  }
  .hist {
    margin-top: var(--sp-2);
    border-top: 1px solid var(--line);
  }
  .used {
    margin: 0 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .used summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    min-height: 44px;
    cursor: pointer;
  }
  .used summary span {
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
