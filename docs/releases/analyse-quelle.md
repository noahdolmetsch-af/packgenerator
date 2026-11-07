# Woher ein Wert kommt (Quelle zum Antippen)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 2 (A2), Frage «2b» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Die Seite eines Werts in der Analyse (`#/auswerten/analyse/<Wert>`) hat unter dem Titel die Zeile «Quelle: Fitbit ›». Ein Tipp führt zur Seite der Quelle: Fitbit, Strava (Ich › Verbindungen), «Wi gaht's?» oder Aktiv.
- Darunter, wenn in diesem Zeitraum eine vergangene Tour lag: «Touren in dieser Zeit: Probefahrt Jura ›» (höchstens 3, jede führt zur Tourseite).
- Die Quelle steht jetzt einmal, in einer Zeile: «Quelle Fitbit · Stand 07:42 ›» (Noah «3a»). Der zweite Quellensatz und die zweite «Stand»-Zeile im Block «Was auffällt» fallen weg; schlug der letzte Abruf fehl, bleibt «Jetzt nochmals versuchen» direkt darunter.
- Bausteine aus dem PR «Zahl mit Weg» (`SourceLine`, `zahlweg.js`), kein neuer Baustein.

## Was fällt weg oder rutscht tiefer
- Der doppelte Quellensatz im Block «Was auffällt» («Fitbit · von deiner Uhr über Google.») und die zweite «Stand»-Zeile dort: beides steht jetzt in der Quelle-Zeile unter dem Titel. Der Satz im Seitenkopf bleibt.

## Selbst entschieden
- Eigene Einträge und eigene Berechnungen («body») haben keine Quellseite: dort fehlt die Zeile, der Satz im Kopf bleibt.
- Kein neuer Eintrag in `features.js`: es ist ein Weg auf einer bestehenden Seite, kein neues Werkzeug.
- Nicht in diesem PR: «Zurück zu Heute» (die Brotkrume merkt sich, woher man kam). Noah «4a»: kommt als eigener PR, weil es die ganze App betrifft.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 2 (A2) gebaut; A1 (Zahlen in Aktiv, Auswerten, Analyse) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › Alle Werte › Ruhepuls öffnen: unter dem Titel steht «Quelle: Fitbit ›».
2. Darauf tippen: die Fitbit-Seite öffnet sich.
3. Liegt in der Zeit eine vergangene Tour, steht «Touren in dieser Zeit» darunter; ein Tipp öffnet die Tour.
4. Bei Gewicht (eigener Eintrag) fehlt die Zeile.
