# Jede Fahrt ihre eigene GPX

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «a Ohne Route starten» (Thread «Live Navigation»)

## Was ist neu
- Eine GPX, die du auf der Live-Karte öffnest, gilt nur für die Fahrt, für die du sie geöffnet hast (eine Tour oder eine Fahrt ohne Tour).
- Eine Tour ohne Route startet ohne Route. Die letzte GPX steht als Angebot da: «Für diese Fahrt laden».

## Was fällt weg oder rutscht tiefer
- Die zuletzt geöffnete GPX kommt nicht mehr von selbst auf jede Tour ohne Route (alt: von selbst geladen → neu: ein Tipp auf «Für diese Fahrt laden»).

## Selbst entschieden
- Eine GPX von früher, die noch keine Fahrt kennt, gilt für Fahrten ohne Tour, wie bisher.
- Lädst du sie für eine andere Fahrt, wechselt sie dorthin (es gibt weiterhin nur eine gespeicherte Live-GPX), mit Rückgängig.

## Entscheide (für decisions.md)
- 28.10.2026: Eine Live-GPX gehört zu der Fahrt, für die sie geöffnet wurde (Noah «a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Live Navigation: Beobachtungen vom 28.10. – Teil 1 (alte GPX) erledigt; offen: zu kurze Aufnahme klar melden, Timer, Strecke in m / km mit 2 Stellen, grössere Speichermeldung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine neue Tour ohne GPX planen und ihre Live-Karte öffnen: keine Route, darunter «Für diese Fahrt laden» mit dem Namen deiner letzten GPX.
2. «Für diese Fahrt laden» antippen: die Route ist da.
3. Live-Karte ohne Tour öffnen: die GPX ist dort nur noch angeboten.
