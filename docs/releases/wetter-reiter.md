# Die Wetterseite in vier Teilen

PR · 04.11.2026 · Auftrag: Noah «5 alle» (Thread «Plane die Wetterseite neu»)

## Was ist neu
- Unter dem Ortsfeld vier Reiter: **Jetzt** (Heute, Die nächsten Stunden, Zürisee, Luft und Pollen), **Radar und Kameras** (Regenstreifen, Landi-Regenradar, SRF-Webcams, Meine Webcams), **Planen** (Bestes Zeitfenster, Orte vergleichen, Klima weit voraus), **Rückblick** (Prognose gegen Wirklichkeit, Wie war es draussen?).
- Die Adresse kann einen Teil nennen (`#/wetter?tab=radar`); sonst öffnet die Seite immer auf «Jetzt» (Noah «3b»).
- Den Ort wählt man nur in «Jetzt» (Noah «2b»). In den anderen Reitern steht oben der Ortsname mit «Ort ändern», das zu «Jetzt» führt.

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Alles rutscht in einen Reiter: Bestes Zeitfenster, Orte vergleichen und Klima gehen von «lange Seite» nach «Planen»; Prognose gegen Wirklichkeit und «Wie war es draussen?» nach «Rückblick»; Webcams und Fenster nach «Radar und Kameras». Der Weg dorthin ist ein Tipp auf den Reiter.

## Selbst entschieden
- Noah «1a 2b 3b»: Zürisee und Luft in «Jetzt»; Ort nur in «Jetzt»; die Seite öffnet immer auf «Jetzt».
- Die Adressen von «Meine Webcams» und «Webcams auf der Live-Karte» zeigen auf `?tab=radar`.
- Keine neue Funktion: `f.weather` bleibt; `docs/app-stand.md` braucht keine neue Zeile.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetterseite neu: PR 2 von 4 (Reiter).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Wetter öffnen: unter dem Ort vier Reiter, «Jetzt» ist gewählt.
2. «Radar und Kameras» antippen: Regenstreifen, Landi, SRF und Meine Webcams.
3. In «Radar und Kameras» steht der Ortsname mit «Ort ändern»; ein Tipp führt zu «Jetzt», wo man den Ort wählt.
