# VO2max in deinen Körperwerten

PR #… · 28.10.2026 · Auftrag: Noah «haben wir sichergestellt, das Vo2max und andere wichtige Kennzahlen im Front End auch an sinnvollen Stellen angezeigt werden?» (Thread «Geräte und Datenquellen», weitergegeben an Aktiv)

## Was ist neu
- Körperwerte › Körper hat einen neuen Reiter «VO2max» (zwischen Gewicht und Wasser): Linie pro Tag, im Jahr der Mittelwert pro Monat, Mittelwert und tiefster bis höchster Wert.
- Der Wert kommt aus `healthDays.vo2max`: von Fitbit (Analyse-PR «Alle Werte») oder aus dem Apple-Health-Export (#327). Die Seite sagt, woher er kommt; ohne Wert steht dort, wo man ihn holt.
- Direkt aufrufbar: `#/flow/stats/vo2max`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Reiter Wasser, Gefühlt und Bereitschaft rücken in der Gruppe «Körper» einen Platz nach rechts.

## Selbst entschieden
- Gruppe «Körper» statt «Herz»: VO2max beschreibt die Fitness, und «Herz» hat am Handy schon fünf Reiter.
- Nur Werte über 0 zählen (ein leerer Tag ist kein VO2max von 0).
- Nur zum Anschauen, keine Bewertung (wie alle Gesundheitswerte).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Aktiv zeigt neue Datenquellen: VO2max sichtbar in Körperwerte. Offen: TSS und Trainingseffekt vom Gerät in Form und Fahrtenliste (wartet auf Noahs Antwort «1a/1b»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Auswerten › Körperwerte, tippe auf «Körper» und dann auf «VO2max».
2. Wechsle auf «1 J»: jeder Monat zeigt den Mittelwert seiner Tage; ohne Wert sagt die Seite, woher er kommt.
