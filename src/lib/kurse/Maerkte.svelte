<script>
  /**
   * «Kursblick» Märkte (Noah 22.11.2026 «alles davon», Bauplan K6): the titles the person follows, in groups of their own.
   * Each row shows the close of the day before and the change over the chosen period. Groups and titles can be added,
   * renamed, moved and deleted (a group's titles go on to another group or to «No group», nothing is ever deleted with
   * a group); a delete offers Undo. The suggestions (seven Swiss shares) are only a start and can be brought back.
   * The list is one setting (`kurse.maerkte`, src/lib/kurse/maerkte.js); the prices come from the server like gold.
   * Only numbers, no advice.
   */
  import { onMount } from 'svelte';
  import { Plus, TrendingUp, ArrowUp, ArrowDown, Pencil, Trash2, RotateCcw } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import GroupActions from '../ui/GroupActions.svelte';
  import GroupDeleteSheet from '../ui/GroupDeleteSheet.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import Zeitraum from './Zeitraum.svelte';
  import TitelSheet from './TitelSheet.svelte';
  import Linien from './Linien.svelte';
  import { aufHundert, umschalten, MAX_LINIEN } from './vergleich.js';
  import { ladeReihe } from './laden.js';
  import { verglichenMit } from './rechnen.js';
  import { zahl, vorzeichen, tagKurz } from './format.js';
  import {
    MAERKTE_KEY, lies, ansicht, neuerTitel, aendereTitel, loescheTitel, schiebeTitel, neueGruppe, benenneGruppe, loescheGruppe, schiebeGruppe,
    ergaenzeVorschlaege, fehlendeVorschlaege, gruppenName, titelName, reihenId,
  } from './maerkte.js';

  let { zeitraum, onzeitraum } = $props();

  let st = $state.raw(lies(null));
  let geladen = $state(false);
  let reihen = $state.raw({}); // id of the series → the answer, or null when it did not come
  let editing = $state.raw(null); // { titel } to change, { neu: groupId } to add
  let deleting = $state.raw(null); // the group row being deleted
  let neueGruppeName = $state(null); // null: the form is closed
  let wahl = $state.raw([]); // ids of the titles chosen for the comparison (at most five)
  let voll = $state(false);

  const gname = (g) => gruppenName(g, t);
  const view = $derived(ansicht(st));
  const gruppenListe = $derived(st.gruppen.map((g) => ({ id: g.id, name: gname(g) })));
  const fehlend = $derived(fehlendeVorschlaege(st));
  const pName = $derived(zeitraum.label ? t(zeitraum.label) : '');

  async function save(next) {
    st = next;
    await db.settings.put({ key: MAERKTE_KEY, value: JSON.parse(JSON.stringify(next)) }).catch(() => {});
  }

  /** Fetch the prices of the titles that have none yet (or all, with `force`). */
  async function lade(force = false) {
    const todo = st.titel.filter((x) => force || reihen[reihenId(x.symbol)] === undefined);
    await Promise.all(
      todo.map(async (x) => {
        const id = reihenId(x.symbol);
        let r = null;
        try {
          r = await ladeReihe(id, { force });
        } catch {
          r = null;
        }
        reihen = { ...reihen, [id]: r };
      }),
    );
  }
  onMount(async () => {
    try {
      st = lies((await db.settings.get(MAERKTE_KEY))?.value);
    } catch {
      st = lies(null);
    }
    geladen = true;
    lade();
  });

  const answerOf = (x) => reihen[reihenId(x.symbol)];
  // the comparison: only titles that still exist and whose prices came
  const gewaehlt = $derived(wahl.map((id) => st.titel.find((x) => x.id === id)).filter((x) => x && answerOf(x)));
  const ergebnis = $derived(aufHundert(gewaehlt.map((x) => ({ id: x.id, points: answerOf(x).points })), zeitraum));
  const namen = $derived(Object.fromEntries(st.titel.map((x) => [x.id, titelName(x, answerOf(x)?.name, t)])));
  function waehle(id) {
    const r = umschalten(wahl, id);
    wahl = r.wahl;
    voll = r.voll;
  }
  const dec = (v) => (v >= 1000 ? 0 : 2);
  const tone = (v) => (!v || !v.abs ? '' : v.abs > 0 ? 'up' : 'down');

  async function saveTitel({ name, symbol, art, gruppe }) {
    const e = editing;
    const prev = st;
    const r = e.titel ? aendereTitel(st, e.titel.id, { name, symbol, art, gruppe }) : neuerTitel(st, { name, symbol, art, gruppe });
    if (r.error === 'dup') return t('This symbol is already in your list.');
    if (r.error) return t('Write the symbol as the price service does, for example NESN.SW.');
    await save(r.state);
    offerDone(e.titel ? t('Saved.') : t('"{name}" added.', { name: name || symbol }), () => save(prev));
    lade();
    return '';
  }
  async function removeTitel(x) {
    const name = titelName(x, answerOf(x)?.name, t);
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this title goes from your list. You can undo this for a few seconds.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const prev = st;
        await save(loescheTitel(st, x.id));
        return prev;
      },
      undo: (prev) => save(prev),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const shift = (x, d) => save(schiebeTitel(st, x.id, d));
  $effect(() => {
    // a title that is gone leaves the comparison
    const noch = wahl.filter((id) => st.titel.some((x) => x.id === id));
    if (noch.length !== wahl.length) wahl = noch;
  });

  async function addGruppe(e) {
    e?.preventDefault();
    const prev = st;
    const r = neueGruppe(st, neueGruppeName, t);
    if (r.error === 'dup') return offerDone(t('You already have a group with this name.'));
    if (r.error) return offerDone(t('Give the group a name.'));
    await save(r.state);
    neueGruppeName = null;
    offerDone(t('Group «{name}» added.', { name: r.gruppe.name }), () => save(prev));
  }
  async function renameGruppe(g, name) {
    const prev = st;
    const r = benenneGruppe(st, g.id, name, t);
    if (r.error === 'dup') return offerDone(t('You already have a group with this name.'));
    if (r.error) return offerDone(t('Give the group a name.'));
    await save(r.state);
    offerDone(t('Renamed to «{name}».', { name: gruppenName(r.state.gruppen.find((x) => x.id === g.id), t) }), () => save(prev));
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
  async function bringBack() {
    const prev = st;
    await save(ergaenzeVorschlaege(st));
    offerDone(t('The suggestions are back.'), () => save(prev));
    lade();
  }
</script>

<div class="maerkte" data-maerkte>
  <div class="m-top">
    <button type="button" class="btn hi" onclick={() => (editing = { neu: view[0]?.id ?? '' })} data-titel-neu><Plus size={16} aria-hidden="true" /> {t('Add a title')}</button>
    <button type="button" class="btn" onclick={() => (neueGruppeName = '')} data-gruppe-neu>{t('New group')}</button>
  </div>
  {#if neueGruppeName !== null}
    <form class="m-neu" onsubmit={addGruppe} onkeydown={(e) => e.key === 'Escape' && (e.preventDefault(), (neueGruppeName = null))} data-gruppe-form>
      <input class="inp" type="text" bind:value={neueGruppeName} maxlength="60" aria-label={t('Name of the new group')} placeholder={t('Name of the new group')} />
      <button type="submit" class="btn hi">{t('Save')}</button>
      <button type="button" class="btn" onclick={() => (neueGruppeName = null)}>{t('Discard')}</button>
    </form>
  {/if}

  <section class="m-zeit">
    <Zeitraum value={zeitraum} onchange={onzeitraum} />
  </section>

  {#if wahl.length >= 2 && ergebnis.linien.length >= 2}
    <section class="card m-vergleich" data-vergleich-karte>
      <h2>{t('Comparison')}</h2>
      <p class="muted small">{t('Every line starts at 100 on the same day, so a share and an index can be read against each other.')}</p>
      <Linien {ergebnis} {namen} onweg={waehle} />
    </section>
  {:else if wahl.length === 1}
    <p class="muted small" data-vergleich-hinweis>{t('Choose one more title to compare.')}</p>
  {/if}
  {#if voll}<p class="muted small" role="status">{t('At most {n} titles can be compared at once.', { n: MAX_LINIEN })}</p>{/if}

  {#if !geladen}
    <p class="muted" role="status">{t('Fetching prices …')}</p>
  {:else if !st.titel.length && !st.gruppen.length}
    <Empty icon={TrendingUp} title={t('Nothing followed yet')} text={t('Add a share, a fund, a coin or any title with its symbol, and its price of the day before shows here.')} action={{ label: t('Add a title'), onclick: () => (editing = { neu: '' }) }} />
  {:else}
    {#each view as g (g.id)}
      <section class="card m-gruppe" data-gruppe={g.id || 'none'} aria-labelledby={`mg-${g.id || 'none'}`}>
        {#if g.id}
          <GroupActions name={gname(g)} count={g.titel.length} allowEmpty={!!g.std} deleteAsk="" renameHelp={t('Only the name of the group changes.')} renameExplain={t('only the name of the group changes')} deleteExplain={t('the titles stay, in another group or without one')} onrename={(v) => renameGruppe(g, v)} ondelete={() => (deleting = g)}>
            <h2 id={`mg-${g.id}`}>{gname(g)}</h2>
            <p class="ich-hs">{tn(g.titel.length, '{n} title', '{n} titles')}</p>
          </GroupActions>
        {:else}
          <h2 id="mg-none">{t('No group')}</h2>
        {/if}
        {#if g.titel.length}
          <ul class="m-liste">
            {#each g.titel as x, i (x.id)}
              {@const a = answerOf(x)}
              {@const v = a ? verglichenMit(a.points, zeitraum) : null}
              {@const nm = titelName(x, a?.name, t)}
              <li class="m-zeile" data-titel={x.symbol}>
                <input type="checkbox" class="m-wahl" checked={wahl.includes(x.id)} disabled={!wahl.includes(x.id) && wahl.length >= MAX_LINIEN} onchange={() => waehle(x.id)} aria-label={t('Compare {name}', { name: nm })} data-vergleich-wahl />
                <div class="m-name">
                  <b>{nm}</b>
                  <small class="muted">{x.symbol}{#if a} · {t('Close of {day}', { day: tagKurz(a.last.day) })}{/if}</small>
                </div>
                <div class="m-preis">
                  {#if a}
                    <b class="num" data-titel-preis>{a.currency ? `${a.currency} ` : ''}{zahl(a.last.close, dec(a.last.close))}</b>
                    <small class="num {tone(v)}" data-titel-aend>{v ? `${vorzeichen(v.pct, 1)} %` : '–'}{#if v?.kurz} · {t('since {day}', { day: tagKurz(v.from[0]) })}{/if}</small>
                  {:else if a === null}
                    <small class="muted" data-titel-fehlt>{t('No prices right now')}</small>
                  {:else}
                    <small class="muted">…</small>
                  {/if}
                </div>
                <MoreActions
                  small
                  title={nm}
                  label={t('More for {what}', { what: nm })}
                  actions={[
                    { name: t('Change'), explain: t('name, symbol, kind or group'), icon: Pencil, run: () => (editing = { titel: x }) },
                    ...(i > 0 ? [{ name: t('Up'), explain: t('one place up in the group'), icon: ArrowUp, run: () => shift(x, -1) }] : []),
                    ...(i < g.titel.length - 1 ? [{ name: t('Down'), explain: t('one place down in the group'), icon: ArrowDown, run: () => shift(x, 1) }] : []),
                    { name: t('Delete'), explain: t('only this title goes from the list'), icon: Trash2, run: () => removeTitel(x) },
                  ]}
                />
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted small">{t('No title in this group yet.')} <button type="button" class="btn btn-link" onclick={() => (editing = { neu: g.id })}>{t('Add a title')}</button></p>
        {/if}
      </section>
    {/each}

    {#if view.length > 1 || view.some((g) => g.id)}
      <p class="muted small">{t('Groups and titles are suggestions: rename, move or delete them as you like.')}</p>
    {/if}
    {#if fehlend}
      <button type="button" class="btn" onclick={bringBack} data-vorschlaege><RotateCcw size={16} aria-hidden="true" /> {t('Bring back the suggestions')}</button>
    {/if}
    <p class="muted small">{t('Only numbers, no advice. Close of the day before, from Yahoo Finance.')}{pName ? ` ${t('Change over: {p}.', { p: pName })}` : ''}</p>
  {/if}
</div>

{#if editing}
  <TitelSheet titel={editing.titel ?? null} gruppe={editing.neu ?? ''} gruppen={gruppenListe} onsave={saveTitel} onclose={() => (editing = null)} />
{/if}

{#if deleting}
  {@const g = deleting}
  <GroupDeleteSheet
    title={t('Delete group «{name}»?', { name: gname(g) })}
    count={g.titel.length}
    what={(n) => tn(n, '{n} title', '{n} titles')}
    none={t('No group')}
    noneHint={t('The titles stay in your list, under «No group».')}
    targets={gruppenListe.filter((x) => x.id !== g.id)}
    onconfirm={(to) => removeGruppe(g, to)}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .maerkte {
    display: grid;
    gap: var(--sp-4);
  }
  .m-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .m-neu {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .m-neu .inp {
    flex: 1 1 12em;
    min-width: 0;
  }
  .m-zeit {
    display: grid;
    gap: var(--sp-2);
  }
  .m-gruppe {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .m-gruppe h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .m-liste {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .m-zeile {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) 0;
    border-top: 1px solid var(--line);
  }
  .m-zeile:first-child {
    border-top: 0;
  }
  .m-wahl {
    width: 22px;
    height: 22px;
    margin: 0 var(--sp-1);
    accent-color: var(--accent);
  }
  .m-vergleich {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4);
  }
  .m-vergleich h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .m-name,
  .m-preis {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .m-name b {
    overflow-wrap: break-word;
  }
  .m-preis {
    text-align: right;
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
