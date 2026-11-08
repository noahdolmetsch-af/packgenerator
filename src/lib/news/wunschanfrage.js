// «Wunschzeit-Anfrage» (Noah 08.11.2026 «1c», «1a 2a»): Eltern nennen Wunschzeiten statt fester Zeiten
export default {
  title: 'Parents can name wish times',
  lead: 'A tennis offer can now take wish requests: the parents tick places, name up to three times, say how many children come, and you answer.',
  points: [
    { text: 'New booking mode «Wish time, I answer» in an offer (kinds Tennis and Own offer)', go: { href: '#/me', steps: [{ sel: '[data-me-row="tennis"]' }] } },
    { text: 'On the booking page the parents see a request form instead of fixed times', go: null },
    { text: 'Wish requests appear in a card with one button per wish time; Heute shows a row for each new one', go: null },
  ],
  small: [],
  test: [
    'Open Me › Tennis › your offer › «Change» next to «How booking works»: the option «Wish time, I answer» is there. Choose it and save.',
    'Open the booking link of the offer: instead of days and times you see «Ask for a lesson» with places, wish times, number of children and «How did you find me?».',
    'Send a request with fictional data. Then open the offer in the app: the card «Wish requests» shows it with its places, children and source.',
    'Tap «Confirm …» on one wish time: you get a ready message for the parents to send yourself.',
  ],
  since: [],
  de: {
    'Parents can name wish times': 'Eltern können Wunschzeiten nennen',
    'A tennis offer can now take wish requests: the parents tick places, name up to three times, say how many children come, and you answer.': 'Ein Tennis-Angebot kann jetzt Wunschanfragen annehmen: Die Eltern kreuzen Orte an, nennen bis zu drei Zeiten und die Zahl der Kinder, und du antwortest.',
    'New booking mode «Wish time, I answer» in an offer (kinds Tennis and Own offer)': 'Neue Buchungsart «Wunschzeit, ich antworte» im Angebot (Arten Tennis und Eigenes Angebot)',
    'On the booking page the parents see a request form instead of fixed times': 'Auf der Buchungsseite sehen die Eltern ein Anfrageformular statt fester Zeiten',
    'Wish requests appear in a card with one button per wish time; Heute shows a row for each new one': 'Wunschanfragen stehen in einer Karte mit einem Knopf pro Wunschzeit; Heute zeigt für jede neue eine Zeile',
    'Open Me › Tennis › your offer › «Change» next to «How booking works»: the option «Wish time, I answer» is there. Choose it and save.': 'Öffne Ich › Tennis › dein Angebot › «Ändern» bei «So wird gebucht»: die Option «Wunschzeit, ich antworte» ist da. Wähle sie und speichere.',
    'Open the booking link of the offer: instead of days and times you see «Ask for a lesson» with places, wish times, number of children and «How did you find me?».': 'Öffne den Buchungslink des Angebots: statt Tagen und Zeiten siehst du «Tennisstunde anfragen» mit Orten, Wunschzeiten, Zahl der Kinder und «Wie sind Sie auf mich gekommen?».',
    'Send a request with fictional data. Then open the offer in the app: the card «Wish requests» shows it with its places, children and source.': 'Sende eine Anfrage mit erfundenen Daten. Öffne dann das Angebot in der App: die Karte «Wunschanfragen» zeigt sie mit Orten, Kindern und Quelle.',
    'Tap «Confirm …» on one wish time: you get a ready message for the parents to send yourself.': 'Tippe bei einer Wunschzeit auf «… bestätigen»: du bekommst eine fertige Nachricht, die du den Eltern selbst sendest.',
  },
};
