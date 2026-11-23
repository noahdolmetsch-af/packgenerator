<script>
  /**
   * «Kursblick» Meine Zahlen (Noah 22.11.2026 «alles davon», Bauplan K12 bis K14): what the person owns, with profit or loss
   * («Mein Bestand»), and the numbers they wait for («Ziele»). modus 'voll': the tab «My numbers» (#/kurse/bestand) with both
   * lists, adding, changing, moving and deleting (with Undo); modus 'heute': only the short cards for the Today view, and only
   * when there is something. The goals are checked here, when Kursblick opens (no message while it is closed).
   *
   * PRIVATE: both lists live in settings (`kurse.bestand`, `kurse.ziele`), on the devices, in the backup file and sealed in the
   * sync; the price server only hears the symbols of titles. No advice: only numbers.
   * reihen: what the page has loaded (gold, usdchf, smi).
   */
  import { onMount, untrack } from 'svelte';
  import { Plus, Wallet, Target, ArrowUp, ArrowDown, Pencil, Trash2, Check } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import PostenSheet from './PostenSheet.svelte';
  import ZielSheet from './ZielSheet.svelte';
  import { meldung } from './meldungen.js';
  import { BESTAND_KEY, lies as liesB, neuerPosten, aenderePosten, loeschePosten, schiebePosten, neuesEreignis, loescheEreignis, postenName, POSTEN_ARTEN, mengeJetzt } from './bestand.js';
  import { reihenId } from './maerkte.js';
  import { ZIELE_KEY, lies as liesZ, neuesZiel, aendereZiel, loescheZiel, schiebeZiel, pruefe } from './ziele.js';
  import { ladeFehlende, bewerteAlle, zielKontext, zielJetzt } from './stand.js';
  import { zahl, anzahl, vorzeichen, tagKurz } from './format.js';

  let { modus = 'voll', reihen = {} } = $props();

  const MITDIV_KEY = 'kurse.mitdividenden';
  let best = $state.raw(liesB(null));
  let zl = $state.raw(liesZ(null));
  let mitDiv = $state(false);
  let geladen = $state(false);
  let extra = $state.raw({});
  let postenEdit = $state.raw(null); // { posten } to change, { neu: true } to add
  let zielEdit = $state.raw(null);

  const basis = $derived({ ...extra, ...reihen });
  const rechnung = $derived(bewerteAlle(best, basis));
  const ctx = $derived(zielKontext(best, zl, basis));
  const stand = $derived(reihen.gold?.last?.day ?? Object.values(basis).find((a) => a?.last)?.last?.day ?? '');
  const s = $derived(rechnung.summe);
  const gewinn = $derived(mitDiv ? s.mitDiv.gewinn : s.gewinn);
  const gewinnPct = $derived(mitDiv ? s.mitDiv.pct : s.pct);
  const tone = (v) => (!v ? '' : v > 0 ? 'up' : 'down');
  const chf = (v, dec = 0) => `CHF ${zahl(v, dec)}`;
  const pctText = (v) => (v == null ? '–' : `${vorzeichen(v, 1)} %`);

  async function persist(key, value) {
    await db.settings.put({ key, value: JSON.parse(JSON.stringify(value)) }).catch(() => {});
  }
  const saveBest = async (next) => ((best = next), persist(BESTAND_KEY, next));
  const saveZiele = async (next) => ((zl = next), persist(ZIELE_KEY, next));

  async function ladeExtra(force = false) {
    const next = await ladeFehlende(best, zl, basis, { force });
    extra = next;
  }
  onMount(async () => {
    try {
      best = liesB((await db.settings.get(BESTAND_KEY))?.value);
      zl = liesZ((await db.settings.get(ZIELE_KEY))?.value);
      mitDiv = (await db.settings.get(MITDIV_KEY))?.value === true;
    } catch {
      /* nothing saved: the empty lists */
    }
    geladen = true;
  });
  $effect(() => {
    // fetch what the lists need when they change or the page's own series arrive
    void best;
    void zl;
    void reihen;
    if (geladen) untrack(() => ladeExtra());
  });
  function setMitDiv(v) {
    mitDiv = v;
    persist(MITDIV_KEY, v);
  }

  // ---- positions
  async function savePosten(d) {
    const e = postenEdit;
    const prev = best;
    const r = e.posten ? aenderePosten(best, e.posten.id, d) : neuerPosten(best, d);
    if (r.error) return meldung(r.error);
    await saveBest(r.state);
    offerDone(e.posten ? t('Saved.') : t('Added to your holdings.'), () => saveBest(prev));
    return '';
  }
  const nameOf = (p) => postenName(p, basis[reihenId(p.symbol)]?.name ?? '', t);
  async function removePosten(p) {
    const name = nameOf(p);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this position goes from your holdings. You can undo this for a few seconds.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const prev = best;
        await saveBest(loeschePosten(best, p.id));
        return prev;
      },
      undo: (prev) => saveBest(prev),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  async function addEreignis(id, e) {
    const prev = best;
    const r = neuesEreignis(best, id, e);
    if (r.error) return meldung(r.error);
    await saveBest(r.state);
    offerDone(t('Saved.'), () => saveBest(prev));
    return '';
  }
  async function delEreignis(id, eid) {
    const prev = best;
    await saveBest(loescheEreignis(best, id, eid));
    offerDone(t('Deleted.'), () => saveBest(prev));
  }
  const livePosten = $derived(postenEdit?.posten ? best.posten.find((p) => p.id === postenEdit.posten.id) ?? postenEdit.posten : null);

  // ---- goals
  async function saveZiel(d) {
    const e = zielEdit;
    const prev = zl;
    const r = e.ziel ? aendereZiel(zl, e.ziel.id, d) : neuesZiel(zl, d);
    if (r.error) return meldung(r.error);
    await saveZiele(r.state);
    offerDone(e.ziel ? t('Saved.') : t('Goal added.'), () => saveZiele(prev));
    return '';
  }
  const zielName = (z) => z.name || (z.was === 'gold' ? t('Gold') : z.was === 'smi' ? t('SMI') : z.was === 'bestand' ? t('My holdings') : z.symbol);
  const zielZahl = (z, v) => (z.was === 'gold' ? t('CHF {v} per kg', { v: zahl(v, 0) }) : z.was === 'smi' ? t('{v} points', { v: zahl(v, 0) }) : z.was === 'bestand' ? chf(v) : zahl(v, v >= 1000 ? 0 : 2));
  const zielSatz = (z) => (z.richtung === 'unter' ? t('{what} at or below {v}', { what: zielName(z), v: zielZahl(z, z.wert) }) : t('{what} at or above {v}', { what: zielName(z), v: zielZahl(z, z.wert) }));
  async function removeZiel(z) {
    const name = zielName(z);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this goal goes. You can undo this for a few seconds.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const prev = zl;
        await saveZiele(loescheZiel(zl, z.id));
        return prev;
      },
      undo: (prev) => saveZiele(prev),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const pruefungen = $derived(zl.ziele.map((z) => ({ z, p: pruefe(z, zielJetzt(z, ctx)) })));
  const erreicht = $derived(pruefungen.filter((x) => x.p.erreicht).length);
  const GRUND = { preis: () => t('No price right now'), kurs: () => t('No exchange rate right now'), menge: () => t('Pieces missing') };
