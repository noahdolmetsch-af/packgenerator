# Dein Körper heute in einem Band (Schritt 4: Platz unter dem Gruss)

Auftrag: Noah «1-4a» (23.11.2026, Thread «Körper-Banner auf Heute bauen»), Punkt 1a: das Band direkt unter dem Gruss, weiterhin verschiebbar und ausblendbar.

## Was ist neu
- «Dein Körper heute» ist die erste Kachel der Heute-Wand und steht im Bereich «Jetzt» direkt unter dem Gruss, nicht mehr unter «Mehr» (`SECTION_OF.body` in `src/lib/home/sections.js`, `READY` in `src/lib/home/tiles.js`).
- Eine bereits gespeicherte Heute-Wand rückt die Kachel einmal an den ersten Platz (Wand Version 22, `withBanner`). Wer sie schon weggenommen hat, bekommt sie nicht zurück; wer sie danach verschiebt, behält seine Ordnung.
- Verschieben, Grösse ändern und Wegnehmen gehen wie bei jeder Kachel («Startseite anpassen»).

## Was fällt weg oder rutscht tiefer
- «Meine Tour» (nur bei einer geplanten Tour) und die Karten darunter rutschen um eine Kachel nach unten (Platz 2 statt 1).
- Der Bereich «Dein Körper» unter «Mehr» hat die Kachel nicht mehr; Aktiv, VO2max und die anderen Körperwerte bleiben dort.

## Selbst entschieden
- Das Band steht auch vor «Meine Tour»: Noah wollte es direkt unter dem Gruss.
- Der Bereich «Dein Körper» unter «Mehr» bleibt mit seinen anderen Kacheln. Verbirgt jemand diesen Bereich, bleibt das Band trotzdem sichtbar, weil es jetzt in «Jetzt» liegt.
- Keine Datenänderung ausser der Wand-Einstellung `homeWall` (Version 22, gleiche Kacheln, nur eine neue Reihenfolge); ein Backup im alten Format wird beim Einlesen umgestellt (Tests in `tests/heute-a.test.js`).

## Entscheide (eigene Datei `docs/decisions/koerper-banner.md`)
- keine neuen (gilt: 23.11.2026, 1–4 a, Punkt 1a)

## Stand im Plan (roadmap.md / vorhaben.md)
- Körper-Banner: Schritt 4 von 4 gebaut; damit ist das Band fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: direkt unter dem Gruss steht «Dein Körper heute».
2. «Mehr» öffnen: Aktiv und die anderen Körperwerte sind noch da.
3. «Startseite anpassen»: das Band lässt sich verschieben und wegnehmen.
