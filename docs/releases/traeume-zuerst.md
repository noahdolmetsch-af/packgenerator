# Träume: deine Träume zuerst

PR (offen) · 24.11.2026 · Auftrag: Noah «1-5a» und «ja» (Thread «Warteliste», Welle 2 der impeccable-Prüfung, Fund F3)

Klarheit: die Träume-Seite beginnt mit dem Feld zum Hinzufügen und der Liste. Auffindbarkeit: «Deine Träume» rückt nach oben, weil der Einleitungssatz, «So geht's» und die Ausflugstipps nicht mehr davor stehen (Content first).

## Was ist neu
- Das Feld «Hinzufügen» und die Ansichten Liste · Karte · Jahr stehen direkt hinter dem Titel.
- «Heute passt: Ausflugstipps» steht unter der Liste.
- Der Satz «Touren, von denen du träumst …» und «So geht's» stehen am Seitenende.

## Was fällt weg oder rutscht tiefer
- Der Satz «Touren, von denen du träumst …» und «So geht's» rutschen ans Seitenende (vorher oben, jetzt ganz unten). Der lange Hilfe-Absatz (8 Zeilen) rutscht hinter das Feld und die Ansichten, bleibt aber über der Liste.
- «Heute passt: Ausflugstipps» rutscht unter die Liste.
- Sonst nichts.

## Selbst entschieden
- Der lange Hilfe-Absatz bleibt über der Liste, direkt unter den Ansichten: der Wächter `heimat.spec.js` verlangt, dass jede Funktion (Erfüllte Träume, Zug hin Velo heim, Abenteuer-Würfel …) am Handy in 2,5 Bildschirmen sichtbar ist, und die Liste kann lang sein. Ein erster Versuch mit dem Absatz am Seitenende machte diesen Wächter rot. Ein kürzerer Weg ist später möglich (die Funktionen als Zeilen im «?»-Fenster), dann auch mit angepasstem Wächter.
- Der Einleitungssatz und «So geht's» stehen am Seitenende statt im «?»-Fenster: das Fenster bekommt seine Texte aus den Funktionen der Seite; so geht nichts verloren.
- Die Anmeldefristen («Registration deadlines») bleiben vor der Liste: sie erscheinen nur, wenn etwas ansteht.

## Entscheide (eigene Datei `docs/decisions/`)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- impeccable-Prüfung ganze App, Welle 2, Paket 8: gebaut

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: Feld «Hinzufügen» und die Ansichten Liste · Karte · Jahr stehen direkt hinter dem Titel.
2. Nach unten scrollen: die Ausflugstipps stehen unter der Liste, die Erklärungen ganz am Ende.
