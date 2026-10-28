# Kein Längen-Test mehr für Handy-Seiten

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «keine anforderung an eine länge der seite» (Thread «Verschlanken App, Tests und Speicher»), Anlass: main rot

## Was ist neu
- Nichts in der App. Der Test `handy-laenge` hat verlangt, dass jede Seite auf dem Handy höchstens drei Bildschirme hoch ist. «Auswerten» war 3.02 Bildschirme hoch, darum war main rot und jeder PR auch.
- Der Test, seine Liste (`src/lib/laenge.js`) und der Einzeltest dazu sind weg, so wie Noah am 26.10. entschieden hat (CLAUDE.md Regel 6).

## Was fällt weg oder rutscht tiefer
- Die Längen-Prüfung für Handy-Seiten (alter Weg: Test rot über drei Bildschirmen → neu: keine Prüfung). Noah hat das am 26.10.2026 so entschieden.
- Die Kurz-Listen (fünf Zeilen, dann «mehr») bleiben.

## Selbst entschieden
- Zwei Code-Kommentare, die auf `laenge.js` zeigten, sind angepasst.

## Entscheide (für decisions.md)
- 27.10.2026: Längenbudget weg (Eintrag in decisions.md).

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): ein veralteter Test weniger.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App anzuschauen.
2. Unter github.com/noahdolmetsch-af/packgenerator/actions ist der nächste Lauf auf main grün.
