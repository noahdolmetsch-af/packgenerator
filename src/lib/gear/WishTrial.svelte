<script>
  /**
   * Paket A, UC-007-I3 «Ausleihen vor Kaufen»: on a wish, try it first with borrowed or rented gear. You note
   * from whom or where and until when; after that day the app asks once: buy it, or not needed, with a short why.
   * compact: only the question after the test (for the wish row); otherwise the full form (item window).
   * Saved at once on the item with Undo; onchange keeps the open window in step.
   */
  import { db } from '../db.js';
  import { t, nameOf, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { startTrial, trialState, endTrial, clearTrial } from '../stand/stand.js';

  let { item, compact = false, onchange = null } = $props();
  const today = localDay();
  const st = $derived(trialState(item, today));
  let from = $state('');
  let until = $state('');
  let why = $state('');
  let deciding = $state(false);

  async function put(next, text) {
    const before = $state.snapshot(item);
    try {
      await db.items.put({ ...$state.snapshot(next), updatedAt: new Date().toISOString() });
      onchange?.(next.trial ?? null);
      offerDone(text, async () => {
        await db.items.put(before);
        onchange?.(before.trial ?? null);
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      offerDone(saveFailed(err));
    }
  }
  const start = () => put(startTrial($state.snapshot(item), { from, until }), t('Test noted. The app asks again after {day}.', { day: until ? dateOf(until) : t('the test') }));
  const decide = (v) => put(endTrial($state.snapshot(item), v, why), v === 'buy' ? t('Decided: worth buying.') : t('Decided: not needed.'));
  const reset = () => put(clearTrial($state.snapshot(item)), t('Test removed.'));
</script>

{#if compact}
  {#if st?.over}
    <span class="wt-row" data-trial-ask={item.id}>
      <span class="wt-ask">{t('Test over. Buy it?')}</span>
      <button type="button" class="btn sm" onclick={() => decide('buy')} data-trial-buy>{t('Yes, worth it')}</button>
      <button type="button" class="btn sm" onclick={() => decide('no')} data-trial-no>{t('Not needed')}</button>
    </span>
  {/if}
{:else}
  <div class="wt" data-trial={item.id}>
    {#if !st}
      <p class="wt-hint">{t('Not sure yet? Borrow or rent it first, then decide. Note from whom and until when.')}</p>
      <label class="wt-lab">{t('From whom or where')}<input class="inp" maxlength="80" bind:value={from} placeholder={t('e.g. a friend, the rental shop')} data-trial-from /></label>
      <label class="wt-lab">{t('Back by')}<input class="inp" type="date" min={today} bind:value={until} data-trial-until /></label>
      <button type="button" class="btn sm" onclick={start} data-trial-start>{t('Borrow first')}</button>
    {:else if st.verdict}
      <p class="wt-done" data-trial-verdict={st.verdict}>{st.verdict === 'buy' ? t('After the test: worth buying.') : t('After the test: not needed.')}{#if st.why}{' '}{st.why}{/if}</p>
      <button type="button" class="btn sm" onclick={reset}>{t('Remove the test')}</button>
    {:else}
      <p class="wt-run" data-trial-running>
        {st.from ? t('Borrowed from {from}', { from: st.from }) : t('Borrowed')}{#if st.until}{' · '}{t('back by {day}', { day: dateOf(st.until) })}{/if}
      </p>
      {#if st.over || deciding}
        <label class="wt-lab">{t('Why? (optional)')}<input class="inp" maxlength="200" bind:value={why} placeholder={t('e.g. too heavy, or exactly right')} data-trial-why /></label>
        <span class="wt-row">
          <button type="button" class="btn sm" onclick={() => decide('buy')} data-trial-buy>{t('Yes, worth it')}</button>
          <button type="button" class="btn sm" onclick={() => decide('no')} data-trial-no>{t('Not needed')}</button>
        </span>
      {:else}
        <span class="wt-row">
          <button type="button" class="btn sm" onclick={() => (deciding = true)} data-trial-decide>{t('Decide now')}</button>
          <button type="button" class="btn sm" onclick={reset}>{t('Remove the test')}</button>
        </span>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .wt {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .wt-hint,
  .wt-run,
  .wt-done {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wt-done {
    color: var(--ink);
  }
  .wt-lab {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    font-size: var(--fs-small);
  }
  .wt-row {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .wt-ask {
    font-size: var(--fs-small);
    font-weight: 600;
  }
</style>
