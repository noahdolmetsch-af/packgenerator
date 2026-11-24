# Banner «Was ist neu» auf Heute

Auftrag: Noah «1-5a» (23.11.2026, Thread «Zuletzt gelöscht und weitere Bausteine»). Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- Nach jedem Update steht auf **Heute direkt unter den Chips eine einzige schmale Zeile** (ca. 44 px): «Neu: <neueste Neuerung> · und 2 weitere Dinge», dazu «Zeig mir» und ×.
- Die Zeile gilt «seit deinem letzten Besuch»: sie fasst alle Versionen seither zusammen (fast jeder Merge ist eine Version, darum gibt es nicht ein Banner pro Version).
- «Zeig mir» springt zur neuen Stelle (dasselbe wie «Ausprobieren» in Was ist neu); ein Tipp auf den Text öffnet die ganze Liste unter Ich › Was ist neu.
- Sie bleibt, bis man × tippt oder 7 Tage um sind. Der Schalter «Meldung nach Updates zeigen» (Ich › Was ist neu) bringt sie zurück.
- Der Hinweis «Wie war das Update? Zurück zum Stand vorher» (App-Wartung) steht weiter in der Zeile, wenn die App vor dem Update eine Kopie gemacht hat.

## Was fällt weg oder rutscht tiefer
- Das Banner «Neu in …» unter Ich → jetzt eine Zeile auf Heute (Ich zeigt nichts mehr).
- Die Reihe «Neu» (Kachel) unten auf Heute → fällt weg (die Kachel «Neu» bleibt im Katalog «Kachel hinzufügen»).
- Der doppelte «Neu»-Vorschlag in der Zeile «Heute entdecken» → fällt weg, solange die Zeile unter den Chips steht (die Zeile «Heute entdecken» zeigt dann wieder nur ihre Idee).

## Selbst entschieden
- Die Zeile steht unter den Chips und über dem Satz «Heute laut Plan» / «Heute entdecken», nicht über dem Haken-Block (Wunsch des Heute-Threads: Haken-Block bleibt zuoberst).
- Eine Zeile statt einer Karte (Variante a): Heute bleibt ruhig. Die Karte wäre mehr als doppelt so hoch.
- Nur die neueste Neuerung steht im Text, der Rest als «und N weitere Dinge», damit die Zeile auf dem Handy einzeilig bleibt (Text wird mit … gekürzt).
- Keine neue Funktion im Katalog (`f.news` beschreibt es); die Zeile in `docs/app-stand.md` steht bei «Update».
- Tests angepasst, weil die Stelle sich ändert: `au`, `ap29`, `app-wartung`, `wasneu-design`, `wasneu2-kiaus`, `heute-p6`.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 23.11.2026: Banner «Was ist neu» auf Heute (Noah «1-5a»): `docs/decisions/banner-was-ist-neu.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Nichts geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nach dem nächsten Update Heute öffnen: unter den Chips steht eine Zeile «Neu: …».
2. «Zeig mir» tippen: die neue Stelle öffnet sich, die Zeile ist weg.
3. Ich › Was ist neu: die ganze Liste ist da; unter Ich steht kein Banner mehr.
