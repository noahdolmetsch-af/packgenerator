# Auswerten › Fahrten: «Challenges» neben «Meilensteine», «Erkenntnisse» weiter vorn

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «K1–K9 …» (Sitemap, 24.11.2026 01:06), Punkte K4 und K5, Teil «Auswerten»

Ziele von Noah (23.11.2026): **Klarheit** (die Tagesziele stehen dort, wo man auswertet) und **Auffindbarkeit** (Challenges und Erkenntnisse sind früher erreichbar). Leitfaden `docs/leitfaden.md`: «Eine App, die mich im Alltag unterstützt».

## Was ist neu
- Chip «Challenges» im Reiter «Fahrten» direkt hinter «Meilensteine» (`#/flow/challenges`, Adresse unverändert). Die Seite gehört jetzt zum Ort «Auswerten» und «Auswerten» bleibt hell, wenn man sie öffnet.
- Chip «Erkenntnisse» (`#/gelernt`) steht vom letzten Platz an dritter Stelle, hinter «Antworten ausgewertet».

## Was fällt weg oder rutscht tiefer
- nichts fällt weg. «Challenges ›» oben auf Meilensteine bleibt. «Heatmap», «Neuland», «Gipfelbuch» und «Jahr» rutschen je einen Chip nach hinten (neue Reihenfolge: Fahrten, Antworten ausgewertet, Erkenntnisse, Meilensteine, Challenges, Heatmap, Neuland, Gipfelbuch, Jahr).

## Selbst entschieden
- Reihenfolge und Orte wie im Auftrag (`PLACE_TABS.analysis` in `src/lib/nav.js`); der dritte Eingang zu den Erkenntnissen in «Ich» ist Sache des Ich-Threads.
- Kein Daten-, Backup- oder `api/`-Eingriff.

## Entscheide
- Noah 24.11.2026 («K4», «K5» im Sitemap-Auftrag).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sitemap-Auftrag: Teil «Auswerten» gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Fahrten: Chips lesen Fahrten, Antworten ausgewertet, Erkenntnisse, Meilensteine, Challenges, Heatmap …
2. «Challenges» antippen: die Seite öffnet sich, «Auswerten» bleibt hell.
3. «Erkenntnisse» antippen: Monats- und Jahresrückblick öffnet sich.
