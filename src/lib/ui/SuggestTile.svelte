<script>
  /**
   * v0.102.0 «Vorschlag und Challenge» (Noah 12.10.2026 «d1-d5 freigeben», mockups D1b and D5): one
   * suggestion tile for every area. The question on top, the alternatives as chips to choose from
   * (one chosen, «+ own»), «Done today» for the chosen one, and the challenge line: «Set as a challenge»
   * or the running one with its count («Challenge: 10× Swim in October · 6 of 10»). Never mandatory.
   *
   * title, icon, options [names], pick, done (today), label(name) → shown word, challenge ({ what,
   * times, until, n } | null), reached (a challenge just reached), onpick(name), onadd(name), ontick(),
   * onchallenge() (opens the sheet).
   */
  import { Check, Trophy, Plus } from '@lucide/svelte';
  import TileHead from '../home/TileHead.svelte';
  import { t, num, locale } from '../i18n.svelte.js';

  let { title, icon, id = 'sg-h', side = '', options = [], pick = null, done = false, label = (x) => x, challenge = null, reached = null, onpick, onadd, ontick, onchallenge } = $props();
  let adding = $state(false);
  let own = $state('');
  const until = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  function addOwn(e) {
    e.preventDefault();
    if (own.trim()) onadd?.(own.trim());
    own = '';
    adding = false;
  }
</script>

<section class="sg surf" aria-labelledby={id} data-suggest>
  <TileHead {icon} {id} {title} {side} />
  <div class="chips" role="group" aria-label={t('Alternatives')}>
    {#each options as o (o)}
      <button type="button" class="chip" aria-pressed={o === pick} onclick={() => onpick?.(o)}>{label(o)}</button>
    {/each}
    {#if adding}
      <form class="own" onsubmit={addOwn}>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="inp" type="text" maxlength="40" bind:value={own} aria-label={t('Your own suggestion')} autofocus />
        <button type="submit" class="btn sm">{t('Add')}</button>
      </form>
    {:else}
      <button type="button" class="chip add" onclick={() => (adding = true)}><Plus size={14} aria-hidden="true" />{t('own|suggestion')}</button>
    {/if}
  </div>
  {#if pick}
    <button type="button" class="btn tick" class:on={done} aria-pressed={done} onclick={() => ontick?.()}>{#if done}<Check size={18} aria-hidden="true" />{/if}{done ? t('{what}: done today', { what: label(pick) }) : t('{what} today: tick off', { what: label(pick) })}</button>
  {/if}
  {#if reached}
    <p class="ch won" role="status" data-challenge-done><Trophy size={16} aria-hidden="true" /><span><b>{t('Challenge reached!')}</b> {t('{n}× {what}', { n: num(reached.times), what: label(reached.what) })}</span></p>
  {:else if challenge}
    <button type="button" class="ch" onclick={() => onchallenge?.()} data-challenge><Trophy size={16} aria-hidden="true" /><span><b>{t('Challenge:')}</b> {t('{n}× {what} until {date}', { n: num(challenge.times), what: label(challenge.what), date: until(challenge.until) })} · {t('{n} of {m}', { n: num(challenge.n), m: num(challenge.times) })}</span></button>
  {:else if pick}
    <button type="button" class="ch set" onclick={() => onchallenge?.()}><Trophy size={16} aria-hidden="true" /><span>{t('Set «{what}» as a challenge', { what: label(pick) })}</span></button>
  {/if}
</section>

<style>
  .sg {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .chip.add {
    color: var(--ink-2);
  }
  .own {
    display: flex;
    gap: 6px;
  }
  .own .inp {
    width: 160px;
  }
  .tick {
    align-self: flex-start;
  }
  .tick.on {
    border-color: transparent;
    background: var(--ok-soft);
    color: var(--ok);
  }
  .ch {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin: auto 0 0;
    padding: 6px 12px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--warn-soft);
    color: var(--ink);
    font: 400 var(--fs-small)/1.35 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .ch :global(svg) {
    flex: none;
    color: var(--warn);
  }
  .ch.set {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ch b {
    font-weight: 600;
  }
  .ch.won {
    background: var(--ok-soft);
    cursor: default;
  }
  .ch.won :global(svg) {
    color: var(--ok);
  }
</style>
