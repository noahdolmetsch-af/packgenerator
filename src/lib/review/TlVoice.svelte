<script>
  /**
   * Noah 27.10.2026 «1a»: a voice note in the Rückblick timeline, played right where it was spoken.
   * One button per voice note (44 px); playing one stops the others. What it says (when it was turned into
   * text with «As text») shows below. Nothing is recorded here (answer 2a): only what was spoken on the way.
   */
  import { onDestroy } from 'svelte';
  import { Play, Pause } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { voices = [] } = $props();
  let player = $state();
  let playing = $state('');
  const len = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.round(s || 0) % 60).padStart(2, '0')}`;

  function stop() {
    playing = '';
    try {
      player?.pause();
    } catch {
      /* nothing playing */
    }
  }
  function toggle(v) {
    if (playing === v.id) return stop();
    window.dispatchEvent(new CustomEvent('tl-voice-play'));
    playing = v.id;
    player.src = v.src;
    player.play().catch(stop);
  }
  const others = () => playing && stop();
  $effect(() => {
    window.addEventListener('tl-voice-play', others);
    return () => window.removeEventListener('tl-voice-play', others);
  });
  onDestroy(stop);
</script>

<span class="tlv">
  {#each voices as v, i (v.id ?? i)}
    <button type="button" class="tlv-b" aria-pressed={playing === v.id} onclick={() => toggle(v)} data-tl-voice>
      {#if playing === v.id}<Pause size={16} aria-hidden="true" />{:else}<Play size={16} aria-hidden="true" />{/if}
      <span>{playing === v.id ? t('Stop') : t('Play')}</span>
      <small class="num">{len(v.s)}</small>
    </button>
    {#if v.text}<span class="tlv-said">«{v.text}»</span>{/if}
  {/each}
  <audio bind:this={player} onended={stop} preload="none" hidden></audio>
</span>

<style>
  .tlv {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    margin-top: 4px;
  }
  .tlv-b {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .tlv-b[aria-pressed='true'] {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
  }
  .tlv-b small {
    font-weight: 400;
    opacity: 0.8;
  }
  .tlv-said {
    color: var(--ink-2);
    font-style: italic;
  }
</style>
