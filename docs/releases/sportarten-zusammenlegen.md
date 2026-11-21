# Sportarten zusammenlegen

21.11.2026 · Auftrag: Noah «Ja, bauen» (Karte «Doppelte Sportarten zusammenführen», Sportjahr S8, Thread «Bauen: Sportjahr und Auswertung aller Sportarten»)

## Was ist neu
- **Zusammenlegen:** Zwei Sportarten, die dieselbe sind (Gym und eGym, Eishockey zweimal), werden eine. Alle Haken, Details (Dauer, Notizen), Timer-Vorlagen und die Strava-Zuordnung der ersten Sportart gehen zur bleibenden; die erste verschwindet aus den Listen.
- **Wo:** Menü «⋯» einer Sportart in «Meine Aktivitäten» (Eintrag «Zusammenlegen …»), im Bearbeiten-Fenster unter «Pause oder löschen» («Mit einer anderen Sportart zusammenlegen») und beim Hinweis «kommt zweimal vor» (zwei gleich benannte Sportarten, Knopf «Zusammenlegen …»).
- **Das Fenster** fragt «Welche Sportart bleibt?», sagt in einem Satz, wie viele Haken mitgehen, und was bleibt (Name, Ziele, Gruppe der bleibenden Sportart). Danach steht «Rückgängig» ein paar Sekunden da; es setzt jede Zeile genau so zurück, wie sie war, auch die Sportart selbst.
- Blockgrösse (`sport.blocks`) und übliche Dauer (`sport.usualMin`) der ersten Sportart gehen nur über, wenn die bleibende keine eigene hat. Kein Schema-Wechsel, keine neue Einstellung. Neue Dateien `src/lib/flow/zusammen.js`, `src/lib/flow/MergeSheet.svelte`; Tests `tests/zusammen.test.js` (mit Backup-Kopie) und `tests/e2e/zusammen.spec.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Es kommt nur ein Eintrag im Menü «⋯», ein Knopf im Bearbeiten-Fenster und ein Knopf am Hinweis dazu. «Löschen» und «Pause» bleiben, wie sie waren.

## Selbst entschieden
- **Wort «Zusammenlegen»** (wie bei Material «Zusammenlegen mit …»); «Zusammenführen» bleibt beim Backup einspielen (`docs/namen.md`, Zeile 30).
- **Ziele der ersten Sportart gehen nicht über:** die bleibende behält ihre eigenen Ziele; sonst würden Wochenziele sich verdoppeln. Beim Rückgängig sind die Ziele der ersten wieder da, weil die ganze Sportart zurückkommt.
- **Haken am selben Tag:** hatten beide Sportarten am selben Tag einen Haken, bleiben beide Haken erhalten (nichts wird gelöscht); wer will, löscht einen.
- **Nur ein Weg, kein neuer Eintrag im Katalog:** Zusammenlegen ist Teil von «Meine Aktivitäten» (Fertig-Regel Teil 1 bis 3 und 6: bestehende Funktion, app-stand-Zeile ergänzt, Absprung ist der Hinweis «kommt zweimal vor»).
- **Auch bei Strava-Haken:** Haken, die von Strava kamen, gehen mit; die Zuordnung «Strava-Sportart → Sportart» zeigt danach auf die bleibende Sportart.

## Entscheide (für decisions.md)
- Doppelte Sportarten lassen sich zusammenlegen, mit Rückgängig; nichts geht verloren (Noah 21.11.2026).

## Stand im Plan (roadmap.md / vorhaben.md)
- Sportjahr S8 gebaut. Offen: S11, S12, S5, S13, danach «Klügere Auswertungen».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Aktivitäten › «⋯» bei einer Sportart › «Zusammenlegen …»: das Fenster fragt, welche Sportart bleibt, und zeigt, wie viele Haken mitgehen.
2. «Zusammenlegen» tippen: die erste Sportart ist weg, die Haken zählen bei der anderen; «Rückgängig» bringt alles zurück.
