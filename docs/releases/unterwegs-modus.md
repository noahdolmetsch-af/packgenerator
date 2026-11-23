# Unterwegs-Modus auf «Meine Tour»

Plan «ganze App», Schritt 7a · Auftrag: Noah 08.11.2026 «9 b» (Unterwegs-Modus per Knopf) und 23.11.2026 «jetzt» (Thread «Prototyp»)

## Was ist neu
- Auf der Karte «Meine Tour» auf Heute steht unten ein leiser Knopf **«Unterwegs-Modus einschalten»**. Erst dein Tipp schaltet ihn ein; er startet nie von allein.
- Eingeschaltet zeigt die Karte statt der Packschritte nur, was du unterwegs brauchst: **«Live-Karte öffnen»** (Hauptknopf), **«Notiz mit Foto»**, **«Panne notieren»** (öffnet die Notiz mit «Panne: » vorn) und **«Tagesübersicht ›»** (`#/ride`). **«Unterwegs-Modus ausschalten»** bringt die vier Phasen und den nächsten Schritt zurück.
- Der Modus gehört zu **einer** Tour: Zeigt Heute eine andere Tour, oder ist die Tour vorbei (die Karte ist dann weg), ist er aus.
- Gespeichert ist er als eine Einstellung (`unterwegsMode` = Tour und Zeit), also im Backup wie jede Einstellung; kein neues Schema, kein neues Backup-Feld. Code: `src/lib/tourpfad/unterwegs.js`, Karte `src/lib/home/MeineTour.svelte`.

## Was fällt weg oder rutscht tiefer
- Nichts. Bei ausgeschaltetem Modus ist die Karte wie vorher, plus der leise Knopf. Bei eingeschaltetem Modus sind Packbalken, Basisgewicht, Phasen und «Als Nächstes» ausgeblendet (ein Tipp auf «ausschalten» bringt sie zurück); «Alle Schritte ›» bleibt.

## Selbst entschieden
- **Wann der Knopf steht:** immer, solange die Karte steht (nicht erst am Starttag), weil «Noah schaltet ihn selbst ein» keine Bedingung nennt. Eine Frage wäre: erst ab zwei Tage vor dem Start zeigen (a/b im Thread).
- **Was der Modus zeigt:** nur Dinge, die es schon gibt (Live-Karte, Notiz, Tagesübersicht). Die Karte «Pausen», «Notfall» und «Wetter jetzt» aus dem Entwurf bleiben auf der Tagesübersicht, damit der PR klein bleibt; sie kommen bei Bedarf als eigener PR.
- **Panne notieren:** eine Notiz mit «Panne: » am Anfang (kein neuer Datensatz). Der Rückblick fragt die Panne weiter wie bisher ab.
- **Fertig-Regel:** Seite und Absprung: die Karte «Meine Tour» (Zeile in `docs/app-stand.md` ergänzt); «Gut zu wissen»: Heute hat sein «?»; Leer-Zustand: ohne geplante Tour keine Karte; nächster Schritt: «Live-Karte öffnen»; neue Funktion in `features.js`: keine, der Modus ist ein Knopf einer bestehenden Karte.
- Tests: `tests/unterwegs-modus.test.js`, `tests/e2e/meine-tour.spec.js` (neuer Test; die Zeile «kein Unterwegs-Modus» gilt nicht mehr und prüft jetzt, dass er aus ist).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App», Zeile 7a: gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute in der Karte «Meine Tour» unten «Unterwegs-Modus einschalten» tippen.
2. Die Karte zeigt «Live-Karte öffnen», «Notiz mit Foto», «Panne notieren», «Tagesübersicht».
3. Seite neu laden: der Modus ist noch an. «Unterwegs-Modus ausschalten» tippen: die vier Phasen sind wieder da.
