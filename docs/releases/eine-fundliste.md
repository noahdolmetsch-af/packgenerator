# Eine Fundliste

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N10

## Was ist neu
- Neuland, Gipfelbuch und «Neuland des Jahres» lesen aus einer Liste (`src/lib/neuland/funde.js`), damit nichts doppelt abgehakt wird.
- Ein Gipfel oder Pass im Gipfelbuch (mit Ort) hakt Neuland ab, wie eine Fahrt dorthin: Gipfel, Pass, Kanton, Gemeinde. Die Zeile sagt «aus deinem Gipfelbuch». Für die Karten (weisse Flecken, neue km) zählt er nicht als Linie.
- Auswerten › Was mir gut tut › «Neuland {Jahr}» zeigt jetzt: deine eigenen Einträge, was Neuland dieses Jahr zum ersten Mal fand, die Gipfelbuch-Orte des Jahres und die Abende mit «Neu». Jeder Name nur einmal; die Zeile verlinkt dorthin, wo er herkommt. Die Zeile im Jahresrückblick (Touren › Rückblick) zählt gleich.
- Neue Funktion im Katalog: `f.findlist`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Liste «Neuland {Jahr}» wird länger, weil Funde aus Neuland und dem Gipfelbuch dazukommen; umbenennen und löschen geht weiter nur bei den eigenen Einträgen (die anderen änderst du dort, wo sie herkommen).

## Selbst entschieden
- Reihenfolge bei gleichem Namen: eigener Eintrag vor Neuland vor Gipfelbuch vor Abend. Namen werden ohne Gross-/Kleinschreibung und Akzente verglichen.
- Nichts wird kopiert oder umgeschrieben: jede Stelle liest nur. Keine Änderung am Speicher, nichts Neues im Backup.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 20 von 20 (N10), alle Ideen gebaut. Offen: Kompass «Träume» und Freie Zeit «Reisewünsche» in Träume zusammenführen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Einen Gipfel über 3000 m mit Ort ins Gipfelbuch eintragen.
2. Touren › Rückblick › Neuland › Gipfel: er ist abgehakt, «aus deinem Gipfelbuch».
3. Auswerten › Was mir gut tut › «Neuland»: er steht dort einmal, mit Link zu Neuland.
