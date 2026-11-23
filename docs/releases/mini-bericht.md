# Mini-Bericht als Bild

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «P1 und p2 k1 k2 k3 u1 u2 r1 r2 r3» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»), Vorschlag R3

## Was ist neu
- Im Teil «Danach» hat die Box «Rennbericht» neu den Knopf «Mini-Bericht als Bild»: ein Bild mit der Linie des Rennens und vier Zahlen (km, Höhenmeter, Fahrzeit, Tage), auf dem Gerät gemacht. Mit «Teilen» (Handy) oder «Speichern» (Computer) gehört es dir; wer nicht tippt, teilt nichts.
- Es ist dieselbe Karte wie das «Tourbild» im Rückblick einer Tour (`PostcardSheet.svelte`); für das Rennen nimmt sie die Linie des Rennens.

## Was fällt weg oder rutscht tiefer
- nichts. Der ausführliche Rennbericht (druckbare Seite) bleibt, wie er ist.

## Selbst entschieden
- Keine neue Bildmaschine: der Vorschlag «Bild mit Linie und vier Zahlen» gibt es schon als Tourbild; sie nochmals zu bauen wäre doppelt. Darum nur der Knopf nach dem Rennen.
- Die Zahlen sind die der Tourbild-Karte: aus den Fahrten dieser Tour (sonst aus der Route). Wer die Fahrten nicht hochgeladen hat, sieht km und Höhenmeter der Route und keine Fahrzeit.
- Das Foto ist freiwillig, wie beim Tourbild.

## Entscheide (eigene Datei `docs/decisions/mini-bericht.md`)
- 23.11.2026: R3 freigegeben (alle neun Vorschläge, siehe `docs/decisions/garmin-kurspunkte.md`)

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ein Rennen öffnen und zum Teil «Danach» gehen (das Muster-Rennen genügt).
2. In der Box «Rennbericht» «Mini-Bericht als Bild» tippen: ein Bild mit Linie und vier Zahlen erscheint.
3. «Teilen» oder «Speichern» tippen, oder schliessen: nichts wird von selbst geteilt.
