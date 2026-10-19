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
  import { OWN_KINDS } from './ownpoints.js';
  import { t } from '../i18n.svelte.js';

  let { point, fresh = false, onsave, ondelete = null, onmove = null, onclose } = $props();
  let draft = $state(untrack(() => ({ name: point.name ?? '', note: point.note ?? '', kind: point.kind ?? 'note' })));
  const where = $derived(`${Number(point.lat).toFixed(5)}, ${Number(point.lon).toFixed(5)}`);
  let moving = false;
</script>

<RaceSheet
  title={fresh ? t('New point') : t('Change {name}', { name: point.name || t(OWN_KINDS.find((k) => k.key === point.kind)?.name ?? 'Note|point') })}
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
      {#each OWN_KINDS as k (k.key)}<option value={k.key}>{t(k.name)}</option>{/each}
    </select>
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
