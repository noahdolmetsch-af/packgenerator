<script>
  /**
   * A shared packing list, read only (answer 14). The list comes from the address itself;
   * nothing is read from or written to this device's data.
   */
  import { decodeShare } from '../lib/share.js';
  import { formatWeight } from '../lib/gear.js';

  let { code } = $props();
  let list = $state(undefined);
  $effect(() => {
    decodeShare(code).then((x) => (list = x));
  });
  const when = (l) =>
    l.d ? `${new Date(`${l.d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${l.n} ${l.n === 1 ? 'day' : 'days'}` : '';
  const count = (l) => l.g.reduce((t, [, its]) => t + its.length, 0);
</script>

<div class="share">
  {#if list === undefined}
    <p class="muted">Opening the list…</p>
  {:else if !list}
    <h1 class="title big">Link broken</h1>
    <p>This packing list could not be read. Ask for the link again.</p>
  {:else}
    <p class="lbl">Shared packing list</p>
    <h1 class="title big">{list.t}</h1>
    <p class="meta">{[when(list), list.b, `${count(list)} items`, list.w ? formatWeight(list.w) : ''].filter(Boolean).join(' · ')}</p>
    <p class="acts no-print"><button type="button" class="btn" onclick={() => window.print()}>Print or save as PDF</button><a class="link" href="#/">Open Pack Generator</a></p>
    <div class="bags">
      {#each list.g as [bag, its], n (n)}
        <section class="bag">
          <h2 class="title">{bag} <small>{its.length}</small></h2>
          <ul>
            {#each its as [name, qty, g], i (i)}
              <li><span class="box" aria-hidden="true"></span><span class="nm">{name}{#if qty > 1}<b> × {qty}</b>{/if}</span><span class="w num">{g == null ? '' : formatWeight(g)}</span></li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .share {
    max-width: 1100px;
    margin: 0 auto;
  }
  h1 {
    margin: 2px 0 0;
    font-size: clamp(36px, 8vw, 56px);
    line-height: 1;
  }
  .meta {
    margin-top: 4px;
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .link {
    color: var(--ink);
  }
  .bags {
    columns: 300px 3;
    column-gap: 20px;
  }
  .bag {
    break-inside: avoid;
    margin: 0 0 18px;
    padding: 12px 14px;
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
  }
  .bag h2 {
    margin: 0 0 6px;
    font-size: 22px;
  }
  .bag h2 small {
    font-size: 14px;
    color: var(--ink-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid var(--paper-2, #e6ebe3);
  }
  li:last-child {
    border-bottom: 0;
  }
  .box {
    flex: none;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--ink);
    border-radius: 3px;
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .w {
    color: var(--ink-3);
    font-size: 14px;
  }
  @media print {
    :global(nav.top) {
      display: none !important;
    }
    :global(body) {
      background: #fff !important;
    }
    .no-print {
      display: none;
    }
    .bag {
      border-color: #999;
    }
  }
</style>
