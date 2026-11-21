# Drei Kacheln mehr in «Alles hier» auf Aktiv

PR folgt · 21.11.2026 · Auftrag: Koordinator «tippzahl.spec (Handy) ist auf main rot», Folge von T1 «Geschafft»

## Was ist neu
- Die Karte «Alles hier» auf Aktiv zeigt drei Kacheln mehr: «Geschafft» (die Seite nach dem Abhaken), «Meditations-Protokoll» und «Mehr zur Meditation». Sie lagen mehr als 3 Tippser von Heute entfernt (`tests/e2e/tippzahl.spec.js`) und standen nicht in `TAP_GAPS`; jetzt führt ein echter Link hin (`src/lib/alleshier.js`).
- Der Test `tippzahl.spec.js` liest die Links einer Seite erst, wenn die Liste dreimal gleich war (250 ms Abstand, höchstens 15 s). Vorher las er zu früh, und die Liste der «zu tiefen» Seiten wechselte von Lauf zu Lauf. Es wird nichts gelockert: gezählt wird gleich, nur später und stabil. Patch vom Thread «Sportjahr».

## Was fällt weg oder rutscht tiefer
- nichts. `TAP_GAPS` bleibt unverändert (13 Einträge) und wird nicht länger.

## Selbst entschieden
- Keine neue Funktion in `features.js`: die drei Funktionen gibt es schon, sie bekommen nur eine Kachel.
- «Geschafft» steht zwischen «Wochen-Rückblick» und «Meditation», weil die Seite zum Abhaken gehört.

## Entscheide (für decisions.md)
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen, Karte «Alles hier»: «Geschafft», «Meditations-Protokoll» und «Mehr zur Meditation» sind dabei.
2. Auf eine tippen: die Seite öffnet sich.
