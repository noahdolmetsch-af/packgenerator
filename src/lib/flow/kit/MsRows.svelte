<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv» (A8 «Bald erreichbar»): milestones as rows: the star, the name with
   * the next star and the activity, a bar to the next star and «3'240 von 4'000». list: flowms evaluate();
   * label(r): the activity's name or ''.
   */
  import { Star } from '@lucide/svelte';
  import { msName, starLine, val } from '../hobby/words.js';
  import { t } from '../../i18n.svelte.js';

  let { list = [], label = () => '' } = $props();
</script>

<ul class="msr card">
  {#each list as r (r.id)}
    <li data-ms={r.id} class:soon={r.soon}>
      <span class="ib" aria-hidden="true"><Star size={18} /></span>
      <span class="tx"><b>{msName(r.m)}</b><small>{r.next ? starLine(r.next) : t('all stars')}{#if label(r)}{' · '}{label(r)}{/if}</small></span>
      <span class="bar" role="img" aria-label={t('{n} of {m}', { n: val(r.value, r.m.unit), m: val(r.target, r.m.unit) })}><i style:width="{Math.round(r.progress * 100)}%"></i></span>
      <span class="v num">{t('{n} of {m}', { n: val(r.value, r.m.unit), m: val(r.target, r.m.unit) })}</span>
    </li>
  {/each}
</ul>

<style>
  .msr {
    margin: 0;
    padding: 0 var(--sp-4);
    list-style: none;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
    min-height: 60px;
    padding: var(--sp-2) 0;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .tx {
    flex: 1 1 160px;
    min-width: 0;
    line-height: 1.3;
  }
  .tx b {
    display: block;
    font-weight: 500;
  }
  .tx small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .bar {
    flex: 0 0 140px;
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: 99px;
    background: var(--ink-3);
  }
  .soon .bar i {
    background: var(--warn);
  }
  .v {
    min-width: 88px;
    text-align: right;
    font-size: var(--fs-small);
  }
  @media (max-width: 599px) {
    .tx {
      flex-basis: calc(100% - 50px);
    }
    .bar {
      flex: 1 1 auto;
      margin-left: 46px;
    }
  }
</style>
