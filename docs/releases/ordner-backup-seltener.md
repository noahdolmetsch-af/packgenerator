# Ordner-Backup: höchstens alle 30 Sekunden

Auftrag: Noah «ich möchte 1-4 umsetzen, nachdem 1251 durch ist» (Thread «Messen: warum die App langsam ist»), Punkt 4. Bericht `notes/messen-2026-11-10/README.md` im Projektordner.

## Was ist neu
- Das Ordner-Backup (`src/lib/folderBackup.js`, nur Desktop-Chrome mit gewähltem Ordner) schrieb 2 Sekunden nach jeder Änderung beide Dateien. Ein Schreiben liest und baut alle Tabellen (1.7 s mit Noahs echten Daten, 1×) und weckt dabei die Live-Abfragen.
- Jetzt liegen mindestens 30 Sekunden zwischen zwei Schreibvorgängen (`waitFor`). Was dazwischen geändert wird, kommt ins nächste Backup.
- Verlässt man den Tab (`visibilitychange`: hidden) mit einer noch nicht geschriebenen Änderung, wird sofort geschrieben, damit die Wartezeit nichts verliert.
- Neuer Test `tests/folderBackup-abstand.test.js`: Wartezeit-Rechnung und ein Lauf mit gefälschter Uhr (ein Schreiben nach einer Serie, das nächste erst nach 30 s). Mit Abstand 0 schlagen beide Tests fehl.

## Was fällt weg oder rutscht tiefer
- Das Backup im Ordner ist bis zu 30 Sekunden älter als vorher (vorher 2 Sekunden). «Ordner wählen», «Erlauben» und «Nochmal versuchen» schreiben weiter sofort.

## Selbst entschieden
- Beim Verlassen des Tabs wird die Wartezeit übersprungen (einmal pro Verlassen), statt eine Änderung zu verlieren.
- Kein Format, kein Schema, keine Einstellung geändert. Keine Bilder: nichts Sichtbares ändert sich.

## Stand im Plan
- Tempo: #1251, #1253 (Punkt 2) und dieser PR (Punkt 4) erledigt; offen: Punkt 1 (Fahrten schlank), Punkt 3 (Abgleich und Erinnerungen).

## Prüfschritte (nach dem Merge auf der echten Seite, Mac mit gewähltem Backup-Ordner)
1. Eine Tour ändern und mehrmals speichern: die Seite bleibt ruhig.
2. Ich › Daten: «Backup im Ordner» zeigt die Zeit des letzten Schreibens; nach spätestens 30 Sekunden ist sie neu.
