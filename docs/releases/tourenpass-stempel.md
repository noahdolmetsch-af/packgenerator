# Tourenpass mit Stempel

PR (noch offen) · 03.11.2026 · Auftrag: Noah «E und F» (Paket E, Idee 18, Thread «Bauen: Touren als Sammlung»)

## Was ist neu
- Auf dem gespeicherten Rückblick einer Tour steht eine Box «Ein Stempel für deinen Tourenpass?»: ein runder grüner Stempel mit Ort (der Titel der Tour, änderbar), letztem Tag und km. «Abstempeln» drückt ihn in den Pass (kurz von oben, ohne Bewegung bei «Bewegung reduzieren» und «Bewegung aus»); «Kein Stempel» lässt die Tour aus.
- Neue Seite **Touren › Rückblick › Tourenpass** (`#/debrief/tourenpass`): alle Stempel als Sammlung (neueste zuerst, mit der Summe der km), darüber die Touren mit Rückblick ohne Stempel («Abstempeln», «Alle abstempeln», «Kein Stempel»). Eigene Stempel hinzufügen, ändern (Ort, Tag, km) und entfernen (mit Undo).
- Gespeichert in der Einstellung `tourenpass` (mit im Backup, kein neues Schema).

## Was fällt weg oder rutscht tiefer
- nichts. Unten im gespeicherten Rückblick kommt die Box dazu (vor «Zur nächsten Tour»), im Rückblick-Hub eine Zeile «Tourenpass».

## Selbst entschieden
- Nichts wird ohne Tippen abgestempelt: die Box schlägt nur vor (alles ist ein Vorschlag).
- Der Stempel zeigt den Titel der Tour als Ort, weil die App keinen Ort einer Tour kennt; wer will, schreibt einen anderen.
- Wer «Kein Stempel» wählt, sieht die Tour weiter auf der Seite Tourenpass und kann sie dort wieder anbieten lassen.
- Eigene Stempel (Touren aus der Zeit vor der App oder ohne Rückblick) gehen auch; sie haben keine Tour dahinter.
- Namen sind Texte des Nutzers und gehen nicht durch `t()`.
- Fertig-Regel: Seite (`features.js` über featreg `f.tourpass`), Absprung (Box im Rückblick und Zeile im Hub), Gut zu wissen (`wissen/zurueck.js`), leerer Zustand (`Empty`), «Als Nächstes» (Nächste Tour planen).
- `docs/app-stand.md` ist noch nicht auf main (PR #742): die Zeile folgt im Sammel-Doku-PR.

## Entscheide (für decisions.md)
- nichts

## Stand im Plan
- Ideen Bewegung: Idee 18 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Den Rückblick einer Tour speichern: unten steht «Ein Stempel für deinen Tourenpass?». «Abstempeln» drückt den Stempel.
2. Touren › Rückblick › Tourenpass: der Stempel ist da; «Ändern» und Entfernen (mit Undo) gehen, «Stempel hinzufügen» legt einen eigenen an.
