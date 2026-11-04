# Volle Prüfung nur nachts

PR (diese Änderung) · 03.11.2026 · Auftrag: Noah «2a» (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Die «Volle Prüfung» (Browsertests am Handy und am Computer, Gesamttest) läuft nur noch einmal pro Nacht und auf Knopfdruck («Run workflow» unter Actions), nicht mehr nach jedem Merge.
- Es ändert sich nichts in der App. Pro PR laufen weiter Bauen, Kurztests, der Wächter am Computer und (nach deinem ok) die Handy-Tests.

## Was fällt weg oder rutscht tiefer
- Weg: die Prüfung direkt nach dem Online-Gehen. Ein Fehler, der erst nach dem Merge auffällt, meldet sich jetzt am nächsten Morgen (Meldung «Volle Prüfung: ein Test ist rot») statt etwa 40 Minuten nach dem Merge. «zurück» bleibt jederzeit möglich.

## Selbst entschieden
- Der Wächter am Computer (`guard.spec.js`) und die Handy-Tests pro PR bleiben, damit die Hauptseiten weiter vor dem Merge geprüft sind.
- Der Test `tests/ci-image.test.js` prüft jetzt «nachts, nicht nach jedem Merge» statt «nach dem Online-Gehen».
- Der Live-Check (`live.yml`) bleibt unverändert nach jedem Online-Gehen: er ist klein.

## Entscheide (für decisions.md)
- 03.11.2026: Volle Prüfung nur nachts (Noah «2a»). Grund: 9 Rechner pro Merge zusätzlich, Warteschlange bis 47 Minuten, 4 von 8 Läufen heute rot und 7 von 15 durch neuere ersetzt.

## Stand im Plan
- Verschlanken (Tests und Tempo): zweiter Schritt der Messung vom 03.11.2026. Der erste Schritt («Ausprobieren» nur mit den neuen Zeilen pro PR) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unter github.com/noahdolmetsch-af/packgenerator/actions startet nach dem Merge kein Lauf «Volle Prüfung» mehr.
2. Am nächsten Morgen steht dort der Lauf der Nacht (02:07 UTC).
