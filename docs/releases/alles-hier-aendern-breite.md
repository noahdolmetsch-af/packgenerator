# «Alles hier»: Die Liste bei «Ändern» passt aufs Handy

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 5, Thread «Durchklicken Etappe 5: Training und Auswerten»), Befund E5-001

## Was ist neu
- Aktiv, Auswerten, Touren, Velos und Material: Tippt man auf dem Handy bei «Alles hier» auf «Ändern», wurde die Liste breiter als der Bildschirm (446 statt 390 px) und der Knopf «Ausblenden» lag teils ausserhalb. Jetzt bleibt die Liste auf Bildschirmbreite; ist eine Zeile voll, rutscht «Ausblenden» unter den Namen.
- Ursache: Die Spalte der Liste war «auto» breit und wuchs bis zur breitesten Zeile (Griff, Name, zwei Pfeile, Knopf). Sie ist jetzt höchstens so breit wie ihr Kasten.

## Was fällt weg oder rutscht tiefer
- nichts. Auf dem Computer sieht die Liste gleich aus.

## Selbst entschieden
- Eine Datei (`AllHere.svelte`) für alle fünf Orte, gleiche Ursache. Der Name darf umbrechen, auch wenn ein einzelnes Wort sehr lang ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 5 (Aktiv, Auswerten): Befund E5-001 behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf dem Handy Aktiv öffnen, bei «Alles hier» auf «Ändern» tippen: die Seite lässt sich nicht seitwärts schieben.
2. Bei jeder Zeile ist «Ausblenden» ganz zu sehen; «Ausblenden» und dann «Rückgängig» bringt die Kachel zurück.
