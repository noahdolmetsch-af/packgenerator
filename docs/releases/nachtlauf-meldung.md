# Nachtlauf meldet, wer verdächtig ist

PR (diese Änderung) · 04.11.2026 · Auftrag: Noah «Test-Plan 4 1 2», Punkt 4 (Thread «Prüfen: Warum die Tests langsam sind»)

## Was ist neu
- Wird die «Volle Prüfung» in der Nacht rot, steht oben in der Meldung (GitHub-Meldung «Volle Prüfung: ein Test ist rot», Mail an Noah) eine Zeile: **was rot ist** (zum Beispiel «e2e-part (phone, 3)») und **welche PRs seit dem letzten grünen Lauf gemerged wurden**. Das sind die Verdächtigen.
- Gibt es seit dem letzten grünen Lauf nichts Neues auf main, steht dort «vermutlich ein Wackler».
- In der App ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Zeile steht in der GitHub-Meldung, nicht direkt im Chat: GitHub Actions kann nicht in den Projekt-Chat schreiben. Der Chat-Hinweis am Morgen muss vom Koordinator oder vom Merge-Bündler kommen, der die Meldung liest; offen, wer das übernimmt.
- «Verdächtig» ist eine Liste aller Merges seit dem letzten grünen Lauf (höchstens 12, dann «und N weitere»), kein Beweis, welcher PR schuld ist.
- `docs/app-stand.md` bleibt unverändert: es ist keine App-Funktion.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan
- Verschlanken (Tests und Tempo): Test-Plan Punkt 4. Danach 1 (Start-Limit-Warnung bei 90 %) und 2 (Hinweis bei Rückstand zu main).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Unter Actions → «Volle Prüfung» → «Run workflow» von Hand starten. Ist alles grün, entsteht keine Meldung.
2. Wird ein Lauf rot, steht in der Meldung oben «Rot: …» und «Verdächtig, seit dem letzten grünen Lauf auf main gemerged: …».
