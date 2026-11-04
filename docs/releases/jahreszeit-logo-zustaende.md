# Jahreszeit-Test wartet auf jede Logo-Überraschung

PR (Test-Fix) · 04.11.2026 · Auftrag: Koordinator, Thread «Fix flackernden Jahreszeit-Test»

## Was ist neu
- `tests/e2e/jahreszeit.spec.js` wartete nach den fünf Tipps auf «PG» nur auf das Velo (`data-logo-ride`) oder einen Spruch (`data-logo-saying`). Seit «Platten im Logo» gibt es auch `data-logo-flat`, mit «Murmeltier pfeift» (#845) kommt `data-logo-marmot` dazu. Kam zufällig eine dieser Überraschungen, wurde der Test rot (e2e Handy, Teil 2).
- Der Test wartet jetzt auf alle vier Zustände. Die App ändert sich nicht.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine «Was ist neu»-Datei: nichts, das Noah sieht.
- Der Zufall wird nicht festgelegt (das macht `logo-helpers.js` in #845 für die Murmeltier-Tests): dieser Test prüft das Umschalten des Logos, nicht welche Überraschung kommt. Eine weitere Überraschung braucht hier nur einen Eintrag mehr in der Liste.
- Keine Zeile in `docs/app-stand.md`: keine neue Seite, keine neue Funktion.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Der Test `jahreszeit.spec` läuft auf GitHub grün, auch bei mehreren Wiederholungen.
