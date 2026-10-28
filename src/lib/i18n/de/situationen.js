// Suchvorschläge (Noah 27.10.2026): the situation buttons on top of «In der Nähe» (src/lib/map/situations.js).
// Vorlagen mit Feldern (Noah 27.10.2026): its German texts are joined here, so de/index.js (one line everyone appends to) stays untouched.
import vorlagenfelder from './vorlagenfelder.js';
export default {
  ...vorlagenfelder,
  'Hunger|situation': 'Hunger',
  'Thirst|situation': 'Durst',
  'Breakdown|situation': 'Panne',
  'Coffee break|situation': 'Kaffeepause',
  'Take me home|situation': 'Nach Hause',
  'Sleep|situation': 'Schlafen',
  'Find a spot for the night|situation': 'Schlafplatz finden',
  'Relax|situation': 'Erholung',
  'Rain|situation': 'Regen',
  'Heat|situation': 'Hitze',
  'Night|situation': 'Nacht',
  'Battery empty|situation': 'Akku leer',
  'Emergency|situation': 'Notfall',
  'Sunday|situation': 'Sonntag',
  'What do you need?|poi': 'Was brauchst du?',
  'Everything|poi': 'Alles',
  'Every kind of your row at once, within {km} km.|poi': 'Alle Arten deiner Reihe auf einmal, im Umkreis von {km} km.',
  '«{name}» looks for: {kinds}.|poi': '«{name}» sucht: {kinds}.',
  'Only what is open now.|poi': 'Nur was jetzt offen hat.',
  'Go there|poi': 'Hin',
  'The bike router plans the way there and back onto your route, with the extra km and minutes.|poi': 'Der Velo-Router plant den Weg hin und zurück auf deine Strecke, mit den Zusatz-km und -Minuten.',
  'Nearby': 'In der Nähe',
  'Nearby: what do you need?': 'In der Nähe: Was brauchst du?',
};
