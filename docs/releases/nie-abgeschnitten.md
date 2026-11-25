# Nie abgeschnitten, Laptop-Höhe, Fenster, Zeiten und Texte prüfen

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «a und b» und «ja» (24.11.2026 23:38 und 23:40; Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 1: Regel **«Nie abgeschnitten»** (fester Kopf und Fuss, Hauptknopf im Fuss, nur die Mitte scrollt, Schatten als Hinweis, Wächter-Test bei 390, 1440×800, 1440×900).
- `docs/regeln.md` Block 5 und 6: Bilder zusätzlich in der **Laptop-Höhe 1440×800**; Fenster und Popups werden geöffnet und bis unten gescrollt gezeigt.
- `docs/regeln.md` Block 7: Gesamttest öffnet **jedes Fenster und Popup**; **Zeitabhängiges** wird für Morgen, Mittag, Abend, Nacht geprüft; **Text-Durchsicht** nach `docs/namen.md` mit Schreib-Checkliste.
- `CLAUDE.md`: Code-Regel «Never cut off» und die Grössen bei den Bildern.
- Nur Doku, nichts sichtbar in der App. Der Wächter-Test selbst und die Reparatur einzelner Fenster sind **noch nicht gebaut**; das übernehmen andere Threads (siehe unten).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «a und b» gelesen als: **a** = fester Fuss mit Hauptknopf + Schatten als Hinweis + Test, **b** = nur der Test; Noah wählte beide, also gilt a samt Test.
- Die Regel steht in Block 1 (so fühlt sich die App an), die Prüfungen in Block 7, die Bilder-Grössen in Block 5 und 6. Keine neuen Blöcke, die Form-Prüfung `tests/regeln-doku.test.js` bleibt gültig.
- Nichts Älteres wurde ersetzt, darum kein Eintrag in `docs/regeln-archiv.md`.
- Ideen 5 und 6 des Koordinators (Nachfragen nur bei deutlichem Unterschied, Knopf «Verbessern») sind keine Regeln und stehen nur in der Entscheidungsdatei.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Nie abgeschnitten und vier Prüf-Regeln – siehe `docs/decisions/nie-abgeschnitten.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: Block 1 nennt «Nie abgeschnitten», Block 7 nennt Grössen, Fenster, Zeitabhängiges und Text-Durchsicht.
