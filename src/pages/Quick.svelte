<script>
  /**
   * «Quick Links» (Noah 28.10.2026 «1a 2a 3a 4a 5a»): your shortcuts to the functions of the app, its own
   * place in the bar (#/quick). Step 1: 20 suggestions to start, pins in your own groups, «Edit» to
   * rename, note, regroup, order (arrows and drag) and unpin with Undo, «Add a pin» from all functions,
   * and the pins of the other device to take over (Noah «13»: phone and computer keep their own).
   * A tap on a pin goes to its function (goFeature: the page, the action, the spot). Model: lib/quick/quicklinks.js.
   */
  import { Plus, Pencil, Check, ChevronRight, Search as SearchIcon, X, Trash2, ArrowRightLeft, Play } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import GroupActions from '../lib/ui/GroupActions.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { db } from '../lib/db.js';
  import { FEATURES, FEATURE, FEATURE_GROUPS } from '../lib/features.js';
  import { goFeature, runOf } from '../lib/know/featureRun.js';
  import { MARK_KEYS } from '../lib/quick/pinmarks.js';
  import { glowFeature } from '../lib/quick/findcard.js';
  import { USAGE_KEYS, cleanUsage, suggestions, stalePins, usePin, pathOf } from '../lib/quick/usage.js';
  import { localDay } from '../lib/localday.js';
  import { startTour } from '../lib/tour/run.js';
  import {
    QUICK_KEYS, deviceKind, otherKind, cleanQuick, groupLabel, pinLabel, pinsIn, isPinned, shownGroups, addView, isViewPinned,
    addPin, removePin, editPin, movePin, addGroup, renameGroup, deleteGroup, moveGroup, findForPin,
  } from '../lib/quick/quicklinks.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/tools/tools.css';

  const kind = deviceKind();
  const KEY = QUICK_KEYS[kind];
  const OTHER = QUICK_KEYS[otherKind(kind)];
  const USED = USAGE_KEYS[kind];
  const today = localDay();

  let s = $state(cleanQuick(null));
  let other = $state(null);
  let bikeId = $state(null);
  let editing = $state(false);
  let adding = $state(false);
  let addTo = $state('');
  let q = $state('');
  let deleting = $state(null);
  let newGroupOpen = $state(false);
  let groupText = $state('');
  let open = $state(null); // the pin whose name and note are being changed
  let marksOn = $state(true); // step 2: the small pin on every card in the app
  let u = $state(cleanUsage(null)); // step 4: what this device opened lately

  $effect(() => {
    const sub = liveQuery(() => db.settings.bulkGet([KEY, OTHER, MARK_KEYS.on, USED])).subscribe({
      next: ([mine, theirs, marks, used]) => {
        u = cleanUsage(used?.value);
        marksOn = marks?.value !== false;
        s = cleanQuick(mine?.value);
        other = theirs?.value ? cleanQuick(theirs.value) : null;
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  });
  db.bikes.toCollection().first().then((b) => (bikeId = b?.id ?? null)).catch(() => {});

  const groups = $derived(shownGroups(s));
  // step 4 (Noah «6a 7a», «20»): recently opened, one suggestion to pin, one pin to tidy up
  const recent = $derived(u.recent.slice(0, 5));
  const suggest = $derived(suggestions(u, s, today)[0] ?? null);
  const stale = $derived(s.pins.find((p) => p.id === stalePins(u, s, today)[0]) ?? null);
  const saveUsage = (next) => db.settings.put({ key: USED, value: JSON.parse(JSON.stringify(next)) });
  const pinView = (r) => change(addView(s, r.href, r.title, s.groups[0]?.id ?? '', today), t('«{name}» pinned.', { name: r.title }));
  const noThanks = (r) => saveUsage({ ...u, no: { ...u.no, [pathOf(r.href)]: today } });
  const keep = (p) => saveUsage({ ...u, keep: { ...u.keep, [p.id]: today } });
  const gName = (g) => groupLabel(g, t);
  const hits = $derived(findForPin(FEATURES, q, t).slice(0, 40));
  const here = $derived(kind === 'phone' ? t('this phone') : t('this computer'));
  const there = $derived(kind === 'phone' ? t('the computer') : t('the phone'));

  const save = (next) => db.settings.put({ key: KEY, value: JSON.parse(JSON.stringify(next)) });
  async function change(next, text) {
    const before = $state.snapshot(s);
    s = next;
    await save(next);
    if (text) offerDone(text, () => save(before));
  }

  // step 3 (Noah «5a»): go to the spot and light it up; a view opens with its filter (Noah «18a»)
  function go(p) {
    saveUsage(usePin(u, p.id, today));
    if (!p.feature) return void (location.hash = p.href);
    const f = FEATURE[p.feature];
    if (!f) return;
    goFeature(f, { bikeId });
    if (!runOf(f)) glowFeature(f.id); // an action (a window, a trip) has no card to light up
  }
  const pin = (f) => change(addPin(s, f.id, addTo), t('«{name}» pinned.', { name: t(f.title) }));
  const unpin = (p) => change(removePin(s, p.id), t('«{name}» unpinned.', { name: pinLabel(p, t) }));
  const regroup = (p, gid) => change(editPin(s, p.id, { group: gid }));
  const move = (gid, a, b) => change(movePin(s, gid, a, b));
  const moveG = (a, b) => change(moveGroup(s, a, b));
  function saveText(p, e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    change(editPin(s, p.id, { name: String(fd.get('name') ?? ''), note: String(fd.get('note') ?? '') }), t('Pin saved.'));
    open = null;
  }
  function rename(g, v) {
    change(renameGroup(s, g.id, v), v.trim() ? t('Group renamed to «{name}».', { name: v.trim() }) : null);
  }
  const removeGroup = (g, to) => change(deleteGroup(s, g.id, to ?? ''), t('Group «{name}» deleted. The pins are still there.', { name: gName(g) }));
  function newGroup(e) {
    e.preventDefault();
    if (!groupText.trim()) return;
    change(addGroup(s, groupText));
    groupText = '';
    newGroupOpen = false;
  }
  function setMarks(v) {
    db.settings.put({ key: MARK_KEYS.on, value: v });
    offerDone(v ? t('Pins on the cards are on.') : t('Pins on the cards are off.'), () => db.settings.put({ key: MARK_KEYS.on, value: !v }));
  }
  const takeOver = () => other && change(other, t('Pins of {device} taken over.', { device: there }));
</script>

<div class="ich-page ql-page" data-quick={kind}>
  <VeloHead title={t('Quick Links|place')} sub={t('Your shortcuts. Pin the functions you use most; a tap takes you straight there.')}>
    <button type="button" class="btn" aria-expanded={adding} onclick={() => ((adding = !adding), (q = ''), (addTo = s.groups[0]?.id ?? ''))}><Plus size={16} aria-hidden="true" />{t('Add a pin')}</button>
    <button type="button" class="btn" data-quick-editbtn aria-pressed={editing} onclick={() => ((editing = !editing), (open = null))}>
      {#if editing}<Check size={16} aria-hidden="true" />{t('Done')}{:else}<Pencil size={16} aria-hidden="true" />{t('Edit|quick')}{/if}
    </button>
  </VeloHead>
  <p class="tool-help ql-dev" data-quick-device>{t('These pins are for {device}. The other device keeps its own.', { device: here })}</p>

  {#if adding}
    <section class="tool-card ql-add" data-quick-add aria-labelledby="ql-add-h">
      <h2 id="ql-add-h" class="ql-h2">{t('Add a pin')}</h2>
      <div class="tool-row">
        <label class="tool-field ql-q"><span>{t('Search the functions')}</span>
          <span class="ql-qin"><SearchIcon size={16} aria-hidden="true" /><input class="tool-input" type="search" bind:value={q} autocomplete="off" placeholder={t('e.g. chain, weather, packing')} /></span>
        </label>
        <label class="tool-field"><span>{t('Into the group')}</span>
          <select class="tool-input" bind:value={addTo}>
            {#each s.groups as g (g.id)}<option value={g.id}>{gName(g)}</option>{/each}
            <option value="">{t('Without a group|quick')}</option>
          </select>
        </label>
      </div>
      {#snippet row(f)}
        {@const on = isPinned(s, f.id)}
        <li data-quick-fn={f.id}>
          <span class="ql-m"><b>{t(f.title)}</b><small>{t(f.text)}</small></span>
          {#if on}<span class="ql-on"><Check size={15} aria-hidden="true" />{t('Pinned|quick')}</span>
          {:else}<button type="button" class="btn sm" aria-label={t('Pin «{name}»', { name: t(f.title) })} onclick={() => pin(f)}><Plus size={15} aria-hidden="true" />{t('Pin|quick')}</button>{/if}
        </li>
      {/snippet}
      {#if q.trim()}
        {#if hits.length}<ul class="tool-list ql-fns">{#each hits as f (f.id)}{@render row(f)}{/each}</ul>
        {:else}<p class="tool-muted">{t('No function found. Try another word.')}</p>{/if}
      {:else}
        {#each FEATURE_GROUPS as fg (fg.key)}
          {@const fs = FEATURES.filter((f) => f.group === fg.key)}
          <details class="ql-fold"><summary>{t(fg.label)} <span class="ql-n">{fs.length}</span></summary>
            <ul class="tool-list ql-fns">{#each fs as f (f.id)}{@render row(f)}{/each}</ul>
          </details>
        {/each}
      {/if}
      <div class="tool-row"><button type="button" class="btn btn-link" onclick={() => (adding = false)}><X size={15} aria-hidden="true" />{t('Close')}</button></div>
    </section>
  {/if}

  {#if suggest}
    <div class="ql-tip" role="status" data-quick-suggest={suggest.href}>
      <p>{t('You often open «{name}». Pin it here?', { name: suggest.title })}</p>
      <div class="tool-row">
        <button type="button" class="btn sm hi" onclick={() => pinView(suggest)}><Plus size={15} aria-hidden="true" />{t('Pin|quick')}</button>
        <button type="button" class="btn sm" onclick={() => noThanks(suggest)}>{t('No, thanks')}</button>
      </div>
    </div>
  {/if}
  {#if stale && !editing}
    <div class="ql-tip" role="status" data-quick-stale={stale.id}>
      <p>{t('You have not opened «{name}» for 30 days. Unpin it?', { name: pinLabel(stale, t) })}</p>
      <div class="tool-row">
        <button type="button" class="btn sm" onclick={() => unpin(stale)}><Trash2 size={15} aria-hidden="true" />{t('Unpin|quick')}</button>
        <button type="button" class="btn sm" onclick={() => keep(stale)}>{t('Keep|quick')}</button>
      </div>
    </div>
  {/if}

  {#if editing && s.groups.length > 1}
    <section class="ich-sec ql-order" aria-labelledby="ql-order-h">
      <div class="ich-h"><div><h2 id="ql-order-h">{t('Order of the groups')}</h2><p class="ich-hs">{t('Drag or use the arrows.')}</p></div></div>
      <ul class="card ich-list ql-list" use:sortable={{ onmove: moveG }}>
        {#each s.groups as g, i (g.id)}
          <li data-sort-id={g.id} class="ql-row ql-grow"><SortGrip name={gName(g)} onstep={(d) => moveG(i, i + d)} /><span class="ql-m"><b>{gName(g)}</b></span><SortArrows name={gName(g)} {i} n={s.groups.length} onstep={(d) => moveG(i, i + d)} /></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if !s.pins.length && !adding}
    <div class="tool-card ql-empty" data-quick-empty>
      <p><b>{t('No pins yet.')}</b> {t('Tap «Add a pin» and choose what you use most.')}</p>
    </div>
  {/if}

  <div class="ql-groups">
    {#each groups as g (g?.id ?? '')}
      {@const gid = g?.id ?? ''}
      {@const ps = pinsIn(s, gid)}
      <section class="ich-sec ql-sec" data-quick-group={gid || 'none'} aria-labelledby={`ql-h-${gid || 'none'}`}>
        {#if g}
          <GroupActions name={gName(g)} count={ps.length} renameExplain={t('only the name changes')} deleteExplain={t('the pins stay')} deleteAsk="" allowEmpty={!!g.std} onrename={(v) => rename(g, v)} ondelete={() => (deleting = g)}>
            <h2 id={`ql-h-${gid}`}>{gName(g)}</h2><p class="ich-hs">{tn(ps.length, '{n} pin', '{n} pins')}</p>
          </GroupActions>
        {:else}
          <div class="ich-h"><div><h2 id="ql-h-none">{gName(g)}</h2><p class="ich-hs">{tn(ps.length, '{n} pin', '{n} pins')}</p></div></div>
        {/if}
        {#if ps.length}
          <ul class="card ich-list ql-list" use:sortable={{ onmove: (a, b) => move(gid, a, b), off: !editing, row: ':scope > li.ql-row' }}>
            {#each ps as p, i (p.id)}
              {@const f = FEATURE[p.feature]}
              <li data-sort-id={p.id} data-quick-pin={p.feature || null} data-quick-view={p.feature ? null : p.href} class="ql-row">
                {#if editing}<SortGrip name={pinLabel(p, t)} onstep={(d) => move(gid, i, i + d)} />{/if}
                <button type="button" class="ql-a" onclick={() => go(p)}>
                  <span class="ql-m"><b>{pinLabel(p, t)}</b>{#if p.note}<i data-quick-note>{p.note}</i>{/if}<small>{f ? (p.name ? t(f.title) : t(FEATURE_GROUPS.find((x) => x.key === f.group)?.label ?? '')) : p.name ? p.title : t('View with its filter')}</small></span>
                  {#if !editing}<ChevronRight size={18} aria-hidden="true" />{/if}
                </button>
                {#if editing}
                  <button type="button" class="btn sm" aria-label={t('Change name and note of «{name}»', { name: pinLabel(p, t) })} aria-expanded={open === p.id} onclick={() => (open = open === p.id ? null : p.id)}><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" class="btn sm" aria-label={t('Unpin «{name}»', { name: pinLabel(p, t) })} onclick={() => unpin(p)}><Trash2 size={15} aria-hidden="true" /></button>
                  <SortArrows name={pinLabel(p, t)} {i} n={ps.length} onstep={(d) => move(gid, i, i + d)} />
                {/if}
              </li>
              {#if editing && open === p.id}
                <li class="ql-edit">
                  <form class="ql-form" onsubmit={(e) => saveText(p, e)} data-quick-edit>
                    <label class="tool-field"><span>{t('Name')}</span><input class="tool-input" name="name" value={p.name} placeholder={f ? t(f.title) : p.title} maxlength="60" autocomplete="off" /></label>
                    <label class="tool-field"><span>{t('Note')}</span><input class="tool-input" name="note" value={p.note} placeholder={t('e.g. before every ski tour')} maxlength="120" autocomplete="off" /></label>
                    <label class="tool-field"><span>{t('Group')}</span>
                      <select class="tool-input" value={gid} onchange={(e) => regroup(p, e.currentTarget.value)}>
                        {#each s.groups as x (x.id)}<option value={x.id}>{gName(x)}</option>{/each}
                        <option value="">{t('Without a group|quick')}</option>
                      </select>
                    </label>
                    <div class="tool-row"><button type="submit" class="btn hi">{t('Save')}</button><button type="button" class="btn" onclick={() => (open = null)}>{t('Discard')}</button></div>
                    <p class="tool-muted">{t('An empty name brings back the name of the function.')}</p>
                  </form>
                </li>
              {/if}
            {/each}
          </ul>
        {:else}
          <p class="tool-muted">{t('No pins in this group yet.')}</p>
        {/if}
      </section>
    {/each}
  </div>

  {#if newGroupOpen}
    <form class="tool-row ql-newg" onsubmit={newGroup}>
      <label class="tool-field ql-gname"><span>{t('Name of the new group')}</span><input class="tool-input" bind:value={groupText} autocomplete="off" /></label>
      <button type="submit" class="btn hi" disabled={!groupText.trim()}>{t('Add')}</button>
      <button type="button" class="btn btn-link" onclick={() => (newGroupOpen = false)}>{t('Cancel')}</button>
    </form>
  {:else}
    <div class="tool-row"><button type="button" class="btn" onclick={() => (newGroupOpen = true)}><Plus size={16} aria-hidden="true" />{t('New group')}</button></div>
  {/if}

  {#if recent.length && !editing}
    <section class="ich-sec" aria-labelledby="ql-recent-h" data-quick-recent>
      <div class="ich-h"><div><h2 id="ql-recent-h">{t('Opened lately')}</h2><p class="ich-hs">{t('On this device. A pin keeps one for good.')}</p></div></div>
      <ul class="card ich-list ql-list">
        {#each recent as r (r.href)}
          <li class="ql-row">
            <a class="ql-a" href={r.href}><span class="ql-m"><b>{r.title}</b><small>{r.href.includes('?') ? t('View with its filter') : t('Page|quick')}</small></span></a>
            {#if isViewPinned(s, r.href)}<span class="ql-on"><Check size={15} aria-hidden="true" />{t('Pinned|quick')}</span>
            {:else}<button type="button" class="btn sm" aria-label={t('Pin «{name}»', { name: r.title })} onclick={() => pinView(r)}><Plus size={15} aria-hidden="true" />{t('Pin|quick')}</button>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="ql-foot">
    <label class="ql-marks" data-quick-marks>
      <span><b>{t('Pins on the cards')}</b><small>{t('A small pin at the top right of every card of a function in the app. A tap pins it here.')}</small></span>
      <input type="checkbox" role="switch" checked={marksOn} onchange={(e) => setMarks(e.currentTarget.checked)} />
    </label>
    <button type="button" class="btn btn-link" data-quick-tour onclick={() => startTour('quick')}><Play size={15} aria-hidden="true" />{t('Tour of Quick Links')}</button>
    <a href="#/features">{t('All {n} functions of the app', { n: FEATURES.length })} ›</a>
    {#if other && other.pins.length}
      <button type="button" class="btn btn-link" data-quick-takeover onclick={takeOver}><ArrowRightLeft size={15} aria-hidden="true" />{tn(other.pins.length, 'Take over the pins of {device} ({n} pin)', 'Take over the pins of {device} ({n} pins)', { device: there })}</button>
    {/if}
  </div>
</div>

{#if deleting}
  {@const g = deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gName(g) })}
    count={pinsIn(s, g.id).length}
    what={(n) => tn(n, '{n} pin', '{n} pins')}
    none={t('Without a group|quick')}
    noneHint={t('The pins stay and show under «Without a group». No pin is deleted.')}
    targets={s.groups.filter((x) => x.id !== g.id).map((x) => ({ id: x.id, name: gName(x) }))}
    onconfirm={(to) => removeGroup(g, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .ql-page > * {
    max-width: 760px;
  }
  .ql-dev {
    margin: 0 0 var(--sp-3);
  }
  .ql-h2 {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-sub);
  }
  .ql-add {
    margin-bottom: var(--sp-4);
  }
  .ql-q {
    flex: 1 1 260px;
  }
  .ql-qin {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ql-fold {
    border-top: 1px solid var(--line);
    padding: 6px 0;
  }
  .ql-fold summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ql-n {
    color: var(--ink-3);
    font-weight: 400;
  }
  .ql-fns > li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .ql-on {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ok);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
  }
  .ql-groups {
    display: grid;
    gap: var(--sp-2);
  }
  .ql-list {
    margin: 0;
    list-style: none;
  }
  .ql-row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0 var(--sp-2) 0 0;
    min-width: 0;
  }
  .ql-grow {
    padding: 4px var(--sp-2);
  }
  .ql-a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex: 1 1 auto;
    min-width: 0;
    min-height: 52px;
    padding: 6px var(--sp-3);
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ql-a :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .ql-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .ql-m b,
  .ql-m small,
  .ql-m i {
    overflow-wrap: break-word;
  }
  .ql-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ql-m i {
    font-style: normal;
    color: var(--accent, var(--ok));
    font-size: var(--fs-small);
  }
  .ql-edit {
    padding: var(--sp-2) var(--sp-3) var(--sp-3);
  }
  .ql-form {
    display: grid;
    gap: var(--sp-2);
  }
  .ql-gname {
    flex: 1 1 220px;
  }
  .ql-foot {
    display: grid;
    justify-items: start;
    gap: var(--sp-2);
    margin: var(--sp-4) 0;
  }
  .ql-tip {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
    margin: 0 0 var(--sp-4);
    border-radius: var(--r-md, 12px);
    background: var(--paper-2);
    max-width: 640px;
  }
  .ql-tip p {
    margin: 0;
  }
  .ql-marks {
    justify-self: stretch;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 44px;
    max-width: 640px;
  }
  .ql-marks span {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .ql-marks small {
    color: var(--ink-3);
  }
  .ql-foot > a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
</style>
