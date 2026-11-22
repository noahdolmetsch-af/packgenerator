# Keine Tipp-Zeile unter den Seitentiteln

PR #<Nummer> · 22.11.2026 · «Hilfen neu» Punkt 3b · Auftrag: Noah «1a 2a» (22.11.2026, Thread «Neue Ordnung»)

## Was ist neu
- Die Zeile «Gut zu wissen» (ein Tipp pro Tag) unter den Seitentiteln ist standardmässig aus. Die Seiten beginnen mit ihrem Inhalt.
- Ich › Eigene Werte › Vorschläge: neuer Schalter «Tipp-Zeile unter dem Seitentitel». Wer die Zeile mag, schaltet sie ein; der Schalter «Tipps auf allen Seiten» schaltet weiter alle Tipps ab.
- «Tipps einblenden» in der Suche schaltet die Zeile wieder ein, «Gut zu wissen ausblenden» schaltet sie aus (mit Rückgängig, wie bisher).

## Was fällt weg oder rutscht tiefer
- Die Tipp-Zeile unter dem Titel von rund 20 Seiten (Packen, Velopflege, Rückblick, Ich, Touren und weitere): sie ist aus. Die Tipps stehen weiter am Seitenende unter «Tipps für diese Seite ›» (öffnet alle Tipps der Seite) und im «?»-Fenster.
- Auch das Murmeltier neben dem Tipp ist damit nicht mehr zu sehen (es erscheint weiter in leeren Ansichten); wer es sehen will, schaltet die Tipp-Zeile ein.
- Vorschläge und Warnungen im Inhalt («Freie Zeit und gutes Wetter», «Diese Woche ist deutlich mehr …», «Verpasst? Verschieben») bleiben, Noah «2a». Heute bleibt unverändert.

## Selbst entschieden
- Kein neues Datenformat: der Schalter ist ein Feld `lineOn` in der bestehenden Einstellung `pageinfo` (Backup und Abgleich wie bisher). Wer die Tipps schon ausgeschaltet hatte, bleibt ausgeschaltet.
- Wer die Tipp-Zeile bisher eingeschaltet «erlebt» hat, ohne etwas gewählt zu haben, sieht sie nicht mehr; ein Schalter bringt sie zurück (alles ist änderbar).
- Die Tests schalten die Zeile mit `globalThis.__pgTipLines` ein (wie `__pgCardsOpen`), damit die älteren Spezifikationen weiter die Zeile prüfen; `tipp-zeile-aus.spec.js` prüft den echten Standard.

## Entscheide (eigene Datei `docs/decisions/tipp-zeile-aus.md`)
- 22.11.2026: Tipp-Zeilen unter den Seitentiteln aus, Vorschläge im Inhalt bleiben.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Hilfen neu»: 3b erledigt; 4a und 5a folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen: die Seite beginnt mit ihrem Inhalt, keine Tipp-Zeile unter dem Titel.
2. Ich › Eigene Werte › «Tipp-Zeile unter dem Seitentitel» einschalten: der Tipp steht wieder unter dem Titel.
3. Wieder ausschalten: am Seitenende öffnet «Tipps für diese Seite ›» die Tipps.
