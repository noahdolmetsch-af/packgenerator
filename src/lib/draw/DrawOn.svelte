<script>
  /**
   * Paket NE 1146: the «Draw» button beside a photo (or «Drawing pad» for a new pad). It opens the
   * drawing window (loaded only on the first tap) and gives back the record's new photo list and inks.
   *
   * src: the photo (null: a new pad); list: all photos of the record, in order; inks: the record's map.
   * onsave({ list, inks, flats, ink, old }) (old: the pictures that were replaced). label, icon (only the icon), cls: the button's classes.
   */
  import { t } from '../i18n.svelte.js';
  import { PenLine } from '@lucide/svelte';
  import { inkFor, flatsOf, replaceFlats, withInk, pruneInks } from './ink.js';

  let { src = null, list = [], inks = undefined, label = '', icon = false, cls = 'btn sm', title = '', onsave, ...rest } = $props();

  let open = $state(false);
  const found = $derived(src ? inkFor(inks, src) : null);
  const name = $derived(label || (src ? t('Draw|photo') : t('Drawing pad')));

  async function saved({ flats, ink }) {
    const old = src ? flatsOf(inks, list, src) : [];
    const next = src ? replaceFlats(list, old, flats) : [...list, ...flats];
    await onsave?.({ list: next, inks: pruneInks(withInk(inks, old, flats, ink), next), flats, ink, old });
  }
</script>

<button type="button" class={cls} aria-label={icon ? name : undefined} title={icon ? name : undefined} onclick={() => (open = true)} {...rest}><PenLine size={16} aria-hidden="true" />{#if !icon}{name}{/if}</button>
{#if open}
  {#await import('./DrawSheet.svelte') then M}
    <M.default src={found ? null : src} ink={found?.ink ?? null} start={found?.at ?? 0} {title} onsave={saved} onclose={() => (open = false)} />
  {:catch}
    <p class="err" role="alert">{t('The drawing could not be loaded. Are you offline? Try again later.')}</p>
  {/await}
{/if}
