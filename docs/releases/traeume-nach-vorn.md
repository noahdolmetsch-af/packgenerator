# Träume nach vorn

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Runde 2) und «5b» (Runde 1), Thread «Träume und Neuland prominent machen»

## Was ist neu
- Touren: Träume ist der zweite Reiter, gleich nach Übersicht (`PLACE_TABS.trips` in `src/lib/nav.js`). Wer die Reiter selbst geordnet hat, behält seine Reihenfolge.
- Touren › Übersicht: eine ruhige Zeile «Ein Traum passt jetzt: …», wenn ein Traum in diesem Monat passt und noch keine Tour ist (`dreamsNow` in `src/lib/dreams.js`, `src/lib/dreams/DreamNowRow.svelte`). Ohne solchen Traum steht nichts da.
- Träume: unten der Teil «Gesammelt» mit «Neuland» (Karte und Bingo) und «Heatmap».
- Fehler behoben: «Neuland des Jahres» (Ich › Was mir gut tut) und die Neuland-Seite speicherten unter derselben Einstellung `neuland`. Ein Eintrag in «Was mir gut tut» liess die Neuland-Seite ihre Haken von Hand, eigene Sammlungen und den Joker nicht mehr sehen, und das nächste Speichern auf der Neuland-Seite löschte die Einträge in «Was mir gut tut». «Neuland des Jahres» hat jetzt eine eigene Einstellung `neulandYear`; `src/lib/neuland/split.js` verschiebt eine alte Liste einmal dorthin (bei jedem Start und nach einem Import über `updates.js`, und bevor die Neuland-Seite speichert).

## Was fällt weg oder rutscht tiefer
- Touren: Vorlagen und Rückblick rücken in den Reitern um einen Platz nach hinten (vorher Übersicht, Vorlagen, Rückblick, Träume; jetzt Übersicht, Träume, Vorlagen, Rückblick). Am Handy bleiben alle vier in der Reiterzeile sichtbar.
- Sonst nichts.

## Selbst entschieden
- Die Zeile auf der Übersicht steht unter «Dein Rennen» und sieht gleich aus; bei mehreren passenden Träumen nennt sie den ersten und «und n weitere».
- Die Zeile «Heute passt» oben auf Träume kommt mit der Idee N3 (Ausflugstipps), nicht schon hier, damit dieser PR klein bleibt.
- Datenspeicher: kein Dexie-Schema-Wechsel, Backup-Format gleich. Eine alte Sicherung mit der Liste unter `neuland` wird nach dem Import automatisch aufgeteilt (Test mit einer Kopie in `tests/traeume-neuland.test.js`). Was schon gegenseitig überschrieben war, lässt sich nicht zurückholen.

## Entscheide (für decisions.md)
- 27.10.2026: Neuland wohnt in Träume, Träume wird prominent (2. Reiter unter Touren, Zeile auf der Übersicht), alle 19 Ideen als kleine PRs, Listen zusammenführen, keine neue Kachel auf Heute (Noah Runde 1 «alle 12, 1b, 2a, 3a, 4a, 5b», Runde 2 «1-5 a»). Grund: Neuland war nur Rückblick, drei Ebenen tief; der Blick nach vorn fehlte.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland» (Ziele 3 und 4): Schritt 1 von 20. Als Nächstes N1 «Weisse Flecken in der Nähe».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: die Reiter beginnen mit Übersicht, Träume.
2. Auf Träume einen Traum anlegen, der in diesem Monat passt (Monate im Traum wählen): Touren › Übersicht zeigt oben «Ein Traum passt jetzt: …», ein Tipp öffnet Träume.
3. Unten auf Träume: «Neuland» öffnet die Karte mit dem Bingo, «Heatmap» die Karte aller Fahrten.
4. Ich › Was mir gut tut: ein Eintrag bei «Neuland» bleibt, auch wenn du danach auf der Neuland-Seite etwas abhakst.
