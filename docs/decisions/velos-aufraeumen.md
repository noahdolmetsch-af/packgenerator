# Velos aufräumen

23.11.2026 · Auftrag: Noah «ja» (Thread «Velos und Material aufräumen», nach dem Bild der Seite Velos)

- Unter dem Reiter «Velos» gibt es keine Chips mehr (`chips: false`, `PLACE_TABS.bikes` in `src/lib/nav.js`); die Seiten bleiben unter ihren Adressen und im Pfad, «Teile» und «Mein Setup» sind Zeilen der Velo-Seite (verworfen: Chips behalten, weil «zwei Navigationen» verwirren).
- Die Velos stehen einmal: die grossen Karten (`BikeCards`) wählen das Velo; die zweite Reihe kleiner Kacheln in `SetupBand` ist gestrichen.
- Hilfe hat eine Stelle: das «?»-Fenster (`HintCard page="velos" intro="velos"`), keine zweite Zeile «So geht's» auf der Seite.
- Arbeit an Schuhen und Cleats gehört zum Material, nicht zum Velo (`src/lib/care/gearwork.js`, Karte «Arbeit am Material» in Material › Alle); ein Klick auf «Zum Velo» entscheidet anders und gilt immer.
- Namen aus dem ersten Import (englisch) werden in der Anzeige auf Deutsch gezeigt, nicht in den Daten geändert (`bagName`, `importText` in `src/lib/i18n.svelte.js`).
- Die Kacheln Werkstatt, Velopflege und Velos vergleichen gibt es auf der Velo-Seite nicht mehr (Reiter «Pflege» und eine Zeile unter «Mehr» führen dorthin).
