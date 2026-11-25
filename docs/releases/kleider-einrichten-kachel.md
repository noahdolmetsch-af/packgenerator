# Kleiderschrank einrichten: Kachel in «Alles hier»

PR #1783 · 22.11.2026 · Reparatur zu #1435 («Kleiderschrank einrichten»), Regel «jede Funktion höchstens 3 Tipps von Heute»

## Was ist neu
- Unter Material hat «Alles hier» die Kachel «Kleiderschrank einrichten» (neben «Kleiderschrank»). Damit ist die Seite von Heute aus in 3 Tipps erreichbar.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Grund: Seit #1435 war der Test «jede Funktion höchstens 3 Tipps von Heute» (`tests/e2e/tippzahl.spec.js`) rot, weil der Hinweis im Kleiderschrank nur mit Daten sichtbar ist und der Test ohne Daten läuft. Die Kachel ist immer da, `TAP_GAPS` bleibt unverändert (die Liste darf nicht länger werden).
- Der Hinweis oben im Kleiderschrank wandert in einem eigenen PR nach unten (Regel «Inhalt zuerst»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Velos und Material» öffnen und «Alles hier» (Zeile am Seitenende) aufklappen.
2. Kachel «Kleiderschrank einrichten» tippen: die Seite öffnet sich.
