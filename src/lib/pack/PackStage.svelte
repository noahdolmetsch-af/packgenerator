<script>
  /**
   * The bags of a trip as big boxes on a pale bike (Noah's sketch, 4.10.2026): each box shows
   * how many items, the weight, the first items and how full it is. It replaces the small labels
   * of the bike drawing on the Pack page. On a phone the same boxes are a strip you swipe (answer 10a).
   *
   * cards: [{ key, title, name, count, grams, unweighed, names, more, fill, vol, empty, active, noBag, heavy? }]
 * heavy (v0.21.0): names of heavy items high up or far back; the box shows a quiet hint.
   * onpick(key): open that bag. ondropitem(key, itemId): an item or tile was dropped on a box.
   * photo: the bike's setup photo, pale behind the boxes (answer 2a); onphoto(): open it big.
   * On a phone (strip) there is no room behind the boxes: only a small photo button (answer 3a).
   * bike = false (v0.21.0, areas without a bike): "On me" and the trip's own bags side by side,
   * no bike drawing.
   */
  import { formatWeight } from '../gear.js';
  import { formatVolume } from '../bikes.js';
  import { t, tn } from '../i18n.svelte.js';

  let { cards, onpick, ondropitem = null, strip = false, label = null, photo = null, photoName = '', onphoto = null, bike = true } = $props();
  let over = $state(null);

  // Where a place sits around the bike: the body places on the left, then the bike in three
  // columns (rear, frame, front) and three rows. Bottle cages sit low in the frame, where they are.
  const ME = ['body', 'carry', 'hip', 'mounted']; // v0.37.0: Hip next to Back
  const CELLS = [
    ['r1', ['seat']],
    ['m1', ['ttrear', 'top']],
    ['f1', ['pouchL', 'pouchR', 'bar']],
    ['r2', ['side']],
    ['m2', ['frame']],
    ['f2', ['fork']],
    ['m3', ['cage2', 'cage1', 'tool', 'down']],
  ];
  const SMALL = ['cage1', 'cage2', 'down', 'fork', 'ttrear', 'pouchL', 'pouchR'];
  const placed = new Set([...ME, ...CELLS.flatMap(([, keys]) => keys)]);
  const byKey = $derived(Object.fromEntries(cards.map((c) => [c.key, c])));
  const me = $derived(ME.map((k) => byKey[k]).filter(Boolean));
  const cells = $derived(CELLS.map(([area, keys]) => ({ area, cards: keys.map((k) => byKey[k]).filter(Boolean) })).filter((c) => c.cards.length));
  // Places the drawing does not know (items in a slot without a bag): next to the frame.
  const other = $derived(cards.filter((c) => !placed.has(c.key)));
  const ordered = $derived([...me, ...cells.flatMap((c) => c.cards), ...other]);

  function dragover(event, key) {
    if (!ondropitem) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'copyMove' ? 'move' : 'copy';
    over = key;
  }
  function drop(event, key) {
    if (!ondropitem) return;
    event.preventDefault();
    over = null;
    const id = event.dataTransfer.getData('text/plain');
    if (id) ondropitem(key, id);
  }
  const facts = (c) => {
    // v0.22.0 (AP04): unknown is not zero. A small card shows the plain sum only when every item is
    // weighed, else how many are not ("7 not weighed"); the bag list below has "known: …" next to it.
    const what = c.empty ? t('empty') : `${tn(c.count, '{n} item', '{n} items')} · ${c.unweighed ? t('{n} not weighed', { n: c.unweighed }) : formatWeight(c.grams)}`;
    // Without item volumes there is no fill to show, only the size of the bag.
    return c.cap && c.fill == null ? `${what} · ${formatVolume(c.cap)}` : what;
  };
</script>

