# Sprung zur Funktion: Stelle bleibt im Bild, auch wenn die Seite darüber noch wächst

PR #NNNN · 26.11.2026 · Auftrag: Nachtlauf 25.11. (Ausprobieren Teil 66, Handy 3 / Computer 3), Wackel-Wächter

## Was ist neu
- Fast nichts Sichtbares: Wenn man in «Was die App kann» oder in einer Neuheiten-Zeile auf eine Funktion tippt, scrollt die App zur Stelle und lässt sie leuchten. Füllt sich die Seite darüber erst kurz danach (Beispiel «Gesten und Tricks» auf der Seite «Hilfe und Funktionen»: der Inhalt darüber wächst nach etwa 0,6 bis 1 Sekunde), lag die leuchtende Stelle bisher ausserhalb des Bildschirms. `light()` in `src/lib/know/spot.js` schaute nur einmal nach 0,4 Sekunden nach.
- **Fix:** `light()` schaut jetzt viermal nach (0,4 / 0,8 / 1,2 / 1,7 Sekunden) und holt die Stelle zurück, wenn sie ganz aus dem Bild gerutscht ist. Ist sie im Bild, bleibt alles, wie es ist (kein Zurückholen, wenn jemand selbst scrollt und die Stelle noch sichtbar ist).
- Test `ausprobieren.spec.js` (Zeile «Gestures and tricks»): lokal grün, 3 von 3 am Handy und 3 von 3 am Computer.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Die App angepasst, nicht den Test: der Fehler ist echt (die Stelle war nicht zu sehen), kein Zeitproblem des Tests.
- Nur ein kleiner Zeitraum (1,7 Sekunden): wer danach selbst wegscrollt, wird nicht zurückgeholt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In «Hilfe und Funktionen» auf «Gesten und Tricks» tippen (Neuheiten-Zeile oder Funktionsliste): die Karte leuchtet und ist im Bild.
