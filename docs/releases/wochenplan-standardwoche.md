# Standardwoche im Wochenplan

PR #NNNN · 26.11.2026 · Auftrag: Noah «1a, Wunsch- und Fix-Plätze pro Sportart, 3a, 5b» und «nichts doppeltes» (Thread «Wochenplan-Vorschläge verlässlich machen»)

## Was ist neu
- Training › Wochenplan hat zwei Reiter: «Woche» (der Vorschlag dieser und der nächsten Woche, wie bisher) und «Standardwoche» (deine normale Woche).
- «Standardwoche»: am Handy eine Tageliste Mo bis So, am Computer ein Raster Tage × Morgen/Tag/Abend (`src/lib/training/StandardWeek.svelte`). Jeder Platz ist **Fix** (Schloss: die Einheit steht dort), **Wunsch** (Herz: die Einheit geht dorthin, wenn der Platz frei ist) oder **von der App gewählt** (gestrichelt). Darüber stehen die Stunden («Plan: 15 Std von 15 Std») und pro Art von Einheit «Gym 2 / 2» mit grünem oder gelbem Rand; «Die Woche hält deine Ziele.» erscheint, wenn alles stimmt.
- Tipp auf einen Platz öffnet ein Fenster (`StandardSlotSheet.svelte`): Fix oder Wunsch, Tag (sieben Knöpfe), Zeit (Morgen, Mittag, Nachmittag, Abend oder genaue Startzeit), «Entfernen», «Fertig» im Fuss. Das «+» an jedem Tag legt einen neuen Platz an, mit Wahl der Art. Am Computer lässt sich ein Platz auf einen anderen Tag und Tagesabschnitt ziehen; hat die Art dort schon einen Platz, sagt eine Zeile es und nichts ändert sich. Alles hat «Rückgängig».
- Wünsche haben eine Reihenfolge: Eishockey «Sonntag 08:00, sonst Samstag 08:00». Passt kein Wunsch (besetzt, freier Tag von TrainingPeaks, Skitour), nimmt der Plan den besten anderen Platz und sagt es unter «Was der Plan selbst angepasst hat».
- Was du in einer Woche verschoben hast, kommt in den folgenden Wochen wieder (bis 6 Wochen, solange du es nicht wieder verschiebst): die Einheit trägt «wie letzte Woche», eine Zeile über den Tagen nennt die Anzahl und hat «Zurück zur Standardwoche». Heute («Jetzt dran»), Geschafft, Mein Tag und Mein Trainingsplan sehen dieselbe Zeit (`weekPins` in `wochenlog.js`).
- Die Karte «Einheiten pro Woche» zählt nur noch (Plus und Minus); unter jeder Art steht, welche Plätze sie hat («Mi 16:00 · Fix», «Sa 08:00 · Wunsch»).
- Planer: `wishes` im Ziel-Setting `training.weekplan` (alte Sicherungen laden unverändert), `setSlot`, `removeSlot`, `moveSlot`, `slotsOf` und der Wunsch-Schritt in `planWeek`; im Wochenstand (`training.weeklog`) ein neuer Schlüssel `std` unter `mode` («zurück zur Standardwoche»).

## Was fällt weg oder rutscht tiefer
- Die «Fixtage»-Reihe mit sieben Tages-Knöpfen und die Startzeit-Auswahl in der Karte «Einheiten pro Woche» sind in die Standardwoche umgezogen (ein Platz in der Standardwoche ersetzt beides, mit Wunsch dazu). Nichts geht verloren: dieselben Fixtage stehen als «Fix»-Plätze dort.
- Die Ziel-Karten (Stunden, «Einheiten pro Woche») stehen im Reiter «Standardwoche» unter der Übersicht; die Karten der laufenden Woche (Art der Woche, Fortschritt, Tage) im Reiter «Woche».

## Selbst entschieden
- Ein Reiter «Standardwoche» im Wochenplan statt einer neuen Seite (Noah: nichts doppeltes). Die Ansicht lässt sich mit `#/flow/wochenplan?view=std` öffnen.
- Ziehen nur am Computer (Handy: Tipp und Fenster mit Tageknöpfen, ein Tipp pro Tag; wenige Klicks).
- Die Anzahl pro Art bleibt eine feste Zahl, kein Bereich («2–3 Gym»): Noah sagte nur «Sollwerte werden mitberücksichtigt».
- Keine Notiz pro Platz («zu zweit»): nicht gewünscht in den Antworten, und Namen von Personen gehören nicht in die App.
- Die ältere Logik von «Woche vorschlagen» ohne gespeicherten Wochenplan (`SuggestWeek.svelte`) bleibt stehen: sie hält Tageslimits und Gewohnheiten, die sonst nirgends zu ändern sind; mit gespeichertem Wochenplan ist sie nie sichtbar. Entfernen als eigener Schritt, wenn Noah es will.
- Die Übernahme von der Vorwoche gilt bis 6 Wochen; wer in dieser Zeit nichts verschiebt, sieht sie verfallen.
- Fertig-Regel: Seite und Absprung bleiben die des Wochenplans (`f.wochenplan`, Training › Wochenplan, «Passt hier»); kein neues Feature, darum kein Eintrag in `features.js`/`moment.js`. «Gut zu wissen» (`src/lib/wissen`) und Leerzustand sind die des Wochenplans; die Standardwoche hat einen eigenen Hinweis (Antippen und Ziehen).

## Entscheide (eigene Datei `docs/decisions/wochenplan-standardwoche.md`)
- 26.11.2026: Standardwoche als Ansicht des Wochenplans, Fix- und Wunsch-Plätze, automatische Übernahme von der Vorwoche, alles in einem Paket (Noah).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Wochenplan-Vorschläge verlässlich machen»: Standardwoche mit Fix- und Wunsch-Plätzen und Übernahme erledigt. Offen: «Meine Wochenziele» (zum Beispiel 10 Std.) und das Ziel des Wochenplans (zum Beispiel 15 Std.) sind zwei getrennte Ziele; die ältere «Woche vorschlagen»-Logik ohne Wochenplan.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Wochenplan › «Standardwoche»: dein Eishockey am Sonntag antippen, «Wunsch» wählen, Samstag wählen, «Fertig». Unter «Woche» steht das Eishockey am Samstagmorgen.
2. Unter «Woche» ein Gym verschieben, dann «Nächste Woche»: es steht wieder dort, mit «wie letzte Woche». «Zurück zur Standardwoche» tippen: es ist wieder am Standardplatz.
