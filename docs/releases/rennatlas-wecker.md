# Rennatlas: Anmelde-Wecker

Auftrag: Noah 24.11.2026 (Idee 2 «Anmelde-Wecker» aus der Liste der gewählten Ideen, Karte «Womit soll es im Rennatlas weitergehen?», Thread «Bikepacking-Rennen: Stand und Ideen zeigen»).

## Was ist neu
- Im Rennen-Fenster des Rennatlas steht bei einem Rennen, das noch nicht angemeldet ist und dessen Anmeldung noch bevorsteht (Anmeldestart oder Anmeldeschluss liegt heute oder später), der Knopf «Aufs Handy erinnern». Er wird zu «Wecker an»; ein zweiter Tipp schaltet ihn aus.
- Das Handy erinnert um 08:00 am Tag, an dem die Anmeldung öffnet, und 3 Tage und 1 Tag vor Anmeldeschluss. Das Fenster nennt die Tage («Du bekommst um 08:00 eine Erinnerung am: …»). Ein Rennen, das du als angemeldet markierst, braucht keinen Wecker mehr.
- Der Wecker schaltet beim ersten Mal die Handy-Erinnerungen ein (der Browser fragt einmal). Unter Ich › Erinnerungen aufs Handy › «Rund um die Tour» gibt es dafür den Schalter «Anmelde-Wecker (Rennatlas)»; er hält alle Wecker aus.
- Die Wecker bleiben, wenn du eine neuere Rennliste lädst.

## Was fällt weg oder rutscht tiefer
nichts.

## Selbst entschieden
- Ein Wecker pro Rennen (nicht für alle Favoriten), weil du so genau bestimmst, wofür du Erinnerungen bekommst.
- Tage wie bei der Anmeldung einer Tour: 3 Tage und 1 Tag vor Anmeldeschluss, dazu der Öffnungstag; alles um 08:00.
- Der Knopf steht nur im Rennen-Fenster, kein neuer Block auf der Seite (Content first). Ein eigener Eintrag in `features.js` ist nicht nötig: die Funktion hängt am Rennatlas (`f.raceatlas`), die «Neu»-Zeile führt dorthin.
- Der Wecker läuft nur, wenn das Handy-Push eingerichtet ist (Server und Browser); sonst steht ein kurzer Hinweis, der Wecker bleibt gemerkt.
- impeccable: nur eigene Durchsicht gegen das App-Design, ohne Prüfwerkzeug.
- Keine echten Daten im Repo: Tests nehmen erfundene Rennen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › Rennatlas › ein Rennen mit Anmeldestart in der Zukunft öffnen: Knopf «Aufs Handy erinnern» sichtbar.
2. Antippen: «Wecker an», darunter die Tage. Ich › Erinnerungen aufs Handy: «Anmelde-Wecker (Rennatlas)» ist an.
3. Nochmals antippen: Wecker aus.
