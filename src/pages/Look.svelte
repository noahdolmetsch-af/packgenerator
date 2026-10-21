<script>
  import Crumbs from '../lib/ui/Crumbs.svelte'; // P3b I2a: the full path back
  /**
   * v0.97.0 Design-Refresh R1 «Darstellung» (G1 neu, Noah 11.10 23:10 «Runde 1 alles ★ und G1–G12
   * freigegeben»; 12.10 «1a 2a»): Ich › Darstellung (#/me/look). The font of the whole app (8, four
   * shown, «All 8 fonts» opens the rest), the colour world (Salbei new, the earlier ones stay), the text
   * size and light or dark. Everything only on this device and a suggestion: any choice can be changed
   * back. On a computer a small preview of the Material page shows the choice at once.
   * Impeccable Runde 2: «Open the app at» has a visible name and line («What you see first after opening»);
   * «Handling» says what it holds (start, keyboard shortcuts, night quiet, vibration); «Links to other sites»
   * shows only while a link is switched off (LinksOff).
   */
  import { t } from '../lib/i18n.svelte.js';
  import { theme, FONTS, PALETTES, MODES, SCALE_MIN, SCALE_MAX, SCALE_STEP, DEFAULT_SCALE, setFont, setPalette, setScale, setDense, setMode } from '../lib/theme.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import LinksOff from '../lib/sk/LinksOff.svelte'; // SK: switched-off outside links come back here
  import Seg from '../lib/ui/Seg.svelte';
  import { ChevronRight, Check, Minus, Plus } from '@lucide/svelte';
  import NameSection from '../lib/home/NameSection.svelte'; // HG1c «Dein Name», the first section
  import { OPS, START_PLACES } from '../lib/bedienung.js';
  import { ops, setOp, setStart } from '../lib/bedienung.svelte.js';
  import { SUGGEST_AREAS } from '../lib/clear/suggest.js';
  import { suggest, setArea, watchSuggest } from '../lib/clear/suggest.svelte.js';
  watchSuggest();
  import { glove, setGlove } from '../lib/unterwegs/handschuh.svelte.js';
  import { MODES as GLOVE_MODES } from '../lib/unterwegs/handschuh.js';
  import DictSettings from '../lib/ui/DictSettings.svelte'; // «Diktat und Fragen» (Noah 19.10.2026)
  import LookSection from '../lib/anpassen/LookSection.svelte'; // «Anpassen» (Noah 20.10.2026): Seiten und Menü
  import LocalAiSettings from '../lib/localai/LocalAiSettings.svelte'; // «KI im Gerät» (Noah 20.10.2026)

  const FIRST = 4;
  let allFonts = $state(false);
  // the chosen font is always in sight, also when it is one of the last four
  const fonts = $derived(allFonts || FONTS.findIndex((f) => f.key === theme.font) >= FIRST ? FONTS : FONTS.slice(0, FIRST));
  const sample = $derived(t('Down sleeping bag 700') + ' · 820 g');
  // «Grösse» (Noah 19.10.2026 «1b»): the slider shows the number while it moves and zooms the app when let go,
  // so the slider does not jump away under the finger
  let draft = $state(null);
  const shown = $derived(draft ?? theme.scale);
  const commit = (v) => {
    draft = null;
    setScale(v);
  };
</script>

