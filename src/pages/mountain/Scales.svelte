<script>
  /**
   * Paket J #220: the colours of the Swiss hiking signposts and the SAC scales for hiking (T1–T6) and
   * ski touring (L–EX), as information. The app never rates a route; the grade comes from the guide.
   */
  import { ChevronLeft } from '@lucide/svelte';
  import { SIGNS, HIKE_SCALE, SKI_SCALE } from '../../lib/mountain/sos.js';
  import { t } from '../../lib/i18n.svelte.js';
</script>

<div class="sk sc">
  <p class="sk-back"><a href="#/mountain"><ChevronLeft size={16} aria-hidden="true" />{t('Mountain and emergency')}</a></p>
  <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Signposts and grades')}</h1>
  <p class="sk-sub">{t('What the colours on the signposts and the grades in the guide mean. The grade is for good conditions: snow, ice or fog make every route harder.')}</p>

  <section class="surf sk-pad" aria-labelledby="sc-signs">
    <h2 class="sk-kicker" id="sc-signs">{t('Signposts in Switzerland')}</h2>
    <ul class="sk-list">
      {#each SIGNS as s (s.key)}
        <li class="row" data-sign={s.key}>
          <span class="flag" aria-hidden="true">{#each s.colors as c, i (i)}<i style:background={c}></i>{/each}</span>
          <span class="sk-tt"><b>{t(s.name)} · {s.grade}</b><small>{t(s.text)}</small></span>
        </li>
      {/each}
    </ul>
  </section>

  <div class="sk-cols">
    <section class="surf sk-pad" aria-labelledby="sc-hike">
      <h2 class="sk-kicker" id="sc-hike">{t('SAC hiking scale')}</h2>
      <dl class="scale">
        {#each HIKE_SCALE as g (g.grade)}<div data-grade={g.grade}><dt class="num">{g.grade}</dt><dd><b>{t(g.name)}</b><small>{t(g.text)}</small></dd></div>{/each}
      </dl>
    </section>
    <section class="surf sk-pad" aria-labelledby="sc-ski">
      <h2 class="sk-kicker" id="sc-ski">{t('SAC ski touring scale')}</h2>
      <dl class="scale">
        {#each SKI_SCALE as g (g.grade)}<div data-grade={g.grade}><dt class="num">{g.grade}</dt><dd><b>{t(g.name)}</b><small>{t(g.text)}</small></dd></div>{/each}
      </dl>
    </section>
  </div>
</div>

<style>
  .sc {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
  }
  .flag {
    display: flex;
    flex-direction: column;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--line);
  }
  .flag i {
    flex: 1;
  }
  .scale {
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .scale div {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 10px;
    align-items: baseline;
  }
  .scale dt {
    font-weight: 700;
  }
  .scale dd {
    margin: 0;
    display: flex;
    flex-direction: column;
  }
  .scale small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
