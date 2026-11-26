# PR-Auswahl: gemeinsame Teile lösen Wächter und abhängige Tests aus

26.11.2026 · Auftrag: Noah «1-8» (26.11.2026 07:43), Schritt 5 des Test-Plans «Tests auf den neuen App-Stand bringen»

- **Entscheid:** Ein PR, der die Seitenleiste, die Reiter, den Seitenkopf, das Fenster-System oder die globalen Stile ändert, führt zusätzlich zum Kern die Wächter für alle Seiten und Fenster und die davon abhängigen Bereichstests aus, nicht nur den Kern. Die abhängigen Tests findet das Skript aus den Test-Dateien (Muster im Text oder schmale Hilfsdatei), nicht aus einer Handliste.
- **Grund:** Die roten Tests der Nacht auf den 26.11. kamen von Umbauten an gemeinsamen Teilen (PR 1759 Seitenleiste, PR 1762 Fenster-Fuss). Im PR lief nur der Kern, die Tests anderer Bereiche wurden erst nachts rot.
- **Kosten:** im PR bei solchen Änderungen 3 bis 5 Teile statt 1, etwa 5 bis 10 Minuten länger. Alle anderen PRs bleiben gleich.
- **Abgelehnt:** alles laufen lassen (zu langsam, die Regel von 05.11.2026 «Kern allein» hatte ihren Grund); eine Handliste von Tests je Teil (veraltet sofort).
- **Offen:** Schritt 2 (Alltagswege als Kern-Dateien, `CORE_SPECS`) kommt, sobald diese Tests fertig sind.
