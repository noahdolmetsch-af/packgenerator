/**
 * German texts of «What is new» that the start needs (whatsnew.js, Today's tile «New», the banner after an update).
 * Keys are the English texts. Swiss spelling (ss). Since 05.11.2026 (Tempo, Noah «a») the rest of the German of the list loads
 * with the page «What is new» (src/lib/whatsnew-all.js: src/lib/whatsnew-alt-de.js for the hand-numbered versions, archiv.gen.js for
 * the older news files). Here stay: the German of the newest news files, older German that other places of the app use
 * too (scripts/news.mjs sharedDe) and, from the hand-numbered versions, the same kind of texts.
 */
import { NEWS_NEU_DE, NEWS_SHARED_DE } from '../../news/neu.gen.js';

const ALT_SHARED = {
  'Bikes › Care › a bike › «Wear» › «Year in review».': 'Velos › Pflege › ein Velo › «Verschleiss» › «Jahresrückblick».',
  'Open Trips › «Trips side by side» and tap two trips.': 'Öffne Touren › «Touren nebeneinander» und tippe zwei Touren an.',
  'What do you need?': 'Was brauchst du?',
  'Good to know': 'Gut zu wissen',
  'Older updates': 'Ältere Updates',
  'Version {v}': 'Version {v}',
  '{from} to {to}|versions': '{from} bis {to}',
  'New since your last visit': 'Neu seit deinem letzten Besuch',
  'Buttons explain': 'Knöpfe erklären sich',
  'Strava connection': 'Strava-Verbindung',
  'Rides with their bike from Strava, fetched by themselves; a changed bike asks first.': 'Fahrten mit ihrem Velo aus Strava, von selbst geholt; ein geändertes Velo fragt zuerst.',
  'Swim or sauna?': 'Baden oder Sauna?',
  'Step by step': 'Schritt für Schritt',
  'Everything the app can do': 'Alles, was die App kann',
  'The search finds functions too, for example «warranty»': 'Die Suche findet auch Funktionen, zum Beispiel «Garantie»',
  'Cushion time': 'Kissenzeit',
  'A few words become a packing list suggestion': 'Aus ein paar Wörtern wird ein Packlisten-Vorschlag',
  'Your last ride, the last 12 months and your trips compared, on one page.': 'Deine letzte Fahrt, die letzten 12 Monate und deine Touren im Vergleich, auf einer Seite.',
  'In the flow': 'Aktiv',
  'One problem per line': 'Ein Problem pro Zeile',
  'Warm to cold': 'Von warm bis kalt',
  'Plan a trip': 'Tour planen',
  'The big button': 'Der grosse Knopf',
  'Your own pace': 'Dein eigenes Tempo',
  'Before the trip': 'Vor der Tour',
  'On the way': 'Unterwegs',
  'From 14 days before a trip: what the workshop still has to do': 'Ab 14 Tagen vor einer Tour: was die Werkstatt noch machen muss',
  'Unknown is not zero': 'Unbekannt ist nicht null',
  'Workshop visits': 'Werkstattbesuche',
  'Route and weather': 'Route und Wetter',
  'Bags on the bike': 'Taschen am Velo',
  'The start check': 'Der Startcheck',
  'Bikes and bags': 'Velos und Taschen',
  'Open Trips › Look back › Heatmap.': 'Öffne Touren › Rückblick › Heatmap.',
  'Your own values': 'Deine eigenen Werte',
  'Open Me › Own values › «+ Own reminder».': 'Öffne Ich › Eigene Werte › «+ Eigene Erinnerung».',
  'Draw on every photo': 'Auf jedem Foto zeichnen',
  'Plan and reality after the tour': 'Plan und echt nach der Tour',
  'Measure the charging time once': 'Ladezeit einmal messen',
};

export default { ...ALT_SHARED, ...NEWS_SHARED_DE, ...NEWS_NEU_DE };
