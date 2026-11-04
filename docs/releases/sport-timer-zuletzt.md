# Timer auf jeder Sportart, Zuletzt genutzt oben

Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Untersuchen: Aktiv und Auswerten besser einbauen»), Schritt 5 von 9

## Was ist neu
- Jede Sportseite mit einer Aktiv-Aktivität hat einen Baustein «Timer» (Vorlage war der Timer der Meditation): «Timer starten» öffnet die Stoppuhr mit dieser Sportart. Er steht gleich nach «Ziele» und ist wie jeder Baustein abschaltbar (Bausteine anpassen).
- Oben auf «Meine Sportarten» steht «Zuletzt genutzt»: die drei Sportarten, die du zuletzt abgehakt hast, je ein Tipp auf ihre Seite. Ohne Haken zeigt es nichts.

## Was fällt weg oder rutscht tiefer
- nichts. Bei Sportarten, deren Bausteine du schon sortiert hast, steht «Timer» ganz unten (neue Bausteine reihen sich hinten an), zum Verschieben gibt es die Pfeile.

## Selbst entschieden
- Der Timer-Block gehört zu den Grund-Bausteinen (jetzt acht), weil er «auf jeder Sportseite» sein soll. Sportarten ohne Aktiv-Aktivität (Skitour, Gravel …) zeigen den Hinweis «Den Timer gibt es für Sportarten, die du in Aktiv abhakst.», da die Stoppuhr an eine Aktivität gebunden ist.
- Meditation behält ihre eigene Seite mit Timer (Vorlage).
- «Zuletzt genutzt» zählt nach dem Tag des letzten Hakens, pausierte Sportarten fehlen.
- Keine neue Funktion in `features.js` (Block und Zeile gehören zu bestehenden Seiten).

## Stand im Plan
- Aktiv und Auswerten: Schritt 5 gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Meine Sportarten: oben «Zuletzt genutzt» mit drei Sportarten.
2. Eine Sportart öffnen (zum Beispiel Gym): Baustein «Timer» nach «Ziele», «Timer starten» tippen.
3. «Bausteine anpassen» › «Timer» ausschalten: der Baustein verschwindet.
