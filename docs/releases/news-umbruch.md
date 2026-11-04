# Was ist neu: lange Überschrift bricht um

PR (offen) · 04.11.2026 · Auftrag: Koordinator (Layout-Wächter auf main rot) · Thread «Umsetzen: Sieben Cockpit-Ideen»

## Was ist neu
- Nichts Neues in der App. Der «Was ist neu»-Eintrag der Belastungslandschaft heisst im Deutschen jetzt «Belastungs-Landschaft», damit das lange Wort auf einem schmalen Handy (320 px) an einem Bindestrich umbricht statt mitten im Wort. Die Karte auf Aktiv › Form heisst weiter «Belastungslandschaft».
- Grund: Der Layout-Wächter (`guard.spec.js`, «layout group 1») meldete «Was ist neu #/me/news@320: 1 wordbreak» und machte jeden PR mit Handy-Tests rot.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Nur die Überschrift im «Was ist neu»-Eintrag bekommt einen eigenen Schlüssel (`Load landscape|news`), die Karte behält ihren Namen. Eine unsichtbare Trennstelle (weicher Bindestrich) reichte dem Wächter nicht, ein sichtbarer Bindestrich schon.
- Keine eigene «Was ist neu»-Datei, weil nichts Neues zu sehen ist.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu auf dem Handy öffnen: die Überschrift «Belastungs-Landschaft» steht ganz in der Zeile, nichts bricht mitten im Wort.
2. Aktiv › Form: die Karte heisst weiterhin «Belastungslandschaft».
