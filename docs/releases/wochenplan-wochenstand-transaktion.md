# Wochenplan: Wochenstand in einem Zug lesen und schreiben

PR #NNN · 26.11.2026 · Auftrag: Reparatur von main (Bündler, Vorrang); die Änderung stammt aus dem Wochenplan-Thread (dort Commit 81b3091 in PR 1795), hier allein, damit main wieder grün wird

## Was ist neu
- Nichts Sichtbares geändert. Der Test `wochenplan-abhaken.spec.js:121` («Strava only suggests; past weeks stay as they were») ist seit PR 1783 auf main rot.
- **Ursache:** Die Wochenplan-Seite schrieb den Wochenstand (`training.weeklog`) aus dem Stand zurück, den sie früher gelesen hatte. Ein spätes Zurückschreiben überschrieb eine gerade gespeicherte Woche (seit PR 1783 laufen beim Laden mehr solche Schreibvorgänge). Für Noah hiesse das: eine eben abgehakte oder gespeicherte Einheit könnte in seltenen Fällen wieder verschwinden.
- **Fix:** `saveSnapshot` in `src/pages/flow/Wochenplan.svelte` liest und schreibt den Wochenstand in einer Datenbank-Transaktion, ausgehend vom gerade gelesenen Wert. Gleicher Inhalt wie in PR 1795 (kein Konflikt beim Zusammenführen).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nur diese eine Änderung aus 1795 übernommen, ohne den Fokus (Intervalle/Kraft) und ohne Neuheiten-Zeile, weil nichts Sichtbares dazukommt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Wochenplan: eine Einheit abhaken, Seite neu laden, die Einheit bleibt abgehakt.
