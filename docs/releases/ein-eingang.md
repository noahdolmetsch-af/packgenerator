# Ein Eingang: Suche, Hilfe und Assistent

Auftrag: Noah «1-5a» und «1-3a» (24.11.2026) im Thread «Suche, Hilfe und Assistent zu einem vereinen», Stufe 2 (Entwurf B). Ziel: Klarheit und Auffindbarkeit; man muss nicht wissen, ob man suchen, fragen oder Hilfe will.

## Was ist neu
- **Kopf:** Am Handy gibt es keine Sprechblase mehr; die Lupe trägt einen kleinen Funken und öffnet das eine Fenster. Am Computer fehlt die Blase oben rechts. Das «?» bleibt an beiden Orten.
- **Leeres Fenster:** Die erste Zeile heisst «Hilfe zu dieser Seite» und öffnet dasselbe Fenster wie das «?» (Ereignis `pg:help`). Darunter bleiben Themen, «Das suchen viele», «Zuletzt geöffnet».
- **Unter einer Frage:** Zuerst die Antwort der App, dann die Zeile «Assistent öffnen» (öffnet `#/assistent?q=…` mit der Frage), «Weiter fragen bei …» ist eine zugeklappte Zeile, «Passt zu deiner Frage» fehlt, wenn die App schon geantwortet hat.

## Was fällt weg oder rutscht tiefer
- Die Sprechblase im Kopf (Handy) und oben rechts (Computer) fällt weg; der Assistent ist über «Assistent öffnen» unter einer Frage, die Suche («Assistent»), die Karte der App, den Funktionskatalog und seine Adresse `#/assistent` erreichbar.
- «Weiter fragen bei …» (Claude, ChatGPT …) liegt einen Tipp tiefer in einer zugeklappten Zeile.
- «Passt zu deiner Frage» steht nicht mehr, wenn die App schon geantwortet hat.

## Selbst entschieden
- Wort «Assistent öffnen» statt «Gespräch öffnen» (Namen, `docs/namen.md` Zeile 52).
- Hilfe-Zeile nur, wenn die Leiste ein «?» hat (Gast, Mini-Apps haben keines).
- Test `assistent.spec.js`: erreicht den Assistenten jetzt über die Frage in der Suche statt über die Blase (Oberfläche mit Absicht geändert, Noah «1-3a»).
- Keine Datenänderung, kein Backup, kein `api/`.

## Entscheide (eigene Datei)
- `docs/decisions/ein-eingang.md`
