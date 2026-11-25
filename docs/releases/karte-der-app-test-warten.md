# Karte der App: der Test wartet auf das Merken statt 1,5 Sekunden

PR #1783 · 24.11.2026 · Auftrag: Noah «beheben» (Thread «Wackel-Tests zuverlässig machen», `karte-der-app.spec.js:32`)

## Was ist neu
- Nichts in der App. Nur der Test: er wartete fest 1500 ms, bis die Seite als «geöffnet» gemerkt war (die App merkt sich einen Besuch erst, wenn der Titel still steht). Auf einem vollen CI-Rechner reichte das manchmal nicht. Jetzt wartet er, bis der Besuch in der Datenbank steht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Geprüft wird derselbe Zustand wie vorher (Besuch gemerkt), nur ohne feste Zeit. Nichts gelockert.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
