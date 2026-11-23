# Handy-Prüfungen repariert

PR #<Nummer> · 23.11.2026 · Auftrag: Bündler «ein Test-Fix-PR für die roten Handy-Specs» (Thread «Sync»)

## Was ist neu
- Nichts in der App. Drei automatische Prüfungen der Handy-Ansicht passen wieder zu dem, was die App seit V5 zeigt:
  - `allesfinden2.spec.js` AF2-3: «Vorrat» und «Ausgeliehen» sind Chips unter «Velos und Material › Material» (die Prüfung las einen Ort `gear`, den es nicht mehr gibt).
  - `setup-rig.spec.js`: «Mein Setup» ist ein Chip (`nav.psubs`) unter dem Reiter «Velos».
  - `pf.spec.js` PF04: eine Tasche kann sich beim Laden von selbst öffnen; die Hilfsfunktion `openAllBags` zählt vor jedem Klick neu.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Keine Prüfung gelockert oder übersprungen: die Absicht ist dieselbe, nur der Ort (Chip statt Reiter) ist neu.
- PF13 lief lokal grün (in der CI rot); ich habe nichts daran geändert, bis sich ein Grund zeigt.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App; die Prüfung der Handy-Ansicht (`e2e (phone)`) läuft wieder grün.
