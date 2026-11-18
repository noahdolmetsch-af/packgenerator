# Seitenleiste: sieben Orte und «Ich»

PR folgt · 18.11.2026 · Auftrag: Noah «1a 2a» (Thread «Ganze App neu denken: klickbarer Prototyp»), Schritt 10 des Plans `docs/plan-ganze-app.md`

## Was ist neu
- Die Seitenleiste am Computer hat sieben Orte (Heute, Planen, Touren, Aktiv, Auswerten, Velos, Material) und «Ich» als Karte unten, vorher elf Zeilen.
- Ausrüstung ist kein eigener Ort mehr: die Seite (`#/equipment`) ist der Reiter «Sets» in Material (Streichliste Z2).
- Inspiration ist kein eigener Ort mehr: die Seite (`#/inspiration`) ist ein Reiter in Touren, neben «Träume» (Z3). Sie war vorher auch ein Reiter in Planen; dort ist sie weg.
- Quick Links ist keine eigene Zeile mehr: unter «Heute» steht eine Zeile «Quick Links», solange du auf Heute oder in Quick Links bist (Z1). Heute bleibt dabei markiert.
- Keine Adresse ändert sich.

## Was fällt weg oder rutscht tiefer
- Seitenleiste: die Zeilen «Quick Links», «Ausrüstung» und «Inspiration» (mit «neu»-Marke) gibt es nicht mehr. Quick Links: Heute › Zeile «Quick Links» (auch Suche, Taste `g` `q`). Ausrüstung: Material › Sets. Inspiration: Touren › Inspiration.
- Die «neu»-Marke an Inspiration fällt weg (sie ging ohnehin nach 14 Tagen).
- Handy: nichts ändert sich (die untere Leiste folgt in Schritt 15). Auf dem Handy erscheint «Sets» zusätzlich als Reiter in Material, «Inspiration» in «Alle n» von Touren; der Schalter Velos · Ausrüstung · Material bleibt.

## Selbst entschieden
- Quick Links bekommt auf dem Computer eine Zeile unter Heute statt gar keinem Weg, weil die Kachel auf Heute standardmässig nicht zu sehen ist; in Heute selbst (Schritt 2b) wird daraus «Abkürzungen».
- Die Reiter-Grenzen in `tests/fuenforte.test.js` steigen vorübergehend (Touren 8, Material 7); die Schritte 4b, 11 und 13 senken sie auf die Zielzahlen des Wegweisers.
- «Adress-Tabelle» (Schritt 9) entfällt: dieser PR ändert keine Adresse, und jeder spätere Schritt bringt seine Weiterleitung selbst mit (kein Hinweis «Verschoben», Durchklick DK6). Plan und Wegweiser sind angepasst.
- Hat jemand in «Anpassen» für Planen den Reiter «Inspiration» ausgeblendet oder umsortiert, gilt das in Touren nicht; dort steht der Reiter in der Standardreihenfolge.
- Seiten-Kopf von Inspiration zeigt jetzt «Touren ›» statt «Planen ›».
- Neuer Name: «Sets» (`docs/namen.md` Zeile 23).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 10 gebaut; Schritt 9 gestrichen (siehe oben); nächster: Schritt 2b (nach «Startseite ruhiger»), sonst 4b.

## Prüfschritte (nach dem Merge)
1. Am Computer: die Seitenleiste zeigt sieben Orte und unten «Ich».
2. Tippe «Material»: Reiter «Sets» öffnet die Seite «Ausrüstung».
3. Tippe «Touren»: neben «Träume» steht «Inspiration».
4. Tippe «Heute»: darunter steht «Quick Links»; ein Tipp öffnet die Seite, Heute bleibt markiert.
