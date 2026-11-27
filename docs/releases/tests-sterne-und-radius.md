# Tests «Sterne auf den Karten» und «eigener Radius»: auf den gespeicherten Zustand warten

PR #NNNN · 27.11.2026 · Auftrag: Meldungen des Bündlers (e2e-Teil 3 rot auf PR 1842 und 1838; pinmarks auf reinem main rot)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `tests/e2e/pinmarks.spec.js` («pins on the cards: pin, unpin, switch off») und `tests/e2e/poipanel.spec.js` («an own radius: typed, checked, used for the query and remembered»).
- **pinmarks, Ursache (kein Wackler der Zeit, sondern der neuen Regel):** Seit PR 1826 bekommt ein blosser Link oder Knopf («Chip») keinen Stern (Noah 27.11.2026). Heute besteht fast nur aus Chips: der Stern, den der Test auf Heute griff (`homeweather`), steht nur kurz beim ersten Zeichnen und ist nach einer bis zwei Sekunden weg. Der Test klickte oft noch rechtzeitig (grün), oft nicht (rot, Handy 3 von 9 Läufen lokal). Jetzt setzt der Test den Stern auf der Seite Notizen (`f.notes`), deren Karte ihren Stern behält; den Schalter «Sterne aus» prüft er erst, wenn die Einstellung gespeichert ist und die Seite steht. 24 von 24 Läufen grün (3× pro Gerät).
- **poipanel, Ursache:** Der Test tippt den eigenen Radius «25», drückt Enter und lädt sofort neu. Die Wahl wird einen Augenblick später in die Einstellungen geschrieben (`poi-search`, asynchron); bei einem langsamen Rechner geht sie beim Neuladen verloren und das Feld ist danach leer (CI, Handy, Zeile 305). Der Test wartet jetzt, bis `radiusKm` 25 in den Einstellungen steht, und lädt dann neu. Lokal liess sich der Fehler nicht nachstellen (8 von 8 grün unter Last), die Ursache ist die fehlende Wartebedingung vor dem Neuladen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Stern wird auf der Seite Notizen gesetzt statt auf Heute, weil Heute nach der Chip-Regel (PR 1826) keinen stabilen Stern mehr hat. Das ist eine Folge von Noahs Entscheid, nicht eine Lockerung. Falls Noah auf Heute doch Sterne an den Karten will, ist das eine Entscheidung für den Favoriten-Thread.
- Nichts gelockert, keine feste Wartezeit eingebaut, das Zeitlimit blieb gleich.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: «e2e» grün. In der App nichts zu prüfen.
