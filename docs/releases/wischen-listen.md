# Wischen in Notizen

PR (B13) · 27.10.2026 · Auftrag: Noah «ich möchte b13 bis b24 alle umsetzen. 1a 2a 3a 4a 5a» (Thread «Planen Bausteine B13 bis B24»)

## Was ist neu
- Am Handy in Planen › Notizen: eine Notiz nach rechts wischen heftet sie an (oder löst sie), nach links legt sie in den Papierkorb. Beides mit «Rückgängig».
- Fällige Erinnerungen oben: nach rechts wischen = erledigt, die Notiz bleibt.
- Ein kurzer Wisch zeigt zuerst den Knopf, ein langer erledigt es sofort.
- Neuer gemeinsamer Baustein `src/lib/ui/SwipeRow.svelte`, damit Aufgaben, Packliste und Material dasselbe Wischen bekommen.

## Was fällt weg oder rutscht tiefer
- nichts. Anheften und Löschen gibt es weiter in der Notiz selbst; am Computer ändert sich nichts.

## Selbst entschieden
- Notizen haben kein «erledigt»: rechts heisst hier «Anheften», bei Erinnerungen «Erledigt» (Noah 4a: rechts = fertig, links = weg).
- Ein langer Wisch nach links legt die Notiz ohne Rückfrage in den Papierkorb, weil «Rückgängig» und 30 Tage Papierkorb sie schützen.
- Wenn schon 3 Notizen angeheftet sind, kommt nur der Hinweis «Löse zuerst eine».
- Immer nur eine Zeile ist offen; Auf- und Abwischen bleibt Blättern.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung, Bausteine B13 bis B24: B13 in Notizen gebaut; als Nächstes dasselbe Wischen in Aufgaben und Packliste, dann B20 Lange drücken.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Handy Planen › Notizen öffnen, eine Notiz nach rechts wischen: sie steht oben unter «Angeheftet».
2. Eine andere Notiz ein Stück nach links wischen, «Löschen» tippen, dann unten «Rückgängig»: sie ist wieder da.
