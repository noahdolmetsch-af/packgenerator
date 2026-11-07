# Technik-Handbuch: wie der Code funktioniert und wie man die App wartet

PR folgt · 05.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Dokumentieren Stand, Plan und Funktionsweise der App»)

## Was ist neu
- `docs/technik-handbuch.md`: Aufbau des Codes (Ordnerkarte), Daten (Dexie, Backup, Abgleich), Seiten und Navigation, Fertig-Regel, Wetter-, Routing- und Server-Bausteine, Tests und CI (alle Workflows), der Weg von der Idee bis «Online», Versionsnummer beim Merge, Grössen-Grenzen, Stolpersteine, Pflege-Tabelle.
- Zweiter von vier Teilen.

## Was fällt weg oder rutscht tiefer
- nichts. `docs/architecture.md` und `docs/daten.md` bleiben als Stand von Anfang Oktober; das Handbuch verweist darauf.

## Selbst entschieden
- Neue Texte brauchen keinen Eintrag in `de/index.js`: der Code lädt alle Dateien im Ordner `src/lib/i18n/de/` selbst (`auto.gen.js`, geschrieben von `scripts/news.mjs`). CLAUDE.md sagt noch «imported in `de/index.js`»; der Code gilt, und das Handbuch folgt dem Code.
- Zahlen (rund 690 Unit-Test-Dateien, rund 580 Browser-Specs, Start rund 3,4 MB) sind ungefähre Schnappschüsse vom 05.11.2026 und stehen mit «rund» da.
- Der Link auf `noah-wissen.md` zeigt erst nach Teil 4 ans Ziel.
- Es stehen nur die Namen von Schlüsseln drin (wie in `konten.md`), nie Werte.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub `docs/technik-handbuch.md` öffnen; das Inhaltsverzeichnis rechts oben zeigt die elf Teile.
2. Im Teil 6 («Tests und CI») die Tabelle der sechs Workflows ansehen und mit dem Reiter «Actions» auf GitHub vergleichen.
