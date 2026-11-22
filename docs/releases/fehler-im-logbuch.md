# Fehler im Logbuch (L1b)

21.11.2026 · Auftrag: Noah «a» (Thread «Prüfungen so einrichten, dass main grün bleibt»), Übergabe im Thread «Neue Verbesserungen finden»

## Was ist neu
- Die Fehler, die sich die App merkt (Fehler-Melder, nur auf dem Gerät), landen als Einträge der Art **«Fehler»** im Verbesserungs-Logbuch, markiert «Von der App gemerkt». Derselbe Fehler auf derselben Seite zählt hoch (statt eines neuen Eintrags), höchstens 50 solche Einträge.
- Das Logbuch holt sie, wenn es aufgeht und wenn der Knopf «Verbessern» lädt (`takeErrors()` in `src/lib/logbuch/fehler.js`). Schlägt die Datenbank fehl, bleiben die Fehler im Zwischenspeicher.
- «Auftrag kopieren» nimmt die Fehler mit (Seite mit Adresse, Art «Fehler»).

## Was fällt weg oder rutscht tiefer
- Die kleine Übergangskarte **«Gemerkte Fehler»** unter Ich › Daten (mit «Fehler kopieren» und «Liste leeren») fällt weg, wie in ihrem Kommentar vorgesehen (`UEBERGANG-FEHLERZEILE`). Neuer Weg: Ich › Verbesserungs-Logbuch, Filter «Falsch»; kopieren mit «Auftrag kopieren»; ein Eintrag lässt sich löschen.
- Der Browser-Test `fehler-melder.spec.js` prüft deshalb nicht mehr die Karte, sondern den Eintrag im Logbuch (geänderte Oberfläche, gleiche Prüfung: Fehler wird gemerkt, ohne privaten Text, ohne Reste).

## Selbst entschieden
- Die Fehlertexte bleiben, wie sie der Melder liefert (höchstens 200 Zeichen, ohne lange getippte Stücke); die Version des Melders wird nicht mitgespeichert.
- Fehler zählen im Logbuch als «Irgendwann»; wer will, ändert die Dringlichkeit im Eintrag.
- Der alte Hinweis in «Was ist neu» (Gemerkte Fehler) zeigt jetzt aufs Logbuch.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Verbesserungs-Logbuch: Anschluss des Fehler-Melders gebaut (L1b).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbesserungs-Logbuch öffnen: Einträge mit «Von der App gemerkt» sind Fehler, die die App gefunden hat.
2. Ich › Daten: die Karte «Gemerkte Fehler» ist weg.
