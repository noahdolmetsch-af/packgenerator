# Abendblick: was hast du heute nicht gebraucht?

PR (G2) · 23.11.2026 · Auftrag: Noah «G1 G2 G3» (Thread «Packen leichter und besser machen»)

## Was ist neu
- Unterwegs steht bei einer Tour über mehrere Tage unter «Abend» die zugeklappte Zeile **«Abendblick»** (bis zum Abend vor dem letzten Tag). Ein Tipp auf ein Teil sagt «Nicht gebraucht», ein zweiter «Kaputt», ein dritter wieder «Gebraucht». Was du nicht anfasst, zählt als gebraucht, wie überall in der App.
- Eine Zeile nennt, wie viele Teile und wie viele Gramm bis jetzt nicht gebraucht wurden («Bis jetzt nicht gebraucht: 3 Teile · 640 g»), damit du auch entscheiden kannst, was du nach Hause schickst oder unterwegs lässt.
- Darunter «Was hat gefehlt?»: ein Teil aufschreiben (Hinzufügen, mit × und «Rückgängig» wieder herausnehmen).
- Es sind **dieselben Marken wie im Rückblick** und auf der Tour-Seite (`debrief.items`, `debrief.missing`). Der Rückblick nach der Tour ist deshalb schon ausgefüllt; «Meist vergessen» und die Ballast-Liste lernen aus dem Moment und nicht aus der Erinnerung nach Tagen.
- Code: `src/lib/unterwegs/Abendblick.svelte`, Regeln `src/lib/unterwegs/abendblick.js`, Tests `tests/abendblick.test.js` und `tests/e2e/abendblick.spec.js`; die Zeile hängt in `src/pages/Ride.svelte` unter «Abend».

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zeile kommt dazu, zugeklappt, unter dem bestehenden «Abend»; nichts darüber ändert sich. Die Marken gibt es weiter auf der Tour-Seite.

## Selbst entschieden
- Der Abendblick fragt nach dem, was du **nicht** gebraucht hast (Ausnahmen antippen), nicht nach allem: so passt er zu den Marken, die es schon gibt (kein Eintrag = gebraucht), und kostet 30 Sekunden statt 40 Tipps.
- Die Zeile steht nur dort, wo es einen Abend gibt (Tour über mehrere Tage, bis zum Abend vor dem letzten Tag; `hasEvening` in `src/lib/blockplan.js`). Am letzten Abend kommt der Rückblick selbst.
- Essen und Trinken fehlt in der Liste: es hat sein eigenes Zählen («Verbrauch») und seine eigene Zeile im Rückblick.
- Die Liste zeigt zuerst, was du markiert hast, dann alles übrige nach Namen. Gruppiert nach Tasche ist sie nicht; das folgt nur auf Wunsch.
- «Morgen kannst du es noch ändern»: ein Teil, das heute nicht gebraucht wurde (Regenjacke), darf morgen wieder «Gebraucht» werden.
- Keine eigene Funktionsseite, kein Eintrag in `features.js` (die Zeile gehört zu Unterwegs); die Zeile «Unterwegs-Übersicht» in `docs/app-stand.md` ist ergänzt, das neue Wort steht in `docs/namen.md`.

## Daten
- Kein neues Feld, kein neues Schema: der Abendblick schreibt in den Rückblick-Eintrag der Tour (`debriefs`), genau wie die Tour-Seite. Neu ist nur, dass das schon während der Tour geschieht; der Rückblick-Eintrag bleibt «Entwurf», bis du ihn abschliesst.

## Entscheide
- Keine eigene Datei: es wurde nichts entschieden, was später noch gilt.

## Stand im Plan (roadmap.md / vorhaben.md)
- Packen leichter und besser: G1 «Dazu nötig» (PR 1575), G2 «Abendblick» gebaut. G3 «Griffbereit» folgt und braucht die Marken aus G2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unterwegs eine Tour über mehrere Tage öffnen, «Abend», dann «Abendblick» aufklappen.
2. Ein Teil antippen: «Nicht gebraucht»; die Zeile oben sagt «Bis jetzt nicht gebraucht: 1 Teil · … g». Nochmal: «Kaputt». Nochmal: «Gebraucht».
3. Unter «Was hat gefehlt?» etwas aufschreiben; nach der Tour zeigt der Rückblick diese Marken schon.
