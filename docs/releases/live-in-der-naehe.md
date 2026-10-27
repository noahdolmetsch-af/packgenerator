# In der Nähe aufgeräumt

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a» (Thread «Live Navigation», Bilder der Live-Karte vom 27.10.)

## Was ist neu
- Das Fenster «In der Nähe» auf der Live-Karte hat nur noch eine Überschrift («Mehr Orte auf der Karte»); «Orte auf der Karte» darunter fällt weg.
- Neben der Strecke: ab 1 km zeigt die rote Zeile km (z. B. «27.4 km entfernt» statt «27400 m entfernt»).

## Was fällt weg oder rutscht tiefer
- Weg: die zweite Überschrift «Orte auf der Karte» im Fenster «In der Nähe» (die Überschrift des Fensters bleibt). Auf den anderen Seiten mit Orten bleibt sie.

## Selbst entschieden
- `PoiPanel` bekommt `title={false}`; ohne Überschrift trägt der Bereich den Namen als `aria-label`, damit Screenreader ihn weiter finden.
- Grenze 1 km für die Umstellung auf km.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Live Navigation: Korrektur nach Noahs Bildern erledigt; als Nächstes «Karte frei» und «Navigation zum Ziel» 1–5.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte öffnen, Fahrt starten, «In der Nähe» öffnen: oben steht nur eine Überschrift.
2. Weit neben der Strecke (mehr als 1 km): die rote Zeile nennt die Distanz in km.
