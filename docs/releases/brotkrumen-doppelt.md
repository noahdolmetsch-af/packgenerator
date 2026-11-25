# Pfad über der Seite: kein Name doppelt

PR #<Nummer> · 05.11.2026 · Auftrag: Noah (Durchklick Etappe 2, Antwort «2a»)

## Was ist neu
- Die kleine Pfadzeile über dem Seitentitel (`PathLine.svelte`) hängt den Titel der Seite nur noch an, wenn kein Schritt des Pfads schon so heisst. Vorher stand «Touren › Übersicht › Touren», «Material › Alles › Material», «Aktiv › Heute › Aktiv», «Auswerten › Übersicht › Auswerten». Jetzt steht «Touren › Übersicht»; der letzte Schritt ist die Seite selbst (kein Link).
- Die Regel steckt in `src/lib/nav/pathlast.js` und ist mit `tests/pathlast.test.js` getestet.

## Was fällt weg oder rutscht tiefer
- Die letzte Stufe, wenn sie wie der Ort oder der Reiter heisst. Sie war nur eine Wiederholung; der Ort bleibt ein Link.

## Selbst entschieden
- Es zählt jeder Schritt (Ort und Reiter), nicht nur der letzte: Das behebt auch «Aktiv › Heute › Aktiv» und «Auswerten › Übersicht › Auswerten», die ich im Bericht nicht einzeln genannt hatte.
- Seiten mit eigener Pfadzeile (PathHead, Crumbs) sind nicht betroffen.
- Regressionstest `tests/e2e/brotkrumen-doppelt.spec.js`: vorher rot (4 von 5 Seiten), nachher grün.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Durchklick Etappe 2: Klasse-D-Frage 2 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren öffnen: Der Pfad über dem Titel heisst «Touren › Übersicht», ohne zweites «Touren».
2. Material und Aktiv öffnen: Auch dort kommt kein Name doppelt vor.
