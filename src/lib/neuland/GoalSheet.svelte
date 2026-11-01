<script>
  /**
   * The window of a New ground challenge (Träume und Neuland N5): which collection, «new ones» or «all in a
   * canton», how many, until when, and an own name if you like. Voluntary, changeable any time; an existing
   * challenge can be deleted here (with Undo, NeulandGoals.svelte).
   *
   * open (bindable); draft { id?, cid, mode, times, kt, until, name }; collections [{ id, label, cantons }]
   * (cantons: its items carry a canton); cantons [{ id, name }]; min (today); onsave(fields); ondelete().
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import Seg from '../ui/Seg.svelte';
  import { Trophy } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { open = $bindable(false), draft = null, collections = [], cantons = [], min = '', onsave, ondelete } = $props();
  let dialog = $state();
  let cid = $state('municipalities');
  let mode = $state('count');
  let times = $state(5);
  let kt = $state('');
  let until = $state('');
  let name = $state('');
  $effect(() => {
    if (open && dialog && !dialog.open) {
      cid = draft?.cid ?? collections[0]?.id ?? 'municipalities';
      mode = draft?.mode ?? 'count';
      times = draft?.times ?? 5;
      kt = draft?.kt ?? '';
      until = draft?.until ?? '';
      name = draft?.name ?? '';
      dialog.showModal();
    }
    if (!open && dialog?.open) dialog.close();
  });
  const col = $derived(collections.find((c) => c.id === cid) ?? null);
  function save(e) {
    e.preventDefault();
    onsave?.({ cid, mode, times: Math.max(1, Math.round(Number(times) || 1)), kt: mode === 'all' && col?.cantons && kt ? kt : null, until, name: name.trim() });
    open = false;
  }
</script>

<dialog use:keepTyped={'nlgoal'} class="sheet ngs" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="ngs-h" data-goal-sheet>
  <form onsubmit={save}>
    <h2 id="ngs-h" class="title">{draft?.id ? t('Your challenge|new ground') : t('New challenge|new ground')}</h2>
    <p class="muted">{t('Voluntary, changeable any time. The app counts by itself from your routes, rides and ticks in New ground.')}</p>
    <label><span class="lbl">{t('Collection|new ground')}</span>
      <select class="inp" bind:value={cid} data-goal-cid>
        {#each collections as c (c.id)}<option value={c.id}>{c.label}</option>{/each}
      </select>
    </label>
    <Seg label={t('Kind|goal')} value={mode} onchange={(v) => (mode = v)} options={[{ key: 'count', name: t('New ones') }, { key: 'all', name: t('All of them') }]} />
    {#if mode === 'count'}
      <label><span class="lbl">{t('How many new ones')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max="999" bind:value={times} data-goal-times /></label>
      <p class="cnt">{t('Counts what you reach for the first time from today.')}</p>
    {:else}
      {#if col?.cantons}
        <label><span class="lbl">{t('Where|goal')}</span>
          <select class="inp" bind:value={kt} data-goal-kt>
            <option value="">{t('Everywhere|goal')}</option>
            {#each cantons as k (k.id)}<option value={k.id}>{t('Canton {name}', { name: k.name })}</option>{/each}
          </select>
        </label>
      {/if}
      <p class="cnt">{t('Counts everything of it you have ever reached.')}</p>
    {/if}
    <div class="two">
      <label><span class="lbl">{t('Until when')}</span><input class="inp" type="date" {min} bind:value={until} required data-goal-until /></label>
      <label><span class="lbl">{t('Own name (optional)')}</span><input class="inp" type="text" maxlength="60" bind:value={name} placeholder={t('e.g. Lake summer')} data-goal-name /></label>
    </div>
    <p class="ms"><span class="ic" aria-hidden="true"><Trophy size={16} /></span><span>{t('Reached, it stays in the list with its day.')}</span></p>
    <div class="acts">
      <button type="submit" class="btn hi" data-goal-save>{draft?.id ? t('Save') : t('Start challenge|new ground')}</button>
      {#if draft?.id}<button type="button" class="btn" onclick={() => ((open = false), ondelete?.())} data-goal-delete>{t('Delete')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  form {
    display: grid;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
  }
  label {
    display: grid;
    gap: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }
  .cnt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ms {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