</script>

{#snippet zielZeile(z, p, kurz)}
  <li class="z-zeile" class:ok={p.erreicht} data-ziel={z.id}>
    <div class="z-text">
      <b>{zielSatz(z)}</b>
      {#if p.jetzt == null}
        <small class="muted">{t('No number right now')}</small>
      {:else if p.erreicht}
        <small class="reached" data-ziel-erreicht><Check size={14} aria-hidden="true" /> {t('Reached')}{' · '}{t('now {v}', { v: zielZahl(z, p.jetzt) })}</small>
      {:else}
        <small class="muted">{t('now {v}', { v: zielZahl(z, p.jetzt) })}{' · '}{t('still {a} ({p} %) away', { a: zielZahl(z, p.abstand), p: zahl(p.pct, 1) })}</small>
      {/if}
    </div>
    {#if !kurz}
      <MoreActions
        small
        title={zielName(z)}
        label={t('More for {what}', { what: zielName(z) })}
        actions={[
          { name: t('Change'), explain: t('what, number or direction'), icon: Pencil, run: () => (zielEdit = { ziel: z }) },
          ...(zl.ziele[0]?.id !== z.id ? [{ name: t('Up'), explain: t('one place up in the list'), icon: ArrowUp, run: () => saveZiele(schiebeZiel(zl, z.id, -1)) }] : []),
          ...(zl.ziele.at(-1)?.id !== z.id ? [{ name: t('Down'), explain: t('one place down in the list'), icon: ArrowDown, run: () => saveZiele(schiebeZiel(zl, z.id, 1)) }] : []),
          { name: t('Delete'), explain: t('only this goal goes'), icon: Trash2, run: () => removeZiel(z) },
        ]}
      />
    {/if}
  </li>
{/snippet}

{#if modus === 'heute'}
  {#if geladen && zl.ziele.length}
    <section class="card m-karte" data-ziele-heute>
      <h2>{t('Goals')}</h2>
      <ul class="m-liste">
        {#each pruefungen as { z, p } (z.id)}{@render zielZeile(z, p, true)}{/each}
      </ul>
      <p class="muted small"><a href="#/kurse/bestand">{t('All goals')}</a></p>
    </section>
  {/if}
  {#if geladen && best.posten.length && s.wert > 0}
    <section class="card m-karte" data-bestand-heute>
      <h2>{t('My holdings')}</h2>
      <p class="big num">{chf(s.wert)}</p>
      {#if s.einstand > 0}<p class="row"><span>{t('Profit or loss')}</span> <b class="num {tone(gewinn)}">{vorzeichen(gewinn, 0)} CHF · {pctText(gewinnPct)}</b></p>{/if}
      <p class="muted small"><a href="#/kurse/bestand">{t('Open My numbers')}</a></p>
    </section>
  {/if}
{:else}
  <div class="meins" data-meins>
    <section class="card m-karte" data-bestand aria-labelledby="mb-h">
      <h2 id="mb-h">{t('My holdings')}</h2>
      {#if !geladen}
        <p class="muted" role="status">{t('Fetching prices …')}</p>
      {:else if !best.posten.length}
        <Empty icon={Wallet} title={t('Nothing in your holdings yet')} text={t('Add what you own, a share, a fund, gold in grams or a value like your savings account, and Kursblick shows its value and profit or loss. It stays on your devices.')} action={{ label: t('Add to my holdings'), onclick: () => (postenEdit = { neu: true }) }} />
      {:else}
        <p class="big num" data-bestand-wert>{chf(s.wert)}</p>
        <p class="muted small">{t('Value at the close of {day}', { day: tagKurz(stand) })}{#if s.offen}{' · '}{tn(s.offen, '{n} position without a value', '{n} positions without a value')}{/if}</p>
        {#if s.einstand > 0}
          <p class="row"><span>{t('Profit or loss')}</span> <b class="num {tone(gewinn)}" data-bestand-gewinn>{vorzeichen(gewinn, 0)} CHF · {pctText(gewinnPct)}</b></p>
          <label class="m-div"><input type="checkbox" checked={mitDiv} onchange={(e) => setMitDiv(e.currentTarget.checked)} data-mit-dividenden /> {t('With dividends')}{#if s.dividenden > 0}{' '}<span class="muted small">({chf(s.dividenden)})</span>{/if}</label>
          {#if s.ohneEinstand}<p class="muted small">{tn(s.ohneEinstand, '{n} position has no price paid and is not in the profit.', '{n} positions have no price paid and are not in the profit.')}</p>{/if}
        {:else}
          <p class="muted small">{t('Add what a position cost to see profit or loss.')}</p>
        {/if}
        <ul class="m-liste">
          {#each rechnung.zeilen as { posten: p, b }, i (p.id)}
            {@const nm = nameOf(p)}
            <li class="b-zeile" data-posten={p.id}>
              <div class="b-name">
                <b>{nm}</b>
                <small class="muted">
                  {#if p.art === 'titel'}{anzahl(mengeJetzt(p), 4)}{' '}{t('pieces')}{' · '}{p.symbol}
                  {:else if p.art === 'gold'}{anzahl(mengeJetzt(p), 2)}{' '}{t('g')}
                  {:else if p.stand}{t('Value of {day}', { day: tagKurz(p.stand) })}
                  {:else}{t(POSTEN_ARTEN.find((a) => a.key === p.art).name)}{/if}
                </small>
              </div>
              <div class="b-wert">
                {#if b.wert != null}
                  <b class="num">{chf(b.wert)}</b>
                  {#if b.gewinn != null}<small class="num {tone(mitDiv ? b.mitDiv.gewinn : b.gewinn)}">{vorzeichen(mitDiv ? b.mitDiv.gewinn : b.gewinn, 0)} · {pctText(mitDiv ? b.mitDiv.pct : b.pct)}</small>{/if}
                {:else}
                  <small class="muted" data-posten-fehlt>{GRUND[b.grund]?.() ?? '–'}</small>
                {/if}
              </div>
              <MoreActions
                small
                title={nm}
                label={t('More for {what}', { what: nm })}
                actions={[
                  { name: t('Change'), explain: t('pieces, price paid, dividends and splits'), icon: Pencil, run: () => (postenEdit = { posten: p }) },
                  ...(i > 0 ? [{ name: t('Up'), explain: t('one place up in the list'), icon: ArrowUp, run: () => saveBest(schiebePosten(best, p.id, -1)) }] : []),
                  ...(i < best.posten.length - 1 ? [{ name: t('Down'), explain: t('one place down in the list'), icon: ArrowDown, run: () => saveBest(schiebePosten(best, p.id, 1)) }] : []),
                  { name: t('Delete'), explain: t('only this position goes'), icon: Trash2, run: () => removePosten(p) },
                ]}
              />
            </li>
          {/each}
        </ul>
        <div class="m-top"><button type="button" class="btn hi" onclick={() => (postenEdit = { neu: true })} data-posten-neu><Plus size={16} aria-hidden="true" /> {t('Add to my holdings')}</button></div>
      {/if}
    </section>

    <section class="card m-karte" data-ziele aria-labelledby="mz-h">
      <h2 id="mz-h">{t('Goals')}</h2>
      {#if !geladen}
        <p class="muted" role="status">…</p>
      {:else if !zl.ziele.length}
        <Empty icon={Target} title={t('No goals yet')} text={t('A goal is a number you wait for, for example gold at or above CHF 120 000 per kg. Kursblick checks it whenever you open it and shows it on Today.')} action={{ label: t('Add a goal'), onclick: () => (zielEdit = { neu: true }) }} />
      {:else}
        <p class="muted small">{erreicht ? tn(erreicht, '{n} goal reached', '{n} goals reached') : t('No goal reached yet.')}</p>
        <ul class="m-liste">
          {#each pruefungen as { z, p } (z.id)}{@render zielZeile(z, p, false)}{/each}
        </ul>
        <div class="m-top"><button type="button" class="btn hi" onclick={() => (zielEdit = { neu: true })} data-ziel-neu><Plus size={16} aria-hidden="true" /> {t('Add a goal')}</button></div>
      {/if}
    </section>

    <p class="muted small">{t('Only numbers, no advice. Your holdings and goals stay on your devices: they go into your backup file and, sealed, into the sync, never to the price service.')}</p>
  </div>
{/if}

{#if postenEdit}
  <PostenSheet posten={livePosten} onsave={savePosten} onevent={(e) => addEreignis(postenEdit.posten.id, e)} onevdel={(eid) => delEreignis(postenEdit.posten.id, eid)} onclose={() => (postenEdit = null)} />
{/if}
{#if zielEdit}
  <ZielSheet ziel={zielEdit.ziel ?? null} onsave={saveZiel} onclose={() => (zielEdit = null)} />
{/if}

<style>
  .meins {
    display: grid;
    gap: var(--sp-4);
  }
  .m-karte {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .m-karte h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .big {
    margin: 0;
    font-size: var(--fs-num);
    font-weight: 700;
    line-height: 1.1;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0;
    flex-wrap: wrap;
  }
  .m-div {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-small);
  }
  .m-div input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .m-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .m-liste {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .b-zeile {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .z-zeile {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .b-zeile:first-child,
  .z-zeile:first-child {
    border-top: 0;
  }
  .b-name,
  .b-wert,
  .z-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .b-name b,
  .z-text b {
    overflow-wrap: break-word;
  }
  .b-wert {
    text-align: right;
  }
  .reached {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ok);
    font-weight: 600;
  }
  .z-zeile.ok {
    background: var(--accent-soft);
    border-radius: var(--r-ctl);
    padding-inline: var(--sp-2);
  }
  .muted {
    margin: 0;
    color: var(--ink-2);
  }
  .small {
    font-size: var(--fs-small);
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
</style>
