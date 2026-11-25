# Die Tour-Seite liest sich leichter

PR #<Nummer> · 27.10.2026 · Auftrag: Noah «1a 2b 3a» (Thread «Tour-Detailseite übersichtlicher machen»)

## Was ist neu
- Tour-Seite: verstrichene Zeit, Gesamtzeit (unter dem Geschwindigkeitsprofil) und Stopps heissen «2 h 02 min 18 s» statt «00:02:02:18». Ab einem Tag ohne Sekunden: «1 Tag 2 h 15 min».
- Die Sprungleiste markiert am Computer («Alles auf einer Seite») den Teil, den du liest. Vorher leuchtete oben «Gepäck», weil die rechte Spalte zuerst erkannt wurde.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Sekunden bleiben stehen (Noah wollte am 21.10.2026 die genaue Zeit mit Sekunden); nur die Schreibweise ist neu.
- Nur auf der Tour-Seite (Werte, Kennzahlen, Gesamtzeit, Stopps). Die Ansichten «wie Strava» und «wie Garmin», die Fahrten-Liste und der Rückblick behalten dd:hh:mm:ss, weil sie bewusst wie die Vorbilder aussehen.
- Sprungleiste: markiert wird der erste sichtbare Teil in Lesereihenfolge (linke Spalte, dann rechte, dann Analyse).

## Entscheide (für decisions.md)
- 27.10.2026: Tour-Detailseite: kleine Fehler jetzt beheben (1a); der grosse Plan später in 2 Schritten (2b); Plan in die Vorhaben-Liste (3a).

## Stand im Plan (roadmap.md / vorhaben.md)
- Tour-Detailseite übersichtlicher: «gewünscht, geparkt» in `docs/vorhaben-liste.md`, Ziel 4, Schritt 1 und 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Fahrten › eine Fahrt öffnen: unter «Werte» steht die verstrichene Zeit wie «2 h 02 min 18 s».
2. Am Computer mit «Alles auf einer Seite»: oben ist «Übersicht» markiert; beim Scrollen wechselt es zu «Werte» und «Analyse».
