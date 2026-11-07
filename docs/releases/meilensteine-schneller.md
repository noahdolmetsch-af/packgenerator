# Meilensteine öffnet schneller

PR #<Nummer> · 05.11.2026 · Auftrag: Noah «Idee A: Tempo-Runde für Seiten» (Thread «Umsetzen Tempo-Runde für Seiten»)

## Was ist neu
- Aktiv › Meilensteine: Die zugeklappten Teile werden erst gebaut, wenn du sie öffnest: «Zahlen und Stufen ändern» (jeder Meilenstein mit Zahlen und Kästchen, allein rund 550 Elemente) und am Handy «Alle n zeigen» und «Serien, Touren und Velos».
- Gemessen (Handy-Ansicht, Prozessor 4× langsamer, 700 Testteile): Elemente auf der Seite 2349 → 1512 (−36 %), bis die Seite still steht 0.31 s → 0.23 s.
- Wird «Stufen ändern» angetippt (Adresse mit `?tune=1`), ist der Teil sofort offen und gebaut.

## Was fällt weg oder rutscht tiefer
- nichts. (Beim Aufklappen erscheint der Inhalt einen Augenblick später als vorher, weil er jetzt erst dann gebaut wird; danach bleibt er.)

## Selbst entschieden
- Wie bei «Meine Sportarten» (#910): der Inhalt bleibt nach dem ersten Öffnen stehen, auch beim Zuklappen.
- Test `kachel-wand` angepasst: am Handy erst das Feld «Serien, Touren und Velos» öffnen, dann hineinschauen (der Inhalt ist zugeklappt nicht mehr im Baum).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo-Runde für Seiten (Idee A, «Neuer Schwung»): Schritt 3 von 4 (Meilensteine). Bericht: notes/tempo-runde-2026-11-05/README.md.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meilensteine öffnen: die Sterne sind gleich da.
2. Ganz unten «Zahlen und Stufen ändern» antippen: jeder Meilenstein hat seine Zahlen und ein Kästchen «Anzeigen».
3. Am Handy «Alle zeigen» antippen: die Karten aller Meilensteine sind da.
