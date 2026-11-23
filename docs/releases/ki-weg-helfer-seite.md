# Die Seite «KI-Helfer» ist weg

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 7)

## Was ist neu
- Die Seite «KI-Helfer» (Helfer-Code, Monatslimit, Modell, «Wo der Helfer erscheint») gibt es nicht mehr. Die Zeile in Ich, der Eintrag im Menü und in der Suche und die Zeile in «Was kommt» fallen mit.
- Die Kachel «Helfer» ist von Heute und aus dem Katalog der Kacheln verschwunden. Eine alte Wand, die sie noch hatte, zeigt sie nicht mehr (sie bleibt dort unsichtbar gespeichert, nichts geht kaputt).
- Der Wochenrückblick hat die Karte «Wie war meine Woche?» («Kopieren für Claude») nicht mehr; sie war nur mit dem Helfer-Schalter sichtbar.
- Der Hinweis «Der Helfer ist noch nicht eingerichtet» und der Hinweis «Guthaben verbraucht» (`CreditNotice`) sind weg.
- Texte, die auf den Helfer verwiesen, sind angepasst (Assistent, KI im Gerät, Datenschutz, Push, Handbuch).
- Aus dem Code entfernt: `pages/Helper.svelte`, `lib/helper/*` (Einstellungen, Anfrage, Hinweise, Stil), `weekreview.js summaryText`, Tests für den Helfer-Client. Die Frage-Erkennung der Suche (`looksLikeQuestion`) wohnt jetzt in `suche/logic.js`.

## Was fällt weg oder rutscht tiefer
- Ich › KI-Helfer (Code, Limit, Modell, Nutzung und Kosten) → nichts.
- Kachel «Helfer» auf Heute → nichts.
- «Kopieren für Claude» im Wochenrückblick → nichts.
- Funktion `f.helper` (Handbuch-Eintrag) → fällt weg, steht unter «abgeloest».

## Selbst entschieden
- Ein schon gespeicherter Helfer-Code bleibt auf dem Gerät liegen (Einstellung `helper`, weiterhin nie im Backup). Nichts wird gelöscht und kein Datenformat berührt.
- Push (`push/client.js`): der Besitzerschlüssel kommt zuerst von Strava; der alte Helfer-Code wird nur noch als Reserve gelesen. Die Meldung sagt jetzt «Verbinde zuerst Strava». Was beim Server-Schritt (8) mit dem Schlüssel `HELPER_TOKEN` geschieht, wird dort geprüft.
- «Weiter fragen bei Claude, ChatGPT …» (Assistent) bleibt, bis Noah auf die offene Frage antwortet.
- Übrige deutsche Texte der entfernten Stellen bleiben bis zum Aufräumen (Schritt 9) in `de/*.js`.
- Kein `api/` berührt: der Server (`api/helper.js`) folgt in Schritt 8.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 7 von 9. Danach der Server (Schritt 8, Einzelfreigabe) und das Aufräumen (Schritt 9).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen: keine Zeile «KI-Helfer» zwischen Sprache und Suche.
2. Heute › «Kachel hinzufügen»: keine Kachel «Helfer» im Katalog; Heute selbst sieht aus wie vorher.
3. Aktiv › Woche › Wochenrückblick: Zahlen, Streifen und Höhepunkte da, keine Karte «Kopieren für Claude».
