# Fahrfenster nennt dieselbe Regenzeit wie der Rest von Heute

Auftrag: Fund aus dem Live-Test der drei Wetterkarten (Noah «b», Thread «Prototyp»). Die Karte «Fahrfenster» sagte «Trocken bis 18:00», die Wetterkarte darüber «Regen ab 17:00».

## Was ist neu
- «Fahrfenster» liest die Regenzeit jetzt über dieselbe Regel wie der Rest der Wetterseite und von Heute (`rainStory` in `regenzeit.js`): Open-Meteo stempelt den Regen ans Ende der Stunde, der Wert «18:00» ist der Regen von 17:00 bis 18:00. Beide Karten nennen so dieselbe Zeit.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Karte nutzt `rainStory` ohne die 15-Minuten-Werte (es ist nur ein Fenster «bis wann trocken», keine Minutenangabe); die Wetterkarte kann darum in seltenen Fällen eine Viertelstunde genauer sein.
- Unit-Test und Browser-Test (`tests/heutekarten.test.js`, `tests/e2e/heute-karten.spec.js`) rechnen mit dem Stempel am Stundenende.

## Entscheide (eigene Datei)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter auf Heute: W1 und W2 fertig, Fehler in der Regenzeit behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute an einem Tag mit Regen am Nachmittag: «Regen ab …» in der Wetterkarte und «Trocken bis …» im Fahrfenster nennen dieselbe Uhrzeit.
2. «Heute nicht» beim Fahrfenster legt es für den Tag weg.
