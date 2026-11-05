# Fragen aus deinen Daten, Stufe 2: Wetter

PR folgt · 04.11.2026 · Auftrag: Noah «1a und b» (Thread «Bauen: Tagescheck Stufe 2»)

## Was ist neu
- **Grauer Tag und tiefe Stimmung:** Ist heute Regen wahrscheinlich (ab 60 Prozent oder ab 5 mm) und war deine letzte Stimmung (heute, sonst gestern) mindestens 1 Punkt unter deinem Üblichen der 30 Tage davor, fragt der Check «Was tut dir an grauen Tagen gut?» (Kurzer Spaziergang, Jemanden treffen, Etwas kochen, Musik, Ausruhen, Nichts Besonderes, plus Satz).
- **Schönes Wetter und ein freier Abend:** Ist es trocken (unter 1 mm, unter 30 Prozent), mindestens 15 Grad warm und steht von 17 bis 22 Uhr nichts in deinem Google-Kalender, fragt der Check «Draussen etwas geplant?» (Eine Fahrt, Ein Lauf, Tennis, Ein Spaziergang, Jemanden treffen, Nichts geplant, plus Satz).
- Beide Regeln: Schalter, Schwelle (Regenwahrscheinlichkeit 30 bis 90, Wärme 8 bis 28 Grad) und eigene Worte wie die anderen. Ohne Wohnort-Wetter oder ohne Kalender steht im Kasten, warum sie still sind.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur das Wetter von heute (Vorhersage des Wohnorts, die Heute schon speichert); nichts wird für diese Regeln zusätzlich geladen.
- «Freier Abend» braucht einen verbundenen Kalender: ohne Kalender-Einträge der letzten 7 Tage wissen wir den Abend nicht, dann fragt die Regel nie (kein Raten).
- Ganztägige und als «frei» markierte Termine zählen nicht als belegt.
- Beide Regeln liegen in der Gruppe «Spass», zusammen mit der Stimmungs-Regel: am Tag kommt nur eine davon (Wiederholungsschutz).
- Kein Schema- und kein Backup-Format geändert.
- `docs/app-stand.md`: die Zeile «Fragen aus deinen Daten» gilt schon für alle Regeln, keine neue Zeile.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan
- «Fragen aus deinen Daten», Stufe 2: Wetter gebaut. Weiter: Zufallsfrage, Vermutungen testen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Deine Abfragen: «Fragen aus deinen Daten» zeigt «Grauer Tag und tiefe Stimmung» und «Schönes Wetter und ein freier Abend».
2. Bei der ersten Regel die Regenwahrscheinlichkeit ändern und eine eigene Frage schreiben, dann «Zurück zum Standard».
3. Ohne Wohnort oder Google-Kalender erklärt der Kasten, warum die Wetter-Regeln still sind.
