# Seiten laden: Name und Ladeanzeige sofort

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Antwort «5a»)

## Was ist neu
- Mit meinem echten Backup (nur lokal gemessen) war der Bereich unter dem Pfad bei einigen Seiten 0,5 bis 0,8 Sekunden leer (Vorrat, Vorlagen, Garderobe, Ausrüstung), bei hoher Last bis etwa 2 Sekunden: Der Code der Seite lädt beim ersten Besuch, und der graue Platzhalter kam erst nach 0,3 Sekunden.
- Jetzt kommt der Platzhalter nach 0,1 Sekunden, mit dem **Namen der Seite** (derselbe Name wie in der Pfadzeile) über dem Lade-Velo. Er blendet sanft ein (0,25 s), damit eine sehr kurze Wartezeit kaum etwas zeigt. Bei «Bewegung reduzieren» ohne Einblenden.
- Neu: `src/lib/nav/waittitle.js` (der Name), Änderung in `src/lib/nav/LazyPage.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts. Seiten, die schon einmal geöffnet waren, laden wie vorher ohne Platzhalter.

## Selbst entschieden
- Die Wartezeit bis zum Platzhalter ist 0,1 statt 0,3 Sekunden. Ein Titel steht nur im Platzhalter, nicht als Überschrift (`h1`), damit Pfadzeile und Vorlesehilfe nicht doppelt lesen.
- Nur die Seiten, die nachgeladen werden (alle ausser Heute). Heute hat seine eigene Ladeanzeige.
- Die Wartezeiten, die auf Daten warten, nachdem die Seite da ist, sind nicht Teil dieses PRs (dort steht der Seitenkopf schon).
- Regressionstest `tests/e2e/lade-platzhalter-titel.spec.js`: vorher rot (kein Name im Platzhalter), nachher grün. `einblenden`, `leer-laden` und `au` bleiben grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 2: Klasse-D-Frage 5 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App neu starten, dann Material › Vorrat öffnen: Gleich erscheinen der Name der Seite und das Lade-Velo, kein leerer Bildschirm.
2. Dieselbe Seite nochmals öffnen: Sie kommt wie vorher sofort, ohne Platzhalter.
