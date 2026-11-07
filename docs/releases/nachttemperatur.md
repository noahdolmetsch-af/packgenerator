# Nachttemperatur auf der Wetterseite

PR · 06.11.2026 · Auftrag: Noah «1a und c 2a 3a 4a 5a» (Thread «Planen: Nachttemperatur beim Wetter zeigen»)

Erster von drei kleinen PRs: (1) Daten und Karte auf der Wetterseite (dieser), (2) Orte-Liste und ruhige Zeile auf Heute, (3) Abend-Push (api/, eigener PR).

## Was ist neu
- Wetterseite, Reiter «Jetzt», unter der Karte «Heute»: Karte «Nachttemperatur» für den Ort, den die Seite zeigt (Wohnort, nächste Tour oder gesuchter Ort).
- Zwei Zahlen: «Heute früh» (letzte Nacht) und «Morgen früh» (nächste Nacht, Prognose), je der Tiefstwert zwischen 18 und 8 Uhr in ganzen Grad.
- Ruhige Hinweise, nur wenn sie ein Wort wert sind: «2° wärmer als gestern früh (3 °C)» (ab 2°), «10° wärmer als vor einer Woche (−5 °C)» (ab 3°), «Morgen früh 2° kälter als heute früh» (ab 2°).
- 14 Säulen: 7 Nächte zurück, heute früh (mit Rahmen) und 6 voraus. Unter 5 °C blau, ab 5 °C grün.
- Prognose: «sinkend» oder «steigend» (Mittel der Nächte 4 und 5 gegen die Nächte 1 und 2, ab 3° Unterschied), «Wieder 5 Plus in 3 Tagen» (erste Nacht ab 5 °C, wenn es jetzt kälter ist), «Frost in 4 Tagen» (erste Nacht unter 0 °C) oder «Frostfrei in 2 Tagen». Nach 5 Tagen steht «unsicher».
- Neue kleine Abfrage `src/lib/wetter/nacht.js`: nur die Temperatur, 8 Tage zurück und 9 voraus (rund 400 Zahlen), 3 Stunden gemerkt (nicht im Backup). Der Wetter-Kern bleibt unverändert.

## Was fällt weg oder rutscht tiefer
- nichts. Auf der Wetterseite rutscht alles unter «Heute» um die Höhe der neuen Karte tiefer (Handy etwa einen Bildschirm).

## Selbst entschieden
- Noah «1a und c»: Karte mit Säulenbild (Variante A mit dem Säulenbild von C). Die Zeile auf Heute folgt im zweiten PR.
- Noah «2a» (Wohnort, nächste Tour und Orte-Liste aus «Temperaturen nach Höhe»): die Orte-Liste ist erst mit #924 da (noch offen, mit Konflikt). Darum folgt sie im zweiten PR. Dieser PR folgt der Ortswahl der Seite (Wohnort, nächste Tour, Suche), das sind schon zwei der drei Quellen.
- Noah «3a»: Nacht = 18 bis 8 Uhr, benannt nach dem Morgen. Eine Nacht braucht 10 von 14 Stunden, sonst «–».
- Noah «4a»: «5 Plus» = erste Nacht mit mindestens 5 °C, wenn die letzte Nacht kälter war; Frost (unter 0 °C) als zweiter Hinweis. Beide Schwellen stehen als Konstanten in `nacht.js`.
- Der Wert ist der Modellwert der Open-Meteo-Stundenwerte (`temperature_2m`), auch für die Nächte in der Vergangenheit; kein Thermometer. Die Karte sagt es.
- Ein Ort ohne Antwort (offline, nichts gemerkt): die Karte sagt «Noch keine Nachtwerte» statt zu fehlen.
- Keine neue Funktion in `features.js`: gehört zu «Wetter für eine Fahrt» (`f.weather`), nur Suchwörter ergänzt (Nacht, Tiefstwert, Frost). Das Wetter hat keine Karte «Was du hier tun kannst», darum kein «Gut zu wissen»-Text.
- Open-Meteo ist von hier aus nicht erreichbar: die Rechnung ist nur mit erfundenen Stundenwerten geprüft.

## Entscheide (für decisions.md)
- 06.11.2026: Nachttemperatur als Karte mit Säulenbild, Nacht 18 bis 8 Uhr nach dem Morgen benannt, «5 Plus» = erste Nacht ab 5 °C, Abend-Push später als eigener PR (Noah «1a und c 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Nachttemperatur ergänzt. Offen: Orte-Liste (nach #924) und Zeile auf Heute (PR 2), Abend-Push (PR 3, api/).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter › Reiter «Jetzt»: unter «Heute» steht die Karte «Nachttemperatur» mit «Heute früh» und «Morgen früh».
2. Unter den Zahlen: 14 Säulen, die mit Rahmen ist heute früh. Vergleiche die Zahl mit einer Wetter-App für deinen Ort (1 bis 3 Grad Abstand sind normal).
3. An einem Tag mit Temperatursprung: der Hinweis «… wärmer als gestern früh» erscheint.
4. Anderen Ort suchen: die Karte zeigt die Nächte dieses Ortes.
