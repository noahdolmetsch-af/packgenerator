# Heute nennt den Berg, der ruft

Auftrag: Noah 24.11.2026 «alle 1-5 zusammen» (Gipfelbuch ausbauen, Idee 5) und «1-5» (Tagessatz); Ziele Klarheit und Auffindbarkeit

## Was ist neu
- Der Satz «Heute geht es gut: welcher Berg ruft?» unter «Heute sind n Dinge dran.» nennt jetzt den Berg selbst (`src/lib/home/TagesSatz.svelte`, Regel `ruf` in `src/lib/home/tagessatz.js`). Die Rechnung kommt vom Gipfelbuch (`bergRuft`, `ruftSatz` in `src/lib/gipfelbuch-ruft.js`): ein Gipfel oder Pass der App-Liste, der noch nicht in deinem Gipfelbuch steht, mit Höhe und Entfernung von zu Hause.
  - Starker Tag und trocken: «Heute geht viel. Welcher Berg ruft? …» (der höchste in Reichweite).
  - Normaler Tag und trocken (ohne aktive Woche): ein ruhiger Hinweis mit dem nächsten Gipfel.
  - Ein Tipp öffnet die Gipfel-Karte (`#/flow/gipfelbuch/karte`).
- Ohne Heimatort, ohne trockenes Wetter oder ohne offenen Berg bleibt es beim bisherigen Satz (starker Tag) oder es steht nichts (normaler Tag). Im Winter zählt nichts ab 1800 m (Schnee).
- Die Liste und das Gipfelbuch laden erst, wenn die Seite ruhig ist und nur an einem trockenen Tag mit guter Antwort.

## Was fällt weg oder rutscht tiefer
- Nichts. Der Satz steht an derselben Stelle; er nennt nur mehr.

## Wie das zu Klarheit und Auffindbarkeit beiträgt
- Klarheit: ein konkreter Berg statt einer Frage.
- Auffindbarkeit: der Tipp führt direkt in die Gipfel-Karte mit den Lücken.

## Selbst entschieden
- **Wetter:** die Heute-Vorhersage kennt nur «trocken» oder «nicht trocken»; für `bergRuft` zählt «trocken» als 0 mm Regen, Wind kennt sie nicht (der Wert fehlt, dann gilt nur der Regen).
- **Normaler Tag:** ein Hinweis nur, wenn die Woche nicht aktiv war (der Satz «Eine aktive Woche liegt hinter dir» geht vor).
- **Fertig-Regel:** Absprung: der Tipp im Satz; Leer-Zustand: ohne Heimatort steht kein Berg; app-stand: Heute-Zeile ergänzt; kein neuer Eintrag in `features.js` (kein Seite).

## Entscheide
- `docs/decisions/tagessatz-berg.md`

## Stand im Plan
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heimatort setzen, Heute an einem guten, trockenen Tag öffnen.
2. Unter «Heute sind n Dinge dran.» nennt ein Satz einen Gipfel mit Höhe und Kilometern.
3. Satz antippen: die Gipfel-Karte öffnet sich. Auf das × tippen: der Satz ist für heute weg.
