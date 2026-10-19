<script>
  /**
   * Paket L2 «Packliste per Foto» (Noah 19.10.2026 «1 a und b möglich mit umschalten des modus 2a 5a und b»):
   * lay the gear out, take one photo, and the app
   *   - «Abhaken»: ticks what it recognises on the packing list of a trip (the person confirms), or
   *   - «Neu erfassen»: suggests new items for the gear.
   * A thing it does not know: «Was ist das?»; the answer is remembered on this device.
   * Recognition on the device by default (offline after the first download, the photo stays here);
   * optionally the KI-Helfer, and the photo only leaves the device after a tap on «Foto senden».
   * Everything is a suggestion: each row can be deselected, and Undo takes it back.
   */
  import { Camera, ImagePlus, Undo2, Send, Brain } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { db } from '../db.js';
  import { newItem } from '../gearimport.js';
  import { nextTrip } from '../debrief.js';
  import { localDay } from '../localday.js';
  import { saveFailed } from '../ui/ask.js';
  import { isOn } from '../helper/client.svelte.js';
  import { errorText } from '../helper/client.svelte.js';
  import * as engine from './engine.js';
  import { photoCanvas, lookAt } from './picture.js';
  import { matchTick, matchNew } from './recognize.js';
  import { askVision, helperGroups } from './online.js';
  import { loadPrefs, savePrefs, loadKnown, remember, forget } from './store.js';
  import { t, tn } from '../i18n.svelte.js';
  import '../tools/tools.css';

  let prefs = $state({ engine: 'device', mode: 'tick' });
  loadPrefs().then((p) => (prefs = p));
  const helperOk = $derived(isOn());
  const useHelper = $derived(prefs.engine === 'helper' && helperOk);

  let trips = $state([]);
  let items = $state([]);
  let known = $state([]);
  let tripId = $state('');
  async function load() {
    const [ts, its, kn] = await Promise.all([db.trips.toArray(), db.items.toArray(), loadKnown()]);
    trips = ts.filter((x) => x.entries?.length && !x.idea).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')));
    items = its;
    known = kn;
    if (!tripId) {
      const want = /[?&]trip=([^&]+)/.exec(location.hash)?.[1];
      tripId = (want && trips.find((x) => x.id === decodeURIComponent(want))?.id) || nextTrip(trips, localDay())?.id || trips[0]?.id || '';
    }
  }
  load().catch(() => {});
  const trip = $derived(trips.find((x) => x.id === tripId) ?? null);

  let canvas = $state(null); // the photo
  let shown = $state(); // the <canvas> on the page
  let regions = $state(null);
  let result = $state(null); // { tick, packed, other, ask } | { have, add, ask }
  let step = $state(''); // '' | 'loading' | 'looking' | 'send' | 'sending'
  let error = $state('');
  let picked = $state({}); // key → true/false (rows to apply)
  let names = $state({}); // new mode: key → name
  let done = $state(null); // { text, undo }
  let camIn = $state();
  let galIn = $state();

  const setMode = (m) => {
    prefs.mode = m;
    savePrefs({ mode: m });
    redo();
  };
  const setEngine = (e) => {
    prefs.engine = e;
    savePrefs({ engine: e });
    if (canvas) (result = null), (step = e === 'helper' && helperOk ? 'send' : ''), e !== 'helper' && run();
  };

  async function pick(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    error = '';
    done = null;
    result = null;
    regions = null;
    try {
      canvas = await photoCanvas(file);
    } catch {
      error = t('This picture could not be opened. Try a JPG or PNG photo.');
      return;
    }
    if (useHelper) step = 'send';
    else run();
  }

  // the photo on the page, with a numbered frame around each thing found
  $effect(() => {
    if (!shown || !canvas) return;
    shown.width = canvas.width;
    shown.height = canvas.height;
    const g = shown.getContext('2d');
    g.drawImage(canvas, 0, 0);
    const marks = rows().filter((r) => r.region?.box);
    g.lineWidth = Math.max(3, canvas.width / 250);
    g.font = `600 ${Math.max(18, canvas.width / 40)}px system-ui, sans-serif`;
    marks.forEach((r, i) => {
      const b = r.region.box;
      g.strokeStyle = r.ask ? '#b4541a' : '#2f6b52';
      g.strokeRect(b.x, b.y, b.w, b.h);
      g.fillStyle = g.strokeStyle;
      const label = String(i + 1);
      const w = g.measureText(label).width + 12;
      g.fillRect(b.x, b.y, w, Math.max(26, canvas.width / 32));
      g.fillStyle = '#fff';
      g.fillText(label, b.x + 6, b.y + Math.max(20, canvas.width / 42));
    });
  });

  async function run() {
    if (!canvas) return;
    error = '';
    step = 'loading';
    try {
      await engine.preparePack();
      step = 'looking';
      regions = await lookAt(canvas);
      group();
    } catch (err) {
      console.warn(err);
      error = navigator.onLine === false ? t('The recognition must be downloaded once. Connect to the internet and try again.') : t('The recognition did not start on this device. Try again, or use the KI-Helfer.');
    } finally {
      if (step !== 'send') step = '';
    }
  }

  function group() {
    if (!regions) return;
    result = prefs.mode === 'tick' ? matchTick(regions, trip?.entries ?? [], items, known) : matchNew(regions, items, known);
    preselect();
  }
  function redo() {
    done = null;
    if (regions) group();
    else if (canvas && useHelper) (result = null), (step = 'send');
  }
  function preselect() {
    const p = {};
    const n = {};
    if (result?.tick) for (const r of result.tick) p[r.itemId] = true;
    if (result?.add) result.add.forEach((r, i) => ((p[`n${i}`] = true), (n[`n${i}`] = r.name || t(r.nameKey))));
    picked = p;
    names = n;
  }

  async function send() {
    step = 'sending';
    error = '';
    const pool = prefs.mode === 'tick' ? items.filter((it) => (trip?.entries ?? []).some((e) => e.itemId === it.id)) : items;
    const r = await askVision(prefs.mode, pool, canvas);
    step = '';
    if (!r.ok) {
      error = errorText(r.error);
      step = 'send';
      return;
    }
    regions = null;
    result = helperGroups(prefs.mode, r.found, { entries: trip?.entries ?? [], items });
    preselect();
  }

  /* ---------- «Was ist das?» ---------- */
  let answers = $state({}); // ask index → { itemId, name }
  const openList = $derived(items.filter((it) => (trip?.entries ?? []).some((e) => e.itemId === it.id && !e.packed)));
  async function teachOne(i) {
    const r = result.ask[i];
    const a = answers[i] ?? {};
    const itemId = a.itemId || null;
    const name = itemId ? items.find((x) => x.id === itemId)?.name ?? '' : String(a.name ?? '').trim();
    if (!itemId && !name) return;
    known = await remember({ emb: r.emb, itemId, name, label: r.label });
    answers = {};
    group();
  }
  function skipOne(i) {
    regions = regions.map((r) => (r === result.ask[i] ? { ...r, ask: false } : r));
    answers = {};
    group();
  }
  async function forgetOne(id) {
    known = await forget(id);
    group();
  }

  /* ---------- apply ---------- */
  async function applyTick() {
    const ids = result.tick.filter((r) => picked[r.itemId]).map((r) => r.itemId);
    if (!ids.length || !trip) return;
    try {
      const cur = await db.trips.get(trip.id);
      const was = Object.fromEntries(cur.entries.map((e) => [e.itemId, !!e.packed]));
      await db.trips.update(trip.id, { entries: cur.entries.map((e) => (ids.includes(e.itemId) ? { ...e, packed: true } : e)) });
      const id = trip.id;
      done = {
        text: tn(ids.length, '{n} item ticked on «{trip}».', '{n} items ticked on «{trip}».', { trip: trip.title }),
        undo: async () => {
          const now = await db.trips.get(id);
          await db.trips.update(id, { entries: now.entries.map((e) => (ids.includes(e.itemId) ? { ...e, packed: was[e.itemId] ?? false } : e)) });
          done = null;
          await load();
          group();
        },
      };
      await load();
      group();
    } catch (err) {
      error = saveFailed(err);
    }
  }
  async function applyNew() {
    const rows = result.add.map((r, i) => ({ ...r, key: `n${i}` })).filter((r) => picked[r.key] && String(names[r.key] ?? '').trim());
    if (!rows.length) return;
    try {
      const all = await db.items.toArray();
      const made = [];
      for (const r of rows) {
        const it = { ...newItem({ name: String(names[r.key]).trim() }, all), sources: `photo ${localDay()}` };
        all.push(it);
        made.push(it);
      }
      await db.items.bulkAdd(made);
      // what was taught by name now has its item
      for (const it of made) {
        const r = rows.find((x) => String(names[x.key]).trim() === it.name);
        if (r?.region?.emb) known = await remember({ emb: r.region.emb, itemId: it.id, name: it.name, label: r.region.label });
      }
      done = {
        text: tn(made.length, '{n} item added to your gear.', '{n} items added to your gear.'),
        undo: async () => {
          await db.items.bulkDelete(made.map((x) => x.id));
          done = null;
          await load();
          group();
        },
        link: made.length === 1 ? `#/gear?item=${encodeURIComponent(made[0].id)}` : '#/gear',
      };
      await load();
      group();
    } catch (err) {
      error = saveFailed(err);
    }
  }

  function rows() {
    if (!result) return [];
    const main = prefs.mode === 'tick' ? result.tick ?? [] : result.add ?? [];
    return [...main.map((r) => ({ region: r.region })), ...(result.ask ?? []).map((r) => ({ region: r, ask: true }))];
  }
  const nTick = $derived(result?.tick ? result.tick.filter((r) => picked[r.itemId]).length : 0);
  const nAdd = $derived(result?.add ? result.add.filter((r, i) => picked[`n${i}`] && String(names[`n${i}`] ?? '').trim()).length : 0);
  const markOf = (r) => (r?.region ? rows().findIndex((x) => x.region === r.region) + 1 : 0);
