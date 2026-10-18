<script>
  /**
   * «Inspiration» UC2-4 «Link hinzufügen» (mockup UC2-4-link-erkannt): paste a link, the app tells the
   * kind from the address (inspiration.js detectType) and you can choose another one. The title is a
   * suggestion from the address; numbers and key words are your own. Nothing is fetched online and no
   * text or photo is copied from the page.
   * link: the link to change (with its type), or null. url, title: a new link's start (pasted on the page
   * or shared from another app). shared: it came through «Teilen» (offers «Into the Inbox instead»).
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { X, Check } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import { TYPES, TYPE, detectType, makeLink } from '../inspiration.js';
  import { domainOf, fullUrl } from '../rig.js';
  import { t } from '../i18n.svelte.js';

  let { link = null, url = '', title = '', shared = false, onsave, ondelete, oninbox = null, onclose } = $props();

  // The dialog edits a copy of the link as it was when it opened.
  // svelte-ignore state_referenced_locally
  const f0 = link?.facts ?? {};
  // svelte-ignore state_referenced_locally
  let draft = $state({
    url: link?.url ?? url,
    title: link?.title ?? title,
    type: link?.type ?? null,
    notesText: (link?.notes ?? []).join('\n'),
    km: f0.km ?? '',
    up: f0.up ?? '',
    days: f0.days ?? '',
    price: f0.price ?? '',
    grams: f0.grams ?? '',
    place: f0.place ?? '',
    raceDate: link?.raceDate ?? '',
    raceEnd: link?.raceEnd ?? '',
  });
  // svelte-ignore state_referenced_locally
  let chosen = $state(!!link); // a kind you picked yourself stays, also when the address changes
  let error = $state('');
  let dialog;
  let titleEl = $state();
  $effect(() => {
    dialog.showModal();
    // A pasted new link: ask for its name right away (Noah 15.10.2026 «2a»).
    if (!link && fullUrl(draft.url)) titleEl?.focus();
  });
  const found = $derived(detectType(draft.url));
  $effect(() => {
    if (!chosen && found.type !== draft.type) draft.type = found.type;
  });
  const has = $derived(!!fullUrl(draft.url) && !!domainOf(draft.url));
  const pick = (k) => {
    draft.type = k;
    chosen = true;
  };

  function save(event) {
    event.preventDefault();
    if (!has) return (error = t('Paste the address of the page.'));
    if (!draft.type) return (error = t('Choose the kind of link.'));
    if (!draft.title.trim() && !found.title) return (error = t('Give the link a name.'), titleEl?.focus());
    const d = $state.snapshot(draft);
    const made = makeLink(
      { url: d.url, title: d.title, type: d.type, notes: d.notesText.split('\n'), facts: { km: d.km, up: d.up, days: d.days, price: d.price, grams: d.grams, place: d.place }, raceDate: d.raceDate, raceEnd: d.raceEnd },
      { id: link?.id ?? `insp-${Date.now().toString(36)}`, old: link ? $state.snapshot(link) : null },
    );
    onsave?.(made);
    dialog.close();
  }
</script>

<dialog use:keepTyped={'link:' + (link?.id ?? `new:${url}`)} class="sheet vdlg from-below ld" bind:this={dialog} use:backClose {onclose} aria-labelledby="ld-h">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="ld-h">{link ? t('Change link') : t('Add link|insp')}</h2>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <div class="ld-grid">
      <label class="ld-wide"><span class="lbl">{t('Link')}</span><input class="inp" type="url" inputmode="url" bind:value={draft.url} placeholder={t('Paste a link, e.g. bikepacking.com/…')} required /></label>
      {#if has}
        <p class="ld-wide ld-found" role="status">
          {#if found.type}
            <span class="ld-ok" aria-hidden="true"><Check size={16} /></span>
            <span><b>{t('Recognised: {kind}', { kind: t(TYPE[found.type].name) })}</b>{#if found.title}{' · '}{found.title}{/if}<small>{t('Only from the address; you can change the kind and the title.')}</small></span>
          {:else}
            <span>{t('The app cannot tell the kind from this address. Choose it below.')}</span>
          {/if}
        </p>
      {/if}
      <label class="ld-wide"><span class="lbl">{t('Title: what do you call it?')}</span><input class="inp" bind:this={titleEl} bind:value={draft.title} placeholder={found.title || t('e.g. Pass ride in the Jura')} /></label>
      <fieldset class="ld-wide">
        <legend class="lbl ld-caps">{t('Kind|link')}</legend>
        <div class="vd-chips">
          {#each TYPES as k (k.key)}
            <label class="vd-chip"><input type="radio" name="ld-type" value={k.key} checked={draft.type === k.key} onchange={() => pick(k.key)} /> {t(k.name)}</label>
          {/each}
        </div>
      </fieldset>
      {#if draft.type === 'route'}
        <div class="ld-wide ld-three">
          <label><span class="lbl">{t('km')}</span><input class="inp num" inputmode="decimal" bind:value={draft.km} placeholder={t('optional')} /></label>
          <label><span class="lbl">{t('Metres up')}</span><input class="inp num" inputmode="decimal" bind:value={draft.up} placeholder={t('optional')} /></label>
          <label><span class="lbl">{t('Days')}</span><input class="inp num" inputmode="decimal" bind:value={draft.days} placeholder={t('optional')} /></label>
        </div>
      {:else if draft.type === 'product'}
        <label><span class="lbl">{t('Price')}</span><input class="inp num" bind:value={draft.price} placeholder={t('e.g. CHF 120')} /></label>
        <label><span class="lbl">{t('Weight (g)')}</span><input class="inp num" inputmode="decimal" bind:value={draft.grams} placeholder={t('optional')} /></label>
      {:else if draft.type === 'race'}
        <label><span class="lbl">{t('First day')}</span><input class="inp" type="date" bind:value={draft.raceDate} /></label>
        <label><span class="lbl">{t('Last day')}</span><input class="inp" type="date" bind:value={draft.raceEnd} /></label>
        <label class="ld-wide"><span class="lbl">{t('Where')}</span><input class="inp" bind:value={draft.place} placeholder={t('optional')} /></label>
      {/if}
      <label class="ld-wide"><span class="lbl">{t('Your key words (one per line)')}</span><textarea class="inp" rows="3" bind:value={draft.notesText} placeholder={t('What matters to you?')}></textarea></label>
    </div>
    <p class="ld-err" role="alert">{error}</p>
    <div class="vd-foot">
      {#if link}<button type="button" class="btn ld-del" onclick={() => (ondelete?.(link), dialog.close())}>{t('Delete')}</button>{/if}
      {#if shared && oninbox}<button type="button" class="btn btn-link" onclick={() => (oninbox(draft.url, draft.title), dialog.close())}>{t('Into the Inbox instead')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
    <p class="ld-note">{t('If the app recognises nothing, you choose the kind. Only a suggestion, change it any time.')}</p>
  </form>
</dialog>

<style>
  .ld-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .ld-wide {
    grid-column: 1 / -1;
  }
  .ld-three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .vd-chip {
    flex-direction: row;
    align-items: center;
  }
  .ld-caps {
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  textarea {
    resize: vertical;
    font: inherit;
  }
  .ld-found {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ld-found small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ld-ok {
    flex: none;
    color: var(--hi);
  }
  .ld-err:empty {
    display: none;
  }
  .ld-err {
    margin: 8px 0 0;
    color: var(--bad);
  }
  .ld-del {
    margin-right: auto;
  }
  .ld-note {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  @media (max-width: 520px) {
    .ld-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
