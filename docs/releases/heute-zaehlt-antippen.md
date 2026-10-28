# Was heute zählt, Tag für Tag

PR #370 · 28.10.2026 · Auftrag: Noah «1-5 a» (Thread «Diagramme klickbar machen»), PR 3 von 8 (K3)

## Was ist neu
- «Form und Erholung» › Was heute zählt (`src/lib/flow/form/FormTeile.svelte`, `teile.js`): jede Zeile (Ruhepuls, HRV, Schlaf, Schlaf gefühlt, Energie gefühlt, Form) behält Satz und Punkte und bekommt eine kleine Linie der letzten 7 Tage.
- Antippen öffnet die Tage dieses Teils: heute, Normal und Punkte oben; warum es Punkte gibt in einem Satz; 7 oder 30 Tage mit Achse (runde Stufen), Normal als gestrichelte Linie, bei 7 Tagen die Zahl an jedem Punkt.
- Zeigen oder Pfeiltasten: der Tag mit Wert, Normal und Punkten in der Zeile darüber. «Vergleichen mit»: ein zweiter Teil mit eigener Achse rechts. «Als Tabelle»: Wert, Normal, Punkte pro Tag. Unten blättert man zum Teil davor oder danach.
- Die Punkte pro Tag sind dieselben, die die Bereitschaft zählt (`form.js`); Tage ohne Wert bleiben Lücken.

## Was fällt weg oder rutscht tiefer
- nichts. Satz und Punkte jeder Zeile bleiben, die Linie kommt dazu.

## Selbst entschieden
- Das Fenster startet mit 7 Tagen, damit an jedem Punkt die genaue Zahl steht; 30 Tage ist ein Tipp weiter.
- Für die gefühlten Werte lädt die Seite jetzt die Morgen-Checks der letzten 31 Tage statt nur von gestern und heute.
- Die Seite «Form» bleibt in der Liste der offenen Diagramme, bis die Tour-Bereitschaft (K4) umgebaut ist.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Diagramme klickbar: PR 3 von 8. Danach Tour-Bereitschaft (K4), Training, Körperwerte, Aktiv, Heute-Kacheln, Rückblick/Unterwegs/Rennen/Ski.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Form und Erholung: jede Zeile von «Was heute zählt» hat eine kleine Linie.
2. «Ruhepuls» antippen: 7 Tage mit Zahlen, Normal gestrichelt, der Satz warum.
3. Unter «Vergleichen mit» «Schlaf» und dann «30 Tage» tippen: zweite Linie mit Achse rechts, ein Monat.
