# VO2max auf Heute

PR #<Nummer> · 28.10.2026 · Auftrag: Noah «2 a und b» (VO2max in Analyse/Körperwerte und als Kachel auf Heute; Thread «Geräte und Datenquellen», gebaut im Thread «Heute ruhiger»)

## Was ist neu
- Neue Kachel «VO2max» im Bereich «Dein Körper» auf Heute: der letzte Wert (ml/kg/min) von Fitbit oder Apple Health, sein Tag und die Veränderung zum Wert von etwa vier Wochen davor.
- «Verlauf» öffnet Körperwerte › VO2max.
- Ohne Wert in den letzten 90 Tagen bleibt die Kachel weg. Unter «Startseite anpassen» lässt sie sich wie jede Kachel verschieben, vergrössern oder entfernen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kachel kommt einmal neu auf jede gespeicherte Startseite (nach «Dein Körper heute» und «Aktiv heute»); wer sie entfernt, dem bleibt sie weg.

## Selbst entschieden
- Nur anschauen, keine Farbe für gut oder schlecht (wie «Körperwerte»).
- Vergleich mit dem letzten Wert, der mindestens 28 Tage älter ist; VO2max ändert sich langsam.
- Werte älter als 90 Tage zählen nicht mehr.
- Auf einem neuen Gerät ohne Velo und Tour zeigt Heute die Kachel trotzdem, sobald ein VO2max-Wert da ist (wie «Dein Körper»).

## Entscheide (für decisions.md)
- 28.10.2026: VO2max als eigene ruhige Kachel auf Heute, nur mit Wert (Noah «2 a und b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: VO2max ist auf Heute sichtbar, der Verlauf in Körperwerte.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Heute und scrolle zu «Dein Körper»: die Kachel «VO2max» zeigt eine Zahl in ml/kg/min mit ihrem Tag (nur wenn Fitbit oder Apple Health schon einen Wert geliefert hat).
2. Tippe «Verlauf»: Körperwerte öffnet sich mit dem Reiter VO2max.
