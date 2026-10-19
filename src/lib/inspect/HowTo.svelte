<script>
  /**
   * «Velo-Inspektion» 2a: «So geht's» for one point of the checklist, offline: what to check, the tools,
   * short steps, the limit, the torque (from the Werkstatt-Spick, Paket I), the chain trend, «when to go
   * to the bike shop», one tip, and links to the sources (they open in a new tab). An own point shows
   * its note and its link.
   * point: from allPoints; name: its shown name; part: the bike's care part (for the trend); onclose().
   */
  import { X, Wrench, ExternalLink, Store, Lightbulb, Gauge, ListOrdered, TriangleAlert } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, num } from '../i18n.svelte.js';
  import { TORQUE } from '../spick.js';
  import { bikesHash } from '../bikes.js';
  import { LINKS, WHO } from './items.js';
  import { chainTrend } from './inspect.js';
  import '../bikes/velo-dlg.css';

  let { point, name, part = null, bikeId = null, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const torque = $derived((point.torque ?? []).map((k) => TORQUE.find((x) => x.key === k)).filter(Boolean));
  const trend = $derived(point.part === 'chain' && part ? chainTrend(part, part.limit ?? point.measure?.limit ?? 0.5) : null);
  const who = $derived(WHO.find((w) => w.key === point.who) ?? WHO[0]);
  const m = $derived(point.measure ?? null);
  const fmt = (n) => String(n).replace('.', ',');
</script>

<dialog class="sheet vdlg howto" bind:this={dialog} use:backClose {onclose} aria-labelledby="ht-h" data-howto={point.id}>
  <div class="vd-head">
    <div class="vd-t"><p class="kick">{t('How it works')}</p><h2 id="ht-h">{name}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if point.own}
    {#if point.note}<p class="txt">{point.note}</p>{:else}<p class="quiet">{t('Your own point. Add a note or a link under «Edit checklist».')}</p>{/if}
    {#if point.url}<p><a class="lk" href={point.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t('Your link ↗')}</a></p>{/if}
  {:else}
    <p class="who {point.who}" data-howto-who={point.who}><Store size={16} aria-hidden="true" /><span><b>{t(who.name)}</b>{#if point.shop}<small>{t(point.shop)}</small>{/if}</span></p>

    {#if point.tools?.length}
      <h3><Wrench size={16} aria-hidden="true" />{t('Tools')}</h3>
      <ul class="tools">{#each point.tools as x (x)}<li>{t(x)}</li>{/each}</ul>
    {/if}

    <h3><ListOrdered size={16} aria-hidden="true" />{t('Steps')}</h3>
    <ol class="steps">{#each point.steps as s, n (n)}<li>{t(s)}</li>{/each}</ol>

    {#if m?.limit != null}
      <h3><Gauge size={16} aria-hidden="true" />{t('Limit')}</h3>
      <p class="txt" data-howto-limit>
        {m.low ? t('Replace at {limit} {unit} or less; look closely from {warn} {unit}.', { limit: fmt(m.limit), warn: fmt(m.warnAt), unit: m.unit }) : t('Replace at {limit} {unit}; look closely from {warn} {unit}.', { limit: fmt(m.limit), warn: fmt(m.warnAt), unit: m.unit })}
      </p>
    {/if}
    {#if trend}
      <p class="trend" data-howto-trend>{t('Your chain: about {km} km until {limit} % (it grows {rate} % per 1000 km).', { km: num(trend.kmLeft), limit: fmt(part.limit ?? m?.limit ?? 0.5), rate: fmt(trend.perKkm) })}</p>
    {/if}

    {#if torque.length}
      <h3>{t('Torque')}</h3>
      <p class="warn"><TriangleAlert size={14} aria-hidden="true" />{t('Typical values only. The value printed on the part always wins.')}</p>
      <table class="tq">
        <tbody>
          {#each torque as r (r.key)}<tr><th scope="row">{t(r.name)}{#if r.note}<small>{t(r.note)}</small>{/if}</th><td class="num">{r.nm ? `${r.nm} Nm` : '–'}</td></tr>{/each}
        </tbody>
      </table>
      <p><a class="lk" href={bikesHash({ tab: 'care', view: 'spick', bike: bikeId })}>{t('All torque values and your own')}</a></p>
    {/if}

    {#if point.tip}<p class="tip"><Lightbulb size={16} aria-hidden="true" /><span>{t(point.tip)}</span></p>{/if}

    {#if point.links?.length}
      <h3>{t('Read more')}</h3>
      <ul class="links">
        {#each point.links as k (k)}
          {@const l = LINKS[k]}
          {#if l}<li><a href={l.url} target="_blank" rel="noopener noreferrer" data-howto-link={k}><ExternalLink size={16} aria-hidden="true" /><span>{t(l.title)}<small>{l.lang === 'EN' ? t('English · opens in a new tab') : t('German · opens in a new tab')}</small></span></a></li>{/if}
        {/each}
      </ul>
    {/if}
  {/if}

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
</dialog>

<style>
  .kick {
    margin: 0 0 2px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 16px 0 6px;
    font-size: var(--fs-body);
  }
  .txt,
  .quiet {
    margin: 4px 0;
    overflow-wrap: break-word;
  }
  .quiet,
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .who {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0 0 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2, var(--paper));
    border: 1px solid var(--line);
  }
  .who.shop {
    border-color: var(--warn-line, var(--line-strong));
  }
  .who span {
    display: grid;
    min-width: 0;
  }
  .steps,
  .tools {
    margin: 0;
    padding-left: 22px;
  }
  .steps li,
  .tools li {
    margin: 4px 0;
    overflow-wrap: break-word;
  }
  .warn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tq {
    width: 100%;
    border-collapse: collapse;
  }
  .tq th,
  .tq td {
    padding: 6px 0;
    border-top: 1px solid var(--line);
    text-align: left;
    font-weight: 400;
    vertical-align: top;
  }
  .tq th small {
    display: block;
  }
  .tq td {
    text-align: right;
    white-space: nowrap;
    padding-left: 12px;
  }
  .tip,
  .trend {
    display: flex;
    gap: 8px;
    margin: 12px 0 0;
    overflow-wrap: break-word;
  }
  .trend {
    font-weight: 500;
  }
  .links {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .links a,
  .lk {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    color: var(--ink);
  }
  .links a span {
    display: grid;
  }
</style>
