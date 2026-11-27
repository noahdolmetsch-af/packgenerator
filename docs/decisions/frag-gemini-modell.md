# Frag Gemini: Modell wählt der Server selbst

27.11.2026 · Auftrag: Noah, Test auf dem Samsung A56 (27.11. 00:29), «Gemini hat nicht geantwortet»

- Ein Modellname im Code ist ein Risiko, weil Google Modelle abschaltet und für neue Schlüssel sperrt. Der Server probiert deshalb die Liste weiter durch (auch bei 400 und 403) und fragt zuletzt die Modellliste des Schlüssels nach dem neuesten «flash»-Modell.
- Eine Fehlermeldung bekommt eine kleine technische Zeile (Code und Modelle mit Codes, nie die Frage), damit ein Fehler ohne Server-Protokoll verstanden wird (Vercel Hobby behält Protokolle nur 1 Stunde).
- Verworfen: ein fester neuer Modellname (nicht bei Google bestätigt, hält nur bis zur nächsten Abschaltung); Protokolle aufheben (Datenschutz, «nichts wird gespeichert»).
