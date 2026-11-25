# Rückmeldung beim Tippen

PR #<Nummer> · 25.11.2026 · Auftrag: Noah «1-5a» (Thread «Rückmeldung beim Tippen prüfen»)

## Was ist neu
- Abhaken in «Heute abhaken» (Heute, Training, Plan), bei den Gewohnheiten-Karten, bei To-dos und bei «+30 Min» der Challenge: kurzes Vibrieren und ein weicher grüner Ring um die Kachel. Zurücknehmen bleibt still.
- Fertig-Momente vibrieren doppelt: neuer Stern, Tagesziel der Challenge erreicht, Debrief «Alles gut» gespeichert, Velo-Service und gelöstes Problem.
- Kacheln auf Heute, Haken-Kacheln und der Haken der To-dos schrumpfen kurz, solange der Finger drauf ist (wie die Knöpfe schon).
- Der Schalter «Kurzes Vibrieren beim Abhaken» gilt jetzt für alles davon (vorher nur Packen); Text und Deutsch sind angepasst.
- «Bewegung reduzieren» (Handy) und «Bewegung: Aus» stoppen Ring und Schrumpfen; das Vibrieren hat nur seinen eigenen Schalter.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Verschluss-Klick der Tasche bleibt bei «Bewegung reduzieren» still wie bisher (nicht angefasst).
- Kein Vibrieren beim Zurücknehmen, damit «abgehakt» und «zurückgenommen» sich unterscheiden.
- Kein Vibrieren bei Auswahl-Häkchen in Tabellen und bei Einstellungs-Schaltern (kein «erledigt»).
- Der Ring ist ein Schatten-Ring (`box-shadow`), damit die Kachel selbst nicht springt.

## Entscheide (eigene Datei `docs/decisions/rueckmeldung-tippen.md`)
- 25.11.2026: Noah «1-5a», siehe die Datei.

## Stand im Plan (roadmap.md / vorhaben.md)
- Dient Klarheit («hat es geklappt?»); kein eigener Eintrag in vorhaben.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute eine Kachel in «Heute abhaken» antippen (Android): vibriert einmal, leuchtet auf. Nochmals tippen: still.
2. Ich › Aussehen: «Kurzes Vibrieren beim Abhaken» ausschalten, nochmals abhaken: nichts vibriert.
3. Ein To-do abhaken: vibriert und klappt weg. Ein Velo-Service speichern: doppeltes Vibrieren.
