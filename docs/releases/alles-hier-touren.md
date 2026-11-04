# Alles hier bei Touren

PR «Alles hier bei Touren» · 03.11.2026 · Auftrag: Noah «1a» und «freigabe» (Thread «Bringe versteckte Funktionen online»)

## Was ist neu
- Oben auf **Touren** das Feld **«Alles hier»** mit 14 Kacheln: In Zahlen, Vorlagen, Verpflegungsplan, Touren nebeneinander, Wetter für eine Fahrt, Reise-Links, Checks pro Tourart, Vor der Abfahrt, Traumtouren, Rennen, Rennen detailliert planen, Skitouren, Berg und Notfall, Quiz.
- «Ändern» wie bei Velos und Material.
- `alleshier.js`: auch Funktionen aus den Tipps (`tips.js`, Seite in `go.href`) können Kacheln sein.

## Was fällt weg oder rutscht tiefer
- Die Zeile «Mehr für deine Touren» zeigt nur noch «Tour von komoot». Ihre anderen fünf Links (Rennen detailliert planen, Verpflegungsplan, Touren nebeneinander, Wetter für eine Fahrt, Reise-Links) sind jetzt Kacheln im Feld darüber, gleich weit oben.
- Der Inhalt von Touren rutscht um das Feld nach unten.

## Selbst entschieden
- Kachel «In Zahlen» (`#/trips?numbers`): öffnet den Teil «In Zahlen» auf derselben Seite (auf dem Handy sonst hinter einer Zeile). So bleibt «In Zahlen» trotz des Feldes oben sichtbar (Test `heimat.spec`).
- komoot bleibt in der Zeile, weil es eine Seite ausserhalb der App öffnet und keine Kachel sein kann.
- Rückblick-Funktionen (Heatmap, Neuland, Gelernt) kommen nicht hierher, sondern zu Auswerten (Thread «Aktiv und Auswerten»).
- Fertig-Regel: ein Weg zu bestehenden Funktionen, keine neue Funktion.

## Stand im Plan
- Versteckte Funktionen: Schritt 7 von 9.

## Prüfschritte
1. Öffne Touren: Oben steht «Alles hier». Tippe «Skitouren»: die Seite öffnet sich.
2. Darunter steht «Mehr für deine Touren» mit «Tour von komoot».
