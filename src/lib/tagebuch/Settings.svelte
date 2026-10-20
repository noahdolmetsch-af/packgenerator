<script>
  /**
   * «Tagebuch» › Settings: the question of the day on or off (Noah «3a»), the lock with an own code («4a»),
   * the tags (groups: rename, delete with «where do the entries go», Undo; rule «Gruppen überall»), and
   * the download of the whole diary as one Markdown file («2b … mit möglichkeit zum download»).
   */
  import { X, Pencil, Trash2, Download, LockKeyhole } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { validCode, hashCode, newSalt, allTags } from './journal.js';
  import { changeCfg, changeTag, restoreRows } from './journaldb.js';
  import { t, tn } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { cfg = {}, entries = [], ondownload, onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const tags = $derived(allTags(entries));

  /* ---------- question of the day ---------- */
  const setQuestions = (on) => changeCfg((c) => ({ ...c, questions: on }));

  /* ---------- lock ---------- */
  let code1 = $state('');
  let code2 = $state('');
  let lockMsg = $state('');
  let lockBusy = $state(false);
  async function setLock(ev) {
    ev.preventDefault();
    if (!validCode(code1)) return (lockMsg = t('The code needs 4 to 8 digits.'));
    if (code1 !== code2) return (lockMsg = t('The two codes are not the same.'));
    lockBusy = true;
    const salt = newSalt();
    const hash = await hashCode(code1, salt);
    await changeCfg((c) => ({ ...c, lock: { salt, hash }, resetAt: null }));
    lockBusy = false;
    code1 = code2 = '';
    lockMsg = '';
    offerDone(t('The diary is locked with your code.'));
  }
  async function removeLock() {
    await changeCfg((c) => ({ ...c, lock: null }));
    offerDone(t('The lock is off.'));
  }

  /* ---------- tags ---------- */
  let renaming = $state(null);
  let deleting = $state(null);
  async function rename(name) {
    const from = renaming.name;
    const next = String(name ?? '').trim();
    if (!next || next === from) return;
    const old = await changeTag(from, next);
    offerDone(t('«{old}» is now «{name}».', { old: from, name: next }), () => restoreRows(old));
  }
  async function remove(to) {
    const from = deleting.name;
    const old = await changeTag(from, to ?? '');
    offerDone(t('"{name}" deleted.', { name: `#${from}` }), () => restoreRows(old));
  }
</script>

<dialog class="sheet vdlg from-below tbs" bind:this={dialog} use:backClose {onclose} aria-labelledby="tbs-h" data-tb-settings>
  <div class="vd-head">
    <div class="vd-t"><h2 id="tbs-h">{t('Diary settings')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="tbs-body">
    <section class="tbs-sec">
      <h3>{t('Question of the day')}</h3>
      <label class="tbs-row">
        <input type="checkbox" checked={cfg.questions !== false} onchange={(e) => setQuestions(e.currentTarget.checked)} data-tb-questions-on />
        <span>{t('Show a question each day as a start for writing (365 questions, one per day of the year).')}</span>
      </label>
    </section>

    <section class="tbs-sec">
      <h3><LockKeyhole size={18} aria-hidden="true" />{t('Lock')}</h3>
      {#if cfg.lock?.hash}
        <p class="tbs-p">{t('The diary asks for your code on this and your other devices. It locks again when you leave it or the app is in the background for a minute.')}</p>
        <button type="button" class="btn" onclick={removeLock} data-tb-lock-off>{t('Turn the lock off')}</button>
      {:else}
        <p class="tbs-p">{t('Choose a code of 4 to 8 digits. The diary then asks for it before it shows anything. The lock keeps curious eyes out; your backup still holds the entries.')}</p>
        <form class="tbs-lockf" onsubmit={setLock}>
          <input class="inp" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" bind:value={code1} placeholder={t('Code')} aria-label={t('Code')} data-tb-code1 />
          <input class="inp" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" bind:value={code2} placeholder={t('Code again')} aria-label={t('Code again')} data-tb-code2 />
          <button type="submit" class="btn hi" disabled={lockBusy} data-tb-lock-set>{t('Lock')}</button>
        </form>
        {#if lockMsg}<p class="tbs-err" role="alert">{lockMsg}</p>{/if}
      {/if}
    </section>

    <section class="tbs-sec">
      <h3>{t('Tags')}</h3>
      {#if !tags.length}
        <p class="tbs-p">{t('No tags yet. Add them while you write, e.g. «Tour» or «Family».')}</p>
      {:else}
        <p class="tbs-p">{t('Rename or delete a tag. The entries always stay.')}</p>
        <ul class="tbs-tags">
          {#each tags as x (x.name)}
            <li data-tb-tagrow={x.name}>
              <span class="tbs-tag">#{x.name} <small>{tn(x.n, '{n} entry', '{n} entries')}</small></span>
              <button type="button" class="tbs-ic" aria-label={t('Rename {name}', { name: x.name })} onclick={() => (renaming = x)} data-tb-tag-rename><Pencil size={18} aria-hidden="true" /></button>
              <button type="button" class="tbs-ic" aria-label={t('Delete {name}', { name: x.name })} onclick={() => (deleting = x)} data-tb-tag-delete><Trash2 size={18} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="tbs-sec">
      <h3>{t('Download it')}</h3>
      <p class="tbs-p">{t('All entries in one text file (Markdown), oldest first, to keep or print. Photos stay in the app and in the backup.')}</p>
      <button type="button" class="btn" onclick={ondownload} disabled={!entries.length} data-tb-download-all><Download size={16} aria-hidden="true" />{tn(entries.length, 'Download {n} entry', 'Download {n} entries')}</button>
    </section>
  </div>
</dialog>

{#if renaming}
  <RenameSheet kicker={t('Tag')} title={t('Rename tag')} value={renaming.name} max={30} onsave={rename} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete tag «{name}»?', { name: deleting.name })}
    count={deleting.n}
    what={(n) => tn(n, '{n} entry', '{n} entries')}
    none={t('Without this tag')}
    noneHint={t('The entries stay, only the tag goes.')}
    targets={tags.filter((x) => x.name !== deleting.name).map((x) => ({ id: x.name, name: `#${x.name}` }))}
    onconfirm={remove}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .tbs-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .tbs-sec {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tbs-sec + .tbs-sec {
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .tbs-sec h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .tbs-p {
    margin: 0;
    color: var(--ink-2);
  }
  .tbs-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .tbs-row input {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    flex: none;
  }
  .tbs-lockf {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tbs-lockf .inp {
    flex: 1;
    min-width: 120px;
  }
  .tbs-err {
    margin: 0;
    color: var(--bad);
  }
  .tbs-tags {
    list-style: none;
    margin: 0;
    padding: 4px 12px;
    border-radius: 14px;
    background: var(--paper-2);
  }
  .tbs-tags li {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 48px;
  }
  .tbs-tags li + li {
    border-top: 1px solid var(--line);
  }
  .tbs-tag {
    flex: 1;
    font-weight: 600;
  }
  .tbs-tag small {
    font-weight: 400;
    color: var(--ink-3);
  }
  .tbs-ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tbs-ic:hover {
    background: var(--line);
  }
</style>
