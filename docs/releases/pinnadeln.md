# Pinnadeln auf den Karten

PR (Quick Links, Schritt 2 von 8) · 28.10.2026 · Auftrag: Noah «1a 2a», Idee 19 «ja» und «ok quick links» (Thread «Quick Links»)

## Was ist neu
- Eine kleine graue Pinnadel oben rechts auf den Karten der App. Ein Tipp legt die Karte in die Quick Links dieses Geräts (erste Gruppe), ein zweiter Tipp nimmt sie heraus; beides mit Rückgängig (`src/lib/quick/PinMarks.svelte`, `src/lib/quick/pinmarks.js`).
- Welche Karten: jede Funktion des Katalogs hat eine Heimseite (`know/heimat.js`), dort sucht die App ihren Titel, wie der Robotertest `heimat.spec.js`. Keine Seite braucht eigenen Code.
- Beim ersten Anpinnen sagt die Meldung, was die Pinnadel tut.
- In Quick Links: Schalter «Pinnadeln auf den Karten» und «Rundgang Quick Links» (3 Schritte, `TOURS.quick` in `src/lib/tour.js`).
- Neue Funktion `f.pinmarks` im Katalog, Handbuch und «So geht's».

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Die Pinnadel sitzt nur dort, wo sie nichts zum Tippen verdeckt (sonst am Ende des Titels, sonst keine). Darum haben nicht alle Karten eine.
- Der Hinweis «Neu: die Pinnadel» aus dem Entwurf ist kein schwebendes Fenster, sondern steht in der ersten Meldung nach dem Anpinnen. Ein schwebendes Fenster hätte Knöpfe verdeckt.
- Neue Pins kommen in die erste Gruppe, damit man sie in Quick Links gleich oben sieht.
- Wo schon ein Knopf sitzt (zum Beispiel das «i» aus «Woher kommt das?»), rückt die Pinnadel weg, sie deckt nichts zu.
- Auf der Seite Quick Links selbst gibt es keine Pinnadeln.
- Die Pinnadeln laden erst nach dem Start (wie die Seiten).

## Entscheide (für decisions.md)
- 28.10.2026: Pinnadeln finden ihre Karte über den Katalog und die Heimseite, nicht über Code pro Seite.

## Stand im Plan (roadmap.md / vorhaben.md)
- Quick Links: Schritt 2 (Pinnadel überall, Rundgang) mit diesem PR. Es folgen: 3 Springen und Leuchten + Ansicht mit Filter, 4 Zuletzt geöffnet / Vorschlag / Aufräumen nach 30 Tagen, 5 Werte und Punkt, 6 Passend zum Moment, 7 Top 4 auf Heute, 8 Suche, `g q`, App-Symbol-Kurzbefehle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen und die kleine Pinnadel bei «Fahrt hochladen» oder einer anderen Karte antippen.
2. Quick Links öffnen: die Karte steht in der ersten Gruppe.
3. In Quick Links «Pinnadeln auf den Karten» ausschalten: die Pinnadeln sind weg.
