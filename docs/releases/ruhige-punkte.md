# Ruhige Punkte im Menü

Auftrag: Noah «1a 2a 3a 4a 5a» vom 23.11.2026 (Thread «Papierkorb, Tab-Titel und Ziehen bauen»), Punkt 4 «Ruhige Punkte an allen Orten». Ziele: Klarheit und Auffindbarkeit.

## Was ist neu
- «Plan» (am Handy unten, am Computer in der Seitenleiste) zeigt eine kleine Zahl: so viele Haken sind heute noch offen. Quelle ist dieselbe wie in «Heute abhaken» (`flowStates`, `open`), damit die Zahl überall gleich ist (auch für den Haken-Block auf Heute).
- «Touren» zeigt einen kleinen Punkt, wenn eine Tour in den nächsten 3 Tagen (heute eingeschlossen) startet und ihre Packliste nicht voll ist. Eine leere Packliste, eine übersprungene oder schon laufende Tour zählt nicht.
- Am Computer sagt ein Tooltip, was der Punkt bedeutet («Plan: 3 Haken offen heute»); Bildschirmleser lesen denselben Satz.
- Ich › Darstellung › Bedienung: zwei Schalter, einer je Punkt (beide an; alles ist ein Vorschlag).
- Die Zahl bei Velos (Pflegepunkte) bleibt wie sie war.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Plan zeigt eine Zahl, Touren nur einen Punkt (wie im Auftrag): bei Touren ist «eine Tour» kaum eine Zahl wert.
- Die Wetter-Warnung aus dem Mockup ist nicht gebaut (Standard aus, hier nicht verlangt).
- Farbe wie die Zahl bei Velos (`--hi`, orange-braun, nie Rot).
- Die Zahl «Heute sind 8 Dinge dran» auf Heute zählt mehr (Pflege, Notizen, Touren) als die Haken; der Plan-Punkt zählt nur Haken. Die Erklärung der Zahlen («9 fällig») gehört zum Nutzersicht-Auftrag Punkt 5 und wird dort abgestimmt.
- Kein Eintrag in `features.js` (ein Baustein des Menüs); die Zeile steht in `docs/app-stand.md`.

## Entscheide (eigene Datei `docs/decisions/ruhige-punkte.md`)
- 23.11.2026: Punkte für Plan und Touren, einzeln ausschaltbar (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Ungenutzte Bedienmuster»: Punkt 4 von 4 (Reihenfolge 2 → 4 → 3 → 1).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Im Menü zeigt «Plan» eine Zahl, solange heute Haken offen sind; sie stimmt mit «Heute abhaken».
2. Eine Tour, die morgen startet, mit offener Packliste: «Touren» zeigt einen Punkt.
3. Ich › Darstellung › Bedienung: «Punkt bei Touren» ausschalten, der Punkt geht.
