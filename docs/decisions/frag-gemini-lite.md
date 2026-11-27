# Frag Gemini: leichte Modelle zuerst, höchstens etwa 25 Sekunden

27.11.2026 · Auftrag: Noahs Test mit Version 0.1322 (27.11. 17:58): lange «Frage …», dann kein Antwort. Das Protokoll des Servers (Vercel, 1 Stunde) zeigte: `gemini-2.5-flash:404 gemini-2.5-flash-lite:404 gemini-3.8-flash:503 gemini-3.7-flash:503 gemini-3.6-flash:net`.

- Die alten Modelle 2.5 gibt es bei Google nicht mehr (404). Die Modellliste des Schlüssels findet die neuen (3.8, 3.7, 3.6 «flash»), aber sie sind überlastet (503), das dritte lief in die Zeitgrenze.
- Darum: bei den neuesten Versionen zuerst das «lite»-Modell (klein, schnell, meist ohne den Andrang), dann das «flash» derselben Version; bei 503 einmal nach 0,7 Sekunden nochmals; das Ganze höchstens etwa 25 Sekunden (je Versuch 8); die Seite wartet höchstens 40 Sekunden.
- Verworfen: einen festen Modellnamen eintragen (nicht bei Google bestätigt, hält nur bis zur nächsten Abschaltung); alle Modelle gleichzeitig fragen (verbraucht das gratis Tageslimit schneller).
