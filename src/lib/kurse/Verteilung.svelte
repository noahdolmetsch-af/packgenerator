<script>
  /**
   * «Kursblick» Verteilung (Noah 23.11.2026 «einzelne neue Aktien … Obligationen. ETFs», «Krypto, Rohstoffe, Immobilien, Sparkonto»;
   * PR 5 von 5): the whole picture under «Portfolio». Groups (gold, stocks and funds, bonds, crypto, real estate, savings: all can be
   * renamed, given a goal in percent and deleted, or added), the titles of the real portfolios sorted into them, and values
   * written by hand for what has no price. For each group: how much of the whole it is now, its goal, and how far off it is
   * (a band of points, so a small move is no verdict). Practice portfolios never count. If a buying rule would buy where the
   * goal says «enough», one sentence says so. No advice: only what the person wrote down and the prices of the day before.
   *
   * PRIVATE: the setting `kurse.verteilung` (src/lib/kurse/verteilung.js), on the devices, in the backup and sealed in the sync.
   * jr: the journal (read by Portfolio), basis: the price series the page and the journal have loaded, goldChf: the gold series in francs.
   */
  import { onMount } from 'svelte';
  import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, PieChart } from '@lucide/svelte';
  import GroupActions from '../ui/GroupActions.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import HandwertSheet from './HandwertSheet.svelte';
  import { meldung } from './meldungen.js';
  import { echteEintraege, rechne, bewerteRechnung } from './journal.js';
  import { preiseChf, titelText } from './preise.js';
  import { verteilung, widersprueche, regelVorschlag, liesRegeln, liesRegel, REGELN_KEY } from './signale.js';
  import {
    VERTEILUNG_KEY, lies, gruppenName, neueGruppe, benenneGruppe, loescheGruppe, schiebeGruppe, setzeZiel, setzeSpielraum, gruppeVon, ordneZu,
    neuerHandwert, aendereHandwert, loescheHandwert, gruppenWerte,
  } from './verteilung.js';
  import { zahl } from './format.js';

  let { jr, basis = {}, goldChf = [] } = $props();

  let st = $state.raw(lies(null));
  let regeln = $state.raw({});
  let geladen = $state(false);
  let handEdit = $state.raw(null); // { hand } to change, { neu: true } to add
  let neueGruppeOffen = $state(false);
  let loeschen = $state.raw(null);

  const gname = (g) => gruppenName(g, t);
  const gruppenListe = $derived(st.gruppen.map((g) => ({ id: g.id, name: gname(g) })));
  const rechnung = $derived(rechne(echteEintraege(jr)));
  const titel = $derived(Object.keys(rechnung.positionen));
  const bewertet = $derived(bewerteRechnung(rechnung, preiseChf(titel, basis)));
  const stand = $derived(gruppenWerte(st, bewertet.positionen));
  const v = $derived(verteilung([...st.gruppen, { id: '', ziel: 0 }], stand.werte, st.spielraum));
  const zeile = $derived(Object.fromEntries(v.gruppen.map((g) => [g.id, g])));
  const ungeordnet = $derived(bewertet.positionen.filter((p) => !gruppeVon(st, p.titel)));
  const gibtEtwas = $derived(v.total > 0 || stand.fehlt.length > 0 || st.hand.length > 0 || st.gruppen.some((g) => g.ziel > 0));
  const zielSumme = $derived(st.gruppen.reduce((s, g) => s + g.ziel, 0));
  // the rule of gold against the goal of gold
  const goldRegel = $derived(liesRegel(regeln.gold));
  const goldVorschlag = $derived(goldChf.length && goldRegel.grundbetrag > 0 ? regelVorschlag(goldChf, goldChf.length - 1, goldRegel) : null);
  const widerspruch = $derived(
    goldVorschlag && st.gruppen.some((g) => g.id === 'gold' && g.ziel > 0) && v.total > 0
      ? widersprueche([{ id: 'gold', gruppe: 'gold', betrag: goldVorschlag.betrag, faktor: goldVorschlag.faktor }], v)[0] ?? null
      : null,
  );

  const chf = (x) => `CHF ${zahl(Math.abs(x))}`;
  const pct = (x) => `${zahl(x, 0)} %`;
  const nameOf = (k) => titelText(k, basis, t);

  async function save(next) {
    st = next;
    await db.settings.put({ key: VERTEILUNG_KEY, value: JSON.parse(JSON.stringify(next)) }).catch(() => {});
  }
  onMount(async () => {
    try {
      st = lies((await db.settings.get(VERTEILUNG_KEY))?.value);
      regeln = liesRegeln((await db.settings.get(REGELN_KEY))?.value);
    } catch {
      /* nothing saved: the standard groups */
    }
    geladen = true;
  });

  // ---- groups
  async function addGruppe(name) {
    const prev = st;
    const r = neueGruppe(st, name, t);
    if (r.error === 'dup') return t('You already have a group with this name.');
    if (r.error) return t('Give the group a name.');
    await save(r.state);
    offerDone(t('Group «{name}» added.', { name: r.gruppe.name }), () => save(prev));
    return true;
  }
  async function renameGruppe(g, name) {
    const prev = st;
    const r = benenneGruppe(st, g.id, name, t);
    if (r.error === 'dup') return offerDone(t('You already have a group with this name.'));
    if (r.error) return offerDone(t('Give the group a name.'));
    await save(r.state);
    offerDone(t('Renamed to «{name}».', { name: gname(r.state.gruppen.find((x) => x.id === g.id)) }), () => save(prev));
  }
  async function removeGruppe(g, to) {
    const name = gname(g);
    await deleteWithUndo({
      run: async () => {
        const prev = st;
        await save(loescheGruppe(st, g.id, to ?? ''));
        return prev;
      },
      undo: (prev) => save(prev),
      text: t('Group «{name}» deleted.', { name }),
      name,
    });
  }
  const inGruppe = (g) => bewertet.positionen.filter((p) => gruppeVon(st, p.titel) === g.id).length + st.hand.filter((h) => h.gruppe === g.id).length;

  // a goal is saved while typing; a comma counts as a point
  const lesZahl = (s) => Number(String(s).replace(',', '.'));
  const onZiel = (g, value) => save(setzeZiel(st, g.id, value === '' ? 0 : lesZahl(value)));
  const onSpielraum = (value) => save(setzeSpielraum(st, value === '' ? 0 : lesZahl(value)));

  // ---- titles
  async function ordne(titelKey, gruppe) {
    const prev = st;
    await save(ordneZu(st, titelKey, gruppe));
    offerDone(t('Sorted.'), () => save(prev));
  }

  // ---- values by hand
  async function saveHand(d) {
    const e = handEdit;
    const prev = st;
    const r = e.hand ? aendereHandwert(st, e.hand.id, d) : neuerHandwert(st, d);
    if (r.error === 'wert') return t('Write the value in francs, for example 12500.');
    if (r.error) return meldung(r.error);
    await save(r.state);
    offerDone(e.hand ? t('Saved.') : t('Written down.'), () => save(prev));
    return '';
  }
  async function removeHand(h) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: h.name }), text: t('Only this value goes. You can undo this for a few seconds.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const prev = st;
        await save(loescheHandwert(st, h.id));
        return prev;
      },
      undo: (prev) => save(prev),
      text: t('"{name}" deleted.', { name: h.name }),
      name: h.name,
    });
  }

  const status = (z) => {
    if (!v.total) return '';
    if (!(z.ziel > 0)) return t('No goal set.');
    if (z.ok) return t('Within your band.');
    const p = Math.abs(Math.round(z.abweichung));
    return z.abweichung > 0
      ? t('{p} points above the goal, about {x} more than the goal.', { p, x: chf(z.diff) })
      : t('{p} points below the goal, about {x} less than the goal.', { p, x: chf(z.diff) });
  };
