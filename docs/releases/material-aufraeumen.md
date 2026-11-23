# Material aufräumen

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «ja» auf den Vorschlag des Koordinators (Thread «Velos und Material aufräumen», 2. von 2 PRs)

## Was ist neu
- **Oben nur noch Suche, «Ansicht», «+ Teil» und «…».** Direkt darunter steht die Liste nach Kategorie.
- **«Ansicht»** (Menü): Alle, Meist genutzt, Bewährt, Favoriten, Nie gebraucht, Ungewogen (mit Zahl), dazu Wunschliste, Vorrat, Leihliste, die eigenen Ansichten, «Gewicht nach Kategorie» und «Sortieren und filtern». Die Ansicht, in der du bist, nennt sich über der Liste und hat «Alle zeigen».
- **«…»** hat die Werkzeuge: Teile wiegen (mit Zahl), Teile prüfen, mehrere ändern, lange nicht gebraucht, leichtere Alternativen, Strom-Werte eines Geräts, Material-Liste importieren, Strichcode → Material, Masse umrechnen, Bausteine, Kleiderschrank.
- **Kleiner:** «Teil antippen» ist eine Zeile statt einer Karte.

## Was fällt weg oder rutscht tiefer
- Die Zeile mit zwölf Knöpfen (Wunschliste … Masse umrechnen): jetzt in «Ansicht» und «…».
- Die Spalte «Ansichten» rechts und die Zeile «Sortieren und filtern» oben: jetzt im Menü «Ansicht».
- Der Streifen «Gehört zu: Velo und Material» auf Material und die Zeile «Auf dieser Seite (Ansichten, Auswertung)»: weg («Alles hier» am Seitenende bleibt; «Gewicht nach Kategorie» steht in «Ansicht»).
- Die Zeile «n ohne Gewicht · jetzt wiegen»: weg; «Teile wiegen» im «…» zählt, «Ungewogen» in «Ansicht» zählt.
- Kacheln «Favoriten» und «Gewicht sparen» am Seitenende: nicht mehr vorgewählt (über «Kachel hinzufügen» da; wer sie gewählt hat, behält sie).
- «Springen zu» als Chips am Handy: weg; am Computer neben der Liste bleibt die schmale Leiste.
- Die Überschrift «Alle» mit dem Satz darunter: weg (die Ansicht sagt es).
Nichts geht verloren.

## Selbst entschieden
- «Sortieren und filtern» steht im Menü «Ansicht» (nicht als eigener Knopf), weil Ansicht, Sortierung und Filter zusammengehören; der Knopf zeigt eine Zahl, wenn ein Filter an ist.
- Wunschliste, Vorrat, Leihliste stehen in «Ansicht» als Zeilen mit Pfeil (sie öffnen ihre Reiter); die Chips oben bleiben.
- Das «…» zeigt «Eine Material-Liste importieren»; wartet eine Liste auf die Prüfung, heisst es «Import prüfen» mit Zahl.
- Geänderte Prüfungen (mit Absicht, nichts gelockert): die Ansichten und «Sortieren und filtern» öffnet man über «Ansicht» (`tests/e2e/gearmenu.js`), die Werkzeuge über «…».
- Keine Datenänderung.

## Entscheide
- 23.11.2026: siehe `docs/decisions/material-aufraeumen.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Velos und Material aufräumen», PR 2 von 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material öffnen: oben Suche, «Ansicht», «+ Teil», «…»; die Liste nach Kategorie steht gleich darunter.
2. «Ansicht» tippen: Favoriten wählen, die Liste zeigt nur Favoriten, «Alle zeigen» geht zurück.
3. «…» tippen: «Teile wiegen» und «Mehrere ändern» sind dort.
