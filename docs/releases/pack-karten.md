# Pack-Karten auf Touren

PR #1783 · 23.11.2026 · Auftrag: Noah «4a» (Warteliste 4, Baustein 3)

## Was ist neu
- Auf **Touren** stehen unter dem Titel die nächsten Touren als Karten (höchstens drei): Ring mit «% gepackt», «heute / morgen / in n Tagen» mit Datum, der Knopf **«Weiter mit Kleider»** (der erste Schritt mit Ungepacktem, in deiner Reihenfolge) oder «Packliste starten» (noch keine Liste) und «Öffnen».
- Die Karte **«Neue Tour»** steht dahinter und öffnet das Fenster «Neue Tour».
- «Weiter mit …» öffnet die Packliste in der Ansicht «Schritte» mit dem wartenden Schritt offen.
- Regeln: `src/lib/pack/packkarten.js` (Tour mit Beginn ab heute, keine Idee, nicht übersprungen, keine Testtour, nicht abgeschlossen).

## Was fällt weg oder rutscht tiefer
- nichts. Die Liste «Geplant», der Packstreifen und alle Wege der Tourenseite bleiben; die Karten stehen unter dem Titel dazu. Keine geplante Tour: keine Karten (die Seite sieht aus wie vorher).

## Selbst entschieden
- Höchstens drei Karten, die nächsten zuerst; weitere stehen in der Liste «Geplant».
- Die Übergabe an die Packliste läuft über `sessionStorage` (einmalig), kein neuer Speicher.
- Der Vorschlag «Vorschlag in einer Minute» und «Wie letztes Mal?» sind nicht Teil dieses PRs (eigener Schritt).

## Entscheide (eigene Datei `docs/decisions/pack-karten.md`)
- 22.11.2026: Noah «4a».

## Stand im Plan
- Warteliste 4: Pack-Karten gebaut (baut auf «Packen in Schritten» auf); Vorschlag-Seite folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: die nächsten Touren stehen als Karten oben.
2. «Weiter mit …» antippen: die Packliste öffnet in Schritten, der Schritt ist offen.
3. «Neue Tour» antippen: das Fenster öffnet.

Keine Datenänderung.
