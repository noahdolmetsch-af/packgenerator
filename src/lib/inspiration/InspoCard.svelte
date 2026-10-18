<script>
  /**
   * «Inspiration» UC2-1 (mockup UC2-1-inspiration): one of your links as a card: the kind, the site,
   * a star, the title, your own key words and numbers, the button to the page, the note «Das übernehme
   * ich» and what it can become (action chips). A video and a route get a drawn placeholder, never a
   * photo from the page.
   */
  import { t, num } from '../i18n.svelte.js';
  import { dayLong, dates } from '../review/fmt.js';
  import { domainOf } from '../rig.js';
  import { TYPE, ACTIONS, HAS_TAKE, openLabel } from '../inspiration.js';
  import { Star, ExternalLink, Pencil, Play } from '@lucide/svelte';

  let { link, rigs = 0, onstar, onedit, ontake, onact } = $props();

  const site = $derived(domainOf(link.url));
  const f = $derived(link.facts ?? {});
  // svelte-ignore state_referenced_locally
  let take = $state(link.take ?? '');
  $effect(() => {
    take = link.take ?? '';
  });
  const save = () => {
    if ((take ?? '').trim() !== (link.take ?? '')) ontake?.(take.trim());
  };
  const dateText = (a, b) => (a ? dates(a, b || a) : '');
  const ACT = { wish: 'Wishlist', rule: 'Packing rule', note: 'Note|insp', trip: 'Trip draft', calendar: 'Calendar' };
  const acts = $derived((ACTIONS[link.type] ?? []).filter((a) => a !== 'calendar' || !!link.raceDate));
</script>

