<script>
  /**
   * «Fragen» (Plan «ganze App», Schritt 4a, Noah 08.11.2026 «D b»): #/auswerten/fragen, the first tab of Auswerten. Six
   * questions about your own data, each answered in one sentence with the number and the limit behind it («Beobachtung,
   * keine Ursache»). With too little data the question is a slim row and says what it still needs; nothing is guessed. The
   * numbers come from the rules that exist (lib/fragen/fragen.js reads signals.js, compare.js, care.js); «Warum?» shows how
   * it was counted, «Mehr dazu» opens the page of the numbers. Only to look at: never a rating, never advice on health.
   * The data and the words are shared with the assistant (FragenDaten, FrageKarte, saetze.js).
   */
  import { ChevronRight, MessageCircle, Plug } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import FragenDaten from '../lib/fragen/FragenDaten.svelte';
  import FrageKarte from '../lib/fragen/FrageKarte.svelte';
  import { t } from '../lib/i18n.svelte.js';
</script>

<div class="fr" data-page="fragen" data-fragen>
  <header class="ph">
    <h1 class="title">{t('Ask your data')}</h1>
    <p class="sub">{t('Six questions, one sentence each as the answer.')}</p>
  </header>

  <FragenDaten>
    {#snippet children({ ready, answers, nothing, okQs, fewQs, stand })}
      {#if !ready}
        <p class="load" role="status">{t('Counting …')}</p>
      {:else}
        {#if nothing}
          <Empty icon={Plug} title={t('Not enough data for questions yet')} text={t('The questions answer themselves as soon as there are days with values, rides, a finished tour or a bike. Connect Fitbit or Strava, answer «Wi gaht\'s?» or add a bike to start.')} action={{ label: t('See where your numbers come from'), href: '#/auswerten/quellen' }} />
        {/if}

        {#if okQs.length}
          <ul class="qs">
            {#each okQs as q (q.key)}
              <li><FrageKarte {q} a={answers[q.key]} stand={stand(q.key)} /></li>
            {/each}
          </ul>
        {/if}

        <!-- questions that still need data: one slim row each, a tap opens the sentence, «Why?» and the way on -->
        {#if fewQs.length}
          <section class="waiting" aria-labelledby="fr-few-h">
            {#if okQs.length}<h2 id="fr-few-h" class="nh">{t('Waiting for more data')}</h2>{/if}
            <ul class="slims">
              {#each fewQs as q (q.key)}
                <li><FrageKarte slim {q} a={answers[q.key]} /></li>
              {/each}
            </ul>
          </section>
        {/if}

        <a class="ask" href="#/assistent?von=fragen" data-fragen-frei>
          <MessageCircle size={20} aria-hidden="true" />
          <span class="am"><b>{t('Ask your own question')}</b><small>{t('The assistant answers questions about your data, for example «How much did I ride in October?»')}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </a>

        <!-- «Als Nächstes»: where the numbers come from, then the values themselves -->
        <section class="next" aria-labelledby="fr-next-h">
          <h2 id="fr-next-h" class="nh">{t('What next?')}</h2>
          <p class="nl">
            <a href="#/auswerten/quellen" data-fragen-quellen>{t('See where your numbers come from')} ›</a>
            <a href="#/auswerten/analyse" data-fragen-analyse>{t('Look at your values')} ›</a>
          </p>
        </section>
      {/if}
    {/snippet}
  </FragenDaten>
</div>

<style>
  .fr {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 920px;
    margin: 0 auto;
    min-width: 0;
  }
  .ph .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-3);
    font: 400 var(--fs-body) / 1.45 var(--font-body);
  }
  .ask {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 56px;
    padding: var(--sp-3) var(--sp-4);
    border: 1px dashed var(--line);
    border-radius: var(--r-lg, 14px);
    color: var(--ink);
    text-decoration: none;
  }
  .ask .am {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .ask b {
    display: block;
    font-weight: 500;
  }
  .ask small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .load {
    color: var(--ink-3);
  }
  .qs {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 1000px) {
    .qs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .qs li {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .qs li :global(.q) {
    flex: 1;
  }
  .waiting {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .slims {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .nh {
    margin: 0 0 var(--sp-2);
    font: 600 var(--fs-h3, 1.05rem) / 1.3 var(--font-body);
  }
  .nl {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-5);
    margin: 0;
  }
  .nl a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
  }
  @media (max-width: 719px) {
    .fr {
      padding-bottom: 72px;
    }
  }
</style>
