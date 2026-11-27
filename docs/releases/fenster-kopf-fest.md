# Fenster: Kopf und Fuss bündig

PR folgt · 27.11.2026 · Auftrag: Noah «1, 2, 3, 4» (Punkt 3) im Thread «Lieblingsinhalte besser sichtbar machen»

## Was ist neu
- In einem langen Fenster (zum Beispiel «Alle» bei den Favoriten) blitzte beim Scrollen die nächste Zeile über der Kopfzeile auf, und unter «Fertig» war ein Streifen. Kopf und Fuss kleben jetzt bündig am Rand des Fensters (`app.css`: `top`/`bottom` der festen Teile von `.vdlg` gleichen den Innenabstand des Fensters aus).
- Der Wächter `tests/e2e/fenster-nie-abgeschnitten.spec.js` prüft das ab jetzt für jedes Fenster, das er öffnet: nach dem Scrollen bis ganz unten liegen Kopf und Fuss genau am Rand (400, 700, 800, 900 Pixel Höhe und Handy).

## Was fällt weg oder rutscht tiefer
- Nichts. Nur der sichtbare Streifen über dem Kopf und unter dem Fuss fällt weg.

## Selbst entschieden
- Der Fehler steckt in der gemeinsamen Fensterschicht (`dialog.sheet.vdlg`), darum ist es ein eigener PR und nicht Teil der Favoriten-Kachel. Er läuft deshalb mit allen Fenster-Wächtern.

## Entscheide (eigene Datei `docs/decisions/fenster-kopf-fest.md`)
- 27.11.2026: Kopf und Fuss der Fenster liegen bündig am Fensterrand

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, bei den Favoriten «Alle» antippen und ganz nach unten scrollen.
2. Der Titel «Favoriten» steht am oberen Rand, «Fertig» am unteren, darüber und darunter ist keine halbe Zeile zu sehen.
