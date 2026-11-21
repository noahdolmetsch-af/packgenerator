# Geplant und gemacht auf «Geschafft»

Auftrag: Noah «1a 2b 3a 4a 5b» (Thread «Bauen: TrainingPeaks-Plan und Zwift»), Schritt P4. «Geschafft» kam aus dem Thread «Training erfassen vereinfachen» (T1).

## Was ist neu
- Auf «Geschafft» steht neben dem, was du gemacht hast, die Einheit, die du für den Tag geplant hattest: «Geplant 60 Min, gemacht 62 Min · Zone 2 · aus TrainingPeaks». Es zählt die geplante Einheit desselben Tages und derselben Sportart (eine Strava-Fahrt passt über ihre Art, ein Haken einer eigenen Sportart über das Feld `sport` der Einheit). Passen mehrere, gilt die mit den nächsten Minuten.
- Noah 21.11.2026 «alles»: In «Diese Woche» steht dazu «Geplant 1:30 h, gemacht 1:02 h» (Summe der für die Woche geplanten Einheiten gegen die abgehakten Minuten; nur wenn für die Woche etwas geplant ist). Bei einer Strava-Fahrt mit Pulsdaten und einer Zone im Plan steht eine zweite Zeile «Geplant Zone 2, die meiste Zeit in Zone 3»: die Plan-Zone neben der Zone, in der die Fahrt die meiste Zeit war (mit den Zonen der App, `zones` in `src/lib/strava/zones.svelte.js`). `plannedWeek` und `zoneVsPlan` in `src/lib/flow/geschafft.js`.
- Nur beide Zahlen, nie «zu kurz» oder «im Ziel». Ohne geplante Einheit bleibt die Seite wie sie war; ohne gemessene Minuten steht nur «Geplant 60 Min».
- Keine neuen Daten, kein Dexie-Schema, kein `api/`: gelesen wird `training.plan` (`plannedFor` in `src/lib/flow/geschafft.js`).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Pulszone der Fahrt ist die Zone mit der meisten Zeit (Pulsverlauf aus Strava, Zonen wie überall in der App); ohne Pulsverlauf oder ohne Zone im Plan fehlt die Zeile. Es steht nur «Geplant Zone 2, die meiste Zeit in Zone 3», nie «zu hart».
- Die Belastungszahl (TSS) steht nicht dabei: TrainingPeaks liefert sie im Kalender-Link nicht mit (nur Titel, Dauer, Zone), und die App rechnet sie nicht selbst. Wenn Noah sie dennoch will, kommt sie als eigener Schritt.
- Die Zeile steht in der Karte «Dieses Mal» über dem Vergleich mit dem letzten Mal, in gleicher Schrift wie die Zählung.
- Kein eigener Absprung und keine neue Funktion in `features.js`: es ist eine Zeile auf einer bestehenden Seite (Fertig-Regel: Seite und App-Stand sind schon da, der Stand-Satz ist ergänzt).

## Entscheide (für decisions.md)
- 19.11.2026: Plan und Gemachtes werden auf «Geschafft» nebeneinander gezeigt, nur zum Anschauen (Noah «4a»).
- 21.11.2026: Dazu die Wochensumme geplant gegen gemacht und der Vergleich Plan-Zone gegen Pulszone (Noah «alles»), weiter ohne Bewertung.

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks-Plan und Zwift: P1 bis P4 fertig, sobald dieser PR online ist.
