# Test «Haustür, Plan B am Abend»: Neuladen wird wiederholt, wenn es abgebrochen wird

PR #1783 · 24.11.2026 · Auftrag: Regel 3 (Thread «Wackel-Tests zuverlässig machen»; `haustuer.spec.js:150`, lokal 1 von 3 rot unter Last: `page.reload: net::ERR_ABORTED`)

## Was ist neu
- Nichts in der App. Wer das Fenster «Plan B» mit «Heute nicht» schliesst, löst einen Schritt zurück im Verlauf aus (`backclose.js`), der einen Moment später kommt. Lud der Test genau in diesem Moment neu, brach der Browser das Neuladen ab.
- Der Test versucht das Neuladen jetzt bis zu 15 Sekunden wieder. Danach prüft er wie vorher: Heute zeigt die Begrüssung, das Fenster «Plan B» ist weg («Heute nicht» gilt auch nach dem Neuladen).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert: dieselben Prüfungen nach dem Neuladen; nur das abgebrochene Neuladen wird wiederholt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e` grün. In der App nichts zu prüfen.
