<script>
  /**
   * «Tagebuch» lock (Noah «4a»): the diary asks for its code before it shows anything. «Forgot the code?»
   * removes the lock after a question; the diary then says once that the lock was reset (so a reset never
   * goes unnoticed). The lock keeps curious eyes out; it does not encrypt the entries in the backup.
   */
  import { LockKeyhole } from '@lucide/svelte';
  import { askDelete } from '../ui/ask.js';
  import { hashCode } from './journal.js';
  import { changeCfg } from './journaldb.js';
  import { unlock } from './lock.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { cfg } = $props();
  let code = $state('');
  let wrong = $state(false);
  let busy = $state(false);
  let input = $state(null);
  $effect(() => input?.focus());

  async function open(e) {
    e.preventDefault();
    if (busy || !code) return;
    busy = true;
    try {
      const h = await hashCode(code, cfg.lock.salt);
      if (h === cfg.lock.hash) unlock();
      else {
        wrong = true;
        code = '';
        input?.focus();
      }
    } finally {
      busy = false;
    }
  }
  async function forgot() {
    const a = await askDelete({
      title: t('Remove the lock?'),
      text: t('Your entries stay as they are. The diary opens without a code, and it notes the day the lock was removed. You can set a new code afterwards.'),
      label: t('Remove the lock'),
    });
    if (a !== 'delete') return;
    await changeCfg((c) => ({ ...c, lock: null, resetAt: new Date().toISOString() }));
    unlock();
  }
</script>

<div class="tb-lock" data-tb-lock>
  <span class="tb-lock-ic" aria-hidden="true"><LockKeyhole size={30} /></span>
  <h1 class="tb-lock-h" tabindex="-1" data-page-title>{t('Diary')}</h1>
  <p class="tb-lock-p">{t('Your diary is locked. Enter your code to open it.')}</p>
  <form class="tb-lock-f" onsubmit={open}>
    <input bind:this={input} class="inp tb-code" type="password" inputmode="numeric" autocomplete="off" maxlength="8" bind:value={code} oninput={() => (wrong = false)} aria-label={t('Code')} aria-invalid={wrong} data-tb-code />
    <button type="submit" class="btn hi" disabled={busy || !code} data-tb-open>{t('Open')}</button>
  </form>
  {#if wrong}<p class="tb-lock-err" role="alert" data-tb-wrong>{t('That is not the code. Try again.')}</p>{/if}
  <button type="button" class="tb-link" onclick={forgot} data-tb-forgot>{t('Forgot the code?')}</button>
</div>

<style>
  .tb-lock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 420px;
    margin: 48px auto;
    padding: 32px 20px;
    border-radius: 20px;
    background: var(--paper);
    border: 1px solid var(--line);
    text-align: center;
  }
  .tb-lock-ic {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .tb-lock-h {
    margin: 0;
    font: 700 var(--fs-title) / var(--lh-title) var(--font-title);
  }
  .tb-lock-p {
    margin: 0;
    color: var(--ink-2);
  }
  .tb-lock-f {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .tb-code {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-section);
    letter-spacing: 0.3em;
    text-align: center;
  }
  .tb-lock-err {
    margin: 0;
    color: var(--bad);
  }
  .tb-link {
    padding: 8px;
    border: 0;
    background: none;
    color: var(--ink-3);
    text-decoration: underline;
    cursor: pointer;
    min-height: 44px;
  }
</style>
