<script>
  /**
   * «Mehr selbst einstellen» (Noah 15.10.2026 «bauen», ideas IS 254–256 and 258): Ich › Eigene Werte
   * (#/me/werte). The numbers that were fixed in the code, in five sections Packen, Velo, Heute, Daten,
   * Vorschläge: each with a short reason, its standard («Standard: 14 Tage») and «Auf Standard zurück».
   * One settings record (ownvalues.js OWN_KEY), on this device and in the backup; App.svelte makes it
   * live for every page (ownlive.svelte.js). Everything is a suggestion: nothing must be set.
   * Velo: the care per part and per bike is already its own card (v0.144.0 «Pflege für …»), so the page
   * links there. Vorschläge: the switches that exist (tips on all pages, knowledge and fun), the rest
   * as links to where it is switched.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { putSetting } from '../lib/flowdb.js';
  import { OWN_KEY, OWN_FIELDS, normOwn, setOwn, clampOwn } from '../lib/ownvalues.js';
  import { pageInfo } from '../lib/pageinfo/store.svelte.js';
  import { setTipsOn, setKnowOn } from '../lib/pageinfo.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import { Minus, Plus, Undo2, ChevronRight, Package, Bike, Sun, Database, Lightbulb, Wrench, Info, LayoutGrid, Activity } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const q = liveQuery(() => db.settings.get(OWN_KEY));
  const raw = $derived($q?.value ?? null);
  const vals = $derived(normOwn(raw));
  const pi = pageInfo();

  const SECTIONS = [
    { key: 'pack', name: 'Pack|stage', icon: Package },
    { key: 'bike', name: 'Bike', icon: Bike },
    { key: 'today', name: 'Today', icon: Sun },
    { key: 'data', name: 'Data', icon: Database },
  ];
  const fieldsOf = (area) => OWN_FIELDS.filter((f) => f.area === area);

  // the value in words: «2 Tage», «1000 km», «10 °C»
  const say = (f, v) => (f.unit === 'days' ? tn(v, '{n} day', '{n} days') : f.unit === 'km' ? t('{km} km', { km: num(v) }) : t('{n} °C', { n: v }));

  // what is typed but not yet saved, per field (saved on change, Enter or leaving the field)
  let typed = $state({});
  const save = (key, value) => putSetting(db, OWN_KEY, ((next) => (Object.keys(next).length ? next : null))(setOwn(raw, key, value)));
  function commit(f) {
    const text = typed[f.key];
    delete typed[f.key];
    if (text == null) return;
    const v = clampOwn(f.key, text);
    if (v != null && v !== vals[f.key]) save(f.key, v);
  }
  const step = (f, dir) => save(f.key, Math.min(f.max, Math.max(f.min, vals[f.key] + dir * f.step)));
</script>

<div class="ew ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Own values')} sub={t('The numbers the app works with. Change them as you like; each one can go back to the Standard.')} />

  <div class="ew-grid">
    {#each SECTIONS as s (s.key)}
      {@const I = s.icon}
      <section class="ich-sec card ew-box" aria-labelledby="ew-{s.key}-h" data-own-sec={s.key}>
        <h2 id="ew-{s.key}-h"><I size={18} aria-hidden="true" />{t(s.name)}</h2>
        <ul class="ich-list">
          {#each fieldsOf(s.key) as f (f.key)}
            {@const v = vals[f.key]}
            <li class="ew-row" data-own={f.key}>
              <div class="ew-top">
                <span class="ich-m"><b id="ew-{f.key}">{t(f.name)}</b><small>{t(f.why)}</small></span>
                <span class="ew-ctl" role="group" aria-labelledby="ew-{f.key}">
                  <button type="button" class="ew-step" aria-label={t('Less: {name}', { name: t(f.name) })} disabled={v <= f.min} onclick={() => step(f, -1)}><Minus size={18} aria-hidden="true" /></button>
                  <input
                    class="inp num ew-in"
                    type="text"
                    inputmode={f.min < 0 ? 'text' : 'numeric'}
                    aria-label={t(f.name)}
                    value={typed[f.key] ?? String(v)}
                    oninput={(e) => (typed[f.key] = e.currentTarget.value)}
                    onchange={() => commit(f)}
                    onkeydown={(e) => e.key === 'Enter' && commit(f)}
                  />
                  <span class="ew-unit">{f.unit === 'days' ? tn(v, 'day', 'days') : f.unit}</span>
                  <button type="button" class="ew-step" aria-label={t('More: {name}', { name: t(f.name) })} disabled={v >= f.max} onclick={() => step(f, 1)}><Plus size={18} aria-hidden="true" /></button>
                </span>
              </div>
              <p class="ew-std">
                <span>{t('Standard: {value}', { value: say(f, f.std) })}</span>
                {#if v !== f.std}<span class="ew-mine">{t('Adapted')}</span><button type="button" class="ew-reset" data-own-reset={f.key} onclick={() => save(f.key, null)}><Undo2 size={15} aria-hidden="true" />{t('Back to Standard|value')}</button>{/if}
              </p>
            </li>
          {/each}
          {#if s.key === 'bike'}
            <li>
              <!-- IS 256: the care per part and per bike is already its own card (v0.144.0 RE) -->
              <a class="ich-row" href="#/bikes?tab=care">
                <span class="ich-ib"><Wrench size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t('Care per part')}</b><small>{t('Wax the chain, fork service, sealant: under Bikes › Care › «Care for …», per bike')}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            </li>
          {/if}
          {#if s.key === 'today'}
            <li>
              <a class="ich-row" href="#/">
                <span class="ich-ib"><LayoutGrid size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{t('Tiles on Today')}</b><small>{t('Show, hide and order them: hold a tile on Today')}</small></span>
                <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
              </a>
            </li>
          {/if}
        </ul>
      </section>
    {/each}

    <section class="ich-sec card ew-box" aria-labelledby="ew-sugg-h" data-own-sec="suggest">
      <h2 id="ew-sugg-h"><Lightbulb size={18} aria-hidden="true" />{t('Suggestions')}</h2>
      <ul class="ich-list">
        <li class="ew-row">
          <div class="ew-top">
            <span class="ich-m"><b id="ew-tips">{t('Tips on all pages')}</b><small>{t('One tip a day under the page title. Off: no tip line any more.')}</small></span>
            <label class="ew-sw"><input type="checkbox" role="switch" data-own-tips aria-labelledby="ew-tips" checked={pi.info.tipsOn} onchange={(e) => ((on) => pi.save((v) => setTipsOn(v, on)))(e.currentTarget.checked)} /></label>
          </div>
        </li>
        <li class="ew-row">
          <div class="ew-top">
            <span class="ich-m"><b id="ew-know">{t('Also knowledge and fun')}</b><small>{t('Off: only useful tips, no «Did you know».')}</small></span>
            <label class="ew-sw"><input type="checkbox" role="switch" data-own-know aria-labelledby="ew-know" checked={pi.info.knowOn} onchange={(e) => ((on) => pi.save((v) => setKnowOn(v, on)))(e.currentTarget.checked)} /></label>
          </div>
        </li>
        <li>
          <a class="ich-row" href="#/flow/activity">
            <span class="ich-ib"><Activity size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{t('Ideas for activities')}</b><small>{t('Hide single ideas under Aktiv › Activity')}</small></span>
            <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>
  </div>
  <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('Only on this device and in the backup. Nothing here is mandatory.')}</span></p>
</div>

<style>
  .ew {
    max-width: 1100px;
  }
  .ew-grid {
    display: grid;
    gap: 0 20px;
  }
  @media (min-width: 900px) {
    .ew-grid {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
  .ew-box {
    padding: 14px 4px 6px;
  }
  .ew-box h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 16px 4px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .ew-row {
    padding: 12px 0;
  }
  .ew-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .ew-ctl {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ew-step {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ew-step:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .ew-in {
    width: 4.5em;
    min-height: 44px;
    text-align: center;
  }
  .ew-unit {
    min-width: 2.6em;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ew-std {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ew-mine {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .ew-reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .ew-sw {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: auto;
  }
  .ew-sw input {
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--hi);
  }
</style>
