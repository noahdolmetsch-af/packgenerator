# Die Suche schickt keine Sätze mehr an Gemini

PR folgt · 22.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 4)

## Was ist neu
- In der Suche gibt es kein «Gemini verstehen lassen» mehr und keinen Plan «Ich würde das tun» von Gemini. Befehle, die die Regeln der App kennen, laufen wie bisher sofort, mit Rückgängig.
- Ich › Suche hat keinen Schalter «Gemini versteht Sätze» mehr.
- Aus dem Code entfernt: `suche/befehl.js` (die Anfrage an Gemini und die Prüfung der Antwort) und sein Test.

## Was fällt weg oder rutscht tiefer
- «Gemini verstehen lassen» (Angebot und Plan «Ich würde das tun») → nichts; die Regeln der App bleiben.
- Schalter «Gemini versteht Sätze» in Ich › Suche → nichts.

## Selbst entschieden
- Der Plan wurde neu geschnitten, weil Gemini an vielen Orten steckt: Schritt 4 Suche (Sätze verstehen), Schritt 5 Antworten (Suche, Assistent, Fragen), Schritt 6 Tagebuch, Eingabe, Sprachbericht, Belege, Schritt 7 Seite KI-Helfer und Code, Schritt 8 Server, Schritt 9 Aufräumen. Die Seite «KI-Helfer» bleibt bis nach Gemini, weil Gemini den Helfer-Code braucht und die Seite sonst eine tote Verbindung hätte.
- Der alte Schlüssel `understand` in den gespeicherten Sucheinstellungen bleibt unberührt liegen und wird nicht mehr gelesen (nichts am Datenformat oder am Backup).
- Die Server-Tests für Gemini (`befehl-server.test.js`) bleiben bis zum Server-Schritt.
- Übrige deutsche Texte der entfernten Stellen bleiben bis zum Aufräumen in `de/*.js`.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» bleibt.

## Stand im Plan
- KI entfernen: Schritt 4 von 9.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Suche öffnen, «Erinnere mich Freitag an Reifen pumpen» tippen: die App zeigt ihre eigenen Befehle, kein Angebot «Gemini verstehen lassen».
2. Ich › Suche: kein Schalter «Gemini versteht Sätze».
