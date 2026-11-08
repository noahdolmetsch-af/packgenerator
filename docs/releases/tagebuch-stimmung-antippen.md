# Tagebuch: die Stimmungskurve zum Antippen

PR 12 (#1146) · 07.11.2026 · Auftrag: Noah «ja» (Thread «Diagramme klickbar machen»), PR 12, Rückblick (Teil 2)

## Was ist neu
- Die Stimmungskurve der letzten 90 Tage (Tagebuch › Rückblick, `Rueckblick.svelte`) nutzt jetzt `LineChart`: die fünf Smileys als Achse, genaue Stimmung eines Tages beim Zeigen oder mit den Pfeiltasten, Tippen öffnet ein Fenster (Stimmung, Zahl der Einträge, «Tag davor» / «Nächster Tag»), «Als Tabelle» listet die Tage mit Stimmung, neuester zuerst.
- `LineChart` kann die Linie über Tage ohne Wert verbinden (`bridge`), damit eine Stimmung, die nur ab und zu notiert wird, eine Kurve ergibt und nicht nur Punkte.

## Was fällt weg oder rutscht tiefer
- nichts. Die Kurve ist größer und hat Punkte nur an den Tagen mit Stimmung wie vorher; «Was zusammen geht» und alles darunter bleibt.

## Selbst entschieden
- Datumsbeschriftung nur alle 30 Tage (auf dem Handy sonst übereinander), Zeigen und Tabelle nennen jeden Tag.
- Das Fenster zeigt nur Stimmung und Zahl der Einträge, keine Texte aus dem Tagebuch (privat, Rückblick ist nur Beobachtung).
- Ein Schritt pro PR: «Puls und Leistung» (`HeartPower`), `MiniBars` und «In Zahlen» kommen einzeln.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 12 (Tagebuch-Stimmung). Danach übrige Rückblick-Diagramme, Unterwegs, Rennen, Ski, Garmin.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tagebuch › Rückblick (die Kurve erscheint, sobald du an zwei Tagen ein Smiley gewählt hast): auf die Kurve zeigen, Tag und Stimmung stehen darüber.
2. Einen Tag antippen: ein Fenster zeigt Stimmung und Einträge, «Tag davor» und «Nächster Tag» blättern.
3. «Als Tabelle» antippen: die Tage mit Stimmung, neuester zuerst.
