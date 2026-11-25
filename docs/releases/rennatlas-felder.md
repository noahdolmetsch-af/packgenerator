# Rennatlas: neue Felder im Rennen-Fenster

Auftrag: Noah 25.11.2026 («alle neuen rennen in die app integrieren. daten zuerst so aufbereiten, dass wir alle infos haben die wir brauchen»), Karte «Soll die App die neuen Rennen-Felder anzeigen?» → «Ja, Bilder zuerst zeigen».

## Was ist neu
- Das Rennen-Fenster im Rennatlas zeigt, wenn die Datei es hat: Unterstützung (z. B. «Selbstversorgt»), Anmeldefrist (wenn kein Tag bekannt ist, z. B. «Entfällt»), letzte Ausgabe (Datum und Stand) und zwei Links unter «Zum Veranstalter»: «Letzte Ausgabe» und «Weitere Informationen».
- Höhenmeter, die nur geschätzt sind (Wert vom Vorjahr), stehen als «ca. 15 000 Hm», im Fenster mit dem Grund darunter («Vorjahr (2024, 671 km)»); die Liste sagt ebenfalls «ca.».
- Die Rennliste wird wie bisher geladen; ältere Dateien ohne die neuen Felder zeigen sich unverändert.

## Was fällt weg oder rutscht tiefer
nichts.

## Selbst entschieden
- Nur das Rennen-Fenster zeigt die neuen Angaben, kein neuer Block auf der Seite (Content first).
- Der «ca.»-Hinweis kommt aus dem Feld `hmNote` der Datei; die App rät nichts selbst.
- Filter nach Unterstützung («Art») bleibt Teil 2, bis Noah ihn will.
- impeccable: nur eigene Durchsicht gegen das App-Design, ohne Prüfwerkzeug.
- Keine echten Daten im Repo: Tests und Bilder nehmen erfundene Rennen. Die echte Liste liegt privat.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › Rennatlas › Datei mit den neuen Feldern laden, ein Rennen mit geschätzten Höhenmetern öffnen: «ca. … Hm» mit Grund darunter.
2. Weiter unten stehen «Letzte Ausgabe» und «Weitere Informationen».
