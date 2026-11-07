# Heute: die 12 Monate zum Antippen

PR 10 · 07.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme klickbar machen»), PR 10, Heute-Kachel «Letzte 12 Monate»

## Was ist neu
- Die Reihe «Letzte 12 Monate» auf Heute (`YearRow`) nutzt jetzt `BarChart`: Achse in km mit runden Stufen, genaue Zahlen beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster mit dem Monat (mit Weg zum Rückblick), «Als Tabelle».

## Was fällt weg oder rutscht tiefer
- Die kleinen Balken stehen nicht mehr in der Mitte der Zeile, sondern als Diagramm unter den Zahlen (Touren, km, Basisgewicht) und dem Link «Rückblick ›». Sonst nichts.

## Selbst entschieden
- Nur diese Kachel, ein Schritt pro PR. «Balance» (Ring, Mini-Linie des Ruhepulses) und «Routine» (Fortschrittsring) sind keine Balkendiagramme, sie bleiben in `OPEN` in `src/lib/charts/rules.js`.
- Die Monatsnamen stehen unter jedem zweiten Balken (auf dem Handy sonst übereinander); Zeigen und Tabelle nennen jeden Monat.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 10 (Heute: 12 Monate). Danach Rückblick/Unterwegs/Rennen/Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute, Reihe «Letzte 12 Monate»: auf einen Balken zeigen, Monat und km stehen darüber.
2. Einen Monat antippen: ein Fenster zeigt die km, «Monat davor» und «Nächster Monat» blättern.
3. «Als Tabelle» antippen: die 12 Monate mit km.