<article class="ic-card" data-type={link.type}>
  <div class="ic-top">
    <span class="ic-badge" data-type={link.type}>{t(TYPE[link.type]?.name ?? 'Guide|insp')}</span>
    <span class="ic-site">{site}</span>
    <button type="button" class="ic-star" aria-pressed={!!link.star} aria-label={link.star ? t('Unstar {name}', { name: link.title }) : t('Star {name}', { name: link.title })} onclick={onstar}><Star size={18} aria-hidden="true" /></button>
  </div>
  {#if link.type === 'video'}
    <div class="ic-art ic-video" aria-hidden="true"><span class="ic-play"><Play size={18} /></span></div>
  {:else if link.type === 'route'}
    <svg class="ic-art" viewBox="0 0 320 76" preserveAspectRatio="none" aria-hidden="true">
      <path class="ic-hill" d="M0 58 C40 40 70 52 110 38 C150 24 190 42 230 30 C270 20 300 34 320 26 L320 76 L0 76 Z" />
      <path class="ic-path" d="M24 60 C70 50 100 44 140 34 C180 24 220 30 250 40 C276 48 290 36 304 22" />
      <circle class="ic-a" cx="24" cy="60" r="5" />
      <circle class="ic-b" cx="304" cy="22" r="5" />
    </svg>
  {/if}
  <h3>{link.title}</h3>
  <p class="ic-own">{t('Added by you · your key words')}</p>
  {#if link.type === 'route' && (f.km != null || f.up != null || f.days != null)}
    <p class="ic-facts num">
      {#if f.km != null}<span><b>{num(f.km)} km</b></span>{/if}
      {#if f.up != null}<span><b>{num(f.up)} m</b> {t('up|insp')}</span>{/if}
      {#if f.days != null}<span><b>{t(f.days === 1 ? '{n} day' : '{n} days', { n: num(f.days) })}</b></span>{/if}
    </p>
  {:else if link.type === 'product' && (f.price || f.grams != null)}
    <p class="ic-facts num">
      {#if f.price}<span><b>{f.price}</b> {t('price|insp')}</span>{/if}
      {#if f.grams != null}<span><b>{num(f.grams)} g</b> {t('weight|insp')}</span>{/if}
    </p>
  {:else if link.type === 'race' && (link.raceDate || f.place)}
    <p class="ic-facts num">
      {#if link.raceDate}<span><b>{dateText(link.raceDate, link.raceEnd)}</b></span>{/if}
      {#if f.place}<span>{f.place}</span>{/if}
    </p>
  {/if}
  {#if link.notes?.length}<ul class="ic-notes">{#each link.notes as n, k (k)}<li>{n}</li>{/each}</ul>{/if}
  <div class="ic-open">
    <a class="btn" href={link.url} target="_blank" rel="noopener noreferrer">{t(openLabel(link.type), { site })}<ExternalLink size={14} aria-hidden="true" /></a>
    <button type="button" class="ic-edit" aria-label={t('Change {name}', { name: link.title })} onclick={onedit}><Pencil size={16} aria-hidden="true" /></button>
  </div>
  {#if HAS_TAKE.includes(link.type)}
    <label class="ic-take"><span class="ic-tl">{t('What I take from it')}</span><input class="inp" bind:value={take} onblur={save} onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), save())} placeholder={t('What do you take with you?')} /></label>
    <p class="ic-help">{t('Write what you take from it, then choose where it goes.')}</p>
  {/if}
  {#if acts.length || (link.type === 'race' && rigs)}
    <div class="ic-acts" role="group" aria-label={t('The note becomes …')}>
      {#each acts as a (a)}
        <button type="button" class="ic-chip" onclick={() => (save(), onact?.(a, take))}>→ {a === 'wish' && link.type === 'product' ? t('Wishlist with price and weight') : t(ACT[a])}</button>
      {/each}
      {#if link.type === 'race' && rigs}<a class="ic-chip ic-rigs" href="#/bikes?tab=rig">{t('Rigs of this race: {n}', { n: rigs })}</a>{/if}
    </div>
  {/if}
  {#if link.type === 'product' && f.price && link.priceAt}<p class="ic-small">{t('Price from {date}, it can change.', { date: dayLong(link.priceAt) })}</p>{/if}
</article>

<style>
  .ic-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .ic-top {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ic-badge {
    flex: none;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--hi-soft);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.5 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ic-badge[data-type='video'],
  .ic-badge[data-type='podcast'] {
    background: var(--accent-soft);
  }
  .ic-badge[data-type='race'] {
    background: var(--bad-soft);
  }
  .ic-badge[data-type='product'] {
    background: var(--ok-soft);
  }
  .ic-site {
    flex: 1;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    overflow-wrap: break-word;
  }
  .ic-star,
  .ic-edit {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px -10px -10px 0;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .ic-edit {
    margin: 0;
  }
  .ic-star:hover,
  .ic-edit:hover {
    background: var(--paper-2);
  }
  .ic-star[aria-pressed='true'] {
    color: var(--warn);
  }
  .ic-star[aria-pressed='true'] :global(svg) {
    fill: currentColor;
  }
  .ic-art {
    display: block;
    width: 100%;
    height: 76px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .ic-video {
    display: grid;
    place-items: center;
  }
  .ic-play {
    display: grid;
    place-items: center;
    width: 36px;
    height: 28px;
    border: 2px solid var(--ink-3);
    border-radius: 7px;
    color: var(--ink-3);
  }
  .ic-hill {
    fill: var(--line);
  }
  .ic-path {
    fill: none;
    stroke: var(--hi);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .ic-a {
    fill: var(--hi);
  }
  .ic-b {
    fill: var(--bad);
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .ic-own,
  .ic-small {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ic-small {
    margin: 0;
  }
  .ic-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ic-facts b {
    color: var(--ink);
    font-weight: 600;
  }
  .ic-notes {
    margin: 0;
    padding-left: 18px;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ic-open {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ic-take {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ic-tl {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .ic-help {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .ic-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ic-chip {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--hi-soft);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.25 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .ic-chip:hover {
    border-color: var(--hi);
  }
  .ic-rigs {
    background: var(--paper-2);
  }
  @media (pointer: coarse) {
    .ic-chip {
      min-height: 44px;
    }
  }
</style>
