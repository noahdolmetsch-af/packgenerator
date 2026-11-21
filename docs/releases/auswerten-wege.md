# Zahlen, die weiterführen (Auswerten)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 3 (A1), Frage «2b» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Auswerten › «Letzte 7 Tage» › «Deine Woche in Zahlen»: zeigt man die 12 Wochen eines Werts, steht darunter «Öffne «Ruhepuls» in der Analyse ›». Das gilt für alle sechs Werte; der Link öffnet ihn über 3 Monate.
- Neu in der Analyse (Noah «1a»), Gruppe «Sport und Velo»: «Zeit in Bewegung», «Distanz» und «Höhenmeter», jeweils alle Sportarten zusammen (die Zahlen der Wochenkarte als Verlauf).
- «Kalorien verbrannt» in «Letzte 7 Tage» ist ein Link auf den Kalorien-Wert in der Analyse (Woche, bei eigenem Zeitraum: Monat).
- Bausteine aus «Zahl mit Weg» (`numHref`), kein neuer Baustein.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kacheln von «Überblick» und die Zeilen der Sportarten führen weiter auf die bisherigen Seiten (`#/flow/stats/…`).

## Selbst entschieden
- Die drei neuen Werte heissen «Zeit in Bewegung», «Distanz» und «Höhenmeter» (wie auf der Wochenkarte); die Uhr-Werte von Fitbit (Strecke, Stockwerke, Höhe) bleiben daneben, mit eigenem Namen und eigener Quelle.
- Die Kacheln von «Überblick» bleiben auf der bisherigen Seite (Noah «2b»).
- Aktiv (Ringe, Wochenziele) folgt als eigener PR (Noah «5a»), «Zurück zu …» ebenso (Noah «4a»).
- Keine neue Funktion in `features.js`: Wege auf bestehenden Seiten.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 3 (A1): Auswerten gebaut (Noah «1a 2b»); Aktiv folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen, «Letzte 7 Tage» › «Deine Woche in Zahlen» › «Ruhepuls» antippen: unter den 12 Wochen steht «Öffne «Ruhepuls» in der Analyse ›».
2. Darauf tippen: die Seite des Ruhepulses öffnet sich, Zeitraum 3 Monate.
3. «Distanz» antippen: «Öffne «Distanz» in der Analyse ›» führt zur Seite «Distanz» (3 Monate). In der Analyse gibt es unter «Sport und Velo» neu «Zeit in Bewegung», «Distanz» und «Höhenmeter».
4. In «Letzte 7 Tage» auf «Kalorien verbrannt» tippen (mit Fitbit): die Kalorien-Seite der Analyse öffnet sich.
