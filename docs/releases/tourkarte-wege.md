# Wege auf jeder Tourkarte

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Fund T2 (Thread «Absprünge: Tourkarte und Wetter zur Tour»)

## Was ist neu
- Jede geplante Tour in Touren › Übersicht hat unter der Karte kleine Wege nach ihrer Phase: **Packen**, **Wetter** (das Wetter genau dieser Tour, `#/wetter?trip=…`) und **Form** (`#/flow/form`). Ist der letzte Tag der Tour vorbei und sie steht noch in «Geplant», heissen sie **Rückblick** (der Rückblick dieser Tour) und **Form**.
- Die Zahl unter dem Titel, «4 warten auf deinen Rückblick», ist ein Weg: ein Tipp zeigt die Touren, die auf ihren Rückblick warten (der Filter «Abgeschlossen» der Liste, auf dem Handy klappt «Mit Packliste» dabei auf).
- Reine Logik in `src/lib/touren/wege.js` (getestet in `tests/touren-wege.test.js`), deutsche Texte in `src/lib/i18n/de/tourkarte-wege.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeile «wird gepackt · Packen öffnen» der Tour im Packmodus bleibt; für diese eine Tour fehlt dann der Weg «Packen», damit nicht zwei gleiche Wege nebeneinander stehen.

## Selbst entschieden
- Der Weg «Wetter» zeigt kein Wetterwort («trocken») auf der Karte: der Wetterdienst braucht eine Verbindung, die Karte soll sofort und offline stehen. Das Wetter der Tour steht auf der Wetterseite (und dort ab dem nächsten PR oben in «Für deine Tour»).
- «Form» ohne Urteil («gut»): Form wird nur beobachtet, die Karte sagt nichts zu deiner Gesundheit.
- «Abgeschlossene Tour → Fahrt in Analyse» aus dem Vorschlag kommt nicht hierher: dafür braucht es die Bausteine aus «Zahl mit Weg» (#1109) und ein Tag-Blatt je Tour; das folgt, wenn die Bausteine online sind.
- Keine neue Funktion in `features.js`: die Wege gehören zur Tourenübersicht (Fertig-Regel Punkt 1 bis 5 gelten für neue Funktionen). `docs/app-stand.md`: die Zeile «Tourenübersicht» nennt die Wege.

## Entscheide (für decisions.md)
- 07.11.2026: Die Tourkarte bietet Wege nach Phase (Packen, Wetter, Form; danach Rückblick), nicht einen einzigen (Noah «alle Vorschläge»).

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: T2 gebaut; T3 (Wetter zur Tour) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: unter einer geplanten Tour stehen Packen, Wetter, Form. «Wetter» öffnet das Wetter dieser Tour.
2. Unter dem Titel «… warten auf deinen Rückblick» antippen: die Liste zeigt nur diese Touren.
3. Den Filter «Abgeschlossen» über der Liste wegnehmen: alle Touren sind wieder da.
