# «Wie war's?» als Liste, mit Rückgängig; Fitbit-Antworten zählen in Auswerten

27.11.2026 · Auftrag: Noah «1a 2a 3b» (Thread «Wie war's? nach Fitbit-Aktivität reparieren»)

- Anlass: Die Karte zeigte immer nur ein Training; nach dem Tippen kam sofort das nächste und sah fast gleich aus, die Karte wirkte, als reagiere sie nicht. Die Fitbit-Antworten (`training.healthfeel`) las ausserdem nirgends etwas.
- 1a: Fitbit-Antworten zählen wie die zu Strava. Umgesetzt in Auswerten bei «Gefühlte Anstrengung der Fahrten» (`fitFeelByDay`, Rad-Trainings der Uhr). Der Wochenplan-Vergleich kennt nur Strava-Aktivitäten und Haken; Fitbit-Trainings sind dort keine Aktivitäten (eigenes, grösseres Paket, falls gewünscht).
- 2a: Nach jeder Antwort steht 8 Sekunden «Gespeichert: …» mit «Rückgängig» (`offerDone`); gilt auch für «Später».
- 3b: Alle offenen Trainings als kleine Liste auf einmal. Selbst entschieden: zuerst 3 Zeilen, der Rest hinter «n weitere zeigen» (sonst ist die Karte höher als der Bildschirm und der Inhalt rutscht nach unten, «Inhalt zuerst»).
