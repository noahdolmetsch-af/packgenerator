# Test «Tote Knöpfe»: «Aktualisieren» bei Hinweisen erst, wenn die Seite da ist, dann offline

PR #1731 · 24.11.2026 · Auftrag: Regel 3 (Thread «Wackel-Tests zuverlässig machen»; `tote-knoepfe.spec.js:28`, am Handy rot auf main)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für die toten Knöpfe. Der Test schaltete das Netz aus, sobald `#/me/hinweise` aufgerufen war. Die Seite ist ein nachgeladenes Stück (lazy chunk); fehlt es beim Ausschalten noch, lädt die App neu und landet auf der Offline-Seite des Browsers. «Aktualisieren» ist dann nie da (Zeitüberschreitung nach 90 s).
- Der Test wartet jetzt (auf den Zustand, nicht auf Zeit), bis «Aktualisieren» sichtbar ist, und geht erst dann offline. Dieselben Prüfungen wie vorher.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert, keine feste Wartezeit. Lokal 3 frische Läufe grün (Handy und Computer); vorher am Handy jedes Mal rot.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
