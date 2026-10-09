# Pack Generator: Projektdokumentation

Stand: 8. Oktober 2026 (live v0.35.0). Verbindliche Quelle: dieses Repository, aktueller Hauptzweig `main`. Das Ziel ist ein persönlicher Tourvorbereitungs-Assistent; Material, Fahrradsetup, Bausteine und Vorlagen unterstützen den Tourablauf.

| Frage | Dokument | Verantwortung |
|---|---|---|
| Was ist live, was ist in Arbeit, was kam in welchem Release? | [Projektstand](status.md) | Kurzer Überblick; Historie aller Releases, neueste zuerst |
| Was ist beschlossen und was ersetzt ältere Entscheidungen? | [Entscheidungslog](decisions.md) | Fachliche Entscheidungen und bewusste Grenzen |
| Welche Arbeitsschritte und Abnahmen sind geplant, was kommt als Nächstes? | [Roadmap AP01–AP30](roadmap.md) | Einzige aktive Gesamtroadmap, Status/Abhängigkeiten/Erfolgskriterien; [Stand und nächste Pakete](roadmap.md#stand-und-nächste-pakete-8102026) |
| Was beweist eine Prüfung tatsächlich? | [Prüfregister](verification.md) | Teilnachweise, PF01–PF16, offene Messungen und Prüfgrenzen |
| Wie arbeiten Daten und Code zusammen? | [Architektur und Datenverträge](architecture.md) | Tatsächliche Pfade, Geltungsbereiche und Speicherwege |
| Was änderte ein Release genau? | [Releases](releases/) und die [Historie im Projektstand](status.md#historie-veröffentlichter-funktionen) | Ausführlicher Beleg bisher für [07.10.2026 / PR #32](releases/2026-10-07-calm-preparation.md); spätere Releases: Kurzeintrag im Status und Pull Request auf GitHub |
| Was ist neu für Noah, in einfachen Worten? | `src/lib/whatsnew.js`, in der App unter „Was die App alles kann“ | Die letzten Releases mit Knopf „Ausprobieren“ |
| Wie funktionieren die zwei neuen Screens? | [Entwürfe 2 und 3](calm-preparation.md) | Konkreter Ablauf und erfüllte Teilkriterien |
| Welche Pakete folgen aus der Strategie (119 Fragen)? | [Strategie-Pakete](strategie-pakete.md) | Design D1–D6, Im Flow, Server S1–S5, Neuland N1 |
| Wie prüfen wir das Design regelmässig, Screen für Screen? | [Design-Audits](design-audit.md) | Regel: vor jeder neuen Funktion ein Audit; Screen-Inventar mit Noten |
| Wie sehen sie aus, welche Abweichungen sind bewusst? | [Design-QA](../design-qa.md) und [Bilder](../qa/) | Synthetische Beispiele; Herkunft/Vergleich/Prüfgrenzen |
| Wie kann ich den Code verstehen? | [Lern-Seite](learn/README.md) | Einfache technische Erklärung |

## Historische und private Quellen

- `packgenerator-analyse.html`, 07.10.2026: Ausgangsprüfung v0.20.2 mit den fünf Alltagsszenarien. Privat gespeichert; ursprüngliche Beobachtungen und Aufnahmen bleiben erhalten. Ein Fortschrittshinweis verweist auf die aktuelle Roadmap. Nicht als heutige Fehlerliste verwenden.
- `2026-10-07-packgenerator-ablaufplan.md`: gespeicherte datierte Fassung der Roadmap, Version 1.1. Keine zweite Statusquelle; aktuelle Fortschreibung in `docs/roadmap.md`.
- `Packgenerator-Figma-Designbrief.md`, 04.10.2026: früher Bike-/Setup-Entwurf. Sein Figma-Fortsetzungsstand ist historisch; Schriften/Navigation/Speicherkonzept gelten nicht automatisch für die neuen Screens. Nicht als fertig umgesetztes Figma-Design ausweisen.
- Ältere Audits vom 04.10.2026 und `archive/cockpit/` sind historische Belege. Unverändert aufbewahren, keine aktuellen Statuswerte darin pflegen.
- Persönliche Backups, Fotos, Belege und Inventare bleiben ausserhalb des öffentlichen Repositorys. Öffentliche QA nutzt ausschliesslich künstliche Daten.

## Fortschritt in GitHub

Live ist v0.35.0 (8.10.2026). Jeder Release ist ein eigener Pull Request mit Vorher/Nachher und Tests; die Liste aller Releases mit kurzer Beschreibung steht in der Historie des [Projektstands](status.md). [Issue #33](https://github.com/noahdolmetsch-af/packgenerator/issues/33) bündelt weiterhin die Abnahmeschritte; das [Fortschrittsregister der Roadmap](roadmap.md#fortschrittsregister) bleibt die genaue AP-Quelle.

## Dokumentationsregel für jeden Release-PR

Seit 8.10.2026 auf Noahs Wunsch („immer wieder alles gut dokumentiert“). Jeder Release-PR aktualisiert im selben PR:

1. **[status.md](status.md):** Stand-Datum, „Aktuell live“, „In Arbeit“ und einen kurzen Eintrag in der Historie (2 bis 5 Zeilen).
2. **[decisions.md](decisions.md):** neue Entscheide mit Datum und Grund, wenn es welche gab; ersetzte Regel nennen, ältere Zeilen bleiben.
3. **`src/lib/whatsnew.js`:** 2 bis 4 einfache Punkte für „Was die App alles kann“ (Deutsch und Englisch).
4. **[roadmap.md](roadmap.md):** Fortschrittsregister und „Stand und nächste Pakete“, wenn ein Arbeitspaket seinen Stand ändert.

Dazu wie bisher:

- AP-ID und Prüffall im PR nennen; Implementierung, Prüfung, Veröffentlichung und Nutzerabnahme unterscheiden. Einen Teilnachweis nicht als vollständiges AP/PF abhaken; bei Bedarf das [Prüfregister](verification.md) ergänzen.
- Keine privaten Daten in die Docs: keine Materiallisten, Belege, GPX, Backups oder persönlichen Angaben. Das Repository ist öffentlich.
- Gespeicherte Konzeptfassungen bei relevanten Meilensteinen abgleichen; datierte Analysen nicht nachträglich als neue Beobachtungen umschreiben.
