# Dein Vorschlag und «Vorschlag in einer Minute»

PR #1783 · 23.11.2026 · Auftrag: Noah «1b», «5a» (Warteliste 4, Baustein 1; baut auf «Packen in Schritten» und «Pack-Karten» auf)

## Was ist neu
- Die Seite **Dein Vorschlag** (`#/pack/vorschlag`, `src/pages/PackVorschlag.svelte`, Regeln `src/lib/pack/vorschlag.js`): die Liste der offenen (sonst der nächsten) Tour als Angebot. Oben «n Teile · x kg» und «Liste übernehmen» (öffnet die Packliste in Schritten); darunter die Schritte mit Teilen, Gewicht und «Ändern» (öffnet die Packliste beim Schritt).
- **Weggelassen**: was du von der Liste genommen hast und noch besitzt, mit «+ trotzdem mitnehmen» (ein Rückgängig).
- **Das fehlt dir**: die Lücken der Zwiebel (derselbe Check wie auf der Packliste); mit einem passenden eigenen Teil «… hinzufügen», sonst ein Weg zum Kleiderschrank.
- **Wie letztes Mal?**: die früheren Touren des gleichen Bereichs, deren Liste mindestens zu 30 % gleich ist, die ähnlichste mit «Vergleichen»: nur jetzt, nur letztes Mal, auf beiden.
- In **Neue Tour** steht oben der Knopf «Vorschlag in einer Minute»: er macht die Tour wie «Tour erstellen» und öffnet dann «Dein Vorschlag».

## Was fällt weg oder rutscht tiefer
- nichts. «Neue Tour», die Packliste und «Wie letztes Mal: …» im Fenster bleiben wie sie sind; der Knopf ist dazugekommen.

## Selbst entschieden
- «Weggelassen, weil …» nennt keinen Grund: die App speichert beim Wegnehmen nur das Teil und die Zeit (`trip.leftOut`), keinen Grund. Die Zeile sagt «Du hast diese von der Liste genommen.»
- «Das fehlt dir» kommt aus dem Zwiebel-Check; eine Wunschliste-Zeile fehlt (ein Teil ohne Gegenstück im Material gibt es dort nicht). Statt dessen führt «Zum Kleiderschrank» weiter.
- Gewicht = Summe der Teile (ohne Taschen und Velo); nicht Gewogenes steht als «n Teile noch nicht gewogen».
- Die Vorschlagsseite braucht eine Tour mit Liste; ohne sagt sie das und führt zu Touren.
- Keine neue Datenspeicherung: keine Änderung am Backup (nur bestehende Tour-Felder).

## Entscheide (eigene Datei `docs/decisions/pack-vorschlag.md`)
- 22.11.2026: Noah «1b», «5a».

## Stand im Plan
- Warteliste 4: Schritte, Pack-Karten und Vorschlag gebaut; «Kleider-Zwiebel füllt den Schritt Kleider» folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Neue Tour › «Vorschlag in einer Minute»: die Tour entsteht, «Dein Vorschlag» öffnet.
2. «Ändern» bei einem Schritt: die Packliste öffnet in Schritten bei diesem Schritt.
3. «Wie letztes Mal?» › «Vergleichen»: nur jetzt, nur letztes Mal.
