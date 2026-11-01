# Filter für das eigene Diagramm (Analyse D4)

PR #<offen> · 27.10.2026 · Auftrag: Noah «3a und b möglich» (ein Filter für alles, zusätzlich pro Wert)

## Was ist neu
- Knopf **«Filter»** im «Eigenen Diagramm» (mit Anzahl der gesetzten Teile): Wochentage, Tage mit oder ohne eine Aktivität, Touren (alle / nur Tour-Tage / ohne Tour-Tage), «Wi gaht's?» (Energie oder Stimmung ≥ 7 bzw. ≤ 4), Ausreisser ausblenden.
- Jeder gesetzte Teil steht als Chip mit × unter dem Knopf; dazu «Touren als Band» ein/aus und «… Tage markiert» (Punkt unter jeder Zeile an den Tagen einer Aktivität).
- **Filter pro Wert** (3b): kleiner Trichter neben dem Namen einer Zeile; gilt zusätzlich zum Filter für alles und steht in der Zeile.
- Ausgeblendete Tage bleiben als Lücke; der Satz «62 von 90 Tagen passen zum Filter» zeigt, wie viele zählen.
- Alles bleibt auf diesem Gerät gespeichert.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Krank markiert» und «Wetter» aus Mockup D4 fehlen noch: die App speichert weder einen Krank-Tag noch das Wetter pro Tag. Statt «krank» gibt es «Energie ≤ 4».
- «Sport und Velo» (z. B. nur Gravel) kommt mit «Velo km + Verschleiss», weil die Strava-Werte dafür pro Velo aufgeteilt werden müssen.
- Ausreisser = mehr als das 1,5-Fache der mittleren Hälfte vom Rest entfernt (Tukey), erst ab 8 Werten.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Analyse-Tool: Detail je Wert, Eigenes Diagramm, Filter. Nächste PRs: Was hängt zusammen (D5), Aktiv-Überblick (M2), Vergleiche (M3), Muster und Rekorde (M4), eigene Rechnungen, gespeicherte Ansichten.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › «Filter».
2. Sa und So aus, «ohne Sauna», «… Tage zeigen»: Lücken an diesen Tagen.
3. Trichter neben «Velo» › «nur Tour-Tage»: nur diese Zeile ändert sich.
