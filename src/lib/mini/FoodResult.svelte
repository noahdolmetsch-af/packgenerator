<script>
  /**
   * Mini-Tools «Essen und Unverträglichkeiten» (idea 7): how many eat, which diets, the allergies on top, who eats
   * what, and a shopping list for a menu (pasta evening, barbecue, breakfast) with the right swaps.
   * q: as kept in db.settings «mini-tools» (lib/mini/store.js), with my own answer in q.me (or null).
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { updateOne } from './store.js';
  import { DIETS, SIZES, MENUS, countFood, shoppingList, shoppingText } from './essen.js';
  import { MessageCircle, Copy, TriangleAlert, ShoppingCart } from '@lucide/svelte';

  let { q } = $props();
  const rows = $derived([...(q.me ? [{ ...q.me, name: t('You'), me: true }] : []), ...(q.answers ?? [])]);
  const c = $derived(countFood(rows));
  const menu = $derived(MENUS.find((m) => m.key === q.menu) ?? MENUS[0]);
  const list = $derived(shoppingList(menu, rows));
  const text = $derived(shoppingText(`${q.title}: ${t(menu.label)}`, list, t));
  const wa = $derived(`https://wa.me/?text=${encodeURIComponent(text)}`);
  const dietLabel = (k) => t(DIETS.find((d) => d.key === k)?.label ?? k);
  const sizeLabel = (k) => t(SIZES.find((s) => s.key === k)?.label ?? '');
  const peopleText = (n) => (n === 1 ? t('1 person') : t('{n} people', { n }));
  let said = $state('');

  const setMenu = (key) => updateOne(db, q.id, (x) => ({ ...x, menu: key }));
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      said = t('Shopping list copied.');
    } catch {
      said = t('Copying did not work. Select the list and copy it by hand.');
    }
  }
</script>

<section class="card fr-box" aria-labelledby="fr-h" data-fr>
  <h2 id="fr-h">{t('{n} eat along', { n: c.people })}</h2>
  {#if c.people}
    <ul class="fr-chips" data-fr-diets>
      {#each DIETS.filter((d) => c.diets[d.key]) as d (d.key)}<li>{t(d.label)} <b>{c.diets[d.key]}</b></li>{/each}
      {#if !DIETS.some((d) => c.diets[d.key])}<li>{t('No special diets')}</li>{/if}
    </ul>
  {:else}
    <p class="fr-help" data-fr-empty>{t('No answers yet. Share the link, then look for new answers.')}</p>
  {/if}
  {#if c.notes.length}
    <div class="fr-warn" role="note" data-fr-notes>
      <TriangleAlert size={18} aria-hidden="true" />
      <ul>{#each c.notes as x, i (i)}<li><b>{x.name || t('Without a name')}:</b> {x.other}</li>{/each}</ul>
    </div>
  {/if}
</section>

{#if rows.length}
  <section class="card fr-box" aria-labelledby="fr-who-h">
    <h2 id="fr-who-h">{t('Who eats what')}</h2>
    <ul class="fr-rows" data-fr-rows>
      {#each rows as r, i (r.a ?? `me-${i}`)}
        <li>
          <b>{r.name || t('Without a name')}</b>
          <span>{peopleText(r.n ?? 1)} · {sizeLabel(r.size)}{(r.diets ?? []).length ? ` · ${(r.diets ?? []).map(dietLabel).join(', ')}` : ''}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="card fr-box" aria-labelledby="fr-shop-h" data-fr-shop>
    <h2 id="fr-shop-h"><ShoppingCart size={18} aria-hidden="true" /> {t('Shopping list')}</h2>
    <div class="fr-menus" role="radiogroup" aria-label={t('Menu')}>
      {#each MENUS as m (m.key)}<button type="button" role="radio" class="fr-menu" class:on={menu.key === m.key} aria-checked={menu.key === m.key} onclick={() => setMenu(m.key)} data-fr-menu={m.key}>{t(m.label)}</button>{/each}
    </div>
    <ul class="fr-list" data-fr-list>
      {#each list as x (x.name + x.unit)}<li><span class="fr-q">{x.q} {t(x.unit)}</span><span>{t(x.name)}</span></li>{/each}
    </ul>
    <p class="fr-help">{t('Amounts for normal appetite, rounded up. Swaps for the diets are already in.')}</p>
    <div class="fr-acts">
      <button type="button" class="btn" onclick={copy} data-fr-copy><Copy size={16} aria-hidden="true" />{t('Copy list')}</button>
      <a class="btn" href={wa} target="_blank" rel="noopener" data-fr-wa><MessageCircle size={16} aria-hidden="true" />{t('Send to the group')}</a>
    </div>
    {#if said}<p class="fr-help" role="status">{said}</p>{/if}
  </section>
{/if}

<style>
  .fr-box {
    display: grid;
    gap: var(--sp-3);
    min-width: 0;
  }
  .fr-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .fr-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fr-chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fr-chips li {
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--paper-2);
  }
  .fr-warn {
    display: flex;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border-radius: 10px;
    background: var(--warn-soft);
  }
  .fr-warn ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  .fr-rows,
  .fr-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .fr-rows li {
    display: grid;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .fr-rows li:last-child {
    border-bottom: 0;
  }
  .fr-rows span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fr-list li {
    display: grid;
    grid-template-columns: 6rem 1fr;
    gap: var(--sp-2);
  }
  .fr-q {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    text-align: right;
  }
  .fr-menus {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fr-menu {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .fr-menu.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .fr-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
