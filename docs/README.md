# Pack Generator: Projektdokumentation

Stand: 26. Oktober 2026 (auf `main` v0.198.0; PR #253 mit 0.196/0.197 offen). **Einstieg: [Projektstand und Plan](projektstand.md)** (was live ist, was gebaut wartet, Reihenfolge der sechs Pakete) und [Geschichte](geschichte.md) (wie das Projekt seit dem 4.10.2026 gewachsen ist). Verbindliche Quelle: dieses Repository, aktueller Hauptzweig `main`. Das Ziel ist ein persönlicher Tourvorbereitungs-Assistent; Material, Fahrradsetup, Bausteine und Vorlagen unterstützen den Tourablauf.

| Frage | Dokument | Verantwortung |
|---|---|---|
| Wo stehen wir heute, was kommt als Nächstes? | [Projektstand und Plan](projektstand.md) | Einstieg, Stand 26.10.2026; wird bei jedem Paket nachgeführt und gilt vor älteren Angaben |
| Wie ist das Projekt gewachsen? | [Geschichte](geschichte.md) | Abschnitte von 0.1.0 bis heute, mit den Wendepunkten und dem, was wir gelernt haben |
| Was wurde seit 0.96 besprochen, entschieden, gebaut und spezifiziert? | [Zwischenstand 14.10.2026](zwischenstand/README.md) | Datierter Schnappschuss für Aussenstehende, sechs Dokumente |
| Was muss Claude bei jeder Arbeit beachten? | [CLAUDE.md](../CLAUDE.md) | Kurzanleitung für jede Claude-Sitzung: Arbeitsweise, Datenschutz, Release-Checkliste, Tests |
| Was ist geplant und warum? Sind wir auf Kurs? | [Geplante Vorhaben](vorhaben.md) | Alle Vorhaben mit Warum, Beispiel und Stand; Kurs-Check vor jedem Paket |
| Wie arbeiten wir zusammen (Pakete, Mockups, Freigabe)? | [Arbeitsweise](arbeitsweise.md) | Oben die Regeln, die seit 18.10.2026 gelten (zuerst bauen, dann Bilder; Claude führt ein Paket nach Noahs «ok» zusammen; Fragen ohne ★; kein Trello). Darunter die Arbeitsanweisung vom 9.10.2026 als Verlauf |
| Was ist live, was ist in Arbeit, was kam in welchem Release? | [Projektstand](status.md) | Ausführliches Protokoll: «Aktuell live» (seit 18.10.2026 wieder nachgeführt), «In Arbeit» mit den sechs Paketen, Historie. Die genaue Versionsliste steht in `src/lib/whatsnew.js` auf `main` |
| Was ist beschlossen und was ersetzt ältere Entscheidungen? | [Entscheidungslog](decisions.md) | Fachliche Entscheidungen und bewusste Grenzen |
| Welche Arbeitsschritte und Abnahmen sind geplant, was kommt als Nächstes? | [Roadmap AP01–AP30](roadmap.md) | Ursprüngliche Arbeitspakete vom 7.10.2026 mit Prüffällen und Fortschrittsregister. Die heutige Reihenfolge steht im [Projektstand](projektstand.md) |
| Was beweist eine Prüfung tatsächlich? | [Prüfregister](verification.md) | Teilnachweise, PF01–PF16, offene Messungen und Prüfgrenzen |
| Wie arbeiten Daten und Code zusammen? | [Architektur und Datenverträge](architecture.md) | Tatsächliche Pfade, Geltungsbereiche und Speicherwege |
| Wo liegt welche Liste, was gilt für Daten? | [Daten](daten.md) | Eine Liste, ein Ort; nichts Persönliches im Code; Besitzer jeder Tabelle (seit 14.10.2026); alle Grundlisten im Verzeichnis `src/lib/standard.js`, eigene Kategorien über `src/lib/lists.js` (seit 0.134.0) |
| Was änderte ein Release genau? | [Releases](releases/) und die [Historie im Projektstand](status.md#historie-veröffentlichter-funktionen) | Ausführlicher Beleg bisher für [07.10.2026 / PR #32](releases/2026-10-07-calm-preparation.md); spätere Releases: Kurzeintrag im Status und Pull Request auf GitHub |
| Was ist neu für Noah, in einfachen Worten? | `src/lib/whatsnew.js`, in der App unter „Was die App alles kann“ | Die letzten Releases mit Knopf „Ausprobieren“ |
| Wie funktionieren die zwei neuen Screens? | [Entwürfe 2 und 3](calm-preparation.md) | Konkreter Ablauf und erfüllte Teilkriterien |
| Welche Pakete folgen aus der Strategie (119 Fragen)? | [Strategie-Pakete](strategie-pakete.md) | Design D1–D6, Im Flow, Server S1–S5, Neuland N1 (Stand 9.10.2026, Verlauf) |
| Wie prüfen wir das Design regelmässig, Screen für Screen? | [Design-Audits](design-audit.md) | Regel: vor jeder neuen Funktion ein Audit; Screen-Inventar mit Noten |
| Wie sehen sie aus, welche Abweichungen sind bewusst? | [Design-QA](../design-qa.md) und [Bilder](../qa/) | Synthetische Beispiele; Herkunft/Vergleich/Prüfgrenzen |
| Wie ist die Bezahlfunktion vorbereitet? | [Bezahlen](bezahlen.md) | Unsichtbar, nur Testmodus; Server, Lizenz, Codes, Shop und Buchung |
| Welche Links nach aussen kommen (komoot, Strava, SBB, MeteoSchweiz …)? | [Links nach aussen](links-nach-aussen.md) | Spezifikation DG-X1–X16 vom 13.10.2026, noch nicht gebaut |
| Wie nutze ich jede Funktion (aufschalten, Beispiel)? | [Benutzerhandbuch](handbuch.md) und [Kleine Apps](kleine-apps.md) | Aus `src/lib/handbook.js` erzeugt (`node tools/handbuch.mjs`) |
| Wie verbinde ich Strava? | [Strava verbinden](strava-verbinden.md) | Anleitung ab 0.116.0; die App liest nur |
| Wie richte ich den KI-Helfer ein? | [KI-Helfer einrichten](ki-helfer-einrichten.md) | Schlüssel nur in Vercel; ab 0.118.0 ab Werk aus |
| Was muss ich nach der Einrichtung selbst noch tun? | [Wann du etwas tun musst](wann-du-etwas-tun-musst.md) | Die seltenen Fälle mit genauen Klicks (neues Gerät, Login abgelaufen, KI-Guthaben, Gratisdienste, Backup), Stand 19.10.2026 |
| Wie kann ich den Code verstehen? | [Lern-Seite](learn/README.md) | Einfache technische Erklärung |

## Historische und private Quellen

- `packgenerator-analyse.html`, 07.10.2026: Ausgangsprüfung v0.20.2 mit den fünf Alltagsszenarien. Privat gespeichert; ursprüngliche Beobachtungen und Aufnahmen bleiben erhalten. Ein Fortschrittshinweis verweist auf die aktuelle Roadmap. Nicht als heutige Fehlerliste verwenden.
- `2026-10-07-packgenerator-ablaufplan.md`: gespeicherte datierte Fassung der Roadmap, Version 1.1. Keine zweite Statusquelle; aktuelle Fortschreibung in `docs/roadmap.md`.
- `Packgenerator-Figma-Designbrief.md`, 04.10.2026: früher Bike-/Setup-Entwurf. Sein Figma-Fortsetzungsstand ist historisch; Schriften/Navigation/Speicherkonzept gelten nicht automatisch für die neuen Screens. Nicht als fertig umgesetztes Figma-Design ausweisen.
- Ältere Audits vom 04.10.2026 und `archive/cockpit/` sind historische Belege. Unverändert aufbewahren, keine aktuellen Statuswerte darin pflegen.
- Persönliche Backups, Fotos, Belege und Inventare bleiben ausserhalb des öffentlichen Repositorys. Öffentliche QA nutzt ausschliesslich künstliche Daten.

## Fortschritt in GitHub

Auf `main` ist v0.198.0 (25.10.2026). Seit 24.10.2026 geht jedes Paket ohne Noahs «ok» online, sobald die Prüfungen grün sind (Testlink und Auto-Merge, Bündler-Thread «Mein Überblick»; siehe [Arbeitsweise](arbeitsweise.md), Abschnitt «Stand 26.10.2026»). Früher (15.10.2026): fertige Teile werden zu Paketen gebündelt; jedes Paket ist ein Pull Request mit Vorher/Nachher, Tests, Bildern und dem Abschnitt «Was fällt weg oder rutscht tiefer». Claude führt ein Paket zusammen, wenn Noah die Bilder gesehen und dafür «ok» geschrieben hat und alle Prüfungen grün sind. Seit 18.10.2026 gibt es sechs grosse Pakete (siehe [Projektstand](projektstand.md)). Die genaue Liste aller Versionen steht in `src/lib/whatsnew.js` (in der App unter Ich › Was ist neu) und in der Historie des [Projektstands](status.md). Ein Überblick für Aussenstehende über die Zeit seit 0.96 steht im [Zwischenstand](zwischenstand/README.md). Das [Fortschrittsregister der Roadmap](roadmap.md#fortschrittsregister) bleibt die genaue Quelle für die Arbeitspakete.

## Dokumentationsregel für jeden Release-PR

Seit 8.10.2026 auf Noahs Wunsch („immer wieder alles gut dokumentiert“). Jeder Release-PR aktualisiert im selben PR:

1. **[projektstand.md](projektstand.md):** Abschnitte 2 (live), 3 (Pakete) und 5 (Entscheide) nachführen (seit 18.10.2026).
1. **[status.md](status.md):** Stand-Datum, „Aktuell live“, „In Arbeit“ und einen kurzen Eintrag in der Historie (2 bis 5 Zeilen).
2. **[decisions.md](decisions.md):** neue Entscheide mit Datum und Grund, wenn es welche gab; ersetzte Regel nennen, ältere Zeilen bleiben.
3. **`src/lib/whatsnew.js`:** 2 bis 4 einfache Punkte für „Was die App alles kann“ (Deutsch und Englisch).
4. **[roadmap.md](roadmap.md):** Fortschrittsregister und „Stand und nächste Pakete“, wenn ein Arbeitspaket seinen Stand ändert.
5. **PR-Text:** Abschnitt «Was fällt weg oder rutscht tiefer» (seit 14.10.2026, «Nichts» ist erlaubt) und Bilder des fertigen Schritts (1440 und 390 px, hell; seit 14.10.2026 22:19 statt Mockup-Freigabe vor dem Bau).

Dazu wie bisher:

- AP-ID und Prüffall im PR nennen; Implementierung, Prüfung, Veröffentlichung und Nutzerabnahme unterscheiden. Einen Teilnachweis nicht als vollständiges AP/PF abhaken; bei Bedarf das [Prüfregister](verification.md) ergänzen.
- Keine privaten Daten in die Docs: keine Materiallisten, Belege, GPX, Backups oder persönlichen Angaben. Das Repository ist öffentlich.
- Gespeicherte Konzeptfassungen bei relevanten Meilensteinen abgleichen; datierte Analysen nicht nachträglich als neue Beobachtungen umschreiben.
