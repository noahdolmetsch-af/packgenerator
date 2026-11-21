# Richtiges Deutsch an sechs Stellen

Auftrag: Noah (Koordinator, 08.11.2026) aus dem UX-Test «Impeccable» vom 08.11.2026: die kleinen Anzeige- und Textfehler beheben. Dies ist der erste von mehreren kleinen PRs; die Zahlen-Widersprüche (#1178) und die Hilfe-Karten sind nicht darin.

## Was ist neu
- Rennen: «1 Nacht», «In 1 Nacht kommst du …», «1 Tag länger als 18 Stunden» statt «1 Nächte» und «1 Tage»; «Das Zelt wiegt 1.9 kg mehr und muss jeden Anstieg hoch» statt «Das Zelt sind …» (Befund 4-07: `src/lib/race/strategy.js`, `overview.js`, `prep/Papers.svelte`).
- Live-Karte, «Mit Freunden fahren»: «Du schickst einen Link, deine Freunde öffnen ihn …» statt «Sie öffnen …» (4-04).
- Vor der Abfahrt: der Satz zu den Papieren ist lesbar; «Wohnungshüter» immer in einem Wort (4-14).
- Stopps: «Dein Standort ist nicht freigegeben. Die Suche geht darum von deinem Wohnort aus.» (2b-15).
- Hinweise und News: ohne Verbindung steht, dass der Server nicht antwortet und was zu tippen ist; kein Wort mehr von der «Test-Vorschau» (7a-05).
- Abend-Rückblick: «ein paar Minuten · jede Frage lässt sich überspringen» statt «etwa 30 Sekunden» (2b-09), auch auf der Karte in Heute.

## Was fällt weg oder rutscht tiefer
- Der Satz «In einer Test-Vorschau ist das normal …» entfällt.
- Das Versprechen «etwa 30 Sekunden» beim Abend-Rückblick entfällt.

## Selbst entschieden
- Nur die Texte; keine Seite, kein Knopf, keine Daten, nichts an `api/`, Backup oder Speicherstruktur.
- «Ich suche …» (Vorschlag des Berichts) vermieden: die App spricht sonst nicht in der ersten Person.
- Ski-Check «fünf Gruppen» (4-17) bleibt für einen späteren PR: dort hängt die Zahl an der Liste, nicht nur am Text.
- Für den Abend-Rückblick keine Zeit gerechnet, weil die Fragen von «Deine Fragen» abhängen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rennen › Muster-Rennen, Reiter «Strategie»: die Risiken lesen sich richtig (bei genau einer Nacht «Nacht», nicht «Nächte»).
2. Ich › Hinweise und News ohne Netz oder ohne Server: Zeile ohne «Test-Vorschau».
3. Heute › Abend-Rückblick: unter dem Datum «ein paar Minuten».
