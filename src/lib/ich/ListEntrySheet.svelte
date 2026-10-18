<script>
  /**
   * v0.134.0 «Listen und Typen» (LI3, Noah «LI1–LI4 freigegeben» 14.10.2026): the window of one entry
   * (so far a category). Name, symbol; «Speichern», «Ausblenden» / «Einblenden» and «Löschen» (answer
   * 1b: Standard entries too). Before deleting, the app says how many items have the entry: they show
   * under «Ohne Kategorie» afterwards, «Auf Standard zurücksetzen» brings a Standard entry back.
   * entry: { id, name, std, own, hidden, icon, areas } or null for a new own entry; count: items with it.
   * LI3 «Gilt für» (Noah «2b» 15.10.2026): the trip areas the category applies to. All chosen (the
   * Standard) stores nothing; when packing, the app suggests the items only on trips of these areas.
   */
  import { backClose } from '../ui/backclose.js';
  import { ICON_CHOICES } from '../gear/caticon.js';
  import { TRIP_DOMAINS } from '../domains.js';
  import { t, tn } from '../i18n.svelte.js';
  import { X, Check, Eye, EyeOff, Trash2, Lightbulb } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { entry = null, count = 0, stdIcon = 'Tag', onsave, onhide, onremove, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // svelte-ignore state_referenced_locally
  let name = $state(entry ? t(entry.name) : '');
  // svelte-ignore state_referenced_locally
  let icon = $state(entry?.icon ?? (entry && !entry.own ? stdIcon : 'Tag'));
  let msg = $state('');
  const ALL = TRIP_DOMAINS.map((d) => d.key);
  // svelte-ignore state_referenced_locally
  let areas = $state(entry?.areas?.length ? ALL.filter((k) => entry.areas.includes(k)) : [...ALL]);
  // one area stays chosen at least (none would hide the category everywhere: that is «Ausblenden»)
  const toggleArea = (k) => (areas = areas.includes(k) ? (areas.length > 1 ? areas.filter((x) => x !== k) : areas) : ALL.filter((x) => x === k || areas.includes(x)));

  function save(event) {
    event.preventDefault();
    const n = name.trim();
    if (!n) return (msg = t('Give the category a name.'));
    // the Standard name in German is no change of the name
    onsave?.({ name: entry && !entry.own && n === t(entry.std) ? entry.std : n, icon, areas: areas.length === ALL.length ? null : areas });
    dialog.close();
  }
  function hide() {
    onhide?.();
    dialog.close();
  }
  function remove() {
    onremove?.();
    dialog.close();
  }
</script>

<dialog class="sheet vdlg les" bind:this={dialog} use:backClose {onclose} aria-labelledby="les-h">
  <div class="vd-head">
    <div class="vd-t"><h2 id="les-h">{entry ? t('Edit category') : t('Own category')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <form onsubmit={save}>
    <label class="fld"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={name} autocomplete="off" maxlength="40" /></label>
    {#if entry && !entry.own}
      <p class="vd-note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Standard name: «{name}». Your name only applies for you.', { name: t(entry.std) })}</span></p>
    {/if}

    <p class="lbl sym" id="les-sym">{t('Symbol')}</p>
    <div class="icons" role="radiogroup" aria-labelledby="les-sym">
      {#each Object.entries(ICON_CHOICES) as [key, c] (key)}
        <button type="button" class="ic" role="radio" aria-checked={icon === key} aria-label={t(c.label)} onclick={() => (icon = key)}><c.I size={20} aria-hidden="true" /></button>
      {/each}
    </div>

    <p class="lbl sym" id="les-areas">{t('Applies to|areas')}</p>
    <div class="areas" role="group" aria-labelledby="les-areas">
      {#each TRIP_DOMAINS as d (d.key)}
        <button type="button" class="fchip" aria-pressed={areas.includes(d.key)} onclick={() => toggleArea(d.key)}>{t(d.name)}</button>
      {/each}
    </div>
    <p class="hint">{t('When packing, the app suggests these items only on trips of the chosen kinds. The search always finds them.')}</p>
    {#if msg}<p class="msg" role="alert">{msg}</p>{/if}

    <div class="vd-foot">
      {#if entry}
        <button type="button" class="btn del" onclick={remove}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
        <button type="button" class="btn" onclick={hide}>
          {#if entry.hidden}<Eye size={16} aria-hidden="true" />{t('Show again|list')}{:else}<EyeOff size={16} aria-hidden="true" />{t('Hide')}{/if}
        </button>
      {/if}
      <button type="submit" class="btn hi"><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
    {#if entry}
      <p class="warn">
        {count ? tn(count, 'Delete: {n} item has this category. It then shows under «No category».', 'Delete: {n} items have this category. They then show under «No category».') : t('Delete: no item has this category.')}
        {#if !entry.own}{t('«Back to Standard» brings the category back.')}{/if}
      </p>
    {/if}
  </form>
</dialog>

<style>
  .fld {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sym {
    margin: 16px 0 8px;
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ic[aria-checked='true'] {
    border: 2px solid var(--ink);
    background: var(--paper-2);
  }
  .areas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  /* the chips like in «Sortieren und filtern» (FilterSheet), the chosen one filled in ink */
  .fchip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
  .hint {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .msg {
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  .del {
    color: var(--bad);
  }
  .warn {
    margin: 12px 0 0;
    padding: 10px 14px;
    border-radius: var(--r-ctl);
    background: var(--bad-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
</style>
