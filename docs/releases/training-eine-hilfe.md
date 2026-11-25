# Training: eine Hilfe-Zeile

PR #1783 · 17.11.2026 · Auftrag: Noah «alle umsetzen 1-10» (Thread «UI-Test der Seite Flow Training», Fund 2)

## Was ist neu
- Auf Training steht nach dem Einklappen der Einstiegskarte nur noch die Zeile «Was du hier tun kannst». Vorher stand darunter eine zweite Zeile «So geht's», beide öffneten Hilfe. Am Handy rückt alles darunter um eine Zeile nach oben.

## Was fällt weg oder rutscht tiefer
- Die gefaltete Zeile «So geht's» auf Training fällt weg. Beim ersten Besuch ist die Einstiegskarte weiter offen. Danach steht ihr Inhalt im Handbuch und in «Was du hier tun kannst». Das Wiederöffnen der Karte über «So geht's» gibt es auf Training nicht mehr.

## Selbst entschieden
- Nur auf Training (neues Merkmal `quiet` an `AreaIntro`), nicht auf allen Seiten, damit der PR klein bleibt. Andere Seiten mit zwei Hilfe-Zeilen kann man später gleich behandeln.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training: Einstiegskarte «Einklappen» tippen.
2. Unter dem Titel steht nur «Was du hier tun kannst».
