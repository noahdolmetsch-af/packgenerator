# Pack Generator: Projektdokumentation

Stand: 7. Oktober 2026. Verbindliche Quelle: dieses Repository, aktueller Hauptzweig `main`. Das Ziel ist ein persönlicher Tourvorbereitungs-Assistent; Material, Fahrradsetup, Bausteine und Vorlagen unterstützen den Tourablauf.

| Frage | Dokument | Verantwortung |
|---|---|---|
| Was ist live, was folgt? | [Projektstand](status.md) | Kurzer Überblick; historische Releases klar abgesetzt |
| Was ist beschlossen und was ersetzt ältere Entscheidungen? | [Entscheidungslog](decisions.md) | Fachliche Entscheidungen und bewusste Grenzen |
| Welche Arbeitsschritte und Abnahmen sind geplant? | [Roadmap AP01–AP26](roadmap.md) | Einzige aktive Gesamtroadmap, Status/Abhängigkeiten/Erfolgskriterien |
| Was beweist eine Prüfung tatsächlich? | [Prüfregister](verification.md) | Teilnachweise, PF01–PF16, offene Messungen und Prüfgrenzen |
| Wie arbeiten Daten und Code zusammen? | [Architektur und Datenverträge](architecture.md) | Tatsächliche Pfade, Geltungsbereiche und Speicherwege |
| Was änderte die aktuelle Veröffentlichung? | [Release 07.10.2026 / PR #32](releases/2026-10-07-calm-preparation.md) | Freigabe, Commit, CI, Live-Prüfung, Rückkehr zur Vorversion |
| Wie funktionieren die zwei neuen Screens? | [Entwürfe 2 und 3](calm-preparation.md) | Konkreter Ablauf und erfüllte Teilkriterien |
| Wie sehen sie aus, welche Abweichungen sind bewusst? | [Design-QA](../design-qa.md) und [Bilder](../qa/) | Synthetische Beispiele; Herkunft/Vergleich/Prüfgrenzen |
| Wie kann ich den Code verstehen? | [Lern-Seite](learn/README.md) | Einfache technische Erklärung |

## Historische und private Quellen

- `packgenerator-analyse.html`, 07.10.2026: Ausgangsprüfung v0.20.2 mit den fünf Alltagsszenarien. Privat gespeichert; ursprüngliche Beobachtungen und Aufnahmen bleiben erhalten. Ein Fortschrittshinweis verweist auf die aktuelle Roadmap. Nicht als heutige Fehlerliste verwenden.
- `2026-10-07-packgenerator-ablaufplan.md`: gespeicherte datierte Fassung der Roadmap, Version 1.1. Keine zweite Statusquelle; aktuelle Fortschreibung in `docs/roadmap.md`.
- `Packgenerator-Figma-Designbrief.md`, 04.10.2026: früher Bike-/Setup-Entwurf. Sein Figma-Fortsetzungsstand ist historisch; Schriften/Navigation/Speicherkonzept gelten nicht automatisch für die neuen Screens. Nicht als fertig umgesetztes Figma-Design ausweisen.
- Ältere Audits vom 04.10.2026 und `archive/cockpit/` sind historische Belege. Unverändert aufbewahren, keine aktuellen Statuswerte darin pflegen.
- Persönliche Backups, Fotos, Belege und Inventare bleiben ausserhalb des öffentlichen Repositorys. Öffentliche QA nutzt ausschliesslich künstliche Daten.

## Fortschritt in GitHub

[Issue #33](https://github.com/noahdolmetsch-af/packgenerator/issues/33) bündelt die nächsten überprüfbaren Schritte. Seine Checkliste verweist auf die genaue AP-Roadmap und das Prüfregister. PR #32 ist der abgeschlossene Software-Teilrelease; PR #31 ist der inzwischen integrierte, noch offene Software-Release.

## Regel für jede weitere Änderung

1. AP-ID und Prüffall im PR nennen; Implementierung, Prüfung, Veröffentlichung und Nutzerabnahme unterscheiden.
2. Betroffene Roadmap-Zeile und das Prüfregister aktualisieren. Einen Teilnachweis nicht als vollständiges AP/PF abhaken.
3. Neue fachliche Entscheidung im Log mit ersetzter Regel festhalten; ältere Zeilen als Historie erhalten.
4. Nach einem Release Status und Releasebeleg um Commit, CI und tatsächliche Live-Prüfung ergänzen. Die Paketversion allein identifiziert keinen Release.
5. Gespeicherte Konzeptfassungen bei relevanten Meilensteinen abgleichen; datierte Analysen nicht nachträglich als neue Beobachtungen umschreiben.

Offene PR #31 ist nicht live. Nach den anfänglichen Softwarekonflikten integriert Commit `05a7f84` inzwischen die neue Packansicht samt Event-Schalter; CI 37667778399 ist erfolgreich. Die gemeinsame Dokumentation wird auch im Branch von PR #31 nachgeführt. Ein früherer grüner Lauf vor dieser Integration wäre kein Nachweis des heutigen Branchs.
