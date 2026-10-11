<script module>
  import { Zap, Backpack, Shirt, Scale, Wrench, Route, FileText, Layers, Heart, ChartColumn, StickyNote, Gauge, Blocks, Star, BookOpen, TriangleAlert, Activity, Flame, Sparkles, Flower2, FlaskConical, Sun, Lightbulb, Bike, MessageCircle, Info, Inbox, Database, Plus } from '@lucide/svelte';
  /** The icons of the tiles (tiles.js icon keys). */
  // a long word may break on a small phone tile: only where German breaks it (a soft hyphen after the
  // first part, «Kleider-schrank»). → the label in pieces, each piece its own span.
  const PARTS = /^(Kleider|Wunsch|Velo|Rück|Meilen|Spiel|Lieblings|Erinnerungs|Baustein|Ausrüstungs)(\p{L}{4,})$/u;
  export const soft = (text) => text.replace(/\p{L}{11,}/gu, (w) => w.replace(PARTS, '$1\u00ad\n$2')).split('\n');
  export const ICON = { zap: Zap, bag: Backpack, shirt: Shirt, scale: Scale, wrench: Wrench, route: Route, file: FileText, wardrobe: Shirt, layers: Layers, heart: Heart, chart: ChartColumn, note: StickyNote, counter: Gauge, blocks: Blocks, star: Star, book: BookOpen, alert: TriangleAlert, flow: Activity, flame: Flame, sparkles: Sparkles, lotus: Flower2, flask: FlaskConical, sun: Sun, bulb: Lightbulb, bike: Bike, chat: MessageCircle, info: Info, inbox: Inbox, data: Database, plus: Plus };
</script>

<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockup A): a small tile, one button: icon, word, a short line under it
   * (on a computer or when wide), a number where something waits, and a «New» dot (idea 1).
   * href: a link; else onclick. size: 's' or 'w'.
   */
  import { t, num } from '../i18n.svelte.js';

  let { tile, size = 's', href = null, onclick = null, sub = '', badge = 0, isnew = false, hot = false, dark = false, fn = null } = $props();
  const Icon = $derived(ICON[tile.icon] ?? Sparkles);
  const label = $derived(badge ? `${t(tile.label)}, ${t('{n} to do', { n: badge })}` : isnew ? `${t(tile.label)}, ${t('new|tile')}` : t(tile.label));
</script>

{#snippet inner()}
  <span class="ic"><Icon size={20} strokeWidth={2} aria-hidden="true" /></span>
  {#if badge}<span class="bd num" aria-hidden="true">{num(badge)}</span>{:else if isnew}<span class="nw" aria-hidden="true">{t('New|tile')}</span>{/if}
  <span class="lb">{#each soft(t(tile.label)) as p, i (i)}<span>{p}</span>{/each}</span>
  {#if sub}<span class="su">{sub}</span>{/if}
{/snippet}

{#if href}
  <a class="st {size}" class:hot class:dark {href} data-fn={fn} aria-label={label} onclick={onclick}>{@render inner()}</a>
{:else}
  <button type="button" class="st {size}" class:hot class:dark data-fn={fn} aria-label={label} {onclick}>{@render inner()}</button>
{/if}

<style>
  .st {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 2px;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 84px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.2 var(--font-body);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .st:hover {
    border-color: var(--line-strong);
    background: var(--paper-2);
  }
  .ic {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    margin-bottom: auto;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .lb {
    font-weight: 600;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    hyphens: manual;
  }
  .su {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
    line-height: 1.25;
  }
  .bd,
  .nw {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 0 7px;
    border-radius: 10px;
    font: 700 var(--fs-tiny)/1.5 var(--font-body);
  }
  .bd {
    background: var(--badge);
    color: var(--badge-ink);
  }
  .nw {
    background: var(--hi-soft);
    color: var(--badge-ink);
  }
  .hot .ic {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .dark {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .dark .su {
    color: color-mix(in srgb, var(--paper) 75%, transparent);
  }
  .dark:hover {
    background: var(--ink);
    opacity: 0.92;
  }
  /* a phone: the small tile is a square of a quarter width, icon over the word, no line under it */
  @media (max-width: 719px) {
    .st.s {
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 1px;
      text-align: center;
      font-size: var(--fs-tiny);
      letter-spacing: -0.01em;
    }
    .st.s .ic {
      margin-bottom: 0;
    }
    .st.s .su {
      display: none;
    }
    .st.s .lb {
      font-weight: 500;
    }
    .bd,
    .nw {
      top: 4px;
      right: 4px;
    }
  }

</style>
