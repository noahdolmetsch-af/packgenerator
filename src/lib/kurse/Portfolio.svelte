<script>
  /**
   * «Kursblick» Portfolio (Noah 23.11.2026 «kurskäufe und verkäufe loggen … fiktive käufe … digitaler twin meiner richtigen
   * portfolios», «ok freigabe»; PR 4 von 5): the journal. Portfolios (real ones, and any number of practice ones that are made up),
   * in each of them the buys, sales, dividends and splits one by one (day, pieces or grams, price, fee), the positions that follow
   * from them with the average price and the profit, and the way to take over what «My numbers» holds as an «opening» entry.
   *
   * PRIVATE: it all lives in the setting `kurse.journal` (src/lib/kurse/journal.js), on the devices, in the backup file and sealed
   * in the sync; the price server only hears the symbols of titles. A practice portfolio never counts for anything else. No advice:
   * only what the person wrote down and the prices of the day before. reihen: what the page has loaded (gold, usdchf, smi).
   */
  import { onMount, untrack } from 'svelte';
  import { Plus, Briefcase, Pencil, Trash2, ArrowUp, ArrowDown, Download } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import Seg from '../ui/Seg.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import DepotSheet from './DepotSheet.svelte';
  import EintragSheet from './EintragSheet.svelte';
  import Verteilung from './Verteilung.svelte';
  import { meldung } from './meldungen.js';
  import { BESTAND_KEY, lies as liesBestand } from './bestand.js';
  import {
    JOURNAL_KEY, GOLD, lies, neuesDepot, aendereDepot, loescheDepot, schiebeDepot, neuerEintrag, aendereEintrag, loescheEintrag, geordnet, rechne, bewerteRechnung, symbole, uebernehmen,
  } from './journal.js';
  import { ladeJournalPreise, ladeTitelReihe, preiseChf, schlussAm, titelText } from './preise.js';
  import { zahl, anzahl, vorzeichen, tagKurz } from './format.js';
  import { reihenId } from './maerkte.js';

  let { reihen = {}, goldChf = [] } = $props();

  let jr = $state.raw(lies(null));
  let best = $state.raw(liesBestand(null));
  let geladen = $state(false);
  let extra = $state.raw({});
  let gewaehlt = $state('');
  let depotEdit = $state.raw(null); // { depot } to change, { neu: true } to add
  let eintragEdit = $state.raw(null); // { eintrag } to change, { neu: true } to add
  let depotLoeschen = $state.raw(null);

  const basis = $derived({ ...extra, ...reihen });
  const depot = $derived(jr.depots.find((d) => d.id === gewaehlt) ?? jr.depots[0] ?? null);
  const rechnung = $derived(depot ? rechne(depot.eintraege) : null);
  const titel = $derived(depot ? Object.keys(rechnung.positionen) : []);
  const preise = $derived(preiseChf(titel, basis));
  const wert = $derived(rechnung ? bewerteRechnung(rechnung, preise) : null);
  const eintraege = $derived(depot ? geordnet(depot.eintraege).reverse() : []);
  // «My numbers» positions that are not in the journal yet (a position by hand has no pieces: nothing to take over)
  const alleEintraege = $derived(jr.depots.flatMap((d) => d.eintraege));
  const offen = $derived(best.posten.filter((p) => p.art !== 'hand' && !alleEintraege.some((e) => e.eroeffnung && e.quelle === p.id)));
  const vorschlaege = $derived([
    { key: GOLD, name: t('Gold') },
    ...[...new Set([...symbole(jr), ...best.posten.filter((p) => p.art === 'titel').map((p) => p.symbol)])].map((s) => ({ key: s, name: titelText(s, basis, t) })),
  ]);

  const chf = (v, dec = 0) => `CHF ${zahl(v, dec)}`;
  const tone = (v) => (!v ? '' : v > 0 ? 'up' : 'down');
  const pctText = (v) => (v == null ? '–' : `${vorzeichen(v, 1)} %`);
  const nameOf = (k) => titelText(k, basis, t);
  const einheit = (k) => (k === GOLD ? t('g') : t('pieces'));
  const ART = { kauf: 'Buy', verkauf: 'Sale', dividende: 'Dividend', split: 'Split' };

  async function persist(next) {
    jr = next;
    await db.settings.put({ key: JOURNAL_KEY, value: JSON.parse(JSON.stringify(next)) }).catch(() => {});
  }
  onMount(async () => {
    try {
      jr = lies((await db.settings.get(JOURNAL_KEY))?.value);
      best = liesBestand((await db.settings.get(BESTAND_KEY))?.value);
    } catch {
      /* nothing saved: no portfolio yet */
    }
    geladen = true;
  });
  $effect(() => {
    // fetch the prices of the titles the entries ask for, when they change or the page's own series arrive
    void jr;
    void reihen;
    if (geladen) untrack(async () => (extra = await ladeJournalPreise(jr, basis)));
  });

  // ---- portfolios
  async function saveDepot(d) {
    const e = depotEdit;
    const prev = jr;
    const r = e.depot ? aendereDepot(jr, e.depot.id, d) : neuesDepot(jr, d);
    if (r.error) return meldung(r.error);
    await persist(r.state);
    if (!e.depot) gewaehlt = r.depot.id;
    offerDone(e.depot ? t('Saved.') : t('Portfolio added.'), () => persist(prev));
    return '';
  }
  function frageDepotLoeschen(d) {
    depotLoeschen = d;
  }
  async function loescheDepotMit(d, to) {
    const prev = jr;
    const name = d.name;
    await persist(loescheDepot(jr, d.id, to ?? ''));
    gewaehlt = to ?? '';
    offerDone(t('"{name}" deleted.', { name }), () => persist(prev));
  }

  // ---- entries
  // the close of a title on a day (the series of the title and its rate are fetched when missing)
  async function kursAm(key, tag) {
    let b = basis;
    if (key !== GOLD && !b[reihenId(key)]) {
      b = await ladeTitelReihe(key, b);
      extra = { ...extra, ...b };
    }
    return schlussAm(key, tag, b);
  }
  const zuvielText = (gehalten) => t('You hold {n} at that day, so this sale is too big. Write the buy first, or a smaller amount.', { n: anzahl(gehalten, 4) });
  async function saveEintrag(d) {
    const e = eintragEdit;
    const prev = jr;
    const r = e.eintrag ? aendereEintrag(jr, depot.id, e.eintrag.id, d) : neuerEintrag(jr, depot.id, d);
    if (r.error === 'zuviel') return zuvielText(r.gehalten);
    if (r.error) return meldung(r.error);
    await persist(r.state);
    offerDone(e.eintrag ? t('Saved.') : t('Written down.'), () => persist(prev));
    return '';
  }
  async function removeEintrag(e) {
    const name = `${t(ART[e.art])} · ${tagKurz(e.tag)}`;
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this entry goes. You can undo this for a few seconds.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const prev = jr;
        await persist(loescheEintrag(jr, depot.id, e.id));
        return prev;
      },
      undo: (prev) => persist(prev),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }

  // ---- take over «My numbers»
  async function uebernimm() {
    const prev = jr;
    const r = uebernehmen(jr, best, localDay(), { depotId: depot?.art === 'echt' ? depot.id : '', name: t('My portfolio') });
    if (!r.neu) return offerDone(t('There was nothing new to take over.'));
    await persist(r.state);
    gewaehlt = r.depotId;
    offerDone(t('Taken over: {n} entries. «My numbers» stays as it was.', { n: r.neu }), () => persist(prev));
  }

  const eintragText = (e) => {
    if (e.art === 'dividende') return chf(e.betrag, 2);
    if (e.art === 'split') return t('pieces × {f}', { f: anzahl(e.faktor, 6) });
    return `${anzahl(e.menge, 4)} ${einheit(e.titel)} × ${chf(e.preis, 2)}${e.gebuehr ? ` · ${t('fee {f}', { f: chf(e.gebuehr, 2) })}` : ''}`;
  };
