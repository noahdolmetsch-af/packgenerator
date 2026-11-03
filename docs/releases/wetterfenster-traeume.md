# Wetterfenster für Träume

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N15

## Was ist neu
- Touren › Träume: ein Traum, der jetzt passt, zeigt «Passt jetzt, trocken Do–Sa», wenn die Prognose genug trockene Tage am Stück hat.
- Touren › Übersicht: die Zeile «Ein Traum passt jetzt: …» ergänzt «trocken Do–Sa».
- Regeln (`src/lib/dreams/wetterfenster.js`): trocken = unter 1 mm und unter 40 % Regenchance; gebraucht werden die Tage des Traums, mindestens 2, höchstens 3. Ort = Start der Traum-Karte, sonst der Wohnort.
- Die Prognose (freier Wetterdienst Open-Meteo, wie überall in der App) wird auf dem Gerät gespeichert (`db.meta` «dreams.wx», nicht im Backup), höchstens alle 3 Stunden neu geholt, höchstens 4 Orte, nur beim Öffnen von Träume oder Übersicht.
- Neue Funktion im Katalog: `f.dreamwx`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine Push-Meldung: nur ein ruhiger Hinweis auf den Seiten.
- Gespeicherte Prognosen älter als 2 Tage werden gelöscht.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 11 von 20 (N15). Als Nächstes N14 «Karte aller Träume».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: ein Traum, der jetzt passt (Monate ändern, falls nötig).
2. Kommen trockene Tage, steht beim Traum «Passt jetzt, trocken …».
3. Touren › Übersicht: die Traum-Zeile ergänzt «trocken …».
