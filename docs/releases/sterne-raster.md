# Sternkarten: Raster nach Platz statt nach Bildschirm

PR (offen) · 26.11.2026 · Auftrag: Koordinator (Nacht-Meldung 25.11., Fund «Hingebungsvoll» bricht bei 1366 px mitten im Wort um, Thread «Challenges nach Gelegenheit bauen»)

## Was ist neu
- Auf Meditation › Mehr › Alle Sterne (und überall, wo `MsBlock` die Sternkarten zeigt) legt das Raster die Karten jetzt nach dem Platz an, den es hat: so viele Spalten, wie mit je mindestens 13 rem Breite Platz haben.
- Vorher zählte das Raster nach der Bildschirmbreite (3 Spalten ab 900 px). Neben der Seitenleiste und der rechten Spalte ist die Seite aber schmaler als der Bildschirm; bei 1366 px waren die Karten so eng, dass «Hingebungsvoll» als «Hingebungsvol / l» brach (Gesamttest `flow-med-more de 1366px: words broken in the middle`).
- Auf grossen Bildschirmen bleibt es bei drei Spalten, auf dem Handy bei einer.

## Was fällt weg oder rutscht tiefer
- nichts. Auf einem 1366-px-Bildschirm stehen die Karten in zwei statt drei Spalten und sind dadurch etwas weiter unten.

## Selbst entschieden
- Eine Grösse für alle Orte, die `MsBlock` nutzen (Sportarten, Meditation, Hobbys): 13 rem pro Karte, damit auch die längsten Sternnamen ganz stehen.
- Die Liste «Zuletzt erreicht» (`.recent`) bekommt dieselbe Regel, damit beide Raster gleich reagieren.
- Keine neue Funktion, daher keine neue Zeile in `docs/app-stand.md`.

## Entscheide
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Meditation › Mehr › Alle Sterne in einem Fenster von etwa 1366 px öffnen: «Hingebungsvoll» steht ganz in der Karte.
2. Das Fenster breiter ziehen: die Karten wechseln auf drei Spalten.
