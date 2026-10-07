# Architektur und Datenverträge

Abgleich: `main` nach PR #32, Commit `be041f14fd35fd3caf98e8e7b7284bda9dcb98f9`, 07.10.2026. Svelte 5 + Vite, lokale Daten über Dexie/IndexedDB. GitHub Pages stellt App-Dateien bereit; es synchronisiert keine Nutzerdaten. Backuptransfer bleibt der vorhandene Gerätewechsel. Schema-Version **4**; PR #32 führt keine neue Datenbankmigration ein.

## Fachliche Grundlage und heutiger Bestand

| Begriff | Vorhandene Daten / Code | Geltungsbereich und Grenze |
|---|---|---|
| Material | `items`, `gear.js`, `gear/ItemDialog.svelte` | Ein Gegenstand mit stabiler ID, Kategorie, Besitzstatus, Gewicht pro Stück, Regeln. Kategorie bei bestehenden Items weiterhin gesperrt (AP09 offen). |
| Fahrradsetup | `bikes`, `containers`, `bikes.js`, `bikes/SetupTab.svelte` | Bikegewicht, feste Anbauteile und Standardtaschen je Position. Allgemeines Tourmaterial ist keine feste Halterung. |
| Baustein | `kits`, Itemfelder `kits`/`sets`, `trips.js` / `NIGHT_SETS` | Importierte Gruppen und Nachtsets vorhanden; eine geschlossene neue Bausteinverwaltung ist AP10, nicht geliefert. |
| Vorlage | Einstellung `templates`, `templates.js`, `pages/Templates.svelte` | Wiederverwendbare Konfiguration. Keine neue Vorlagenlogik in PR #32; vollständige Rundlaufprüfung AP18/AP22 offen. |
| Konkrete Packliste | `trips`, `entries` mit `itemId`, `slot`, `qty`, `packed` | Tourbezogene Zusammenstellung/Checks und Kopie des Setups. Ändern der Tour ist nicht Ändern des Fahrradstandards. |
| Vorschlag / Entscheidung | `layers.js`, `preparation.js`, `pack/DecisionReview.svelte` | Bestehende Regeln liefern Vorschläge; Auswahl im lokalen Entwurf; Bestätigung gibt Patch für genau diese Tour zurück. Keine freie Textinterpretation. |
| Packkontrolle | `pack/PackDay.svelte`, `ready` der Tour | Tatsächlich gepackte Gegenstände und Startcheck bleiben getrennte Zustände. |
| Pflege / Vorbereitung | `care.js`, `workshop.js`, `readiness.js`, `care/CareTab.svelte` | Gemeinsame Aussagen für Bikepflege, Eventvorbereitung und Packstand. Expliziter Eventmodus erst in offener PR #31. |
| Unterwegs / Rückblick | `pages/Ride.svelte`, `pages/Debrief.svelte`, `debrief.js`, `notes.js` | Vorhandene Tourstrecke und Learnings; vollständig erklärbares Lernen AP25 separat. |

## Verantwortung der neuen Dateien

| Datei | Aufgabe |
|---|---|
| `src/pages/Pack.svelte` | Liest Tour-/Material-/Pflegedaten, berechnet bestehende Statistiken, speichert Touränderungen, verwaltet Undo und vorhandene Dialoge. |
| `src/lib/pack/CalmPack.svelte` | Zeigt flache Materialzeilen und aufklappbare Gruppen; Mengen, Zeilenmenü, Materialsuche, Details und Übergang zur Kontrolle. |
| `src/lib/pack/DecisionReview.svelte` | Hält Auswahl/Alternative/Menge im Entwurf. Bei Speicherfehler bleibt die Auswahl mit Fehlhinweis sichtbar. Fehlerfall noch nicht gezielt getestet. |
| `src/lib/preparation.js` | `reviewRows`, `acceptReview`, `planningGroups`: prüfbare Funktionen ohne eigenen Datenbankzugriff. |
| `src/lib/pack/calm-pack.css` | Gemeinsame Darstellung beider Screens und mobile Übertragung; Aktionsfarbe übernimmt `--hi`. |
| `src/App.svelte`, `src/lib/nav/Search.svelte` | Im Packbereich kompakte Suche/Zielnavigation; Profilmenü mit Sprache/Inbox/Rückblick. Andere Seiten behalten ihre bestehenden Wege. |
| `src/main.js`, `index.html`, `public/fonts/` | Vorhandene Schriftfamilien lokal statt über Google-Fonts-Link; keine neue visuelle Schriftidentität. |

