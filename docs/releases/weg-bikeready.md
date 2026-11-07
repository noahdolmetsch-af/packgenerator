# Weg zum Ziel: Schrittart «Bike ready»

PR # · 07.11.2026 · Auftrag: Noah «a» vom 05.11.2026 (Thread «Planen: Bike ready im Weg»)

## Was ist neu
- Nichts Sichtbares. Die Seite «Weg zum Ziel» (K2) zeigt die Schrittart automatisch, sobald sie in der Liste `TYPES` steht.
- `src/lib/weg/types/bikeready.js`: der Velo-Countdown mit vier Schritten, die auf die Velo-Seiten zeigen:
  - **Fällige Pflege erledigen** (42 Tage = 6 Wochen vor dem Start, Link zur Veloinspektion): Haken, wenn am Velo nichts mehr fällig oder offen ist und es in den letzten 8 Wochen vor dem Start angeschaut wurde.
  - **Reifen prüfen** (35 Tage = 5 Wochen, Link zum Verschleiss): Haken, wenn die Reifen kürzlich geprüft, gewartet oder gewechselt wurden und nichts offen ist.
  - **Kette prüfen** (21 Tage = 3 Wochen, Link zum Verschleiss): Haken, wenn die Kette kürzlich angeschaut wurde, nichts offen ist und sie nicht abgenutzt ist.
  - **Werkzeug und Reparaturset prüfen** (14 Tage = 2 Wochen, Link zum Reparaturset des Velos): nur von Hand, die App weiss nicht, was in der Tasche liegt.
- Der Streifen «x von 4 geregelt» zählt diese vier Schritte (`typeProgress(goal, 'bikeready', …)`).
- Eine Zeile in `src/lib/weg/types/index.js`, deutsche Texte in `src/lib/i18n/de/weg-bikeready.js`, Tests in `tests/weg-bikeready.test.js`, eine Zeile in `docs/app-stand.md`.

## Was fällt weg oder rutscht tiefer
- nichts (keine Oberfläche)

## Selbst entschieden
- Welches Velo (Noah «a»): das Velo der Tour (`ctx.trips[goal.tripId].bikeId`). Bei freien Zielen wählt Noah es beim Anlegen (`goal.bikeId`); ein gewähltes Velo gilt auch bei einer Tour vor dem Velo der Tour. Die Seite reicht `ctx.bikes` (Liste der Velos mit Teilen) und `ctx.trips` (Touren nach Id) an `applyAuto` weiter. `newGoal` in `weg.js` kennt `bikeId` noch nicht; das kommt mit dem Anlegen-Blatt (K2), der Wert bleibt am Ziel erhalten (`goalOf` behält fremde Felder).
- «Kürzlich» = ab 56 Tage (8 Wochen) vor dem Start. So hakt eine Kontrolle aus der letzten Saison nichts ab. Ohne Start-Tag, ohne Velo oder ohne das Teil bleibt der Schritt offen (die App weiss es nicht).
- «Fällige Pflege» ist erledigt, wenn kein Teil «Arbeit nötig» zeigt, kein Service nach eigenem Kilometer-Abstand fällig ist, der 1000-km-Check nichts fällig hat und mindestens ein Teil im Zeitraum angeschaut wurde. Nur «nichts fällig» würde bei einem neuen Velo ohne Daten sofort abhaken.
- Freie Ziele bekommen die vier Schritte nur, wenn ein Velo gewählt ist; ein Ziel wie «Schwimmen lernen» soll keine Velo-Schritte vorgeschlagen bekommen. Bei Rennen und Touren gibt es sie immer.
- Jeder Schritt trägt ein Feld `key` (`care`, `tyres`, `chain`, `tools`). Es bleibt, wenn Noah den Schritt umbenennt oder verschiebt. Beim Speichern eines Wegs als Vorlage geht `key` heute verloren (siehe Release «Rennplanung»); das ist ein kleiner Fix an `templateOf` und gehört nicht in diesen PR.
- Test `weg-rennplanung.test.js` prüft die Registry jetzt nur noch an den ersten zwei Stellen, damit die Schrittarten der anderen Threads ihn nicht jedes Mal ändern müssen.
- Kein Eintrag in `features.js`, keine «Was ist neu»-Datei: es gibt noch keine Seite. Die Fertig-Regel (Seite, Absprung, Gut zu wissen, Leere Ansicht, Als Nächstes) kommt mit K2.

## Entscheide (für decisions.md)
- 05.11.2026: Bike ready im Weg = Velo der Tour, bei freien Zielen beim Anlegen gewählt (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G «Weg zum Ziel»: Schrittart «Bike ready» gebaut, sichtbar mit der Seite (K2). `docs/vorhaben.md` und `docs/roadmap.md` ändern sich nicht.

## Prüfschritte
Nichts zu prüfen auf der Seite. Die Tests laufen auf GitHub (build, e2e desktop).
