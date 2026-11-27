# Haken-Analysen: ein Schalter, Tagestotal, Wochenpensum

PR #<Nummer> · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Abhaken auf einen Blick verbessern», Haken-Analysen an einem Ort, Paket A von drei)

## Was ist neu
- Auswerten › Woche beginnt mit einem Schalter «Zeitraum für alles hier» (10 Tage, 30 Tage, 3 Monate, Jahr). Er gilt für den Haken-Verlauf und die neuen Karten.
- «Tagestotal»: Minuten Bewegung pro Tag, alle Aktivitäten zusammen, gegen deinen typischen Trainingstag, mit einem Satz zu heute, zum längsten Tag und zu freien Tagen.
- «Wochenpensum»: Stunden pro Woche, diese Woche bisher gegen die Vorwoche zur gleichen Zeit, die ganze Vorwoche gegen die Woche davor und gegen dein Mittel der letzten 12 Wochen.
- Gemessene und geschätzte Minuten («ca.») sind getrennt gezeichnet; ein Tipp auf einen Balken zeigt die genauen Werte, «Als Tabelle» die Zahlen.

## Was fällt weg oder rutscht tiefer
- Der Haken-Verlauf hat keinen eigenen Zeitraum-Schalter mehr, er folgt dem gemeinsamen Schalter darüber (deine bisherige Wahl bleibt).
- Der Bericht der Woche und «Was auffällt» rutschen tiefer.

## Selbst entschieden
- Fertig-Regel: kein neuer Eintrag in `features.js` (Teil der Seite Auswerten › Woche); Absprung bleibt, wie er ist; leere Zustände stehen in den Karten und führen zu Aktiv; «Gut zu wissen» entfällt (jede Karte erklärt sich in einer Zeile).
- Das Tagestotal zeigt höchstens 90 Tage, bei «Jahr» steht das in der Unterzeile; Wochen sind im Wochenpensum.
- Der Bericht darunter behält seinen eigenen Kalender-Zeitraum.
- Beide Karten nutzen das App-Diagramm (`BarChart`): Tippen, Pfeiltasten und «Als Tabelle» wie überall.

## Entscheide (eigene Datei `docs/decisions/haken-zahlen.md`)
- 27.11.2026: 1a, 2a, 3a, 5a und «Garmin gewinnt bei doppelten Aktivitäten».

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Paket A von drei; B Gesundheit, C Aufräumen folgen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Woche öffnen: oben steht «Zeitraum für alles hier», darunter Haken-Verlauf, Tagestotal, Wochenpensum.
2. «30 Tage» tippen: Haken-Verlauf, Tagestotal (30 Balken) und Wochenpensum (12 Wochen) folgen; «Jahr»: 90 Tage und 52 Wochen.
3. Auf einen Balken tippen oder zeigen: die genauen Minuten stehen darüber; «Als Tabelle» zeigt die Zahlen.
