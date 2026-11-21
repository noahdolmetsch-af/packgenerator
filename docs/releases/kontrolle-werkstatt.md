# Nach der Inspektion: wohin die Punkte gingen

PR #<Nummer> · 21.11.2026 · Auftrag: Noah (Festlegung «Kontrolle zur Werkstatt», Thread «Training erfassen»; Landkarte-Thread)

## Was ist neu
- Nach «Fertig» bei einer Inspektion (Velos › Pflege › Velo › Inspektion) steht oben auf der Seite die Karte «Wohin es ging».
- Sie hat den Link «2 Punkte ansehen» (Zahl der Probleme, die die Kontrolle gemacht hat) zur Pflege des Velos, wo die Probleme und die Werkstatt-Bestellung stehen.
- Landen Teile auf der Wunschliste, kommt ein zweiter Link «Wunschliste ansehen» (`#/gear?view=wish`).
- Die Karte verschwindet, wenn man «Rückgängig» tippt oder die Seite verlässt. Entstand nichts, erscheint sie nicht.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Zahl zählt alle Probleme der Kontrolle («Selber reparieren» und «Werkstatt»), wie die Meldung sie schon nennt; sie steht im Link, weil die Meldung nach 10 Sekunden verschwindet.
- Der Knopf «Bestellung an Werkstatt senden» ist nicht dabei (Noah hat ihn nicht übernommen).
- Keine neue Funktion: kein Eintrag in `features.js`, `app-stand.md` oder `moment.js`.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Befund «Kontrolle fertig ohne Weg zur Werkstatt»: behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › Velo › Inspektion: Kurzcheck starten, einen Punkt auf «Velomech» setzen, «Fertig» tippen.
2. Oben auf der Seite «Wohin es ging»: «1 Punkt ansehen» tippen, die Pflege des Velos öffnet sich.
3. Bei einem Teil, das bald abgenutzt ist (z. B. Kette 0,45): zusätzlich «Wunschliste ansehen».
