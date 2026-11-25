# Ziehen-Test: die Berührungen kommen sicher auf der Seite an

PR #1783 · 24.11.2026 · Auftrag: Noah «beheben» / Regel 3 (Thread «Wackel-Tests zuverlässig machen», `ziehen-aktualisieren.spec.js:18` und `:33`, Handy, rot auf main bei den meisten Läufen)

## Was ist neu
- Nichts in der App. Nur der Test. Er schickte die Wischbewegung über die Eingabe des Browsers (CDP `Input.dispatchTouchEvent`). Chrome gibt davon der Seite oft nur den Anfang weiter: gemessen standen 6 von 8 Zügen nach ein bis zwei Bewegungen bei 10–40 px statt 96 px still, und manchmal kam das Loslassen nie an. Langsamere Schritte oder `touch-action: none` änderten das nicht.
- Der Test erzeugt jetzt in der Seite pro Schritt einen `Touch` und ein `TouchEvent` (Start, Bewegungen, Ende) und wartet nach jedem Schritt zwei Bilder. Die Handler der App bekommen dieselben Ereignisse. Geprüft wird unverändert: das Rad erscheint, steht bei «Loslassen zum Aktualisieren», dreht beim Loslassen, sagt «Aktuell», verschwindet; ein kurzer Zug gibt das Rad zurück und lädt nichts; auf anderen Seiten kein Rad.
- Nachgemessen: 24 von 24 Läufen grün (8 Wiederholungen, 3 Tests, Handy); vorher 4 von 6 rot mit einem Arbeiter.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Nichts gelockert: dieselben Prüfungen, nur die Art, den Finger zu schicken. Der Weg über die echte Browser-Eingabe war der Wackler.
- Ob die echte Eingabe auf einem Handy genauso Teile verliert, ist damit nicht beantwortet (das kann nur Noah auf dem Samsung zeigen: Ziehen auf Heute, Rad dreht sich).

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: `e2e (phone)` grün. In der App nichts zu prüfen.
