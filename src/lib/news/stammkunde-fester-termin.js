// «Fester Termin» (Noah 04.11.2026 «8a»): Stammkunden mit Wochentag und Uhrzeit; Heute schlägt die Zeit vor, wenn sie frei ist
export default {
  title: 'Usual time for regular customers',
  lead: 'Give a regular customer a weekday and a time; when that time is free in your offers, Heute suggests it with a ready message.',
  points: [{ text: 'Give a customer a «Usual time»; when it is free this week, Heute shows «Usual time: … is free» with a ready message to suggest it', go: { href: '#/me/offers/customers', steps: [{ text: 'Open a customer' }, { text: 'Choose a weekday and a time under «Usual time»' }], where: 'Me › Offers › Customers › a customer › Usual time.' } }],
  small: [],
  test: [
    'Open a customer and choose a weekday and a time under «Usual time», then save: the list shows «Usual time …».',
    'Open that time in an offer: Heute shows «Usual time» with a «Suggest» button and a ready message.',
  ],
  since: [],
  de: {
    'Usual time for regular customers': 'Fester Termin für Stammkunden',
    'Give a regular customer a weekday and a time; when that time is free in your offers, Heute suggests it with a ready message.': 'Gib einem Stammkunden einen Wochentag und eine Uhrzeit; ist die Zeit in deinen Angeboten frei, schlägt Heute sie mit einer fertigen Nachricht vor.',
    'Give a customer a «Usual time»; when it is free this week, Heute shows «Usual time: … is free» with a ready message to suggest it': 'Gib einem Kunden einen «Festen Termin»; ist er diese Woche frei, zeigt Heute «Fester Termin: … ist frei» mit einer fertigen Nachricht zum Vorschlagen',
    'Open a customer': 'Öffne einen Kunden',
    'Choose a weekday and a time under «Usual time»': 'Wähle unter «Fester Termin» einen Wochentag und eine Uhrzeit',
    'Me › Offers › Customers › a customer › Usual time.': 'Ich › Angebote › Kunden › ein Kunde › Fester Termin.',
    'Open a customer and choose a weekday and a time under «Usual time», then save: the list shows «Usual time …».': 'Öffne einen Kunden, wähle unter «Fester Termin» einen Wochentag und eine Uhrzeit und speichere: die Liste zeigt «Fester Termin …».',
    'Open that time in an offer: Heute shows «Usual time» with a «Suggest» button and a ready message.': 'Gib diese Zeit in einem Angebot frei: Heute zeigt «Fester Termin» mit einem Knopf «Vorschlagen» und einer fertigen Nachricht.',
  },
};
