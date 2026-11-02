# Planen erklärt sich selbst (Wegweiser 13: Inhalte Planen)

PR #… · 02.11.2026 · Auftrag: Noah «1-5a» (Inhalte auf der Seite, Claude schreibt das Wissen) und Plan «freigabe» Schritt 1–26 (Thread «Entdeckbarkeit versteckter Funktionen planen»)

## Was ist neu
- Die Karte «Was du hier tun kannst» (aus Schritt 11 und 12) steht jetzt auch auf den Seiten von Planen: Woche, Merken, Termine, Notizen, Tagebuch, Eingang, Mail, Alltag (`ON_PAGES` in `src/lib/seiteninhalt.js`).
- «Gut zu wissen» für die 23 Funktionen dieser Seiten (`src/lib/wissen/planen.js`, Deutsch in `src/lib/i18n/de/wissen-planen.js`).

## Was fällt weg oder rutscht tiefer
- Der Inhalt dieser 8 Seiten rutscht um die Höhe der Karte tiefer, bis man sie mit × auf eine Zeile zuklappt (bleibt pro Seite gespeichert).

## Selbst entschieden
- Nur Seiten, auf denen mindestens eine Funktion zu Hause ist. «Woche planen» und «Erinnerungen» haben keine eigene Funktion und bekommen deshalb keine Karte.
- Kompass, Freie Zeit und Inspiration hatten die Karte schon (Bereich Lust).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 «Wegweiser statt Katalog»: Schritt 13 von 26.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen öffnen: oben steht «Was du hier tun kannst» mit «Gut zu wissen» pro Funktion.
2. Planen › Woche und Eingang: die Karte steht auch dort; × klappt sie auf eine Zeile zu.
