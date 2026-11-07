# Meldungen kommen ins Bild

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Thread «Durchklicken Etappe 2: Touren und Material»), Klasse-D-Idee «Design a» (Befund E2-005 überall)

## Was ist neu
- Schreibt ein Formular seine rote Meldung weit oben (zum Beispiel «Gib der Vorlage einen Namen.» unter dem Namen, wenn der Bildschirm kurz ist), während der Knopf, den du getippt hast, weit unten steht, sah es aus, als geschehe nichts. Jetzt rückt jede Meldung, die gleich nach einem Tipp oder einer Taste erscheint und nicht ganz im Bild ist, ins Bild. Die Seite bewegt sich nur so viel wie nötig; der Cursor bleibt, wo er ist.
- Gilt für alle Formulare und Fenster der App, die ihre Meldung als `role="alert"` zeigen (rund 200 Stellen), ohne dass jede einzeln umgebaut werden muss.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine allgemeine Lösung statt jede Meldung einzeln neben ihren Knopf zu verschieben (wie bei «Ausgeliehen», #927): sonst blieben die vielen anderen Stellen (Vorlagen, Angebote, Rechnungen, Fenster) offen. «Ausgeliehen» bleibt wie es ist.
- Nur Meldungen innerhalb von 6 Sekunden nach einem Tipp oder einer Taste: Warnungen, die beim Öffnen einer Seite schon dastehen, bewegen die Seite nicht.
- Mit «weniger Bewegung» springt die Seite ohne Gleiten.
- Die Fehlerseite der App («Etwas ist schiefgelaufen») zählt nicht.
- Test: `tests/e2e/meldung-sichtbar.spec.js` (Handy; der Roboter scrollt eine lange Seite, tippt und lässt eine Meldung ganz oben erscheinen, so wie ein Formular es tut; erfundene Daten) und `tests/alertseen.test.js`. Ein echtes Formular mit weit entferntem Knopf hat sich nicht finden lassen, das von «Neue Vorlage» hat eine feste Leiste mit «Weiter».

## Entscheide (für decisions.md)
- keine neuen (Noah «Design: a, b und c»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Frontend-Durchklick Etappe 2 (Touren und Material): Design a umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy quer halten: Packen › Vorlagen › «Neue Vorlage», ohne Namen «Weiter» tippen: die rote Meldung steht im Bild.
2. Eine beliebige Seite öffnen: nichts springt von selbst (nur nach einem Tipp kann eine Meldung die Seite verschieben).