<div class="look">
  <Crumbs crumbs={[{ label: t('Me|place'), href: '#/me' }]} here={t('Appearance')} />
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

      <section aria-labelledby="look-size" data-size-set>
        <h2 id="look-size">{t('Size and light')}</h2>
        <p class="note">{t('Text, tiles and buttons together, everywhere in the app. Each device keeps its own size.')}</p>
        <div class="scale">
          <p class="oplbl"><b id="look-scale">{t('Size|scale')}</b><output for="look-scale-in" data-scale-shown>{shown} %</output></p>
          <div class="scrow">
            <button type="button" class="scb" aria-label={t('Smaller')} disabled={theme.scale <= SCALE_MIN} onclick={() => commit(theme.scale - SCALE_STEP)}><Minus size={18} aria-hidden="true" /></button>
            <input id="look-scale-in" type="range" aria-labelledby="look-scale" aria-valuetext="{shown} %" min={SCALE_MIN} max={SCALE_MAX} step={SCALE_STEP} value={shown} oninput={(e) => (draft = +e.currentTarget.value)} onchange={(e) => commit(+e.currentTarget.value)} />
            <button type="button" class="scb" aria-label={t('Larger')} disabled={theme.scale >= SCALE_MAX} onclick={() => commit(theme.scale + SCALE_STEP)}><Plus size={18} aria-hidden="true" /></button>
          </div>
          <p class="scends"><span>{SCALE_MIN} %</span>{#if theme.scale !== DEFAULT_SCALE}<button type="button" class="back100" onclick={() => commit(DEFAULT_SCALE)}>{t('Back to {n} %', { n: DEFAULT_SCALE })}</button>{/if}<span>{SCALE_MAX} %</span></p>
        </div>
        <ul class="ops">
          <li>
            <label class="op">
              <span class="nm"><span>{t('Compact|size')}</span><small>{t('Same text, less space between, so more fits on the screen')}</small></span>
              <input type="checkbox" role="switch" class="opsw" data-dense-switch checked={theme.dense} onchange={(e) => setDense(e.currentTarget.checked)} />
            </label>
          </li>
        </ul>
        <div class="segs light">
          <Seg label={t('Light or dark')} value={theme.mode} options={MODES.map((m) => ({ key: m.key, name: t(m.name) }))} onchange={setMode} />
        </div>
      </section>

      <LinksOff />
      <!-- Bedienung (Noah 13.10.2026 23:52 and 23:56, without mockup): small helps, each one can be switched off -->
      <section aria-labelledby="look-ops" data-ops>
        <h2 id="look-ops">{t('Handling')}</h2>
        <p class="note">{t('Start, keyboard shortcuts, night quiet, vibration')}</p>
        <div class="startrow">
          <p class="oplbl"><b id="look-start">{t('Open the app at')}</b><small>{t('What you see first after opening')}</small></p>
          <Seg labelledby="look-start" value={ops.start} options={START_PLACES.map((p) => ({ key: p.key, name: t(p.name) }))} onchange={setStart} />
        </div>
        <div class="startrow">
          <!-- Paket K #285 «Handschuh-Modus» (Noah 19.10.2026 «4a und kann manuell geändert werden») -->
          <p class="oplbl"><b id="look-glove">{t('Glove mode')}</b></p>
          <Seg labelledby="look-glove" value={glove.mode} options={GLOVE_MODES.map((g) => ({ key: g.key, name: t(g.name) }))} onchange={setGlove} />
        </div>
        <ul class="ops">
          {#each OPS as o (o.key)}
            <li>
              <label class="op">
                <span class="nm"><span>{t(o.name)}</span><small>{t(o.text)}</small></span>
                <input type="checkbox" role="switch" class="opsw" data-op={o.key} checked={ops[o.key]} onchange={(e) => setOp(o.key, e.currentTarget.checked)} />
              </label>
            </li>
          {/each}
        </ul>
        {#if ops.speak}<DictSettings />{/if}
        <LocalAiSettings />
      </section>
      <!-- Paket Q #361: every area where the app suggests by itself can be switched off (all on at the start) -->
      <section aria-labelledby="look-sugg" data-suggest-areas>
        <h2 id="look-sugg">{t('Suggestions')}</h2>
        <p class="note">{t('What the app suggests by itself; switch off what you do not want. Saved with your data.')}</p>
        <ul class="ops">
          {#each SUGGEST_AREAS as a (a.key)}
            <li>
              <label class="op">
                <span class="nm"><span>{t(a.label)}</span><small>{t(a.text)}</small></span>
                <input type="checkbox" role="switch" class="opsw" data-suggest={a.key} checked={suggest.on[a.key]} onchange={(e) => setArea(a.key, e.currentTarget.checked)} />
              </label>
            </li>
          {/each}
        </ul>
      </section>
      <!-- «Anpassen» (Noah 20.10.2026 «1a 2a 5a»): the menu and every page you changed -->
      <LookSection />
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
  .scale {
    display: grid;
    gap: var(--sp-2);
  }
  .scale .oplbl {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .scale output {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .scrow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .scrow input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    accent-color: var(--brand);
  }
  .scb {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    border: 1px solid var(--card-line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .scb:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .back100 {
    min-height: 44px;
    padding: 0 var(--sp-2);
    border: 0;
    background: none;
    color: var(--ink);
    font: 400 var(--fs-small) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .segs.light {
    margin-top: var(--sp-4);
  }
  .scends {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .startrow {
    display: grid;
    gap: var(--sp-2);
  }
  .oplbl {
    display: grid;
    gap: 2px;
    margin: 0;
  }
  .oplbl b {
    font-weight: 600;
  }
  .oplbl small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ops {
    display: grid;
    gap: var(--sp-2);
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
  }
  .op {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 52px;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--card-line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-body);
    font-weight: 600;
    cursor: pointer;
  }
  .opsw {
    appearance: none;
    flex: none;
    position: relative;
    width: 44px;
    height: 26px;
    margin: 0;
    border-radius: 999px;
    background: var(--line-strong);
    cursor: pointer;
    transition: background 0.15s;
  }
  .opsw::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: transform 0.15s;
  }
  .opsw:checked {
    background: var(--hi);
  }
  .opsw:checked::after {
    transform: translateX(18px);
  }
  .opsw:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
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
