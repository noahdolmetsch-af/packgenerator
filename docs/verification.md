# Prüfregister und Messung

Stand: 07.10.2026, Softwarestand PR #32 / `be041f14fd35fd3caf98e8e7b7284bda9dcb98f9`. Änderungen dieser Dokumentationsrunde betreffen Dokumente, keine Software. [Releasebeleg](releases/2026-10-07-calm-preparation.md) enthält CI/Live-Nachweise; [Design-QA](../design-qa.md) die Bildvergleiche.

## Evidenzregister

| Kennung | Tatsächlich geprüft | Quelle | Grenze |
|---|---|---|---|
| E01 | 227 Unit-Tests / 35 Dateien | `TZ=UTC npm test`, CI build erfolgreich | Viele bestehende Tests; nicht 227 neue Tests und keine Nutzerabnahme |
| E02 | 8 bestehende Tourloops: Bike/Wochenende × DE/EN × Phone/Desktop | `tests/e2e/flow.spec.js`, `areas.spec.js` | Keine fünf vollständigen Alltagsszenarien, keine Zeitmessung |
| E03 | Review abbrechen, Alternative übernehmen, Menge/240 g/Reload, ehrliche Summen, Pflege „keine Daten“, Packtag | `tests/e2e/preparation.spec.js`, zwei Projekte | Dauerwechsel, sämtliche Alternativ-/Mehrtourfälle und Speicherfehler nicht vollständig |
| E04 | Entwurf ohne Mutation, bestätigte Patches, Packzustandsreset, explizites Auslassen, ungültige Alternative/Begrenzung, Kategoriegruppierung | `tests/preparation.test.js` | Keine vollständige Kontext-/Bestandslogik |
| E05 | Review-/Packaufnahmen, 390 px ohne horizontalen Überlauf, Desktop-Hauptaktion innerhalb 1058 px im Fixture | `tests/e2e/design-capture.spec.js`, `qa/` | Kein Pixelregressionstest; kein mobiles Quellbild |
| E06 | Pflege nach Zeit/km/fehlenden Daten; Favoritenzählung/Filter; Gewichtslücken und vorhandene Mengenregeln | `tests/readiness.test.js`, `weights.test.js`, `layers.test.js`, `favorites.test.js` | Eventvorbereitung im Live-Stand noch für jede datierte Bike-Tour |
| E07 | Manuelle Vorschau: Ergänzen, Suche, Verschieben/Undo, Profilmenü, globale Suche/Escape | `design-qa.md` | Einzelprüfungen mit fiktiven Daten; keine vollständige Tastatur-/Screenreaderabnahme |
| E08 | Build/e2e/deploy erfolgreich und neue Screens auf Live geöffnet; Review-Leerzustand/Rückweg | Actions 37663681916; Releaseprotokoll | Nur kurzer Desktop-Smoke-Test, keine erneute gesamte Live-Teststrecke |

Alle 12 E2E-Tests laufen auf einem frischen Build. Playwright blockiert Service Worker; externe Dienste werden in der neuen Funktionsprüfung blockiert. PWA/echte Forecastabfrage daher separat prüfen. Beispielbestände sind isoliert; Nutzerexporte nicht veröffentlichen.

## Paralleler Branch-Nachweis

PR #31 integriert in Commit `05a7f841e1a8da5509eed88c27a0d9cb7fc40616` die Screens von PR #32 samt Event-Schalter. [CI 37667778399](https://github.com/noahdolmetsch-af/packgenerator/actions/runs/37667778399) ist erfolgreich. Dies ist ein Nachweis des offenen Branches, keine Veröffentlichung und keine automatische vollständige PF13-/AP16-Abnahme. Dokumentkonflikte werden durch Übernahme der gemeinsamen Dokumentquellen gelöst; Software bleibt dabei unverändert.

## Gesamtprüffälle PF01–PF16

