# Fitbit-Trainings als Vorschlag («Zählen?»)

21.11.2026 · Auftrag: Noah «1a dann b dann alle anderen 2a 3a 4a 5a» (Thread «Bauen: Sportjahr und Auswertung aller Sportarten», Auftrag K4)

## Was ist neu
- **Karte «Zählen?»** in «Meine Aktivitäten», wenn die Uhr Trainings kennt (Tennis, Eishockey, Laufband …), die noch keinen Haken haben. Pro Sportart eine Gruppe, neueste zuerst, je Training Datum, Startzeit, Minuten und Puls.
- **«Zählen»** legt den Haken mit den **Minuten des Trainings** an (Quelle Fitbit, `via: 'fitbit'`, gilt als gemessen), mit Rückgängig. **«Nicht zählen»** lässt es für immer weg (auch mit Rückgängig). **«Alle zählen»** macht eine ganze Sportart auf einmal. **Nie still**: ohne dein Tippen entsteht nichts.
- **«Gehen» wird nicht gefragt** (bleibt draussen).
- **Keine Doppelten:** nicht gefragt wird, wenn dieselbe Sportart am selben Tag schon einen Haken hat, wenn Strava am selben Tag eine Aktivität zu ähnlicher Zeit kennt (±30 Minuten; ohne Uhrzeit gilt sie als dieselbe Einheit) oder wenn ein Fitbit-Haken aus dem Datei-Import innerhalb 2 Minuten liegt.
- Es werden die letzten 90 Tage angeboten (so weit reicht, was die App von Fitbit hält). Trainings unter 5 Minuten und unbekannte Arten werden nicht gefragt. Die Zuordnung Training → Sportart nutzt die bestehende Tabelle des Fitbit-Datei-Imports (`fitbitexport.js`), Name und Typ.
- Neue Einstellung `fitbit.ticked` (die schon beantworteten Trainings, im Backup, kein Schema-Wechsel). Neue Dateien `src/lib/flow/fitbittraining.js` (rein, Tests `tests/fitbittraining.test.js`), `FitbitZaehlen.svelte`; `tests/e2e/fitbit-zaehlen.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte steht in «Meine Aktivitäten» unter «Aktivitäten aus Strava ohne Sportart» und erscheint nur, wenn es etwas zu fragen gibt.

## Selbst entschieden
- **Eine Einheit pro Sportart und Tag**, wie bei Strava: Hat «Tennis» an dem Tag schon einen Haken (von Hand, Strava, Fitbit), wird ein zweites Tennis-Training nicht gefragt. Ein zweites Training am selben Tag lässt sich mit der Hand abhaken.
- **«Nicht zählen» merkt sich das Training**, auch nach «Zählen» und dem späteren Löschen des Hakens kommt es nicht zurück (wie bei Strava, `fitbit.ticked`).
- **Nur Sportarten, die du schon hast:** gibt es keine passende Aktivität (oder sie pausiert), wird nicht gefragt; «Aktivität anlegen?» gilt nur für Strava.
- **Quellenanzeige:** der Haken heisst in den Auswertungen wie bisher «von Hand» (`quelleOf` kennt `fitbit` nicht; das ändert den Datei-Import nicht). Wenn du «Fitbit» als eigene Quelle sehen willst, ist das ein eigener kleiner PR.
- **Fertig-Regel:** Teil von «Meine Aktivitäten» (Seite und app-stand-Zeile bestehen), der Absprung ist die Karte dort, Leerzustand = die Karte fehlt.

## Entscheide (eigene Datei `docs/decisions/fitbit-zaehlen.md`)
- 21.11.2026: Fitbit-Trainings wie Strava erst als Vorschlag «Zählen?», nie still; «Gehen» bleibt draussen (Noah «alle anderen 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere Auswertungen: K4 gebaut (unabhängig von K1 bis K3). Einzelfreigabe, weil die App in `flowLog` schreibt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Aktivitäten: die Karte «Zählen?» (falls deine Uhr Trainings ohne Haken kennt).
2. «Zählen» bei einem Training tippen: es steht danach mit seinen Minuten im Verlauf der Sportart. «Rückgängig» nimmt es zurück.
