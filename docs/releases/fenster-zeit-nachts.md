# Fenster-Test mit vier Uhrzeiten im Nachtlauf

PR #1805 · 26.11.2026 · Auftrag: Noah «Ja, jede Nacht mitlaufen» (Thread «Gesamttest der ganzen App»), Plan «Tests auf den neuen App-Stand bringen» Schritt 3

## Was ist neu
- Nichts Sichtbares geändert, nur Test: `tests/e2e/gesamttest/fenster-zeit.spec.js` (neu) läuft mit dem nächtlichen Gesamttest.
- Er öffnet das Fenster «Wi gaht's?» (Morgen 07:30, Mittag 12:30, Abend 19:15, Nacht 23:30) auf Laptop 1440×800 und 1366×768 sowie Handy 390 und 320. Jede Frage wird angeschaut: liegt das Fenster im Bild, bleiben ✕ und Knöpfe ganz unten sichtbar, ist das letzte Feld erreichbar, passt die Frage zur Tageszeit (kein «heute Nacht geträumt» am Abend), Satzanfang gross, «Std.» statt «h».
- Dazu die Fenster hinter «Neu», Suche, «?» und «Verbessern»: ihr unterer Rand liegt im Bild, Texte wie oben.
- Eigene Daten: 40 Fitbit-Tage mit kurzer letzter Nacht und die Einstellung «Wi gaht's?» (Fenster «Los» auf Heute, seit PR 1769).
- Lokal auf main (26.11.2026, gebaut aus dem Stand nach PR 1794): Computer 8 von 8 grün (3,2 Min), Handy 8 von 8 grün (3,7 Min); die jeweils anderen 8 Fälle gehören zum anderen Gerät und werden übersprungen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Test liegt im Ordner `gesamttest`, damit der bestehende Nachtlauf ihn ohne Änderung an `volle-pruefung.yml` mitnimmt; im PR läuft er nicht (`E2E_SKIP_GESAMTTEST`).
- Die Text-Prüfung meldet «Noch offen von heute Morgen» (19:15) nicht als Morgenfrage am Abend, weil das Fenster es so sagt.

## Entscheide (eigene Datei `docs/decisions/fenster-zeit-nachts.md`)
- 25.11.2026: Fenster-Test jede Nacht mitlaufen (Noah «Ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge)
1. In der Nacht danach: Gesamttest grün. Ist er rot, steht im Bericht, welches Fenster zu welcher Uhrzeit und Grösse, und das Bild liegt im Lauf-Bericht.
