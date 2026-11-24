# Test «Fast geschafft»: prüft jetzt wirklich, dass keine Zeile kommt

PR #<Nummer> · 24.11.2026 · Reparatur von main (Auftrag: Koordinator, «Main-Fixes haben Vorrang»). Nichts Sichtbares in der App, nur ein Test.

Ziele von Noah (23.11.2026): **Klarheit** und **Auffindbarkeit** bleiben unberührt; der Test schützt, dass die Zeile «Fast geschafft» nur kommt, wenn ein Stern wirklich nah ist. Leitfaden: «Eine App, die mich im Alltag unterstützt».

## Was ist neu
- `tests/e2e/fast-geschafft.spec.js`, Test «no line when no star is close»: Vorher lief er nur grün, weil die Meldung nach 4 Sekunden von selbst verschwand. Das erste Abhaken einer Woche bringt «Wochen in Folge» in Reichweite (1 von 2), die Zeile stand also wirklich da. Seit «Rückgängig» 8 Sekunden bleibt (#1631) und auf dem Handy der Finger die Meldung hält, blieb sie stehen und der Test wurde rot (nur Handy).
- Jetzt schaltet der Test den Stern «Wochen in Folge» für «Laufen» aus (`flow.msTune`), damit kein Stern nah ist. Dann geht das Abhaken gleich zur Seite «Geschafft», und es steht weder die Zeile noch die Meldung da (so verhält sich `TickGrid.svelte`).

## Was fällt weg oder rutscht tiefer
- nichts. Keine App-Änderung.

## Selbst entschieden
- Der Test wird nicht gelockert: er prüft jetzt eine Sache, die vorher nur zufällig stimmte. Der andere Test derselben Datei (Zeile bei nahem Stern) bleibt unverändert.
- Kein Daten-, Backup- oder `api/`-Eingriff.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte
1. Nichts in der App zu prüfen. CI: `e2e (phone)` und `e2e (desktop)` für `fast-geschafft.spec.js` grün.
