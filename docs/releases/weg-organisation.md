# Weg zum Ziel: Organisation (K3)

PR # · 07.11.2026 · Auftrag: Noah «1d» (Streifen «x von y geregelt»), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Neue Schrittart **Organisation** (`src/lib/weg/types/orga.js`): Anmeldung zum Rennen (120 Tage vor dem Start, nur bei einem Rennen), Urlaub eintragen (150), Unterkunft bei Start und Ziel (90), Zug zum Start (14), Notfallperson informieren (7). Eine Tour bekommt vier, ein freies Ziel zwei davon.
- Ein Streifen über der Zeitlinie: «Organisation: 3 von 5 geregelt», mit der nächsten Frist («noch 71 Tage», bei Verspätung «überfällig») und «Zur Liste», das zum ersten offenen Schritt springt. Ohne Schritte der Organisation steht kein Streifen da.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nichts hakt sich von selbst ab: Die App kann nicht wissen, dass ein Zimmer gebucht ist (`auto` ist immer null). Die Haken sind deine.
- Alle fünf Schritte sind nur Vorschläge im Formular «Neuer Weg»: abwählen, umbenennen, verschieben, löschen.
- Fertig-Regel: Seite, Absprung und App-Stand gehören zu «Weg zum Ziel» (#1070); der Streifen ist ein Teil dieser Seite. «Gut zu wissen» entfällt (die Seite hat keine Karte «Was du hier tun kannst»).
- Neue Hilfsfunktion `daysBetween` und das Feld `soon` in `typeProgress` (nächster offener Schritt mit Tag).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: «1d» gebaut; als Nächstes die Heute-Zeile, «Reicht die Zeit?» und die Meilenstein-Leiste.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel › «Neuer Weg»: «Rennen», Starttag in ein paar Monaten, die Schritte der Organisation angehakt lassen, anlegen.
2. Über der Zeitlinie steht «Organisation: 0 von 5 geregelt» mit der nächsten Frist.
3. Einen Schritt abhaken: der Streifen zählt mit. «Zur Liste» springt zu den Schritten.
