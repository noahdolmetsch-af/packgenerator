# «Tipps für diese Seite» ins «?»-Fenster

PR #1816 · 26.11.2026 · Auftrag: Noah «Ja» (26.11.2026 18:07) auf die offene Frage 2 aus «Touren-Seite klarer» (Thread «Touren-Seite klarer machen»); zweites Folge-Paket nach «Gehört zu ins ?-Fenster»

## Was ist neu
- Der leise Link «Tipps für diese Seite ›» am Seitenende (`src/lib/pageinfo/PageMore.svelte`) steht jetzt im «?»-Fenster, in der Reihe unten bei «Handbuch · Suche · Etwas fehlt?» (`src/lib/nav/HelpButton.svelte`, `data-help-tips`). Ein Tipp schliesst das Fenster und öffnet das Fenster «Alle Tipps» der Seite (`TipsSheet.svelte`) wie bisher.
- Der Hilfetext der Einstellung «Tipp-Zeile unter dem Titel» (Ich › Einstellungen) sagt jetzt «im «?»-Fenster» statt «am Seitenende».
- Tests angepasst: `pageinfo.spec` und `tipp-zeile-aus.spec` öffnen die Tipps über das «?».

## Was fällt weg oder rutscht tiefer
- Weg vom Seitenende: der Link «Tipps für diese Seite ›» (ausser auf Seiten ohne eigene Tipps, dort stand er nie).
- Tiefer: der Weg zu den Tipps führt über das «?».

## Selbst entschieden
- Die Tipp-Zeile unter dem Titel («Gut zu wissen» mit «Alle Tipps ›», Einstellung, standardmässig aus) bleibt, wie sie ist: wer sie einschaltet, will sie dort; ihr «Alle Tipps ›» öffnet dasselbe Fenster.
- Die Beispiele («Beispiel zum Übernehmen») am Seitenende bleiben, sie sind Inhalt der Seite.
- Fertig-Regel: keine neue Funktion, nur ein anderer Platz für einen vorhandenen Link.

## Entscheide (eigene Datei `docs/decisions/tipps-ins-hilfefenster.md`)
- 26.11.2026: Noah «Ja».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1) und «Content first». Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen und ans Seitenende scrollen: kein Link «Tipps für diese Seite ›» mehr.
2. Das «?» tippen: unten steht «Tipps für diese Seite ›»; ein Tipp öffnet alle Tipps.
