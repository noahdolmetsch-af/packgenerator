# Wege hierher: von welcher Seite, mit welcher Sportart

PR (noch offen) · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» (Thread «Plane Entdecken und Sammeln»), Schritt 3 der Reihenfolge

## Was ist neu
- Neuland › ein Ort mit grünem Haken: unter «Warum zählt das?» steht die Box **«Wege hierher»** (`ItemWays.svelte`, `src/lib/neuland/wege.js`).
- Sie listet **jeden Tag**, an dem eine Linie von dir den Ort streifte (nicht nur den ersten), und sagt, **von welcher Seite** du kamst: Norden, Osten, Süden oder Westen. Gerechnet wird aus der Linie: ab dem nächsten Punkt 3 km zurück, dort wird die Himmelsrichtung vom Ort aus genommen.
- Dazu die **Sportart** («Mit: Gravelfahrt 1× · Wandern 1×»), wenn der Tag aus Strava oder einer hochgeladenen Fahrt stammt. Die Route einer Tour allein kennt keine Sportart.
- Bei einem **Pass** nennt die Box die Seiten, die noch fehlen: «Noch nicht von: Norden. Eine andere Seite macht aus demselben Pass eine neue Fahrt.» Nur ein Hinweis, nichts zählt oder fehlt dadurch.
- Strava- und GPX-Linien tragen jetzt ihre Sportart in der Linie (`tracksOf`), damit sie hier gezeigt werden kann.

## Was fällt weg oder rutscht tiefer
nichts. Das Fenster eines Orts mit grünem Haken hat eine Box mehr; die Erkennung selbst ist unverändert.

## Selbst entschieden
- **Die Seite wird nicht gespeichert**, sondern jedes Mal aus der Linie berechnet. So kann nichts veralten, es ändert sich kein Datenformat, und der Backup-Test bleibt unberührt. Dafür gibt es kein «Seite ändern»: wer eine andere Seite meint, sieht an den Tagen, dass die Linie anders lief. Wenn dir das fehlt, ist «Seite von Hand setzen» ein eigener kleiner Schritt.
- **Vier Richtungen statt Passnamen** («Nordrampe»): so geht es ohne Liste für jeden der 130 Pässe und auch für jeden eigenen Ort. Die Himmelsrichtung ist die ehrliche Antwort auf «von wo»; eine Passliste mit Rampen-Namen wäre ein eigener Schritt.
- **Keine Seite** bei einer Linie unter 3 Punkten, einem Start näher als 1,5 km beim Ort oder einer Runde (Anfahrt endet weniger als 1 km vom Ort). Dann steht «Mal ist die Seite nicht klar», statt zu raten (Noah «3a»: nichts Unsicheres von selbst).
- **Ein Tag, ein Eintrag**: die Tour-Route und die Strava-Fahrt desselben Tages zählen einmal, die mit Sportart gewinnt.
- **Untergrund** (Asphalt, Schotter … aus OpenStreetMap, Noah «4b») ist der nächste Schritt und kommt als eigener PR, weil er online nachschlagen muss und ungenau ist.
- Teile der Fertig-Regel: keine eigene Seite und kein Sprung von aussen (die Box gehört ins Fenster des Orts); der leere Zustand ist, dass die Box fehlt, wenn keine Linie den Ort streift (ein von Hand angehakter Ort sagt das schon in «Warum zählt das?»); «Als Nächstes» ist der Hinweis auf die Seiten, die noch fehlen.

## Entscheide (für decisions.md)
nichts Neues.

## Stand im Plan
- Entdecken und Sammeln: Schritt 3 von 7 (Wege hierher: Seite und Sportart). Als Nächstes Untergrund aus Kartendaten, danach «Sammlungen mit Charakter».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland › Alpenpässe: einen gefahrenen Pass öffnen. Unter «Warum zählt das?» steht «Wege hierher» mit den Tagen und «Von Westen» / «Von Süden» usw.
2. Bei einem Pass, den du nur von einer Seite kennst, steht «Noch nicht von: …».
