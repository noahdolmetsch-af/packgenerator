# Velos: Die Velos zuerst

PR #<Nummer> · 06.11.2026 · Auftrag: Noah (Durchklick Etappe 4, Antwort «2a»), Thread «Durchklicken Etappe 4: Velos und Alltag»

## Was ist neu
- Velos und Material (Übersicht): Die Velokarten und das gewählte Velo stehen jetzt oben, «Alles hier» (die Funktionsliste) darunter. Vorher musste man auf dem Handy erst an der Funktionsliste vorbeiscrollen, bevor man ein Velo sah.

## Was fällt weg oder rutscht tiefer
- «Alles hier» auf Velos und Material rutscht unter die Velos und das gewählte Velo (vorher gleich unter dem Einstieg). Der Weg zu den Funktionen bleibt «Alles hier»; auch die Reiter «Pflege», «Werkstatt», «Teile» oben führen weiter dorthin.

## Selbst entschieden
- Nur «Alles hier» wird verschoben. Der kleine Einstieg oben bleibt (Noah «4a»), damit der erste Besuch erklärt wird.
- Das ändert die frühere Wahl «Alles hier oben» (Noah 03.11.2026 «1a») nur für Velos und Material; die anderen Seiten bleiben wie sie sind.
- Regressionstest `tests/e2e/velos-zuerst.spec.js`: vorher rot, nachher grün.

## Entscheide (für decisions.md)
- Velos und Material: Die Velos zuerst, «Alles hier» darunter (Noah 06.11.2026 «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 4 (Velos und Alltag): Klasse-D-Idee 2 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos und Material auf dem Handy öffnen: Die Velokarten stehen gleich oben.
2. Etwas nach unten scrollen: «Alles hier» steht unter dem gewählten Velo, alle Kacheln öffnen ihre Seite.
