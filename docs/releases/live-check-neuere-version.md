# Live-Check: eine neuere Version online ist kein Fehler mehr

Auftrag: Noah «2, 1, 4» (Thread «Prüfungen so einrichten, dass main grün bleibt»); Fund beim ersten Lauf des Rundgangs aus #1353

Kein sichtbarer Unterschied in der App. Es ändert sich nur die Prüfung auf GitHub.

## Was ist neu
- **Der Live-Check meldet keinen falschen Alarm mehr, wenn schon ein neuerer Merge online ist.** Er läuft ein paar Minuten nach einem Merge und prüft, ob «Ich» die Version dieses Merges zeigt. Folgt der nächste Merge schnell, zeigt die Seite schon eine neuere Version (heute: erwartet 0.975.1, online war 0.976.0 und 0.977.0). Das war rot, öffnete ein Issue «Live-Check: die App im Netz braucht Hilfe» und schickte dir eine Mail, obwohl nichts kaputt war (heute drei Mal: #1342, #1351, #1357). Jetzt gilt: gleiche **oder neuere** Version ist gut. Eine ältere wartet weiter bis zu 10 Minuten, dann rot (so war es schon).
- Die Zahlen werden als Zahlen verglichen (0.1000.0 ist neuer als 0.999.0), `tests/e2e/live/version.js`, Unit-Test `tests/live-version.test.js`.
- Das noch offene Issue #1357 schliesst sich beim nächsten grünen Live-Check von selbst.
- **Gute Nachricht dazu:** Der neue Rundgang (abhaken, Sportjahr, Backup sichern und einspielen) lief beim ersten Mal auf der echten Seite grün.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Nur die Versions-Prüfung gelockert, nichts anderes. Der Rest des Live-Checks (Seiten öffnen, offline, Update) bleibt streng.
- Das Issue #1357 lasse ich offen, bis der nächste Lauf grün ist (er schliesst es selbst).

## Entscheide (für decisions.md)
- 21.11.2026: Der Live-Check akzeptiert eine neuere als die erwartete Version (Grund: falsche Alarme mit Mail bei schnell aufeinanderfolgenden Merges).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: main bleibt grün, Meldungen nur bei echten Fehlern. Danach Wackel-Test-Liste (Noah «2, 1, 4»).

## Prüfschritte
Nichts Sichtbares. Nach dem Merge: Der nächste Live-Check (Actions › «Live-Check») ist grün, auch wenn kurz danach ein weiterer Merge online geht; das Issue #1357 ist dann zu.
