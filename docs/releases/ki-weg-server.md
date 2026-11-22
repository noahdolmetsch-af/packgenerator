# Der Server fragt keine KI mehr

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 8). Berührt `api/`: Einzelfreigabe.

## Was ist neu
- `api/helper.js` und `api/_lib/helper.js` (Aufgaben für Claude und Gemini, Monatslimit, Guthaben-Marke) sind gelöscht. Kein Teil der App ruft sie mehr auf (Schritte 1 bis 7).
- Der Wächter (`api/_lib/health.js`) prüft nur noch Variablen, Speicher, Strava, Google, Abgleich, Erinnerungen und die Tagesgrenze. Die Prüfungen «anthropic», «ki-guthaben», «gemini» und «abend» fallen weg; die Liste der nötigen Variablen nennt nur noch Strava, Google und den Speicher.
- Die Tagesgrenze kennt die Funktion `helper` nicht mehr.
- Erinnerungen (`api/push.js`): der Besitzerschlüssel ist nur noch der Schlüssel der Strava-Verbindung dieses Geräts. Der alte Helfer-Code (`HELPER_TOKEN`) gilt nicht mehr. Die App liest ihn auch nicht mehr (`push/client.js`).
- Docs: `docs/ki-helfer-einrichten.md` ist gelöscht; Konten-Liste, Technik-Handbuch, Notfall-Handbuch, «Wann du etwas tun musst» und «Noah weiss» nennen Anthropic, Gemini und das KI-Guthaben nicht mehr.

## Was fällt weg oder rutscht tiefer
- Server-Aufgaben für Claude und Gemini → nichts, sie werden nirgends mehr gebraucht.
- Wächter-Zeilen «KI-Guthaben», «Testfrage an die KI», «Bereit für morgen?» → nichts.
- Der Helfer-Code als Schlüssel für die Erinnerungen → der Strava-Schlüssel des Geräts.

## Selbst entschieden
- Erst nach dem Deploy die Schlüssel in Vercel löschen (`ANTHROPIC_API_KEY`, `HELPER_TOKEN`, `GEMINI_API_KEY`, `HELPER_MONTHLY_CHF`, falls da auch `HELPER_MODEL`, `GEMINI_MODEL`, `GEMINI_FALLBACKS`). Der Wächter verlangt sie nicht mehr, darum geht das ohne rote Meldung. Noah bekommt die Klicks nach dem Merge.
- Vorher prüfen: Ich › Erinnerungen aufs Handy › «Adresse für cron-job.org kopieren» gibt mit der Strava-Verbindung eine Adresse. Hing cron-job.org am Helfer-Code als Besitzerschlüssel, bleibt die Adresse selbst gleich (sie nutzt den eigenen Tick-Schlüssel).
- Der noch auf dem Gerät gespeicherte Helfer-Code bleibt liegen (nie im Backup), bis Schritt 9 entscheidet.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 8 von 9. Danach das Aufräumen (Schritt 9).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Erinnerungen aufs Handy: «Adresse für cron-job.org kopieren» gibt eine Adresse (Strava verbunden).
2. Heute öffnen: alles wie vorher.
3. Danach die Schlüssel in Vercel löschen (Klicks folgen im Thread); am nächsten Morgen meldet der Wächter keinen Fehler.
