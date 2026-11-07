# Zusammenlegen: Die Suche findet auch die Vorschläge

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Antwort «3a»)

## Was ist neu
- Im Fenster «Zusammenlegen mit …» liess die Suche die Vorschläge aus. Tippte man den Namen eines vorgeschlagenen Teils, stand darunter «Kein Teil gefunden», obwohl der Vorschlag darüber das Wort enthielt. Jetzt kommt ein Vorschlag, der zur Suche passt, auch in die Treffer, mit dem Hinweis «Vorschlag».
- Das Teil steht dann in zwei Listen (Vorschläge und Treffer); ein Tipp auf eine der beiden Zeilen hakt beide an oder ab (gleiche Auswahl).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die Vorschläge bleiben oben stehen; die Treffer wiederholen sie nur, wenn sie zum Suchwort passen. So bleibt die Liste vorhersehbar, und niemand muss wissen, dass ein Vorschlag nicht mitgesucht wird.
- Weiter bis zu 8 Treffer.
- Regressionstest `tests/e2e/zusammenlegen-suche.spec.js` (erfundene Daten): vorher rot, nachher grün, Handy und Computer.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 2: Klasse-D-Frage 3 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ein Teil öffnen, «Mehr › Zusammenlegen mit …». Den Namen eines vorgeschlagenen Teils in «Alle Teile durchsuchen» tippen: Es steht in den Treffern, mit «Vorschlag».
2. Dort antippen: Das gleiche Teil ist bei den Vorschlägen darüber ebenfalls angehakt.
