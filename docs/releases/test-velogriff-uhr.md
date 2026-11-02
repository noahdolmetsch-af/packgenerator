# Test: Velogriff nutzt die echte Seitenuhr

**Was geändert:** Nur ein Test (`tests/e2e/velogriff.spec.js`). Er rechnet «heute» jetzt mit der echten Uhr
(`globalThis.__realDate`), wie die Seite. Vorher war er nach anderen Tests im gleichen Lauf um Tage verschoben und
schlug in der CI-Reihenfolge fehl («Not today», `[data-wet-chain]`).

**Was fällt weg:** nichts.

**Selbst entschieden:** `clock.js` nicht importiert, weil `setFixedTime` dort die Verschiebung mitten im Test auf 0 setzt.

**Entscheide / Plan:** keine Änderung an roadmap, vorhaben oder decisions. Weitere Specs ohne `clock.js` mit Datumsrechnung
stehen auf der Flake-Liste (2a).
