<script>
  /**
   * Hobby pages (H17a): ONE reward from the wishlist, hung on a chosen star of a milestone. Shows how far
   * the star still is; «Change» opens three choices in place (milestone, star, wishlist item).
   * list: the evaluated milestones; reward: { msId, star, itemId } or null; wishlist: [{ id, name, nameDe }];
   * onsave(value | null).
   */
  import { Gift } from '@lucide/svelte';
  import { rewardState, rewardOf } from '../../flowms.js';
  import { msName, stageName, val } from './words.js';
  import { t, lang } from '../../i18n.svelte.js';

  let { list = [], reward = null, wishlist = [], onsave } = $props();
  const st = $derived(rewardState(reward, list));
  const item = $derived(wishlist.find((i) => i.id === rewardOf(reward)?.itemId) ?? null);
  const itemName = (i) => (i ? (lang.v === 'de' && i.nameDe ? i.nameDe : i.name) : '');
  let open = $state(false);
  let msId = $state('');
  let star = $state(1);
  let itemId = $state('');
  const chosen = $derived(list.find((r) => r.id === msId) ?? null);
  function edit() {
    const rw = rewardOf(reward);
    const first = list.find((r) => r.next) ?? list[0];
    msId = rw?.msId ?? first?.id ?? '';
    star = rw?.star ?? first?.next ?? 1;
    itemId = rw?.itemId ?? wishlist[0]?.id ?? '';
    open = true;
  }
  async function save() {
    if (!msId || !itemId) return;
    await onsave?.({ msId, star: Number(star), itemId });
    open = false;
  }
  async function clear() {
    await onsave?.(null);
    open = false;
  }
</script>

<div class="rw" class:set={!!st}>
  <span class="ri" aria-hidden="true"><Gift size={22} /></span>
  <div class="rt">
    {#if st && item}
      <b>{msName(st.r.m)} · {t('Star {k} «{stage}» ({n})', { k: st.star, stage: stageName(st.star), n: val(st.threshold, st.r.m.unit) })}</b>
      <small>{t('Reward from your wishlist:')} <strong>{itemName(item)}</strong> · {st.reached ? t('reached, enjoy it') : t('{n} to go', { n: val(st.left, st.r.m.unit) })}</small>
    {:else if wishlist.length}
      <b>{t('Hang a reward on a star')}</b>
      <small>{t('Something from your wishlist, for a star you choose.')}</small>
    {:else}
      <b>{t('Hang a reward on a star')}</b>
      <small>{t('Your wishlist is still empty.')} <a href="#/gear?tab=wishlist">{t('Open wishlist')}</a></small>
    {/if}
  </div>
  {#if wishlist.length && list.length}<button type="button" class="btn sm rbtn" aria-expanded={open} onclick={() => (open ? (open = false) : edit())}>{st && item ? t('Change') : t('Choose')}</button>{/if}
</div>
{#if open}
  <div class="rform">
    <label><span class="lbl">{t('Milestone')}</span>
      <select class="sel" bind:value={msId} onchange={() => (star = chosen?.next ?? 1)}>
        {#each list as r (r.id)}<option value={r.id}>{msName(r.m)}</option>{/each}
      </select>
    </label>
    <label><span class="lbl">{t('Star')}</span>
      <select class="sel" bind:value={star}>
        {#each chosen?.steps ?? [] as s, i (i)}<option value={i + 1}>{i + 1} · {stageName(i + 1)} ({val(s, chosen.m.unit)})</option>{/each}
      </select>
    </label>
    <label><span class="lbl">{t('Reward')}</span>
      <select class="sel" bind:value={itemId}>
        {#each wishlist as i (i.id)}<option value={i.id}>{itemName(i)}</option>{/each}
      </select>
    </label>
    <div class="ra">
      <button type="button" class="btn" onclick={save}>{t('Save')}</button>
      {#if st}<button type="button" class="btn" onclick={clear}>{t('No reward')}</button>{/if}
    </div>
  </div>
{/if}

<style>
  .rw {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 14px 16px;
    border: 1.5px dashed var(--l2);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .ri {
    flex: none;
    color: var(--l2);
    line-height: 0;
  }
  .rt {
    flex: 1 1 220px;
    min-width: 0;
    line-height: 1.35;
  }
  .rt b {
    display: block;
    font-weight: 600;
  }
  .rt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rbtn {
    min-height: 44px;
  }
  .rform {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px 14px;
    margin-top: 10px;
    padding: 14px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .rform select {
    width: 100%;
    min-height: 44px;
  }
  .ra {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .ra .btn {
    min-height: 44px;
  }
</style>
