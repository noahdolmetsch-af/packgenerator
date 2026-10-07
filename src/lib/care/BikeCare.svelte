<script>
  /**
   * One bike in Bike care (v0.21.0, answer 7a): closed, it is one summary line (name, km, how much
   * is due, the last workshop visit). Open, it has everything: km, the 1000 km check, parts,
   * what is coming up, tube or tubeless, workshop visits and order, repairs and the history.
   */
  import MoreMenu from './MoreMenu.svelte';
  import { partInfo, wear, needsWork, lastValue, kmSince, lastReplace, CHECK_KM, bikeLog, EXTRA } from '../care.js';
  import { visitTotal, costByYear, costByPart, costPer1000 } from '../workshop.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { bikeCareWords } from '../readiness.js';

  let {
    c, tasks, repairs, wished = {}, kmMsg = '', open = false,
    ontoggle, onkm, oncheck, onpart, ontyre, onvisit, onorder, onwish, onrepair,
  } = $props();

  const bike = $derived(c.bike);
  const log = $derived(open ? bikeLog(bike, tasks) : []);
  // v0.22.0 (AP06): the same statement as Home's bike row and Pack (readiness.js bikeCare).
  const words = $derived(bikeCareWords(c.care));
  const last = $derived(c.mine[0] ?? null);

  const PRIO = { high: 'High', medium: 'Medium', low: 'Low' };
  const chf = (n) => `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const inDays = (d) => (d <= 0 ? (d === 0 ? t('due today') : tn(-d, '{n} day overdue', '{n} days overdue')) : d < 45 ? tn(d, 'in {n} day', 'in {n} days') : tn(Math.round(d / 30.4), 'in {n} month', 'in {n} months'));
</script>

<details class="bike" id="care-{bike.id}" {open} ontoggle={(e) => ontoggle?.(e.currentTarget.open)}>
  <summary class="bike-h">
    <h2 class="title">{bike.name}</h2>
    <span class="sum">
      <span class="num">{bike.km != null ? `${num(bike.km)} km` : t('km not set')}</span>
      {#if c.care.status === 'due'}<span class="pill red">{words.tag}</span>{:else if c.care.status === 'nodata'}<span class="nodata">{words.tag}</span>{:else}<span class="ok">{words.tag}</span>{/if}{#if words.text && c.care.status !== 'due'}<small class="gap">{words.text}</small>{/if}
      <span>{last ? t('workshop {date}', { date: day(last.date) }) : t('no workshop visit yet')}</span>
    </span>
  </summary>

  {#if open}
    <label class="km">
      <span class="lbl">{t('km now')}</span>
      <input class="inp num" type="text" inputmode="numeric" value={bike.km ?? ''} placeholder={t('not set')} onchange={(e) => onkm(e.currentTarget.value)} />
      {#if bike.kmDate}<small>{t('set {date}', { date: bike.kmDate })}</small>{/if}
    </label>
    {#if kmMsg}<p class="err">{kmMsg}</p>{/if}

    <div class="cols">
      <div>
        <h3>{t('{km} km check', { km: num(CHECK_KM) })} {#if c.check.due}<span class="pill red">{t('{n} due', { n: c.check.due })}</span>{/if}</h3>
        <ul class="checks">
          {#each c.check.rows as r (r.key)}
            <li class:late={r.due}><span>{r.name}</span><span class="num m">{needsWork(bike.parts.find((p) => p.key === r.key)) ? t('work needed') : r.unknown ? (bike.km == null ? t('set km') : t('not recorded')) : t('{km} km ago', { km: num(r.since) })}</span></li>
          {/each}
        </ul>
        <button type="button" class="btn sm" onclick={() => oncheck(c.check.rows.map((r) => r.key), 'check', t('{km} km check', { km: CHECK_KM }))}>{t('All checked, OK')}</button>
        <p class="hint">{t('Something not OK? Open the part on the right and tap "Replace or work needed".')}</p>
      </div>
      <div>
        <h3>{t('Parts')}</h3>
        <ul class="parts">
          {#each bike.parts as part (part.key)}
            {@const info = partInfo(part)}
            {@const w = wear(part)}
            {@const v = lastValue(part)}
            {@const since = kmSince(bike, lastReplace(part))}
            <li>
              <button type="button" class="part" onclick={() => onpart(part.key)}>
                <span class="pn">{t(info.name)}{#if part.model}<small>{part.model}</small>{/if}</span>
                <span class="pv num">
                  {#if needsWork(part)}<span class="pill red">{t('work needed')}</span>{/if}
                  {#if w}<span class="pill {w}">{v.value} {info.unit}</span>{:else if v}{v.value} {info.unit}{/if}
                  {#if since != null && info.unit}<small>{num(since)} km</small>{/if}
                  {#if !part.history?.length}<small class="m">–</small>{/if}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="cols">
      <div>
        <h3>{t('Coming up')}</h3>
        <ul class="checks">
          {#each c.time as s (s.key)}
            <li class:late={s.overdue}>
              <span>{s.name}<small>{s.every >= 365 ? t('every year') : t('every {n} months', { n: Math.round(s.every / 30.4) })}</small></span>
              <span class="num m">{s.never ? t('not recorded') : `${s.next} · ${inDays(s.days)}`}</span>
            </li>
          {/each}
        </ul>
        {#each c.time.filter((s) => s.overdue || (s.days != null && s.days <= 30)) as s (s.key)}
          <p class="hint">{s.name}: <button type="button" class="link" onclick={() => onwish(s)}>{t('add the parts to the wishlist')}</button>{#if wished[`${bike.id}.${s.key}`]} · {wished[`${bike.id}.${s.key}`]}{/if}</p>
        {/each}
        <div class="tyres" role="group" aria-label={t('Tube or tubeless')}>
          {#each [['front', 'Front'], ['rear', 'Rear']] as [w, label] (w)}
            <span class="tw">
              <span class="lbl">{t(label)}</span>
              <button type="button" class="toggle" aria-pressed={c.tyres[w] === 'tubeless'} onclick={() => ontyre(w, 'tubeless')}>{t('Tubeless')}</button>
              <button type="button" class="toggle" aria-pressed={c.tyres[w] === 'tube'} onclick={() => ontyre(w, 'tube')}>{t('Tube')}</button>
            </span>
          {/each}
        </div>
        <p class="hint">{t('Sealant is only due for tubeless wheels. Brakes are bled when the lever feels soft.')}</p>
      </div>
      <div>
        <h3>{t('Workshop')} {#if c.mine.length}<small>{tn(c.mine.length, '{n} visit', '{n} visits')}</small>{/if}</h3>
        {#if c.order?.rows.length}
          <p class="order"><button type="button" class="btn sm hi" onclick={onorder}>{t('Workshop order')}</button> <span>{tn(c.order.rows.length, '{n} job', '{n} jobs')} · {t('about CHF {chf}', { chf: c.order.total })}{c.order.unknown ? ` + ${t('unknown')}` : ''}</span></p>
        {/if}
        {#if c.mine.length}
          <ul class="visits">
            {#each c.mine as v (v.id)}
              <li>
                <button type="button" class="part" onclick={() => onvisit(v.id)}>
                  <span class="pn">{v.date} · {v.shop}<small>{v.invoice ? `${v.invoice} · ` : ''}{tn((v.parts ?? []).length, '{n} job', '{n} jobs')}{v.km != null ? ` · ${num(v.km)} km` : ''}{v.photos?.length ? ` · ${tn(v.photos.length, '{n} receipt photo', '{n} receipt photos')}` : ''}</small></span>
                  <span class="pv num">{visitTotal(v) == null ? t('cost unknown') : chf(visitTotal(v))}</span>
                </button>
              </li>
            {/each}
          </ul>
          {@const years = costByYear(c.mine)}
          {@const top = costByPart(c.mine, 3)}
          {@const per = costPer1000(c.mine, bike)}
          <p class="costs">
            {#each years as y (y.year)}<span><b>{y.year}</b> {y.unknown === y.visits ? t('cost unknown') : `${chf(y.chf)}${y.unknown ? ` + ${t('unknown')}` : ''}`}</span>{/each}
            <span>{per?.chf != null ? t('{chf} per 1000 km', { chf: chf(per.chf) }) : per?.wait ? t('Cost per 1000 km after {km} more km', { km: num(per.wait) }) : t('Cost per 1000 km: add the km at a visit')}</span>
          </p>
          <p class="hint">{t('Most:')} {top.map((r) => `${r.name} ${chf(r.chf)}`).join(' · ')}</p>
        {:else}
          <p class="hint">{t('No workshop visits yet. Send Claude a photo of the receipt; it comes back as a file to import.')}</p>
        {/if}
      </div>
    </div>

    {#if repairs.length}
      <h3>{t('Repairs')}</h3>
      <ul class="rows">
        {#each repairs as rp (rp.id)}
          <li class:need={rp.status === 'needed'}>
            <span class="when">{PRIO[rp.priority] ? t(PRIO[rp.priority]) : ''}</span>
            <span class="txt">{rp.task}{#if rp.note}<small>{rp.note}</small>{/if}</span>
            <span class="acts">
              <button type="button" class="btn sm hi" onclick={() => onrepair(rp, 'done')}>{t('Done|task')}</button>
              <MoreMenu label={rp.task} actions={[{ name: t('Work needed'), run: () => onrepair(rp, 'needed') }, { name: t('Not needed any more'), run: () => onrepair(rp, 'gone') }]} />
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    <details class="log">
      <summary>{t('What was done when')} <small>{log.length}</small></summary>
      {#if log.length}
        <ol>
          {#each log as h, n (n)}
            <li>
              <span class="num when">{h.date}{h.km != null ? ` · ${num(h.km)} km` : ''}</span>
              <span><b>{h.what}</b>: {h.action === 'repair' ? t('done') : h.action === 'replace' ? (h.unit ? t('replaced') : t('done')) : h.action === 'service' ? t('serviced') : h.result === 'needed' ? t('work needed') : t('checked, OK')}{h.value != null ? ` · ${h.value} ${h.unit}` : ''}{#each Object.keys(EXTRA).filter((k) => h[k] != null) as k (k)}{` · ${t(EXTRA[k].name.toLowerCase())} ${h[k]} ${EXTRA[k].unit}`}{/each}{h.by === 'shop' ? ` · ${t('bike shop')}` : ''}{h.note ? ` · ${h.note}` : ''}</span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="hint">{t('Nothing recorded yet. The service photos will be the first entries.')}</p>
      {/if}
    </details>
  {/if}
</details>

<style>
  .bike {
    border-bottom: 1.5px solid var(--line);
  }
  .bike[open] {
    padding-bottom: 18px;
  }
  .bike-h {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 2px 16px;
    padding: 10px 0 8px;
    cursor: pointer;
    list-style: none;
  }
  .bike-h::-webkit-details-marker {
    display: none;
  }
  .bike[open] > .bike-h {
    border-bottom: 3px solid var(--ink);
    margin-bottom: 10px;
  }
  .bike-h .title {
    font-size: 26px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bike-h .title::before {
    content: '▸';
    font-size: 18px;
  }
  .bike[open] > .bike-h .title::before {
    content: '▾';
  }
  .sum {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .ok {
    color: var(--ink-3);
  }
  /* v0.22.0 (AP06): no data is said in words, with a dashed edge, not as "fine". */
  .nodata {
    padding: 0 8px;
    border: 1.5px dashed var(--ink-3);
    border-radius: 999px;
    color: var(--ink-2);
    font-size: 13px;
  }
  small {
    font-size: 13px;
    color: var(--ink-3);
    font-weight: 400;
  }
  .km {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .km .lbl {
    margin: 0;
  }
  .km .inp {
    width: 110px;
  }
  .cols {
    display: grid;
    gap: 16px 28px;
    margin-bottom: 10px;
  }
  @media (min-width: 900px) {
    .cols {
      grid-template-columns: 1fr 1.3fr;
    }
  }
  h3 {
    font-size: 16px;
    margin: 6px 0;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .checks,
  .parts,
  .rows,
  .visits {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .checks li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
    font-size: 15px;
  }
  .checks li small {
    margin-left: 6px;
  }
  .late {
    color: var(--ink);
    font-weight: 700;
  }
  .m {
    color: var(--ink-3);
    font-size: 13px;
  }
  .checks + .btn {
    margin-top: 8px;
  }
  .hint {
    font-size: 13px;
    color: var(--ink-3);
    margin: 6px 0 0;
  }
  .part {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) {
    .part:hover {
      background: var(--hi-soft);
    }
  }
  .pn {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .pv {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: end;
  }
  .pill {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: #d9eedf;
    color: #2f7a4f;
  }
  .pill.warn,
  .pill.red {
    background: var(--hi-soft);
    color: var(--ink);
  }
  /* Red stays for worn parts only: brakes, chain (safety). */
  .pill.worn {
    background: #f6d5d0;
    color: #b42318;
  }
  .tyres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin-top: 10px;
  }
  .tw {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tw .lbl {
    margin: 0 4px 0 0;
  }
  .toggle {
    border: 1.5px solid var(--ink);
    background: var(--paper);
    border-radius: 999px;
    padding: 4px 12px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .costs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 8px 0 0;
    font-size: 15px;
  }
  .order {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 14px;
  }
  .rows li {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 6px 10px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
  }
  .rows li.need .txt {
    border-left: 3px solid var(--hi);
    padding-left: 6px;
  }
  .when {
    font-size: 13px;
    color: var(--ink-3);
  }
  .txt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .acts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: end;
  }
  @media (max-width: 640px) {
    .rows li {
      grid-template-columns: 52px 1fr;
    }
    .rows .acts {
      grid-column: 2;
      justify-content: start;
    }
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: 13px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .err {
    color: #b42318;
    font-size: 14px;
  }
  .log {
    margin-top: 14px;
  }
  .log summary {
    cursor: pointer;
    font-weight: 700;
  }
  .log ol {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .log li {
    display: grid;
    grid-template-columns: 170px 1fr;
    gap: 2px 12px;
    padding: 5px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  @media (max-width: 640px) {
    .log li {
      grid-template-columns: 1fr;
    }
  }
</style>
