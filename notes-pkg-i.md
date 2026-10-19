# Paket I · «Velo im Griff» – Einträge für den Bundler

Branch `pkg-i`. Diese Einträge habe ich NICHT in die gesperrten Dateien geschrieben; bitte beim Mergen einfügen.

## 1. `src/lib/i18n/de/index.js` (Pflicht, sonst englische Wörter im deutschen UI)

```js
// «Velo im Griff» (Noah 19.10.2026): Velo-Service nach km/Stunden/Tagen, Teilevorlage pro Velo-Art, Werkstatt-Spick
import veloimgriff from './veloimgriff.js';
```
und `...veloimgriff` ans Ende des `export default { … }`-Objekts.

## 2. `src/lib/features.js` (3 Einträge, group `bike`)

```js
{ id: 'f.bikeservice', group: 'bike', title: 'Bike service by km, hours or days', text: 'The service of the whole bike and the fork by km, riding hours or days, whichever comes first.', href: '#/bikes?tab=care', words: 'service wartung stunden fahrstunden gabel dämpfer km tage velo-service' },
{ id: 'f.parttemplate', group: 'bike', title: 'Part template per kind', text: 'Road bike, gravel or mountain bike: which parts a bike gets; own parts too.', href: '#/bikes?tab=care&view=templates', words: 'teilevorlage vorlage teile rennvelo gravel mountainbike art eigene teile' },
{ id: 'f.spick', group: 'bike', title: 'Workshop cheat sheet', text: 'Typical torque values with your own, and breakdown help step by step, also offline.', href: '#/bikes?tab=care&view=spick', words: 'drehmoment nm schrauben panne platten kette schaltauge speiche offline spick werkstatt' },
```

German (in a de file of your choice, e.g. append to `veloimgriff.js`):

```js
'Bike service by km, hours or days': 'Velo-Service nach km, Stunden oder Tagen',
'The service of the whole bike and the fork by km, riding hours or days, whichever comes first.': 'Der Service fürs ganze Velo und die Gabel nach km, Fahrstunden oder Tagen, was zuerst kommt.',
'Part template per kind': 'Teilevorlage pro Velo-Art',
'Road bike, gravel or mountain bike: which parts a bike gets; own parts too.': 'Rennvelo, Gravel oder Mountainbike: welche Teile ein Velo bekommt; auch eigene Teile.',
'Typical torque values with your own, and breakdown help step by step, also offline.': 'Übliche Drehmomente mit deinen eigenen, und Pannenhilfe Schritt für Schritt, auch offline.',
```
(«Workshop cheat sheet» → «Werkstatt-Spick» ist schon in `veloimgriff.js`.)

## 3. `src/lib/know/howto.js` (je 3 Schritte)

```js
'f.bikeservice': ['Open a bike under Bikes › Care.', 'Card «Bike service»: tap «Set up» for km, hours and days.', 'After the service tap «Service done».'],
'f.parttemplate': ['Open Bikes › Care › a bike › «Part template».', 'Choose the kind and switch parts on or off.', 'Add your own parts; a new bike of that kind gets them.'],
'f.spick': ['Open Bikes › Care › a bike › «Workshop cheat sheet».', 'Look up the torque; add your own values.', 'Under «Breakdown help» open the breakdown you have.'],
```

German:

```js
'Open a bike under Bikes › Care.': 'Öffne ein Velo unter Velos › Pflege.',
'Card «Bike service»: tap «Set up» for km, hours and days.': 'Karte «Velo-Service»: «Einstellen» für km, Stunden und Tage.',
'After the service tap «Service done».': 'Nach dem Service tippst du auf «Service gemacht».',
'Open Bikes › Care › a bike › «Part template».': 'Öffne Velos › Pflege › ein Velo › «Teilevorlage».',
'Choose the kind and switch parts on or off.': 'Wähle die Art und schalte Teile ein oder aus.',
'Add your own parts; a new bike of that kind gets them.': 'Füge eigene Teile hinzu; ein neues Velo dieser Art bekommt sie.',
'Open Bikes › Care › a bike › «Workshop cheat sheet».': 'Öffne Velos › Pflege › ein Velo › «Werkstatt-Spick».',
'Look up the torque; add your own values.': 'Schau das Drehmoment nach; trag deine eigenen Werte ein.',
'Under «Breakdown help» open the breakdown you have.': 'Unter «Pannenhilfe» öffnest du die Panne, die du hast.',
```

## 4. `src/lib/handbook.js`

