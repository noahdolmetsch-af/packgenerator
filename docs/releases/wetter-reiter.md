# Die Wetterseite in vier Teilen

PR · 04.11.2026 · Auftrag: Noah «5 alle» (Thread «Plane die Wetterseite neu»)

## Was ist neu
- Unter dem Ortsfeld vier Reiter: **Jetzt** (Heute, Die nächsten Stunden, Zürisee, Luft und Pollen), **Radar und Kameras** (Regenstreifen, Landi-Regenradar, SRF-Webcams, Meine Webcams), **Planen** (Bestes Zeitfenster, Orte vergleichen, Klima weit voraus), **Rückblick** (Prognose gegen Wirklichkeit, Wie war es draussen?).
- Die Adresse kann einen Teil nennen (`#/wetter?tab=radar`); sonst öffnet die Seite auf dem Teil, den man zuletzt gewählt hat, beim ersten Mal auf «Jetzt».

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Alles rutscht in einen Reiter: Bestes Zeitfenster, Orte vergleichen und Klima gehen von «lange Seite» nach «Planen»; Prognose gegen Wirklichkeit und «Wie war es draussen?» nach «Rückblick»; Webcams und Fenster nach «Radar und Kameras». Der Weg dorthin ist ein Tipp auf den Reiter.

## Selbst entschieden
- Die Fragen 1–3 (Zürisee und Luft in «Jetzt», Ort oben über allen Reitern, Reiter merken) sind mit ★ gebaut, bis Noah anders antwortet.
- Die Adressen von «Meine Webcams» und «Webcams auf der Live-Karte» zeigen auf `?tab=radar`.
- Der gemerkte Reiter liegt nur in diesem Browser (`localStorage`), nicht im Abgleich.
- Keine neue Funktion: `f.weather` bleibt; `docs/app-stand.md` braucht keine neue Zeile.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetterseite neu: PR 2 von 4 (Reiter).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen: unter dem Ort vier Reiter, «Jetzt» ist gewählt.
2. «Radar und Kameras» antippen: Regenstreifen, Landi, SRF und Meine Webcams.
3. «Rückblick» wählen, Seite neu öffnen: sie öffnet auf «Rückblick».
