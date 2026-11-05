# Passt jetzt: Ideen pro Monat

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N8

## Was ist neu
- Touren › Träume, unter der Traum-Liste: «Passt jetzt: Ideen für Oktober» (`src/lib/dreams/MonthIdeas.svelte`). Ein Tipp auf einen Monat in der Ansicht «Jahr» zeigt dessen Ideen; der Block steht in den Ansichten «Liste» und «Jahr».
- Zehn eingebaute Ideen mit ihren üblichen Monaten (`src/lib/dreams/monatsideen.js`): Nebelmeer, hohe Pässe offen, Jura zuerst, Seen zum Baden, Lärchen, Blüte, lange Tage, milder Süden, trockene Schotterwege, lange Nächte.
- «Als Traum» macht aus einer Idee einen Traum mit ihren Monaten.
- Eigene Ideen: hinzufügen (für den gezeigten Monat), umbenennen mit Monaten, löschen mit Rückgängig. Eingebaute ausblenden und wieder zeigen.
- Einstellung `dreams.monthIdeas` (im Backup). Neue Funktion im Katalog: `f.monthideas`.

## Was fällt weg oder rutscht tiefer
- Träume: «Erfüllte Träume» (zugeklappte Zeile), «Weisse Flecken» und die Teile darunter rücken um den Ideen-Block nach unten.

## Selbst entschieden
- Pass-Öffnung als übliche Monate, nicht live (wie im Vorschlag).
- Die Ideen stehen unter der Liste und auch in der Ansicht «Jahr», damit die Monatswahl und ihre Ideen zusammenbleiben (die Ansichten gibt es seit der neuen Träume-Seite).
- Der Name «Passt jetzt: Ideen pro Monat» steht im Satz unter dem Eingabefeld, damit der Funktionstest ihn auf der Seite findet.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 13 von 20 (N8). Als Nächstes N6 «Feierabend-Biwak».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: «Passt jetzt: Ideen für …» mit den Ideen des Monats.
2. Auf «Jahr» tippen, dort einen anderen Monat antippen: seine Ideen erscheinen.
3. Eine eigene Idee hinzufügen, dann «Als Traum»: der Traum steht in der Liste.
