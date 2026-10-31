# Nacht-Rundgang: Dienstnamen sind kein Englisch

PR #? · 28.10.2026 · Auftrag: Noah, Screenshot der offenen Issues (Thread «Offene GitHub-Issues prüfen»)

## Was ist neu
- Der Nacht-Rundgang meldet «Windy» unter Ich › Links nicht mehr als englisches Wort. «Windy» ist der Name
  des Wetterdienstes und bleibt in jeder Sprache gleich. Die Namen kommen aus der Link-Liste der App
  (`SUGGESTED` in `src/lib/tools/weblinks.js`), der Test führt keine eigene Liste.
- Issue #285 schliesst sich danach beim nächsten Nacht-Rundgang von selbst.

## Was fällt weg oder rutscht tiefer
- nichts (nur ein Test ändert sich, die App bleibt gleich)

## Selbst entschieden
- Gelöst im Test, nicht in der Übersetzung: «Windy» → «Windig» bleibt für die Pflanzen-Plätze richtig.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu sehen.
2. Am Morgen nach dem Merge: GitHub › Issues, «Nacht-Rundgang: etwas gefunden» ist geschlossen.
