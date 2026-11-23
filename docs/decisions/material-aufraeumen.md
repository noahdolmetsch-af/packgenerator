# Material aufräumen

23.11.2026 · Auftrag: Noah «ja» (Thread «Velos und Material aufräumen», nach dem Bild der Seite Material)

- Oben auf Material stehen nur die Suche, der Knopf «Ansicht» und «+ Teil» (und das «…»); darunter folgt gleich die Liste nach Kategorie (`src/pages/Gear.svelte`).
- «Ansicht» ist ein Menü: die Ansichten (Alle, Meist genutzt, Bewährt, Favoriten, Nie gebraucht, Ungewogen), die Listen Wunschliste, Vorrat, Leihliste, die eigenen Ansichten und «Sortieren und filtern». Es ersetzt die Spalte «Ansichten» rechts.
- Die Werkzeuge (Teile wiegen, Teile prüfen, mehrere ändern, lange nicht gebraucht, leichtere Alternativen, Strom-Werte, Import, Strichcode, Masse umrechnen, Bausteine) stehen im «…»; die zweite Zeile mit zwölf Knöpfen fällt weg.
- Doppelte weg: die Knöpfe Wunschliste, Vorrat und Leihliste (die Reiter bleiben), Favoriten 3× (bleibt: die Ansicht; die Kachel «Favoriten» und «Gewicht sparen» sind nur noch über «Kachel hinzufügen» da), Ungewogen 3× (bleibt: die Ansicht und «Teile wiegen» mit Zahl), der Streifen «Gehört zu» auf Material (`NO_ROW` in `src/lib/know/gehoert.js`; «Alles hier» steht am Seitenende), die Zeile «Auf dieser Seite», die Spalte «Ansichten», die Karte «Teil antippen» ist eine Zeile.
- «Springen zu» steht nur noch als schmale Leiste neben der Liste am breiten Computer (vorher auch als Chips am Handy).
- Unter «Alle» keine Überschrift (der Knopf «Ansicht» sagt es); eine andere Ansicht nennt sich und hat «Alle zeigen».
- Nichts fällt weg: alles ist über «Ansicht», «…» oder «Alle Funktionen» erreichbar (verworfen: Werkzeuge als Chips-Zeile behalten).