</script>

<section class="tool-card pp" data-mode={prefs.mode}>
  <p class="tool-help">{t('Lay your things out side by side and take one photo from above. The app finds what it knows; you confirm each row.')}</p>
  <Seg label={t('What should the photo do?')} value={prefs.mode} onchange={setMode} options={[{ key: 'tick', name: t('Tick off') }, { key: 'new', name: t('Add new') }]} />
  <p class="tool-muted">{prefs.mode === 'tick' ? t('Ticks what it recognises on the packing list of a trip.') : t('Suggests new items for your gear from what it sees.')}</p>

  {#if prefs.mode === 'tick'}
    {#if trips.length}
      <label class="tool-field"><span>{t('Packing list of')}</span>
        <select class="tool-input" bind:value={tripId} onchange={redo} data-pp-trip>
          {#each trips as x (x.id)}<option value={x.id}>{x.title}{x.startDate ? ` · ${x.startDate}` : ''}</option>{/each}
        </select>
      </label>
    {:else}
      <p class="tool-status">{t('No trip with a packing list yet. Make a trip first, or use «Add new».')}</p>
    {/if}
  {/if}

  <div class="tool-field">
    <span id="pp-eng">{t('Recognition')}</span>
    <Seg labelledby="pp-eng" value={useHelper ? 'helper' : 'device'} onchange={setEngine} options={[{ key: 'device', name: t('On this device') }, { key: 'helper', name: t('KI-Helfer (online)') }]} />
    {#if prefs.engine === 'helper' && !helperOk}
      <p class="tool-status">{t('The KI-Helfer is not switched on. Set it up under Me › KI-Helfer; until then the device recognises.')} <a href="#/helper">{t('KI-Helfer')}</a></p>
    {:else if useHelper}
      <p class="tool-muted">{t('More exact, needs internet. The photo leaves your device only when you tap «Send photo».')}</p>
    {:else}
      <p class="tool-muted">{t('Private and offline. The first time the app downloads the recognition once (about 30 MB, best on Wi-Fi).')}</p>
    {/if}
  </div>

  <div class="tool-row">
    <button type="button" class="btn hi" onclick={() => camIn.click()} disabled={step === 'loading' || step === 'looking' || step === 'sending'}><Camera size={16} aria-hidden="true" />{t('Take photo')}</button>
    <button type="button" class="btn" onclick={() => galIn.click()} disabled={step === 'loading' || step === 'looking' || step === 'sending'}><ImagePlus size={16} aria-hidden="true" />{t('From gallery')}</button>
    <input bind:this={camIn} type="file" accept="image/*" capture="environment" hidden onchange={pick} data-pp-camera />
    <input bind:this={galIn} type="file" accept="image/*" hidden onchange={pick} data-pp-file />
  </div>

  {#if step === 'loading'}<p class="tool-status" role="status">{t('Loading the recognition … (the first time takes a moment)')}</p>{/if}
  {#if step === 'looking'}<p class="tool-status" role="status">{t('Looking at the photo …')}</p>{/if}
  {#if step === 'sending'}<p class="tool-status" role="status">{t('The KI-Helfer looks at the photo …')}</p>{/if}
  {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}

  {#if canvas}<canvas class="pp-photo" bind:this={shown} aria-label={t('Your photo with the things found')}></canvas>{/if}

  {#if step === 'send'}
    <div class="pp-send">
      <p class="tool-help">{t('The photo goes once to the KI-Helfer (Claude by Anthropic), with the names of your list. It is not stored in the app.')}</p>
      <div><button type="button" class="btn hi" onclick={send} data-pp-send><Send size={16} aria-hidden="true" />{t('Send photo')}</button></div>
    </div>
  {/if}

  {#if done}
    <p class="tool-status pp-done" role="status">{done.text}
      <button type="button" class="pp-link" onclick={done.undo}><Undo2 size={14} aria-hidden="true" />{t('Undo')}</button>
      {#if done.link}<a href={done.link}>{t('Show in gear')}</a>{/if}
    </p>
  {/if}

  {#if result}
    {#if prefs.mode === 'tick'}
      {#if result.tick.length}
        <h3 class="pp-h">{t('Recognised on your list')}</h3>
        <ul class="tool-list pp-list">
          {#each result.tick as r (r.itemId)}
            <li data-pp-row={r.itemId}>
              <label class="pp-pick"><input type="checkbox" bind:checked={picked[r.itemId]} />
                {#if r.region?.thumb}<img src={r.region.thumb} alt="" />{/if}
                {#if markOf(r)}<span class="pp-n">{markOf(r)}</span>{/if}
                <span class="pp-name">{r.name}<small>{r.by === 'learned' ? t('remembered') : r.by === 'helper' ? t('KI-Helfer') : t('from the photo')}</small></span>
              </label>
            </li>
          {/each}
        </ul>
        <div><button type="button" class="btn hi" disabled={!nTick} onclick={applyTick} data-pp-apply>{tn(nTick, 'Tick {n} item', 'Tick {n} items')}</button></div>
      {:else if !result.ask.length}
        <p class="tool-status">{t('Nothing of the open list recognised. Try more light, or the things further apart.')}</p>
      {/if}
      {#if result.packed.length}<p class="tool-muted">{t('Already ticked: {names}', { names: result.packed.join(', ') })}</p>{/if}
      {#if result.other.length}<p class="tool-muted">{t('Also on the photo, not on this list: {names}', { names: result.other.join(', ') })}</p>{/if}
    {:else}
      {#if result.add.length}
        <h3 class="pp-h">{t('New for your gear')}</h3>
        <ul class="tool-list pp-list">
          {#each result.add as r, i (i)}
            <li data-pp-new={i}>
              <input type="checkbox" bind:checked={picked[`n${i}`]} aria-label={t('Add «{name}»', { name: names[`n${i}`] ?? '' })} />
              {#if r.region?.thumb}<img src={r.region.thumb} alt="" />{/if}
              {#if markOf(r)}<span class="pp-n">{markOf(r)}</span>{/if}
              <input class="tool-input" bind:value={names[`n${i}`]} aria-label={t('Name|item')} />
            </li>
          {/each}
        </ul>
        <div><button type="button" class="btn hi" disabled={!nAdd} onclick={applyNew} data-pp-add>{tn(nAdd, 'Add {n} item to gear', 'Add {n} items to gear')}</button></div>
      {:else if !result.ask.length}
        <p class="tool-status">{t('Nothing new recognised.')}</p>
      {/if}
      {#if result.have.length}<p class="tool-muted">{t('Already in your gear: {names}', { names: result.have.map((x) => x.name).join(', ') })}</p>{/if}
    {/if}

    {#if result.ask.length}
      <h3 class="pp-h">{t('What is this?')}</h3>
      <p class="tool-muted">{t('Tell the app once; it remembers it on this device and finds it again next time.')}</p>
      <ul class="tool-list pp-list">
        {#each result.ask as r, i (r)}
          {@const a = answers[i] ?? {}}
          <li class="pp-ask" data-pp-ask={i}>
            {#if r.thumb}<img src={r.thumb} alt="" />{/if}
            <span class="pp-n ask">{markOf({ region: r })}</span>
            <div class="pp-askf">
              {#if prefs.mode === 'tick' && openList.length}
                <select class="tool-input" value={a.itemId ?? ''} onchange={(e) => (answers = { ...answers, [i]: { ...a, itemId: e.currentTarget.value } })} aria-label={t('Item on your list')}>
                  <option value="">{t('Choose from the list …')}</option>
                  {#each openList as it (it.id)}<option value={it.id}>{it.name}</option>{/each}
                </select>
              {/if}
              {#if !a.itemId}<input class="tool-input" placeholder={t('or type a name')} value={a.name ?? ''} oninput={(e) => (answers = { ...answers, [i]: { ...a, name: e.currentTarget.value } })} aria-label={t('Name|item')} />{/if}
              <div class="tool-row">
                <button type="button" class="btn sm" disabled={!a.itemId && !String(a.name ?? '').trim()} onclick={() => teachOne(i)} data-pp-teach>{t('Remember')}</button>
                <button type="button" class="btn sm" onclick={() => skipOne(i)}>{t('Leave out')}</button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if known.length}
    <details class="pp-known">
      <summary><Brain size={16} aria-hidden="true" /> {tn(known.length, '{n} thing remembered on this device', '{n} things remembered on this device')}</summary>
      <ul class="tool-list">
        {#each known as k (k.id)}
          <li><span class="pp-name">{k.itemId ? items.find((x) => x.id === k.itemId)?.name ?? k.name : k.name}</span><button type="button" class="pp-link" onclick={() => forgetOne(k.id)}>{t('Forget')}</button></li>
        {/each}
      </ul>
      <p class="tool-muted">{t('Only on this device; not in a backup or the sync.')}</p>
    </details>
  {/if}
</section>

<style>
  .pp-photo {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .pp-h {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-body);
  }
  .pp-list img {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 8px;
    flex: none;
  }
  .pp-pick {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex: 1;
    min-width: 0;
  }
  .pp-name {
    display: grid;
    min-width: 0;
    flex: 1;
    overflow-wrap: break-word;
  }
  .pp-name small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pp-n {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--ok);
    color: var(--paper);
    font-size: var(--fs-small);
    font-weight: 600;
    flex: none;
  }
  .pp-n.ask {
    background: var(--warn);
  }
  .pp-ask {
    align-items: flex-start !important;
  }
  .pp-askf {
    display: grid;
    gap: var(--sp-2);
    flex: 1;
    min-width: 0;
  }
  .pp-send {
    display: grid;
    gap: var(--sp-2);
  }
  .pp-done {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .pp-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .pp-known summary {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    cursor: pointer;
    color: var(--ink-2);
  }
  input[type='checkbox'] {
    width: 22px;
    height: 22px;
    flex: none;
  }
</style>
