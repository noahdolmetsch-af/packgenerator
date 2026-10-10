<script>
  /**
   * v0.67.0 (answer 3a): «Entwurf vom Helfer» in the Rückblick. Up to 3 learnings from the notes on
   * the way, each with «Übernehmen» (saved as a learning, the way the app saves its own) and ×, and a
   * summary of 2–3 sentences with «Übernehmen» (it becomes the sentence for next time) and
   * «Bearbeiten» (the same, with the field open to change it). Nothing is saved without a tap.
   */
  import { Sparkles, X, Check } from '@lucide/svelte';
  import { t, tn, locale } from '../i18n.svelte.js';
  import './helper.css';

  /** draft: { learnings: [{ rule, action, noteKey }], summary }; notes: the notes on the way (key, day, at). */
  let { draft, notes = [], days = 1, onlearn, onsummary, onclose } = $props();
  let taken = $state({}); // index → 'taken' | 'dropped'
  let sumState = $state('');
  let msg = $state('');
  const rows = $derived(draft.learnings.map((l, n) => ({ ...l, n })).filter((l) => !taken[l.n]));
  const whenOf = (key) => {
    const note = notes.find((x) => x.key === key);
    if (!note?.at) return '';
    const time = new Date(note.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    return days > 1 ? `${t('Day {n}', { n: (note.day ?? 0) + 1 })}, ${time}` : time;
  };
  async function take(l) {
    try {
      await onlearn(l);
      taken = { ...taken, [l.n]: 'taken' };
      msg = t('Remembered: {label}', { label: l.rule });
    } catch {
      msg = t('Could not save. Please try again.');
    }
  }
  async function summary(edit) {
    await onsummary(draft.summary, edit);
    sumState = 'taken';
  }
  const done = $derived(!rows.length && (sumState || !draft.summary));
  $effect(() => {
    if (done) onclose?.();
  });
</script>

<section class="tp-card kh kh-draft" aria-labelledby="kh-draft-h">
  <h2 id="kh-draft-h" class="kh-head"><span class="kh-ic"><Sparkles size={20} aria-hidden="true" /></span>{t('Draft from the helper')}<span class="kh-r">{tn(notes.length, 'from {n} note on the way', 'from {n} notes on the way')}</span></h2>
  {#if rows.length}
    <p class="kh-sub">{t('Learnings for next time')}</p>
    <ul class="kh-list">
      {#each rows as l (l.n)}
        {@const when = whenOf(l.noteKey)}
        <li><span class="kh-m"><b>{l.rule}</b><small>{l.action}{#if when}<span class="kh-when"> · {when}</span>{/if}</small></span>
          <span class="kh-small-acts"><button type="button" class="btn sm" onclick={() => take(l)}>{t('Take over')}</button><button type="button" class="kh-x" aria-label={t('Drop learning {rule}', { rule: l.rule })} onclick={() => (taken = { ...taken, [l.n]: 'dropped' })}><X size={18} aria-hidden="true" /></button></span></li>
      {/each}
    </ul>
  {/if}
  {#if msg}<p class="kh-msg" role="status"><Check size={14} aria-hidden="true" /> {msg}</p>{/if}
  {#if draft.summary && !sumState}
    <p class="kh-k">{t('Summary')}</p>
    <p class="kh-sum">{draft.summary}</p>
    <div class="kh-acts">
      <button type="button" class="btn sm" onclick={() => summary(false)}>{t('Take over')}</button>
      <button type="button" class="btn sm" onclick={() => summary(true)}>{t('Edit')}</button>
      <p class="kh-quiet">{t('A draft, you decide what stays.')}</p>
    </div>
  {:else}
    <p class="kh-quiet">{t('A draft, you decide what stays.')}</p>
  {/if}
</section>

<style>
  .kh-draft h2 {
    margin-bottom: 4px;
  }
</style>
