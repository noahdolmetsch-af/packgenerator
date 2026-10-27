# Zahlen mit Zeitraum

PR #? · 27.10.2026 · Auftrag: Noah 26.10.2026 20:31 «1a» alle B-Fehler aus dem UI-Test 0.205 (Thread «Testen komplette App mit Fehlerliste»)

## Was ist neu
- Der Kopf von Touren (pages/Trips.svelte) sagt «{n} geplant · {n} gefahren in 12 Monaten · {n} warten auf deinen Rückblick» statt «in 12 Monaten: … abgeschlossen · … bewertet».
- Die Karte «Fahrten aus Strava» nennt Zeitraum und Total; die Heatmap-Summe sagt «in allen Jahren» oder das Jahr.
- Listenzeilen nehmen km und Hm der verknüpften Strava-Fahrten (`withActs`) und zeigen «ohne Strecke» nur ohne Strecke. Kein Schema-Wechsel.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Der Status «Abgeschlossen» einer einzelnen Tour bleibt (Noahs TZ1-Entscheid); nur die Zählung im Kopf heisst «wartet auf deinen Rückblick».
- Die Strava-Karte zählt dieselben Zeilen wie die Liste «Fahrten».

## Entscheide (für decisions.md)
- 27.10.2026: Zahlen mit Zeitraum (UI-Test 0.205 T6), Noah «1a» alle B-Fehler.

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Test 0.205 (Ziel Alltag): T6 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne Touren: Unter dem Titel steht «… geplant · … gefahren in 12 Monaten · … warten auf deinen Rückblick».
2. Am Handy nennt «Fahrten aus Strava» den Zeitraum und das Total.
