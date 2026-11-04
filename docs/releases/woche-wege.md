# Wege aus «Diese Woche»

PR #? · 03.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» plus Zusatzideen (Thread «Untersuchen: Aktiv und Auswerten besser einbauen»), Schritt 3 von 9

## Was ist neu
- Unter «Diese Woche» auf Aktiv stehen zwei Links: «Wochenrückblick» und «Trainingspläne». Vorher waren beide drei Tipps entfernt (Aktiv › Training › Knopf).
- Sonntags-Faden: von Freitag 17:00 bis Ende Montag steht dort eine Zeile «Die Woche ist bald zu Ende. Schau zurück.» (am Montag: «Eine neue Woche beginnt. Schau auf die letzte zurück.»). Sie führt zum Wochenrückblick, der am Montag schon die Vorwoche zeigt.

## Was fällt weg oder rutscht tiefer
- nichts. Die alten Wege (Aktiv › Training, Woche) bleiben.

## Selbst entschieden
- Die Links stehen immer da, nicht nur am Sonntag (der Roboter-Befund: Rückblick war nur über Umwege erreichbar).
- Die Zeit kommt von der Uhr des Geräts (Freitag ab 17:00), gleiche Schwelle wie «Abend vor der Reise».
- Kein neuer Eintrag in `features.js`: beide Seiten gibt es schon (`f.weekreview`, Trainingspläne).
- `docs/app-stand.md` ist noch nicht auf main (PR #742); keine neue Funktionsgruppe, also keine Zeile nötig.

## Stand im Plan
- Aktiv und Auswerten: Schritt 3 (Wochenrückblick, Trainingspläne, Sonntags-Faden) gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen: unter «Diese Woche» «Wochenrückblick» tippen.
2. Zurück, «Trainingspläne» tippen.
3. Freitagabend oder am Wochenende: oben unter dem Wochenstreifen steht die Zeile zum Rückblick.
