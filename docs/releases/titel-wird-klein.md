# Der Titel bleibt oben

PR folgt · 03.11.2026 · Auftrag: Noah «b» (Thread «Durchgehen: offene Fragen einzeln», Paket A Seitenwechsel, Idee 5 von 5)

Ziel 5 «Alltag» (Entscheid 26.10.2026 «Bewegung überall sanft»), Idee aus `notes/ideen-bewegung-2026-11-03`.

## Was ist neu
- Scrollt man eine Seite mit grossem Titel nach unten, bleibt ihr Name oben als kleine Zeile stehen (am Handy unter der oberen Leiste, am Computer ganz oben) und blendet in etwa 0,18 s ein. Scrollt man zurück, geht die Zeile und der grosse Titel ist wieder da.
- Die Zeile braucht keinen Platz (ein «klebendes» Kästchen ohne Höhe): auf keiner Seite verschiebt sich etwas. Sie fängt keine Tipps ab und wird nicht vorgelesen (die Seite behält ihre eine echte Überschrift).
- Aus bei «Bewegung reduzieren» und bei Bewegung «Aus»: sie erscheint dann sofort, ohne Einblenden.
- Umsetzung: `src/lib/nav/MiniTitle.svelte`, eine Zeile in `App.svelte`. Keine Seite wurde geändert.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- «Schrumpft» umgesetzt als: der grosse Titel scrollt wie bisher weg, und sein Name bleibt als kleine Zeile (kein Verkleinern des grossen Titels selbst; das hätte jede Seite einzeln umgebaut).
- Seiten, die selbst eine Leiste oben festhalten (zum Beispiel die Suchzeile bei Material), behalten sie. Dort bleibt die kleine Zeile weg, damit sie keine Leiste mit Knöpfen verdeckt.
- Titel ist die erste sichtbare Überschrift der Seite (`main h1`). Eine Seite ohne grosse Überschrift (zum Beispiel Heute) hat keine Zeile.
- Die Zeile beginnt dort, wo der grosse Titel begann.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Idee 5: gebaut. Damit sind alle fünf Ideen des Pakets gebaut (Idee 2 nur für Tour-Namen).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen und ein Stück nach unten scrollen: «Touren» bleibt oben als kleine Zeile stehen.
2. Wieder ganz nach oben: die Zeile geht.
3. Material öffnen und scrollen: die Suchzeile bleibt oben, keine kleine Titelzeile.
