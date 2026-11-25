# Nachtlauf mit Morgenmeldung und «Ausprobieren» im PR in den Regeln

PR (Nummer steht im PR) · 25.11.2026 · Auftrag: Noah «a» (Knopf, 25.11.2026 01:03), Weiterleitung durch den Koordinator (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 7: Nachtlauf startet abends, schreibt das Issue «Nacht-Meldung», «Ausprobieren» läuft nachts als eigener Auftrag; die Regel «Ausprobieren» im PR (bei geänderter Technik die neuesten 200 Zeilen plus die eigenen).
- `docs/regeln-archiv.md`: die alte Fassung (Noah «1a» 03.11.2026) wörtlich.
- Nur Doku, nichts sichtbar in der App; die Technik kam mit PR 1739.

## Was fällt weg oder rutscht tiefer
- «Bei geänderter Technik laufen weiter alle Zeilen» (jetzt: die neuesten 200 plus die eigenen), im Archiv.

## Selbst entschieden
- Die Startzeiten «21:17 UTC» und «20:37 UTC» habe ich aus `volle-pruefung.yml` und `nacht.yml` übernommen, nicht nur aus der Nachricht.
- Der Abschnitt «Nachtlauf» in Block 7 hat jetzt die Zeile «live seit 25.11.2026 mit PR 1739».
- Die alte Regel stand nicht in `docs/regeln.md`, nur in der Release-Datei vom 03.11.2026; deshalb steht im Archiv ihr Wortlaut von dort.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 25.11.2026: Nachtlauf und «Ausprobieren» im PR – siehe `docs/decisions/nachtlauf-regel.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` Block 7 öffnen: «Nachtlauf» nennt das Issue «Nacht-Meldung», darunter steht «Ausprobieren im PR».
