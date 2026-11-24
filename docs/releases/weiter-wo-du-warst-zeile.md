# «Weiter, wo du warst»: eine Zeile auf Heute

Auftrag: Noah 23.11.2026 «1-5a» (Thread «Prototyp»); Ziele Klarheit und Auffindbarkeit (Noah 23.11.2026 18:09)

## Was ist neu
- Die Zeile unter «Heute entdecken» (`src/lib/home/Continue.svelte`, Regeln `src/lib/home/weiter.js`) führt jetzt auch zu dem, was du begonnen hast:
  - **Laufende Fahrt:** «Weiter, wo du warst · Fahrt läuft seit 14:05», ein Tipp öffnet die Live-Ansicht. Sie steht vor allem anderen.
  - **Tour ohne Datum** und **begonnener Rückblick**, wenn nichts anderes in der Zeile steht und die letzte Änderung höchstens drei Tage her ist: ein Tipp öffnet genau den Schritt.
  - Die nächste geplante Tour bleibt die Zeile «Weitermachen · Packen, Schritt 2 von 4» wie bisher.
- **«Heute nicht mehr»** unter der Zeile blendet sie für heute auf diesem Gerät aus. Sie kommt zurück, sobald die Zeile etwas anderes zeigt (du hast es wieder angefasst), und morgen.
- Auf Touren bleibt das Band «Weitermachen» unverändert.

## Was fällt weg oder rutscht tiefer
- Nichts. «Weitermachen» ist ein Fall der Zeile geblieben. Neu ist nur der Knopf «Heute nicht mehr» unter der Zeile.

## Selbst entschieden
- **Nächste geplante Tour bleibt vorn,** vor Tour-ohne-Datum und Rückblick-begonnen: sie war schon «Weitermachen», und ihr Schritt ist meist der dringendere. Eine Fahrt, die läuft, geht immer vor.
- **«Halb beantwortetes Wi gaht's»** fehlt noch: dafür braucht es die Quelle aus dem Thread «Wi gaht's»; kommt, wenn sie da ist.
- **«+n weitere» und die Liste «Angefangen»:** nächster PR (die Reihenfolge steht im Auftrag).
- **Fertig-Regel:** Seite/Absprung: die Zeile selbst; Leer-Zustand: ohne Angefangenes steht keine Zeile; nächster Schritt: der Tipp öffnet den Schritt; app-stand: Zeile Heute; `features.js` kommt mit der Liste «Angefangen» (eigene Seite).
- **Name:** «Weiter, wo du warst» und «Heute nicht mehr» stehen in `docs/namen.md` (Zeile 47).
- «Heute ausschaltbar in Heute anpassen»: kommt mit der Liste, zusammen mit «+n weitere» (beides sind Einstellungen der Zeile).

## Wie das zu Klarheit und Auffindbarkeit beiträgt
- Eine Zeile zeigt das Eine, womit du weitermachst, ohne zu suchen; die laufende Fahrt ist von Heute aus mit einem Tipp erreichbar.

## Entscheide (für decisions.md)
- `docs/decisions/weiter-wo-du-warst-zeile.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Fahrt aufzeichnen und Heute öffnen: oben steht «Weiter, wo du warst · Fahrt läuft seit …», ein Tipp öffnet die Live-Ansicht.
2. Eine Tour ohne Datum anlegen (zum Beispiel «Wochenende»), Heute öffnen: die Zeile nennt sie.
3. «Heute nicht mehr» tippen: die Zeile verschwindet; nach dem Neuladen bleibt sie weg; morgen ist sie wieder da.
