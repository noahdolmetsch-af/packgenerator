# Meditation: Starten zuerst, Challenge darunter

PR #? · 24.11.2026 · Auftrag: Noah «1-5a» (Impeccable-Prüfung Woche, Punkt F4) und «ja» (Thread «Challenges nach Gelegenheit bauen»)

## Was ist neu
- Auf der Seite **Meditation** (`#/flow/act/meditation`) steht der grosse Startknopf zuoberst in der Karte Timer, die Uhr rutscht unter die Dauern.
- Direkt unter den Dauern: die Zeile **«Challenge: 30 Tage Meditation»** («Jeden Tag mind. 10 Min. Hake sie hier oder auf Heute ab.») mit dem Knopf «Starten». Der Knopf öffnet dasselbe Fenster wie «Übernehmen» unter Challenges › Ideen, mit der Idee schon eingetragen.
- Läuft die Challenge, steht dort ihre Karte mit «Tag n von 30» und «Abhaken»; der Stift ändert, beendet oder löscht sie wie überall.
- Neue Datei `src/lib/challenges/MedChallenge.svelte` (liest nur die Liste `tagesziele`, speichert nichts Eigenes), Test `tests/e2e/meditation-challenge.spec.js`.

## Was fällt weg oder rutscht tiefer
- Die Uhr (Ring) steht nicht mehr über dem Startknopf, sondern unter Dauern und Challenge. Der Startknopf selbst rutscht nicht tiefer, er steht jetzt weiter oben.
- Sonst nichts.

## Selbst entschieden
- Eine Challenge gilt als «Meditation», wenn sie «30 Tage Meditation» heisst (Name der Idee). Wer sie umbenennt, sieht wieder die Zeile mit «Starten»; nichts geht kaputt. Die feste Verbindung («Gehört zu: Meditation») kommt im Schritt 2 «Challenge zählt Meditation von selbst».
- Der Text verspricht noch kein automatisches Zählen (das baut erst Schritt 2); er sagt nur, wo man abhakt. Schritt 2 ändert den Text dann auf «Jede Sitzung zählt von selbst».
- Nur auf der zentralen Meditationsseite, nicht auf anderen Meditations-Aktivitäten.

## Entscheide
Noah «1-5a» und «ja», siehe `docs/decisions/meditation-challenge.md`.

## Stand im Plan
- Paket 9 (Meditation: Starten zuerst, Challenge darunter) gebaut; Schritt 2 folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Alltag › Meditation öffnen: der Startknopf steht zuoberst in der Karte Timer.
2. Unter den Dauern «Starten» bei der Challenge-Zeile tippen und speichern.
3. Die Zeile wird zur Karte mit «Tag 1 von 30» und «Abhaken».
