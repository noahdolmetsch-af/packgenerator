# «Deine 15 Fragen» löst sich auf

PR · 05.11.2026 · Auftrag: Noah «1a 2a 3a 4a» zu «ein Fragebogen» (Thread «Planen: Tagescheck mit Fragen»); dritter Schritt nach «Morgen-Seite wie das Fenster» und «Abend-Seite wie das Fenster»

## Was ist neu
- Es gibt nur noch eine Liste der Fragen: «Deine Fragen» (`#/me/abfragen`). Die alte Liste «Deine 15 Fragen» ist weg.
- Die alte Adresse `#/check/questions` führt auf «Deine Fragen».
- Die Vorschlag-Zeile auf der Morgen-Seite liest «Worauf freust du dich?» aus der Frage in «Deine Fragen» (`ziele.freude`), und weiter aus alten Tages-Checks.

## Was fällt weg oder rutscht tiefer
- Die Kachel «Deine 15 Fragen» auf Heute ist weg (auch aus gespeicherten Wänden). Ersatz: die Kachel «Heute-Check» und die Fenster; die Fragen stehen in «Deine Fragen».
- Die Seite «Deine 15 Fragen» (Tabelle mit Schaltern) ist weg. Ersatz: die Schalter in «Deine Fragen»; auf der Morgen- und Abend-Seite führt «Fragen anpassen» dorthin.
- Der Pool der wechselnden Morgenfrage (Körper/Kopf, Editor) ist weg; «Wie fühlt sich dein Körper an?» steht in «Deine Fragen».
- «Worauf freust du dich?» (Frage 6) steht nicht mehr als Karte auf der Morgen-Seite. Sie ist die Frage «Worauf freust du dich heute am meisten?» in «Deine Fragen», am Start aus (zusammengelegt mit «Dein Ziel für heute», Entscheid 3a); wer sie will, schaltet sie ein.
- Der alte Schalter `checkQuestionsOff` bleibt im Backup (alte Daten), wird aber nicht mehr gelesen. Alte Antworten bleiben.

## Selbst entschieden
- Die Frage «Worauf freust du dich?» bleibt am Start aus, wie in PR 1 (3a) beschlossen, statt sie wieder einzuschalten.
- Der Zähler «n von m» im Morgen-Check zählt nur noch Schlaf, Akku, Stimmung.
- Kein Eintrag in `features.js`: keine neue Funktion, eine fällt weg.

## Entscheide (für decisions.md)
- 05.11.2026: Die Liste «Deine 15 Fragen» geht ganz in «Deine Fragen» auf (Noah «1a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tagescheck-Bereinigung: Schritt 3 von 3 (ein Fragebogen). Danach der Gruss «Wi gahts?» mit Stimmungsknöpfen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: die Kachel «Deine 15 Fragen» ist nicht mehr da.
2. Heute › Morgen-Check: die Fragen sind die aus dem Fenster; unten «Fragen anpassen».
3. Ich › Deine Fragen: «Worauf freust du dich heute am meisten?» einschalten; sie steht dann auch auf der Morgen-Seite.
