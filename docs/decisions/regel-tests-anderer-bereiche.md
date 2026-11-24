# Tests anderer Bereiche vor dem PR

24.11.2026 · Auftrag: Noah «a» (Thread «Regeln und Anweisungen auf neuen Stand bringen», Frage des Koordinators 12:38 UTC)

- **R31:** Wer eine Seite umbaut, sucht vor dem PR alle Tests, die diese Seite antippen, auch die anderer Bereiche, und lässt sie lokal laufen (verworfen: «wie bisher, rote Tests danach reparieren»).
- Grund: Am 24.11.2026 machten die PRs zu Plus-Menü (1655) und «Ich» (1681) main rot, weil Tests anderer Bereiche den alten Stand erwarteten. Lokal lief nur der eigene Test.
