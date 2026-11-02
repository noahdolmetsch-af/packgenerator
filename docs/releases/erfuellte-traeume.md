# Erfüllte Träume

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N17

## Was ist neu
- Ein Traum, der als Tour geplant wurde, zählt als erfüllt, sobald der Rückblick dieser Tour fertig ist (`src/lib/dreams/erfuellt.js`).
- Touren › Träume: neuer Teil «Erfüllte Träume» mit Foto, Monat und km; ein Tipp öffnet den Rückblick. In der Traum-Liste steht «Erfüllt im Juli 2026» statt «Als Tour geplant».
- Rückblick › Vergangene Touren: die Jahreskarte nennt «Erfüllte Träume 2026: 2 · …» mit dem Foto des neusten (`src/lib/dreams/DreamsDoneLine.svelte`), unter der Neuland-Zeile.
- Neue Funktion im Katalog: `f.dreamsdone`.

## Was fällt weg oder rutscht tiefer
- Träume: «Weisse Flecken», «Herausforderungen», «Rennen zum Planen», «Gesammelt» und «Tourarten» rücken unter den neuen Teil (nur wenn es erfüllte Träume gibt).

## Selbst entschieden
- Nichts wird neu gespeichert: «erfüllt» folgt der Tour des Traums und ihrem Rückblick. Wird der Rückblick wieder geöffnet, ist der Traum wieder «geplant».
- Der Tag ist der letzte Tag der Tour.
- Die Jahreskarte heisst in der App «Dein 2026» (das «Jahresheft» aus dem Vorschlag).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 7 von 20 (N17). Als Nächstes N4 «Neue Kilometer».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Einen Traum als Tour planen, fahren und den Rückblick abschliessen.
2. Touren › Träume: der Traum steht unter «Erfüllte Träume» mit Monat; antippen öffnet den Rückblick.
3. Vergangene Touren: die Jahreskarte nennt «Erfüllte Träume».
