# Ruhigeres Scrollen

Auftrag: Noah «1a und b, 2a und b beim scrollen auf heute» (Thread «Klären: App wird langsam»), Bericht `notes/tempo-2026-11-02/README.md`

## Was ist neu
- Die Quick-Links-Pins (PinMarks) messen nicht mehr bei jedem Scroll-Bild, sondern einmal 140 ms nach dem Scrollen.
- Die Pin-Suche startet nicht mehr bei reinen Textänderungen (tickende Uhren auf Heute).

## Was fällt weg oder rutscht tiefer
- nichts. Pins am Bildrand erscheinen kurz nach dem Anhalten statt während des Scrollens.

## Selbst entschieden
- 140 ms Wartezeit: kurz genug, dass es nicht auffällt.

## Stand im Plan
- Tempo-Plan: PR 1 von 3 (danach deutsche Texte beim Start, dann Tempo-Test in der Prüfung).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute mit dem Finger auf und ab scrollen: es soll gleichmässiger laufen.
2. Anhalten: die kleinen Pins erscheinen nach einem Moment.
