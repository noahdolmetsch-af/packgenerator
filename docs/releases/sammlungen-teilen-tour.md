# Sammlungen: teilen, drucken, Tour

PR (offen) · 05.11.2026 · Auftrag: Noah «Touren 2a und b» (Thread «Bauen: Freie Zeit Teil 1»)

## Was ist neu
- In einer Sammlung: «Als Seite teilen». Der Link enthält die Sammlung als Text (Name, Einträge, ausgefüllte Felder, Links). Wer ihn öffnet, sieht eine Seite zum Lesen (`#/share/sammlung/…`), ohne Daten aus deiner App.
- «Drucken oder als PDF speichern» in der Sammlung und auf der geteilten Seite. Beim Drucken fallen Knöpfe weg.
- «Verknüpfte Tour»: eine Sammlung mit einer deiner Touren verbinden; «Tour öffnen» führt auf die Tour-Seite. Freiwillig, mit «Keine Tour» wieder lösbar (Rückgängig).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Fotos und Positionen gehen nie in den Link (privat und zu gross); der Link bleibt kurz. Ab etwa 4000 Zeichen kommt der Hinweis, dass «Drucken oder als PDF» immer geht.
- Höchstens 60 Einträge im Link.
- Eine Sammlung gehört zu einer Tour (nicht mehrere); gespeichert als `collTour` im Freie-Zeit-Eintrag, kein neues Dexie-Schema.
- Die geteilte Seite ist nur zum Lesen; «In meine Sammlungen übernehmen» gibt es noch nicht (kann ein eigener PR werden).
- Der Absprung von der Tour-Seite zur Sammlung fehlt noch (die Tour-Seite ist eine heisse Datei); kann folgen, wenn Noah es möchte.
- Keine neue Funktion in `features.js`: Ergänzung von «Meine Sammlungen».

## Entscheide (für decisions.md)
- 05.11.2026: Geteilte Sammlungen = Link mit Text im Link, nichts auf einem Server (wie die geteilte Packliste).

## Stand im Plan (roadmap.md / vorhaben.md)
- Freie Zeit Teil 1: Sammlungen erledigt; Lust und Abend folgen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Freie Zeit › Meine Sammlungen › Rezepte: einen Eintrag anlegen, «Als Seite teilen» tippen und den Link öffnen.
2. Auf der Seite «Drucken oder als PDF speichern» tippen.
3. Zurück in der Sammlung unter «Verknüpfte Tour» eine Tour wählen, «Tour öffnen» tippen.
