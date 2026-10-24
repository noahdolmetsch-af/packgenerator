<script>
  /**
   * Paket P5 «Eingang» (mockup A-J4 «Ablegen-Runde»): one open note at a time, big, with «Notiz vom …»;
   * «Vorschlag» says where it would go and why, [Ablegen] files it there (the form of that target, «Behalten»
   * straight), three chips for other targets and «Anderes Ziel …», [Behalten], [Löschen], «Pause» and
   * [Überspringen]. The end screen counts what happened. The page does the writing (callbacks).
   */
  import { Check, Trash2, Pause, SkipForward, Shuffle } from '@lucide/svelte';
  import { TARGET, LANDS, guessTarget } from '../inbox.js';
  import { guessBike } from '../notes.js';
  import { otherTargets, whyWords } from './round.js';
  import { ICONS } from './icons.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { note = null, pos = 1, total = 1, tally = null, trips = [], rules = null, bikes = [], onfile, onkeep, ondelete, onskip, onpause, onend } = $props();

  const sug = $derived(note ? guessTarget(note, { trips, rules }) : 'keep');
  const words = $derived(note ? whyWords(note, sug) : []);
  const bike = $derived(note && ['problem', 'idea'].includes(sug) ? bikes.find((b) => b.id === guessBike(note.text ?? '', bikes, note.bikeId ?? null)) : null);
  const what = $derived(bike ? `${t(TARGET[sug].name)} · ${bike.name}` : t(TARGET[sug].name));
  const why = $derived(
    words.length === 2 ? t('because «{a}» and «{b}» appear', { a: words[0], b: words[1] }) : words.length === 1 ? t('because «{a}» appears', { a: words[0] }) : t(LANDS[sug]),
  );
  const chips = $derived(otherTargets(sug));
  const dayOf = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'long' }) : '');
  const pct = $derived(total ? Math.round(((pos - 1) / total) * 100) : 0);
  let headEl = $state();
  $effect(() => {
    // a new note: the reader starts at its text again
    if (note?.id && headEl) headEl.focus({ preventScroll: true });
  });
</script>

{#if note}
  <section class="abr card" aria-labelledby="abr-h" data-sort-round>
    <div class="abr-top">
      <p class="abr-pos num" data-abr-pos>{t('{n} of {total}', { n: pos, total })}</p>
      <button type="button" class="btn btn-link abr-pause" onclick={() => onpause?.()} data-abr-pause><Pause size={16} aria-hidden="true" />{t('Pause')}</button>
    </div>
    <div class="abr-bar" role="progressbar" aria-label={t('Sorting round')} aria-valuemin="0" aria-valuemax={total} aria-valuenow={pos - 1}><span style:width="{pct}%"></span></div>
    <h2 id="abr-h" class="abr-h" tabindex="-1" bind:this={headEl}>{t('Note from {day}', { day: dayOf(note.at) })}</h2>
    {#if note.photo}<img class="abr-ph" src={note.photo} alt="" />{/if}
    <p class="abr-text" data-abr-text>{note.mail?.subject || note.text}</p>
    <div class="abr-sug" data-abr-sug={sug}>
      <p class="abr-cap">{t('Suggestion')}</p>
      <p class="abr-what"><b>{what}</b>{#if why}<span>{why}</span>{/if}</p>
      <button type="button" class="btn hi abr-go" onclick={() => (sug === 'keep' ? onkeep?.(note) : onfile?.(note, sug, true))} data-abr-file>
        <Check size={16} aria-hidden="true" />{t('File|round')}
      </button>
    </div>
    <p class="abr-cap" id="abr-other">{t('Or somewhere else')}</p>
    <div class="abr-chips" role="group" aria-labelledby="abr-other">
      {#each chips as k (k)}
        {@const Icon = ICONS[k] ?? ICONS.keep}
        <button type="button" class="abr-chip" onclick={() => onfile?.(note, k, true)} data-abr-chip={k}><Icon size={16} aria-hidden="true" />{t(TARGET[k].name)}</button>
      {/each}
      <button type="button" class="abr-chip" onclick={() => onfile?.(note, null, false)} data-abr-chip="more"><Shuffle size={16} aria-hidden="true" />{t('Other target …')}</button>
    </div>
    <div class="abr-acts">
      {#if sug !== 'keep'}<button type="button" class="btn" onclick={() => onkeep?.(note)} data-abr-keep>{t('Keep')}</button>{/if}
      <button type="button" class="btn" onclick={() => ondelete?.(note)} data-abr-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
      <button type="button" class="btn abr-skip" onclick={() => onskip?.(note)} data-abr-skip><SkipForward size={16} aria-hidden="true" />{t('Skip')}</button>
    </div>
    <p class="abr-fine">{t('Nothing is lost: «Undo» comes after every step, deleted notes wait in the trash.')}</p>
  </section>
{:else if tally}
  <section class="abr card abr-end" aria-labelledby="abr-end-h" data-sort-end>
    <Check size={28} aria-hidden="true" />
    <h2 id="abr-end-h" class="abr-h" tabindex="-1" bind:this={headEl}>{tally.left ? t('Round done') : t('Inbox empty')}</h2>
    <p class="abr-sum num" data-abr-sum>
      {tn(tally.filed, '{n} filed', '{n} filed')} · {tn(tally.kept, '{n} kept', '{n} kept')} · {tn(tally.deleted, '{n} deleted', '{n} deleted')}{#if tally.skipped}{' · '}{tn(tally.skipped, '{n} skipped|round', '{n} skipped|round')}{/if}
    </p>
    {#if tally.left}<p class="abr-fine">{tn(tally.left, '{n} note is still waiting in the list.', '{n} notes are still waiting in the list.')}</p>{/if}
    <div class="abr-acts abr-endacts">
      <button type="button" class="btn" onclick={() => onend?.()} data-abr-back>{t('Back to the inbox|round')}</button>
      <a class="btn hi" href="#/" data-abr-home>{t('To Today')}</a>
    </div>
  </section>
{/if}

<style>
  .abr {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    margin: 0 0 16px;
    max-width: 640px;
  }
  .abr-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .abr-pos {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .abr-pause {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .abr-bar {
    height: 6px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .abr-bar span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.2s var(--ease-out);
  }
  .abr-h {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .abr-h:focus {
    outline: none;
  }
  .abr-ph {
    max-width: 100%;
    max-height: 220px;
    object-fit: contain;
    align-self: flex-start;
    border-radius: var(--r-ctl);
  }
  .abr-text {
    margin: 0;
    font-size: var(--fs-section);
    line-height: var(--lh-title);
    overflow-wrap: break-word;
    white-space: pre-line;
  }
  .abr-sug {
    display: grid;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
  }
  .abr-cap {
    margin: 0;
    font-size: var(--fs-tiny);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-3);
  }
  .abr-what {
    margin: 0;
    display: grid;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .abr-what span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .abr-go {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .abr-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .abr-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .abr-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }
  .abr-acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .abr-skip {
    margin-left: auto;
  }
  .abr-fine {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .abr-end {
    align-items: flex-start;
    color: var(--ok);
  }
  .abr-end .abr-h {
    color: var(--ink);
    font-size: var(--fs-section);
  }
  .abr-sum {
    margin: 0;
    color: var(--ink-2);
  }
  .abr-endacts {
    margin-top: 8px;
  }
</style>
