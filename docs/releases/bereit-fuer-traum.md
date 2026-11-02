# Bereit für den Traum?

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N16

## Was ist neu
- Touren › Träume › ein Traum: neuer Teil «Bereit dafür?» unter Bild und Karte (`src/lib/dreams/DreamReady.svelte`).
- Vier Zeilen, gefüllter Ring = bereit, leerer Ring = fehlt noch (`src/lib/dreams/bereit.js`):
  - längste Fahrt der letzten 12 Monate gegenüber den km pro Tag des Traums,
  - meiste Höhenmeter in einer Fahrt gegenüber den Höhenmetern pro Tag,
  - bei mehreren Tagen: meiste Tage am Stück (je mindestens 20 km), gebraucht bis 3,
  - bei mehreren Tagen: Schlafsachen im Material (Kategorie «Schlafen»), sonst «Oder im Hotel schlafen: das geht auch».
- «Bereit» ab 85 % des Gebrauchten. Fahrten: Strava-Velofahrten und hochgeladene Fahrten.
- Neue Funktion im Katalog: `f.dreamready`.

## Was fällt weg oder rutscht tiefer
- Im Traum-Fenster rücken Notiz und «Ein kleiner Vorgeschmack» um den neuen Teil nach unten.

## Selbst entschieden
- Nur ein Hinweis, nie eine Sperre: der Traum lässt sich immer planen.
- Ohne km, Höhenmeter oder mehrere Tage im Traum erscheint der Teil nicht.
- Läufe, Wanderungen und Rollentraining zählen nicht.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 10 von 20 (N16). Als Nächstes N15 «Wetterfenster».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: einen Traum mit km öffnen (GPX-Datei oder Link).
2. «Bereit dafür?»: Zeilen mit gefüllten oder leeren Ringen.
3. Tage auf 1 stellen: «Tage am Stück» und «Schlafsachen» verschwinden.
