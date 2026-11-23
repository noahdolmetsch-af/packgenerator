// «Frag die App» beantwortet Nächte draussen und den letzten Werkstattbesuch (S6 Schritt 2, Noah 21.11.2026 «5a»)
export default {
  title: 'The app answers two more questions',
  lead: 'Ask how many nights you slept outdoors, or when you were last at the workshop.',
  points: [
    { text: 'Ask «How many nights did I sleep outdoors this year?»: the app counts the nights of your trips with Bivouac or Bivouac + tent', go: { href: '#/assistent', steps: [{ sel: '[data-as="open"]' }], where: 'Assistant › Ask the app › type the question (Examples below the field)' } },
    { text: 'Ask «When was I last at the workshop?»: the app names the last visit, the shop, the jobs and the last visit of each other bike', go: { href: '#/assistent', steps: [{ sel: '[data-as="open"]' }], where: 'Assistant › Ask the app › type the question (Examples below the field)' } },
  ],
  small: [{ box: 'new', text: 'Both answers come from your own data on this device, nothing is sent anywhere' }],
  test: ['Open the Assistant and tap the example «When was I last at the workshop?»: the answer names the date of your last visit.', 'Ask «How many nights did I sleep outdoors this year?»: the answer counts the nights, or tells you how to mark a trip.'],
  since: [],
  de: {
    'The app answers two more questions': 'Die App beantwortet zwei weitere Fragen',
    'Ask how many nights you slept outdoors, or when you were last at the workshop.': 'Frage, wie viele Nächte du draussen geschlafen hast oder wann du zuletzt in der Werkstatt warst.',
    'Ask «How many nights did I sleep outdoors this year?»: the app counts the nights of your trips with Bivouac or Bivouac + tent': 'Frage «Wie viele Nächte habe ich dieses Jahr draussen geschlafen?»: Die App zählt die Nächte deiner Touren mit Biwak oder Biwak + Zelt',
    'Ask «When was I last at the workshop?»: the app names the last visit, the shop, the jobs and the last visit of each other bike': 'Frage «Wann war ich zuletzt in der Werkstatt?»: Die App nennt den letzten Besuch, die Werkstatt, die Arbeiten und den letzten Besuch jedes anderen Velos',
    'Assistant › Ask the app › type the question (Examples below the field)': 'Assistent › Frag die App › die Frage eintippen (Beispiele unter dem Feld)',
    'Both answers come from your own data on this device, nothing is sent anywhere': 'Beide Antworten kommen aus deinen eigenen Daten auf diesem Gerät, es wird nichts verschickt',
    'Open the Assistant and tap the example «When was I last at the workshop?»: the answer names the date of your last visit.': 'Öffne den Assistenten und tippe das Beispiel «Wann war ich zuletzt in der Werkstatt?»: Die Antwort nennt das Datum deines letzten Besuchs.',
    'Ask «How many nights did I sleep outdoors this year?»: the answer counts the nights, or tells you how to mark a trip.': 'Frage «Wie viele Nächte habe ich dieses Jahr draussen geschlafen?»: Die Antwort zählt die Nächte oder sagt dir, wie du eine Tour markierst.',
  },
};
