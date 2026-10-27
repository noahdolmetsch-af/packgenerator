# Diagramme zum Antippen

PR #<nummer> · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Diagramme klickbar machen»)

## Was ist neu
- Gemeinsame Bausteine für alle Diagramme: `src/lib/charts/BarChart.svelte` (Achse mit runden Schritten ab 0, Zeigen → genaue Zahlen in der Zeile darüber, Tippen/Enter → Fenster), `ChartSheet.svelte` (Fenster mit Blättern), `DataTable.svelte` («Als Tabelle»), `Readout.svelte`, `pick.js`.
- «Haken ausgewertet»: Haken pro Woche, Wochentage/Tageszeit und Verlauf nutzen die Bausteine. Hinter jedem Balken: Tage mit Aktivitäten oder die Aktivitäten mit Anzahl.
- `src/lib/charts/rules.js` hält die Regeln «Genaue Werte» fest und listet, welche Diagramme schon umgebaut sind (DONE) und welche noch offen (OPEN); der Test `tests/charts-rules.test.js` wacht darüber.

## Was fällt weg oder rutscht tiefer
- nichts. Die alten Balken ohne Achse werden durch die neuen ersetzt; Legende und Satz darunter bleiben.

## Selbst entschieden
- Die Zahlen beim Zeigen stehen am Handy und am Computer in einer Zeile über dem Diagramm (keine schwebende Blase, der Finger deckt sie nicht zu).
- Das Fenster kommt am Handy von unten, am Computer als Fenster in der Mitte.
- «In Analyse öffnen» kommt dazu, sobald die Analyse online ist.
- Das ovale «…» im Screenshot liess sich im Test nicht nachstellen; nicht geändert.

## Entscheide (für decisions.md)
- 27.10.2026: Diagramme klickbar, Antworten «1-5 a»: Zeigen zeigt Werte, Tippen öffnet ein Fenster; Regeln «Genaue Werte» für alle Diagramme mit «Als Tabelle» und Wächter-Test; Zeitraum und eine zweite Linie am Diagramm, Filter in Analyse; Tour-Bereitschaft wie K4; Start mit «Haken ausgewertet».

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 1 von 8 (Haken ausgewertet). Danach 12 Wochen (nach #319), Was heute zählt, Tour-Bereitschaft, Training, Körperwerte, Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Haken ausgewertet öffnen, auf einen Balken bei «Haken pro Woche» zeigen: die Zeile darüber zeigt die genauen Zahlen.
2. Auf den Balken tippen: das Fenster zeigt sieben Tage; «Nächste Woche» blättert, ✕ schliesst.
3. «Als Tabelle» tippen: die Wochen als Zeilen, die neuste zuoberst.
