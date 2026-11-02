<script>
  /**
   * «Meilensteine aktiver machen» PR 1 (Noah 01.11.2026 «1a», «alle vier Stellen»): «Deine nächsten Sterne» inside
   * the tile «Aktiv heute»: the three stars that are closest, each with a bar and «noch 2×». A tap opens the
   * sport. Hide it with «Ausblenden» (a setting, any time «Nächste Sterne zeigen» brings it back).
   */
  import { liveQuery } from 'dexie';
  import { Star } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { nextStars, readNextStars, HIDE_KEY } from './nextstars.js';
  import { msName, val } from '../flow/hobby/words.js';
  import { actName } from '../flow/ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();
  const q = $derived(liveQuery(() => readNextStars(db, today)));
  const d = $derived($q);
  const rows = $derived(d ? nextStars(d.acts, d.ctx, d.stored, d.tune) : []);
  const hide = (off) => putSetting(db, HIDE_KEY, off ? { off: true } : null);
  const leftWord = (x) => t('{left} to go', { left: val(x.left, x.r.m.unit) });
</script>

{#if d && rows.length && !d.hidden}
  <div class="ns" data-next-stars aria-labelledby="ns-h">
    <div class="hd">
      <h3 id="ns-h"><Star size={16} aria-hidden="true" />{t('Your next stars')}</h3>
      <button type="button" class="lk" data-next-stars-hide onclick={() => hide(true)}>{t('Hide|next stars')}</button>
    </div>
    <ul>
      {#each rows as x (x.actId)}
        <li>
          <a href="#/flow/sport/{encodeURIComponent(`act:${x.actId}`)}">
            <span class="l"><b>{actName(x.act)} · {msName(x.r.m)}</b><span class="num">{leftWord(x)}</span></span>
            <span class="bar" aria-hidden="true"><span style:width="{Math.round(x.r.progress * 100)}%"></span></span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
{:else if d && rows.length && d.hidden}
  <button type="button" class="lk" data-next-stars-show onclick={() => hide(false)}>{t('Show next stars')}</button>
{/if}

<style>
  .ns {
    display: grid;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: grid;
    gap: 4px;
    min-height: 44px;
    align-content: center;
    color: var(--ink);
    text-decoration: none;
  }
  .l {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .l b {
    font-weight: 600;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .l .num {
    color: var(--ink-3);
    white-space: nowrap;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .lk {
    min-height: 44px;
    padding: 0 4px;
    background: none;
    border: 0;
    color: var(--ink-3);
    font: 600 var(--fs-small)/1 var(--font-body);
    cursor: pointer;
    text-decoration: underline;
  }
</style>
