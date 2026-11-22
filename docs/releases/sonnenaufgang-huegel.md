# Sonnenaufgang auf dem Hügel

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N9

## Was ist neu
- Touren › Träume, unter «Zug hin, Velo heim»: «Sonnenaufgang auf dem Hügel» (`src/lib/dreams/SunTip.svelte`). Der nächste klare Morgen und Abend aus der Prognose für den Wohnort, mit Sonnenaufgang bzw. -untergang und «Los um …».
- Klar heisst: höchstens 30 % Wolken und höchstens 20 % Regen in der Stunde (`src/lib/dreams/sonne.js`). Die Sonnenzeiten rechnet die App selbst (wie bei der Live-Karte).
- Mit einem eigenen Punkt «Aussicht» bis 15 km vom Wohnort nennt der Tipp ihn mit km und rechnet die Fahrzeit ein; sonst «auf einen Hügel in der Nähe» (30 Min.).
- Die Prognose fragt neu auch die Wolken pro Stunde ab (`src/lib/weather.js`, gleiche Anfrage an Open-Meteo, ein Wert mehr).
- Neue Funktion im Katalog: `f.suntip`.

## Was fällt weg oder rutscht tiefer
- Träume: «Alle Träume auf einer Karte», «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um diesen Teil nach unten.

## Selbst entschieden
- Der Teil bleibt weg, solange die gespeicherte Prognose noch keine Wolken kennt (bis zur nächsten Abfrage, höchstens 3 Stunden).
- Kein eigener Hügel-Katalog: deine Aussichtspunkte sind die Hügel.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 16 von 20 (N9). Als Nächstes N19 «Abenteuer-Würfel».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: «Sonnenaufgang auf dem Hügel» nennt einen klaren Morgen oder Abend (oder sagt, dass noch keiner kommt).
2. Auf der Karte nahe bei zu Hause einen Punkt «Aussicht» setzen: der Tipp nennt ihn mit km.
