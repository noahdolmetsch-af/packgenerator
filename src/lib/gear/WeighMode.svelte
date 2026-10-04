<script>
  import { db } from '../db.js';
  import { weighQueue, parseGrams, CATEGORY } from '../gear.js';

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

  async function save(event) {
    event.preventDefault();
    const g = parseGrams(grams);
    if (g == null) {
      error = 'Type the weight in whole grams, from 1 to 30,000.';
      return;
    }
    // A pair (qty 2) is usually weighed together: store the weight of one piece.
    const perPiece = Math.round(g / (current.qty || 1));
    await db.items.update(current.id, { weightG: perPiece, weightStatus: 'measured', updatedAt: new Date().toISOString() });
    skipped = skipped.filter((id) => id !== current.id);
    done++;
    grams = '';
    error = '';
  }

  function skip() {
    skipped = [...skipped.filter((id) => id !== current.id), current.id];
    grams = '';
    error = '';
  }
</script>

<section class="weigh" aria-labelledby="weigh-h">
  <div class="head">
    <h2 id="weigh-h" class="title">To weigh</h2>
    <span class="num">{queue.length} left{done ? ` · ${done} weighed now` : ''}</span>
    {#if onclose}<button type="button" class="btn" onclick={onclose}>Done</button>{/if}
  </div>

  {#if current}
    <form class="card" onsubmit={save} novalidate>
      <p class="cat"><span class="sw" style:background={CATEGORY[current.category]?.color}></span>{CATEGORY[current.category]?.name} · {current.id}</p>
      <p class="name">{current.name}</p>
      {#if current.brand}<p class="sub">{current.brand}</p>{/if}
      {#if current.qty > 1}<p class="sub">Weigh all {current.qty} pieces together.</p>{/if}
      {#if current.weightNote}<p class="sub">{current.weightNote}</p>{/if}
      <label class="lbl" for="w-g">Weight in grams</label>
      <div class="row">
        <input id="w-g" class="inp big num" type="text" inputmode="numeric" autocomplete="off" placeholder="0" bind:value={grams} aria-describedby="w-err" />
        <span class="unit">g</span>
      </div>
      <p id="w-err" class="err" role="alert">{error}</p>
      <div class="row">
        <button type="submit" class="btn hi">Save and next</button>
        <button type="button" class="btn" onclick={skip}>Skip</button>
      </div>
    </form>
  {:else}
    <p class="card">Everything you own is weighed. 🎉</p>
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
  form {
    max-width: 460px;
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
