# Aktivität anlegen? Strava-Sportarten ohne Sportart

21.11.2026 · Auftrag: Noah «4a» und «ich möchte alle entwürfe 1-3 umsetzen» (Thread «Jede Sportart durchgehen», Umsetzungsauftrag S7); gestapelt auf Gemeinsame Einheiten (S2)

## Was ist neu
- In **Meine Sportarten** (`#/flow/sports`) erscheint eine Karte «N Aktivitäten aus Strava ohne Sportart», wenn Strava Sportarten kennt (Wandern, Schwimmen, Skitour …), für die es in Aktiv keine Aktivität gibt. Je Strava-Sportart eine Zeile mit der Anzahl.
- **«Sportart anlegen»** legt die Aktivität an (Ring Bewegen, passendes Symbol, **kein Ziel**, keine Mindestdauer) und zählt die alten Strava-Aktivitäten dieser Sportart rückwirkend mit (`setSport` in `stravaticks.js`). Mit **Rückgängig** (Aktivität und die dadurch angelegten Haken weg, Zuordnung zurück).
- **«Nicht fragen»** sagt für diese Strava-Sportart für immer nein (Zuordnung «keine»); auch mit Rückgängig. Die Zuordnung steht weiter unter Verbindungen › Strava.
- Die Rechnung steht in `src/lib/flow/stravaneu.js`, die Karte in `src/lib/flow/StravaNeu.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die neue Sportart hat **kein Ziel**: nichts wird verlangt (Regel «alles ist ein Vorschlag»). Ziel, Name, Symbol und Saison lassen sich im Editor der Sportart ändern.
- Der Name kommt aus der Strava-Sportart in der gerade gewählten Sprache (zum Beispiel «Wandern»); er ist danach ein eigener Name und änderbar.
- Wo eine Aktivität mit der üblichen Kennung schon existiert (auch pausiert), wird die Sportart nicht noch einmal angeboten; ist die Kennung belegt, bekommt die neue `-2`.
- Die Karte steht in «Meine Sportarten», nicht im Sportjahr, weil dort die Sportarten angelegt werden. Ein Link vom Sportjahr dorthin kommt, sobald das Sportjahr (S3) online ist.
- Fertig-Regel: (1) `f.stravaneu` in `features.js` mit So geht's und Beispiel, (2) Absprung: die Karte steht dort, wo die Sportarten stehen; (3) «Gut zu wissen»: Text `f.stravaneu` in `src/lib/wissen/koerper.js` (kein Ziel mit Absicht), (4) leer: die Karte erscheint nur, wenn es etwas zu fragen gibt, (5) nächster Schritt: nach dem Anlegen zeigt die Liste die neue Sportart, (6) Zeile im App-Stand.
- Datenänderung: schreibt in `flowActs`, `flowLog` und die Einstellung `strava.ticks`, aber nur auf Tipp, wie bisher die Zuordnungstabelle; kein neues Format. Mit Rückgängig.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr: S7 gebaut (hängt an S2).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten: ist eine Strava-Sportart ohne Aktivität da, steht die Karte «Aktivitäten aus Strava ohne Sportart».
2. «Sportart anlegen» bei einer Sportart: sie steht danach in der Liste, die Karte wird kleiner.
3. «Rückgängig» tippen: die Sportart ist weg, die Karte fragt wieder.
