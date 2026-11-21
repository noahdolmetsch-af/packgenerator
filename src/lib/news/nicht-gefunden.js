// «Seite nicht gefunden» (Gesamttest 19.11.2026, Noah «a»): a wrong address says so instead of showing Today silently
export default {
  title: 'A wrong address says so',
  lead: 'An address that leads to no page now shows «Page not found» with a button to Today.',
  points: [
    {
      text: 'A wrong or old link shows «Page not found» and «To Today»',
      go: null,
    },
  ],
  small: [{ box: 'new', text: 'Two old links («Agenda» in the news, the bike check in the recovery step) now lead to the right page' }],
  test: [
    'Change the end of the address in the browser to something wrong, for example …/#/does-not-exist, and press Enter: the card «Page not found» shows.',
    'Tap «To Today»: Today opens. The address …/#/ and every page of the app still open as before.',
  ],
  since: [],
  de: {
    'A wrong address says so': 'Eine falsche Adresse sagt es',
    'An address that leads to no page now shows «Page not found» with a button to Today.': 'Eine Adresse, die zu keiner Seite führt, zeigt jetzt «Seite nicht gefunden» mit einem Knopf zu Heute.',
    'A wrong or old link shows «Page not found» and «To Today»': 'Ein falscher oder alter Link zeigt «Seite nicht gefunden» und «Zu Heute»',
    'Two old links («Agenda» in the news, the bike check in the recovery step) now lead to the right page': 'Zwei alte Links («Agenda» in den News, der Velo-Check im Erholungsschritt) führen jetzt auf die richtige Seite',
    'Change the end of the address in the browser to something wrong, for example …/#/does-not-exist, and press Enter: the card «Page not found» shows.': 'Ändere das Ende der Adresse im Browser auf etwas Falsches, zum Beispiel …/#/does-not-exist, und drücke Enter: Die Karte «Seite nicht gefunden» erscheint.',
    'Tap «To Today»: Today opens. The address …/#/ and every page of the app still open as before.': 'Tippe «Zu Heute»: Heute öffnet sich. Die Adresse …/#/ und alle Seiten der App öffnen sich weiter wie vorher.',
  },
};
