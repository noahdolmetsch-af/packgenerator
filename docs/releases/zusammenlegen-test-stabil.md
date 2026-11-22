# Test «Zusammenlegen-Liste» misst wieder ruhig

PR #<Nummer> · 07.11.2026 · Auftrag: Koordinator (roter Test blockiert u. a. #1011), Thread «Fix roter Test Zusammenlegen-Liste»

## Was ist neu
- Nichts in der App. Nur der Test `tests/e2e/zusammenlegen-liste.spec.js` (Handy) war rot: Er las die Zeilen der Vorschlags-Liste eine nach der anderen. Seit #949 steht die Suche im Fenster auch mit den Vorschlägen und das Fenster wird höher; es wächst dabei nach oben, die Zeilen wanderten zwischen zwei Messungen.
- Jetzt liest der Test alle Masse in einem einzigen Schritt. Geprüft wird weiterhin: Liste breit genug, Zeilen untereinander, nichts ragt aus dem Fenster.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Anzeige im Fenster «Zusammenlegen» war in Ordnung (Bild des Fehlschlags geprüft), darum nur der Test geändert, `MergeSheet.svelte` bleibt unberührt.
- Keine «Was ist neu»-Datei, weil nichts Sichtbares ändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. In GitHub: `e2e (phone)` zeigt für `zusammenlegen-liste.spec.js` grün.
