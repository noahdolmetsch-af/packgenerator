# Velo-Zahlen als Wege (Teil 2)

PR #… · 07.11.2026 · Auftrag: Noah «alle Vorschläge» der UI-Prüfung (V1) und «alles in einem PR» für den Rest (Thread «Absprünge: Velo-Zahlen als Wege»)

Ergänzt `velo-zahlen-wege.md` (PR #1118) um die offenen Punkte von V1.

## Was ist neu
- **Ein Velo in der Analyse:** die Kilometer führen zu `Analyse › Velos` nur mit dem angetippten Velo («Nur {Velo} · Alle Velos»). Im Link: `?tab=velos&bike=<id>` (`velosHref(bikeId)`, `bikeOfHash` in `src/lib/analyse/jump.js`); ein unbekanntes oder archiviertes Velo zeigt alle.
- **«Passt» bei der nächsten Tour:** hinter «nächste Tour: …» steht eine Marke: «✓ passt» (nichts fällig), «n fällig» oder «n bis dahin fällig» (vor der Tour). Gleiche Zählung wie Pflege, Heute und Pack (`bikeCare` mit der Tour). Ohne Daten (`nodata`) keine Marke. Ein Tipp öffnet die Pflege dieses Velos.
- **Gewicht und Taschen** im Kopf des Velos führen zu `Teile` (Ausstattung) und zum Taschenplan (`tab=rig&view=bags`).
- **«7 Punkte ohne Daten»** (und der Satz zur Pflege) auf der Velo-Karte öffnen die Pflege des Velos.
- **Verschleiss → Einkaufsliste:** auf der Seite «Verschleiss» hat ein Teil, das fällig oder bald dran ist, den Knopf «Auf die Einkaufsliste» (mit Rückgängig, wie im Ersatzteilvorrat) und den Link «Einkaufsliste öffnen».
- Test `tests/velo-zahlen.test.js` (Links), `tests/e2e/velo-zahlen.spec.js` (Seiten), Deutsch in `src/lib/i18n/de/velo-zahlen.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Texte und Reihenfolge bleiben; es kommen nur Wege und eine Marke dazu.

## Selbst entschieden
- Die Marke «passt» heisst nur: für dieses Velo ist vor der Tour nichts fällig (was die App weiss, wie «nichts fällig» sonst). Sie ist nie Pflicht und sperrt nichts.
- Eine Zahl ohne Analyse-Wert führt zur Seite, die sie erklärt (Gewicht zu Teile, Taschen zum Taschenplan); keine neue Seite.
- Der Knopf «Auf die Einkaufsliste» schreibt wie im Ersatzteilvorrat auf die Liste «Einkaufsliste» (`changeList`) und bietet Rückgängig an. Er steht nur bei Teilen, die fällig oder bald dran sind.
- Keine neue Funktion in `features.js` (Wege auf bestehenden Seiten), `docs/app-stand.md` unverändert.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- UI-Prüfung «Absprünge»: V1 (Velo-Zahlen) vollständig; Pflege in Gruppen und Ort-Vorlage bleiben bei den anderen Threads.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos öffnen, auf die Kilometer eines Velos tippen: die Analyse öffnet bei «Velos» nur mit diesem Velo; «Alle Velos» zeigt alle.
2. Unter dem Titel die Marke nach «nächste Tour: …» antippen: die Pflege dieses Velos öffnet sich.
3. Im Kopf des Velos Gewicht und Taschen antippen: Teile und Taschenplan öffnen sich.
4. Velos › Pflege › Verschleiss: bei einem fälligen Teil «Auf die Einkaufsliste» tippen: es steht auf der Liste, Rückgängig nimmt es weg.
