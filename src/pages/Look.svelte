<script>
  /**
   * v0.97.0 Design-Refresh R1 «Darstellung» (G1 neu, Noah 11.10 23:10 «Runde 1 alles ★ und G1–G12
   * freigegeben»; 12.10 «1a 2a»): Ich › Darstellung (#/me/look). The font of the whole app (8, four
   * shown, «All 8 fonts» opens the rest), the colour world (Salbei new, the earlier ones stay), the text
   * size and light or dark. Everything only on this device and a suggestion: any choice can be changed
   * back. On a computer a small preview of the Material page shows the choice at once.
   */
  import { t } from '../lib/i18n.svelte.js';
  import { theme, FONTS, PALETTES, SIZES, MODES, setFont, setPalette, setSize, setMode } from '../lib/theme.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import LinksOff from '../lib/sk/LinksOff.svelte'; // SK: switched-off outside links come back here
  import Seg from '../lib/ui/Seg.svelte';
  import { ChevronLeft, ChevronRight, Check } from '@lucide/svelte';
  import NameSection from '../lib/home/NameSection.svelte'; // HG1c «Dein Name», the first section

  const FIRST = 4;
  let allFonts = $state(false);
  // the chosen font is always in sight, also when it is one of the last four
  const fonts = $derived(allFonts || FONTS.findIndex((f) => f.key === theme.font) >= FIRST ? FONTS : FONTS.slice(0, FIRST));
  const sample = $derived(t('Down sleeping bag 700') + ' · 820 g');
</script>

