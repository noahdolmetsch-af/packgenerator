<script>
  /**
   * v0.106.0 «Bausteine bearbeiten» (Noah 1-5a, 12.10.2026; mockups A and B): the evening-before check
   * (kind 'eve', page «Gepackt») and the after-trip check (kind 'after', page «Tour beendet»).
   * Like the ready check: tick, remove (with Undo), add a row for this trip, and save the list as
   * the standard of the trip's area, or go back to it. Nothing here is mandatory.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { domainOf, domainName } from '../domains.js';
  import { checkKey, checkOf, freshCheck, checkCount, toggleCheck, removeCheck, addCheck, asStandard, differs } from '../checks.js';
  import { t } from '../i18n.svelte.js';

  let { trip, kind } = $props();

  const domain = $derived(domainOf(trip));
  const key = $derived(checkKey(kind, domain));
  const stdQ = liveQuery(() => db.settings.where('key').startsWith(`${kind}Standard`).toArray());
  const standard = $derived(($stdQ ?? []).find((r) => r.key === key)?.value ?? null);
  const list = $derived(checkOf(trip, kind, standard));
  const fresh = $derived(freshCheck(kind, domain, standard));
  const count = $derived(checkCount(list));
  const area = $derived(t(domainName(domain)));
  const title = $derived(kind === 'eve' ? t('Evening-before check') : t('After-trip check'));
  const hid = $derived(`tc-${kind}-${trip.id}`);

  let words = $state('');
  let note = $state('');
  let undo = $state(null); // the removed row's words, for 8 seconds after a remove
  let held = null; // the list before the remove, outside the reactive state (IndexedDB cannot store a proxy)
  let undoTimer;

  const save = (next) => db.trips.update(trip.id, touched({ [kind]: next }));
  const plain = () => $state.snapshot(list);
  const toggle = (id) => save(toggleCheck(plain(), id));
  function remove(row) {
    const before = plain();
    save(removeCheck(before, row.id));
    clearTimeout(undoTimer);
    held = before;
    undo = t(row.label);
    undoTimer = setTimeout(() => ((undo = null), (held = null)), 8000);
  }
  function takeBack() {
    clearTimeout(undoTimer);
    if (held) save(held);
    held = null;
    undo = null;
  }
  function add(event) {
    event.preventDefault();
    if (!words.trim()) return;
    save(addCheck(plain(), words));
    words = '';
  }
  async function saveStandard() {
    await db.settings.put({ key, value: asStandard(plain()) });
    note = t('Saved. New trips of {area} start with this list.', { area });
    setTimeout(() => (note = ''), 4000);
  }
  const reset = () => confirm(t('Use your standard list again for this trip?')) && save(freshCheck(kind, domain, standard));
</script>

<section class="card tc" aria-labelledby={hid} data-check={kind}>
  <div class="hd">
    <h2 id={hid}>{title}</h2>
    <span class="n num" data-count>{t('{done} of {n}', { done: count.done, n: count.total })}</span>
  </div>
  <p class="sub">{standard ? t('Your standard list for {area}. Change it for this trip.', { area }) : t('Suggested for {area}. Change it for this trip.', { area })}</p>
  {#if list.length}
    <ul>
      {#each list as r (r.id)}
        <li class:done={r.done}>
          <label class="ck">
            <input type="checkbox" checked={r.done} onchange={() => toggle(r.id)} />
            <span>{t(r.label)}</span>
          </label>
          <button type="button" class="x" aria-label={t('Remove {name} from this list', { name: t(r.label) })} onclick={() => remove(r)}>×</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="sub">{t('Empty. Add what you want to remember.')}</p>
  {/if}
  {#if undo}
    <p class="undo" role="status">{t('{name} removed', { name: undo })} <button type="button" class="tp-link" onclick={takeBack}>{t('Undo')}</button></p>
  {/if}
  <form class="add" onsubmit={add}>
    <input class="inp" bind:value={words} placeholder={t('New row')} aria-label={t('Add a row for this trip')} />
    <button type="submit" class="btn">{t('Add')}</button>
  </form>
  {#if differs(list, fresh)}
    <p class="acts">
      <button type="button" class="btn" onclick={saveStandard}>{t('Save as standard for {area}', { area })}</button>
      <button type="button" class="link" onclick={reset}>{t('Back to my standard list')}</button>
    </p>
  {/if}
  {#if note}<p class="ok" role="status">{note}</p>{/if}
</section>

<style>
  .tc {
    display: grid;
    gap: 8px;
  }
  .hd {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .n {
    font-size: var(--fs-tiny);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .sub {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border-top: 1px solid var(--paper-2);
  }
  li:first-child {
    border-top: 0;
  }
  .ck {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
  }
  .ck input {
    width: 22px;
    height: 22px;
    flex: none;
    accent-color: var(--ok);
  }
  li.done .ck span {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .x {
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    font-size: var(--fs-section);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
  .add .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin: 4px 0 0;
  }
  .link {
    border: 0;
    background: none;
    min-height: 44px;
    padding: 0 4px;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink-2);
    text-decoration: underline;
    cursor: pointer;
  }
  .undo,
  .ok {
    margin: 0;
    font-size: var(--fs-small);
  }
  .ok {
    color: var(--ok);
  }
</style>
