# Neu seit gestern

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N11

## Was ist neu
- Heute: nach einer Fahrt eine ruhige Zeile «Neu seit gestern: 3 Gemeinden, 1 See» (`src/lib/neuland/NeuHeute.svelte`, Logik `src/lib/neuland/neuheute.js`). Ein Tipp öffnet Neuland, × schliesst sie.
- Keine Kachel: die Zeile erscheint nur am Tag einer Fahrt und am Tag danach und nur, wenn etwas zum ersten Mal erreicht wurde (Noah Runde 1 «4a»: keine neue Kachel auf Heute).
- Geschlossen bleibt geschlossen, bis wieder etwas Neues dazukommt (Einstellung `neuland.todaySeen`, im Backup).
- Neue Funktion im Katalog: `f.newtoday`.

## Was fällt weg oder rutscht tiefer
- Heute: an Tagen mit Neuem rutscht alles unter «Weitermachen» und der Sporttasche um eine Zeile tiefer. Sonst nichts.

## Selbst entschieden
- Sie steht bei den anderen ruhigen Zeilen unter dem Gruss («Weitermachen», Sporttasche).
- Gezählt wird wie in Neuland, nur die eingeschalteten Sammlungen.
- Die Karten-Daten laden auf Heute nur, wenn seit gestern eine Fahrt, Tour oder Aktivität mit Ort da ist.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 6 von 20 (N11). Als Nächstes N17 «Erfüllte Träume».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nach einer Fahrt an einen neuen Ort Heute öffnen: «Neu seit gestern: …» steht unter dem Gruss.
2. Antippen: Neuland öffnet sich.
3. Zurück und × tippen: die Zeile geht und bleibt nach dem Neuladen weg.
