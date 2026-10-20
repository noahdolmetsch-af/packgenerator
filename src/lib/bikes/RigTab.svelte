<script>
  import CameraButton from '../ui/CameraButton.svelte'; // P3b Teil 3: the camera wherever a photo is added
  /**
   * Velos › Setup (UC3-1, Noah 14.10.2026 «1-5a», «UC3-1-UC3-3 freigeben»): one page per bike.
   * Your setup photos first (only on this device), then the total weight and a small bag plan,
   * the newest changes of the setup log, «Your bike compared», your races and the race-rig links you
   * added yourself («Ideas from others»: big cards with a drawn picture, never a copied photo).
   * Everything is a suggestion: nothing has to be filled in, every link and row can be removed.
   * view: 'bags' opens the bag plan (UC3-2), 'log' the setup log (UC3-3).
   * Taschen-Setups TS0–TS5 (Noah 14.10.2026 «TS0–TS5 freigegeben»): the tab is «Mein Setup», the bag
   * setups come first (SetupList), the photo card is «Fotos», and the small weight and bag-plan cards
   * show the last used setup (3b). view: 'setup' one setup (TS2), 'compare' two (TS3), 'table' all (TS4).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import Empty from '../ui/Empty.svelte';
  import HintCard from '../pageinfo/HintCard.svelte';
  import { wantBike } from '../nav.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { bikePhotos, shrinkImage } from '../photo.js';
  import { localDay } from '../localday.js';
  import { newNote } from '../notes.js';
  import { compareLoad, filterLinks, linkYears, racesOf, domainOf, logView } from '../rig.js';
  import { setupOf, setupCalc, lastUsedId } from '../setups.js';
  import { Plus, Camera, ChevronRight, Star, ExternalLink, Flag, Bike, Pencil, X } from '@lucide/svelte';
  import RigBike from './RigBike.svelte';
  import RigArt from './RigArt.svelte';
  import RigLinkDialog from './RigLinkDialog.svelte';
  import RigPlan from './RigPlan.svelte';
  import RigLog from './RigLog.svelte';
  import SetupList from './SetupList.svelte';
  import SetupBar from './SetupBar.svelte';
  import SetupDetail from './SetupDetail.svelte';
  import SetupCompare from './SetupCompare.svelte';
  import SetupTable from './SetupTable.svelte';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  // Impeccable Runde 2 (18.10.2026, Setup 1-3; Ausstattung 2): an own head «‹ Velo › {bike} › Setup», the
  // bike choice as one row to swipe on a phone, the bag plan says what is outside the bags (Paket C: the
  // weights stay those of the last used setup, TS 3b, so there is no trip choice), the rarely used parts in one fold at the end.
  import VeloHead from './VeloHead.svelte';
  import BikeChips from './BikeChips.svelte';
  import Fold from '../ui/Fold.svelte';

  let { bikeId = null, view = null, setupId = null, a = null, b = null, onbike } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const photosQ = liveQuery(() => db.photos.toArray());
  const tripsQ = liveQuery(() => db.trips.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  const linksQ = liveQuery(() => db.settings.get('rigLinks'));
  const kmQ = liveQuery(() => db.kmBook.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const today = localDay();

  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0]);
  const links = $derived($linksQ?.value ?? []);
  const trips = $derived($tripsQ ?? []);

  /* ---------- photos (only on this device) ---------- */
  const photos = $derived(bikePhotos(bike, $photosQ ?? []).slice(0, 3));
  let photoMsg = $state('');
  async function addPhotos(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    photoMsg = '';
    let n = 0;
    for (const file of files) {
      try {
        const data = await shrinkImage(file);
        await db.photos.put({ id: `photo-${Date.now().toString(36)}-${n++}`, bikeId: bike.id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Setup', tripId: null, main: false, data, addedAt: new Date().toISOString() });
      } catch (err) {
        photoMsg = `${file.name}: ${err.message || t('This photo could not be read.')}`;
      }
    }
  }
  const photoDate = (p) => {
    const at = ($photosQ ?? []).find((x) => x.id === p.id)?.addedAt;
    return at ? dateOf(at.slice(0, 10)) : p.name;
  };

  /* ---------- weight and bag plan of the last used setup (TS 3b) ---------- */
  const items = $derived($itemsQ ?? []);
  const containers = $derived($bagsQ ?? []);
  const setup = $derived(bike ? setupOf(bike, lastUsedId(bike, trips), trips) : null);
  const calc = $derived(setup ? setupCalc(setup, bike, items, containers) : null);
  const setupName = $derived(setup ? (setup.std ? t('Standard|setup') : setup.name) : '');
  const kg = (g) => num(Math.round(g / 100) / 10);
  const shares = $derived(calc?.shares ?? null);
  const withLoad = $derived(links.filter((l) => l.kind !== 'race' && l.packKg));
  // what the setup's luggage weighs outside the bike's bags: things without a bag (Impeccable Setup 2 on TS 3b)
  const outsideG = $derived(calc ? (calc.loose ?? []).reduce((a, x) => a + (x.grams ?? 0), 0) : 0);

  /* ---------- the setup log, newest three ---------- */
  const log = $derived(bike ? logView(bike, { trips, debriefs: $debriefsQ ?? [], kmBook: $kmQ ?? [], today }).slice(0, 3) : []);

  /* ---------- your bike compared (your own rows) ---------- */
  const rows = $derived(bike?.rigCompare ?? []);
  let adding = $state(null); // { key, mine, seen, from }
  let noted = $state('');
  async function saveRow(event) {
    event.preventDefault();
    if (!adding.key.trim()) return;
    const row = { id: `cmp-${Date.now().toString(36)}`, key: adding.key.trim(), mine: adding.mine.trim(), seen: adding.seen.trim(), from: adding.from || null };
    await db.bikes.update(bike.id, { rigCompare: [...rows, row] });
    adding = null;
  }
  const removeRow = (row) => db.bikes.update(bike.id, { rigCompare: rows.filter((r) => r.id !== row.id) });
  async function toNote(row) {
    const text = t('{key}: you {mine}, rigs {seen}', { key: row.key, mine: row.mine || '–', seen: row.seen || '–' });
    await db.notes.put(newNote({ text, page: 'bikes', bikeId: bike.id }, { id: `note-${Date.now().toString(36)}` }));
    noted = row.id;
  }
  const linkTitle = (id) => links.find((l) => l.id === id)?.title ?? '';

  /* ---------- links: races and rigs ---------- */
  const races = $derived(racesOf(links, today));
  let filter = $state('all');
  const years = $derived(linkYears(links));
  const shown = $derived(filterLinks(links, filter));
  let dialog = $state.raw(null); // { link } or { kind }
  const saveLinks = (list) => db.settings.put({ key: 'rigLinks', value: list });
  // «Inspiration» shares these links: a change here keeps what Inspiration added (note, facts, taken)
  const saveLink = (l) => saveLinks(links.some((x) => x.id === l.id) ? links.map((x) => (x.id === l.id ? { ...x, ...l } : x)) : [...links, l]);
  const deleteLink = (l) => saveLinks(links.filter((x) => x.id !== l.id).map((x) => (x.raceId === l.id ? { ...x, raceId: null } : x)));
  const toggleStar = (l) => saveLinks(links.map((x) => (x.id === l.id ? { ...x, star: !x.star } : x)));
  // the fold «Ideas and races» stands open once something is in it
  let ideasOpen = $state(false);
  let ideasSet = false;
  $effect(() => {
    if (ideasSet || $linksQ === undefined || !bike) return;
    ideasSet = true;
    ideasOpen = links.length > 0 || (bike.rigCompare ?? []).length > 0;
  });
  const raceDays = (r) => [r.raceDate ? dateOf(r.raceDate) : '', r.raceEnd && r.raceEnd !== r.raceDate ? dateOf(r.raceEnd) : ''].filter(Boolean).join(' – ');
</script>

{#if !bikes.length && $bikesQ}
  <h1 class="title">{t('My setup|tab')}</h1>
  <Empty icon={Bike} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }}>{t('Or bring your data along from a backup:')} <a href="#/me/data">{t('Me › Data and backup')}</a>.</Empty>
{:else if bike && view === 'bags'}
  <RigPlan {bike} />
{:else if bike && view === 'log'}
  <RigLog {bike} />
{:else if bike && view === 'setup'}
  <SetupDetail {bike} {bikes} {setupId} {trips} {items} {containers} />
{:else if bike && view === 'compare'}
  <SetupCompare {bike} {a} {b} {trips} {items} {containers} />
{:else if bike && view === 'table'}
  <SetupTable {bike} {trips} {items} {containers} />
{:else if bike}
  <VeloHead
    crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: bike.name, href: bikesHash({ tab: 'setup', bike: bike.id }) }]}
    here={t('My setup|tab')}
    title={t('My setup|tab')}
    sub={t('{bike} · photos, weight, bags, changes', { bike: bike.name })}
  />
  {#if bikes.length > 1}<BikeChips {bikes} current={bike.id} onpick={(id) => onbike?.(id)} />{/if}
  <HintCard page="rig" />

  <SetupList {bike} {bikes} {trips} {items} {containers} />

  <section class="card blk" aria-labelledby="rg-photos">
    <header class="bh"><h2 id="rg-photos">{t('Photos of the setup')}</h2><p>{t('your photos, only on this device')}</p></header>
    <div class="shots">
      {#each photos as p (p.id)}
        <figure><img src={p.src} alt={p.name} /><figcaption>{photoDate(p)}</figcaption></figure>
      {/each}
      <CameraButton onchange={addPhotos} />
      <label class="shot add">
        <input type="file" accept="image/*" multiple onchange={addPhotos} />
        <span class="addbox"><Camera size={26} aria-hidden="true" /></span>
        <span class="cap">{t('Add photo')}</span>
      </label>
    </div>
    {#if photoMsg}<p class="msg" role="alert">{photoMsg}</p>{/if}
    <p class="hint">{t('So you see how your setup changes over time. Photos never go to the internet.')}</p>
  </section>

  <div class="two">
    <section class="card blk" aria-labelledby="rg-weight">
      <header class="bh"><h2 id="rg-weight">{t('Total weight')}</h2>{#if calc}<p>{t('Setup «{name}»', { name: setupName })}</p>{/if}</header>
      {#if calc && calc.list.length}
        <p class="tot"><b class="num">{kg(calc.baseG)} kg</b> <span>{t('Base weight: bike + bags + gear')}</span></p>
        <p class="hint">{t('With food and water: {kg}', { kg: `${kg(calc.totalG)} kg` })}</p>
        <SetupBar {calc} legend />
        {#if calc.missing}<p class="hint">{tn(calc.missing, '{n} thing has no weight yet.', '{n} things have no weight yet.')}</p>{/if}
        {#if withLoad.length}
          <ul class="cmpl" aria-label={t('Your saved rigs')}>
            {#each withLoad as l (l.id)}
              {@const c = compareLoad(calc.bagsG + calc.contentG, l.packKg)}
              <li><span class="t">{l.title}</span><span class="num">{t('about {kg} kg', { kg: num(l.packKg) })}</span><span class="lt {c}">{c === 'lighter' ? t('you lighter') : c === 'heavier' ? t('you heavier') : t('about the same')}</span></li>
            {/each}
          </ul>
        {/if}
        <p class="hint">{t('Weights from Gear. Only a hint, not a goal. The luggage of a rig is what you type in its link.')}</p>
      {:else}
        <p class="tot"><b class="num">{bike.weightG == null ? t('not weighed') : `${kg(bike.weightG)} kg`}</b> <span>{t('Bike')}</span></p>
        <p class="hint">{t('No bags in this setup yet. Open it and choose the bags: the total shows here.')}</p>
      {/if}
      {#if setup}<a class="more" href={bikesHash({ tab: 'rig', view: 'setup', bike: bike.id, setup: setup.id })}>{t('Open setup')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
    </section>

    <section class="card blk" aria-labelledby="rg-bags">
      <header class="bh"><h2 id="rg-bags">{t('Bag plan')}</h2>{#if calc}<p>{t('{kg} kg in {n} bags', { kg: kg(calc.loadG), n: calc.list.length })}{#if outsideG > 0}{' · '}{t('{kg} kg outside the bags', { kg: kg(outsideG) })}{/if}</p>{/if}</header>
      {#if calc && calc.list.length}
        <RigBike bags={calc.list} label={t('Bike with {n} bags', { n: calc.list.length })} />
        <div class="sides">
          <div><b class="num">{kg(calc.sides.front)}</b><small>{t('kg front')}</small></div>
          <div><b class="num">{kg(calc.sides.middle)}</b><small>{t('kg middle')}</small></div>
          <div><b class="num">{kg(calc.sides.rear)}</b><small>{t('kg rear')}</small></div>
        </div>
        <span class="sr">{t('{f} % front, {m} % middle, {r} % rear', { f: shares.front, m: shares.middle, r: shares.rear })}</span>
      {:else}
        <p class="hint">{t('The plan shows which bag sits where once a packing list with this bike has bags.')}</p>
      {/if}
      <a class="more" href={bikesHash({ tab: 'rig', view: 'bags', bike: bike.id })}>{t('Whole bag plan')}<ChevronRight size={16} aria-hidden="true" /></a>
    </section>
  </div>

  <section class="card blk" aria-labelledby="rg-log">
    <header class="bh"><h2 id="rg-log">{t('Setup log')}</h2><p>{t('what you changed')}</p></header>
    {#each log as e (e.id)}
      <div class="lg">
        <span class="d">{dateOf(e.date)}</span>
        <span class="t"><b>{e.title}</b><small>{[e.kmSince != null ? t('{km} km since', { km: num(e.kmSince) }) : '', e.firstTrip ? t('after: {trip}', { trip: e.firstTrip.title }) : ''].filter(Boolean).join(' · ')}</small></span>
      </div>
    {:else}
      <p class="hint">{t('No change written down yet. A new chainring, other tyres, another bag: write it down and see later how it felt.')}</p>
    {/each}
    <a class="more" href={bikesHash({ tab: 'rig', view: 'log', bike: bike.id })}>{t('Whole log')}<ChevronRight size={16} aria-hidden="true" /></a>
  </section>

  <!-- Setup 3: «Your bike compared», «Your races» and «Ideas from others» in one fold at the end -->
  <div class="ifold">
  <Fold label={tn(links.length, 'Ideas and races · {n} link', 'Ideas and races · {n} links')} summary={t('Rigs of others, your races and what you want to compare')} bind:open={ideasOpen}>
  <section class="card blk" aria-labelledby="rg-cmp">
    <header class="bh"><h2 id="rg-cmp">{t('Your bike compared')}</h2><p>{t('{bike} · your own rows', { bike: bike.name })}</p></header>
    {#each rows as r (r.id)}
      <div class="cr">
        <span class="k">{r.key}</span>
        <span class="me">{t('You: {v}', { v: r.mine || '–' })}</span>
        <span class="oft">{r.seen || '–'}{#if r.from && linkTitle(r.from)}<small>{t('from {source}', { source: linkTitle(r.from) })}</small>{/if}</span>
        <span class="acts">
          <button type="button" class="rpill" onclick={() => toNote(r)} disabled={noted === r.id}>{noted === r.id ? t('In the inbox') : t('→ Note')}</button>
          <button type="button" class="iconb" aria-label={t('Remove {name}', { name: r.key })} onclick={() => removeRow(r)}><X size={16} aria-hidden="true" /></button>
        </span>
      </div>
    {:else}
      <p class="hint">{t('Write down what you see on rigs you like (dynamo, chainring, sleeping) next to what your bike has.')}</p>
    {/each}
    {#if adding}
      <form class="addrow" onsubmit={saveRow}>
        <label><span class="lbl">{t('What')}</span><input class="inp" bind:value={adding.key} placeholder={t('e.g. Dynamo')} /></label>
        <label><span class="lbl">{t('Your bike')}</span><input class="inp" bind:value={adding.mine} /></label>
        <label><span class="lbl">{t('Seen on rigs')}</span><input class="inp" bind:value={adding.seen} /></label>
        {#if links.length}
          <label><span class="lbl">{t('From')}</span><select class="sel" bind:value={adding.from}><option value="">{t('None')}</option>{#each links as l (l.id)}<option value={l.id}>{l.title}</option>{/each}</select></label>
        {/if}
        <span class="fb"><button type="button" class="btn" onclick={() => (adding = null)}>{t('Cancel')}</button><button type="submit" class="btn hi">{t('Save')}</button></span>
      </form>
    {:else}
      <button type="button" class="more btnl" onclick={() => (adding = { key: '', mine: '', seen: '', from: '' })}><Plus size={16} aria-hidden="true" />{t('Add row')}</button>
    {/if}
    <p class="hint">{t('Only to compare, nothing you must do. Your bike stays as it suits you.')}</p>
  </section>

  <section class="card blk" aria-labelledby="rg-races">
    <header class="bh"><h2 id="rg-races">{t('Your races')}</h2><p>{t('from your links')}</p></header>
    {#each races as r (r.id)}
      <div class="evr">
        <Flag size={18} aria-hidden="true" />
        <span class="t"><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a><small>{raceDays(r)}</small></span>
        {#if r.rigs}<span class="rpill">{tn(r.rigs, '{n} rig of this race', '{n} rigs of this race')}</span>{/if}
        <button type="button" class="iconb" aria-label={t('Change {name}', { name: r.title })} onclick={() => (dialog = { link: r })}><Pencil size={16} aria-hidden="true" /></button>
      </div>
    {:else}
      <p class="hint">{t('A race you want to ride or follow: add its page with the dates.')}</p>
    {/each}
    <button type="button" class="more btnl" onclick={() => (dialog = { kind: 'race' })}><Plus size={16} aria-hidden="true" />{t('Add race')}</button>
  </section>

  <section class="ideas" aria-labelledby="rg-ideas">
    <header class="ih">
      <div><h2 id="rg-ideas">{t('Ideas from others')}</h2><p class="hint">{t('Race-rig links you added yourself. The app gives no list.')}</p></div>
      <button type="button" class="btn" onclick={() => (dialog = { kind: 'rig' })}><Plus size={16} aria-hidden="true" />{t('Add link|rig')}</button>
    </header>
    {#if links.some((l) => l.kind !== 'race')}
      <div class="chips" role="group" aria-label={t('Show')}>
        <button type="button" class="chip" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>{t('All')}</button>
        {#each years as y (y)}<button type="button" class="chip" aria-pressed={filter === y} onclick={() => (filter = y)}>{y}</button>{/each}
        <button type="button" class="chip" aria-pressed={filter === 'star'} onclick={() => (filter = 'star')}>{t('Starred')}</button>
      </div>
      <p class="hint ph"><Bike size={16} aria-hidden="true" />{t('Pictures are drawn placeholders. The real photos are on the linked page.')}</p>
      <div class="rg">
        {#each shown as l, i (l.id)}
          <article class="rc">
            <RigArt n={i} />
            <div class="bd">
              <div class="meta">
                {#if l.year}<span class="yr num">{l.year}</span>{/if}<span class="src">{domainOf(l.url)}</span>
                <button type="button" class="iconb rstar" aria-pressed={!!l.star} aria-label={l.star ? t('Unstar {name}', { name: l.title }) : t('Star {name}', { name: l.title })} onclick={() => toggleStar(l)}><Star size={18} aria-hidden="true" /></button>
              </div>
              <h3>{l.title}</h3>
              <span class="own">{t('Added by you · your key words')}</span>
              {#if l.notes?.length}<ul class="facts">{#each l.notes as n, k (k)}<li>{n}</li>{/each}</ul>{/if}
              <div class="cta">
                <a class="btn" href={l.url} target="_blank" rel="noopener noreferrer">{t('See photos on {site}', { site: domainOf(l.url) })}<ExternalLink size={14} aria-hidden="true" /></a>
                <button type="button" class="iconb" aria-label={t('Change {name}', { name: l.title })} onclick={() => (dialog = { link: l })}><Pencil size={16} aria-hidden="true" /></button>
              </div>
            </div>
          </article>
        {:else}
          <p class="hint">{t('No link with a star yet.')}</p>
        {/each}
      </div>
    {:else}
      <p class="card hint">{t('Found a rig you like? Add its link with your own key words. The app shows it here with a drawn picture.')}</p>
    {/if}
    <p class="foot">{t('Other pages only as a link, no text or photos from them in the app.')}</p>
  </section>
  </Fold>
  </div>
{/if}

{#if dialog}
  <RigLinkDialog link={dialog.link ?? null} kind={dialog.kind ?? 'rig'} races={races.filter((r) => r.id !== dialog.link?.id)} onsave={saveLink} ondelete={deleteLink} onclose={() => (dialog = null)} />
{/if}

<style>
  .ifold {
    margin: 8px 0 0;
  }
  .blk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 0 16px;
    min-width: 0;
  }
  .bh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 12px;
  }
  .bh h2,
  .ih h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .bh p {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .msg {
    margin: 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .shots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .shots figure {
    margin: 0;
    min-width: 0;
  }
  .shots img,
  .addbox {
    display: grid;
    place-items: center;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .shots figcaption,
  .cap {
    display: block;
    margin-top: 6px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .shot.add {
    cursor: pointer;
    min-width: 0;
  }
  .shot.add input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .shot.add .addbox {
    border: 1.5px dashed var(--line-strong);
    background: var(--paper);
    color: var(--ink-3);
  }
  .shot.add:focus-within .addbox {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .tot {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tot b {
    font-size: var(--fs-title);
    color: var(--ink);
  }
  .cmpl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: var(--fs-small);
  }
  .cmpl li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
  }
  .cmpl .t {
    overflow-wrap: break-word;
  }
  .lt {
    white-space: nowrap;
    font-weight: 600;
    border-radius: 6px;
    padding: 2px 8px;
    background: var(--paper-2);
  }
  .lt.lighter {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .lt.heavier {
    background: var(--warn-soft);
    color: var(--ink);
  }
  .sides {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    text-align: center;
  }
  .sides div {
    background: var(--paper-2);
    border-radius: 12px;
    padding: 8px;
  }
  .sides b {
    display: block;
    font-size: var(--fs-sub);
  }
  .sides small {
    font-size: var(--fs-tiny);
    color: var(--ink-3);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    min-height: 44px;
    font-weight: 600;
    color: var(--ink);
  }
  .btnl {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .lg {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .lg .d {
    width: 92px;
    flex: none;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .lg .t {
    min-width: 0;
  }
  .lg small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cr {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr) minmax(0, 1.3fr) auto;
    gap: 6px 12px;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .cr .k {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cr .me {
    font-weight: 600;
  }
  .cr .oft small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .rpill {
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    padding: 6px 12px;
    min-height: 36px;
    font: inherit;
    font-size: var(--fs-small);
    white-space: nowrap;
    cursor: pointer;
  }
  span.rpill {
    cursor: default;
  }
  .iconb {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .iconb:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  .addrow {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
  }
  .addrow label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .addrow .fb {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .evr {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .evr .t {
    flex: 1;
    min-width: 0;
  }
  .evr small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ideas {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }
  .ih {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px 16px;
  }
  .ih .hint {
    margin-top: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .ph {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .rg {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }
  .rc {
    background: var(--paper);
    border: 1px solid var(--card-line, var(--line));
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow, none);
    overflow: hidden;
    min-width: 0;
  }
  .bd {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .yr {
    font-size: var(--fs-tiny);
    font-weight: 600;
    background: var(--paper-2);
    border-radius: 6px;
    padding: 2px 8px;
  }
  .src {
    font-size: var(--fs-small);
    color: var(--ink-3);
    min-width: 0;
    overflow-wrap: break-word;
  }
  .rstar {
    margin-left: auto;
  }
  .rstar[aria-pressed='true'] {
    color: var(--warn);
  }
  .rstar[aria-pressed='true'] :global(svg) {
    fill: currentColor;
  }
  .rc h3 {
    margin: 0;
    font-size: var(--fs-body);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .own {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .facts {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cta .btn {
    min-width: 0;
    white-space: normal;
  }
  .foot {
    margin: 8px 0 0;
    text-align: center;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  @media (max-width: 900px) {
    .rg {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 700px) {
    .two,
    .rg {
      grid-template-columns: minmax(0, 1fr);
    }
    .shots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .cr {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .cr .k {
      grid-column: 1 / -1;
    }
    .cr .acts {
      grid-column: 2;
      grid-row: 2 / 4;
    }
    .addrow {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
