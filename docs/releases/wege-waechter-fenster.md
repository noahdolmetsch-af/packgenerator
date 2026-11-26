# Wege-Wächter: Zurück-Prüfung ohne Neuladen

PR #1796 · 26.11.2026 · Auftrag: Wackler aus dem Nachtlauf 25.11. (Wackel-Wächter, Vorrang beim Bündler)

## Was ist neu
- Nichts Sichtbares geändert, nur Test für den Wege-Wächter (`tests/e2e/wege-waechter.spec.js`).
- **Ursache:** Die Zurück-Prüfung öffnete jede Adresse mit Neuladen. Bei `#/inbox/new` und `#/komoot/shared` ersetzt die App die Adresse und öffnet das Fenster im selben Moment. Kam das Neuladen danach, nahm es das Fenster weg, liess aber dessen Eintrag im Verlauf stehen: ein Schritt zurück blieb auf `#/inbox` bzw. `#/trips` (je nach Tempo mal rot, mal grün).
- **Fix:** Die Zurück-Prüfung öffnet die Adresse ohne Neuladen (der Pfad wird weiter mit Neuladen gemessen). Ob ein Fenster einen eigenen Verlaufseintrag hat, steht in `history.state.pgDialog` (`src/lib/ui/backclose.js`): nur dann zählt ein zweiter Schritt zurück. Eine Seite mit `role="dialog"` ohne Eintrag (Jahres-Geschichte `#/jahr`) zählt nicht mehr als Fenster.
- Lokal (Computer): 2 von 3 vollen Läufen grün; der dritte scheiterte einmal an einem 15-Sekunden-Warten auf `main` einer Berg-Seite, nicht nachstellbar (12 von 12 ohne Fehler).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Fenster-Erkennung schaut auf den Verlaufseintrag statt auf ein sichtbares `dialog`: das ist genau das, was der zweite Schritt zurück braucht.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: Nachtlauf grün für den Wege-Wächter. In der App nichts zu prüfen.
