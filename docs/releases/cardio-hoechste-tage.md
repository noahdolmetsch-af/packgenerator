# Höchste Tage, mit Namen

Auftrag: Noah «1a 2a 3a 4a 5b und alle A-F» 07.11.2026 (Thread «Cardio-Belastung: Ideen A–F bauen»), Idee E aus dem UI-Test der Analyse-Seite.

## Was ist neu
- Auf der Seite eines Werts (z. B. Cardio-Belastung) steht über «Pro Wochentag» die Karte «Höchste Tage»: die drei höchsten Tage des Zeitraums mit ihrem Wert. Unter jedem Tag steht, was an ihm erfasst wurde: die Tour, das Fitbit-Training, die Strava-Fahrt oder deine Haken («Alpenrunde · Morgenlauf, Yoga»). Ohne Eintrag steht «nichts erfasst».
- Ein Tipp auf einen Tag öffnet ihn mit allen Werten.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kachel «höchster» oben nennt weiter das Datum oder den Namen der Tour.

## Selbst entschieden
- Die Karte erscheint erst, wenn mindestens zwei Tage einen Wert über 0 haben, und nicht im Tagesbereich «T».
- Es zählen Tageswerte, auch wenn der Verlauf Wochenbalken zeigt.
- Die Namen kommen aus derselben Quelle wie die Spalte «Tag davor» (`src/lib/analyse/tagdavor.js`, aus dem PR «Der Tag davor, vollständig»), höchstens zwei, der Rest als «+1».
- Nur Anzeige: nichts wird bewertet.

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen A–F für Cardio-Belastung: E gebaut (nutzt die Namen aus F «Am Tag davor», die jetzt auf main sind).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Analyse › Cardio-Belastung: die Karte «Höchste Tage» über «Pro Wochentag».
2. Unter den Tagen stehen Tour, Training oder Fahrt des Tages.
3. Einen Tag tippen: er öffnet sich mit allen Werten.
