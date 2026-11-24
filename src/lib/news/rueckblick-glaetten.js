// Small fix after «Rückblick: Fragen später …» (Noah 24.11.2026): whole hours read «3 h», the figures of the Mini-Bericht keep their space
export default {
  title: 'Cleaner ride question and report picture',
  lead: 'The ride question says «3 h below 5 °C» instead of «3:00 h», and the figures on the Mini-Bericht picture no longer run into each other.',
  points: [{ text: 'Whole hours in the ride question read «3 h», and a long number on the Mini-Bericht keeps its space', go: 'f.later' }],
  small: [{ box: 'fixed', text: 'Mini-Bericht: the figures no longer touch' }],
  test: ['Open a ride with a cold part: the question reads «3 h below 5 °C» when it was exactly three hours.', 'Open the Mini-Bericht of a race: kilometres, metres up and days stand apart.'],
  since: [],
  de: {
    'Cleaner ride question and report picture': 'Klarere Fahrtenfrage und Berichtbild',
    'The ride question says «3 h below 5 °C» instead of «3:00 h», and the figures on the Mini-Bericht picture no longer run into each other.': 'Die Fahrtenfrage sagt «3 Std. unter 5 °C» statt «3:00 Std.», und die Zahlen auf dem Mini-Bericht-Bild stossen nicht mehr aneinander.',
    'Whole hours in the ride question read «3 h», and a long number on the Mini-Bericht keeps its space': 'Volle Stunden in der Fahrtenfrage heissen «3 Std.», und eine lange Zahl im Mini-Bericht behält ihren Platz',
    'Mini-Bericht: the figures no longer touch': 'Mini-Bericht: die Zahlen berühren sich nicht mehr',
    'Open a ride with a cold part: the question reads «3 h below 5 °C» when it was exactly three hours.': 'Öffne eine Fahrt mit einem kalten Teil: die Frage sagt «3 Std. unter 5 °C», wenn es genau drei Stunden waren.',
    'Open the Mini-Bericht of a race: kilometres, metres up and days stand apart.': 'Öffne den Mini-Bericht eines Rennens: Kilometer, Höhenmeter und Tage stehen getrennt.',
  },
};
