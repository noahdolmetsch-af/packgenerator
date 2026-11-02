# Gut zu wissen, direkt auf der Seite (Wegweiser 12: Inhalte Lust)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte, Claude schreibt das Wissen, kurz mit etwas Humor) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» zeigt unter jeder Funktion eine Zeile «Gut zu wissen»: ein Tipp aus der Erfahrung, keine Wiederholung des Namens.
- Zuerst für die 12 Funktionen des Bereichs Lust (Träume, Kompass, Freie Zeit, Inspiration).
- Baustein für die nächsten Bereiche: `src/lib/wissen/` (eine Datei pro Bereich, `index.js` führt sie zusammen), Deutsch in `src/lib/i18n/de/wissen-<bereich>.js`.
- Test `tests/wissen.test.js`: jede Funktion auf einer Seite mit Karte hat ihr Wissen, jeder Text hat Deutsch und ist höchstens 220 Zeichen lang.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte wird pro Funktion eine Zeile länger; der Seiteninhalt rutscht entsprechend tiefer, bis man die Karte mit × zuklappt.

## Selbst entschieden
- Fehler aus PR 11 behoben: «Diese Seite anpassen» zählte die Karte «Was du hier tun kannst» als Teil der Seite (auf Träume, Kompass usw.). Die Karte hat ihr eigenes ×, darum lässt Anpassen sie jetzt weg (`src/lib/anpassen/parts.js`).
- «Gut zu wissen» steht sichtbar unter dem Satz «wozu», nicht erst hinter «So geht's»: das Wissen ist der Teil, den man sonst nirgends findet.
- Gleicher Name und gleiches Glühbirnen-Zeichen wie «Gut zu wissen» im Werkzeugkasten.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 12 von 26. Die Bereiche 13–20 fügen je ihre Seiten und ihr Wissen dazu.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: in «Was du hier tun kannst» hat jede Funktion eine Zeile «Gut zu wissen».
2. Ich › Freie Zeit › Worauf hab ich Lust? öffnen: auch dort steht «Gut zu wissen».
