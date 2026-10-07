# Releasebeleg: Entscheidungsprüfung und ruhige Packliste

Veröffentlicht am **07.10.2026** durch Noahs Zusammenführung von [PR #32](https://github.com/noahdolmetsch-af/packgenerator/pull/32). Die Auswahl „2 und 3 beide umsetzen“ ist die Umsetzungsfreigabe; die anschliessende Zusammenführung ist die Veröffentlichungsaktion. Die weitere Alltagstour-Abnahme des Gesamtplans ist offen.

| Kennung | Nachweis |
|---|---|
| Ziel | https://noahdolmetsch-af.github.io/packgenerator/#/pack |
| Merge | `be041f14fd35fd3caf98e8e7b7284bda9dcb98f9`, 07.10.2026 20:01:59 Europe/Zurich |
| Geprüfter Feature-Head | `89440247138a83aeec8ed4d6560123af363b0f09` |
| Integrierte Vorversion | `e7a86a072a9dcb22fc6951548000b10cf040d569`, PR #30 |
| Anzeigeversion | **0.22.0** bleibt unverändert; keine Behauptung eines 0.22.1-Releases |
| Live-CI | [Actions 37663681916](https://github.com/noahdolmetsch-af/packgenerator/actions/runs/37663681916): build, e2e und deploy erfolgreich |
| Feature-CI | [Actions 37662889188](https://github.com/noahdolmetsch-af/packgenerator/actions/runs/37662889188): build und e2e erfolgreich; PR-Deployment planmässig übersprungen |

## Vorher und nachher

Die alte Packansicht zeigte Bibliothek, Velo/Taschen, Schichten, Gewichte und Kontrollaufgaben gleichzeitig. Die Auswahl der Entwürfe 2/3 trennt Materialentscheidungen von der physischen Packkontrolle:

1. **„Noch zu entscheiden“:** vorhandene Wetter-/Materialregeln mit Begründung; Auswahl, Alternative und Menge im Entwurf. „Zurück“ verwirft; „Auswahl übernehmen“ speichert. Regel plus Materialnotiz kann man prüfen; die App behauptet keine automatische Freitext-Konflikterkennung.
2. **„Deine Packliste“:** flache Zeilen mit Name, Menge und bekanntem Gewicht, aufklappbare Taschen oder Kategorien. Weitere Aktionen im Zeilen-/Seitenmenü, Suche beim Ergänzen, Gewichte und Pflege als Details.
3. **„Packkontrolle starten“:** öffnet den bestehenden Packtag. Planungszeilen haben keine Packhäkchen; Kontrollhaken gehören zum Packtag.

Globale Suche und Sprache/Inbox/Rückblick bleiben im Packbereich über kompakte Einstiege erreichbar. Vorlagen, Fotos, Wiegen, Druck und bestehende Dialoge bleiben angebunden. Bereitschaft und Gewichte aus PR #30 wurden bei der Integration erhalten. Das ist kein neues Cockpit und keine vollständige Material-/Bausteinverwaltung.

## Umsetzung und Abweichungen

- `Pack.svelte` wurde auf Daten-/Speicherkoordination reduziert; `CalmPack.svelte`, `DecisionReview.svelte`, `preparation.js` und `calm-pack.css` tragen die neuen Ansichten.
- Bestehende Fira Sans / Sofia Sans Extra Condensed sind lokal eingebunden. Die Logoidentität bleibt; Inhalte verwenden Fira Sans.
- Mobile Zeilen und Mengenknöpfe, kompakte Suche, sichtbare Zeilenaktionen. Am Phone verschiebt man per Menü; Maus-Drag-and-drop bleibt ergänzend bei Taschengruppierung.
- Deutsche lange Home-Überschrift gegen Überlauf korrigiert.
- Gemeinsame Phasennavigation, fünf echte Regelvorschläge statt drei illustrative Karten, native eckige Checkboxen. Vollständige Quelle/Vergleiche: [Design-QA](../../design-qa.md).

## Prüfbelege und deren Reichweite

- `TZ=UTC npm test`: 227 Unit-Tests / 35 Dateien bestanden. UTC entspricht dem bestehenden Demo-Datumstest; kein behaupteter Zeitzonen-Fix.
- `npm run e2e`: 12 Browser-Tests mit frischem Produktionsbuild bestanden: 8 bestehende Tourloops (Bike/Wochenende, DE/EN, Phone/Desktop), 2 neue Review-/Packprüfungen, 2 Designaufnahmen.
- Abbruch ohne Speicherung, Alternative, Menge 3 × 80 g = 240 g nach Reload, Gewichte mit Lücken, „keine Daten“ für fehlende Pflegehistorie und Übergang zur Packkontrolle geprüft.
- Manuelle Vorschau: Suche/Ergänzen, Verschieben/Undo, Profil/kompakte Suche. Öffentliche Screenshots verwenden künstliche Prüfdaten.
- Desktop 1440 × 900, Designvergleich 1487 × 1058, Phone 390 × 844; manuelle Vorschau 1363 × 936. Die Hauptaktion passt im festgelegten Desktop-Prüfzustand vollständig in 1058 px Höhe, nicht automatisch bei beliebiger Listengrösse.
- Neue E2E-Strecke ohne JavaScript-Seitenfehler. Bestehende Buildhinweise zu PackDay-Initialwert und Bundlegrösse bleiben.
- Service Worker ist in E2E blockiert; das ist kein Offline-/Update-Test. Mobile Importbestätigung per Tastatur; bestehende Knopfüberdeckung nicht als behoben ausweisen.

## Tatsächliche Live-Kontrolle nach Merge

Am 07.10.2026 im bestehenden Cloud-Browser: zuerst alte Version 0.20.2 sichtbar. Zwei Neuladungen brachten die aktuelle Oberfläche; keine Speicherbereinigung oder Datenneuimporte. Bestehende synthetische Bikepacking-Testtour geöffnet; neue Packliste, Wettervorschlagsprüfung, korrekter Leerzustand bei fehlendem Wetter und „Zurück“ sichtbar geprüft. Material-/Tourinhalte dabei nicht geändert.

Die Live-Kontrolle ist ein kurzer Desktop-Smoke-Test in englischer UI. Keine erneute vollständige Mobil-, Mengen- oder Offlineprüfung mit dem persönlichen Bestand behaupten. Die strukturierten Erfolgstests stammen aus isolierter Vorschau/E2E.

## Offene Teile und Anschluss

AP12-Kontextstart, Übernachtungslogik, vollständige Herkunft/Ersetzungsvorschau, Bedarfs-/Bestands-/Wasserlogik, AP09-Kategoriewechsel, neue Bausteinverwaltung, 320 px/Screenreader, Zeitmessungen und gesamte PF01–PF16-Abnahme sind offen. PR #31 zur Eventabgrenzung ist nicht live; `05a7f84` integriert inzwischen diese Screens samt Event-Schalter und besitzt einen erfolgreichen CI-Lauf. Dokumentabgleich/fachliche Abnahme gehen der separaten Veröffentlichung voraus. Siehe [Roadmap](../roadmap.md) und [Prüfregister](../verification.md).

## Rückkehr zur Vorversion (vorbereitet, nicht ausgeführt)

Für einen codebezogenen Rückbau von PR #32 vom jeweils aktuellen `main` einen gesonderten Revert-Branch anlegen und `git revert -m 1 be041f14fd35fd3caf98e8e7b7284bda9dcb98f9` prüfen. Bei späteren Änderungen auftretende Konflikte fachlich lösen, Tests/Build im Revert-PR ausführen und genau diese Änderung veröffentlichen. Damit bleiben PR #30 und spätere unabhängige Änderungen erhalten; kein Force-Push auf `main`.

Da PR #32 keine neue Schema-Migration enthält, ist dafür kein pauschaler Datenimport vorgesehen. Vor einem tatsächlichen Rückbau persönliches Backup sichern und Kompatibilität auf einer Kopie prüfen. Eine ältere Datensicherung nicht ungefragt über neuere Packhaken schreiben. Ein kompletter Restore-/Rollback-Probelauf ist noch kein bestandener Nachweis (AP01/AP22/AP24). Bei alter Oberfläche zuerst neu laden; gespeicherte Browserdaten nicht löschen.