<div class="look">
  <p class="back"><a href="#/me"><ChevronLeft size={16} aria-hidden="true" />{t('Me|place')}</a></p>
  <PageHead title={t('Appearance')} text={t('Font, colours and size, only on this device. Everything is optional.')} />

  <div class="cols">
    <div class="sets">
      <!-- HG1c «Name ändern»: the name for the greeting on Today, first -->
      <NameSection />
      <section aria-labelledby="look-font">
        <h2 id="look-font">{t('Font')}</h2>
        <p class="note">{t('Applies to the whole app')}</p>
        <div class="opts" role="group" aria-labelledby="look-font">
          {#each fonts as f (f.key)}
            <button type="button" class="opt" data-key={f.key} aria-pressed={theme.font === f.key} style:font-family={f.family} onclick={() => setFont(f.key)}>
              <span class="nm">{f.name}<small>{sample}</small></span>
              {#if theme.font === f.key}<Check size={20} aria-hidden="true" />{/if}
            </button>
          {/each}
        </div>
        {#if fonts.length < FONTS.length}
          <button type="button" class="more" onclick={() => (allFonts = true)}>{t('All {n} fonts', { n: FONTS.length })}<ChevronRight size={16} aria-hidden="true" /></button>
        {/if}
      </section>

      <section aria-labelledby="look-pal">
        <h2 id="look-pal">{t('Colour world')}</h2>
        <p class="note">{t('Sage is new; the earlier ones stay')}</p>
        <div class="opts" role="group" aria-labelledby="look-pal">
          {#each PALETTES as p (p.key)}
            <button type="button" class="opt pal" data-key={p.key} aria-pressed={theme.palette === p.key} onclick={() => setPalette(p.key)}>
              <span class="dots" aria-hidden="true">{#each p.swatches as c, i (i)}<span class="dot" style:background={c}></span>{/each}</span>
              <span class="nm">{t(p.name)}</span>
              {#if theme.palette === p.key}<Check size={20} aria-hidden="true" />{/if}
            </button>
          {/each}
        </div>
      </section>

      <section aria-labelledby="look-size">
        <h2 id="look-size">{t('Text size and light')}</h2>
        <p class="note">{t('Large helps on the way')}</p>
        <div class="segs">
          <Seg label={t('Text size')} value={theme.size} options={SIZES.map((z) => ({ key: z.key, name: t(z.name) }))} onchange={setSize} />
          <Seg label={t('Light or dark')} value={theme.mode} options={MODES.map((m) => ({ key: m.key, name: t(m.name) }))} onchange={setMode} />
        </div>
      </section>

      <LinksOff />
    </div>

    <!-- a picture of the choice, not a working page: hidden from screen readers and from the keyboard -->
    <aside class="pv" aria-hidden="true" inert>
      <p class="pvh">{t('Preview')}</p>
      <div class="pvbox">
        <div class="pvtabs"><span class="on">{t('All')}</span><span>{t('Clothes')}</span><span>{t('Building blocks')}</span></div>
        <p class="pvt">{t('Gear|place')}</p>
        <p class="pvs num">{t('{n} items', { n: 184 })} · 92.4 kg</p>
        <div class="pvlist">
          <div class="pvrow"><span class="box"></span><span>{t('Down sleeping bag 700')}</span><span class="num">820 g</span></div>
          <div class="pvrow"><span class="box"></span><span>{t('Sleeping mat R4')}</span><span class="num">410 g</span></div>
          <div class="pvrow"><span class="box"></span><span>{t('Gas canister')}</span><span class="tag hi">{t('weigh|todo')}</span></div>
        </div>
        <div class="pvcard">
          <p class="pvs">{t('Jura loop · {a} of {b} packed', { a: 18, b: 24 })}</p>
          <span class="bar"><span></span></span>
          <span class="tags"><span class="tag ok">{t('ready|state')}</span><span class="tag warn">{t('due soon|state')}</span><span class="tag">{t('new|state')}</span></span>
        </div>
        <span class="pvbtn main">{t('Keep packing')}</span>
        <span class="pvbtn">{t('Getting there')}</span>
      </div>
    </aside>
  </div>
</div>

<style>
  .look {
    max-width: 1080px;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--ink-2);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .cols {
    display: grid;
    gap: var(--sp-6);
  }
  .sets {
    display: grid;
    gap: var(--sp-6);
    max-width: 560px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .note {
    margin: 2px 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .opts {
    display: grid;
    gap: var(--sp-2);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    min-height: 52px;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-body);
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .opt.pal {
    font-family: var(--font-body);
    font-weight: 400;
  }
  .opt[aria-pressed='true'] {
    border: 2px solid var(--ink);
    padding: calc(var(--sp-3) - 1px) calc(var(--sp-4) - 1px);
  }
  .opt:hover {
    border-color: var(--line-strong);
  }
  .opt[aria-pressed='true']:hover {
    border-color: var(--ink);
  }
  .nm {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .dots {
    display: inline-flex;
    flex: none;
    gap: 4px;
  }
  .dot {
    width: 22px;
    height: 22px;
    border: 1px solid var(--line);
    border-radius: 50%;
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    margin-top: var(--sp-1);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .segs {
    display: grid;
    gap: var(--sp-3);
  }

  /* The preview: only where there is room next to the choices (a phone sees the whole app change). */
  .pv {
    display: none;
  }
  @media (min-width: 1100px) {
    .cols {
      grid-template-columns: minmax(0, 560px) minmax(0, 1fr);
      align-items: start;
    }
    .pv {
      display: block;
      position: sticky;
      top: var(--sp-4);
    }
  }
  .pvh {
    margin: var(--sp-2) 0 var(--sp-3);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .pvbox {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--ground);
    box-shadow: var(--card-shadow);
  }
  .pvtabs {
    display: flex;
    gap: var(--sp-3);
    padding-bottom: var(--sp-1);
    border-bottom: 1px solid var(--line);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pvtabs .on {
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
  }
  .pvt {
    margin: var(--sp-2) 0 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .pvs {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .pvlist,
  .pvcard {
    border: 1px solid var(--card-line);
    border-radius: 12px;
    background: var(--paper);
  }
  .pvrow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
    font-size: var(--fs-small);
  }
  .pvrow + .pvrow {
    border-top: 1px solid var(--line);
  }
  .pvrow > span:nth-child(2) {
    flex: 1;
  }
  .box {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: var(--paper-2);
  }
  .pvcard {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
  }
  .bar span {
    display: block;
    width: 75%;
    height: 100%;
    border-radius: 3px;
    background: var(--hi);
  }
  .tags {
    display: flex;
    gap: var(--sp-1);
  }
  .tag {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.5 var(--font-body);
  }
  .tag.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .tag.warn,
  .tag.hi {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .pvbtn {
    display: block;
    padding: var(--sp-2);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.4 var(--font-body);
    text-align: center;
  }
  .pvbtn.main {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
  }
</style>
