<script>
  /**
   * v0.120.0 «Neue Tour Teil 2» (mockups B4/B5, Noah 12.10.2026 «b2 b4 b5 ok»): the one option button of
   * the app (pattern N1–N4). It was the local `.obtn` of the trip window (v0.114.0, templates and examples).
   *
   *   <OptionButton pressed={on} label={t('Standard')} onclick={…} />                         small (templates)
   *   <OptionButton size="lg" pressed={on} icon={Wrench} label="Reparatur" sub="8 Teile · 440 g" … />  big (blocks)
   *
   * pressed  chosen: green with a check (big: a white circle with ✓ on the right); not chosen: white with
   *          the icon (big: a circle with + on the right)
   * size     'sm' (default) a short pill; 'lg' a big card button: icon tile, title, sub line
   * icon     a lucide component (the icon tile of 'lg'; in 'sm' shown when not pressed); `lead` a snippet instead
   * tone     the icon tile's colour of a big button when not chosen: 'green' (default), 'blue', 'amber', 'purple'
   * badge    a suggestion: the big button gets a dashed frame and this small label on its top edge
   *          (it stands out 10 px above the button: leave that room above the row)
   * explain / explainSub   the bubble on hover and long press (ui/explain.js): what is inside
   * All other props (title, disabled, aria-*, data-*) go to the button.
   */
  import { Check, Plus } from '@lucide/svelte';

  let { pressed = false, size = 'sm', icon: Icon = null, lead = null, label = '', sub = '', tone = 'green', badge = '', explain = '', explainSub = '', class: cls = '', onclick = undefined, ...rest } = $props();
</script>

{#if size === 'lg'}
  <button type="button" class="obtn lg tone-{tone} {cls}" class:sug={!!badge && !pressed} aria-pressed={pressed} data-explain={explain || undefined} data-explain-sub={explainSub || undefined} {onclick} {...rest}>
    {#if badge && !pressed}<span class="obadge">{badge}</span>{/if}
    <span class="otile" aria-hidden="true">{#if lead}{@render lead()}{:else if Icon}<Icon size={20} />{/if}</span>
    <span class="otext"><b>{label}</b>{#if sub}<small>{sub}</small>{/if}</span>
    <span class="omark" aria-hidden="true">{#if pressed}<Check size={18} strokeWidth={2.5} />{:else}<Plus size={18} />{/if}</span>
  </button>
{:else}
  <button type="button" class="obtn {cls}" aria-pressed={pressed} data-explain={explain || undefined} data-explain-sub={explainSub || undefined} {onclick} {...rest}>{#if pressed}<Check size={18} aria-hidden="true" />{:else if lead}{@render lead()}{:else if Icon}<Icon size={18} aria-hidden="true" />{/if}<span>{label}</span></button>
{/if}

<style>
  /* small: the pill of the templates (moved here from TripDialog.svelte, unchanged) */
  .obtn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .obtn span {
    overflow-wrap: break-word;
  }
  .obtn :global(svg) {
    flex: none;
  }
  .obtn[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  /* big: B4/B5, icon tile · title and sub line · a round mark (✓ chosen, + to add) */
  .obtn.lg {
    position: relative;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 30px;
    justify-content: stretch;
    align-items: center;
    gap: 12px;
    min-height: 62px;
    padding: 10px 12px;
    border-radius: 10px;
    text-align: left;
    font: 400 var(--fs-body) / 1.3 var(--font-body);
  }
  .obtn.lg.sug {
    border: 1.5px dashed var(--warn);
  }
  .obadge {
    position: absolute;
    top: -10px;
    left: 12px;
    max-width: calc(100% - 24px);
    padding: 1px 8px;
    border: 1px solid color-mix(in srgb, var(--warn) 45%, transparent);
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .otile {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--ok-soft);
    color: var(--ok);
  }
  .tone-blue .otile { background: var(--info-soft); color: var(--ink-2); }
  .tone-amber .otile { background: var(--warn-soft); color: var(--warn); }
  .tone-purple .otile { background: var(--l4-soft); color: var(--l4); }
  .otext { min-width: 0; overflow-wrap: break-word; }
  .otext b { display: block; font-weight: 600; }
  .otext small { display: block; margin-top: 2px; font-size: var(--fs-small); color: var(--ink-2); }
  .omark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink-2);
  }
  .obtn.lg[aria-pressed='true'] .otile { background: color-mix(in srgb, var(--paper) 22%, transparent); color: var(--paper); }
  .obtn.lg[aria-pressed='true'] .otext small { color: color-mix(in srgb, var(--paper) 85%, transparent); }
  .obtn.lg[aria-pressed='true'] .omark { border-color: var(--paper); background: var(--paper); color: var(--accent); }
  .obtn:disabled { cursor: default; opacity: 0.55; }
</style>
