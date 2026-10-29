# Apple Health vom iPhone

PR #? · 27.10.2026 · Auftrag: Noah «4a» und «alles online bringen» (Thread «Geräte und Datenquellen»)

## Was ist neu
- Ich › Verbindungen: neue Karte **«Apple Health (iPhone)»** unter «Alte Fitbit-Daten», mit drei Schritten zum Export.
- Die Zip aus «Alle Gesundheitsdaten exportieren» (oder die export.xml) wird auf dem Gerät gelesen, auch wenn sie sehr gross ist (Stück für Stück entpackt). Vorschau: Tage mit Schlaf, Ruhepuls, HRV, Schritten, aktiven Kalorien, VO2max, Gewicht. «Übernehmen» schreibt die Tage in dieselbe Tabelle wie Fitbit (`healthDays`, `src: 'apple'`), «Rückgängig» stellt jeden Tag wieder her.
- `healthDays` kennt zwei neue Werte: `vo2max` und `weightKg`.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Schritte und aktive Kalorien: pro Tag die Quelle mit dem höchsten Wert (iPhone und Watch zählen sonst doppelt).
- Schlaf zählt zum Aufwach-Tag; Schlaf, der nach 14 Uhr endet, gilt als Nickerchen und fällt weg; pro Nacht die Quelle mit am meisten Schlaf.
- Apple misst HRV als SDNN, Fitbit als RMSSD. Beides landet in `hrvMs`; die Zeile trägt `src: 'apple'`.
- Trainings (Workouts) werden nur gezählt; sie kommen in einem eigenen Schritt in den Aktiv-Verlauf.
- Tage mit Fitbit-Werten nehmen beim Übernehmen die Apple-Werte (Rückgängig möglich).

## Entscheide (für decisions.md)
- 27.10.2026: Apple Health über die Export-Datei (Web-App kann Apple Health nicht direkt lesen, eigene iPhone-App kostet 99 USD pro Jahr).

## Stand im Plan (roadmap.md / vorhaben.md)
- Geräte und Datenquellen: Schritt 3 von 5. Danach Google pro Person, Plan Samsung/Polar/Oura/Garmin Connect, Apple-Trainings.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbindungen: unter «Alte Fitbit-Daten» steht «Apple Health (iPhone)» mit drei Schritten.
2. Ohne iPhone: Heute und Aktiv zeigen deine Fitbit-Werte wie vorher.
