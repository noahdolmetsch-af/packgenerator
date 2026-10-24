<script>
  /**
   * «Meilensteine als Belohnung» (Noah 22.10.2026 «4a»): right after a tick that reached a star, a small
   * own window «Neuer Stern» with the sport, the milestone and the number. No confetti, nothing jumps:
   * «Ansehen» opens the sport's milestones, «OK» closes it. FlowLayer draws it over every page.
   * ui.star = { entryId, actId, act (name), stars: [{ id, star, m, value, target }] }
   */
  import { Star } from '@lucide/svelte';
  import { backClose } from '../../ui/backclose.js';
  import { ui } from '../ui.svelte.js';
  import { msName, val, countsLine } from './words.js';
  import { t, tn } from '../../i18n.svelte.js';

  let dialog = $state();
  const s = $derived(ui.star);
  $effect(() => {
    if (s && dialog && !dialog.open) dialog.showModal();
    if (!s && dialog?.open) dialog.close();
  });
  const href = $derived(!s ? '#/flow/milestones' : s.actId === 'bike' ? '#/flow/milestones?act=bike' : `#/flow/sport/${encodeURIComponent(`act:${s.actId}`)}`);
  const close = () => (ui.star = null);
</script>

<dialog class="sheet centered starw" bind:this={dialog} use:backClose onclose={close} aria-labelledby="starw-h" data-star-window>
  {#if s}
    <div class="in">
      <span class="badge" aria-hidden="true"><Star size={26} /></span>
      <h2 id="starw-h" class="title">{tn(s.stars.length, 'New star', '{n} new stars')}</h2>
      <p class="sport">{s.act}</p>
      <ul>
        {#each s.stars as x (x.id)}
          <li>
            <b>{x.m ? msName(x.m) : ''}</b>
            <span>{t('Star {k}', { k: x.star })}{#if x.target != null} · {val(x.target, x.m?.unit)}{/if}</span>
            {#if x.m}<small>{countsLine(x.m)}</small>{/if}
          </li>
        {/each}
      </ul>
      <p class="muted">{t('Stars stay, even when a series breaks.')}</p>
      <div class="acts">
        <a class="btn hi" {href} onclick={close} data-star-open>{t('See milestones')}</a>
        <button type="button" class="btn" onclick={close}>{t('OK')}</button>
      </div>
    </div>
  {/if}
</dialog>

<style>
  .in {
    display: grid;
    gap: 10px;
    justify-items: center;
    text-align: center;
  }
  h2,
  p {
    margin: 0;
  }
  .badge {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--warn);
    border: 2px solid currentColor;
  }
  .sport {
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    width: 100%;
  }
  li {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  small {
    color: var(--ink-2);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
</style>
