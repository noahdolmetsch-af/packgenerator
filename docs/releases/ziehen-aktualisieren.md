# Zum Aktualisieren ziehen

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «b» (Paket D, Idee 10 «Ziehen zum Aktualisieren mit Velorad»; Thread «Durchgehen: offene Fragen einzeln»); Ziel 5 «Alltag»

## Was ist neu
- Auf **Heute**, ganz oben, am Touchscreen: Seite mit einem Finger nach unten ziehen. Ein kleines gezeichnetes Velorad (`src/lib/home/PullRefresh.svelte`) kommt mit herunter und dreht sich mit dem Finger. Ab etwa 64 Pixel Zug steht «Loslassen zum Aktualisieren».
- Beim Loslassen lädt die App das **Wetter** (Heimatort, erzwungen neu) und die **Strava-Fahrten** (nur mit Strava-Schlüssel auf diesem Gerät) frisch; das Rad dreht sich, mindestens 0,7 Sekunden, dann steht kurz «Auf dem neuesten Stand». Die Wetterkarten auf Heute lesen die neue Antwort sofort (`pg-refreshed`).
- Bei «Bewegung reduzieren» dreht sich das Rad nicht von selbst (es folgt nur dem Finger), die Texte sagen, was passiert.

## Was fällt weg oder rutscht tiefer
- nichts. Das Ziehen ist ein zusätzlicher Weg; «Jetzt holen» auf der Strava-Seite und «Neu laden» auf der Wetterseite bleiben.

## Selbst entschieden
- Nur am Touchscreen und nur auf Heute; am Computer gibt es das Ziehen nicht (dort bleiben die Knöpfe der Seiten).
- Es startet nicht, wenn die Seite nicht ganz oben ist, ein Fenster offen ist oder die Bewegung eher seitlich geht.
- Der Zug wird halbiert (Widerstand), damit der Finger ein Stück weit ziehen muss und nichts aus Versehen aktualisiert.
- Aktualisiert werden Wetter und Strava, wie in der Idee; weitere Quellen (Fitbit, Google) bleiben bei ihren Seiten.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket D «Laden, Leere und Wetter»: Idee 10 gebaut (14 in #776, 19 in #780, 15 in #782; 20 folgt).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Handy Heute öffnen, ganz nach oben scrollen, mit einem Finger nach unten ziehen: ein Velorad kommt herunter und dreht sich mit.
2. Loslassen, wenn «Loslassen zum Aktualisieren» steht: das Rad dreht sich, dann «Auf dem neuesten Stand».
3. Zu früh loslassen: das Rad geht wieder hoch, nichts wird geladen.
