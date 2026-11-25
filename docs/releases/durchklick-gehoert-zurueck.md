# «Gehört dazu» unter dem Titel; «Zurück» nennt die Herkunft

PR #1783 · 23.11.2026 · Auftrag: Noah «2a» und «3a» (Warteliste 2, Durchklick-Funde 2 und 3)

## Was ist neu
- **Fund 2:** Die Zeile «Gehört zu: …» stand vor dem Titel (am Handy rutschte der Titel bis y=350). Jetzt ist sie auf allen Seiten, die sie zeigen (Packen, Touren, Ich, Velos, Material, Rückblick, Neuland, Wetter), eine geschlossene Zeile mit Zahl («Gehört zu: Planen 12») hinter dem Titel und hinter «Was du hier tun kannst». Ein Tipp öffnet die Knöpfe, «Zuklappen» schliesst sie wieder; die Wahl wird gemerkt (`src/lib/know/GehoertDazu.svelte`, `src/lib/ui/nachtitel.js`, `src/lib/ui/kartenzeile.js`).
- **Fund 3:** Der Pfad einer Seite mit einem Schritt («‹ Touren › Wetter») nennt den Ort, von dem du kamst («‹ Heute › Wetter»), und führt dorthin zurück. Wer die Seite direkt öffnet, sieht den Ort, zu dem sie gehört (Gewicht: Auswerten statt «Ich»). Die Seitenleiste markiert weiter den Ort der Seite. Tiefere Pfade (Velo › Pflege › Verschleiss) bleiben wie sie sind (`src/lib/nav/zurueck.js`, `herkunft.svelte.js`; VeloHead, PathHead, Crumbs).

## Was fällt weg oder rutscht tiefer
- «Gehört zu: …» steht nicht mehr vor dem Titel, sondern als geschlossene Zeile dahinter; die Knöpfe sind einen Tipp tiefer, auch am Computer. Alle Knöpfe und «alle n ›» bleiben.
- Der feste erste Schritt «‹ Touren» (oder «‹ Ich») eines kurzen Pfades ist nur noch der Weg, wenn du direkt kamst; sonst steht dort die Herkunft. Den Ort der Seite zeigt die Seitenleiste.

## Selbst entschieden
- Die Zeile behält den Namen des Moments («Gehört zu: Planen») statt nur «Gehört dazu», weil er mehr sagt.
- Nur Pfade mit **einem** Schritt ändern sich; bei mehreren Schritten wäre eine Herkunft mitten im Pfad irreführend.
- Die Herkunft wird nur im Speicher gehalten (nicht in der Sitzung): nach einem Neuladen oder über einen Link gibt es keine, dann gilt der Ort der Seite.

## Entscheide (eigene Datei `docs/decisions/durchklick-gehoert-zurueck.md`)
- 22.11.2026: Noah «2a», «3a».

## Stand im Plan
- Warteliste 2 (Durchklick): Funde 1 bis 4 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: hinter dem Titel steht die Zeile «Gehört zu: …»; antippen öffnet die Links.
2. Auf Heute das Wetter öffnen: oben steht «‹ Heute › Wetter»; antippen führt zurück.
3. Die Wetter-Adresse direkt in einem neuen Tab öffnen: oben steht «‹ Touren › Wetter».

Keine Datenänderung (nur die Wahl offen/zu der Zeile, wie bei den anderen Kartenzeilen).
