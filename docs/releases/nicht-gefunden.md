# Seite nicht gefunden

PR #1783 · 21.11.2026 · Auftrag: Noah «a» auf die Frage im Gesamttest (Thread «Ganze Website testen und Fehler beheben»)

## Was ist neu
- Eine Adresse, die keine Seite kennt (zum Beispiel `#/does-not-exist`), zeigt die Karte «Seite nicht gefunden» mit dem Knopf «Zu Heute». Vorher zeigte die App ohne ein Wort Heute.
- Die Karte sieht aus wie die Fehlerseite (`src/lib/ui/NotFound.svelte`, `ErrorPage.svelte`) und sagt, dass die Daten sicher sind.
- `isUnknown()` in `src/lib/nav.js` entscheidet: Heute (`''`, `#`, `#/`, auch mit `?…`), jede Seite aus `pageOf` und jede alte Adresse mit Weiterleitung (`redirectOf`) bleiben wie sie sind.
- Zwei alte Links, die bisher still auf Heute führten, zeigen jetzt auf die richtige Seite: «Agenda» in einer alten News-Zeile (`#/agenda` → `#/me/agenda`) und der Velo-Check im Erholungsschritt (`#/velos` → `#/bikes`).

## Was fällt weg oder rutscht tiefer
- nichts. Falsche Adressen zeigen nicht mehr Heute, sondern die Karte; ein Tipp auf «Zu Heute» führt dorthin.

## Selbst entschieden
- Kein Eintrag in `features.js` und keine Zeile in `docs/app-stand.md`: es ist keine neue Funktion, sondern der Zustand «Adresse unbekannt» (wie die Fehlerseite, die dort auch keine Zeile hat).
- Kein Absprung und kein «Gut zu wissen»: die Karte ist selbst der Absprung (der Knopf).
- Ein Suchlauf über alle Adressen im Code, in den Docs und in den Tests fand nur die zwei oben genannten echten Links, die ins Leere führten; sie sind korrigiert (der Test `weg-erholung` erwartet jetzt `#/bikes`).

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (Fund aus dem Gesamttest, Ziel: eine App, die im Alltag nicht verwirrt)

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ändere die Adresse zu `…/#/does-not-exist` und drücke Enter: Die Karte «Seite nicht gefunden» erscheint.
2. Tippe «Zu Heute»: Heute öffnet sich.
3. Öffne `…/#/` und eine Seite wie `…/#/timer`: keine Karte.
