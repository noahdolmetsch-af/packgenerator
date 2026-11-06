# Nacht-Roboter «Langes Wort»

PR · 06.11.2026 · Auftrag: Noah «4a» (Thread «Durchklicken Etappe 5»)

## Was ist neu
- Der Nacht-Rundgang hat einen zweiten Roboter. Er geht auf 28 Seiten (Aktiv, Training, Wohlbefinden, Auswerten, Erinnerungen und weitere), öffnet die Knöpfe zum Neu-Anlegen und Umbenennen, tippt in jedes Textfeld ein sehr langes Wort ohne Lücke und speichert es.
- Danach prüft er auf dem Handy (390 px) und am Computer (1440 px), ob die Seite breiter wurde als der Bildschirm: beim Tippen, nach dem Speichern und nach dem Neuladen.
- Findet er etwas, steht es im Bericht des Nacht-Rundgangs (Issue «Nacht-Rundgang: etwas gefunden») mit Seite, Knopf und dem Element, das zu breit ist. Ist alles gut, bleibt es still.
- In der App ändert sich nichts. Der Roboter läuft nur nachts (`RUNDGANG=1`), nie in einem PR.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine «Was ist neu»-Datei in der App, weil nichts sichtbar ist.
- Der Roboter drückt nie «Löschen», «Senden», «Zurücksetzen», «Import», «Export» und ähnliche Knöpfe. Er braucht nur erfundene Daten (Gesamttest-Daten).
- Seiten und Knöpfe stehen als feste Liste im Test, damit jede Nacht dasselbe geprüft wird. Neue Seiten mit eigenen Wörtern kommen bei Bedarf dazu.
- Der Bericht-Teil von `nacht.yml` nimmt die neuen Dateien `lang-wort-phone.md` und `lang-wort-desktop.md` mit.

## Entscheide (für decisions.md)
- 06.11.2026: Lange eigene Wörter werden jede Nacht automatisch geprüft (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf GitHub: Actions › «Nacht-Rundgang» › «Run workflow» (grüner Knopf rechts), warten bis der Lauf fertig ist.
2. In der Zusammenfassung des Laufs steht der Abschnitt «Langes Wort» für Handy und Computer, mit «Alles in Ordnung.».
