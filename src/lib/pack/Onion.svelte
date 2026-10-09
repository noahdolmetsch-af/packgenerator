<script>
  /**
   * v0.42.0 (Noah, picture draft B, answers 2-5, 12): the onion check, one quiet line under the
   * weather in Plan's conditions card; a tap opens it. Each layer and zone shows ✓ or a quiet gap;
   * a gap offers the best owned item ("+ Leg warmers"). Below, the temperature kit that fits the
   * coldest riding hour: one tap adds its missing items. Every add goes through Pack's change()
   * (one Undo) and shows a toast with Undo. Rules: wardrobe.js onionCheck, chooseKit, kitPlan.
   */
  import { Layers, Check, Circle, ChevronRight, ChevronDown, Plus } from '@lucide/svelte';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { tempRange } from '../wardrobe.js';

  let { check, kit = null, plan = null, offset = 0, itemsById = {}, added = [], kitAdded = null, onadd, onkit } = $props();

  let open = $state(false);
  const fresh = $derived(new Set(added));
  const tr = (s, v) => t(s, v);
  const range = (k) => tempRange(k.minC, k.maxC, tr);
  const summary = $derived(check.gaps ? tn(check.gaps, 'Onion: {n} gap', 'Onion: {n} gaps') : t('Onion: fits'));
  const when = $derived.by(() => {
    if (check.from !== 'hour' || !check.date) return t('lowest {c} °C', { c: check.real });
    const day = new Date(`${check.date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short' });
    return t('coldest riding hour {c} °C ({day}, {h} h)', { c: check.real, day, h: check.hour });
  });
  const gapText = (r) => {
    if (r.rain) return t('rain from {n} %: nothing waterproof on the list', { n: check.pct ?? 30 });
    if (r.items.length) return t('{names}: too light for {c} °C', { names: r.items.map(nameOf).join(' · '), c: check.c });
    return r.below ? t('{zone} below {n} °C: nothing packed', { zone: t(r.name), n: r.below }) : t('nothing packed');
  };
</script>

<div class="onion">
  <button type="button" class="oline" aria-expanded={open} aria-controls="onion-rows" onclick={() => (open = !open)}>
    <Layers size={18} aria-hidden="true" /><span class="s">{summary}</span>
    {#if open}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
  </button>
  {#if open}
    <div id="onion-rows">
      <ul class="orows">
        {#each check.rows as r (r.key)}
          <li class:fresh={r.items.some((i) => fresh.has(i.id))}>
            <span class="ic" class:ok={r.ok}>{#if r.ok}<Check size={18} aria-label={t('covered')} />{:else}<Circle size={16} aria-label={t('gap')} />{/if}</span>
            <b class="nm">{t(r.name)}</b>
            <span class="what">
              {#if r.ok}
                {r.items.length ? r.items.map((i) => nameOf(i)).join(' · ') : t('not needed')}{#each r.items.filter((i) => fresh.has(i.id)) as i (i.id)}<i class="badge">{t('new')}</i>{/each}
              {:else}
                <span class="gap">{gapText(r)}</span>
                {#if r.fix}<button type="button" class="btn sm add" onclick={() => onadd([r.fix.id], nameOf(r.fix))}><Plus size={16} aria-hidden="true" />{t('{name} in', { name: nameOf(r.fix) })}</button>{/if}
              {/if}
            </span>
          </li>
        {/each}
      </ul>
      {#if kit && plan && plan.items.length}
        <div class="kit">
          {#if plan.add.length}
            <button type="button" class="btn sm kbtn" onclick={() => onkit(kit)}><Plus size={16} aria-hidden="true" />{t('Kit {range} in', { range: range(kit) })}</button>
            <p class="meta">{kit.name} · {tn(plan.items.length, '{n} item', '{n} items')}, {t('{n} already in', { n: plan.have.length })} · {when}{offset ? ` · ${t('borders {n} °C', { n: offset > 0 ? `+${offset}` : offset })}` : ''}</p>
          {:else}
            <span class="kdone"><Check size={16} aria-hidden="true" />{t('Kit {range} is in', { range: range(kit) })}</span>
            <p class="meta">{#if kitAdded?.key === kit.key && kitAdded.ids.length}{t('added: {names}', { names: kitAdded.ids.map((id) => (itemsById[id] ? nameOf(itemsById[id]) : id)).join(', ') })}{:else}{kit.name} · {when}{/if}</p>
          {/if}
        </div>
      {:else}
        <p class="meta">{when}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .onion {
    margin: 2px 6px 0;
    border-top: 1px solid var(--line);
  }
  .oline {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 4px 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 15px/1.25 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .oline :global(svg) {
    color: var(--ink-3);
    flex: none;
  }
  .oline .s {
    flex: 1;
    min-width: 0;
  }
  .orows {
    list-style: none;
    margin: 0 4px;
    padding: 0;
  }
  .orows li {
    display: grid;
    grid-template-columns: 26px minmax(4.5em, auto) minmax(0, 1fr);
    align-items: start;
    gap: 4px 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .orows li.fresh {
    box-shadow: inset 3px 0 0 var(--ok);
    padding-left: 4px;
  }
  .ic {
    display: inline-grid;
    place-items: center;
    height: 22px;
    color: var(--ink-3);
  }
  .ic.ok {
    color: var(--ok);
  }
  .nm {
    font-weight: 600;
  }
  .what {
    min-width: 0;
    color: var(--ink-2);
    font-size: 14px;
    overflow-wrap: break-word;
  }
  .gap {
    display: block;
  }
  .add {
    margin-top: 6px;
    min-height: 44px;
    max-width: 100%;
    overflow-wrap: break-word;
    text-align: left;
  }
  .badge {
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    border: 1px solid var(--line);
  }
  .kit {
    margin: 0 4px;
    padding: 10px 0 4px;
    border-top: 1px solid var(--line);
  }
  .kbtn {
    min-height: 44px;
    border-radius: 99px;
  }
  .kdone {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 99px;
    color: var(--ink-2);
    font-weight: 500;
  }
  .kdone :global(svg) {
    color: var(--ok);
  }
  .meta {
    margin: 6px 0 4px;
    color: var(--ink-3);
    font-size: 13px;
    overflow-wrap: break-word;
  }
  #onion-rows > .meta {
    margin: 4px 4px 8px;
  }
</style>
