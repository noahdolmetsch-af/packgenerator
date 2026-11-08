# Spruch auf Heute: mehr Quellen (PR 2)

PR folgt · 07.11.2026 · Auftrag: Noah «bau spruch pr2» (Thread «Entwerfen: täglicher Einstiegs-Spruch»)

## Was ist neu
- Die Kachel «Spruch» kennt **fünf neue Quellen**:
  - **Schritte** (Uhr): gestern 12 000 oder mehr, gestern deutlich über deinem Normal, heute schon 6 000 (bis 15 Uhr). Nur Tageswerte, keine Stundenwerte.
  - **Serie:** Wochen in Folge mit etwas Aktivem (dieselbe Zahl wie die Kachel «Serie und Meilensteine»), und eine Herausforderung, wenn das nächste Serienziel höchstens 2 Wochen weg ist.
  - **Velo-Kilometer** des Jahres (dieselben Fahrten wie die Jahreszeile): eine Marke von 250 bis 10 000 km in den letzten 7 Tagen erreicht, oder eine Marke höchstens 60 km weg.
  - **Vor einem Jahr:** die Tour um diesen Tag vor einem Jahr (nur der Titel).
  - **Zitate** aus der «Kissenzeit» (deine eingeschalteten, auch eigene), auf **Hochdeutsch**, wie sie dort stehen.
- Dazu ein Satz **Nebel zieht ab** («Dr Näbel verzieht sech am eis», aus der Nebelgrenze) bei den Wetter-Sätzen.
- Jeder bisherige und jeder neue Satz hat eine **zweite Formulierung** (Berndeutsch). Dieselbe Zahl kann so in 30 Tagen anders gesagt werden.
- Zitate kommen **jeder vierte Satz** (wenn keiner der letzten drei ein Zitat war) und **immer dann, wenn sonst nichts passt**. Auch ohne Uhr, Wohnort und Tour zeigt die Kachel jetzt ein Zitat; leer ist sie nur noch, wenn alle Zitate ausgeschaltet sind.
- «Warum?» zeigt auch bei den neuen Sätzen die Zahl dahinter; bei Zitaten steht «Ein Zitat aus deiner Liste unter «Kissenzeit»».
- Das kleine Etikett nennt die Quelle (Schritte, Serie, Velo-Kilometer, Vor einem Jahr, Zitat).

## Was fällt weg oder rutscht tiefer
- nichts. Die leere Kachel mit «Wetterort festlegen» und «Tour planen» zeigt sich nur noch, wenn auch alle Zitate ausgeschaltet sind.

## Selbst entschieden
- Der Verlauf bleibt bei den letzten 30 Sätzen; eine zweite Formulierung zählt als eigener Satz (`w.dry-mild~2`). «Neuer Spruch» zeigt aber nie die andere Formulierung desselben Satzes direkt danach.
- Die Zitate kommen nach einer festen Regel (jeder vierte), nicht nach Zufall. So ist die Kachel nachvollziehbar und der Test sicher.
- Zitate haben den Ton «ruhig» und sind an einem Tag mit auffälligem Schlaf oder Ruhepuls erlaubt (keine Herausforderung).
- Eigene Zitate aus der Kissenzeit erscheinen auch hier. Sie bleiben auf dem Gerät und kommen nicht ins Repo.
- Velo-Marken: 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000 km. «Eine Woche zuvor» zählt nur im selben Jahr (in den ersten Tagen des Jahres gibt es keinen Marken-Satz aus dem Vorjahr).
- Die neuen Berndeutsch-Sätze sind Schreibweise nach Gehör und lassen sich auf Noahs Hinweis einzeln ändern.
- Nicht in PR 2 (laut Plan später): Tonwahl, «Nicht mehr solche», Seite «Alle Sprüche», eigene Sprüche (PR 3 und 4).
- Fertig-Regel: wie in PR 1. Die Kachel hat keinen eigenen Eintrag in `features.js` (Wächter `heimat.spec`, 2,5 Bildschirme); die Zeile in `docs/app-stand.md` ist aktualisiert; leere Ansicht und «Als Nächstes» bleiben wie in PR 1.

## Entscheide (für decisions.md)
- 07.11.2026: Quellen von PR 2 beschlossen (Schritte, Serie, Velo-Kilometer, Vor einem Jahr, Nebel, Zitate); Zitate bleiben Hochdeutsch, Sätze Berndeutsch.

## Stand im Plan
- Spruch zum Einstieg: PR 2 von 4 (mehr Quellen, zweite Formulierungen, Zitate). Plan: `design/tagesspruch/konzept.md` im Projektordner.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute die Kachel «Spruch» ansehen und «Neuer Spruch» einige Male tippen: neben Wetter, Zonenminuten, Schlaf und Tour kommen jetzt auch Schritte, Serie, Velo-Kilometer, «Vor einem Jahr» und hin und wieder ein Zitat auf Hochdeutsch.
2. Bei einem neuen Satz «Warum?» tippen: die Zahl dahinter erscheint.
3. Dieselbe Zahl in einigen Tagen: der Satz kann in anderen Worten kommen.
