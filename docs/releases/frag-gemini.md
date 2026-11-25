# Frag Gemini: Stimme, Foto und Vorlesen im Assistenten

PR folgt · 23.11.2026 · Auftrag: Noah «Ideen 1-4, 1a 2a 3a 4b» (Thread «Assistenten mit gratis KI erweitern»). Berührt `api/` (neue Funktion `api/ask.js`).

## Was ist neu
- **Assistent › Frag Gemini** (dritter Reiter): eine gratis Frage an Gemini per Text, Stimme (Mikrofon des Browsers) oder Foto. Das Foto wird auf dem Gerät auf höchstens 1024 Punkte verkleinert.
- **Vorlesen:** jede Antwort hat «Vorlesen», auch bei «Frag die App». Der Schalter «Antworten gleich vorlesen» steht auch auf der Gemini-Seite.
- **Mach es für mich:** aus einem Satz wird ein To-do, eine Liste, eine Notiz oder ein Wert (Gewicht, Ruhepuls, Schlaf). Erst steht «Ich würde das tun», geschrieben wird nach «Ja, machen», mit Rückgängig.
- **Rückblick:** neben «Punkte machen» gibt es «Mit Gemini gliedern». Klappt es nicht, gliedert die App wie bisher selbst.
- **Server:** `api/ask.js` (Gemini, Schlüssel `GEMINI_API_KEY` nur in Vercel, höchstens 150 Fragen am Tag). Das ist die 12. und letzte Funktion des kostenlosen Vercel-Plans.

## Was fällt weg oder rutscht tiefer
- nichts. In der Suche gibt es Gemini weiter nicht; «Weiter fragen bei …» bleibt unter jeder Antwort.

## Selbst entschieden
- Modell: `gemini-2.5-flash`, danach `gemini-2.5-flash-lite`. Ändert Google einen Namen, genügt die Vercel-Einstellung `GEMINI_MODEL` (oder `GEMINI_FALLBACKS`), kein neuer Code. Ich konnte Gemini aus dieser Umgebung nicht erreichen (ai.google.dev gesperrt); der Server ist mit nachgestellten Antworten getestet, der echte Aufruf wird nach dem Deploy geprüft.
- «Mach es für mich» kann vorerst nur To-do/Erinnerung, Liste, Notiz und Werte. «Pack zwei Riegel mehr ein» wird ein To-do; «Packliste ergänzen» und «Tour verschieben» folgen als eigene PRs, weil sie Packlisten und Touren ändern.
- Der Server prüft die Herkunft (nur die App und die Vercel-Vorschauen), nichts wird gespeichert oder protokolliert.
- «Mit Gemini gliedern» schickt nur den Text, nie Namen von Teilen oder Touren.
- Die Zeile «Antworten gleich vorlesen» ist die schon vorhandene Einstellung (`dict.read`), kein neuer Speicher, kein Backup berührt.

## Entscheide
- Siehe `docs/decisions/frag-gemini.md`.

## Stand im Plan
- Intelligenter Helfer im Assistenten: Ideen 1 bis 4 gebaut. Idee 5 (Morgen-Briefing vorgelesen) wartet auf Noahs Ja.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent › «Frag Gemini»: tipp «Was ziehe ich bei 5 °C und leichtem Regen an?» und «Frag Gemini». Eine kurze Antwort erscheint; «Vorlesen» liest sie.
2. Dasselbe mit dem Mikrofon und mit einem Foto (z. B. ein Velo-Teil).
3. «Erinnere mich am Freitag daran, die Reifen aufzupumpen» schreiben, «Mach es für mich», «Ja, machen»: das To-do steht in Merken, «Rückgängig» nimmt es zurück.
4. Tour › Rückblick › «Rückblick sprechen»: Text eingeben, «Mit Gemini gliedern».
