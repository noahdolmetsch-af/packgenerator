# Tennis-Angebote sind leicht zu finden

PR folgt · 08.11.2026 · Auftrag: Noah «a» (Thread «Landing Page für Tennis-Flyer planen»)

## Was ist neu
- Auf **Ich** gibt es einen Abschnitt «Tennis» mit der Zeile «Angebote und Anfragen» (`#/me/tennis`).
- Auf der **Tennis-Seite** (Aktiv › Tennis) gibt es eine Karte «Stunden anbieten» mit dem Knopf «Angebote und Anfragen».
- Im Angebot (Fenster «So wird gebucht») heisst das Feld für die Anzahl pro Art jetzt «Plätze» statt «Orte», und das einzelne Ortsfeld «Ort» statt «Platz». Gleiche Wörter in der Zeile «Plätze» der Angebotsansicht.

## Was fällt weg oder rutscht tiefer
- nichts. Auf Ich rutschen «Einstellungen» und «Hilfe» eine Zeile tiefer, weil davor ein neuer Abschnitt steht.

## Selbst entschieden
- Der Abschnitt «Tennis» steht auf Ich direkt unter «Daten», nicht in «Mehr», weil Noah es sichtbar wollte («a»). Das hebt den Entscheid vom 22.10.2026 (Klick-Rundgang Q05 «3a», «Angebote» aus Ich entfernt) für Tennis auf; Touren- und Service-Angebote bleiben weiter nur über die Adresse und die Tennis-Seite erreichbar.
- Kein Eintrag in `features.js`: der Zugang ist ein Absprung, keine neue Funktion; die Zeilen stehen in `docs/app-stand.md`.
- Die Beschriftungs-Korrektur steckt im selben PR (kleine Ausnahme von «ein PR, eine Änderung»), weil sie dieselbe Angebotsseite betrifft und Noah sie beim Einrichten gestört hat.
- Kein Schema-, kein Backup- und kein api/-Wechsel.

## Entscheide (für decisions.md)
- 08.11.2026: Der Zugang zu «Tennis» (Angebote und Anfragen) steht wieder sichtbar auf Ich und auf der Tennis-Seite (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tennis-Landingpage: Buchungsseite der App ist jetzt auffindbar; das neue Anfrageformular (Wunschzeit, Orte zum Ankreuzen) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen: Abschnitt «Tennis», Zeile «Angebote und Anfragen» antippen: die Seite «Tennis» mit den Tabs öffnet sich.
2. Aktiv › Tennis öffnen: Karte «Stunden anbieten», Knopf antippen: dieselbe Seite.
3. In einem Angebot bei «So wird gebucht» auf «Ändern»: Felder «Ort», «Orte zur Auswahl» und bei jeder Art «Plätze».
