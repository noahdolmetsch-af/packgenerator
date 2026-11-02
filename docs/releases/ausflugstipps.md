# Heute passt: Ausflugstipps

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N3

## Was ist neu
- Touren › Träume, ganz oben: «Heute passt: Ausflugstipps» mit drei Orten, an denen du nie warst (Pässe, Seen, Gemeinden aus Neuland), in verschiedenen Richtungen (`src/lib/neuland/TripTips.svelte`).
- Die Reichweite kommt aus der Zeit: Stunden × 19 km/h ist die Runde, der Ort liegt höchstens halb so weit (Strassen 1,3× länger als Luftlinie). Ein Tipp zielt auf etwa zwei Drittel davon (`src/lib/neuland/tipps.js`).
- Die Zeit: die längste freie Lücke zwischen 08:00 und 20:00 im Google Kalender, wenn er verbunden ist; sonst 3 h. Wählbar 2, 3, 4 oder 6 h.
- Das Wetter am Wohnort für den Tag (Höchstwert, trocken/Schauer/Regen). Nach 17:00 gelten die Tipps für morgen.
- «Runde hindurch» plant die Neuland-Runde durch den Ort (wie bei «Weisse Flecken»).
- Neue Funktion im Katalog: `f.triptips`.

## Was fällt weg oder rutscht tiefer
- Träume: «Anmeldefristen», «Dein Jahr» und die Liste rücken um den neuen Teil nach unten.

## Selbst entschieden
- Hütten und Gipfel zählen nicht: meist nicht mit dem Velo erreichbar.
- Die Idee «App denkt mit» (A3) soll später `tripTips()` aufrufen statt eigener Regeln; dieser PR ändert A3 nicht.
- Nichts wird gespeichert; die gewählten Stunden gelten nur für den Moment.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 9 von 20 (N3). Als Nächstes N16 «Bereit für den Traum?».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen: «Heute passt: Ausflugstipps» steht oben, mit Wetter.
2. 2 h und dann 6 h wählen: die Orte wechseln.
3. Bei einem Ort «Runde hindurch» tippen: die Runde mit km und Höhenmetern erscheint.
