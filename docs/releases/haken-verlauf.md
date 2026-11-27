# Deine Haken, Tag für Tag

PR #1842 · 27.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Abhaken auf einen Blick verbessern», Schritt 2 von 3)

## Was ist neu
- Auswerten › Woche beginnt mit der Karte «Haken-Verlauf»: jede Aktivität als Zeile, jeder Tag als Spalte, ein Punkt, wo du abgehakt hast. Zuerst die letzten 10 Tage; ein Tipp schaltet auf 30 Tage, 3 Monate oder ein Jahr (die Wahl bleibt am Gerät).
- Ab 32 Tagen ist eine Spalte eine Woche; je dunkler, desto mehr Tage davon mit Haken. Wochenende und heute sind in der Spalte getönt.
- Zeilen nach Bewegen, Achtsam, Erholung gruppiert, die meisten Tage zuerst; am Zeilenende die Zahl der Tage mit Haken. Eine Zeile darunter nennt die Aktivitäten ohne Haken im Zeitraum.
- Ein Satz über der Tabelle: an wie vielen der Tage du etwas abgehakt hast.

## Was fällt weg oder rutscht tiefer
- Der Bericht von Auswerten › Woche (Zeitraum-Schalter, Satz, Zahlen, Balken) rutscht um die Höhe der Karte nach unten (Ersatz: die Karte ist das, was du am häufigsten ansehen willst; der Bericht bleibt unverändert darunter).

## Selbst entschieden
- Fertig-Regel: kein neuer Eintrag in `features.js` (die Karte gehört zur bestehenden Seite Auswerten › Woche), kein neuer Absprung (Heute abhaken → Auswerten gibt es schon), leerer Zustand und nächster Schritt stehen in der Karte («Zu Heute abhaken»).
- Nur Ansehen, kein Nachtragen per Tipp auf eine Zelle (am Handy zu klein für sichere Tippflächen; Nachtragen geht weiter auf Heute).
- Der Zeitraum der Karte ist unabhängig vom Zeitraum des Berichts darunter (verschiedene Fragen: 10 Tage Haken, aber eine Woche Stunden).
- Gleiche Zählung wie auf Heute (`entriesFor`), Haken von Strava-Einheiten stehen darin, soweit sie als Haken im Verlauf liegen.

## Entscheide (eigene Datei `docs/decisions/haken-verlauf.md`)
- 27.11.2026: Karte ganz oben in Auswerten › Woche (3a), eigener Zeitraum, nur Ansehen.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Schritt 2 von 3; Hinweise «Was auffällt» folgen als eigener PR).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Woche öffnen: oben die Karte «Haken-Verlauf» mit den letzten 10 Tagen.
2. «30 Tage», «3 Monate», «Jahr» antippen: die Spalten werden dünner, die Zahl am Zeilenende stimmt mit den Haken überein.
3. Seite verlassen und zurückkommen: der gewählte Zeitraum ist noch da.
