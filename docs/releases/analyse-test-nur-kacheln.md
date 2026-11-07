# Test «Aktiv heute: Punkte decken keinen Namen» läuft ruhig

PR #<Nummer> · 07.11.2026 · Auftrag: Thread «Plane Entdecken und Sammeln» (rot auf #1094, auch auf main reproduzierbar)

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/analyse.spec.js` («Aktiv heute: the dots never cover a name») war rot (`Cannot read properties of null (reading 'x')`).
- Ursache: Der Test nahm **jedes** `li` in der Karte «Aktiv heute». Dort stehen unter den Kacheln auch die Wochensterne als Listen. Sie haben weder Namen noch «•••», also gab es kein Rechteck zum Messen.
- Jetzt zählt der Test nur Kacheln mit einer Aktivität (`li:has([data-act])`) und wartet, bis die «•••» gezeichnet ist. Geprüft wird weiterhin dasselbe: jeder Name endet links von seinem «•••».

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die App (`TickGrid.svelte`, `ActsTile.svelte`) bleibt unberührt. Keine «Was ist neu»-Datei, `docs/app-stand.md` bleibt gleich, weil sich nichts an den Funktionen ändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `e2e (phone)` und `e2e (desktop)` zeigen für `analyse.spec.js` grün.
