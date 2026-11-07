# Zahlen, die weiterführen (Auswerten)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung, Rang 3 (A1), Frage «2b» (Thread «Absprünge: Analyse und Aktiv antippbar machen»)

## Was ist neu
- Auswerten › «Letzte 7 Tage» › «Deine Woche in Zahlen»: zeigt man die 12 Wochen eines Werts, steht darunter «Öffne «Ruhepuls» in der Analyse ›». Das gilt für Schlaf, Ruhepuls und aktive Minuten, die in der Analyse einen eigenen Wert haben; der Link öffnet ihn über 3 Monate.
- «Kalorien verbrannt» in «Letzte 7 Tage» ist ein Link auf den Kalorien-Wert in der Analyse (Woche, bei eigenem Zeitraum: Monat).
- Bausteine aus «Zahl mit Weg» (`numHref`), kein neuer Baustein.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kacheln von «Überblick» und die Zeilen der Sportarten führen weiter auf die bisherigen Seiten (`#/flow/stats/…`).

## Selbst entschieden
- Zeit, Strecke und Höhenmeter der Wochenzahlen haben in der Analyse keinen eigenen Wert (Strecke und Höhe sind dort nach Sportart oder von Fitbit): sie bekommen keinen Link, statt eines falschen.
- Die Kacheln von «Überblick» auf ihre Analyse-Seite umzustellen, würde die bisherige Ansicht vom Einstieg wegnehmen: das lasse ich für Noahs Entscheid liegen.
- Aktiv (Ringe, Wochenziele) und die Kacheln der Analyse-Übersicht folgen als eigene PRs (A1 ist gross, ein PR pro Seite): die Übersicht erst nach Abstimmung mit dem Thread «Analyse-Überblick und Filter-Karte».
- Keine neue Funktion in `features.js`: Wege auf bestehenden Seiten.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: Rang 3 (A1) zum Teil gebaut: Auswerten. Aktiv und Analyse-Übersicht stehen aus.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten öffnen, «Letzte 7 Tage» › «Deine Woche in Zahlen» › «Ruhepuls» antippen: unter den 12 Wochen steht «Öffne «Ruhepuls» in der Analyse ›».
2. Darauf tippen: die Seite des Ruhepulses öffnet sich, Zeitraum 3 Monate.
3. «Zeit in Bewegung» antippen: kein Analyse-Link (dort gibt es keinen eigenen Wert).
4. In «Letzte 7 Tage» auf «Kalorien verbrannt» tippen (mit Fitbit): die Kalorien-Seite der Analyse öffnet sich.
