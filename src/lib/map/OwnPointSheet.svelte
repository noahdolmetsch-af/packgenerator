<script>
  /**
   * Paket U2 «Karte» › Eigene Punkte: the window to add or change one of your points (name, kind, note).
   * «Move» closes it and waits for a tap on the map at the new spot; «Delete» asks first (the caller
   * offers Undo). point: { id?, lat, lon, name, note, kind }; fresh: a new point (no Delete, no Move).
   * onsave(point) → saves; ondelete(point); onmove(point); onclose().
   */
  import { untrack } from 'svelte';
  import { Move } from '@lucide/svelte';
  import RaceSheet from '../race/RaceSheet.svelte';
  import { pointKindName, pointKindsOffered } from './ownkinds.js';
  import { t } from '../i18n.svelte.js';

  let { point, fresh = false, onsave, ondelete = null, onmove = null, onclose } = $props();
  let draft = $state(untrack(() => ({ name: point.name ?? '', note: point.note ?? '', kind: point.kind ?? 'note' })));
  const where = $derived(`${Number(point.lat).toFixed(5)}, ${Number(point.lon).toFixed(5)}`);
  let moving = false;
</script>

<RaceSheet
  title={fresh ? t('New point') : t('Change {name}', { name: point.name || pointKindName(point.kind, t) })}
  sub={t('Your points show on every map, for every trip.')}
  onsave={() => onsave({ ...point, name: draft.name.trim(), note: draft.note.trim(), kind: draft.kind })}
  ondelete={fresh ? null : () => ondelete?.(point)}
  onclose={() => {
    if (moving) onmove?.(point);
    onclose();
  }}
>
  <label class="rc-lab">{t('Name')}<input class="inp" bind:value={draft.name} maxlength="120" placeholder={t('e.g. Fountain at the church')} data-own-name /></label>
  <label class="rc-lab">{t('Kind')}
    <select class="inp" bind:value={draft.kind} data-own-kind>
      {#each pointKindsOffered(point.kind) as k (k.id)}<option value={k.id}>{pointKindName(k.id, t)}</option>{/each}
    </select>
    <small class="rc-kinds" data-own-kinds>{t('Change the kinds: Me › Lists and types')}</small>
  </label>
  <label class="rc-lab">{t('Note')}<textarea class="inp" rows="3" bind:value={draft.note} maxlength="1000" data-own-note></textarea></label>
  <p class="rc-note">{t('Place: {where}', { where })}</p>
  {#if !fresh && onmove}
    <button
      type="button"
      class="btn"
      onclick={(e) => {
        moving = true;
        e.currentTarget.closest('dialog')?.close();
      }}
      data-own-move
    ><Move size={16} aria-hidden="true" />{t('Move: tap the new spot on the map')}</button>
  {/if}
</RaceSheet>

<style>
  .rc-kinds {
    display: inline-flex;
    min-height: 32px;
    align-items: center;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
</style>
