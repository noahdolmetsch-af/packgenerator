// «Touren-Liste» (Noah 07.11.2026 «alle A–F», Idee A): under the course of a value the trips of the range are listed
export default {
  title: 'Your trips under the course',
  lead: 'Under the course of a value, the trips of the range are now listed with their mean.',
  points: [{ text: 'See how a value was on each trip, e.g. your cardio load', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-trip-list]' }], where: 'Analyse › a value (e.g. Cardio load) › under the course, once a trip lies in the range.' } }],
  small: [{ box: 'new', text: 'A finished trip opens its page with a tap' }],
  test: ['Open Analyse › Cardio load (3 months): under the course the trips of the range are listed, newest first.', 'Tap «Show all» for the rest, then a finished trip: its page opens.'],
  since: [],
  de: {
    'Your trips under the course': 'Deine Touren unter dem Verlauf',
    'Under the course of a value, the trips of the range are now listed with their mean.': 'Unter dem Verlauf eines Werts stehen jetzt die Touren des Zeitraums, jeweils mit ihrem Schnitt.',
    'See how a value was on each trip, e.g. your cardio load': 'Sieh, wie ein Wert auf jeder Tour war, zum Beispiel deine Cardio-Belastung',
    'Analyse › a value (e.g. Cardio load) › under the course, once a trip lies in the range.': 'Analyse › ein Wert (z. B. Cardio-Belastung) › unter dem Verlauf, sobald eine Tour im Zeitraum liegt.',
    'A finished trip opens its page with a tap': 'Eine abgeschlossene Tour öffnet mit einem Tipp ihre Seite',
    'Open Analyse › Cardio load (3 months): under the course the trips of the range are listed, newest first.': 'Öffne Analyse › Cardio-Belastung (3 Monate): unter dem Verlauf stehen die Touren des Zeitraums, die neuste zuerst.',
    'Tap «Show all» for the rest, then a finished trip: its page opens.': 'Tippe «Alle zeigen» für den Rest, dann eine abgeschlossene Tour: ihre Seite öffnet sich.',
  },
};
