<script>
  /**
   * Paket K #280 «Bereit für heute?» + #206 «Hör-Tipp pro Tourart»: a calm card on the tour morning
   * (Unterwegs) and on every planned tour (Packen). From the night (Fitbit) and the last rides one line,
   * e.g. «eher kürzer», with the signs behind it; observation only. Below, your podcast or playlist for
   * this kind of tour, one tap away; add, rename and delete your own links (bereit.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { domainOf, domainName } from '../domains.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { startsTomorrow } from './morgen.js';
  import Morgen from './Morgen.svelte';
  import { readiness, kmByDay, LEVEL_TEXT, LISTEN_KEY, tipsOf, tipsFor, addTip, renameTip, dropTip } from './bereit.js';
  import { HeartPulse, Headphones, ExternalLink, Plus, Pencil, Trash2, Check } from '@lucide/svelte';
  import './unterwegs.css';

  let { trip, title = '' } = $props();
  const today = localDay();
  const from = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 40);
    return d.toISOString().slice(0, 10);
  })();
  const healthQ = liveQuery(() => db.healthDays.where('date').aboveOrEqual(from).sortBy('date'));
  const actQ = liveQuery(() => db.activities.where('day').aboveOrEqual(from).toArray());
  const ridesQ = liveQuery(() => db.rides.toArray());
  const tipsQ = liveQuery(() => db.settings.get(LISTEN_KEY));

  const r = $derived(readiness({ health: $healthQ ?? [], km: kmByDay($actQ ?? [], ($ridesQ ?? []).filter((x) => (x.date ?? '') >= from)), today }));
  const domain = $derived(domainOf(trip));
  // Paket 4 «Bereit für morgen?»: on the evening before, the card asks about tomorrow and adds hints
  const tomorrow = $derived(startsTomorrow(trip, today));
  const all = $derived(tipsOf($tipsQ?.value));
  const tips = $derived(tipsFor(all, domain));
  const save = (list) => db.settings.put({ key: LISTEN_KEY, value: list });

  let adding = $state(false);
  let name = $state('');
  let url = $state('');
  let msg = $state('');
  let editing = $state(null);
  let editName = $state('');
  async function add(e) {
    e.preventDefault();
    const list = addTip(all, { domain, name, url });
    if (!list) return (msg = t('Paste a web address that starts with https://'));
    await save(list);
    name = url = msg = '';
    adding = false;
  }
  async function rename(e, id) {
    e.preventDefault();
    await save(renameTip(all, id, editName));
    editing = null;
  }
  async function drop(x) {
    if ((await askDelete({ title: t('Delete this listening tip?'), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = all;
    await deleteWithUndo({ run: () => save(dropTip(before, x.id)), undo: () => save(before), text: t('"{name}" deleted.', { name: x.name }), name: x.name });
  }
</script>

<section class="card uw-ready lv-{r.level}" aria-labelledby="ready-h-{trip.id}" data-bereit={r.level}>
  <div class="uw-row">
    <span class="ib" aria-hidden="true"><HeartPulse size={20} /></span>
    <div class="grow">
      <h2 id="ready-h-{trip.id}" class="sh">{tomorrow ? t('Ready for tomorrow?') : title || t('Ready for today?')}</h2>
      <p class="line">{t(LEVEL_TEXT[r.level])}</p>
    </div>
  </div>
  {#if r.signs.length}
    <ul class="signs">{#each r.signs as s (s.key)}<li>{t(s.text, s.vars)}</li>{/each}</ul>
  {/if}
  {#if r.data}<p class="uw-fine">{t('Only an observation from your data; you decide.')}</p>{/if}
  {#if tomorrow}<Morgen {trip} />{/if}

  <div class="listen">
    <h3 class="uw-h3"><Headphones size={18} aria-hidden="true" /> {t('Listening tip for {kind}', { kind: t(domainName(domain)) })}</h3>
    {#if tips.length}
      <ul class="tl">
        {#each tips as x (x.id)}
          <li>
            {#if editing === x.id}
              <form class="uw-row" onsubmit={(e) => rename(e, x.id)}>
                <input class="inp grow" bind:value={editName} aria-label={t('Name')} />
                <button type="submit" class="btn sm"><Check size={16} aria-hidden="true" />{t('Save')}</button>
              </form>
            {:else}
              <a class="btn uw-listen" href={x.url} target="_blank" rel="noopener noreferrer"><Headphones size={18} aria-hidden="true" /><span>{x.name}</span><ExternalLink size={14} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a>
              <button type="button" class="tp-icon-btn" aria-label={t('Rename {name}', { name: x.name })} onclick={() => ((editing = x.id), (editName = x.name))}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="tp-icon-btn" aria-label={t('Delete {name}', { name: x.name })} onclick={() => drop(x)}><Trash2 size={16} aria-hidden="true" /></button>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if !adding}
      <p class="tp-small tp-muted">{t('Your podcast or playlist for this kind of tour, one tap before you ride.')}</p>
    {/if}
    {#if adding}
      <form class="addf" onsubmit={add}>
        <input class="inp" bind:value={name} placeholder={t('Name, e.g. Morning playlist')} aria-label={t('Name')} />
        <input class="inp" bind:value={url} type="url" inputmode="url" placeholder="https://open.spotify.com/…" aria-label={t('Link')} />
        <div class="uw-row"><button type="submit" class="btn ink" disabled={!url.trim()}>{t('Add')}</button><button type="button" class="btn" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
        {#if msg}<p class="tp-small" role="alert">{msg}</p>{/if}
      </form>
    {:else}
      <button type="button" class="tp-link" onclick={() => (adding = true)}><Plus size={14} aria-hidden="true" /> {t('Add a listening tip')}</button>
    {/if}
  </div>
</section>

<style>
  .uw-ready {
    display: grid;
    gap: 8px;
    margin: 0 0 16px;
  }
  .ib {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .sh,
  .line {
    margin: 0;
  }
  .line {
    margin-top: 2px;
  }
  .lv-short .line,
  .lv-easy .line {
    font-weight: 600;
  }
  .signs {
    margin: 0;
    padding-left: 20px;
  }
  .listen .uw-h3 {
    margin-top: 6px;
  }
  .tl {
    list-style: none;
    margin: 0 0 6px;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .tl li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .uw-listen {
    flex: 1;
    min-width: 0;
    justify-content: flex-start;
    gap: 8px;
  }
  .uw-listen span:first-of-type {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .addf {
    display: grid;
    gap: 8px;
  }
</style>
