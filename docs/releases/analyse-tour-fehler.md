# Fix: Auswerten › Analyse lädt wieder (zwei Touren am selben Tag)

PR #<offen> · 31.10.2026 · Auftrag: Noah (Screenshot «Hier ist etwas schiefgelaufen», each_key_duplicate)

## Was ist neu
- Nichts Sichtbares. Die Seite Analyse zeigt wieder den Verlauf, auch wenn zwei Touren am selben Tag beginnen oder vor dem gezeigten Zeitraum beginnen.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ursache: Die Tour-Bänder im «Eigenen Diagramm» (und auf der Seite eines Werts) wurden nach ihrem Starttag unterschieden. Zwei Touren mit gleichem Starttag (oder beide vor dem Zeitraum) gaben denselben Schlüssel, Svelte brach ab. Neu zählt die Reihenfolge.
- Neuer Test mit zwei Touren am selben Tag; er war vorher rot.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.
