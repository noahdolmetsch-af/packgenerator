# Quick Links springen genau hin

PR (Quick Links, Schritt 3 von 8) · 28.10.2026 · Auftrag: Noah «5a» (Tipp springt genau hin und leuchtet) und «18a» (Ansicht mit Filter anpinnen), «ok quick links» (Thread «Quick Links»)

## Was ist neu
- Ein Tipp auf einen Pin in Quick Links öffnet die Seite und lässt die Karte der Funktion kurz leuchten (`glowFeature` in `src/lib/quick/findcard.js`; Funktionen mit eigenen Schritten in `know/spot.js` nehmen diese).
- Die Pinnadel beim Seitentitel merkt sich die Ansicht, also die Seite mit ihrem Filter, so wie sie gerade ist (`addView` in `src/lib/quick/quicklinks.js`). In Quick Links steht sie mit «Ansicht mit Filter».
- Die Suche nach der Karte ist jetzt ein gemeinsamer Teil (`findCards`) für Pinnadeln und Leuchten.

## Was fällt weg oder rutscht tiefer
- Nichts.

## Selbst entschieden
- Eine Aktion (neue Tour, Notiz, km) öffnet ihr Fenster wie bisher; da gibt es keine Karte zum Leuchten.
- Auf Heute gibt es keine Pinnadel beim Titel, Heute ist immer einen Tipp entfernt.
- Eine Ansicht merkt sich die Adresse samt Filter; ändert sich die Seite später, öffnet sie trotzdem.

## Entscheide (für decisions.md)
- 28.10.2026: Pins können eine Funktion oder eine Ansicht (Adresse mit Filter) halten.

## Stand im Plan (roadmap.md / vorhaben.md)
- Quick Links: Schritt 3 mit diesem PR. Es folgen: 4 Zuletzt geöffnet / Vorschlag / Aufräumen nach 30 Tagen, 5 Werte und Punkt, 6 Passend zum Moment, 7 Top 4 auf Heute, 8 Suche, `g q`, App-Symbol-Kurzbefehle.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In Quick Links «Wetter für eine Fahrt» antippen: die Wetter-Seite öffnet sich und die Karte leuchtet kurz.
2. Touren öffnen, die Liste filtern, die Pinnadel beim Titel antippen: die Ansicht steht in Quick Links und öffnet sich mit dem Filter.
