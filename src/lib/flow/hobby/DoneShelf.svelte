<script>
  /**
   * «Meilensteine motivierender» PR 2 (Noah 21.11.2026 «1-5 a», Idee 3): the shelf «Ganz geschafft»: every milestone with
   * all its stars as a gold tile with its best value and the day of its last star. The tiles leave the list
   * «Alle Meilensteine». list: evaluated milestones with `done`; label(r): the sport's name or ''.
   */
  import { Star } from '@lucide/svelte';
  import { msName, val } from './words.js';
  import { dayShort } from '../words.js';
  import { t, tn } from '../../i18n.svelte.js';

  let { list = [], label = () => '', title = (r) => msName(r.m), embedded = false } = $props();
</script>

<section class="shelf" class:card={!embedded} class:emb={embedded} data-done-shelf aria-labelledby="done-h">
  {#if embedded}<h3 id="done-h">{t('Fully done')}</h3>{:else}<h2 id="done-h">{t('Fully done')}</h2>{/if}
  <p class="sub">{tn(list.length, '{n} milestone with all stars. Every star is yours for ever.', '{n} milestones with all stars. Every star is yours for ever.')}</p>
  <ul>
    {#each list as r (r.id)}
      <li data-done-ms={r.id}>
        <span class="h"><Star size={16} aria-hidden="true" /><b>{title(r)}</b></span>
        <span class="nn num">{val(r.best, r.m.unit)}</span>
        {#if label(r)}<small>{label(r)}</small>{/if}
        <small>{t('Last star on {date}', { date: dayShort(r.reached.at(-1)?.day ?? '') })}</small>
      </li>
    {/each}
  </ul>
</section>

<style>
  .shelf {
    padding: var(--sp-4);
    border-color: var(--l2);
    background: linear-gradient(180deg, var(--warn-soft), var(--paper));
    min-width: 0;
  }
  .emb {
    padding: 0;
    border: 0;
    background: none;
  }
  h2,
  h3 {
    margin: 0;
    font: 700 var(--fs-section) / 1.25 var(--font-body);
  }
  .sub {
    margin: 2px 0 var(--sp-3);
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--l2);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .h {
    display: flex;
    gap: var(--sp-1);
    align-items: flex-start;
    line-height: 1.3;
  }
  .h :global(svg) {
    flex: none;
    margin-top: 2px;
    fill: var(--l2);
    color: var(--l2);
  }
  .h b {
    min-width: 0;
    font-weight: 600;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .nn {
    font: 700 var(--fs-sub) / 1.2 var(--font-body);
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
