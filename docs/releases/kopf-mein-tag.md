# Mein Tag: schlanker Kopf

PR # · 24.11.2026 · Auftrag: Noah «3a» (Impeccable-Prüfung, 23.11.2026 21:15): schlanker Kopf in Mein Tag, To-dos und Abhaken auf dem Handy

## Was ist neu
- Der Satz unter dem Titel («Dein Tag auf einen Blick …», «Alles, was noch offen ist …», «Ein Tipp hakt eine Sportart …») ist weg: auf den Titel folgen Reiter, Tage und der Inhalt.
- Auf dem Handy (bis 520 px) stehen «Eintrag hinzufügen» und «Tag planen lassen» in **einer** Zeile (bei 360 px brechen sie um, das ist gewollt).
- Am Computer ändert sich nichts ausser dem fehlenden Satz.

## Was fällt weg oder rutscht tiefer
- Weg: die drei Sätze unter dem Titel. Sie sagten, was die Knöpfe und Reiter schon sagen.
- Die Knöpfe sind auf dem Handy etwas kleiner (kleinere Schrift, weniger Rand), damit sie in eine Zeile passen. Sonst nichts.

## Selbst entschieden
- Die Prüfung wollte den Satz «Was jetzt?» ins zugeklappte «?». Mein Tag hat dort noch keine eigene Hilfe (Seite nicht in `ON_PAGES`); sie nur dafür anzuschalten wäre ein eigener PR mit «Gut zu wissen»-Text. Der Satz war doppelt, darum ersatzlos weg. Die Hilfezeile «Was du hier tun kannst» bleibt, wie sie ist.
- Der Pfad (Zeile über dem Titel) und der Orts-Reiter gehören dem Quer-Thread und PR 1514; der Titel steht darum bei 390 px bei etwa 216 px, nicht bei 200. Erste Bedienelemente stehen weit vor 450 px (Tage bei 330, Knöpfe bei 430).
- `SeitenInhalt.svelte` ist nicht angefasst.
- Drei nicht mehr benutzte deutsche Texte aus `meintag.js` entfernt.
- Keine Datenänderung.

## Beitrag zu den Zielen (Noah 18:09) und Leitfaden
- Klarheit: eine Hauptsache pro Bildschirm, der Inhalt beginnt früher.
- Auffindbarkeit: die zwei häufigsten Aktionen stehen in einer Zeile gleich unter den Tagen.
- Leitfaden (`docs/leitfaden.md`): Inhalt zuerst, Hilfe bleibt zugeklappt.

## Stand im Plan
- Schlanker Kopf (3a) erledigt. Offen: Schritt 5 (Woche und Kalender ersetzen), Schritt 6.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. «Mein Tag» auf dem Handy: unter dem Titel Reiter, Tage, dann eine Zeile mit den zwei Knöpfen.
2. «To-dos» und «Abhaken»: auf den Titel folgt gleich der Inhalt.
3. Am Computer: wie vorher, nur ohne Satz unter dem Titel.
