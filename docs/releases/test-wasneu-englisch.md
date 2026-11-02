# Test: Was ist neu auf Englisch, auch ohne kleine Punkte

**Was geändert:** Nur ein Test (`tests/e2e/wasneu2-kiaus.spec.js`, «English»). Er suchte immer eine Box-Beschriftung
(`.vn-kt`), die es nur gibt, wenn die neueste Version «kleine Dinge» hat. Hat sie keine, war der Test rot. Jetzt prüft
er immer den Knopf «Try it» und die Box-Beschriftung nur, wenn es kleine Dinge gibt.

**Was fällt weg:** nichts.

**Selbst entschieden:** Nichts gelockert: die englische Prüfung bleibt, sie hängt nur nicht mehr vom Inhalt der neuesten News ab.

**Entscheide / Plan:** keine Änderung an roadmap, vorhaben oder decisions.
