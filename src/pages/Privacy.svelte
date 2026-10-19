<script>
  /**
   * Paket R «Andere Menschen und Geld» (Noah 19.10.2026 «1b … 3a und b vorbereiten … 5 keine inhalte
   * von anderen»): Ich › Datenschutz und Nutzung (#/me/privacy). The app is open to everyone, so it
   * says in plain words what stays on the device, what the small server keeps, what costs money
   * (nothing) and the terms of use. Texts are English keys for t(); no real name in it.
   */
  import { t } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { DAY_CAPS } from '../../api/_lib/daycap.js';
  import '../lib/ich/ich.css';

  const ISSUES = 'https://github.com/noahdolmetsch-af/packgenerator/issues';
  const SECTIONS = [
    {
      id: 'device',
      title: 'On your device',
      lines: ['Everything you enter stays in this browser on this device: gear, trips, bikes, notes, health values.', 'There is no account you need. The app works offline.', 'A backup file is made only when you tap «Export backup». Keep it somewhere safe.'],
    },
    {
      id: 'server',
      title: 'Only when you switch it on',
      lines: [
        'Sync with a code or an invite link: your data goes to the server sealed with a code only your devices know. The server cannot read it.',
        'Sync with Google: the server keeps a number for your Google account and your code, sealed with a server key. It keeps no e-mail and no name.',
        'Strava, Fitbit, calendar, mail and the AI helper are connections of the owner of the server; others cannot switch them on yet.',
        'Switch off sync with «Switch off and empty the server», or «Remove the Google sign-in»: the server forgets it. Untouched data is removed by itself after 400 days.',
      ],
    },
    {
      id: 'money',
      title: 'Costs',
      lines: ['The app is free. There is no advertising and nothing is sold about you.', 'A one-off «Pro» (CHF 29) is prepared but switched off. If it ever comes, the app says so first.', 'Bike mechanics and guides: the app only sends your request by mail or opens their link. No money goes through the app.'],
    },
    {
      id: 'cap',
      title: 'Daily limit of the server',
      lines: ['The server runs on free plans. So it does at most {n} tasks a day; after that it says «tomorrow again». Your data on the device is never affected.'],
    },
    {
      id: 'terms',
      title: 'Terms of use',
      lines: [
        'Everything in the app is a suggestion. You decide what you pack and where you ride.',
        'Weather, routes, tips and health values can be wrong. Health values are observation only, not a diagnosis.',
        'Use the app at your own risk. There is no guarantee that it works or that data is never lost: make backups.',
        'The app shows no content from other people: no followers, no comments, no shared lists.',
      ],
    },
  ];
</script>

<div class="privpage ich-page" data-privacy>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Privacy and terms')} sub={t('What stays with you, what the server keeps, what it costs')} />

  <div class="ich-main">
    {#each SECTIONS as s (s.id)}
      <section class="ich-sec" aria-labelledby="pv-{s.id}">
        <div class="ich-h"><div><h2 id="pv-{s.id}">{t(s.title)}</h2></div></div>
        <ul class="card ich-body lines">
          {#each s.lines as l (l)}<li>{t(l, { n: DAY_CAPS.total })}</li>{/each}
        </ul>
      </section>
    {/each}
    <section class="ich-sec" aria-labelledby="pv-contact">
      <div class="ich-h"><div><h2 id="pv-contact">{t('Questions and deleting')}</h2></div></div>
      <div class="card ich-body">
        <p>{t('To delete everything on this device: remove the site data of this app in the browser settings. For questions write an issue on GitHub.')}</p>
        <p><a href={ISSUES} target="_blank" rel="noopener">{t('Questions on GitHub')}</a> · <a href="#/me/data">{t('Data and backup')}</a></p>
      </div>
    </section>
  </div>
</div>

<style>
  .lines {
    margin: 0;
    padding: 12px 14px 12px 32px;
  }
  .lines li + li {
    margin-top: 8px;
  }
  .ich-body p {
    margin: 0 0 8px;
  }
</style>
