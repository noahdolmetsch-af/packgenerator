<script>
  /**
   * Seite «Werkzeuge und Links» (Noah 19.10.2026 11:28 «1b 2a 3a»): Ich › Werkzeuge und Links (#/me/links),
   * links to other apps and pages in groups. Suggestions can be switched off (they come back under
   * «Abgewählte Vorschläge»), own links come from «Links und Dateien» (one store, ablage.js), groups
   * can be added, renamed and deleted (rules 17, 18), links put in order with arrows and drag (rule 12).
   * Where it can, a link carries the place and the day of the next trip (3a). Model: tools/weblinks.js.
   */
  import { ExternalLink, EyeOff, Eye, Plus, ArrowUpDown, Wrench, MapPin } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import GroupActions from '../lib/ui/GroupActions.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { db } from '../lib/db.js';
  import { localDay } from '../lib/localday.js';
  import { WEBLINKS_KEY, SUGGESTED, cleanWeb, groupName, linkTrip, webLinks, linksIn, moveLink, deleteWebGroup } from '../lib/tools/weblinks.js';
  import { LINKS_KEY, addLink, saveLinks, cleanUrl } from '../lib/tools/ablage.js';
  import { t, tn, lang, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';
  import '../lib/tools/tools.css';

  let state = $state(cleanWeb(null));
  let own = $state([]);
  let trip = $state(null);
  let sorting = $state(false);
  let adding = $state(false);
  let newName = $state('');
  let newUrl = $state('');
  let newGroup = $state('');
  let addError = $state('');
  let deleting = $state(null);
  let newGroupOpen = $state(false);
  let groupText = $state('');

  $effect(() => {
    const sub = liveQuery(() => db.settings.bulkGet([WEBLINKS_KEY, LINKS_KEY])).subscribe({
      next: ([w, l]) => {
        state = cleanWeb(w?.value);
        own = Array.isArray(l?.value) ? l.value : [];
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  });
  db.trips.toArray().then((tr) => (trip = linkTrip(tr, localDay()))).catch(() => {});

  const ctx = $derived({ trip, place: trip?.place ?? trip?.route?.start ?? null, lang: lang.v });
  const links = $derived(webLinks(state, own, ctx));
  const groups = $derived([...state.groups, { id: '', label: 'Without a group|links' }].filter((g) => g.id !== '' || linksIn(links, '').length));
  const hidden = $derived(SUGGESTED.filter((s) => state.hidden.includes(s.id)));
  const gName = (g) => groupName(g, t);
  const dayText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' });

  const saveState = (s) => db.settings.put({ key: WEBLINKS_KEY, value: JSON.parse(JSON.stringify(s)) });
  async function change(next, text, back) {
    const before = $state.snapshot(state);
    await saveState(next);
    if (text) offerDone(text, back === false ? null : async () => saveState(before));
  }

  function hide(l) {
    change({ ...state, hidden: [...state.hidden, l.id] }, t('«{name}» no longer suggested.', { name: l.name }));
  }
  const show = (s) => change({ ...state, hidden: state.hidden.filter((h) => h !== s.id) });
  function move(g, from, to) {
    change({ ...state, order: moveLink(links, g.id, from, to) });
  }
  async function regroup(l, to) {
    if (l.own) await saveLinks(own.map((o) => (o.id === l.id ? { ...o, group: to } : o)));
    else await saveState({ ...state, place: { ...state.place, [l.key]: to } });
  }
  function rename(g, v) {
    const before = $state.snapshot(state);
    const name = v.trim();
    if (!name) return;
    saveState({ ...state, groups: state.groups.map((x) => (x.id === g.id ? { id: x.id, name } : x)) });
    offerDone(t('Group renamed to «{name}».', { name }), () => saveState(before));
  }
  async function removeGroup(g, to) {
    const before = $state.snapshot(state);
    const ownBefore = $state.snapshot(own);
    const r = deleteWebGroup(state, own, g.id, to ?? '');
    await saveState(r.state);
    await saveLinks(r.own);
    offerDone(t('Group «{name}» deleted. The links are still there.', { name: gName(g) }), async () => {
      await saveState(before);
      await saveLinks(ownBefore);
    });
  }
  function addGroup(e) {
    e.preventDefault();
    const name = groupText.trim();
    if (!name) return;
    saveState({ ...state, groups: [...state.groups, { id: `g${Date.now().toString(36)}`, name }] });
    groupText = '';
    newGroupOpen = false;
  }
  async function addOwn(e) {
    e.preventDefault();
    if (!cleanUrl(newUrl)) return (addError = t('Only addresses that start with http:// or https://'));
    await addLink({ title: newName, url: newUrl, group: newGroup });
    newName = newUrl = '';
    addError = '';
    adding = false;
  }
</script>

<div class="ich-page wl-page">
  <VeloHead crumbs={[{ label: t('Plan|place'), href: '#/week' }]} title={t('Tools and links')} sub={t('Other apps and pages in one place. Everything is a suggestion; switch off what you do not need.')} />
  <p class="tool-help wl-intro"><Wrench size={14} aria-hidden="true" /> {t('The helpers inside the app are in the')} <a href="#/me/tools">{t('Toolbox')}</a>.</p>
  {#if trip}
    <p class="tool-help wl-trip" data-trip-line><MapPin size={14} aria-hidden="true" /> {t('Links marked with the pin carry your trip «{trip}» ({day}).', { trip: trip.title || t('Trip'), day: dayText(trip.startDate) })}</p>
  {/if}
  <div class="tool-row wl-bar">
    <button type="button" class="btn" onclick={() => (adding = !adding)}><Plus size={16} aria-hidden="true" />{t('Add own link')}</button>
    <button type="button" class="btn" aria-pressed={sorting} onclick={() => (sorting = !sorting)}><ArrowUpDown size={16} aria-hidden="true" />{sorting ? t('Done') : t('Order|sort')}</button>
  </div>
  {#if adding}
    <form class="tool-card wl-add" onsubmit={addOwn}>
      <label class="tool-field"><span>{t('Name on the button')}</span><input class="tool-input" bind:value={newName} autocomplete="off" /></label>
      <label class="tool-field"><span>{t('Address')}</span><input class="tool-input" bind:value={newUrl} inputmode="url" autocomplete="off" placeholder="https://" /></label>
      <label class="tool-field"><span>{t('Group')}</span>
        <select class="tool-input" bind:value={newGroup}>
          <option value="">{t('Without a group|links')}</option>
          {#each state.groups as g (g.id)}<option value={g.id}>{gName(g)}</option>{/each}
        </select>
      </label>
      {#if addError}<p class="tool-status err" role="alert">{addError}</p>{/if}
      <div class="tool-row"><button type="submit" class="btn hi">{t('Add')}</button><button type="button" class="btn btn-link" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
      <p class="tool-muted">{t('Your own links are also under Documents and Toolbox › Links and files.')}</p>
    </form>
  {/if}

  {#each groups as g (g.id)}
    {@const ls = linksIn(links, g.id)}
    <section class="ich-sec wl-sec" data-wl-group={g.id || 'none'} aria-labelledby={`wl-h-${g.id || 'none'}`}>
      {#if g.id}
        <GroupActions name={gName(g)} count={ls.length} renameExplain={t('only the name changes')} deleteExplain={t('the links stay')} deleteAsk="" onrename={(v) => rename(g, v)} ondelete={() => (deleting = g)}>
          <h2 id={`wl-h-${g.id}`}>{gName(g)}</h2><p class="ich-hs">{tn(ls.length, '{n} link', '{n} links')}</p>
        </GroupActions>
      {:else}
        <div class="ich-h"><div><h2 id="wl-h-none">{gName(g)}</h2><p class="ich-hs">{tn(ls.length, '{n} link', '{n} links')}</p></div></div>
      {/if}
      {#if ls.length}
        <ul class="card ich-list wl-list" use:sortable={{ onmove: (a, b) => move(g, a, b) }}>
          {#each ls as l, i (l.key)}
            <li data-sort-id={l.key} data-link={l.key} class="wl-row">
              {#if sorting}<SortGrip name={l.name} onstep={(d) => move(g, i, i + d)} />{/if}
              <a class="wl-a" href={l.href} target="_blank" rel="noopener noreferrer">
                <span class="wl-letter" aria-hidden="true">{l.name.slice(0, 1).toUpperCase()}</span>
                <span class="wl-m"><b>{l.name}{#if l.trip}{' '}<MapPin size={13} aria-label={t('with your trip')} />{/if}</b>{#if l.sub}<small>{t(l.sub)}</small>{:else if l.own}<small>{t('Own link')}</small>{/if}</span>
                <ExternalLink size={15} aria-label={t('opens elsewhere')} />
              </a>
              {#if sorting}
                <select class="tool-input wl-gsel" aria-label={t('Group of {name}', { name: l.name })} value={l.group} onchange={(e) => regroup(l, e.currentTarget.value)}>
                  <option value="">{t('Without a group|links')}</option>
                  {#each state.groups as x (x.id)}<option value={x.id}>{gName(x)}</option>{/each}
                </select>
                <SortArrows name={l.name} {i} n={ls.length} onstep={(d) => move(g, i, i + d)} />
              {:else if !l.own}
                <button type="button" class="btn sm" aria-label={t('Do not suggest «{name}» any more', { name: l.name })} onclick={() => hide(l)}><EyeOff size={15} aria-hidden="true" /></button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="tool-muted">{t('No links in this group yet.')}</p>
      {/if}
    </section>
  {/each}

  {#if newGroupOpen}
    <form class="tool-row wl-newg" onsubmit={addGroup}>
      <label class="tool-field wl-gname"><span>{t('Name of the new group')}</span><input class="tool-input" bind:value={groupText} autocomplete="off" /></label>
      <button type="submit" class="btn hi" disabled={!groupText.trim()}>{t('Add')}</button>
      <button type="button" class="btn btn-link" onclick={() => (newGroupOpen = false)}>{t('Cancel')}</button>
    </form>
  {:else}
    <div><button type="button" class="btn" onclick={() => (newGroupOpen = true)}><Plus size={16} aria-hidden="true" />{t('New group')}</button></div>
  {/if}

  {#if hidden.length}
    <details class="wl-off">
      <summary>{t('Switched-off suggestions ({n})', { n: hidden.length })}</summary>
      <ul class="tool-list">
        {#each hidden as s (s.id)}
          <li data-off={s.id}><span class="wl-m"><b>{s.name}</b><small>{t(s.sub)}</small></span><button type="button" class="btn sm" onclick={() => show(s)}><Eye size={15} aria-hidden="true" />{t('Show again')}</button></li>
        {/each}
      </ul>
    </details>
  {/if}
  <p class="tool-help">{t('Only links: nothing is loaded from these pages. A link with the pin sends only the place and the day of your trip.')}</p>
</div>

{#if deleting}
  {@const g = deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gName(g) })}
    count={linksIn(links, g.id).length}
    what={(n) => tn(n, '{n} link', '{n} links')}
    none={t('Without a group|links')}
    noneHint={t('The links stay and show under «Without a group». No link is deleted.')}
    targets={state.groups.filter((x) => x.id !== g.id).map((x) => ({ id: x.id, name: gName(x) }))}
    onconfirm={(to) => removeGroup(g, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .wl-page > * {
    max-width: 720px;
  }
  .wl-intro,
  .wl-trip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-bottom: var(--sp-2);
  }
  .wl-bar {
    margin: var(--sp-2) 0 var(--sp-3);
  }
  .wl-add {
    margin-bottom: var(--sp-3);
  }
  .wl-list {
    margin: 0;
    list-style: none;
  }
  .wl-row {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 0 var(--sp-3) 0 0;
    min-width: 0;
  }
  .wl-a {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex: 1 1 auto;
    min-width: 0;
    min-height: 52px;
    padding: 6px var(--sp-3);
    color: inherit;
    text-decoration: none;
  }
  .wl-a :global(svg) {
    flex: none;
  }
  .wl-letter {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-weight: 700;
  }
  .wl-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .wl-m b,
  .wl-m small {
    overflow-wrap: break-word;
  }
  .wl-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wl-gsel {
    width: auto;
    max-width: 40%;
    min-height: 36px;
  }
  .wl-gname {
    flex: 1 1 220px;
  }
  .wl-off {
    margin: var(--sp-4) 0;
  }
  .wl-off summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
</style>
