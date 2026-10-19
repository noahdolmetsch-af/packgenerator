<script>
  /**
   * Paket J: Touren › Berg und Notfall. On top the emergency (#217 the line with Rega 1414 and 112, works
   * offline; a tap on «Emergency» opens the position page), then the rows Map, Emergency QR, Signposts
   * and scales, Compass (package L's toolbox), and the Swiss sources by sport (#219): suggestions only,
   * each one can be hidden and all come back with «Show hidden again».
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../../lib/intro/AreaIntro.svelte'; // «Anleitungen überall» (lib/guides.js)
  import { Siren, Phone, Map as MapIcon, QrCode, Signpost, Compass, ChevronRight, ChevronLeft, ExternalLink, X, MountainSnow } from '@lucide/svelte';
  import { db } from '../../lib/db.js';
  import { CALLS, telOf, mountainLinks, LINK_SPORTS, LINKS_OFF_KEY, CARD_KEY, hasCard } from '../../lib/mountain/sos.js';
  import { t, lang } from '../../lib/i18n.svelte.js';

  const offQ = liveQuery(() => db.settings.get(LINKS_OFF_KEY));
  const cardQ = liveQuery(() => db.settings.get(CARD_KEY));
  const off = $derived($offQ?.value ?? []);
  const links = $derived(mountainLinks(lang.v));
  const shown = (sport) => links.filter((l) => l.sport === sport && !off.includes(l.id));
  const setOff = (value) => db.settings.put({ key: LINKS_OFF_KEY, value });
</script>

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <header class="sk-head">
    <span class="sk-badge" aria-hidden="true"><MountainSnow size={26} /></span>
    <div>
      <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Mountain and emergency')}</h1>
      <p class="sk-sub">{t('For ski tours and hikes: help in an emergency, the map with steep slopes, the grades.')}</p>
    </div>
  </header>

  <div class="sk-cols">
    <div>
      <section class="surf sk-pad sos" aria-labelledby="mh-sos">
        <h2 class="sk-kicker" id="mh-sos">{t('Emergency')}</h2>
        <a class="btn hi sk-go big" href="#/mountain/sos" data-to="sos"><Siren size={22} aria-hidden="true" />{t('Emergency: show my position')}</a>
        <div class="calls">
          {#each CALLS as c (c.key)}
            <a class="btn call" href={telOf(c.number)} data-call={c.number}><Phone size={18} aria-hidden="true" />{t(c.label)}</a>
          {/each}
        </div>
        <p class="sk-quiet">{t('The numbers work offline. On the next page your position is shown big, to read out on the phone.')}</p>
      </section>

      <ul class="surf sk-rows">
        <li>
          <a class="sk-row" href="#/mountain/map" data-row="map">
            <span class="sk-ri" aria-hidden="true"><MapIcon size={20} /></span>
            <span class="sk-rt"><b>{t('Map with steep slopes')}</b><small>{t('swisstopo: slopes over 30°, ski touring routes, hiking trails')}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a class="sk-row" href="#/mountain/qr" data-row="qr">
            <span class="sk-ri" aria-hidden="true"><QrCode size={20} /></span>
            <span class="sk-rt"><b>{t('Emergency QR for the lock screen')}</b><small>{$cardQ && hasCard($cardQ.value) ? t('Your emergency card is filled in') : t('Contact, allergies, medicines: helpers scan it')}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a class="sk-row" href="#/mountain/scales" data-row="scales">
            <span class="sk-ri" aria-hidden="true"><Signpost size={20} /></span>
            <span class="sk-rt"><b>{t('Signposts and grades')}</b><small>{t('Yellow, white-red-white, white-blue-white; SAC T1–T6 and L–EX')}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
        <li>
          <a class="sk-row" href="#/me/tools/compass" data-row="compass">
            <span class="sk-ri" aria-hidden="true"><Compass size={20} /></span>
            <span class="sk-rt"><b>{t('Compass')}</b><small>{t('In the toolbox, works without the internet')}</small></span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
      </ul>
    </div>

    <div>
      <section class="surf sk-pad" aria-labelledby="mh-links" data-links>
        <h2 class="sk-kicker" id="mh-links">{t('Swiss sources')}</h2>
        <p class="sk-quiet">{t('Suggestions: tap × to hide one.')}</p>
        {#each LINK_SPORTS as s (s.key)}
          {#if shown(s.key).length}
            <h3 class="lh">{t(s.name)}</h3>
            <ul class="sk-list">
              {#each shown(s.key) as l (l.id)}
                <li class="ml-row">
                  <a class="sk-row" href={l.href} target="_blank" rel="noopener noreferrer" data-link={l.id}>
                    <span class="sk-rt"><b>{t(l.name)}</b><small>{t(l.sub)}</small></span>
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                  <button type="button" class="hide" aria-label={t('Hide {name}', { name: t(l.name) })} onclick={() => setOff([...off, l.id])} data-hide={l.id}><X size={16} aria-hidden="true" /></button>
                </li>
              {/each}
            </ul>
          {/if}
        {/each}
        {#if off.length}<button type="button" class="btn sm" onclick={() => setOff([])} data-links-back>{t('Show hidden again ({n})', { n: off.length })}</button>{/if}
      </section>
    </div>
  </div>
  <!-- «Anleitungen überall»: the guide at the end, so «Emergency» stays the first thing on the page -->
  <AreaIntro place="mountain" />
</div>

<style>
  .sos {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }
  .big {
    min-height: 56px;
    font-size: var(--fs-sub);
  }
  .calls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .call {
    min-height: 48px;
    justify-content: center;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lh {
    margin: 12px 0 2px;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  .ml-row {
    display: flex;
    align-items: center;
  }
  .ml-row .sk-row {
    flex: 1;
    min-width: 0;
  }
  .hide {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
