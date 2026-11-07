# Analyse: Filter-Karte nur wo sie wirkt, am Handy eine Zeile

PR #<offen> · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5b und alle A-F» (Thread «UI-Test Analyse», Antwort 3a)

## Was ist neu
- Die Karte «Daten aus / Zeitraum / Zeigen» über den Reitern zeigt nur noch, was der Reiter braucht:
  - Überblick: Quellen und Zeitraum.
  - Rekorde und Serien, Velos: nur Zeitraum.
  - Alle Werte: Quellen, Zeitraum und «Auch Werte ohne Daten».
  - Eigenes Diagramm, Vergleiche: keine Karte (sie haben eigene Zeiträume); eine graue Zeile sagt, wo man wählt.
- Am Handy (unter 720 px) ist die Karte eine Zeile, z. B. «30 Tage · 5 Quellen» mit Pfeil. Ein Tipp klappt Quellen und Zeitraum auf. Am Computer bleibt die Karte offen wie bisher.

## Was fällt weg oder rutscht tiefer
- Am Handy: Quellen, Zeitraum und «Auch Werte ohne Daten» sind nicht mehr ständig sichtbar, sondern einen Tipp tiefer (hinter der Zeile «30 Tage · 5 Quellen»).
- Auf «Eigenes Diagramm» und «Vergleiche» fehlt die Karte. Sie hat dort nichts verändert (Diagramm und Vergleiche rechnen mit ihren eigenen Zeiträumen); Werte und Zeitraum wählt man im Diagramm selbst.
- Gespeicherte Ansichten merken sich weiter Zeitraum, Quellen und «mit leeren Werten»; die Werte bleiben erhalten, auch wenn die Karte auf dem Reiter nicht zu sehen ist.

## Selbst entschieden
- Die Zeile klappt auf der Seite auf (kein eigenes Fenster wie im Entwurf A): weniger Code, man sieht die Wirkung gleich darunter.
- Der Zustand (offen/zu) wird nicht gespeichert; am Handy startet die Karte immer als Zeile.
- Die Karte bleibt über den Reitern (Noah 03.11.2026 «3a»); beim Wechsel auf Diagramm/Vergleiche rücken die Reiter dadurch etwas nach oben.
- Tests: neuer `analyse-filter.spec.js` (je Reiter, Handy-Zeile); drei bestehende Specs öffnen die Zeile am Handy, bevor sie Quellen/Zeitraum antippen; der Ansichten-Test ändert den Zeitraum im Diagramm statt auf der Karte.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Rekorde und Serien: nur «Zeitraum», keine Quellen.
2. Eigenes Diagramm: keine Karte, eine Zeile «Hier wählst du Werte und Zeitraum im Diagramm selbst.»
3. Am Handy: Überblick zeigt eine Zeile «30 Tage · 5 Quellen»; antippen öffnet die Auswahl.
