# Die Leiste unten gleitet

PR folgt · 03.11.2026 · Auftrag: Noah «b» (Thread «Durchgehen: offene Fragen einzeln», Paket A Seitenwechsel, Idee 3 von 5)

Ziel 5 «Alltag» (Entscheid 26.10.2026 «Bewegung überall sanft»), Idee aus `notes/ideen-bewegung-2026-11-03`.

## Was ist neu
- In der Leiste unten am Handy ist die helle Markierung hinter dem gewählten Ort jetzt ein einziges Stück, das in etwa 0,2 s von Ort zu Ort gleitet, statt zu springen (`src/lib/nav/PlaceBar.svelte`).
- Beim ersten Zeichnen steht sie einfach da; erst ein späterer Wechsel gleitet. Dreht man das Handy oder ändert sich die Textgrösse, folgt sie ohne Gleiten.
- Aus bei «Bewegung reduzieren» am Gerät und bei Ich › Darstellung › Bewegung «Aus»: die Markierung steht dann sofort am richtigen Ort.

## Was fällt weg oder rutscht tiefer
- nichts (die Farbe der Markierung und der fette Name des gewählten Ortes bleiben)

## Selbst entschieden
- Die Markierung wird aus der Lage des gewählten Symbols gemessen (nicht aus festen Zahlen), damit sie bei «Velos und Material» (zwei Zeilen), bei eigener Reihenfolge der Orte («Anpassen») und im Querformat stimmt.
- Vor der ersten Messung trägt das Symbol die Farbe selbst, so fehlt die Markierung nie, auch nicht für ein Bild.
- Die Leiste der kleinen Apps (`MiniBar`) und die Seitenleiste am Computer bleiben wie sie sind.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket A Seitenwechsel, Idee 3: gebaut. Folgen: 4 Einblenden, 2 Titel fliegt mit, 5 grosser Titel wird klein.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Am Handy unten «Touren» antippen: die helle Markierung gleitet von «Heute» zu «Touren».
2. Dann «Aktiv» antippen: sie gleitet weiter.
3. Am Computer: Seitenleiste wie vorher.
