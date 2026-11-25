# Mein Tag: Abend-Rückblick in einer Minute

PR # · 25.11.2026 · Auftrag: Noah «1-3» (25.11.2026 00:08, Idee 2 von drei; Thread «Neue Seite «Mein Tag» bauen»)

## Was ist neu
- **Ab 18:00 heute und an jedem früheren Tag** (solange die Einträge noch in der Liste stehen) steht in «Mein Tag» eine **zugeklappte Zeile**: «3 Punkte sind noch offen» (`src/lib/tag/abend.js`).
- Aufgeklappt hat jeder **eigene** Punkt (To-do oder Termin aus «Eintrag hinzufügen») drei Knöpfe: **Erledigt**, **Auf morgen** (an einem früheren Tag **Auf heute**) und **Weg**. Jeder hat «Rückgängig». **Alles auf morgen** verschiebt alle eigenen Punkte auf einmal, mit einem «Rückgängig».
- Eine **Einheit aus dem Plan**, die nicht abgehakt ist, steht ebenfalls in der Liste und führt mit «Abhaken ›» in den Reiter «Abhaken».
- Am nächsten Morgen steht das Mitgenommene oben (ohne Zeit unter «Ohne Zeit», mit Zeit in der Zeitleiste).

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zeile steht nur abends und nur, wenn etwas offen ist. Sie ist zugeklappt, der Inhalt des Tages bleibt vorn.

## Selbst entschieden
- Offen heisst: nicht abgehakt, kein Vorschlag der App, bei einem Eintrag mit Uhrzeit heute: die Zeit ist vorbei (der Kinotermin um 20:00 zählt erst nach seinem Ende).
- Fremde Einträge (Google-Termine, Aufgaben, TrainingPeaks) kann die App nicht ändern; sie stehen nicht in der Liste. Einheiten sind die Ausnahme, weil Abhaken dafür schon einen Reiter hat.
- Zugeklappt statt offen, damit der Abend nicht schreit; die Zeile zeigt die Zahl schon im Titel.
- «Weg» löscht sofort mit «Rückgängig» (Regel «schnell wieder gemacht»); der Eintrag landet wie sonst in «Zuletzt gelöscht».
- Keine Datenänderung.

## Beitrag zu den Zielen und Leitfaden
- Klarheit: am Abend sieht man in einer Zeile, was offen ist, und hat drei klare Antworten.
- Auffindbarkeit: nichts fällt unbemerkt vom Tag, auch nicht gestern.
- Leitfaden (`docs/leitfaden.md`): ein Tag wird ordentlich abgeschlossen, ohne Suchen.

## Stand im Plan
- Idee 2 von 3 (Noah «1-3»). Offen: Idee 3 (Tagesvorlagen und Wiederholen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nach 18:00 «Mein Tag» öffnen: Zeile «N Punkte sind noch offen».
2. Aufklappen, «Auf morgen» tippen, «Rückgängig» tippen.
3. «Alles auf morgen»: die Zeile verschwindet, morgen stehen die Punkte.
4. Gestern öffnen: offene Punkte mit «Auf heute».
