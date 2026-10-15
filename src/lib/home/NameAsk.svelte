<script>
  /**
   * HG1b «Name noch nicht bekannt»: one quiet row under the greeting on Today, asked only once.
   * «Speichern» keeps the name (the setting `userName`, only on this device), «Nicht jetzt» keeps only
   * that it was asked. Later changeable under Ich › Darstellung (HG1c).
   */
  import { t } from '../i18n.svelte.js';
  import { saveUserName, nameAsked } from './hallo-save.js';

  let name = $state('');
  async function save(e) {
    e.preventDefault();
    if (name.trim()) await saveUserName(name);
    else await nameAsked();
  }
</script>

<form class="ask" onsubmit={save} data-name-ask>
  <label for="hg-name">{t('What may we call you?')}</label>
  <span class="row">
    <input id="hg-name" class="inp" type="text" bind:value={name} placeholder={t('First name')} autocomplete="given-name" maxlength="40" />
    <button type="submit" class="btn">{t('Save')}</button>
    <button type="button" class="btn quiet" onclick={nameAsked} data-name-later>{t('Not now|hello')}</button>
  </span>
  <small>{t('Asked only once. You can change it later under Me › Appearance.')}</small>
</form>

<style>
  .ask {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 560px;
    margin-top: 10px;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  label {
    font-weight: 500;
    color: var(--ink);
  }
  small {
    color: var(--ink-3);
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
  .quiet {
    padding-inline: 8px;
    border-color: transparent;
    background: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 719px) {
    .row .inp {
      max-width: none;
      flex: 1 0 100%;
    }
    .row .btn:not(.quiet) {
      flex: 1;
    }
  }
</style>
