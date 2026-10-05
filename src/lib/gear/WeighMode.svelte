<script>
  import { db } from '../db.js';
  import { weighQueue, parseGrams, CATEGORY, isInventory } from '../gear.js';
  import { t, nameOf } from '../i18n.svelte.js';

  /** items = all items (live); one item at a time, like standing at the scale */
  let { items, onclose = null } = $props();

  let skipped = $state([]); // IDs skipped in this session, they come back at the end
  let done = $state(0);
  let grams = $state('');
  let error = $state('');

  const queue = $derived.by(() => {
    const q = weighQueue(items);
    return [...q.filter((i) => !skipped.includes(i.id)), ...q.filter((i) => skipped.includes(i.id))];
  });
  const current = $derived(queue[0]);
  // Progress over the whole inventory (design audit G5).
  const owned = $derived(items.filter(isInventory));
  const weighed = $derived(owned.filter((i) => i.weightG != null).length);
  const pct = $derived(owned.length ? Math.round((weighed / owned.length) * 100) : 0);
  let input = $state(null);

  async function save(event) {
    event.preventDefault();
    const g = parseGrams(grams);
    if (g == null) {
      error = t('Type the weight in whole grams, from 1 to 30,000.');
      return;
    }
    // A pair (qty 2) is usually weighed together: store the weight of one piece.
    const perPiece = Math.round(g / (current.qty || 1));
    await db.items.update(current.id, { weightG: perPiece, weightStatus: 'measured', updatedAt: new Date().toISOString() });
    skipped = skipped.filter((id) => id !== current.id);
    done++;
    grams = '';
    error = '';
    input?.focus();
  }

  function skip() {
    skipped = [...skipped.filter((id) => id !== current.id), current.id];
    grams = '';
    error = '';
    input?.focus();
  }
</script>

<section class="weigh" aria-labelledby="weigh-h">
  <div class="head">
    <h2 id="weigh-h" class="title">{t('To weigh')}</h2>
    <span class="num">{t('{n} left', { n: queue.length })}{done ? ` · ${t('{n} weighed now', { n: done })}` : ''}</span>
    {#if onclose}<button type="button" class="btn" onclick={onclose}>{t('Done')}</button>{/if}
  </div>
  <div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax={owned.length} aria-valuenow={weighed} aria-label={t('Weighed')}>
    <div class="pbar"><i style:width="{pct}%"></i></div>
    <span class="num">{t('{a} of {b} weighed', { a: weighed, b: owned.length })} · {pct} %</span>
  </div>

  {#if current}
    <div class="wrap">
    <form class="card" onsubmit={save} novalidate>
      <p class="cat"><span class="sw" style:background={CATEGORY[current.category]?.color}></span>{t(CATEGORY[current.category]?.name ?? '')} · {current.id}</p>
      <p class="name">{nameOf(current)}</p>
      {#if current.brand}<p class="sub">{current.brand}</p>{/if}
      {#if current.qty > 1}<p class="sub">{t('Weigh all {n} pieces together.', { n: current.qty })}</p>{/if}
      {#if current.weightNote}<p class="sub">{current.weightNote}</p>{/if}
      <label class="lbl" for="w-g">{t('Weight in grams')}</label>
      <div class="row">
        <input id="w-g" bind:this={input} class="inp big num" type="text" inputmode="numeric" autocomplete="off" placeholder="0" bind:value={grams} aria-describedby="w-err" />
        <span class="unit">g</span>
      </div>
      <p id="w-err" class="err" role="alert">{error}</p>
      <div class="row">
        <button type="submit" class="btn hi">{t('Save and next')}</button>
        <button type="button" class="btn" onclick={skip}>{t('Skip')}</button>
      </div>
      <p class="tip">{t('Enter saves and opens the next item.')}</p>
    </form>
    {#if queue.length > 1}
      <aside class="up">
        <span class="lbl">{t('Up next')}</span>
        <ol>
          {#each queue.slice(1, 8) as i (i.id)}<li><span class="sw" style:background={CATEGORY[i.category]?.color}></span>{nameOf(i)}</li>{/each}
        </ol>
        {#if queue.length > 8}<p class="more">{t('+{n} more', { n: queue.length - 8 })}</p>{/if}
      </aside>
    {/if}
    </div>
  {:else}
    <p class="card">{t('Everything you own is weighed.')} 🎉</p>
  {/if}
</section>

<style>
  .head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .head .title {
    font-size: 30px;
  }
  .head .num {
    color: var(--ink-3);
    flex: 1;
  }
  .prog {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    max-width: 900px;
    color: var(--ink-3);
    font-size: 14px;
  }
  .pbar {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .pbar i {
    display: block;
    height: 100%;
    background: var(--ink);
  }
  .wrap {
    display: grid;
    gap: 18px;
    max-width: 900px;
  }
  @media (min-width: 720px) {
    .wrap {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }
    form {
      padding: 22px 26px;
    }
    .name {
      font-size: 44px !important;
    }
  }
  .tip {
    margin: 10px 0 0;
    font-size: 13px;
    color: var(--ink-3);
  }
  .up ol {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .up li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
    color: var(--ink-2);
  }
  .up .sw {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    flex: none;
  }
  .more {
    color: var(--ink-3);
    font-size: 13px;
    margin: 6px 0 0;
  }
  .cat {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 13px;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
  }
  .name {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 34px;
    line-height: 1;
    margin: 6px 0;
  }
  .sub {
    margin: 0 0 6px;
    color: var(--ink-2);
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .big {
    font-size: 28px;
    max-width: 180px;
  }
  .unit {
    font-size: 22px;
    font-weight: 700;
  }
  .lbl {
    margin-top: 14px;
  }
  .err {
    color: #b42318;
    min-height: 1.2em;
    margin: 4px 0 8px;
    font-size: 14px;
  }
</style>
