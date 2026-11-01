# Woher kommt das? Das «i» an Kacheln und Reitern

Auftrag: Noah «1a 2a» (Thread «Pfad auf jeder Seite anzeigen»), Schritt 2 von 6; «Freigeben» am 29.10.2026. Mockup https://claude.ai/artifact/AFK5fSomZLoyY83LszLG8s

## Was ist neu
- Ein kleines «i» an vier Kacheln von Heute (Diese Woche, Aktiv heute, Körperwerte, Gewicht) und an den vier Reitern von Planen (Woche, Merken, Termine, Notizen).
- Es öffnet ein Fenster «Woher kommt das?»: Pfad (mit Links), was es ist, woher die Daten kommen, was zusammengehört, «Dahin gehen».
- Die Angaben stehen in `src/lib/nav/spotinfo.js`; Funktionen aus dem Katalog (features.js) nehmen Namen und Text von dort.
- Das «i» geht mit dem Schalter «Pfad auf jeder Seite zeigen» (Ich › Darstellung › Bedienung) weg.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kacheln und Reiter bleiben, wie sie sind; das «i» sitzt rechts im Kopf.

## Selbst entschieden
- Nur geprüfte Angaben: «Woher die Daten kommen» steht nur dort, wo ich es im Code nachgelesen habe (4 Kacheln). Für den Rest folgen weitere Kacheln in kleinen PRs.
- Das Fenster liegt unter `<body>`, nicht in der Kachel (Tests suchen Überschriften in der Kachel).
- «Zusammengehört» ist von Hand ausgewählt (2–3 Einträge), nicht automatisch nach Gruppe: die Gruppen des Katalogs sind zu grob.
- Auf Planen sitzt das «i» in der Pfad-Zeile (rechts); Seiten mit eigenem Pfad zeigen nur das «i».

## Entscheide (für decisions.md)
- 29.10.2026: Herkunft zuerst für 4 Heute-Kacheln und 4 Planen-Reiter (Noah «Freigeben»).

## Stand im Plan
- Schritt 2 von 6 (Pfad-Zeile ✓, «i» an Karten, Entdecker-Modus, Standard/von mir, Karte der App, Änderungsdatum).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute: «i» bei «Diese Woche» antippen: Fenster mit Pfad und «Die Daten kommen von».
2. Planen › Woche: «i» rechts neben dem Pfad: «Gehört zusammen» zeigt Merken und Termine.
3. Ich › Darstellung › Bedienung: «Pfad auf jeder Seite zeigen» aus: alle «i» sind weg.
