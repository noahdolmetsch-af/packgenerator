# Alles vorab freigegeben

> **Ersetzt am 24.11.2026 17:19 (Noah «neue regel: ich möchte für jeden PR vor merge bilder sehen»):** Für PRs mit sichtbarer Änderung gilt nicht mehr «ohne Freigabe online»; Noah gibt zuerst die Bilder frei, siehe `docs/decisions/bilder-vor-merge.md`. Unverändert: PRs ohne sichtbare Änderung gehen bei Grün von selbst online, bei möglichem Datenverlust fragt der Thread zuerst. Der Text unten ist Verlauf.

23.11.2026, 00:03 (Zürich) · Auftrag: Noah «du musst mich nicht mehr fragen. ich gebe jetzt ausdrücklich alles frei» (Thread «Weiteres Vorgehen nach dem Baustopp planen»)

- **Alle PRs gehen nach grüner Prüfung ohne «ok» online, auch Daten, Backup, Sync und `api/`.** Es gibt keine Einzelfreigaben mehr (Grund: Noah will nicht mehr gefragt werden; ersetzt die Regel vom 22.11. 22:48 «a», nach der nur PRs ohne Daten von selbst online gingen).
- **Backup bleibt Pflicht vor jeder Datenänderung:** Test mit der Kopie eines Backups, ein frisches Backup von Noah liegt vor (Claude erinnert ihn, wenn das letzte älter als ein Tag ist), volle Prüfung.
- Bleibt wie bisher: «Online» erst nach grünem Deploy (bei `api/` mit Vercel «packgen» READY), «zurück» nimmt einen PR sofort zurück, «schliessen NNN» schliesst nur mit diesem Wortlaut, ein Force-Push nur mit «Ja force push NNN».
- Bilder und Prüfschritte bekommt Noah weiter (kein Warten darauf).
