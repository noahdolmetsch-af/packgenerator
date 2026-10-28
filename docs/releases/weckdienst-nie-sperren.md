# Weckdienst wird nie mehr gesperrt, Wächter alle 3 Stunden

PR (diese Änderung) · 28.10.2026 · Auftrag: Noah «bitte umsetzen» (Thread «Server-Klicks»), Anlass: Wächter-Meldung #289

## Was ist neu
- Nichts in der App. Am 27.10.2026 abends war die Tagesgrenze des Servers erreicht (Tests fragten den echten Server, Reparatur in #340). Danach bekam auch der Weckruf von cron-job.org «morgen wieder». Nach vielen solchen Antworten schaltete sich der Weckdienst selbst aus, und die Erinnerungen ans Handy blieben aus.
- Neu zählt der Weckruf (`api/push.js?a=tick`) unter eigenem Namen «tick» mit eigener Grenze 1600 pro Tag (1440 im Minutentakt, 1500 an einem 25-Stunden-Tag). Die Gesamtgrenze stoppt ihn nie mehr (`OWN_CAP_ONLY` in `api/_lib/daycap.js`).
- Der Wächter auf GitHub (`waechter.yml`) prüft alle 3 Stunden statt einmal am Morgen. Ein neues oder anderes Problem gibt sofort einen Kommentar (Mail an Noah); dasselbe Problem nochmals nur im Morgenlauf, damit keine Mail alle 3 Stunden kommt.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Weckruf zählt weiter in der Gesamtzahl mit (ehrliche Zahl im Wächter), wird aber nur von seiner eigenen Grenze gestoppt.
- Die anderen Tagesgrenzen bleiben gleich.

## Entscheide (für decisions.md)
- 28.10.2026: Weckruf nie durch die Gesamtgrenze sperren, Wächter alle 3 Stunden (Noah «bitte umsetzen»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Server selbst warten: Ausfall des Weckdienstes wird nach höchstens 3 Stunden gemeldet.
