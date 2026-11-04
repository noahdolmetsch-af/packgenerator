# Tacho-Ziffern

PR folgt · 03.11.2026 · Auftrag: Noah «b» (alle 5 Ideen von «Paket C: Das Velo lebt»; Thread «Durchgehen: offene Fragen einzeln»), Idee 12

## Was ist neu
- Die km eines Velos rollen beim Erscheinen hoch wie bei einem alten Velotacho (rund eine Sekunde, die rechten Ziffern zuerst), dann steht die Zahl ruhig.
- Zu sehen auf der Velo-Karte unter Velos und unter dem Namen auf der Pflegeseite eines Velos.
- Neuer Baustein `src/lib/ui/Odometer.svelte`, später auch für andere Zahlen nutzbar.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zahl steht am gleichen Ort im gleichen Format.

## Selbst entschieden
- Die echten Ziffern bleiben im Text (Vorlesen, Kopieren, Tests); gerollt wird mit erzeugtem Inhalt darüber.
- Es rollt nur beim Erscheinen, nicht bei jeder späteren Änderung der Zahl.
- Bei «Bewegung reduzieren» am Gerät gibt es keine Bewegung (die Zahl steht sofort).
- Nur Velo-Karte und Pflegeseite (kleine PRs); Heute und Aktiv bleiben, wie sie sind.
- Keine neue Funktion im Sinn der Fertig-Regel, daher kein `features.js`-Eintrag.
- `docs/app-stand.md` liegt noch nicht in `main`; die Zeile kommt dazu, sobald die Datei da ist.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Neuer Schwung» / Velo-Momente: Idee 12 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen: die km auf der Karte rollen etwa eine Sekunde hoch.
2. Die Pflegeseite eines Velos öffnen: dort rollen die km auch.
3. «Bewegung reduzieren» am Gerät einschalten und neu laden: die Zahl steht still.
