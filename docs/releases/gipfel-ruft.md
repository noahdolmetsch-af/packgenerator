# «Welcher Berg ruft?»: die Rechnung für Heute

PR #1781 · 24.11.2026 · Auftrag: Noah «alle 1-5 zusammen» (Thread «Gipfelbuch ausbauen»), Idee 5 von 5

## Was ist neu
- Nichts Sichtbares in diesem PR: die Rechnung liegt bereit (`src/lib/gipfelbuch-ruft.js`, reine Funktion `bergRuft` und der Satz `ruftSatz`). Die Zeile auf Heute hängt der Heute-Thread an (abgesprochen am 24.11.2026); er speist sie mit der Antwort des Tages (`dayAnswer`, Stufe `rest | easy | normal | hard`), dem Wetter von heute (`{ rainMm, wind }`, zum Beispiel aus `weekBest` für heute) und dem Wohnort.
- Die Regel: nur an einem starken («hard») oder normalen Tag, nur bei höchstens 1 mm Regen und höchstens 35 km/h Wind, nur mit Wohnort. Ein starker Tag schlägt den höchsten Ort im Umkreis von 90 km vor, ein normaler den nächsten; beide nur, wenn der Ort noch nicht im Gipfelbuch steht und im Monat schneefrei ist (November bis April nichts ab 1800 m, Mai nichts ab 2300 m). Müde Tage, Regen, Wind, fehlendes Wetter oder fehlender Wohnort: es kommt nichts.
- Der Satz heisst «Heute geht viel. Welcher Berg ruft? …» (starker Tag) oder «Form und Wetter passen. …» (normaler Tag) und führt mit `href` zur Gipfel-Karte (`#/flow/gipfelbuch/karte`).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Heute wird in diesem PR nicht angefasst (`Home.svelte` gehört dem Heute-Thread), damit sich zwei PRs nicht in derselben Datei treffen. Sobald seine Zeile online ist, ist die Idee für Noah sichtbar; bis dahin ist dieser PR ein reiner Unterbau mit Tests.
- Die Schneeregel ist eine grobe Monatsregel, keine Schneekarte: sie schlägt nichts vor, was im Winter oder Frühling sicher zu hoch ist; wer genau wissen will, schaut auf die Wetterseite.
- Kein Druck: der Satz ist eine Frage und lässt sich auf Heute mit «Heute nicht» weglegen (macht der Heute-Thread).

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Gipfelbuch ausbauen: alle fünf Ideen gebaut; Idee 5 wird mit der Heute-Zeile sichtbar.

## Prüfschritte
- Keine auf der echten Seite (nichts Sichtbares). Die Tests prüfen die Regel: `tests/gipfelruft.test.js`.
