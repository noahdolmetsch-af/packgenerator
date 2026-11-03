# Karte aller Träume

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N14

## Was ist neu
- Touren › Träume: neuer Teil «Alle Träume auf einer Karte» unter der Traum-Liste (`src/lib/dreams/DreamsMap.svelte`). Alle Träume mit Karte, nummeriert am Start.
- Darunter die Liste: pro Traum neue Gemeinden, Pässe und Seen, das meiste Neue zuerst (`src/lib/dreams/kartealle.js`, mit der Neuland-Erkennung). Wo du schon warst, zählt nicht.
- Ein Tipp auf eine Zeile öffnet den Traum; beim Darüberfahren wird seine Linie hervorgehoben.
- Neue Funktion im Katalog: `f.dreamsmap`.

## Was fällt weg oder rutscht tiefer
- Träume: «Erfüllte Träume», «Weisse Flecken» und die Teile darunter rücken um die Karte nach unten (nur wenn ein Traum eine Karte hat).

## Selbst entschieden
- Gipfel und Hütten zählen nicht (meist nicht mit dem Velo).
- Erfüllte Träume sind nicht auf der Karte; als Tour geplante schon.
- Kartenkacheln wie auf jeder Karte der App: OpenStreetMap, nur online.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 12 von 20 (N14). Als Nächstes N8 «Passt jetzt: Ideen pro Monat».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Zwei Träumen eine Karte geben (GPX-Datei oder Ride-with-GPS-Link).
2. Touren › Träume: «Alle Träume auf einer Karte» zeigt beide mit Nummer.
3. Die Liste nennt das Neue; eine Zeile antippen öffnet den Traum.