## Speichern, Mengen und Wiederherstellung

- Review-Änderung: lokale `choices` → bestätigtes `acceptReview`-Ergebnis → `Pack.svelte`-Transaktion für die aktuelle Tour. Zurück verwirft den Entwurf.
- Einzelne Änderungen in der Packliste werden sofort tourbezogen gespeichert. Hier gibt es keinen gemeinsamen „alles speichern“-Entwurf wie in einem früheren Setup-Konzept.
- `change` liest die aktuelle Tour innerhalb der Dexie-Schreibtransaktion, legt einen Undo-Zustand an und aktualisiert die betroffenen Felder. Undo hält bis zu 20 Zustände der aktuellen Sitzung; kein dauerhafter geräteübergreifender Änderungsverlauf.
- Neue bzw. in Menge/Ort geänderte Einträge gelten als ungepackt. Bei unveränderter Menge/Position erhält die Review-Übernahme den vorhandenen Packzustand.
- Mengen sind in der neuen Bedienung auf 1–20 begrenzt; Review berücksichtigt zusätzlich `maxQty`. Das ist keine Prüfung verfügbaren Lagerbestands und keine vollständige Bedarfsplanung. Sichtbarer ungekürzter Bedarf bei überschrittenem Maximum bleibt AP14.
- Nicht ausgewählte Vorschläge werden nicht neu ergänzt; bestehende nicht ausgewählte Einträge werden dadurch nicht automatisch entfernt. Früher ausgelassene Vorschläge lassen sich erneut prüfen.
- Kategoriegruppierung verändert die Anzeige, nicht den Packort. Unbekannte Kategorien gehen in „Other“, Gegenstände bleiben erhalten.
- `backup.js` exportiert/importiert die vorhandenen Datentabellen; `folderBackup.js` ergänzt die Desktop-Ordnersicherung. Vollständiger persönlicher Referenz-Rundlauf und Fehlerfälle bleiben AP01/AP22.

## Reale Einstiegspunkte für weitere APs

| APs | Bestehende Dateien zur Untersuchung | Prüfung |
|---|---|---|
| AP01/AP09/AP22 | `db.js`, `backup.js`, `replace.js`, `gear/ItemDialog.svelte`, `trips.js` | Referenzen/Import/Änderungen; zuerst sichere Testkopie |
| AP02/AP12–AP15 | `trips.js`, `layers.js`, `preparation.js`, `pack/TripDialog.svelte`, `pack/DecisionReview.svelte`, `pack/TripRoute.svelte` | Kontext/Rangfolge/Regeländerung; PF01–PF06/PF10 |
| AP03/AP07/AP08/AP21 | `app.css`, `App.svelte`, `pages/Home.svelte`, `pages/Gear.svelte`, `pack/calm-pack.css`, `nav/` | Suche/Navigation/Kurzdialog/Fokus/320–390 px |
| AP05 | `favorites.js`, `readiness.js`, `pages/Gear.svelte`, `pages/Home.svelte` | Persistenter Stern und gefilterter Einstieg |
| AP06/AP16 | `readiness.js`, `care.js`, `workshop.js`, `care/TripCare.svelte`, `pages/Pack.svelte` | Integrierten PR #31 fachlich abnehmen, Kurzfahrt vs. Event |
| AP10/AP11/AP17/AP18 | `kits`/`items`/`containers`/`settings`, `bikes.js`, `templates.js`, `pack/TemplateDialog.svelte`, `pages/Templates.svelte` | Gruppen/Herkunft/Zuordnungen; keine automatische Touränderung |
| AP19/AP20/AP25 | `pack/PackDay.svelte`, `pages/Ride.svelte`, `pages/Debrief.svelte`, `debrief.js`, `packhints.js`, `templates.js` | Tourkontrolle, Rückblick und begründetes Lernen |
| AP23/AP24/AP26 | `tests/e2e/`, `playwright.config.js`, `.github/workflows/deploy.yml`, `backup.js` | Abnahme/Messung/Release; Sync erst nach eigener Entscheidung |

Dies sind vorhandene Untersuchungspfade, keine vorweggenommene technische Implementierung der offenen APs. Exakte Änderungen und neue Dateien vor dem jeweiligen Arbeitspaket festlegen.
