# Keine KI-Schritte, -Tipps oder Online-Fotoerkennung mehr

PR folgt · 21.11.2026 · Auftrag: Noah «a» (Thread «Entfernen aller KI-Funktionen», Schritt 3 von 7)

## Was ist neu
- Kompass: Die Schritte eines Ziels tippst du selbst. «Schritte vorschlagen» und die Einstellungen «KI schlägt Schritte vor» und «Knopf ausblenden» sind weg.
- «Bereit für morgen?» zeigt nur noch die Hinweise aus Wetter, Liste und fälligen Teilen; der Knopf «KI-Helfer für morgen fragen» fehlt.
- Packliste per Foto erkennt nur auf dem Gerät. Der Schalter «KI-Helfer (online)» und «Foto senden» sind weg; das Foto verlässt das Handy nie.
- Aus dem Code entfernt: `helper/payload.js`, `vision/online.js`, `forHelper` und die Kompass-Bausteine `takeSuggested` und `stepsPayload`.

## Was fällt weg oder rutscht tiefer
- «Schritte vorschlagen» im Kompass → nichts; Ersatz ist das Eintippen, die App verteilt die Daten bis zum Zieltag.
- «KI-Helfer für morgen fragen» → nichts; die Hinweise der App bleiben.
- «KI-Helfer (online)» bei Packliste per Foto → nichts; die Erkennung auf dem Gerät bleibt.

## Selbst entschieden
- Im Kompass-Datensatz bleibt das alte Feld `ai` und bei schon übernommenen Schritten `ai: true` unverändert gespeichert (nichts am Datenformat oder am Backup geändert); es wird nur nicht mehr gelesen oder geschrieben.
- Die gespeicherte Wahl «engine: helper» der Fotoerkennung wird ignoriert; es erkennt immer das Gerät.
- Die Server-Tests der Aufgaben `evening`, `steps` und `vision` bleiben bis Schritt 6 (`api/`).
- Keine eigene Funktion fällt aus dem Katalog; «Bereit für morgen?» und «Packliste per Foto» bleiben, nur ohne Claude.
- Übrige deutsche Texte der entfernten Stellen bleiben bis Schritt 7 in `de/*.js`.

## Entscheide
- Siehe Schritt 1: alle KI-Funktionen mit Claude und Gemini werden entfernt (Noah «a»); «KI im Gerät» und Bilderkennung auf dem Gerät bleiben.

## Stand im Plan
- KI entfernen: Schritt 3 von 7.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Kompass, ein Ziel: nur «Schritte hinzufügen», kein «Schritte vorschlagen».
2. Packen, Tour von morgen: «Bereit für morgen?» zeigt Hinweise, keinen KI-Knopf.
3. Werkzeugkasten › Packliste per Foto: kein Schalter «KI-Helfer (online)».
