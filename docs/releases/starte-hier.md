# Leeres Heute: «Starte hier»

Auftrag: Noah «1-5a» (23.11.2026, Thread «Klarheit und Auffindbarkeit ab erstem Öffnen»), Punkt V2. Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Ohne Daten zeigt Heute die Karte **«Starte hier»**: ein Hauptknopf für den nächsten Schritt (Erstes Velo erfassen, dann Erstes Teil eintragen, dann Erste Tour planen), die drei Schritte als eine Linie (Velo – Material – Tour, erledigte mit Haken) und drei leise Zeilen: «Neu hier? Rundgang, 2 Minuten – Starten ›», «Ein Rennen planen? – Muster ansehen ›», «Backup von früher – Importieren ›».
- Auf dem leeren Heute fehlen die Zeilen «Heimort festlegen für das Wetter», «Wetter-Seite ›» und der Satz «Heute ist nichts dringend.»; der Weg zum Wetter ist die Datumszeile. Der Körper-Block erscheint nur mit Fitbit-Daten, «Jetzt dran» mit Impuls nur, wenn etwas ansteht.
- Unter der Karte steht: «Alles andere (Körper, Jetzt dran, Wetter) erscheint, sobald du Daten hast. Jetzt alles zeigen».

## Was fällt weg oder rutscht tiefer
- «Erste Schritte» mit drei Zeilen voller Knöpfe → «Starte hier» mit einem Hauptknopf; «Backup importieren» und «Teil hinzufügen» als zwei Knöpfe → Hauptknopf «Erstes Teil eintragen» und die Zeile «Backup von früher».
- Der grosse Rundgang-Kasten und der Muster-Rennen-Kasten → zwei leise Zeilen auf derselben Karte.
- «Heimort festlegen für das Wetter» und «Wetter-Seite ›» auf dem leeren Heute → Datumszeile («Wetter für deinen Wohnort ›»); sie erscheinen mit «Jetzt alles zeigen» und sobald Daten da sind.
- «Heute ist nichts dringend.», der leere Körper-Block («Verbinde Fitbit …») und «Jetzt dran / Impuls» auf dem leeren Heute → erst mit Inhalt, oder mit «Jetzt alles zeigen».

## Selbst entschieden
- Die Karte gilt, solange die drei Schritte nicht alle gemacht sind (wie bisher «Erste Schritte»); die Zeilen darüber verschwinden nur auf dem ganz leeren Heute.
- «Körper» gilt als Inhalt, sobald Fitbit-Werte gespeichert sind; «Jetzt dran» zählt, wenn etwas ansteht oder ein Impuls da ist.
- Heute mit Daten (Haken-Block, Körper-Banner) bleibt beim Prototyp-Thread; die Karte ist ein eigenes Bauteil (`StartHier.svelte`), damit Home.svelte nur wenige Zeilen ändert.
- Die Tests der alten Karte (Region «First steps», Knöpfe «Add your bike» usw.) sind auf die neue Karte umgestellt.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 23.11.2026: Leeres Heute = «Starte hier» (Noah «1-5a»): `docs/decisions/starte-hier.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Klarheit und Auffindbarkeit: V2 fertig; V4 (Kopf-Stapel, «Und jetzt?») folgt nach «Pfad-Zeile weg».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In einem frischen Browser öffnen und «Leer starten» wählen: Heute zeigt «Starte hier».
2. Hauptknopf «Erstes Velo erfassen»: führt zum Velo; danach heisst er «Erstes Teil eintragen».
3. «Jetzt alles zeigen» unter der Karte: das ganze Heute erscheint.
