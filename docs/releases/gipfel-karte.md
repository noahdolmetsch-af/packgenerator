# Gipfel-Karte mit Lücken

PR #<Nummer> · 24.11.2026 · Auftrag: Noah «alle 1-5 zusammen» (Thread «Gipfelbuch ausbauen»), Idee 2 von 5

## Was ist neu
- Neue Seite `#/flow/gipfelbuch/karte` («Karte der Gipfel und Pässe»), erreichbar über «Auf der Karte ansehen» bei den Sammlungen und die Zeile am Ende des Gipfelbuchs.
- Die Karte der App (ohne Kartendienst, offline) zeigt Gipfel und Pässe des Katalogs als Punkte: was im Gipfelbuch steht kräftig, die sechs nächsten offenen vom Wohnort aus heller, der Rest grau. Orte im Buch, die der Katalog nicht kennt, zeigt sie auch (wenn sie eine Position haben).
- Filter: Alle, Gipfel, Pässe und jede Sammlung. Schalter Schweiz / Alpen. Eine Legende in Worten.
- Unter der Karte «In deiner Nähe offen»: Name, Höhe, Luftlinie. «Touren dorthin» liest die Tourenvorschläge (erst auf Tipp) und nennt bis zu drei Touren, deren Linie höchstens 1 km am Ort vorbeiführt, mit Link auf die Tour; sonst steht da, dass keine dorthin führt, mit Link zu den Tourenvorschlägen. «Ich war da» trägt den Ort ein (Tag wählen, Rückgängig).
- Ohne Wohnort zeigt die Liste die höchsten offenen Orte und bietet «Wohnort setzen» an.
- Ein Tipp auf einen Punkt zeigt dessen Karte über der Liste.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Karte ist eine eigene Seite unter dem Gipfelbuch und kein Block darüber (Regel «Inhalt zuerst»).
- Die Tourensuche rechnet hier selbst mit der Linie (Abstand Linie–Ort, wie bei den Pässen), weil die Funktion «toursNear» des Touren-Threads noch nicht auf `main` ist; sie lässt sich später gegen diese austauschen. Das Tourennetz (1 MB) lädt nur auf Tipp.
- «Nächste Lücken» heisst: die 6 nächsten Orte des gewählten Filters, die nicht im Buch stehen. Kein Ziel, keine Zahl für das Fehlende.
- «Fertig-Regel»: Seite = `f.gipfelbuch` (Text ergänzt); Absprung = zwei Links aus dem Gipfelbuch; leerer Zustand = Filter ohne Orte; als Nächstes = Zeile unter der Karte; App-Stand ergänzt.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- keine neuen; Reihenfolge siehe `docs/decisions/gipfelort-seite.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Gipfelbuch ausbauen: Idee 2 von 5 online; als Letztes folgt «Welcher Berg ruft?» auf Heute.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Gipfelbuch › Sammlungen › «Auf der Karte ansehen»: Punkte auf der Karte, drei Farben.
2. Falls verlangt «Wohnort setzen»; dann stehen die sechs nächsten offenen Orte unter der Karte.
3. «Touren dorthin» tippen: bis zu drei Touren mit Link oder ein Hinweis, dass keine dorthin führt.
4. «Ich war da» tippen, Tag wählen, speichern: der Ort verschwindet aus der Liste, sein Punkt ist kräftig.