{#snippet card(c, small = false)}
  <button
    type="button"
    class="bx"
    class:small
    class:empty={c.empty}
    class:on={c.active}
    class:over={over === c.key}
    class:nobag={c.noBag}
    aria-pressed={c.active}
    aria-label={`${c.name}, ${facts(c)}${c.noBag ? `, ${t('no bag here')}` : ''}${c.heavy?.length ? `. ${t('Heavy item high or far back: move to the frame bag?')}` : ''}`}
    title={c.name}
    onclick={() => onpick?.(c.key)}
    ondragover={(e) => dragover(e, c.key)}
    ondragleave={() => over === c.key && (over = null)}
    ondrop={(e) => drop(e, c.key)}
  >
    <span class="n">{c.title}</span>
    <span class="f num">{facts(c)}</span>
    {#if !small && !strip && c.names.length}
      <span class="its">
        {#each c.names as nm, i (i)}<span class="it">{nm}</span>{/each}
        {#if c.more}<span class="it more">{t('+{n} more', { n: c.more })}</span>{/if}
      </span>
    {/if}
    {#if !small && !strip && c.heavy?.length}
      <span class="hv" title={c.heavy.join(', ')}>{t('Heavy item high or far back: move to the frame bag?')}</span>
    {/if}
    {#if c.fill != null}
      <span class="vol num" aria-hidden="true"><span class="bar" class:warn={c.fill > 100}><i style:width="{Math.min(100, c.fill)}%"></i></span>{#if !small}{formatVolume(c.vol)} / {formatVolume(c.cap)}{/if}</span>
    {/if}
  </button>
{/snippet}

{#snippet photoBtn()}
  <button type="button" class="pbtn" aria-label={photoName ? t('Open the photo {name}', { name: photoName }) : t('Open the photo')} title={t('Open the photo')} onclick={() => onphoto?.()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 8" /></svg>
  </button>
{/snippet}

{#if strip}
  <div class="srow">
  {#if photo && onphoto}{@render photoBtn()}{/if}
  <div class="strip" role="group" aria-label={label ?? t('Bags')}>
    {#each ordered as c (c.key)}{@render card(c, true)}{/each}
  </div>
  </div>
{:else if !bike}
  <div class="stage" role="group" aria-label={label ?? t('Bags')}>
    <div class="me">
      {#each me as c (c.key)}{@render card(c)}{/each}
    </div>
    <div class="packs">
      {#each other as c (c.key)}{@render card(c)}{/each}
    </div>
  </div>
{:else}
  <div class="stage" role="group" aria-label={label ?? t('Bags')}>
    <div class="me">
      {#each me as c (c.key)}{@render card(c)}{/each}
    </div>
    <div class="bike" class:hasphoto={!!photo}>
      {#if photo}
        <!-- Answer 13b: the own bike behind the bags, pale so the boxes stay readable. -->
        <img class="photo" src={photo} alt="" />
        {#if onphoto}{@render photoBtn()}{/if}
      {:else}
      <svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="130" cy="205" r="82" /><circle cx="515" cy="205" r="82" />
        <path d="M130 205 L285 205 L255 82 Z" /><path d="M258 88 L465 76 L478 120 L285 205" /><path d="M478 120 L515 205" />
        <path d="M255 82 L250 58" /><path d="M222 56 L280 56" />
        <path d="M465 76 L462 56 L494 50" />
      </svg>
      {/if}
      {#each cells as cell (cell.area)}
        <div class="cell" style:grid-area={cell.area}>
          {#each cell.cards as c (c.key)}{@render card(c, SMALL.includes(c.key) && c.count < 3)}{/each}
        </div>
      {/each}
      {#if other.length}
        <div class="cell" style:grid-area="f3">
          {#each other as c (c.key)}{@render card(c, true)}{/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* v0.21.0 (stage D): a quiet hint, no warning colour. */
  .hv {
    display: block;
    margin-top: 4px;
    font-size: var(--fs-small);
    font-weight: 400;
    line-height: 1.3;
    font-style: italic;
    opacity: 0.85;
    white-space: normal;
  }
  .stage {
    display: grid;
    grid-template-columns: minmax(130px, 200px) minmax(0, 1fr);
    gap: 12px;
    padding: 12px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
  }
  /* v0.21.0: a trip without a bike, its bags in a row */
  .packs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: stretch;
    align-content: flex-start;
  }
  .packs > :global(.bx) {
    flex: 1 1 180px;
    min-height: 120px;
  }
  .me {
    display: grid;
    gap: 10px;
    align-content: start;
  }
  .bike {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr);
    grid-template-areas: 'r1 m1 f1' 'r2 m2 f2' 'r3 m3 f3';
    gap: 10px;
    min-height: 300px;
    align-content: space-between;
  }
  svg {
    position: absolute;
    inset: 4% 0 0;
    width: 100%;
    height: 96%;
    stroke: #cdd4cb;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    pointer-events: none;
  }
  .photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.4;
    pointer-events: none;
    filter: grayscale(0.3);
  }
  .pbtn {
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1.5px solid var(--ink-3);
    border-radius: 6px;
    background: var(--paper);
    cursor: pointer;
    pointer-events: auto;
  }
  .pbtn svg {
    position: static;
    width: 22px;
    height: 22px;
    stroke: var(--ink-2);
    stroke-width: 1.8;
  }
  .srow {
    display: flex;
    gap: 8px;
    min-width: 0;
  }
  .srow .strip {
    flex: 1;
    min-width: 0;
  }
  .srow .pbtn {
    position: static;
    flex: none;
    align-self: flex-start;
    width: 44px;
    height: 56px;
  }
  .cell {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    align-content: flex-start;
  }
  .cell > :global(.bx) {
    flex: 1 1 120px;
  }
  .cell > :global(.bx.small) {
    flex: 0 1 112px;
  }
  .bx {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 2px 0 rgba(15, 46, 39, 0.12);
  }
  /* v0.22.0 (AP03): the bag boxes on the photo are a map. Their names keep the condensed face
     (one of the few accents), so long German words like "Oberrohrtasche" stay whole in a narrow box. */
  .n {
    font: 800 18px/1.1 var(--font-brand);
    hyphens: auto;
    letter-spacing: 0.01em;
    overflow-wrap: break-word;
  }
  .small .n {
    font-size: 17px;
  }
  .f {
    font-size: 13px;
    color: var(--ink-2);
  }
  .its {
    display: flex;
    flex-direction: column;
    margin-top: 2px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--ink-2);
  }
  .it {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .it.more {
    color: var(--ink-3);
  }
  .vol {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .bar {
    flex: 1;
    min-width: 30px;
    height: 5px;
    border-radius: 3px;
    background: var(--paper-2, #e6ebe3);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--ink);
  }
  .bar.warn i {
    background: var(--hi);
  }
  /* Answer 4a: places with a bag but nothing in it stay visible, dashed. */
  .bx.empty {
    border: 2px dashed var(--line);
    background: transparent;
    color: var(--ink-3);
    box-shadow: none;
  }
  .bx.empty .f {
    color: var(--ink-3);
  }
  /* The open bag is dark. */
  .bx.on {
    background: var(--ink);
    border-color: var(--ink);
    border-style: solid;
    color: var(--paper);
  }
  .bx.on .f,
  .bx.on .its,
  .bx.on .vol {
    color: #c9d4cc;
  }
  .bx.on .bar {
    background: #3b4f46;
  }
  .bx.on .bar i {
    background: var(--hi);
  }
  .bx.nobag {
    border-color: #c0392b;
  }
  /* While dragging: the bag under the pointer lights up orange. */
  .bx.over {
    outline: 3px solid var(--hi);
    outline-offset: 2px;
  }
  @media (hover: hover) {
    .bx:hover {
      outline: 3px solid rgba(255, 91, 20, 0.35);
      outline-offset: 1px;
    }
  }
  /* Phone: one row of cards to swipe through. */
  .strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding: 2px 2px 8px;
    margin: 0 0 4px;
  }
  .strip .bx {
    flex: 0 0 auto;
    min-width: 128px;
    max-width: 180px;
    scroll-snap-align: start;
  }
  .strip .n {
    font-size: 17px;
    white-space: nowrap;
    overflow-wrap: normal;
  }
  .strip .f {
    white-space: nowrap;
  }
</style>
