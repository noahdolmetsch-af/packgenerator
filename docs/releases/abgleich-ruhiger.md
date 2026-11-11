# Abgleich: ruhiger, wenn nichts Neues da ist

Auftrag: Noah «ich möchte 1-4 umsetzen, nachdem 1251 durch ist» (Thread «Messen: warum die App langsam ist»), Punkt 3 (Einzel-ok, weil der Abgleich betroffen ist). Bericht `notes/messen-2026-11-10/README.md` im Projektordner.

## Was ist neu
- Eine Abgleich-Runde las die Änderungsliste (alle `sync|`-Notizen, bei Noahs Daten rund 9'700) zweimal, auch wenn der Server nichts geschickt hatte. Jetzt wird das zweite Lesen und Senden (`src/lib/sync/engine.js`, Schritt 3) ausgelassen, wenn der Server in dieser Runde nichts geschickt und keine Frage entschieden hat: dann hat das Holen hier nichts verändert, das erste Senden hat alles abgeschickt, und eine Änderung, die während der Runde dazukommt, weckt die nächste Runde von selbst (Beobachtung der Liste in `auto.svelte.js`).
- Die Erinnerungen (`afterSync`, `src/lib/push/client.js`) werden nur nach einer Runde geprüft, die etwas geholt oder geschickt hat. Eine ruhige Runde fragt den Server nichts mehr und liest keine 9 MB Daten dafür.
- Neue Tests: `tests/sync-ruhige-runde.test.js` (ruhige Runde liest die Liste einmal, eine Runde mit Neuem zweimal, eine eigene Änderung wird weiter gesendet) und `tests/sync-auto-erinnerung.test.js` (Erinnerungen nur nach Holen oder Senden). Die bisherigen Abgleich-Tests laufen unverändert.

## Was fällt weg oder rutscht tiefer
- nichts. Kein Format und kein Server (`api/`) geändert. Eine am anderen Gerät abgehakte Erinnerung kommt weiter an: sie ist eine geholte Änderung, also folgt die Prüfung.

## Selbst entschieden
- Die erste Kopplung (erstes Holen noch nicht zu Ende gelesen) läuft wie vorher.
- Die Zeile «zuletzt abgeglichen» wird weiter jede Runde geschrieben (eine kleine Meta-Zeile, weckt keine Fahrten-Lesung).
- Keine Bilder: nichts Sichtbares ändert sich.

## Stand im Plan
- Tempo: #1251, #1253 (Noahs Punkt 2), Ordner-Backup (Punkt 4) und dieser PR (Punkt 3) erledigt; offen: Punkt 1 (Fahrten schlank) erst nach Noahs Handy-Neumessung.

## Prüfschritte (nach dem Merge auf der echten Seite, Computer und Handy gekoppelt)
1. Am Handy eine Tour ändern: nach spätestens einer Minute ist sie am Computer.
2. Eine Erinnerung am Handy abhaken: sie verschwindet auch auf der anderen Seite.
3. App eine Minute auf Heute offen lassen: sie bleibt ruhig.
