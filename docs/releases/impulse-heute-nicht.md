# Impulse: Heute nicht

PR (offen) · 05.11.2026 · Auftrag: Noah «Touren 2a und b» (Thread «Bauen: Freie Zeit Teil 1»)

## Was ist neu
- Bei jedem Impuls gibt es den Knopf «Heute nicht». Die Idee ruht 30 Tage: Sie fehlt beim «Impuls für heute», bei «Andere Idee» und auf Heute.
- In der Liste steht bei einer ruhenden Idee «ruht bis …». Mit «Jetzt zurückholen» ist sie sofort wieder dabei. Rückgängig gibt es auch.
- «Eigene Impulse speichern» gab es schon (Knopf «Dein eigener Impuls»); dafür ist nichts nötig.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Heute nicht» ruht 30 Kalendertage. Für immer ausblenden geht weiter über das Auge («Ausblenden»).
- Eine ruhende Idee bleibt in der Liste und lässt sich weiter öffnen und ändern; nur die Vorschläge überspringen sie.
- Keine neue Funktion in `features.js` (Ergänzung einer bestehenden); darum keine neue Zeile in `FEATURE_MOMENTS`, `PASST_HIER` oder «Gut zu wissen».
- Speicherung: ein Feld `later` im bestehenden Freie-Zeit-Eintrag (`{ id: Tag }`); kein neues Dexie-Schema, im Backup schon enthalten.

## Entscheide (für decisions.md)
- 05.11.2026: «Heute nicht» bei Impulsen = 30 Tage Pause, nicht für immer (Grund: für immer gibt es schon «Ausblenden»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit Teil 1: Impulse erledigt; Sammlungen, Lust, Abend folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Impulse öffnen, bei der Idee des Tages «Heute nicht» tippen: eine andere Idee rückt nach.
2. In der Liste die ruhende Idee öffnen: «ruht bis …» steht da; «Jetzt zurückholen» tippen.
