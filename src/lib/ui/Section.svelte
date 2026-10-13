<script>
  /**
   * SN3/SN5 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei»): a section of the new pages:
   * its title, one quiet line under it, then the content, usually a white card of rows:
   *
   *   <Section title={t('Your templates')} sub={t('last used first')}>
   *     <ul class="card slist"><li class="srow"><span class="sib ok"><Tent size={18} /></span>
   *       <span class="sm"><b>Name</b><small>line</small></span><span class="sv num">2 kg</span>
   *       <span class="rowacts">…</span></li></ul>
   *   </Section>
   *
   * Row parts (styled here for every section): .slist (the card of rows), .srow (a row; an <a class="srow">
   * opens something), .sib (the icon tile; tones .ok .warn .plan .done .rated .info .purple), .sm (title
   * and quiet line), .sv (a value right, tabular), .schev (the chevron), .shint (a quiet line with an icon
   * under a card). On a phone a row's actions (.rowacts, app.css) go under its text, full width.
   * more: a snippet right of the title (e.g. a quiet link).
   */
  let { title, sub = '', id = undefined, more = null, children } = $props();
  // svelte-ignore state_referenced_locally
  const hid = id ?? `sec-${Math.random().toString(36).slice(2, 8)}`;
</script>

<section class="ssec" aria-labelledby={hid}>
  <div class="ssh">
    <div class="sst"><h2 id={hid}>{title}</h2>{#if sub}<p>{sub}</p>{/if}</div>
    {@render more?.()}
  </div>
  {@render children()}
</section>

<style>
  .ssec {
    min-width: 0;
  }
  .ssh {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0 2px 10px;
  }
  .sst {
    min-width: 0;
  }
  .ssh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
    overflow-wrap: break-word;
  }
  .ssh p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .ssec :global(.slist) {
    margin: 0;
    padding: 4px var(--sp-4);
    list-style: none;
  }
  .ssec :global(.srow) {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 60px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .ssec :global(.slist > li:first-child > .srow),
  .ssec :global(.slist > .srow:first-child) {
    border-top: 0;
  }
  .ssec :global(.slist > li:not(.srow) + li) {
    border-top: 1px solid var(--line);
  }
  .ssec :global(.slist > li:not(.srow) > .srow) {
    border-top: 0;
  }
  .ssec :global(a.srow:hover .sm b) {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .ssec :global(.sib) {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ssec :global(.sib.ok) {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .ssec :global(.sib.warn) {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .ssec :global(.sib.info) {
    background: var(--info-soft);
    color: var(--ink-2);
  }
  .ssec :global(.sib.purple) {
    background: var(--l4-soft);
    color: var(--l4);
  }
  .ssec :global(.sib.plan) {
    background: var(--st-plan-soft);
    color: var(--st-plan);
  }
  .ssec :global(.sib.done) {
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .ssec :global(.sib.rated) {
    background: var(--st-rated-soft);
    color: var(--st-rated);
  }
  .ssec :global(.sm) {
    flex: 1 1 160px;
    min-width: 0;
  }
  .ssec :global(.sm b) {
    display: block;
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .ssec :global(.sm small) {
    display: block;
    margin-top: 1px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  .ssec :global(.sm .spill) {
    display: block;
    margin-top: 5px;
  }
  .ssec :global(.sv) {
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-body);
    text-align: right;
    white-space: nowrap;
  }
  .ssec :global(.schev) {
    flex: none;
    color: var(--ink-3);
  }
  .ssec :global(.shint) {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: 10px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .ssec :global(.shint svg) {
    flex: none;
    margin-top: 2px;
  }
  @media (max-width: 719px) {
    .ssec :global(.srow) {
      flex-wrap: wrap;
    }
  }
</style>
