# Wackel-Test «Sprung zur Funktion» repariert (Packen-Vorschlagsliste)

21.11.2026 · Auftrag: Noah «ja» zu «jeden Tag einen Wackel-Test an der Ursache reparieren» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

## Was ist neu
- Nichts, was du sofort siehst. Der Test `spot.spec.js` («ein Tipp im Katalog leuchtet die Stelle der Funktion an») war in der Prüfung manchmal rot, zuletzt bei «Packen: Vorschlagsliste».
- Ursache: Beim Sprung zur Stelle (`light()` in `src/lib/know/spot.js`) kommen auf einem langsamen Gerät noch Karten über der Stelle herein und schieben sie wieder aus dem Bild. Die App schaute nur einmal nach 0,4 Sekunden nach.
- Reparatur in der App: Sie schaut jetzt dreimal nach (0,4, 1 und 2 Sekunden) und holt die Stelle zurück, solange du nicht selbst scrollst, tippst oder schreibst (Hand des Nutzers gewinnt). Reparatur im Test: er misst «im Bild» nicht mehr in der ersten Millisekunde, sondern wartet bis zu 2,5 Sekunden darauf.
- Nachgestellt unter Last (12 Läufe gleichzeitig): vorher 2 von 12 rot, nachher 12 von 12 grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Keine «Was ist neu»-Datei: für dich ändert sich nichts Sichtbares ausser, dass der Sprung zur Stelle auf langsamen Geräten zuverlässiger beim Ziel bleibt.
- Der Test wurde nicht gelockert: er prüft weiter, dass die Stelle im Bild ist, er gibt ihr nur die Zeit, die die App selbst braucht.

## Prüfschritte (nach dem Merge)
1. In der Nachtprüfung steht «Sprung zur Funktion» nicht mehr in der Wackel-Liste.
