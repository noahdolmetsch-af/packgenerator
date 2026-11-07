# Getippte Notizen überstehen das Neuladen

Auftrag: Noah 06.11.2026 «4a» (Frage 4 im Etappenbericht 6, Befund aus dem Lauf «Neuladen mitten in einer Eingabe»).

## Was ist neu
- Die Schreibfelder «Neue Notiz» (Notizen) und «Neue Planungsnotiz» (Packen) behalten den getippten Text, wenn die Seite neu lädt. Sie nutzen dafür dieselbe Merkhilfe wie die Fenster (`keepTyped`, nur im Tab-Speicher `sessionStorage`, nie in der Datenbank, im Backup oder im Export). Beim Wiederöffnen steht oben die ruhige Zeile «Dein Getipptes von vorhin ist wieder da.» mit «Verwerfen».
- Speichern (Knopf oder Enter) löscht den gemerkten Text sofort. Dafür vergisst `keepTyped` bei Formularen, die auf der Seite bleiben, den Text beim Absenden (bisher nur beim Schliessen oder Entfernen).
- Nicht betroffen: Suchfelder (so entschieden).
- Test `tests/e2e/schreibfelder-neuladen.spec.js` (erfundene Daten): rot ohne Fix, grün mit Fix.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Text bleibt nur im geöffneten Tab (`sessionStorage`), nicht im Backup: keine Änderung an Datenspeicher, Backup-Format oder Dexie.
- Eine Planungsnotiz wird pro Tour gemerkt (`plannote:<Tour>`).
- Die Zeile «Dein Getipptes von vorhin ist wieder da.» hatte bisher keinen Stil (Fenster und Seite zeigten sie als nackten Text mit grauem Standardknopf). Sie bekommt einen ruhigen grauen Streifen und «Verwerfen» als unterstrichenes Wort (`.kept-bar` in `src/app.css`, Knopf `btn btn-link sm`); das gilt auch in den Fenstern.
- Keine neuen Texte (die Zeile «Dein Text von vorhin …» gibt es schon); keine Änderung in `docs/app-stand.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 6: Antwort 4a umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Notizen öffnen, in «Neue Notiz» ein paar Wörter tippen, Seite neu laden: Die Wörter sind wieder da.
2. Notiz speichern, neu laden: Das Feld ist leer.
3. Packen › Plan: dasselbe mit «Neue Planungsnotiz».
