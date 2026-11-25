# Test «Knöpfe»: Klick neben das offene Menü

PR #1783 · 23.11.2026 · Auftrag: Noah «ja» (Thread «Wackel-Tests zuverlässig machen»)

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/knoepfe.spec.js` (Computer, «die Blase beim Darüberfahren …») war im Nachtlauf rot, auch im zweiten Versuch (lokal 2 von 4 Läufen).
- Ursache: Am Ende klickt der Test auf den Titel «Pflege», um das offene «…»-Menü zu schliessen. Der Titel ist ein Block so breit wie die Seite; Playwright klickt seine Mitte. Das Menü wächst mit der Zeile («Ersetzen», «Erledigt», «Prüfen», Anleitung …) und liegt je nach Zeile über dieser Mitte. Playwright wartete dann 90 Sekunden auf einen Klick, der nie ankam.
- Jetzt klickt der Test auf den linken Rand des Titels (`position: { x: 4, y: 4 }`), wo nie ein Menü liegt. Geprüft wird weiter dasselbe: ein Klick neben das Menü schliesst es. Lokal 20 von 20 Läufen grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die App war in Ordnung (Bild des Fehlschlags geprüft: das Menü liegt über der Titelmitte, wie vorgesehen), darum nur der Test geändert.
- Keine «Was ist neu»-Datei und kein Entscheid: nichts Sichtbares, nichts, was später gilt.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `knoepfe.spec.js` (Computer) ist grün.
