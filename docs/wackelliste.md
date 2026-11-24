# Wackelliste

Ein Wackler ist ein Test, der ohne Änderung an der App mal grün und mal rot ist, oder der auf main rot wird, ohne dass eine App-Änderung dazu passt. Der Ablauf steht in `docs/regeln.md`, Block 7 («Wackel-Wächter»). Diese Liste führt der Thread «Wackel-Tests zuverlässig machen»; nur Testnamen und Ursachen, keine Daten.

**Stand:** `offen` = gemeldet, noch nicht stabil (hat Vorrang vor neuen PRs); `beobachten` = einmal gesehen, Ursache unklar; `stabil` = Ursache behoben, 3× pro Gerät grün.

| Test (Datei:Zeile) | Gerät | Gesehen | Ursache | Fix | Stand |
|---|---|---|---|---|---|
| tote-knoepfe.spec.js:28 | Handy | 24.11. | Netz aus, bevor die nachgeladene Seite «Hinweise» da war | #1731 | stabil |
| rueckblick-design.spec.js (Knöpfe 44 px) | Computer | 24.11. | kleine Knöpfe (`.btn.sm`) sind mit Maus 32 px, 44 nur bei Touch | #1727 | stabil |
| wochenrueckblick-mehr.spec.js (Notiz/Ziel) | beide | 24.11. | Neuladen vor dem fertigen Speichern | #1727 | stabil |
| bedienung.spec.js:31 | Computer | 24.11. | «n» kam, bevor das geschlossene Fenster seinen Verlaufsschritt abgegeben hatte | #1713 | stabil |
| landscape (Tour quer, 844×390) | Handy | 24.11. | echter App-Fehler: leere Zeile im Tour-Band, 16 px zu breit | #1712 | stabil |
| guard.spec.js Gruppe 3 («0 page titles») | Handy | 24.11. | unter Last wird die Überschrift zweimal gleich «0» gemessen | – | beobachten |
| tages-check.spec.js:349 (Sonntagsfrage) | beide | 24.11. | unklar, unter Last gesehen | – | beobachten |
| ride-running 320 px, gt20-touren:67, uebergaenge:138, pf Szenario 3, pinmarks:52 | – | 24.11. | unklar, je einmal gesehen | – | beobachten |

Ältere, behobene Fälle (rund 30 seit 23.11.2026) mit Ursache: Notiz des Wackel-Threads im Projektordner (`notes/wackel-tests/`).
