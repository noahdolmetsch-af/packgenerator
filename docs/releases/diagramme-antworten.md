# Antworten ausgewertet: Verlauf und Wochentage zum Antippen

PR · 23.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme überall verbessern»)

## Was ist neu
- Auswerten › Fahrten › Antworten ausgewertet: «Verlauf» und «Wochentage» sind Diagramme aus dem gemeinsamen Baukasten (wie «Haken ausgewertet»): Achse mit runden Stufen (bei Skalenfragen 0 bis 10), Zahlen beim Zeigen, ein Tipp öffnet das Fenster des Tages (Antwort, Mittel 7 Tage, Zahl der Antworten) oder des Wochentags, «Als Tabelle».
- Über dem Verlauf steht ein Satz («Jetzt 6,2, 0,4 mehr als am 9. Okt.», nur Beobachtung).
- Ein Wochentag ohne Antwort sagt «Keine Daten», nicht 0.

## Was fällt weg oder rutscht tiefer
- nichts. Die Legende unter dem Verlauf und die Zeile unter den Wochentagen bleiben; die Wochentags-Balken haben jetzt eine Achse und keine abgestufte Deckkraft mehr nur als Zahl.

## Selbst entschieden
- Der Verlauf hat eine Spalte pro Tag; Punkte der Antworten, Linie das Mittel über 7 Tage (Lücken bleiben Lücken).
- Beide Diagramme stehen jetzt in `DONE` von `src/lib/charts/rules.js`, damit der Wächter-Test sie überwacht.

## Entscheide (eigene Datei)
- Keine neuen Entscheide; gehört zu `docs/decisions/diagramme-gewicht-satz.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: 12 offen (aus 14).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Fahrten › Antworten ausgewertet, eine Frage mit Zahl wählen: über «Verlauf» steht ein Satz.
2. Auf den Verlauf zeigen, dann tippen: Zahlen des Tages, dann das Fenster.
3. Bei «Wochentage» auf einen Balken tippen oder «Als Tabelle» wählen.
