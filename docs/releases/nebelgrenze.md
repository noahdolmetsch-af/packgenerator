# Nebelgrenze jeden Tag

Auftrag: Noah «idee: nebelgrenze immer aktuell anzeigen (neben den aktuellen wetter daten). was würde zusätzlich noch sinn machen», Antworten «1a 2b 3a 4b» (Thread «Nebelgrenze beim Wetter anzeigen»).

## Was ist neu
- Wetterseite, Karte «Heute», unter der Schneefallgrenze: «Nebelgrenze ca. 800 m ü. M., darüber Sonne» (oder «darüber Wolken»). An Tagen ohne Hochnebel steht «Keine Nebelgrenze: kein Hochnebel erwartet» (Noah «2b»: immer sichtbar).
- Dein Ort: «Dein Ort (410 m) liegt im Nebel» oder «… über dem Nebel». Die Höhe ist die der Schneefallgrenze-Einstellung, sonst die Höhe des Ortes.
- Verlauf: «Der Nebel löst sich gegen 11 Uhr auf», «bleibt bis zum Abend» oder «zieht gegen 17 Uhr auf», dazu sechs Zeitpunkte (6, 9, 12, 15, 18, 21 Uhr).
- Temperatur oben und unten: «Auf 900 m ist es 2 °C wärmer als bei dir» (über der Nebelgrenze, ohne Nebel auf 1000 m); nur ab 2 °C Unterschied.
- Sichtweite als Zahl: «Sicht 600 m», «Sicht 4,4 km», «Sicht über 20 km».
- Heute: eine ruhige Zeile für den Wohnort unter der Schneefallgrenze, Tippen öffnet die Wetterseite. Ausschalten unter «Nebelgrenze einstellen».
- Gemeinsame Luftschichten: `src/lib/wetter/profil.js` (eine Abfrage pro Ort, 9 Druckflächen von 1000 bis 600 hPa, 3 Stunden gemerkt). Der Thread «Temperaturen nach Höhe» baut darauf (`loadProfil`, `tempAt`).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Open-Meteo hat keine fertige Nebelgrenze und ist von hier aus nicht erreichbar: die Rechnung ist nur mit Test-Daten geprüft, die Namen der Druckflächen-Werte (`temperature_925hPa`, `relative_humidity_925hPa`, `geopotential_height_925hPa`) stammen aus der Open-Meteo-Anleitung. Fehlen sie, zeigt die App nichts (keine erfundenen Werte). Nach dem Merge an einem echten Nebeltag mit der Webcam vergleichen.
- Regel: feuchte Schicht (Feuchte ab 90 %) bei mindestens 70 % tiefer Bewölkung; Obergrenze dort, wo die Feuchte durch 85 % fällt; nur wenn darüber die Luft nicht kälter wird (Inversion). Dicke Regenwolken ergeben keine Nebelgrenze. Werte auf 100 m gerundet, die Seite nennt die Genauigkeit (etwa 200 m).
- «Darüber Sonne», wenn mittlere und hohe Wolken unter 50 % liegen, sonst «darüber Wolken».
- Eigene Abfrage statt Erweiterung der Wetterantwort (kern.js): nur 3 Tage, damit die Wetterantwort klein bleibt. Der Start der App wächst nur um den kleinen Code; die Abfrage läuft erst beim Öffnen von Heute oder Wetter.
- Keine neue Funktion in `features.js`: gehört zu «Wetter für eine Fahrt» (`f.weather`), nur Suchwörter ergänzt (Nebelgrenze, Hochnebel, Sicht). Kein «Gut zu wissen»-Text: die Wetterseite hat keinen (Karte «Was du hier tun kannst» fehlt dort).
- Einstellung `fogHome` wie `snowHome`: normale, mitgesicherte Einstellung.

## Entscheide (für decisions.md)
- 05.11.2026: Nebelgrenze immer sichtbar, auch «keine» (Noah «2b»); mit Dein-Ort-Hinweis (Noah «3a»), «darüber Sonne», Verlauf, Temperatur oben/unten und Sichtweite (Noah «4b»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter: Nebelgrenze ergänzt. «Temperaturen nach Höhe» (500 bis 4000 m, Zürichsee-Nachbar, Skitouren) baut auf `profil.js`.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter › Karte «Heute»: unter der Schneefallgrenze steht die Nebelgrenze (oder «Keine Nebelgrenze …»), dazu Sicht und sechs Zeitpunkte.
2. An einem Nebeltag: «Dein Ort liegt im Nebel» und «löst sich gegen … Uhr auf»; mit einer Webcam im Mittelland vergleichen.
3. Heute: eine graue Zeile «Nebelgrenze …» unter der Schneefallgrenze; Tippen öffnet die Wetterseite.
4. Wetter › «Nebelgrenze einstellen»: Haken bei «auf Heute zeigen» wegnehmen, die Zeile verschwindet auf Heute.
