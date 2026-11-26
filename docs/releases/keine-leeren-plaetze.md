# Keine leeren Prüfplätze: Bündler zählt, Warteliste, Koordinator prüft

PR (Nummer steht im PR) · 26.11.2026 · Auftrag: Noah «a» (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 4: Regel «Keine leeren Plätze»: der Bündler zählt nach jedem Merge die freien Plätze und schreibt selbst den nächsten wartenden Thread an; es gibt eine Warteliste («fertig, freigegeben»); der Koordinator prüft bei jedem Zwischenstand.
- `docs/regeln.md` Block 3: der Bündler führt die Warteliste.
- `CLAUDE.md` («Limits»): gleicher Punkt.
- Nur Doku, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Warteliste führt der Bündler, und Threads melden sich per Nachricht bei ihm. Noah und der Koordinator nannten keinen Ort; die Wahl ist mein Vorschlag, weil der Bündler die Plätze ohnehin vergibt.
- Die Meldung hat die feste Form «fertig, freigegeben: Thema, PR-Nummer».
- Die Antwort «a» kenne ich nur über die Weiterleitung des Koordinators (mit Noahs Nachricht «a» angehängt); ich habe alle drei Punkte der Weiterleitung eingetragen.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 26.11.2026: Keine leeren Prüfplätze – siehe `docs/decisions/keine-leeren-plaetze.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` Block 4 öffnen: «Keine leeren Plätze» steht vor «Notbremse».
