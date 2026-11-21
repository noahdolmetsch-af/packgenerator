# Indoor- und Zwift-Fahrten fallen auf

Auftrag: Noah «1a 2b 3a 4a 5b» (Thread «Bauen: TrainingPeaks-Plan und Zwift»), Schritt P3. Kein Server, keine neue Schnittstelle: Zwift kommt über Strava (3a).

## Was ist neu
- Training › Aktivitäten: eine Fahrt auf der Rolle oder in Zwift trägt unter dem Namen «Indoor / Zwift». Als Indoor-Fahrt zählt: Strava-Flag «trainer», Typ VirtualRide oder «Zwift» im Namen. Nur Fahrten; ein Lauf auf dem Laufband behält seine eigenen Worte.
- Im Filter gibt es einen Knopf «Indoor / Zwift» mit der Zahl; er zeigt nur diese Fahrten und kombiniert sich mit Art und Monat. Er steht nur da, wenn es solche Fahrten gibt.
- Auf der Seite einer Fahrt steht «Indoor / Zwift» unter den Angaben (vorher «Indoor» nur beim Strava-Flag).
- Watt, NP, TSS und Zonen zeigt die App schon; dafür war nichts neu.
- Ältere Zwift-Fahrten: «Fahrten importieren» erklärt, wie man die FIT-Datei aus Zwift holt (my.zwift.com › Fahrt › «FIT-Datei laden»). Eine FIT-Datei ohne Position (Indoor) wird gelesen: Tag, km, Typ «Virtual Ride», Gerät «Zwift» statt «Unit 0». Die Routenanalyse sagt bei so einer Datei klar «keine Positionen», statt «keine Zeiten».
- «Passt hier» am Ende von Training › Aktivitäten: «Fahrten importieren» und «TrainingPeaks-Plan».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Geschafft» (Thread «Training erfassen») ist noch nicht online; das Wort kommt dort mit, sobald die Seite steht (`isIndoorBike` ist dafür da).
- Das Label ist ein einziges Wort für Rolle und Zwift, weil Strava beides gleich meldet.
- Keine neue Funktion im Katalog, darum keine neue Zeile in `features.js`; die Zeile in `docs/app-stand.md` steht bei «Training».
- Die erfundene Zwift-FIT-Datei im Test hat keine Position (Hersteller 260, Untertyp 58): echte Zwift-Dateien konnte ich nicht prüfen, sie liegen nicht im Repo.

## Entscheide (für decisions.md)
- 19.11.2026: Indoor und Zwift heissen in der App «Indoor / Zwift»; Zwift bleibt über Strava, ohne eigene Schnittstelle (Noah «3a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks-Plan und Zwift: P1 bis P3 fertig; P4 Plan gegen Fahrt folgt nach «Geschafft».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Aktivitäten: eine Zwift-Fahrt trägt «Indoor / Zwift».
2. Der Knopf «Indoor / Zwift» zeigt nur diese Fahrten.
3. Velos › Pflege › Fahrten importieren: der Hinweis zu Zwift steht über der Dateiauswahl.