</script>

{#snippet uebernahme()}
  {#if offen.length}
    <section class="card p-karte" data-uebernahme>
      <h2>{t('Your holdings from «My numbers»')}</h2>
      <p class="muted">{tn(offen.length, '{n} position can be taken over as an «opening» entry.', '{n} positions can be taken over as «opening» entries.')}</p>
      <p class="muted small">{t('«My numbers» stays as it is. You can undo the takeover for a few seconds.')}</p>
      <button type="button" class="btn" onclick={uebernimm} data-uebernehmen><Download size={16} aria-hidden="true" /> {t('Take over')}</button>
    </section>
  {/if}
{/snippet}

{#if !geladen}
  <p class="muted" role="status">{t('Loading …')}</p>
{:else if !depot}
  <Empty
    icon={Briefcase}
    title={t('No portfolio yet')}
    text={t('Write down your buys and sales and Kursblick follows them: value, average price and profit. You can also make up a practice portfolio to follow what would have happened.')}
    action={{ label: t('Add a portfolio'), onclick: () => (depotEdit = { neu: true }) }}
  />
  {@render uebernahme()}
{:else}
  <div class="p-depots" data-depots>
    <Seg label={t('Portfolio')} value={depot.id} options={jr.depots.map((d) => ({ key: d.id, name: d.art === 'uebung' ? `${d.name} · ${t('Practice')}` : d.name }))} onchange={(k) => (gewaehlt = k)} />
    <button type="button" class="btn" onclick={() => (depotEdit = { neu: true })} data-depot-neu><Plus size={16} aria-hidden="true" /> {t('Portfolio')}</button>
  </div>

  <section class="card p-karte" data-depot={depot.id}>
    <div class="p-kopf">
      <h2>{depot.name}{#if depot.art === 'uebung'}{' '}<small class="badge" data-uebung>{t('Practice')}</small>{/if}</h2>
      <MoreActions
        small
        title={depot.name}
        label={t('More for {what}', { what: depot.name })}
        actions={[
          { name: t('Change'), explain: t('name or kind'), icon: Pencil, run: () => (depotEdit = { depot }) },
          ...(jr.depots[0]?.id !== depot.id ? [{ name: t('Up'), explain: t('one place up in the list'), icon: ArrowUp, run: () => persist(schiebeDepot(jr, depot.id, -1)) }] : []),
          ...(jr.depots.at(-1)?.id !== depot.id ? [{ name: t('Down'), explain: t('one place down in the list'), icon: ArrowDown, run: () => persist(schiebeDepot(jr, depot.id, 1)) }] : []),
          { name: t('Delete'), explain: t('asks where the entries go'), icon: Trash2, run: () => frageDepotLoeschen(depot) },
        ]}
      />
    </div>
    {#if depot.art === 'uebung'}<p class="muted small">{t('This portfolio is made up: it never counts for your whole picture, your goals or your rules.')}</p>{/if}

    {#if !depot.eintraege.length}
      <p class="muted" data-depot-leer>{t('Nothing written down here yet. Write down a buy and the value and the profit show.')}</p>
    {:else}
      <p class="big num" data-wert>{wert.fehlt.length ? '–' : chf(wert.wert)}</p>
      <dl class="rech">
        <div><dt>{t('Paid in total')}</dt><dd class="num">{chf(wert.eingesetzt)}</dd></div>
        {#if wert.erloes}<div><dt>{t('Received from sales')}</dt><dd class="num">{chf(wert.erloes)}</dd></div>{/if}
        {#if wert.dividenden}<div><dt>{t('Dividends')}</dt><dd class="num">{chf(wert.dividenden)}</dd></div>{/if}
        {#if wert.realisiert}<div><dt>{t('Profit from sales')}</dt><dd class="num {tone(wert.realisiert)}">{vorzeichen(wert.realisiert, 0)} CHF</dd></div>{/if}
        <div class="sum"><dt>{t('Profit or loss')}</dt><dd class="num {tone(wert.gesamt)}" data-gesamt>{wert.gesamt == null ? '–' : `${vorzeichen(wert.gesamt, 0)} CHF · ${pctText(wert.gesamtPct)}`}</dd></div>
      </dl>
      {#if wert.fehlt.length}<p class="muted small" data-preis-fehlt>{t('No price right now for {what}: the value and the profit wait for it.', { what: wert.fehlt.map(nameOf).join(', ') })}</p>{/if}
    {/if}
  </section>

  {#if wert?.positionen.length}
    <section class="card p-karte" data-positionen>
      <h2>{t('Positions')}</h2>
      <ul class="j-liste">
        {#each wert.positionen as p (p.titel)}
          <li class="j-zeile" data-position={p.titel}>
            <div class="j-text">
              <b>{nameOf(p.titel)}</b>
              <small class="muted num">{anzahl(p.menge, 4)} {einheit(p.titel)} · {t('Average price')} {chf(p.schnitt, 2)}</small>
            </div>
            <span class="num r {tone(p.gewinn)}">{p.gewinn == null ? '–' : `${vorzeichen(p.gewinn, 0)} · ${pctText(p.pct)}`}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="card p-karte" data-journal>
    <div class="p-kopf">
      <h2>{t('Journal')}</h2>
      <button type="button" class="btn hi" onclick={() => (eintragEdit = { neu: true })} data-eintrag-neu><Plus size={16} aria-hidden="true" /> {t('Write down')}</button>
    </div>
    {#if !eintraege.length}
      <p class="muted">{t('Every buy, sale, dividend and split you write down shows here, the newest first.')}</p>
    {:else}
      <ul class="j-liste">
        {#each eintraege as e (e.id)}
          <li class="j-zeile" data-eintrag={e.id}>
            <div class="j-text">
              <b>{tagKurz(e.tag)}{' · '}{t(ART[e.art])}{' · '}{nameOf(e.titel)}{#if e.eroeffnung}{' '}<small class="badge">{t('Opening')}</small>{/if}</b>
              <small class="muted num">{eintragText(e)}</small>
              {#if e.id in rechnung.zuviel}<small class="warn" data-zuviel>{t('More sold than held that day ({n}). Check the entries.', { n: anzahl(rechnung.zuviel[e.id], 4) })}</small>{/if}
              {#if e.ohneTag}<small class="muted">{t('The day of the purchase was not known: it counts from this day.')}</small>{/if}
            </div>
            <MoreActions
              small
              title={`${tagKurz(e.tag)} · ${t(ART[e.art])}`}
              label={t('More for {what}', { what: `${tagKurz(e.tag)} ${t(ART[e.art])}` })}
              actions={[
                { name: t('Change'), explain: t('day, amount, price or fee'), icon: Pencil, run: () => (eintragEdit = { eintrag: e }) },
                { name: t('Delete'), explain: t('only this entry goes'), icon: Trash2, run: () => removeEintrag(e) },
              ]}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
  {@render uebernahme()}
{/if}

{#if geladen}
  <Verteilung {jr} {basis} {goldChf} />
{/if}

<p class="muted small hinweis" data-hinweis>{t('Only what you wrote down and the prices of the day before. Nothing here predicts a price and nothing is investment advice. Everything stays on your devices.')}</p>

{#if depotEdit}
  <DepotSheet depot={depotEdit.depot ?? null} onsave={saveDepot} onclose={() => (depotEdit = null)} />
{/if}
{#if eintragEdit && depot}
  <EintragSheet eintrag={eintragEdit.eintrag ?? null} titel={GOLD} {vorschlaege} kurs={kursAm} onsave={saveEintrag} onclose={() => (eintragEdit = null)} />
{/if}
{#if depotLoeschen}
  <GroupDeleteSheet
    title={t('Delete portfolio «{name}»?', { name: depotLoeschen.name })}
    count={depotLoeschen.eintraege.length}
    what={(n) => tn(n, '{n} entry', '{n} entries')}
    none={t('Delete them with it')}
    noneHint={t('The entries go with the portfolio; Undo brings them back.')}
    targets={jr.depots.filter((d) => d.id !== depotLoeschen.id).map((d) => ({ id: d.id, name: d.name }))}
    empty={t('The portfolio is empty.')}
    onconfirm={(to) => loescheDepotMit(depotLoeschen, to)}
    onclose={() => (depotLoeschen = null)}
  />
{/if}

<style>
  .p-depots {
    display: grid;
    gap: var(--sp-2);
  }
  .p-karte {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .p-karte h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .p-kopf {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sp-2);
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--ink-2);
  }
  .small {
    font-size: var(--fs-small);
  }
  .big {
    font-size: var(--fs-num);
    font-weight: 700;
    line-height: 1.1;
  }
  .up {
    color: var(--ok);
  }
  .down {
    color: var(--bad);
  }
  .badge {
    padding: 1px var(--sp-2);
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .warn {
    color: var(--warn);
  }
  .rech {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
  }
  .rech div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--sp-3);
  }
  .rech dt,
  .rech dd {
    margin: 0;
  }
  .rech dd {
    text-align: right;
  }
  .rech .sum {
    border-top: 1px solid var(--line);
    padding-top: var(--sp-1);
    font-weight: 700;
  }
  .j-liste {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .j-zeile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sp-2);
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--line);
  }
  .r {
    text-align: right;
    font-size: var(--fs-small);
  }
  .j-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .hinweis {
    padding: 0 var(--sp-1);
  }
</style>
