<script>
  /**
   * Paket D «Vorlage teilen»: a building block (UC-027: the logic of a set – names and amounts, no
   * photos, no ids) or the layout of your pages and menu (UC-319: order and hidden parts, without your
   * own names) as a link. The friend sees what it changes first and maps it to their own things.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { SETS_KEY, allSets, qtyOf, blockLabel } from '../sets.js';
  import { setEnvelope, layoutOnly, layoutCount, cleanEnvelope, newId } from './freunde.js';
  import { anp } from '../anpassen.svelte.js';
  import SendBox from './SendBox.svelte';
  import { Share2 } from '@lucide/svelte';

  let { me = '' } = $props();
  const today = localDay();
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const itemsQ = liveQuery(() => db.items.toArray());
  const items = $derived(($itemsQ ?? []).filter((i) => i.ownership !== 'gone'));
  const sets = $derived(allSets($setsQ?.value).map((s) => ({ ...s, members: items.filter((i) => i.sets?.includes(s.key)) })).filter((s) => s.members.length));
  let key = $state('');
  let sending = $state(null);
  const layout = $derived(layoutOnly(anp.cfg));
  const lc = $derived(layoutCount(layout));

  function sendSet() {
    const s = sets.find((x) => x.key === key);
    if (!s) return;
    sending = setEnvelope({ name: blockLabel(s), note: s.note }, s.members, nameOf, (i) => i.category ?? '', (id) => qtyOf(s, id), me, today);
  }
  const sendLayout = () => (sending = cleanEnvelope({ v: 1, pg: 'f', k: 'layout', id: newId('y'), by: me, at: today, cfg: layout }));
</script>

<section class="fr-card" aria-labelledby="fr-t1-h" data-fr-tpl="set">
  <h3 id="fr-t1-h" class="title">{t('A building block')}</h3>
  <p class="fr-fine">{t('Only the names and amounts go along. Your friend chooses their own thing for each line and keeps their own changes.')}</p>
  {#if sets.length}
    <label class="fr-f"><span>{t('Building block')}</span>
      <select bind:value={key} data-fr-set>
        <option value="">{t('Choose a building block')}</option>
        {#each sets as s (s.key)}<option value={s.key}>{blockLabel(s)} · {tn(s.members.length, '{n} thing', '{n} things')}</option>{/each}
      </select>
    </label>
    <div class="fr-row"><button type="button" class="btn hi" disabled={!key} onclick={sendSet} data-fr-sendset><Share2 size={16} aria-hidden="true" />{t('Share the block')}</button></div>
  {:else}
    <p class="fr-fine">{t('No building block with things yet. Make one in Gear › Building blocks.')}</p>
  {/if}
</section>

<section class="fr-card" aria-labelledby="fr-t2-h" data-fr-tpl="layout">
  <h3 id="fr-t2-h" class="title">{t('Your layout')}</h3>
  <p class="fr-fine">{t('The order of your pages and menu and what you hid, without your own names and without data: for another device or a friend.')}</p>
  <p class="fr-fine">{lc.pages || lc.menu || lc.tabs ? `${tn(lc.pages, '{n} page changed', '{n} pages changed')} · ${lc.menu ? t('menu changed') : t('menu as at the start')} · ${tn(lc.tabs, '{n} place with own tabs', '{n} places with own tabs')}` : t('You have not changed any page yet: «Customise this page» at the bottom of a page does it.')}</p>
  <div class="fr-row"><button type="button" class="btn" disabled={!(lc.pages || lc.menu || lc.tabs)} onclick={sendLayout} data-fr-sendlayout><Share2 size={16} aria-hidden="true" />{t('Share the layout')}</button></div>
</section>

{#if sending}<section class="fr-card"><SendBox env={sending} text={sending.k === 'set' ? t('A building block for you: {name}', { name: sending.name }) : t('My layout of the Pack Generator')} ondone={() => (sending = null)} /></section>{/if}
