# Eine ruhigere Tourenliste

PR #(folgt) · 23.11.2026 · Auftrag: Noah «was fällt dir hier auf», «ja» (Thread «Touren-Liste aufräumen»)

Noahs Seite Touren › Übersicht hatte 22 grosse Karten mit je rund 12 Werten, sechsmal dieselbe Tour, zwei erfundene Beispiele mitten in den echten Touren und den Rückblick dreimal.

## Was ist neu
- **Eine kompakte Zeile pro Tour:** Name, Zustand, Datum · Art · Velo und darunter «26 km · 2'047 Hm · 1 h 28 min». Ein Pfeil rechts öffnet die Werte (Fahrzeit, verstrichene Zeit, Tempo, Puls, Wetter, Temperatur, Leistung, gepackte Dinge, Strava). Ein Tippen auf den Namen öffnet wie bisher die Tour.
- **Leere Werte fehlen:** kein «–», kein «0 km», kein «keine Strava-Aktivität». Zeiten lesen sich «9 h 58 min» («Verstrichen 00:09:58:34» ist weg).
- **Doppelte prüfen:** eine ruhige Zeile unter «Mit Packliste» («5 Touren sehen doppelt aus · Doppelte prüfen»). Das Fenster zeigt jede Gruppe gleicher Touren (Name, Tag, Länge, Velo) mit einem Vorschlag, welche bleibt (mit Rückblick, dann am meisten gepackt, dann die älteste). Du kannst die Wahl ändern oder eine Gruppe auslassen. Nichts geschieht von selbst.
- **Wieder trennen:** das Fenster listet bereits Zusammengelegte; ein Tippen holt sie genau so zurück, wie sie waren (auch ihr Rückblick und ihre hochgeladenen Fahrten).
- **Beispiele ausgeblendet:** «Jura-Runde (Beispiel)» und «Seerunde (Beispiel)» stehen nicht mehr in der Liste, sobald es echte Touren gibt; eine Zeile zeigt sie wieder.
- **Der Rückblick einmal oben:** am Computer die Kachel «Offene Rückblicke»; der Knopf auf jeder Zeile ist weg.
- Neu: `src/lib/touren/aufraeumen.js` (Regeln, rein), `aufraeumendb.js` (Datenbank), `DoppelteSheet.svelte` (Fenster).

## Was fällt weg oder rutscht tiefer
- Die Werte jeder Tour (Fahrzeit, verstrichene Zeit, Tempo, Puls, Wetter, Leistung, Packinfo) rutschen hinter den Pfeil der Zeile (vorher immer offen).
- Der Knopf «Rückblick» / «Kurz bewerten» auf jeder grauen Zeile steht jetzt in den aufgeklappten Werten (alter Weg: Knopf auf der Zeile; neuer Weg: Pfeil, dann «Rückblick»; oder die Kachel oben, oder die Tour öffnen).
- Die Zeile «n warten auf deinen Rückblick» unter dem Titel fällt am Computer weg, solange die Kachel «Offene Rückblicke» sichtbar ist (am Handy bleibt sie).
- Die Hinweise «ohne Strecke» und «keine Strava-Aktivität» fallen weg (sie standen bei jeder Zeile ohne Daten).
- Die zwei Beispiel-Touren und (nach deinem Tippen) die zusätzlichen Doppelten stehen nicht mehr in der Liste; sie bleiben in den Daten.
- Das Muster der Verstrichen-Zeit «dd:hh:mm:ss» in dieser Liste (siehe Entscheid).

## Selbst entschieden
- Ursache der sechs «Scott Scale Tagestour 8.10.»: Noahs Backup vom 23.11. zeigt fünf Touren, am 8.10. zwischen 05:48 und 13:43 angelegt, alle mit Rückblick. Es sind die ersten Tagesfahrt-Versuche, vor der Regel, dass ein gleicher Name «(2)» bekommt (`freeTitle`, heute in `dayRidePlan`). Ein Import-Fehler ist es nicht; der heutige Weg vergibt neue Namen eindeutig. Deshalb gibt es keine Korrektur im Import, nur das Aufräumen.
- «Doppelt» ist streng gefasst (Name, erster Tag, Länge, Velo), damit nie zwei verschiedene Fahrten vorgeschlagen werden. Geplante und fertige Touren zählen gleich.
- Zusammenlegen archiviert die Extras wie «Testdaten aufräumen» (`archivedAt`, `skipped`) und setzt ihren Rückblick auf «archiviert», damit nichts doppelt lernt. Dafür eigene Felder (`dupAt`, `dupOf`, `dupBefore`), nicht `tidiedAt`, damit «Testdaten aufräumen» und sein Rückgängig die Doppelten nicht mit zurückholen. Hochgeladene Fahrten einer Extra-Tour wandern zur bleibenden Tour (`dupFrom` merkt die alte).
- Lernpunkte (`learnings`) der Extras bleiben unverändert sichtbar.
- Beispiele werden nur auf dieser Seite ausgeblendet, nicht überall (Heute und Woche baut ein anderer Thread).
- Fertig-Regel: kein neuer Eintrag in `features.js`. Das Fenster ist ein Hilfsmittel der Seite Touren (wie «Testdaten aufräumen», das auch keinen Eintrag hat); der Einstieg ist die ruhige Zeile, die Beschreibung steht in `docs/app-stand.md` und im «Was ist neu». Leere Ansicht: «Keine doppelten Touren gefunden».
- Bei Datenänderung: erst mit Kopie von Noahs Backup vom 23.11. geprüft (nur lokal, nichts davon im Repo).

## Entscheide (eigene Datei `docs/decisions/touren-aufraeumen.md`)
- 23.11.2026: Doppelte nur vorschlagen; Zeitangabe «9 h 58 min»; Rückblick einmal oben; Beispiele ausblenden.

## Stand im Plan (roadmap.md / vorhaben.md)
- Gehört zu Ziel «Eine App, die mich im Alltag unterstützt» (Touren übersichtlich). Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Übersicht: unter «Mit Packliste» steht eine Zeile pro Tour; die Werte fehlen, bis du rechts den Pfeil tippst.
2. Die Zeile «n Touren sehen doppelt aus · Doppelte prüfen» öffnen: bei «Scott Scale Tagestour 8.10.» ist eine Tour als «Bleibt» vorgewählt. «Zusammenlegen» tippen, dann «Rückgängig» oder im Fenster «Wieder trennen».
3. «Jura-Runde (Beispiel)» und «Seerunde (Beispiel)» fehlen in der Liste; die Zeile darunter zeigt sie wieder.
4. Eine Tour mit langer Fahrt öffnen (Pfeil): «Verstrichen» steht als «9 h 58 min».
