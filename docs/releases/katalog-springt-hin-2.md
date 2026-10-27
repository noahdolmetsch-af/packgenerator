# Der Katalog zeigt zwei weitere Stellen

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «c und d zusammen», Teil c, Schritt 2 (Thread «332 Use Cases sichtbar machen»)

## Was ist neu
- «Folgen vorher sehen» und «Nach Bedürfnis packen» stecken im Fenster «Material ergänzen» auf Packen. Ein Tipp im Katalog «Was die App alles kann» öffnet jetzt Packen, dann das Fenster, und lässt den Knopf kurz aufleuchten.
- `src/lib/know/spot.js`: zwei neue Einträge. Nach jedem angetippten Zwischenschritt wartet der Sprung 250 ms, damit das Fenster offen ist, bevor der nächste Schritt sucht.
- Beide Knöpfe «Material ergänzen» (Text am Computer, + am Handy) tragen `data-add-mat`, damit der Sprung auf beiden Grössen denselben Weg nimmt.
- `heimat.js`: die zwei haben den Grund `spot` statt `name`.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Wasser und Werkstätten unterwegs» bleibt vorerst ohne Sprung: der Teil erscheint nur bei einer Tour mit GPX-Strecke.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- 332 Use Cases sichtbar: Teil c hat jetzt 9 Sprungziele.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne «Was die App alles kann» und suche «Nach Bedürfnis packen».
2. Tippe den Eintrag an: Packen öffnet sich, dann das Fenster «Material ergänzen», und «Nach Bedürfnis packen» leuchtet kurz auf.
3. Dasselbe mit «Folgen vorher sehen»: «Vorher ansehen, was sich ändert» leuchtet auf.
