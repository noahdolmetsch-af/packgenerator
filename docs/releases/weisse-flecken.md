# Weisse Flecken in der Nähe

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N1

## Was ist neu
- Touren › Träume: neuer Teil «Weisse Flecken in der Nähe» (`src/lib/neuland/WhiteSpots.svelte`, Logik `src/lib/neuland/flecken.js`). Eine Karte der Gemeinden um den Wohnort: besuchte gefüllt, nie besuchte gestrichelt, der Wohnort als Punkt. Darunter die nächsten nie besuchten Gemeinden mit Entfernung; ein Tipp nennt Name und Entfernung.
- Umkreis 10, 25 oder 50 km (Einstellung `neuland.spots`, Standard 25 km).
- Besuche kommen aus Neuland (Routen, Fahrten, eigene Haken), auch wenn die Sammlung «Gemeinden» dort ausgeschaltet ist.
- Ohne Wohnort: ein Knopf öffnet «Dein Wohnort».
- Neue Funktion im Katalog: `f.whitespots`.

## Was fällt weg oder rutscht tiefer
- Träume: «Rennen zum Planen», «Gesammelt» und «Tourarten» rücken unter den neuen Teil.

## Selbst entschieden
- Eine Gemeinde zählt als «in der Nähe», wenn ihre Mitte im Umkreis liegt.
- Die Liste zeigt die 5 nächsten, «Alle n zeigen» den Rest.
- Die Karte zeichnet nur die Gemeinden im Umkreis (eigene kleine SVG-Karte, offline, ohne Kartendienst). Die Gemeindedaten laden erst auf dieser Seite.
- Eine Runde durch einen Flecken planen kommt mit N2.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 2 von 20 (N1). Als Nächstes N5 «Herausforderungen mit Ende».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen und zu «Weisse Flecken in der Nähe» scrollen: die Karte um deinen Wohnort.
2. 10 km wählen: weniger Gemeinden; nach dem Neuladen bleibt 10 km gewählt.
3. Eine Gemeinde in der Liste antippen: Name, Entfernung und «noch nie» stehen über der Liste.
