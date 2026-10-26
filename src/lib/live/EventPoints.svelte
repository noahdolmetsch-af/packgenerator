<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «3», mockup G3): meeting points and the camp. Anyone in the
   * group sets a point (where you are, or at a km of the route), with a name and a time if you like;
   * everyone sees it on the map and in this list and can navigate there. Your own points you rename and
   * delete (asked first, with Undo). rows: memberRows with .part; mine: my part; onpart(patch).
   */
  import { MapPin, Navigation, Pencil, Trash2, Plus } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { POINT_KINDS, POINTS_MAX, kindOf, pointsOf, kmOfPoint, placeAtKm, newPart } from './event.js';
  import { navLinks } from './live-lib.js';
  import './event.css';

  let { rows = [], mine = {}, here = null, route = null, me = null, onpart = null, canSend = true } = $props();
  const all = $derived(pointsOf(rows).map((p) => ({ ...p, km: kmOfPoint(route, p), own: p.m === me })).sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9)));
  const own = $derived(mine?.points ?? []);

  let open = $state(false);
  let kind = $state('meet');
  let name = $state('');
  let time = $state('');
  let at = $state('here');
  let km = $state('');
  let err = $state('');
  let editing = $state(null);

  function start(p = null) {
    editing = p?.id ?? null;
    kind = p?.kind ?? 'meet';
    name = p?.name ?? '';
    time = p?.time ?? '';
    at = p ? 'keep' : here ? 'here' : 'km';
    km = '';
    err = '';
    open = true;
  }
  async function save() {
    err = '';
    let place = null;
    if (at === 'keep') place = own.find((p) => p.id === editing);
    else if (at === 'here') place = here ? { lat: here.lat, lon: here.lon } : null;
    else place = placeAtKm(route, Number(String(km).replace(',', '.')));
    if (!place) return (err = at === 'here' ? t('No location yet. Share your location first, or choose a km of the route.') : t('Write a km of the route.'));
    const p = { id: editing ?? newPart(), kind, name: name.trim() || t(kindOf(POINT_KINDS, kind).label), lat: place.lat, lon: place.lon, time: time || null };
    const list = editing ? own.map((x) => (x.id === editing ? p : x)) : [...own, p].slice(-POINTS_MAX);
    await onpart?.({ points: list });
    open = false;
  }
  async function remove(p) {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: p.name }), text: t('The point is gone for the whole group.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: p.name,
      text: t('«{name}» deleted.', { name: p.name }),
      run: async () => {
        const before = own;
        await onpart?.({ points: own.filter((x) => x.id !== p.id) });
        return before;
      },
      undo: (before) => onpart?.({ points: before }),
    });
  }
</script>

<section class="card ev-box" aria-labelledby="ep-h" data-event-points>
  <h2 id="ep-h">{t('Meeting points and camp')}</h2>
  {#if all.length}
    <ul class="ev-list">
      {#each all as p (`${p.m}-${p.id}`)}
        {@const k = kindOf(POINT_KINDS, p.kind)}
        <li data-event-point={p.kind}>
          <span class="ev-ic" aria-hidden="true">{k.icon}</span>
          <span class="ev-txt"><b>{p.name}{p.time ? ` ${p.time}` : ''}</b><small>{p.km != null ? t('at km {km} of the route', { km: num(p.km) }) : t(k.label)} · {p.own ? t('set by you') : t('set by {name}', { name: p.by || t('Without a name') })}</small></span>
          <span class="ev-acts">
            <a class="btn sm" href={navLinks({ lat: p.lat, lon: p.lon }).google} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />{t('Navigate')}</a>
            {#if p.own}
              <button type="button" class="btn sm" onclick={() => start(p)} aria-label={t('Change «{name}»', { name: p.name })} data-event-point-edit><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" onclick={() => remove(p)} aria-label={t('Delete «{name}»', { name: p.name })} data-event-point-del><Trash2 size={16} aria-hidden="true" /></button>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="ev-muted">{t('No meeting point yet. Set one: everyone sees it on the map and can navigate there.')}</p>
  {/if}

  {#if open}
    <div class="ev-box" data-event-point-form>
      <div class="ev-chips" role="group" aria-label={t('Kind')}>
        {#each POINT_KINDS as x (x.key)}
          <button type="button" class="ev-chip" aria-pressed={kind === x.key} onclick={() => (kind = x.key)} data-event-point-kind={x.key}>{x.icon} {t(x.label)}</button>
        {/each}
      </div>
      <div class="ev-row2">
        <label class="ev-fld"><span>{t('Name')}</span><input type="text" bind:value={name} maxlength="40" placeholder={t(kindOf(POINT_KINDS, kind).label)} data-event-point-name /></label>
        <label class="ev-fld"><span>{t('At what time? (optional)')}</span><input type="time" bind:value={time} data-event-point-time /></label>
      </div>
      <div class="ev-chips" role="group" aria-label={t('Where?')}>
        {#if editing}<button type="button" class="ev-chip" aria-pressed={at === 'keep'} onclick={() => (at = 'keep')}>{t('Same place')}</button>{/if}
        <button type="button" class="ev-chip" aria-pressed={at === 'here'} onclick={() => (at = 'here')} data-event-point-here><MapPin size={14} aria-hidden="true" /> {t('Where I am')}</button>
        {#if route}<button type="button" class="ev-chip" aria-pressed={at === 'km'} onclick={() => (at = 'km')} data-event-point-atkm>{t('At a km of the route')}</button>{/if}
      </div>
      {#if at === 'km'}<label class="ev-fld"><span>{t('km of the route')}</span><input type="text" inputmode="decimal" bind:value={km} data-event-point-km /></label>{/if}
      {#if err}<p class="rc-warn" role="alert">{err}</p>{/if}
      <div class="ev-acts">
        <button type="button" class="btn hi" onclick={save} disabled={!canSend} data-event-point-save>{editing ? t('Save') : t('Set for everyone')}</button>
        <button type="button" class="btn" onclick={() => (open = false)}>{t('Cancel')}</button>
      </div>
    </div>
  {:else}
    <div><button type="button" class="btn" onclick={() => start()} disabled={!canSend} data-event-point-add><Plus size={18} aria-hidden="true" />{t('Set a meeting point')}</button></div>
    <p class="ev-muted">{t('You can rename or delete your points later.')}</p>
  {/if}
</section>
