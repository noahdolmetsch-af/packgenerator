# Velopflege umgebaut

PR folgt · 21.11.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (Thread «Velopflege zum Inspektions-Begleiter machen»), Schritt B von A–E

## Was ist neu
- Die Pflege-Seite eines Velos hat eine neue Reihenfolge (`src/lib/care/BikeCare.svelte`): «Auf einen Blick», «Jetzt fällig», die Inspektion, «Verschleiss», die Teile-Tabelle, dann «Mehr» und die bisherigen zugeklappten Zeilen (1'000-km-Check, Logbuch, Werkstatt und Jahr).
- Die Inspektion (`src/lib/inspect/InspectCard.svelte`) sind drei Karten: Kurzcheck, Monatlicher Check, Grosse Inspektion. Jede zeigt Minuten und Punkte, wann der nächste fällig ist, warum früher, das Werkzeug («Du brauchst: …») und «Start» oder «Weiter». Die Punkte und das Werkzeug rechnet `src/lib/inspect/levelinfo.js` aus derselben Liste wie der Check selbst.
- «Mehr» (zugeklappt) enthält Fahrtenbuch mit «Jeder km zählt», Velo-Blätter, Velo-Karte (Art, Fahrstunden, Service) und die Pflege-Regeln. Es öffnet sich von selbst, solange eine Fahrt des Velos unklar ist, und zeigt dann «N Fahrten unklar».

## Was fällt weg oder rutscht tiefer
- Das Fahrtenbuch («Fahrtenbuch · km-Verlauf») und «Jeder km zählt» standen weit oben; sie liegen jetzt unter «Mehr». Alt: oben im Velo. Neu: «Mehr» antippen.
- Velo-Blätter, Velo-Karte und Pflege-Regeln standen unter der Inspektion; sie liegen jetzt auch unter «Mehr».
- «Jetzt fällig» steht vor «Verschleiss» (vorher dahinter).
- Die Inspektion ist drei Karten statt einer Liste mit Zeilen; «Inspektionen» (Verlauf, Checkliste, Abstände) bleibt als Zeile darunter.
- Sonst nichts. Bei einem Filter (Fällig, von mir, Velomech) bleibt die Verschleiss-Liste wie bisher.

## Selbst entschieden
- Der Titel heisst weiter «Jetzt fällig» (so heisst er in der App schon), nicht «Jetzt dran».
- Die Teile-Tabelle bleibt sichtbar (unter «Verschleiss») und kommt nicht unter «Mehr», anders als im Entwurf: Über sie tippst du jedes Teil an und trägst Arbeiten ein, das ist die wichtigste Handlung der Seite. Die Fahrten-Hinweise («unklar») bleiben nicht versteckt: «Mehr» öffnet sich dann von selbst.
- Keine neue Funktion in `features.js`: es ist die Ordnung der bestehenden Seite. Fertig-Regel Teil 1, 3 und 6 bestehen, Teil 2 (Absprung) auch (die Karten verlinken auf den Check).
- Keine neue Datenhaltung, kein Backup-Format, kein `api/`.

## Entscheide (für decisions.md)
- 21.11.2026: Die Pflege-Seite eines Velos ordnet sich nach «Was ist jetzt wichtig»: Blick, fällig, Check, Verschleiss, dann der Rest unter «Mehr» (Noah «1a 2a 3a 4a 5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Velopflege-Begleiter: Schritte A, B und C gebaut, D und E offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege: unter «Auf einen Blick» und «Jetzt fällig» stehen drei Check-Karten mit Werkzeug.
2. Auf «Start» bei «Monatlicher Check» tippen: der Begleiter beginnt mit «Das brauchst du».
3. «Mehr» antippen: Fahrtenbuch, Velo-Blätter und Pflege-Regeln sind da. Die Teile-Tabelle steht unter «Verschleiss».
