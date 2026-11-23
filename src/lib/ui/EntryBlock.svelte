<script>
  /**
   * «Mein Tag» (Noah 23.11.2026 «1-5 a», Design-Abgleich): one entry of a day as a block, the same on Mein Tag, on Heute
   * and wherever an entry of the plan is shown. A 4 px edge in the colour of its kind, a lightly tinted ground, the time,
   * the title, an optional second line and (if `oncheck` is given) a round tick on the right.
   * Colours only from the palette (`--wk-*` in src/app.css); never colour alone: the kind has its word in `sub` or `title`.
   * Props (strings are already translated by the caller):
   *   kind      'sport' | 'date' | 'todo' | 'away' | 'bike' | 'rest' | 'food' | 'sp' (unknown: 'sport')
   *   time      'HH:MM' or '' (nothing shown)
   *   title     the name of the entry
   *   sub       a quiet second line (length, place, «2 open») or ''
   *   done      ticked: the title is struck through
   *   href      the block opens this address when given
   *   oncheck   a function: shows the tick; it is called when the tick is tapped
   *   checkLabel the tick's label for screen readers, already translated (e.g. «Done: Yoga»)
   *   style     extra inline style from the caller, e.g. the position in a timeline
   */
  let { kind = 'sport', time = '', title = '', sub = '', done = false, href = null, oncheck = null, checkLabel = '', style = '' } = $props();
  const KINDS = ['sport', 'date', 'todo', 'away', 'bike', 'rest', 'food', 'sp'];
  const k = $derived(KINDS.includes(kind) ? kind : 'sport');
</script>

<div class="eb k-{k}" class:done {style} data-entry-block={k}>
  {#snippet body()}
    {#if time}<span class="eb-time">{time}</span>{/if}
    <span class="eb-text"><b class="eb-title">{title}</b>{#if sub}<small class="eb-sub">{sub}</small>{/if}</span>
  {/snippet}
  {#if href}
    <a class="eb-main" {href}>{@render body()}</a>
  {:else}
    <div class="eb-main">{@render body()}</div>
  {/if}
  {#if oncheck}
    <button type="button" class="eb-ck" aria-pressed={done} aria-label={checkLabel || title} onclick={() => oncheck()}>
      <span class="eb-ring">
        {#if done}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l5 5 9-11" /></svg>{/if}
      </span>
    </button>
  {/if}
</div>

<style>
  .eb {
    --k: var(--wk-sport);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 52px;
    box-sizing: border-box;
    padding: var(--sp-1) 0 var(--sp-1) var(--sp-3);
    border: 1px solid color-mix(in srgb, var(--k) 40%, transparent);
    border-left: 4px solid var(--k);
    border-radius: var(--sp-3);
    background: color-mix(in srgb, var(--k) 13%, var(--paper));
    color: var(--ink);
  }
  .k-date { --k: var(--wk-date); }
  .k-todo { --k: var(--wk-todo); }
  .k-away { --k: var(--wk-away); }
  .k-bike { --k: var(--wk-bike); }
  .k-rest { --k: var(--wk-rest); }
  .k-food { --k: var(--wk-food); }
  .k-sp { --k: var(--wk-sp); }
  .eb-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }
  a.eb-main:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
    border-radius: var(--sp-2);
  }
  .eb-time {
    flex: none;
    min-width: 44px;
    font-size: var(--fs-small);
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .eb-text {
    min-width: 0;
    display: grid;
    gap: 0;
  }
  .eb-title {
    font-size: var(--fs-body);
    font-weight: 600;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .eb-sub {
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .done .eb-title {
    text-decoration: line-through;
    color: var(--ink-2);
  }
  /* the tick: a 28 px ring inside a 44 x 44 px tap area */
  .eb-ck {
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .eb-ring {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--k);
    display: grid;
    place-items: center;
    color: var(--paper);
  }
  .done .eb-ring {
    background: var(--ok);
    border-color: var(--ok);
  }
  .eb-ring svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .eb-ck:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -4px;
    border-radius: 50%;
  }
</style>
