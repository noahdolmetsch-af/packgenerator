<script>
  /**
   * v0.117.0 «Knöpfe neu» (mockup N3, Noah 12.10.2026 «n1-n4 freigeben»): the one button of the app.
   *
   *   <Btn kind="hi" icon={Check} label={t('Done|task')} explain={explain('Done|task')} sub="Gabel-Service · heute" onclick={…} />
   *
   * kind   'hi'     Haupt: green, the one most important action of a row or a page (at most one)
   *        'normal' (default) Normal: white with a thin frame
   *        'quiet'  Leise: an underlined word («Später», «Überspringen»)
   * label  1–2 words, never wraps (N3 rule 4); the long part goes into `explain`
   * icon   a lucide component shown before the label (optional)
   * explain / sub   the bubble on hover, keyboard focus and long press (ui/explain.js); for a button
   *        with only an icon (`label` empty) `aria` is required and is what the bubble says
   * aria   aria-label (for an icon-only button, or a label that needs the row's name)
   * href   makes it a link that looks like the button
   * All other props (type, disabled, aria-*, data-*, class) go to the element.
   * Use it inside `<div class="rowacts">` for a row's actions: right-aligned on a computer, the full
   * card width under the row's text on a phone, «…» (ui/MoreActions.svelte) 44 px square beside it.
   */
  let { kind = 'normal', icon: Icon = null, label = '', explain = '', sub = '', aria = undefined, href = undefined, type = 'button', class: cls = '', onclick = undefined, ...rest } = $props();
  const K = { hi: 'hi', quiet: 'btn-link', normal: '' };
</script>

{#if href}
  <a class="btn k {K[kind] ?? ''} {cls}" {href} aria-label={aria} data-explain={explain || undefined} data-explain-sub={sub || undefined} {onclick} {...rest}>{#if Icon}<Icon size={17} aria-hidden="true" />{/if}{#if label}<span class="kl">{label}</span>{/if}</a>
{:else}
  <button {type} class="btn k {K[kind] ?? ''} {cls}" aria-label={aria} data-explain={explain || undefined} data-explain-sub={sub || undefined} {onclick} {...rest}>{#if Icon}<Icon size={17} aria-hidden="true" />{/if}{#if label}<span class="kl">{label}</span>{/if}</button>
{/if}
