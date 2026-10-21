<script>
  /**
   * UC3-1 «Link hinzufügen»: a race rig or a race you found, as a link with your own key words.
   * The app never copies text or photos from the page: the title comes from the address (you can
   * change it), the facts are your own words. A race has its dates; a rig can belong to one of your races.
   * link: the link to edit, or null. kind: 'rig' or 'race' for a new one. races: your races (for a rig).
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { X } from '@lucide/svelte';
  import './velo-dlg.css';
  import { newLink, guessTitle, fullUrl } from '../rig.js';
  import { t } from '../i18n.svelte.js';

  let { link = null, kind = 'rig', races = [], onsave, ondelete, onclose } = $props();

  // The dialog edits a copy of the link as it was when it opened.
  // svelte-ignore state_referenced_locally
  let draft = $state(link ? { ...link, notesText: (link.notes ?? []).join('\n'), packKg: link.packKg ?? '' } : { url: '', title: '', kind, notesText: '', packKg: '', raceDate: '', raceEnd: '', raceId: '' });
  let error = $state('');
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const placeholder = $derived(guessTitle(draft.url) || t('From the address, or your own'));

  function save(event) {
    event.preventDefault();
    if (!fullUrl(draft.url)) {
      error = t('Paste the address of the page.');
      return;
    }
    if (draft.kind === 'race' && !draft.raceDate) {
      error = t('Add the first day of the race.');
      return;
    }
    // Impeccable bug: the last day cannot come before the first day
    if (draft.kind === 'race' && draft.raceEnd && draft.raceEnd < draft.raceDate) {
      error = t('The last day comes before the first day.');
      return;
    }
    const fields = { url: draft.url, title: draft.title, kind: draft.kind, notes: draft.notesText.split('\n'), packKg: String(draft.packKg).replace(',', '.'), raceDate: draft.raceDate, raceEnd: draft.raceEnd, raceId: draft.raceId };
    const made = newLink(fields, { id: link?.id ?? `link-${Date.now().toString(36)}`, now: link?.addedAt });
    onsave?.($state.snapshot(link ? { ...made, star: !!link.star } : made));
    dialog.close();
  }
</script>

<dialog use:keepTyped={'riglink:' + kind + ':' + (link?.id ?? 'new')} class="sheet vdlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="rl-h">
  <form onsubmit={save} novalidate>
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="rl-h">{link ? t('Change link') : draft.kind === 'race' ? t('Add race') : t('Add link|rig')}</h2>
        <p class="vd-sub meta">{t('Only the link and your own words. No text or photos are copied.')}</p>
      </div>
      <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={18} aria-hidden="true" /></button>
    </div>
    <div class="grid">
      <label class="wide"><span class="lbl">{t('Link')}</span><input class="inp" type="url" inputmode="url" bind:value={draft.url} placeholder="https://" required /></label>
      <fieldset class="wide">
        <legend class="lbl">{t('Kind|link')}</legend>
        <div class="vd-chips">
          <label class="vd-chip"><input type="radio" name="rl-kind" value="rig" bind:group={draft.kind} /> {t('Race rig')}</label>
          <label class="vd-chip"><input type="radio" name="rl-kind" value="race" bind:group={draft.kind} /> {t('Race|event')}</label>
        </div>
      </fieldset>
      <label class="wide"><span class="lbl">{t('Title')}</span><input class="inp" bind:value={draft.title} {placeholder} /></label>
      {#if draft.kind === 'race'}
        <label><span class="lbl">{t('First day')}</span><input class="inp" type="date" bind:value={draft.raceDate} /></label>
        <label><span class="lbl">{t('Last day')}</span><input class="inp" type="date" bind:value={draft.raceEnd} min={draft.raceDate || undefined} /></label>
      {:else}
        <label><span class="lbl">{t('Luggage of the rigs (kg)')}</span><input class="inp num" type="text" inputmode="decimal" bind:value={draft.packKg} placeholder={t('optional')} /></label>
        {#if races.length}
          <label>
            <span class="lbl">{t('Belongs to the race')}</span>
            <select class="sel" bind:value={draft.raceId}>
              <option value="">{t('None')}</option>
              {#each races as r (r.id)}<option value={r.id}>{r.title}</option>{/each}
            </select>
          </label>
        {/if}
      {/if}
      <label class="wide"><span class="lbl">{t('Your key words (one per line)')}</span><textarea class="inp" rows="3" bind:value={draft.notesText} placeholder={t('What matters to you?')}></textarea></label>
    </div>
    <p class="err" role="alert">{error}</p>
    <div class="vd-foot">
      {#if link}<button type="button" class="btn del" onclick={() => (ondelete?.(link), dialog.close())}>{t('Delete')}</button>{/if}
      <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
      <button type="submit" class="btn hi">{t('Save')}</button>
    </div>
  </form>
</dialog>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
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
  textarea {
    resize: vertical;
    font: inherit;
  }
  .err:empty {
    display: none;
  }
  .err {
    color: var(--bad);
    margin: 8px 0 0;
  }
  @media (max-width: 520px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
