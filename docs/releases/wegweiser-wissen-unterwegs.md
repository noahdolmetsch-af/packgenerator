# Gut zu wissen unterwegs (Wegweiser 15: Inhalte Unterwegs)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte auf der Seite) und Plan «freigabe» Schritt 1–26, Thread «Entdeckbarkeit versteckter Funktionen planen»

## Was ist neu
- Die Karte «Was du hier tun kannst» erscheint jetzt auch im Bereich Unterwegs: Unterwegs (`#/ride`), Vor der Abfahrt (`#/ride/abfahrt`), Berg (`#/mountain`), Wetter (`#/wetter`) und Skitour-Start (`#/ski/start`).
- Jede der 32 Funktionen dieser Seiten hat einen Satz «Gut zu wissen» (`src/lib/wissen/unterwegs.js`, Deutsch in `src/lib/i18n/de/wissen-unterwegs.js`).

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Der Inhalt von Vor der Abfahrt, Berg, Wetter und Skitour-Start rutscht um die Höhe der Karte tiefer, bis man sie mit × zuklappt (pro Seite gemerkt). Auf Unterwegs startet die Karte als eine Zeile, damit Helfer, «Tour beenden» und Notfall oben bleiben.

## Selbst entschieden
- Auf Unterwegs startet die Karte zugeklappt (`FOLDED_FIRST` in `seiteninhalt.js`), ein Tipp öffnet sie; die Wahl wird wie × gemerkt. Empfehlung an Noah per Entscheidkarte.
- Nicht auf der Live-Karte (Vollbild, eigener Thread) und nicht auf Heute.
- Nicht auf dem Werkzeugkasten (`#/me/tools`): die Werkzeuge gehören zu mehreren Bereichen; Sätze im Ausland, Zeitzonen und Lupe zeigen ihr «Gut zu wissen» schon auf der Werkzeug-Seite. So steht kein Tipp doppelt.
- Nicht auf Renn-Seiten mit Platzhalter (`#/race/:race/ride`), weil die Karte nur feste Seiten kennt.
- Notfall-Wissen nur mit sicheren Fakten: Rega 1414, 112, Schweizer Wegweiser-Farben.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17: Schritt 15 von 26 (Inhalte Unterwegs).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour starten (oder das Beispiel «Unterwegs») und Unterwegs öffnen: oben steht «Was du hier tun kannst» mit «Gut zu wissen».
2. Unterwegs › Vor der Abfahrt öffnen: die Karte zeigt einen Tipp zum Abfahrtsblatt.
3. × antippen: die Karte wird eine Zeile und bleibt so.
