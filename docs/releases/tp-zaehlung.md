# TrainingPeaks zählt in deiner Woche mit

Auftrag: Noah «1a 2a 3a 4a» und «a» (22.11.2026, Thread «TrainingPeaks ins Wochen-Soll einrechnen»), Schritt W2 von W1 bis W3. Baut auf W1 auf (`docs/releases/tp-im-wochenplan.md`). Kein `api/`, kein Dexie-Schema, kein neues Backup-Format: die Einheiten aus TrainingPeaks stehen mit dem Typ `tp` im bestehenden Schnappschuss von `training.weeklog`.

## Was ist neu
- «Mein Trainingsplan»: die Zeilen aus TrainingPeaks tragen die Quelle «TrainingPeaks». Unter «Stunden gemacht von geplant» steht «davon TrainingPeaks N Std». Plan und TrainingPeaks sind zusammen die Woche; weil der Wochenplan dank W1 nur den Rest plant, steht die Summe nicht doppelt da.
- Wochenstern: Einheiten aus TrainingPeaks stehen im Schnappschuss der Woche und zählen in «Diese Woche bisher» und für den Stern. Abgehakt sind sie, wenn eine Strava-Aktivität ihres Tages da ist oder sie in «Meine Woche» von Hand abgehakt wurden. Eine offene hält den Stern zurück wie jede andere.
- Liegt Plan plus TrainingPeaks über dem Soll, steht auf der Wochenplan-Seite ein ruhiger Hinweis («Mit TrainingPeaks liegt die Woche über deinen N Std. Nichts wird weggenommen …»). Noah «a».
- Vergangene Wochen bleiben, wie sie eingefroren sind (nach dem Sonntag ändert sich nichts mehr).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Wann der Haken ankommt:** die Haken der TrainingPeaks-Einheiten werden beim Öffnen von Training › Wochenplan nachgetragen (dort liegen Plan, Aktivitäten und Wochenlog beieinander). Wer eine TrainingPeaks-Fahrt am Sonntag macht und den Wochenplan danach nicht mehr öffnet, bekommt den Stern für diese Woche nicht. Das gilt für alle Haken des Wochenplans gleich (der Schnappschuss entsteht auch nur beim Besuch). Soll es auch ohne Besuch gehen, wäre das ein eigener Schritt (Einzelfreigabe, weil er beim Start in `training.weeklog` schreibt).
- **Heute und das Abhaken** (Home, «Geschafft») kennen TrainingPeaks nicht als abhakbare Einheit; sie lassen die TrainingPeaks-Einheiten im Schnappschuss unberührt (`withSnapshot` ohne `tp`-Angabe behält sie).
- Eine TrainingPeaks-Einheit lässt sich im Wochenplan nicht «loslassen»; wer sie nicht will, nimmt sie in «Meine Woche» heraus.
- Vergangene Wochen zeigen die Zeilen aus TrainingPeaks aus den Einheiten von «Meine Woche», nicht aus dem Schnappschuss (dort stehen sie nur für den Stern).
- Der Feed reicht nur ca. 14 Tage voraus: für weiter entfernte Wochen plant der Wochenplan allein (steht in W3 auf der Karte).

## Daten (Prüfung mit Kopie)
- Kein neues Format und kein neues Dexie-Schema. Neu in `training.weeklog` sind nur Haken mit Schlüssel `tp:<id>` und Einheiten vom Typ `tp` im Wochen-Schnappschuss.
- Geprüft mit einer Kopie im alten Format (Test «Daten: ein Wochenlog aus einer Backup-Kopie»): ohne TrainingPeaks bleibt das Log gleich, mit TrainingPeaks kommen nur `tp:`-Schlüssel dazu, alle alten Haken bleiben, die Eingabe wird nicht verändert. Eine echte Backup-Kopie liegt nicht im Repo; Noahs Daten werden nie angefasst.

## Entscheide (eigene Datei `docs/decisions/tp-zaehlung.md`)
- 22.11.2026: Liegt Plan plus TrainingPeaks über dem Soll, bleibt es so, mit Hinweis (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- TrainingPeaks im Wochen-Soll: W1 und W2 fertig, W3 (Doku und Hinweise) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Training › Mein Trainingsplan: bei einer Woche mit TrainingPeaks steht «davon TrainingPeaks …».
2. Training › Wochenplan: «Diese Woche bisher» zählt die TrainingPeaks-Einheiten mit.
3. Eine TrainingPeaks-Einheit in «Meine Woche» abhaken, den Wochenplan öffnen: sie ist erledigt.
