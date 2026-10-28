# Tests fragen nie mehr den echten Server

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «bitte prüfe auf github, ob alles in ordnung ist» und «mach einfach das beste» (Thread «Verbessern Weg von gebaut zu online»)

## Was ist neu
- Nichts in der App. Die Browsertests auf GitHub erreichen den echten Server «packgen» nicht mehr. Für sie gibt es ihn nicht («kein Netz»), ausser ein Test antwortet selbst an seiner Stelle.
- Grund: Jeder Test, der Heute öffnet, fragte den echten Server nach der Seetemperatur, also weit über 1000 Mal pro PR-Prüfung. Am 27.10.2026 war damit die Gratis-Tagesgrenze des Servers am Abend voll. Danach liefen für die echte App bis Mitternacht weder Abgleich noch Strava noch die Erinnerungen, und mehrere PRs waren rot.
- Neuer kleiner Test `tests/e2e/kein-echter-server.spec.js` prüft das: Eine Anfrage an den echten Server bekommt «kein Netz», eine Test-Antwort kommt weiter an.

## Was fällt weg oder rutscht tiefer
- nichts. Nur der Live-Check (LIVE=1) fragt weiter den echten Server, weil er die echte App prüft.

## Selbst entschieden
- Der Block steht einmal in `playwright.config.js` (Chromium-Einstellung `--host-resolver-rules`). So muss keiner der 364 Tests einzeln angepasst werden, und neue Tests sind automatisch dicht.
- Die Tagesgrenzen des Servers bleiben gleich. Ohne die Testaufrufe reichen sie für die echte App.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Verschlanken (Tests und Tempo): Die Tests verbrauchen keine Gratis-Aufrufe des Servers mehr.

## Prüfschritte (nach dem Merge)
1. Nichts in der App anzuschauen.
2. Morgen Abend steht unter packgen-three.vercel.app/api/health bei «tagesgrenze» weit unter 4000 Aufrufen.
3. Unter github.com/noahdolmetsch-af/packgenerator/actions ist der Test «kein-echter-server» grün.
