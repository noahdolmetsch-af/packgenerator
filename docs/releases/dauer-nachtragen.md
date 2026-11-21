# Dauer nachtragen

21.11.2026 · Auftrag: Sportjahr S12 (Noahs Entscheid 2b: Schätzung «ca.» mit üblicher Dauer; Noah 21.11.2026: Tourtage ohne Strava-Zeit und ohne Minuten-Haken bekommen keine Schätzung, sondern kommen in diese Liste)

## Was ist neu
- Ein neuer Block «Dauer nachtragen» in «Meine Aktivitäten», unter «Übliche Dauer». Er zeigt die Haken, die keine gemessene Zeit haben (die Auswertung rechnet dort mit der üblichen Dauer und schreibt «ca.»), die neuesten zuerst, sechs auf einmal, «Alle zeigen» für den Rest.
- Ein Tipp auf 15, 30, 45 oder 60 Min oder eine eigene Zahl (Feld «Eigene Länge») schreibt die Minuten in den Haken. Danach zählt die Zeit als gemessen und der Haken verlässt die Liste. «Rückgängig» nimmt die Minuten wieder weg.
- Es werden nur Haken von Hand, mit Timer oder aus dem Plan angeboten. Nicht angeboten werden: Strava-Haken (die Zeit kommt von Strava), gezählte Mengen (Liegestütze) und der Arbeitsweg.
- Keine neue Einstellung, kein Schema-Wechsel: geschrieben wird nur das Feld `min` im Haken, wie bei den Dauer-Knöpfen auf «Geschafft». Neue Dateien `src/lib/flow/nachtragen.js`, `src/lib/flow/DauerNachtragen.svelte`; Tests `tests/nachtragen.test.js`, `tests/e2e/nachtragen.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Der Block ist neu und eingeklappt; er erscheint nur, wenn es Haken ohne gemessene Zeit gibt.

## Selbst entschieden
- **Ort:** in «Meine Aktivitäten» neben «Übliche Dauer», nicht auf der Seite Sportjahr (dort arbeitet der Diagramm-Thread). Ein Link vom Hinweis «Für n Einheiten ist die Zeit geschätzt» im Sportjahr auf diese Liste folgt, sobald dieser Thread die Seite freigibt (Absprung).
- **Tourtage ohne Haken und ohne Strava-Zeit** (Noahs Entscheid) sind noch nicht in der Liste: sie sind keine Haken, sondern berechnete Tage aus den Touren. Wie die Dauer dort gespeichert wird (Vorschlag: eine eigene Einstellung `sport.tourMin`, die im Backup mitgeht und die Haken nicht doppelt zählt), kommt als eigener kleiner PR mit Einzelfreigabe.
- **Keine neue Funktion im Katalog** (Teil von «Meine Aktivitäten», app-stand-Zeile ergänzt).

## Entscheide (für decisions.md)
- Haken ohne Minuten lassen sich mit einem Tipp nachtragen; danach zählt die Zeit als gemessen (Noah 21.11.2026, Entscheid 2b).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr S12 gebaut (Haken); Tourtage-Teil offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Aktivitäten › «Dauer nachtragen» öffnen: die Haken ohne gemessene Zeit stehen da, neueste zuerst.
2. Bei einem Haken «30 Min» tippen: er verlässt die Liste, in Sportjahr zählt er als gemessen. «Rückgängig» bringt ihn zurück.
