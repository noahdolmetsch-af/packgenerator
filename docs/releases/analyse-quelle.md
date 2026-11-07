# Woher ein Wert kommt (Quelle zum Antippen)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 2 (A2), Frage «2b» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Die Seite eines Werts in der Analyse (`#/auswerten/analyse/<Wert>`) hat unter dem Titel die Zeile «Quelle: Fitbit ›». Ein Tipp führt zur Seite der Quelle: Fitbit, Strava (Ich › Verbindungen), «Wi gaht's?» oder Aktiv.
- Darunter, wenn in diesem Zeitraum eine vergangene Tour lag: «Touren in dieser Zeit: Probefahrt Jura ›» (höchstens 3, jede führt zur Tourseite).
- Bausteine aus dem PR «Zahl mit Weg» (`SourceLine`, `zahlweg.js`), kein neuer Baustein.

## Was fällt weg oder rutscht tiefer
- nichts. Der Satz zur Quelle im Seitenkopf («Fitbit · von deiner Uhr über Google.») bleibt.

## Selbst entschieden
- Eigene Einträge und eigene Berechnungen («body») haben keine Quellseite: dort fehlt die Zeile, der Satz im Kopf bleibt.
- Kein neuer Eintrag in `features.js`: es ist ein Weg auf einer bestehenden Seite, kein neues Werkzeug.
- Nicht gebaut: «Zurück zu Heute» (die Brotkrume merkt sich, woher man kam) und «zuletzt heute 07:12» in der Quelle-Zeile. Das Erste braucht eine App-weite Herkunft (eigener Schritt), das Zweite steht schon als «Stand» weiter unten (FitbitStand).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 2 (A2) gebaut; A1 (Zahlen in Aktiv, Auswerten, Analyse) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › Alle Werte › Ruhepuls öffnen: unter dem Titel steht «Quelle: Fitbit ›».
2. Darauf tippen: die Fitbit-Seite öffnet sich.
3. Liegt in der Zeit eine vergangene Tour, steht «Touren in dieser Zeit» darunter; ein Tipp öffnet die Tour.
4. Bei Gewicht (eigener Eintrag) fehlt die Zeile.
