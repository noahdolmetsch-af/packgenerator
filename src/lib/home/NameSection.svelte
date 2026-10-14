<script>
  /**
   * HG1c «Name ändern»: the first section of Ich › Darstellung, «Dein Name» with a field and «Speichern»,
   * and how the greeting on Today looks with it. Empty = the greeting without a name. The name stays
   * only on this device (the setting `userName`, the same one «Startseite anpassen» writes).
   */
  import { liveQuery } from 'dexie';
  import { Sun } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { greetFor, helloPart } from './hallo.js';
  import { saveUserName } from './hallo-save.js';

  const stored = liveQuery(async () => (await db.settings.get('userName')) ?? null);
  let name = $state('');
  let loaded = false;
  $effect(() => {
    if (loaded || $stored === undefined) return;
    loaded = true;
    name = $stored?.value ?? '';
  });
  // HG1 (selbst entschieden): the preview shows the greeting of this hour; at night (no name then) the morning one
  const hour = new Date().getHours();
  const preview = $derived(greetFor(helloPart(hour) === 'night' ? 8 : hour, name));
  let saved = $state(false);
  async function save(e) {
    e.preventDefault();
    await saveUserName(name);
    saved = true;
  }
</script>

<section aria-labelledby="look-name" data-look-name>
  <h2 id="look-name">{t('Your name')}</h2>
  <p class="note">{t('For the greeting on Today. Leave it empty: the greeting without a name.')}</p>
  <form class="row" onsubmit={save}>
    <input class="inp" type="text" bind:value={name} oninput={() => (saved = false)} autocomplete="given-name" maxlength="40" aria-labelledby="look-name" />
    <button type="submit" class="btn">{t('Save')}</button>
  </form>
  <p class="prev"><Sun size={15} aria-hidden="true" /><span>{t('On Today: «{text}»', { text: preview })}</span></p>
  {#if saved}<p class="ok" role="status">{t('Saved|name')}</p>{/if}
</section>

<style>
  /* the look of the other sections of Darstellung (Look.svelte) */
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .note {
    margin: 2px 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .row .inp {
    flex: 1 1 180px;
    min-width: 0;
    max-width: 260px;
    min-height: 44px;
  }
  .prev {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 10px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .prev :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .ok {
    margin: 6px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .row .inp {
      max-width: none;
      flex: 1 0 100%;
    }
    .row .btn {
      flex: 1;
    }
  }
</style>