```js
'f.bikeservice': {
  on: 'Needs a bike with its km.',
  steps: ['Bikes › Care › your bike: the card «Bike service».', '«Set up»: every 3000 km, 100 h or 365 days, each one can be off.', '«Service done» after the service; it is due again by whichever comes first.'],
  example: 'Example: mountain bike, 1400 km since the service at 14 km/h ≈ 100 h → due.',
},
'f.parttemplate': {
  on: null,
  steps: ['Bikes › Care › a bike › «Part template».', 'Choose road bike, gravel or mountain bike and switch parts on or off.', 'Own parts: add, rename, move, delete.'],
  example: 'Example: gravel gets «Bell»; every new gravel bike starts with it.',
},
'f.spick': {
  on: null,
  steps: ['Bikes › Care › a bike › «Workshop cheat sheet».', 'Torque values: the value on the part always wins.', '«Breakdown help»: short steps for flat tyre, chain, hanger, brake, spoke, creak.'],
  example: 'Example: thru axle 12–15 Nm; your stem says 5 Nm → add it as your own row.',
},
```

German:

```js
'Needs a bike with its km.': 'Braucht ein Velo mit seinen km.',
'Bikes › Care › your bike: the card «Bike service».': 'Velos › Pflege › dein Velo: die Karte «Velo-Service».',
'«Set up»: every 3000 km, 100 h or 365 days, each one can be off.': '«Einstellen»: alle 3000 km, 100 h oder 365 Tage, jedes einzeln abschaltbar.',
'«Service done» after the service; it is due again by whichever comes first.': '«Service gemacht» nach dem Service; fällig wird er wieder nach dem, was zuerst kommt.',
'Example: mountain bike, 1400 km since the service at 14 km/h ≈ 100 h → due.': 'Beispiel: Mountainbike, 1400 km seit dem Service bei 14 km/h ≈ 100 h → fällig.',
'Bikes › Care › a bike › «Part template».': 'Velos › Pflege › ein Velo › «Teilevorlage».',
'Choose road bike, gravel or mountain bike and switch parts on or off.': 'Wähle Rennvelo, Gravel oder Mountainbike und schalte Teile ein oder aus.',
'Own parts: add, rename, move, delete.': 'Eigene Teile: hinzufügen, umbenennen, verschieben, löschen.',
'Example: gravel gets «Bell»; every new gravel bike starts with it.': 'Beispiel: Gravel bekommt «Klingel»; jedes neue Gravel startet damit.',
'Bikes › Care › a bike › «Workshop cheat sheet».': 'Velos › Pflege › ein Velo › «Werkstatt-Spick».',
'Torque values: the value on the part always wins.': 'Drehmomente: der Wert auf dem Teil gilt immer.',
'«Breakdown help»: short steps for flat tyre, chain, hanger, brake, spoke, creak.': '«Pannenhilfe»: kurze Schritte für Platten, Kette, Schaltauge, Bremse, Speiche, Knacken.',
'Example: thru axle 12–15 Nm; your stem says 5 Nm → add it as your own row.': 'Beispiel: Steckachse 12–15 Nm; dein Vorbau sagt 5 Nm → als eigene Zeile eintragen.',
```

## 5. `whatsnew.js` / `know/wasneu.js` (Vorschlag, 3 Punkte)

- `Bike service for every bike: by km, riding hours or days, whichever comes first; fork and shock also by hours.` → `Velo-Service für jedes Velo: nach km, Fahrstunden oder Tagen, was zuerst kommt; Gabel und Dämpfer auch nach Stunden.`
- `Part template per kind: road bike, gravel, mountain bike, with your own parts; geometry now has 12 values (trail).` → `Teilevorlage pro Velo-Art: Rennvelo, Gravel, Mountainbike, mit eigenen Teilen; die Geometrie hat jetzt 12 Werte (Nachlauf).`
- `Workshop cheat sheet: torque values and breakdown help, also offline.` → `Werkstatt-Spick: Drehmomente und Pannenhilfe, auch offline.`

## 6. Für den PR-Text

**Selbst entschieden**
- Gabel/Dämpfer nach Stunden: Standard **aus**, das Blatt bietet «50 h nehmen» an (sonst wären bei Bestandsdaten sofort viele Gabeln fällig).
- Velo-Service ist erst fällig, wenn ein letzter Service erfasst ist («Service gemacht» oder Datum aus Quittung).
- Velo-Art ohne Angabe: aus dem Typ-Text gelesen, sonst «Gravel».
- Gravel-Vorlage: mit Gabel (ausschaltbar); Rennvelo: ohne Gabel/Dämpfer/Hinterbau; Mountainbike: alles, Dämpfer und Hinterbau nur beim Fully.
- Geschätzte Stunden: km ÷ Tempo (Velo-eigenes `avgKmh`, sonst Rennvelo 25, Gravel 20, MTB 14 km/h), mit «≈».
- Abhol-Check (Werkstatt-Auftrag) trägt den Velo-Service nicht automatisch ein (nur Teile); dafür «Service gemacht».

**Was fällt weg oder rutscht tiefer**
- Leere Teile, die nicht zur Velo-Art gehören, sind ausgeblendet (z. B. leere Gabel am Rennvelo, leerer Dämpfer am Gravel/Hardtail). Alt: jedes Velo hatte alle Teile. Neu: Teilevorlage einschalten bringt sie zurück. Teile mit Daten bleiben immer. → Noah fragen.