</script>

{#if geladen}
  <section class="card v-karte" data-verteilung aria-labelledby="v-h">
    <div class="v-kopf">
      <h2 id="v-h">{t('Your whole picture')}</h2>
      <button type="button" class="btn" onclick={() => (handEdit = { neu: true })} data-hand-neu><Plus size={16} aria-hidden="true" /> {t('Value by hand')}</button>
    </div>
    {#if !gibtEtwas}
      <p class="muted" data-verteilung-leer>{t('Here your real portfolios and what you write down by hand become one picture: how much is gold, stocks, bonds, crypto, a savings account. Give each group a goal and Kursblick says how far you are off.')}</p>
    {:else}
      <p class="big num" data-gesamt-verteilung>{v.total ? chf(v.total) : '–'}</p>
      {#if stand.fehlt.length}<p class="muted small" data-verteilung-preis-fehlt>{t('No price right now for {what}: it is not in this picture yet.', { what: stand.fehlt.map(nameOf).join(', ') })}</p>{/if}
    {/if}

    <div class="v-band">
      <label>{t('Band in points')} <input class="inp num" type="number" inputmode="decimal" min="0" max="50" step="1" value={st.spielraum} oninput={(e) => onSpielraum(e.currentTarget.value)} data-spielraum /></label>
      <p class="muted small">{t('A group is flagged only when it is further off its goal than this.')}</p>
    </div>

    <ul class="v-liste">
      {#each st.gruppen as g (g.id)}
        {@const z = zeile[g.id]}
        <li class="v-gruppe" data-vgruppe={g.id}>
          <GroupActions name={gname(g)} count={inGruppe(g)} allowEmpty={!!g.std} deleteAsk="" renameHelp={t('Only the name of the group changes.')} renameExplain={t('only the name of the group changes')} deleteExplain={t('titles and values stay, in another group or without one')} onrename={(val) => renameGruppe(g, val)} ondelete={() => (loeschen = g)}>
            <h3 class="v-name">{gname(g)}</h3>
          </GroupActions>
          <div class="v-zahlen">
            <span class="num" data-jetzt>{v.total ? `${pct(z.jetzt)} · ${chf(z.wert)}` : '–'}</span>
            <label class="v-ziel">{t('Goal in %')} <input class="inp num" type="number" inputmode="decimal" min="0" max="100" step="1" value={g.ziel || ''} placeholder="0" oninput={(e) => onZiel(g, e.currentTarget.value)} data-ziel={g.id} /></label>
          </div>
          {#if v.total}
            <div class="v-balken" role="img" aria-label={`${gname(g)}: ${pct(z.jetzt)}`}>
              <span class="v-ist" style:width={`${Math.min(100, z.jetzt)}%`}></span>
              {#if g.ziel > 0}<span class="v-marke" style:left={`${Math.min(100, g.ziel)}%`}></span>{/if}
            </div>
            <p class="small {z.ok || !(g.ziel > 0) ? 'muted' : 'warn'}" data-status={g.id}>{status(z)}</p>
          {/if}
          <div class="v-ordnen">
            <button type="button" class="btn small" aria-label={t('Up')} disabled={st.gruppen[0]?.id === g.id} onclick={() => save(schiebeGruppe(st, g.id, -1))}><ArrowUp size={14} aria-hidden="true" /></button>
            <button type="button" class="btn small" aria-label={t('Down')} disabled={st.gruppen.at(-1)?.id === g.id} onclick={() => save(schiebeGruppe(st, g.id, 1))}><ArrowDown size={14} aria-hidden="true" /></button>
          </div>
        </li>
      {/each}
    </ul>

    <div class="v-fuss">
      <button type="button" class="btn" onclick={() => (neueGruppeOffen = true)} data-vgruppe-neu><PieChart size={16} aria-hidden="true" /> {t('New group')}</button>
    </div>
    {#if zielSumme > 0 && Math.round(zielSumme) !== 100}<p class="muted small" data-ziel-summe>{t('Your goals add up to {p} %. They do not have to make 100.', { p: zahl(zielSumme, 0) })}</p>{/if}

    {#if widerspruch}
      <p class="small warn" data-widerspruch>
        {widerspruch.art === 'kauft-ueber'
          ? t('Your buying rule for gold would buy for {x} today, but gold is already above its goal.', { x: chf(widerspruch.betrag) })
          : t('Gold is below its goal, and your buying rule buys less than usual today.')}
        {' '}{t('A rule and a goal can disagree: you decide which one counts.')}
      </p>
    {/if}
  </section>

  {#if ungeordnet.length}
    <section class="card v-karte" data-ungeordnet>
      <h2>{t('Not sorted yet')}</h2>
      <p class="muted small">{t('Sort each title into a group so it counts for that group.')}</p>
      <ul class="v-liste">
        {#each ungeordnet as p (p.titel)}
          <li class="v-zeile" data-ungeordnet-titel={p.titel}>
            <span><b>{nameOf(p.titel)}</b> <small class="muted num">{p.wert == null ? '–' : chf(p.wert)}</small></span>
            <select class="inp" aria-label={t('Group of {name}', { name: nameOf(p.titel) })} value="" onchange={(e) => ordne(p.titel, e.currentTarget.value)} data-sortieren={p.titel}>
              <option value="">{t('No group')}</option>
              {#each gruppenListe as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
            </select>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if bewertet.positionen.some((p) => gruppeVon(st, p.titel))}
    <section class="card v-karte" data-sortiert>
      <h2>{t('Titles by group')}</h2>
      <ul class="v-liste">
        {#each bewertet.positionen.filter((p) => gruppeVon(st, p.titel)) as p (p.titel)}
          <li class="v-zeile" data-sortiert-titel={p.titel}>
            <span><b>{nameOf(p.titel)}</b> <small class="muted num">{p.wert == null ? '–' : chf(p.wert)}</small></span>
            <select class="inp" aria-label={t('Group of {name}', { name: nameOf(p.titel) })} value={gruppeVon(st, p.titel)} onchange={(e) => ordne(p.titel, e.currentTarget.value)}>
              <option value="">{t('No group')}</option>
              {#each gruppenListe as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
            </select>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if st.hand.length}
    <section class="card v-karte" data-hand-liste>
      <h2>{t('Values by hand')}</h2>
      <ul class="v-liste">
        {#each st.hand as h (h.id)}
          <li class="v-zeile" data-hand={h.id}>
            <span><b>{h.name}</b> <small class="muted">{gruppenListe.find((g) => g.id === h.gruppe)?.name ?? t('No group')}</small></span>
            <span class="v-rechts">
              <span class="num">{chf(h.wert)}</span>
              <MoreActions
                small
                title={h.name}
                label={t('More for {what}', { what: h.name })}
                actions={[
                  { name: t('Change'), explain: t('name, group or value'), icon: Pencil, run: () => (handEdit = { hand: h }) },
                  { name: t('Delete'), explain: t('only this value goes'), icon: Trash2, run: () => removeHand(h) },
                ]}
              />
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/if}

{#if handEdit}
  <HandwertSheet hand={handEdit.hand ?? null} gruppen={gruppenListe} onsave={saveHand} onclose={() => (handEdit = null)} />
{/if}
{#if neueGruppeOffen}
  <RenameSheet kicker={t('Group')} title={t('New group')} value="" hint={t('Give the group a name, for example «Forest» or «Art».')} onsave={addGruppe} onclose={() => (neueGruppeOffen = false)} />
{/if}
{#if loeschen}
  {@const g = loeschen}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gname(g) })}
    count={inGruppe(g)}
    what={(n) => tn(n, '{n} title or value', '{n} titles and values')}
    none={t('No group')}
    noneHint={t('The titles and values stay, under «No group».')}
    targets={gruppenListe.filter((x) => x.id !== g.id)}
    onconfirm={(to) => removeGruppe(g, to)}
    onclose={() => (loeschen = null)}
  />
{/if}

<style>
  .v-karte {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .v-karte h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .v-kopf {
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
  .warn {
    color: var(--warn);
  }
  .big {
    font-size: var(--fs-num);
    font-weight: 700;
    line-height: 1.1;
  }
  .v-band {
    display: grid;
    gap: var(--sp-1);
  }
  .v-band label,
  .v-ziel {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-small);
  }
  .v-band input,
  .v-ziel input {
    width: 5rem;
  }
  .v-liste {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .v-gruppe {
    display: grid;
    gap: var(--sp-1);
    padding-bottom: var(--sp-3);
    border-bottom: 1px solid var(--line);
  }
  .v-name {
    margin: 0;
    font-size: var(--fs-body);
  }
  .v-zahlen {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .v-balken {
    position: relative;
    height: 10px;
    border-radius: var(--r-ctl);
    background: var(--accent-soft);
    overflow: hidden;
  }
  .v-ist {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--accent);
  }
  .v-marke {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--ink);
  }
  .v-ordnen {
    display: flex;
    gap: var(--sp-1);
  }
  .v-fuss {
    display: flex;
    gap: var(--sp-2);
  }
  .v-zeile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .v-rechts {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
</style>
