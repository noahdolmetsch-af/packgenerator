# Sportarten umbenennen klappt jetzt bei allen

Auftrag: Noah 05.11.2026 «sportarten umbenennen funktioniert nicht» und «b» (Thread «Beheben: Sportarten umbenennen»).

## Was ist neu
- Fahrrad, Gravel, Cross Country und Downhill lassen sich in Aktiv › Meine Sportarten › «Sportarten deiner Touren» umbenennen, ausblenden und löschen (mit Rückgängig). Vorher passierte nichts: diese vier hatten keinen Eintrag in einer Liste, der Code brach still ab.
- Ihre Namen stehen in einer neuen Liste «Velo-Sportarten der Touren» unter Ich › Listen und Typen (Name, Ausblenden, «Auf Standard zurücksetzen»).
- Ein umbenannter Sport der Touren heisst jetzt überall gleich: in «Neue Tour», in den Tour-Tipps («Vorschlagsliste …»), bei den alten Touren und im Können-Überblick. Das gilt auch für Skitouren, Wandern und Bikepacking, die vorher nur in der Liste den neuen Namen zeigten.
- Ein ausgeblendeter Sport wird für eine neue Tour nicht mehr angeboten; alte Touren behalten ihn.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Neue Liste `tripSports` statt Einträge in «Sportarten und Bereiche»: die vier sind Sportarten, keine Packbereiche (Velo, Alltag). So ändert sich nichts an Packlisten und Bereichen.
- Die Reihenfolge der vier bleibt in Aktiv › Meine Sportarten (nicht in der Liste unter Ich), damit es nur einen Ort dafür gibt.
- Ein selbst getippter Name geht nie durch `t()`.
- Keine Änderung am Datenspeicher: die Liste ist ein weiterer Schlüssel in den bestehenden Einstellungen «listOverrides».

## Stand im Plan
- «Alles selbst bearbeiten» (Regel 11): Sportarten der Touren jetzt ohne Lücke. Weitere Lücken (Auswahl im Rückblick) folgen als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten: rechts bei Gravel «⋯» › Umbenennen, neuen Namen eingeben: er steht sofort in der Liste, auch nach Neuladen.
2. Touren › Neue Tour: das Sport-Chip zeigt den neuen Namen.
3. «⋯» › Rückgängig bringt den alten Namen zurück.