| PF | Vorhandener Teilnachweis | Noch zu prüfen / messen | Vollständig bestanden? |
|---|---|---|---|
| PF01 MTB 2 h | Bestehender Tourloop E02 | Kontext vor Liste, kein Nacht-Aufräumen, 3 Zeitversuche ≤60 s Median | Nein |
| PF02 Alpin 6 h / Schauer | Alpine Fixture, Gründe/Alternative, bestätigte Auswahl E03/E04 | Gesamte Schicht-/Ersetzungsauswirkung und Doppelungsfälle | Nein |
| PF03 Regel 1/3 h; 2 → 6 h | Regel-/Mengenfunktion E04/E06; manuelle Menge nach Reload E03 | Kontextwechsel mit unveränderter manueller Menge bis Zustimmung | Nein |
| PF04 Regel vs. Notiz / Fehlbestand | Prüfhilfe zeigt Regel und Notiz | Strukturierter Konflikt, ungekürzter Bedarf, Verfügbarkeit/Maximum | Nein |
| PF05 Outdoor 3 Tage / Kochen | Vorhandener Bikepacking-Ablauf; Live-Testtour geöffnet E08 | Frühe Schlaf-/Kochwahl, Taschenempfehlung, Tag/Gesamtmenge | Nein |
| PF06 Unterkunft | Keine neue Logik geliefert | Kein automatisches Zelt-/Matten-Set; eigene Auswahl erhalten | Nein |
| PF07 Material anlegen | Vorhandener Dialog; Such-/Ergänzen-Prüfung E07 | Drei Pflichtangaben, fehlendes Gewicht, 3 Messungen ≤30 s | Nein |
| PF08 Favoriten | Zählbasis und Filter E06; Implementierung PR #30 | Voller Stern-/Home-/Reload-/Zurück-Rundlauf dokumentieren | Nein |
| PF09 Kategorie/Referenzen | Bestehende Kategorie gesperrt; Backup-Basistests E01 | Änderung mit Tour/Vorlage/Baustein/Container und Restore | Nein |
| PF10 Mehrere Herkünfte | Vorhandene/unabhängige Review-Einträge erhalten E04 | Zwei Bausteine plus Wetter, Herkunft und Mengen ohne Duplikate | Nein |
| PF11 Verschieben/Undo / eigenes Seatpack | Manuelle Vorschau E07; Gruppierung ändert Ort nicht E04 | Gesamter Seatpack-/Mehrtour-/Standard-Isolationsfall | Nein |
| PF12 Haken/Neuladen/Vorlage | Packloop E02, Mengenpersistenz/Packreset E03/E04 | Teilweise Haken plus Vorlagenkopie und zwei Touren zusammen | Nein |
| PF13 Kurzfahrt/Event/Pflege | Gemeinsame Bikepflege E06 | Integrierten PR #31 fachlich abnehmen; Kurzfahrt ohne Eventwarnlast, Event mit Fahrplan | Nein |
| PF14 Gewicht/Volumen/Leerzustände | Gewichtslücken E03/E06; Live-Review ohne Vorschläge E08 | Unbekanntes Volumen, kein Bike, Suche/Wetter und volle Fallkombination | Nein |
| PF15 Responsive/Tastatur/Screenreader | 390 px Touch und Desktop E02/E03/E05; Fokusstile vorhanden | 320/768 px, Tastatureinblendung, Dialogfokus und Screenreader | Nein |
| PF16 Integrationen/Backup/Offline | Vorhandene Tourloops und synthetischer Import E01/E02 | Siehe einzelne Teilnachweise unten | Nein |

Die 16 vollständigen Prüffälle sind noch nicht abgenommen. „Nein“ bedeutet, dass mindestens ein erforderlicher Bestandteil offen ist; bestandene Teilprüfungen bleiben sichtbar. Dasselbe gilt für formale AP-/Meilenstein-Abnahmen der Gesamtroadmap.

## PF16 einzeln führen

| Teil | Stand | Nächster Nachweis |
|---|---|---|
| Fahrt → Ende → Rückblick | Bestehender synthetischer E2E-Loop bestanden | Tournotiz/Etappen-Zuordnung zusätzlich |
| GPX | Vorhandene Parser-Unit-Tests | Gültige/ungültige Datei im UI, richtige Tour |
| Wetter | Vorhandene Berechnungs-Unit-Tests, manuelle Tourwerte | Öffentlicher Testort/Forecast, Ausfall und gespeicherter Stand |
| Foto | Einstieg erhalten | Synthetisches Foto hochladen/öffnen/Backup-Rundlauf |
| PDF/Druck | Druckansicht erhalten | Tatsächlich verwendbare PDF mit vollständigem Inhalt |
| Share | Vorhandene Share-Unit-Tests | Synthetischen Link in unabhängiger Sitzung öffnen |
| Backup/Import | Vorhandene Backup-Unit-Tests, E2E-Fixture-Import | Gesamter Referenzbestand, Konflikte, Abbruch und Wiederherstellung |
| Offline/Wiederonline/PWA | Nicht durch E2E nachgewiesen; Worker dort blockiert | Offline-Neustart, Haken, Wiederverbindung und Update mit erhaltenen Daten |
| Speicher verweigert | Fehlhinweis in Review implementiert | Fehler gezielt auslösen, kein falscher Erfolg, Entwurf erhalten |

## Messprotokoll für die nächste Nutzerabnahme

Kein Zeitwert wurde bislang gemessen. Zielwerte: neue prüfbare MTB-Tagestourliste ≤60 s; Materialeintrag ≤30 s. Je Aufgabe drei Versuche, Einzelwerte und Median; ersten Versuch separat als Erstnutzung kennzeichnen. Gleiche Ausgangsdaten/Angaben verwenden, Navigation und Entscheidungen zählen mit; physisches Einpacken ausgeschlossen. Drei Versuche sind kein statistischer Wirksamkeitsnachweis.

| Aufgabe | Start / Ende | Versuch 1 | Versuch 2 | Versuch 3 | Median | Fehler / Nachkorrekturen |
|---|---|---|---|---|---|---|
| MTB 2 h vorbereiten | Neue Tour öffnen → sichtbare prüfbare Liste | Offen | Offen | Offen | Offen | Nachtmaterial entfernen, fehlende Angaben, falsche Tour zählen |
| Material ergänzen | Material hinzufügen öffnen → gespeicherter auffindbarer Gegenstand | Offen | Offen | Offen | Offen | Pflichtfelder, Kategorie, fehlendes Gewicht, Zuordnung zählen |

Zusätzlich alle fünf Alltagsszenarien mit Noah protokollieren. Nicht bestätigte Abnahmen bleiben offen; zukünftige Screenarbeiten erweitern dieses Register statt die historischen Resultate umzuschreiben.
