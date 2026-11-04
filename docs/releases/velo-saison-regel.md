# Passt jetzt: das Velo nach der Jahreszeit

Auftrag: Noah «1a 2a 3a 4a 5a» und «Eine Saison-Regel für alles» (03.11.2026, Thread «Untersuchen: Velos-Pflege besser einbauen»), Teil 2a und Rückweg. Teil 5 von 7.

## Was ist neu
- Velos › Pflege: unter «Arbeit eintragen» steht im November «Velo einwintern», im Dezember «Rückblick aufs Velojahr», im Februar «Velo für den Frühling bereit machen» (Karte «Passt jetzt»).
- Heute › «Dein Moment»: dieselbe Zeile «Passt jetzt: …» mit Link.
- Die Einwinter- und die Frühlings-Karte verschwinden, sobald alle Punkte der Liste bei allen Velos abgehakt sind.
- Nach dem letzten Haken bei «Vor dem Winter» steht «Eingewintert.» mit dem Hinweis, dass «Passt jetzt» im Februar an den Frühling erinnert, und dem Weg zur Frühlings-Liste (Rückweg nach dem Tun).
- Eine Regel für alles: `src/lib/season.js` (`SEASON_RULES`). Skitouren-Saisonende oder Training-Winter tragen später ihre Zeilen dort ein und erscheinen gleich.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur ein Vorschlag nach Monat, es wird nichts gespeichert. Ohne Velo erscheint nichts.
- Der Monat kommt aus dem Kalendertag (`localDay()`, Europe/Zurich).
- Kein neuer Eintrag in `features.js`: es ist ein Teil von «Winter und Frühling» und «Jahresrückblick».
- Die Frühlings-Erinnerung ist die Karte im Februar selbst, kein eigener Push. Wer eine Mitteilung will, nutzt «Eigene Erinnerungen».

## Stand im Plan
- Velos-Pflege einbauen: Teil 2a und der Rückweg nach «eingewintert» erledigt. Offen: Strava-Kachel auf Heute (5a), Verschleiss kürzer und Gruppe in «Alles hier» (1a).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege (im November): unter «Arbeit eintragen» die Karte «Passt jetzt» mit «Velo einwintern».
2. Heute › «Dein Moment»: die Zeile «Passt jetzt: Velo einwintern».
3. «Velo einwintern» öffnen, alle Punkte abhaken: «Eingewintert.» mit dem Weg zur Frühlings-Liste; die Karte ist danach weg.
