// «Velos-Pflege einbauen» (Noah 03.11.2026 «2a»): «Fits now» by month on Bikes › Care and on Today
export default {
  title: 'Fits now: the bike by the season',
  lead: 'In November the bike care and Today suggest putting the bike away, in December the year in review, in February spring.',
  points: [
    { text: 'Bikes › Care: the card «Fits now» in the season', go: { href: '#/bikes?tab=care', where: 'Shows under «Record work» in November, December and February.' } },
    { text: 'Today › «Your moment»: the line «Fits now»', go: { href: '#/', where: 'Shows in the card «Your moment» in November, December and February.' } },
    { text: 'After the last tick of «Before the winter»: «Put away for the winter.»', go: { href: '#/bikes?tab=care&view=season', where: 'Shows under the winter list once every point is ticked.' } },
  ],
  small: [],
  test: [
    'In November open Bikes › Care: under «Record work» the card «Fits now» offers «Put the bike away for the winter».',
    'Open it and tick every point of «Before the winter»: «Put away for the winter.» and the way to the spring list appear.',
    'Back on Bikes › Care the card is gone.',
  ],
  since: [],
  de: {
    'Fits now: the bike by the season': 'Passt jetzt: das Velo nach der Jahreszeit',
    'In November the bike care and Today suggest putting the bike away, in December the year in review, in February spring.': 'Im November schlagen Velopflege und Heute das Einwintern vor, im Dezember den Jahresrückblick, im Februar den Frühling.',
    'Bikes › Care: the card «Fits now» in the season': 'Velos › Pflege: die Karte «Passt jetzt» zur Jahreszeit',
    'Shows under «Record work» in November, December and February.': 'Steht unter «Arbeit eintragen» im November, Dezember und Februar.',
    'Today › «Your moment»: the line «Fits now»': 'Heute › «Dein Moment»: die Zeile «Passt jetzt»',
    'Shows in the card «Your moment» in November, December and February.': 'Steht in der Karte «Dein Moment» im November, Dezember und Februar.',
    'After the last tick of «Before the winter»: «Put away for the winter.»': 'Nach dem letzten Haken bei «Vor dem Winter»: «Eingewintert.»',
    'Shows under the winter list once every point is ticked.': 'Steht unter der Winter-Liste, sobald jeder Punkt abgehakt ist.',
    'In November open Bikes › Care: under «Record work» the card «Fits now» offers «Put the bike away for the winter».': 'Öffne im November Velos › Pflege: unter «Arbeit eintragen» bietet die Karte «Passt jetzt» «Velo einwintern» an.',
    'Open it and tick every point of «Before the winter»: «Put away for the winter.» and the way to the spring list appear.': 'Öffne sie und hake jeden Punkt bei «Vor dem Winter» ab: «Eingewintert.» und der Weg zur Frühlings-Liste erscheinen.',
    'Back on Bikes › Care the card is gone.': 'Zurück bei Velos › Pflege ist die Karte weg.',
  },
};
