# Live-Check: dem Offline-Speicher der App mehr Zeit geben

22.11.2026 · Auftrag: Live-Check-Fehlalarm #1390 (Thread «Prüfungen so einrichten, dass main grün bleibt»)

## Was ist neu
- Der Live-Check (`tests/e2e/live/live.spec.js`) wartet jetzt bis zu 3 Minuten (vorher 1) darauf, dass der Service-Worker der App im Netz aktiv ist, und bis zu 1 Minute (vorher 30 s) auf die Übernahme nach dem Neuladen.
- Befund: Beim ersten Start speichert die App alles für den Offline-Betrieb (rund 1440 Dateien, 27 MB). Auf dem GitHub-Rechner dauerte das in den grünen Läufen 27 bis 48 Sekunden; vier Läufe hintereinander (22.11. ab 02:22 UTC, nach 49dd8d4) brauchten länger als 60 Sekunden und meldeten einen Fehler. Auf einem lokalen Build ist der Service-Worker nach 8 Sekunden aktiv, die App selbst war in Ordnung.

## Was fällt weg oder rutscht tiefer
- nichts. Ein echter Fehler (Service-Worker wird nie aktiv) wird nach 3 statt 1 Minute gemeldet.

## Selbst entschieden
- Test-Zeit statt App ändern: die App ist offline-fähig, nur die Wartezeit des Tests war zu knapp. Dass der erste Start 27 MB lädt, gilt weiter (Tempo-Thema, nicht dieser PR).
- Keine «Was ist neu»-Datei, nichts Sichtbares.

## Prüfschritte (nach dem Merge)
1. Der nächste Live-Check nach dem Online-Gehen ist grün und das Issue «Live-Check: die App im Netz braucht Hilfe» (#1390) schliesst sich selbst.
