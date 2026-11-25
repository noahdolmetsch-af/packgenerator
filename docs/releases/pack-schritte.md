# Packen in Schritten

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «2a», «3a» (Warteliste 4, Baustein 2)

## Was ist neu
- Über der Packliste wählt ein Umschalter die Ansicht: **Schritte**, nach Taschen (die ganze Liste wie bisher) oder nach Kategorie.
- **Schritte** zeigt die Liste als Kleider, Schlafen, Verpflegung und Wasser, Technik und Laden, Velo und Reparatur, Prüfen (`src/lib/pack/schritte.js`). Jeder Schritt ist eine Gruppe wie eine Tasche: Zeilen, Gewicht, «Hinzufügen» und der Haken der Liste selbst. Am Ende steht «Weiter: …», das den nächsten Schritt öffnet. Mit «Früher» und «Später» ändert sich die Reihenfolge.
- Die Wahl und die Reihenfolge werden gemerkt (Einstellung `pack.steps`, im Backup wie jede Einstellung). Eine Liste, in der noch nichts gepackt ist, öffnet in Schritten, eine begonnene bleibt bei den Taschen, solange du nichts gewählt hast.

## Was fällt weg oder rutscht tiefer
- nichts. Die Liste nach Taschen und nach Kategorie, «Bereit zur Abfahrt?» und «Mehr zu dieser Tour» bleiben. Eine neue, leere Liste öffnet in Schritten statt nach Taschen (Umschalter: «Nach Taschen»).

## Selbst entschieden
- «Ganze Liste» heisst im Umschalter weiter «Nach Taschen» (der bestehende Name); einen dritten Namen gibt es nicht.
- Kategorien ohne Schritt (eigene Kategorien, keine) landen in «Prüfen», damit nichts verloren geht.
- Hygiene steht bei Schlafen, Werkzeug, Velo-Teile und Taschen bei Velo, Papiere und Komfort bei Prüfen.
- Die Browser-Tests öffnen die Liste wie bisher nach Taschen (`__pgPackView` in `tests/e2e/clock.js`, wie bei den Kartenzeilen).

## Entscheide (eigene Datei `docs/decisions/pack-schritte.md`)
- 22.11.2026: Noah «2a», «3a».

## Stand im Plan
- Warteliste 4: Packen in Schritten gebaut; Vorschlag-Seite, Knopf in Neue Tour und Pack-Karten folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour mit leerer Packliste öffnen: der Umschalter steht auf «Schritte».
2. Einen Schritt öffnen, «Weiter: …» antippen: der nächste öffnet sich.
3. «Nach Taschen» wählen und neu laden: die Wahl bleibt.

Keine Datenänderung am Backup-Format (nur eine Einstellung).
