<script>
  /**
   * SK «Links nach aussen» (SKX1–SKX4, DG-X1 … DG-X16): the quiet row «Woanders» right at the thing a
   * link is about (an item, a bike, a trip, a due service; Noah 13.10.2026, answer 2 a). Each link is a
   * button with icon, name, a short line and the «opens elsewhere» sign; it opens in a new tab and
   * sends nothing but what stands in the link. Own links not entered yet show dashed with «eintragen»
   * (answer 3 a) and open the small window of SKX5. «…» at the end: «Diesen Link nicht mehr zeigen»
   * (Undo), «Link ändern». Every link is a suggestion; switched-off kinds come back under Ich ›
   * Darstellung.
   *
   * links: [{ kind (links.js LINKS key), sub, href?, icon, slot? (own links), label?, locate? (X11) }]
   * context: what the row belongs to (the own-link window's subtitle); stack: one link per line
   */
  import { Plus, ExternalLink, EyeOff, Pencil, MapPin } from '@lucide/svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import OwnLinkSheet from './OwnLinkSheet.svelte';
  import SkToast from './SkToast.svelte';
  import { LINKS, linkOn, bikeShopsUrl } from './links.js';
  import { skLinks, watchLinks } from './linkstore.svelte.js';
  import { setOwnLink, removeOwnLink, setLinkOff } from './store.js';
  import { skIcon } from './icons.js';
  import { t, lang } from '../i18n.svelte.js';

  let { links = [], context = '', stack = false } = $props();

  watchLinks();
  const own = $derived(skLinks.own);
  const off = $derived(skLinks.off);
  const shown = $derived(links.filter((l) => LINKS[l.kind] && linkOn(off, l.kind)));
  let editing = $state(null);
  let note = $state(null);

  const nameOf = (l) => (l.label ? l.label : t(LINKS[l.kind].label));
  const stored = (l) => (LINKS[l.kind].own && l.slot ? own[l.slot] ?? null : null);
  const missing = (l) => LINKS[l.kind].own && !stored(l);

  function hideKind(l) {
    setLinkOff(l.kind, true);
    note = { text: t('«{name}» no longer shown', { name: nameOf(l) }), undo: () => setLinkOff(l.kind, false) };
  }
  const actions = $derived(
    shown.flatMap((l) => [
      ...(stored(l) ? [{ name: t('Change «{name}»', { name: stored(l).name || nameOf(l) }), icon: Pencil, run: () => (editing = l) }] : []),
      { name: t('Don’t show «{name}» any more', { name: nameOf(l) }), explain: t('Comes back under Me › Appearance'), icon: EyeOff, run: () => hideKind(l) },
    ]),
  );

  // X11: the place is asked for only now, when the button is tapped; without it the map opens anyway
  function locate(e, l) {
    if (!l.locate) return;
    e.preventDefault();
    const w = window.open('about:blank', '_blank');
    if (w) w.opener = null;
    const go = (url) => (w ? (w.location.href = url) : window.open(url, '_blank', 'noopener'));
    if (!navigator.geolocation) return go(bikeShopsUrl(null, lang.v));
    navigator.geolocation.getCurrentPosition(
      (p) => go(bikeShopsUrl({ lat: p.coords.latitude, lon: p.coords.longitude }, lang.v)),
      () => go(bikeShopsUrl(null, lang.v)),
      { timeout: 8000, maximumAge: 300000 },
    );
  }
</script>

{#if shown.length}
  <div class="sk-wo" class:sk-stack={stack} data-sk-woanders>
    <span class="sk-wl">{t('Elsewhere|links')}</span>
    <ul class="sk-ls">
      {#each shown as l (l.kind + (l.slot ?? ''))}
        {@const Icon = skIcon(l.icon)}
        <li>
          {#if missing(l)}
            <button type="button" class="sk-l sk-dash" data-sk-link={l.kind} data-sk-enter onclick={() => (editing = l)}>
              <Plus size={18} aria-hidden="true" />
              <span class="sk-lm"><b>{nameOf(l)}</b><small>{t('own link · enter')}</small></span>
            </button>
          {:else}
            {@const s = stored(l)}
            <a class="sk-l" data-sk-link={l.kind} href={s ? s.url : l.href} target="_blank" rel="noopener noreferrer" onclick={(e) => locate(e, l)}>
              <Icon size={18} aria-hidden="true" />
              <span class="sk-lm"><b>{s?.name || nameOf(l)}</b><small>{s ? [l.sub, t('your link')].filter(Boolean).join(' · ') : l.sub}</small>{#if l.locate}<small class="sk-loc"><MapPin size={12} aria-hidden="true" />{t('asks for your location only when tapped')}</small>{/if}</span>
              <ExternalLink class="sk-ext" size={16} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span>
            </a>
          {/if}
        </li>
      {/each}
    </ul>
    <MoreActions title={t('Elsewhere|links')} label={t('Options for the links elsewhere')} {actions} />
  </div>
  {#if editing}
    {@const l = editing}
    <OwnLinkSheet title={t('Enter a link')} context={[nameOf(l), context].filter(Boolean).join(' · ')} value={stored(l)} name={nameOf(l)} onsave={(v) => setOwnLink(l.slot, v)} onremove={stored(l) ? () => removeOwnLink(l.slot) : null} onoff={() => hideKind(l)} onclose={() => (editing = null)} />
  {/if}
  <SkToast bind:note />
{/if}

<style>
  .sk-wo {
    display: flex;
    align-items: flex-start;
    gap: 8px 12px;
    margin: 12px 0 0;
  }
  .sk-wl {
    flex: none;
    padding-top: 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sk-ls {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-ls li {
    max-width: 100%;
  }
  .sk-l {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    min-height: 48px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .sk-l:hover {
    background: var(--paper-2);
  }
  .sk-l :global(svg) {
    flex: none;
    color: var(--ink-2);
  }
  .sk-l :global(.sk-ext) {
    color: var(--ink-3);
  }
  .sk-dash {
    border-style: dashed;
    background: none;
  }
  .sk-lm {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .sk-lm b {
    font-weight: 600;
    font-size: var(--fs-body);
    line-height: 1.25;
    overflow-wrap: break-word;
  }
  .sk-lm small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .sk-loc {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .sk-stack {
    flex-wrap: wrap;
  }
  .sk-stack .sk-wl {
    flex: 1;
    padding-top: 0;
  }
  .sk-stack .sk-ls {
    order: 3;
    flex-basis: 100%;
    align-items: stretch;
  }
  .sk-stack .sk-l {
    display: flex;
    width: 100%;
  }
  .sk-stack .sk-lm {
    flex: 1;
  }
  /* a phone: each link on its own line over the whole width */
  @media (max-width: 719px) {
    .sk-wo {
      flex-wrap: wrap;
    }
    .sk-wl {
      flex: 1;
      padding-top: 0;
    }
    .sk-ls {
      order: 3;
      flex-basis: 100%;
      align-items: stretch;
    }
    .sk-l {
      display: flex;
      width: 100%;
    }
    .sk-lm {
      flex: 1;
    }
  }
</style>
