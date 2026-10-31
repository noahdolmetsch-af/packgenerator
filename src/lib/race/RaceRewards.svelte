<script>
  /**
   * «Belohnung jede Stunde» (Noah 28.10.2026 «2a»): on the page «Rennen detailliert planen», your list of
   * small rewards. In race mode the next one stands on top with its full hour (night-lib.js nextReward).
   * Your own list per race (stored.rewards): add, change, delete with Undo, sort with arrows and dragging.
   */
  import { Gift, Sparkles } from '@lucide/svelte';
  import EditList from './EditList.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { newId } from './race.js';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();
  const rows = $derived((Array.isArray(ctx.stored.rewards) ? ctx.stored.rewards : []).map((r) => ({ id: r.id, text: String(r.text ?? '') })));
  const save = (list) => ctx.save({ rewards: list.map((r) => ({ id: r.id, text: r.text })) });
  const IDEAS = ['Gummy bears', 'One podcast episode', 'Your favourite song, loud', 'A cold cola', 'A photo of the view', 'A message to a friend'];
  function ideas() {
    const before = ctx.stored.rewards ?? null;
    save([...rows, ...IDEAS.map((x) => ({ id: newId('rw'), text: t(x) }))]);
    offerDone(t('{n} ideas added. Change them as you like.', { n: IDEAS.length }), () => ctx.save({ rewards: before }));
  }
</script>

<section class="rc-box" aria-labelledby="rw-h" data-race-rewards>
  <h2 id="rw-h" class="rc-h2"><Gift size={18} aria-hidden="true" /> {t('A reward every hour')}</h2>
  <p class="rc-note">{t('Small things to look forward to. In race mode the next one stands on top, at every full hour one after the other.')}</p>
  {#if !rows.length}
    <div class="rw-empty" data-rewards-empty>
      <p>{t('No rewards yet. Write your own below or start with a few ideas.')}</p>
      <button type="button" class="btn sm" onclick={ideas} data-rewards-ideas><Sparkles size={16} aria-hidden="true" />{t('Take the ideas')}</button>
    </div>
  {/if}
  <EditList {rows} onchange={save} label={t('Reward')} addLabel={t('Add')} placeholder={t('e.g. A chocolate bar')} name={t('Reward')} testid="rewards" />
</section>

<style>
  .rw-empty {
    display: grid;
    gap: 8px;
    justify-items: start;
    padding: 12px 14px;
    border-radius: var(--radius-card);
    background: var(--accent-soft);
  }
  .rw-empty p {
    margin: 0;
  }
</style>
