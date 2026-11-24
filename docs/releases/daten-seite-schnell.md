# Die Seite «Daten» öffnet wieder schnell

PR · 24.11.2026 · Auftrag: Tempo-Zeile von Noah (Ich › Daten: ein Ladeteil «import-wrapper.js» 7452 ms bei 7 Besuchen) · Gruppe: Klarheit

## Was ist neu
- Jede «Vor Updates» (Import, Sync, Neu beginnen, Zurückgehen) ist eine volle Kopie aller Daten. Mit Noahs Daten (Backup ~140 MB) ist jede Kopie rund 140 MB gross. Die Seite Ich › Daten las bisher bei jedem Öffnen **alle** Kopien (bis 9) ganz, nur um eine Zeile je Kopie zu zeigen. Nachgemessen mit Noahs Backup (privat, nicht im Repo): 3 Kopien = ein Block von 4,5 s im Hauptfaden, die Seite stand erst nach 5,4 s.
- Neben jeder Kopie liegt jetzt eine kleine Notiz («head:<id>» in der Tabelle `meta` derselben Kopien-Datenbank: wann, welche Version, wie viele Einträge). Liste (`BeforeUpdates.svelte`) und Hinweis in «Neu» (`snapshotFor`) lesen nur diese Notizen.
- Kopien aus der Zeit vor den Notizen bekommen ihre Notiz einmal, 4 s nach dem Öffnen der Seite, eine nach der anderen (`ensureHeads`). Das ist die einmalige Last, die vorher bei jedem Besuch kam. Die Kopie selbst wird nie verändert.
- `takeSnapshot` räumt die alten Kopien jetzt über die Indizes auf (Zeit und Art), ohne eine Kopie zu lesen; vorher las es alle Kopien bei jedem Update-Start.
- Die Karte «Speicher auf diesem Gerät» zeigt neu die Zeile «Vor Updates» (Anzahl und Grösse) und nimmt sie in die Zeile zum Kopieren auf. Das war bisher unsichtbar: bis zu 9 volle Kopien sind echter Platz (bei Noahs Daten bis rund 1,2 GB).

## Was fällt weg oder rutscht tiefer
- nichts. Dieselben Kopien, dieselbe Liste, dieselben Knöpfe («Zurück zum Stand vor …»).

## Selbst entschieden
- Kopien nicht kleiner gemacht und nicht gelöscht: «ohne Verluste». Ob weniger Kopien oder gepackte Kopien sinnvoll sind, entscheidet Noah, wenn die Karte zeigt, wie viel sie wirklich brauchen.
- Keine Schemaänderung (kein neuer Dexie-Stand): die Notizen liegen in der schon vorhandenen Tabelle `meta` der Kopien-Datenbank, die nie in ein Backup oder einen Export geht. Die Hauptdatenbank und das Backup-Format bleiben unberührt, darum kein neues Backup nötig.
- Die einmalige Nachrüstung der Notizen läuft nach 4 s im Hintergrund und nicht beim Start, damit der Start nicht langsamer wird.

## Stand im Plan
- Tempo: Ladeteil der Seite «Daten» behoben. Speicher: Kopien jetzt sichtbar; ob sie schrumpfen sollen, ist offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten öffnen: die Seite steht innerhalb einer Sekunde (beim ersten Mal rechnet die App im Hintergrund noch die Notizen nach).
2. «Speicher messen» tippen: Zeile «Vor Updates» mit Anzahl und Grösse.
3. «Mehr» öffnen: die Liste «Vor Updates» zeigt dieselben Kopien wie vorher.
