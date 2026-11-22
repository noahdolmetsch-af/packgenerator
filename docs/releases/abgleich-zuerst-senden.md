# Abgleich: zuerst senden, nie hängen

PR folgt · 10.11.2026 · Auftrag: Noah «1 ok 2 ok» (Thread «Prüfen: Abhaken sofort zwischen Handy und Computer»)

Anlass: Auf Noahs Handy lief eine Abgleich-Runde rund 7 Minuten lang beim Holen. In dieser Zeit gingen Tennis und Meditation nie zum Computer, und Kaltwasser vom Computer kam nicht aufs Handy (beide Bilder vom 10.11.2026). Weitere Runden warteten hinter der einen.

## Was ist neu
- Eine Runde sendet zuerst, was dieses Gerät geändert hat (zum Beispiel einen Haken), und holt danach. Ein langsames Holen hält so nie mehr einen Haken zurück. Gilt, sobald das erste Holen einmal bis zum Ende gelesen wurde; bei einer neuen Kopplung (alles gilt als geändert) kommt das Holen zuerst, wie bisher.
- Das Holen geht in Paketen zu 25 Einträgen, jedes Paket ist ein einziger Datenbank-Schritt. Vorher war es ein Schritt pro Eintrag, und jeder Schritt liess alle offenen Seiten neu rechnen. Fällt ein Eintrag aus (nicht speicherbar), laufen die Einträge dieses Pakets wie bisher einzeln, die davor sind gespeichert.
- Das Holen hat ein Zeitlimit von einer Minute. Dann macht die nächste Runde (eine Sekunde später) dort weiter, wo die letzte aufgehört hat. Die Stelle wird nach jedem Paket gespeichert.
- Hängt eine Runde länger als 3 Minuten, wird sie gebeten aufzuhören. Hängt sie 30 Sekunden später immer noch, darf die nächste Runde starten.
- Wird die App gesperrt oder weggewischt und es gibt ungesendete Änderungen, startet sofort eine Runde (zuerst Senden) statt erst nach 20 Sekunden.
- Neu in `settings` → nein: im Konfigurationseintrag des Abgleichs steht neu `pulled` (false bis das erste Holen fertig ist). Alte Geräte ohne den Wert zählen als fertig.

## Was fällt weg oder rutscht tiefer
- nichts. Es ist keine Oberfläche geändert; die Anzeige «Gleicht ab …» im Panel bleibt, zählt aber jetzt paketweise statt einzeln hoch.

## Selbst entschieden
- Keine neue Oberfläche, keine neuen Texte, keine «Was ist neu»-Datei (nichts Sichtbares). Der Hinweis «Das dauert ungewöhnlich lang» bleibt.
- Das Zeitlimit (1 Minute) und die Paketgrösse (25) sind Annahmen. Die Ursache der Langsamkeit am Handy ist nicht belegt; die wahrscheinlichste ist, dass jeder einzelne Schritt alle offenen Abfragen der App neu auslöst. Messen konnte ich das nicht auf dem Handy.
- Der Backup-Aufbau, die Tabellen und der Server (`api/`) bleiben unverändert.
- Test-Datei `tests/sync-zuerst-senden.test.js`; die bestehenden Abgleich-Tests laufen unverändert grün.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Abgleich Handy ↔ Computer: PR 1 von 2 («Abgleich viel häufiger» folgt als PR 2).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy: Aktiv › Heute, Tennis antippen, danach sofort den Bildschirm sperren.
2. Computer (Seite offen, vorne): innerhalb weniger Minuten steht Tennis dort abgehakt (PR 2 macht es schneller).
3. Ich › Daten und Backup: «Eingeschaltet · zuletzt abgeglichen …» mit neuer Uhrzeit, kein Fehler.
