# Fragen-Bereich: kurzer Kopf, schmale Zeilen, Namen, «Stand»

PR #<Nummer> · 23.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Fragen-Bereich», Entscheide 1, 2, 3 und die kleine Zeile «Stand»); Bündler: gleiche Seite = ein PR

Ziele von Noah (23.11.2026 18:09): **Klarheit** (man sieht sofort die Antwort; pro Bildschirm eine Hauptsache) und **Auffindbarkeit** (Wichtiges oben, wenige Tipps; die Suche findet die Seite weiter mit «Fragen» und «Frag deine Daten»).

## Was ist neu
- **Kopf kürzer:** Titel «Frag deine Daten» (Du-Form) und eine Zeile. Die Karte zum Assistenten steht jetzt unter den Fragen und heisst «Eigene Frage stellen». Der Satz «sagt nie weil …» steht nicht mehr oben; die Grenze («Beobachtung, keine Ursache») steht unter jeder Antwort.
- **Zahlen beschriftet:** «16 Fahrtage mit Tempo in den letzten 90 Tagen, 0 in den 90 Tagen davor; auf jeder Seite braucht es 5» (Tempo) und «… dieses Jahr … im letzten Jahr bis zum selben Datum …» (Jahr).
- **Schmale Zeilen:** Antworten, die stehen, sind volle Karten und kommen zuerst. Fragen mit zu wenig Daten sind eine schmale Zeile mit «Braucht noch 5 Fahrtage». Ein Tipp klappt sie auf: Satz mit den Zahlen, Grenze, «Wie gerechnet», «Mehr dazu». Ohne Daten: eine Leer-Karte und sechs Zeilen statt sechs grossen Karten.
- **Stand:** unter jeder Antwort «Stand heute, Daten bis gestern» (oder bis zum Tag des letzten Werts).
- **Namen:** «Fragen an meine Daten» (Name in Listen und Suche), «Die App fragt dich» (das Kästchen mit den Fragen, die die App stellt, auf «Wi gaht's?»), «Eigene Frage stellen» (Assistent). `docs/namen.md` Zeile 44.

## Was fällt weg oder rutscht tiefer
- Der lange Einleitungssatz oben fällt weg (die Grenzen stehen unter jeder Antwort).
- Die gestrichelte Karte zum Assistenten rutscht von oben unter die Antworten.
- Bei zu wenig Daten rutschen Satz, Grenze, «Warum?» und «Mehr dazu» hinter einen Tipp auf die schmale Zeile.
- «Fragen aus deinen Daten» heisst im Deutschen nur noch «Die App fragt dich».

## Selbst entschieden
- Der Seitentitel spricht in der Du-Form («Frag deine Daten»); der Name in Seitenleiste, Suche und Handbuch bleibt «Fragen an meine Daten», wie im Entscheid 3.
- Der Name «Wi gaht's?» für die Seite bleibt (Noahs eigener Name, 14.10.2026). «Die App fragt dich» heisst nur das Kästchen mit den Regeln darin; der Kasten und die Funktion «Die App fragt dich» im Katalog tragen den neuen Namen, auch in den Schritten von Handbuch und Hilfe (alte «Was ist neu»-Texte bleiben, wie sie waren).
- «Fragen in eigenen Worten» bleibt als Name der Such-Hilfe (anderes Ding: die Suche, nicht der Assistent).
- «Stand»: kein fester Text «bis gestern», sondern der Tag des letzten Werts, damit es stimmt, wenn eine Uhr zwei Tage nicht synchronisiert hat.
- Der Pfad über der Seite gehört zu «Pfad-Zeile weg» (anderer Thread) und wird hier nicht gebaut.
- Die Rechnung in `src/lib/fragen/fragen.js` bleibt, wie sie ist.

## Entscheide
- Noah 23.11.2026 18:17 «1-5a» (Entscheide 1, 2, 3 der Prüfung). Datei: `docs/decisions/fragen-kopf-kurz.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Fragen-Bereich: Teil 1 (Kopf, schmale Zeilen, Namen, Stand). Folgt: Assistent (Cursor, Ort, Zurück, sechs Knöpfe), Idee auf Heute (nach «Heute entdecken»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Fragen am Handy: die erste Antwort steht ohne Scrollen im Bild.
2. Eine schmale Zeile antippen (falls vorhanden): Satz mit beschrifteten Zahlen, «Warum?» und «Mehr dazu».
3. Unter einer Antwort steht «Stand heute, Daten bis …».
4. Ganz unten (über «Was jetzt?») steht «Eigene Frage stellen».
