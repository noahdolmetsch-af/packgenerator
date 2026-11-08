# Die Hilfe-Karte startet als eine Zeile

PR #<Nummer> · 08.11.2026 · Auftrag: Noah «1-5 a» (Frage 1a) aus dem UX-Test, Thread «Bauen: Hilfe-Karte als eine Zeile»

## Was ist neu
- Auf jeder Seite mit der Karte «Was du hier tun kannst» startet sie als **eine Zeile** («Was du hier tun kannst · 3 · Aufklappen»). Vorher standen auf rund 100 Seiten 3 bis 4 ganze Blöcke vor dem Titel, am Handy bis zu 1380 px hoch (UX-Test 08.11.2026, `FOLDED_FIRST` in `src/lib/seiteninhalt.js`, Wegweiser 26a). Ein Tipp öffnet die Karte, die Wahl wird pro Seite gemerkt wie bisher.
- Ich › Aussehen › «Karten auf den Seiten» ist umgedreht: sie zählt jetzt die Seiten, auf denen du die Karte **geöffnet** hast, und «Alle Karten wieder einklappen» schliesst sie (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- Die offene Karte oben auf den Seiten, die sie bisher offen zeigten (zum Beispiel Rückblick, Träume, Verpflegung, Vorlagen, Logbuch, Woche, Merken, Notizen, Tagebuch, Wetter): sie ist jetzt eine Zeile; ein Tipp öffnet sie wie vorher. Wer eine Karte schon selbst geöffnet hatte, behält sie offen.
- «Alle Karten wieder aufklappen» (Aussehen) → «Alle Karten wieder einklappen»: der Knopf macht jetzt das Gegenteil, weil alles zu startet.

## Selbst entschieden
- Eine Zeile für alle Seiten (nicht nur für die im Bericht genannten): `FOLDED_FIRST` ist jetzt `ON_PAGES`. So gibt es keine zwei Arten mehr, und neue Seiten beginnen automatisch mit der Zeile.
- Die Gruppen-Karte «Gehört zu …» und «Alles hier» bleiben, wie sie sind (anderes Thema, eigene Regel in `kartenzeile.js`).
- Die Reihenfolge der Blöcke in der Karte ändert sich nicht (Bericht 2a, zweiter Teil: eigener Schritt).

## Entscheide (für decisions.md)
- 08.11.2026: Die Karte «Was du hier tun kannst» startet auf allen Seiten als eine Zeile (Noah «1-5 a», Frage 1a; ersetzt die Liste der Seiten vom 02.11.2026).

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 Wegweiser statt Katalog: kein neuer Schritt; die Karte steht nicht mehr vor dem Seitentitel.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Traumtouren öffnen: oben steht der Seitentitel, die Karte ist eine Zeile «Was du hier tun kannst». Darauf tippen: sie öffnet sich.
2. Ich › Aussehen › «Karten auf den Seiten»: dort steht «Seiten mit offener Karte: 1». «Alle Karten wieder einklappen» tippen, dann Rückgängig.
