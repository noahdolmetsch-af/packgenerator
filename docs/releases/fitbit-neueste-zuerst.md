# Fitbit holt zuerst die neuesten Tage

PR · 02.11.2026 · Auftrag: Noah «Fitbit daten holen funktioniert nicht mehr» und «leere Maske, grosses Problem» (Thread «Fitbit-Daten holen funktioniert wieder»)

## Was ist neu
- Das Holen geht Fenster für Fenster vom neuesten zum ältesten Tag (`syncHealth`, `src/lib/health.js`). Vorher kamen erst zwei langsame Fenster mit alten Tagen; brach das Holen dazwischen ab, fing es beim ältesten wieder an und die neuen Tage kamen nie.
- Schlägt ein älteres Fenster fehl, nachdem ein neueres da ist, endet das Holen still und versucht die älteren Tage beim nächsten Mal wieder (die Karte zeigt keinen Fehler).
- Wartezeit pro Aufruf 60 statt 40 Sekunden (ein Fenster braucht auf dem Server rund 30 Sekunden).
- «Nie eine weisse Seite»: bleibt die App nach einem Fehler leer, zeichnet `src/lib/ui/whitepage.js` eine kleine Karte mit «Neueste Version laden».

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Die leere Maske liess sich nicht nachstellen (Fehler-, Timeout- und Missing-Fälle laufen ohne Absturz). Darum die Notkarte als Sicherung.

## Entscheide (für decisions.md)
- Keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- Keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten und Backup › Fitbit › «Jetzt holen»: Schlaf, Schritte usw. sagen «bis gestern» oder «heute».
2. Die Karte zeigt nach dem Holen kein «Keine Verbindung».
