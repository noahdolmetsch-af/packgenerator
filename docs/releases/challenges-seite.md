# Seite «Challenges»: eigene Tagesziele mit «Abhaken»

Auftrag: Noah 21.11.2026 («4a»: eigene Tagesziele, Seite «Challenges» in Meilensteine). Entwurf freigegeben 22.11.2026 02:33 UTC («freigabe»), «Abhaken» gewählt 22.11.2026 01:36 UTC («a»). Thread «Challenges in den Vordergrund stellen». Schritt 3 von 4 (1 Karte Draussen, 2 Erinnerung, 3 diese Seite, 4 Frage alle 10 Tage).

## Was ist neu
- Neue Seite «Challenges» (`#/flow/challenges`), erreichbar über den Knopf «Challenges ›» oben auf Meilensteine. Abschnitte: «Läuft jetzt» (Draussen und eigene Ziele), «Neue Challenge», «Ideen», «Vorbei».
- Eigene Tagesziele: Name, Einheit (Minuten, Anzahl mit eigenem Wort, Schritte), Ziel pro Tag, erster und letzter Tag. Jeder Tag, der das Ziel erreicht, zählt; verpasste Tage bleiben sichtbar.
- Jede Challenge hat eine Karte wie die Gewohnheiten auf Heute: der grüne Knopf **«Abhaken»** zählt das Tagesziel als erreicht (mit «Rückgängig», ein zweiter Tipp nimmt es zurück). Unter «Mehr»: die Knöpfe der Einheit und eine eigene Zahl für Teilmengen.
- Heute bleibt, wie es ist (Noah 22.11.2026 «ich möchte heute eigentlich so lassen wie es ist»): dort steht nur die Karte «Draussen»; eigene Challenges leben auf der Seite «Challenges».
- «Ideen»: vier Vorschläge zum Übernehmen (30 Tage Meditation, Schritte, Dehnen, Gläser Wasser); das Fenster öffnet sich zuerst, nichts startet von selbst.
- «Vorbei»: beendete Challenges mit «n von m Tagen geschafft», «Neu beginnen» oder «Löschen» (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- Nichts. Meilensteine bekommt einen Knopf «Challenges ›» im Kopf; Heute ändert sich nicht.

## Selbst entschieden
- Neue Einstellung `tagesziele` (Liste; Backup und Geräteabgleich nehmen sie wie jede Einstellung mit), keine neue Tabelle, keine Schema-Version. Der Schlüssel `challenges` ist schon belegt («n-mal bis zu einem Tag», `src/lib/challenge.js`) und bleibt unverändert auf Meilensteine. Wegen der Daten: Einzelfreigabe.
- Reihenfolge getauscht: erst die Seite (3), dann die Frage alle 10 Tage (4), weil der Knopf «Neue Challenge» der Frage dorthin führt.
- «Abhaken» zählt den fehlenden Rest bis zum Tagesziel; «Zurücknehmen» nimmt die zuletzt dazugezählten Mengen weg, bis der Tag wieder unter dem Ziel liegt.
- Höchstens 12 eigene Challenges; Strava zählt nur bei «Draussen» (Schritte kommen später aus Fitbit, falls Noah das will).
- Offen aus Noahs Wunsch: die Challenges auch in «Heute abhaken» auf Aktiv zeigen. Kommt als eigener kleiner PR, weil dort die Sportarten-Liste angefasst wird; «Abhaken» auf der Karte Draussen folgt nach der Erinnerung (#1380).
- Erinnerung aufs Handy für eigene Challenges: nicht in diesem PR (kommt nach #1380 auf derselben Technik).
- Fertig-Regel: Seite (`features.js` `f.challenges`, Handbuch), Absprung (Knopf auf Meilensteine, Karte Draussen auf Heute), Inhalt (Handbuchtext), leerer Zustand (die Zeile sagt, warum leer, «Neue Challenge» steht darunter), nächster Schritt (Zeile «Zurück zu Meilensteine»), App-Stand (Zeile «Challenges»).

## Stand im Plan
- Challenges in den Vordergrund: 1 Karte online, 2 Erinnerung in #1380, **3 Seite (dieser)**, 3a «Abhaken» bei Draussen, 4 Frage alle 10 Tage.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Meilensteine öffnen, oben «Challenges ›» tippen: die Seite zeigt «Läuft jetzt» mit deiner Karte «Draussen».
2. «Neue Challenge» tippen, «Dehnen» eingeben, 10 Min lassen, «Start»: eine Karte mit dem grünen Knopf «Abhaken» erscheint (auf Heute ändert sich nichts).
3. «Abhaken» tippen: «Heute geschafft»; «Abgehakt · zurücknehmen» macht es rückgängig.
