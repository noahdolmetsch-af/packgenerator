# Frag Gemini antwortet wieder: Modellwahl und Fehleranzeige

27.11.2026 · Auftrag: Noah testete «Frag Gemini» auf dem Samsung A56 (27.11. 00:29), die Antwort war «Gemini hat nicht geantwortet» (Thread «Frag Gemini»)

## Was ist neu
- Der Server (`api/_lib/ask.js`) probiert bei jeder Absage des Modells (nicht gefunden, abgelehnt, überlastet, Fehler) das nächste Modell, auch bei 400 und 403. Bisher brach er bei einer Absage wie 403 sofort ab. Google löst `gemini-2.5-flash` gerade ab (Meldungen von Anfang November: Abschaltung am 1.12.2026, für neue Nutzer schon eingeschränkt), das ist die wahrscheinlichste Ursache.
- Geht kein Modell aus der Liste, liest der Server die Modellliste des Schlüssels, nimmt das neueste «flash»-Modell, das Text kann, und merkt es sich, solange der Server wach ist. So braucht ein Modellwechsel bei Google keine Änderung mehr.
- Schlägt eine Frage fehl, zeigt die Seite unter der Meldung eine kleine Zeile «Technische Angabe» (Antwortcode und die Modelle mit ihren Codes, nie die Frage). Damit lässt sich die Ursache auch ohne Server-Protokolle finden. Der Server schreibt bei einem Fehlschlag nur Modellnamen und Codes ins Protokoll.
- Nach einer Antwort, einem Plan oder einem Fehler springt das Ergebnis nach oben. So liegt der erste Dienst-Knopf («Frag ChatGPT») nicht mehr unter dem schwebenden Knopf «Verbessern».

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur die Seite «Frag Gemini» sorgt dafür, dass ihr Ergebnis frei vom schwebenden Knopf liegt. Der Knopf «Verbessern» liegt auf allen Seiten über dem Inhalt; eine allgemeine Lösung (z. B. mehr Platz unten in `App.svelte`) berührt die gemeinsamen Teile und würde alle Wächter auslösen. Vorschlag an den Koordinator: später für alle Seiten prüfen.
- Die Standardliste bleibt `gemini-2.5-flash`, dann `gemini-2.5-flash-lite`; die Modellliste des Schlüssels findet das richtige Neue selbst. Die Namen aus Netz-Berichten (3.8 / 3.5) habe ich nicht fest eingetragen, weil sie nicht bei Google selbst bestätigt sind.

## Entscheide
- `docs/decisions/frag-gemini-modell.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent › «Frag Gemini», eine Frage tippen und «Frag Gemini» drücken: eine Antwort kommt.
2. Kommt keine, steht unter der Meldung die Zeile «Technische Angabe». Bitte vorlesen.
