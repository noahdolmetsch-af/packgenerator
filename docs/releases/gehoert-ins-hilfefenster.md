# «Gehört zu …» ins «?»-Fenster

PR #(folgt) · 26.11.2026 · Auftrag: Noah «Ja» (26.11.2026 18:07) auf die offene Frage 2 aus «Touren-Seite klarer» (Thread «Touren-Seite klarer machen»)

## Was ist neu
- Die Links «Gehört zu …» (die Funktionen desselben Moments, bis zu fünf plus «alle n ›») stehen nicht mehr als geschlossene Zeile hinter dem Seitentitel, sondern im «?»-Fenster der Seite, unter den Funktionen der Seite (`src/lib/know/GehoertDazu.svelte`, eingehängt in `src/lib/nav/HelpButton.svelte`). Betroffen sind die Seiten, die die Zeile hatten: Packen, Touren, Ich, Velos, Rückblick, Neuland und Wetter. Eine Tour-Seite, die Seite eines Rennens usw. hatten sie nie.
- In `src/App.svelte` entfällt der Einhängeplatz (auch die Handy-Zeile bei Velos neben «Was du hier tun kannst»).
- Tests angepasst: der Helfer `openCard('gd:…')` öffnet das «?»-Fenster; `karten-zeile-handy`, `durchklick-gehoert-zurueck`, `gehoert-dazu-ich`, `haengt-zusammen` prüfen die Links im Fenster und dass auf der Seite keine Zeile steht.

## Was fällt weg oder rutscht tiefer
- Weg von der Seite: die geschlossene Zeile «Gehört zu …» hinter dem Seitentitel (Content first: jede Seite beginnt mit ihrem Inhalt).
- Tiefer: die Links stehen im «?»-Fenster, einen Tipp entfernt.

## Selbst entschieden
- «Tipps für diese Seite» bleibt in diesem Paket unverändert: die Tipp-Zeile ist eine Einstellung («Tipp-Zeile unter dem Titel», Ich › Einstellungen) und steht an mehreren Stellen im Inhalt; sie ist ein eigenes, grösseres Paket und kommt danach.
- Der gemerkte Zustand «offen/zu» der alten Zeile (`gd:…` in den Einstellungen) bleibt als harmlose alte Eintragung liegen.
- Fertig-Regel: keine neue Funktion, nur ein anderer Platz für einen vorhandenen Baustein; Sprungstelle bleibt das «?».

## Entscheide (eigene Datei `docs/decisions/gehoert-ins-hilfefenster.md`)
- 26.11.2026: Noah «Ja».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1) und «Content first». Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: hinter dem Titel steht keine Zeile «Gehört zu …».
2. Das «?» tippen: unter den Funktionen steht «Gehört zu …» mit Links; ein Link führt zur Funktion und schliesst das Fenster.
