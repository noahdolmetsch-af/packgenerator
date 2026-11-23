# Dein Körper heute in einem Band (Schritt 3: eine leise Hinweiszeile)

Auftrag: Noah «1-4a» (23.11.2026, Thread «Körper-Banner auf Heute bauen»), Punkt 3a: die drei Zusatz-Hinweise als **eine** ruhige Zeile, nur wenn etwas auffällt.

## Was ist neu
- Unter den Werten des Bands steht höchstens eine Zeile. Die erste, die zutrifft, gewinnt:
  1. **Ruhepuls**: die letzten Tage liegen über deinem Üblichen (dieselbe Regel und dieselbe einstellbare Grenze wie «Was auffällt» auf Form und Erholung; Markertage zählen nicht). «Ansehen» öffnet Form und Erholung.
  2. **Wochenlast**: die Aktivzonenminuten der letzten 7 Tage liegen ab 30 % mehr oder weniger als in deiner üblichen Woche (Schnitt der 4 Wochen davor, nur mit genug Werten, Tage ohne Wert zählen nicht als null). «Ansehen» öffnet den Verlauf der Zonenminuten.
  3. **Tageslicht**: solange die Challenge «Draussen» läuft und heute noch Minuten fehlen, sagt die Zeile ab einer Stunde vor dem spätesten Start, bis wann es hell ist und wann du anfangen müsstest (Sonnenzeiten am Heimort, `lightLine`). Nach Sonnenuntergang schweigt sie.
- Jede Zeile hat «Heute nicht» (bis morgen, Einstellung `body.hint.no`, eine Art nach der anderen).
- Der Wortlaut beobachtet nur («über deinem Üblichen», «mehr als in deiner üblichen Woche»), nie Ursache, Rat, gut oder schlecht.
- Rechnung in `src/lib/home/bodyhints.js`, Zeile in `BodyTile.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Wochenlast meldet auch eine ruhigere Woche (30 % weniger), mit demselben neutralen Wortlaut; ein Ausschlag nach unten kann genauso auffallen.
- Eine Zeile zur Zeit, nach der Reihenfolge Ruhepuls, Wochenlast, Tageslicht, damit das Band nie lang wird.
- Keine eigene Frage «leiser?» nach drei Mal «Heute nicht» (die gibt es bei den Hinweisen auf Aktiv): das Band hat nur diese eine Zeile, und sie erscheint nur bei Auffälligem.
- Ohne Heimort (Ich › Heimort) gibt es keinen Tageslicht-Hinweis.
- Die Abfrage der Fitbit-Tage reicht jetzt 35 statt 30 Tage zurück (für die 4 Wochen der Wochenlast); das «üblich» von Schlaf und HRV rechnet weiter mit 30 Tagen.

## Entscheide (eigene Datei `docs/decisions/koerper-banner.md`)
- keine neuen (gilt: 23.11.2026, 1–4 a, Punkt 3a)

## Stand im Plan (roadmap.md / vorhaben.md)
- Körper-Banner: Schritt 3 von 4 gebaut; Schritt 4 (Platz unter dem Gruss) folgt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Dein Körper heute»: steht eine Zeile unter den Werten, nennt sie nur, was auffällt, ohne Wertung.
2. «Heute nicht» tippen: die Zeile ist für heute weg (ein anderer Hinweis kann nachrücken).
3. «Ansehen» tippen: die passende Seite mit dem Verlauf öffnet sich.
