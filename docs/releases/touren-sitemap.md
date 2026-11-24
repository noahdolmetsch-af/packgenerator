# Touren: Rennen als Reiter, Werkzeuge für eine Tour, «Unterwegs» auf der Übersicht

PR folgt · 24.11.2026 · Auftrag: Noah «K1-K9» (Thread «Mehr schwere MTB-Touren», Sitemap-Reihenfolge Punkt 3)

## Was ist neu
- Reiter «Rennen» an dritter Stelle in Touren (Übersicht, Träume, Rennen, Rückblick). Er leuchtet auf `#/race…` und `#/racecheck…`; alle alten Adressen bleiben.
- Packen › «Mehr zu dieser Tour» hat eine sechste, geschlossene Gruppe «Werkzeuge für diese Tour» mit sieben Wegen: Verpflegung, Tour-Pfad (dieser Tour), Weg zum Ziel, Touren nebeneinander, Stopps, Quiz (dieser Tour), Checks pro Tourart.
- Touren › Übersicht: mit einer geplanten Tour steht neben «Rennen ›» der Link «Unterwegs ›» (`#/ride`, die Tagesübersicht der laufenden oder nächsten Tour).

## Was fällt weg oder rutscht tiefer
- «Vorlagen» war der dritte Reiter, jetzt steht er am Handy hinter «Mehr» (ein Tipp mehr), am Computer weiter rechts; die Adresse `#/pack/templates` ist gleich.
- sonst nichts.

## Selbst entschieden
- Die «Tour-Seite» der Sitemap heisst in der App «Packen»: dort liegt «Mehr zu dieser Tour», darum steht die Gruppe dort, nicht über der Packliste (Content first).
- Die Grenze «höchstens 8 Reiter» in `tests/fuenforte.test.js` steigt auf 9.
- «Unterwegs» zeigt die Seite `#/ride`, die selbst die laufende oder nächste Tour wählt; ein eigener Link pro Tour kommt nicht dazu.
- Skitouren (ab Dezember) stellt `seasonTabs` wie bisher an Platz 4; dann rutscht «Rückblick» hinter «Mehr», «Rennen» bleibt auf Platz 3 (kein Reiter wird zusätzlich verdrängt).

## Entscheide (eigene Datei `docs/decisions/touren-sitemap.md`)
- 24.11.2026: Rennen wird Reiter, Vorlagen geht unter «Mehr» (Noah «K3»).

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.
