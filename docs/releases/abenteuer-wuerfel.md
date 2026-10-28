# Abenteuer-Würfel

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N19

## Was ist neu
- Touren › Träume, unter «Sonnenaufgang auf dem Hügel»: «Abenteuer-Würfel» (`src/lib/dreams/DiceCard.svelte`). «Würfeln» gibt eine kleine Spielregel für die nächste Fahrt; sie bleibt stehen bis zum nächsten Wurf und kommt nie zweimal hintereinander.
- Zwölf eingebaute Regeln (`src/lib/dreams/wuerfel.js`), z. B. «Nur Schotter, wo es geht», «Ein Kaffee in einem Dorf, wo du nie warst», «Die erste Stunde ohne Karte».
- Unter «Regeln»: eigene hinzufügen, umbenennen, löschen (mit Rückgängig); eingebaute ausblenden und wieder zeigen.
- Einstellung `dreams.dice` (im Backup). Neue Funktion im Katalog: `f.dice`.

## Was fällt weg oder rutscht tiefer
- Träume: «Alle Träume auf einer Karte», «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um den Würfel nach unten.

## Selbst entschieden
- Die Regelliste ist zugeklappt, damit der Würfel klein bleibt.
- Geht ganz offline.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 17 von 20 (N19). Als Nächstes N12 «Ein Abenteuer im Monat».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume: bei «Abenteuer-Würfel» «Würfeln» tippen; eine Regel erscheint.
2. «Regeln» öffnen, eine eigene Regel hinzufügen und eine eingebaute ausblenden.
