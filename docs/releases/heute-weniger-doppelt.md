# Heute öffnet etwas schneller (Heute liest weniger doppelt)

PR #1790 · 25.11.2026 · Auftrag: Noah (Thread «App doppelt so schnell machen»; Koordinator 25.11.2026 22:37 «Handy noch schneller machen»)

## Was ist neu
- **Nichts Sichtbares geändert, nur das Lesen beim Start von Heute.** Sechs bis sieben Orte lasen die ganze kleine Aktivitäten-Tabelle (`liteAll` liest sie jetzt einmal und gibt jedem Ort eine eigene Kopie). «Neu heute» las und rechnete bei jedem Start die ganze Geschichte; jetzt fragt es zuerst nur nach den Zeilen ab gestern (`readSince`).
- **Gemessen** (Noahs Backup, privat; Handy 390 × 4; Referenz-Bau von main im selben Lauf, 2 × 3 Starts): Blockierzeit beim Start 3.1–3.7 s → 2.5–2.9 s (−15 bis −20 %), Aufbau von Heute 4.7–5.5 s → 4.4–4.7 s (−8 bis −12 %), lange Aufgaben 32–34 → 24–28.
- **Diagnose zum Handy-Tempo:** der «5½-s»-Wert (grösster Inhalt) ist die späteste Textzeile unten (Fitbit-Hinweis); die Begrüssung steht nach etwa 2 s, alle Arbeit nach etwa 13 s (4× gebremst). Das Lesen der Datenbank ist mit rund 2.3 s der grösste Einzelposten von etwa 9 s Arbeit; der Rest verteilt sich auf viele Berechnungen und den Aufbau der Kacheln.
- Verworfen nach Messung (kein Unterschied): das Kilometerbuch gemeinsam lesen, die Kacheln unter dem ersten Bildschirm nach und nach bauen.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Teilen endet nach 1.5 s oder bei jedem Speichern in `activities`; jeder Ort bekommt eine eigene Array-Kopie.
- Keine neue Funktion, daher keine Fertig-Regel-Teile; keine Bilder (nichts Sichtbares).

## Entscheide (eigene Datei `docs/decisions/heute-weniger-doppelt.md`)
- 25.11.2026: `liteAll` statt `readLite(… toArray())` beim Start von Heute; «Neu heute» erst nach der billigen Frage ab gestern.

## Stand im Plan (roadmap.md / vorhaben.md)
- Tempo «Handy noch schneller»: dieses Paket −15 bis −20 % Blockierzeit; weitere Pakete nur mit Messung gegen Referenz-Bau (Reihe: Velo-Fahrten-Lesung, Berechnungen der Meilensteine, `#/features`).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. App ganz schliessen und neu öffnen: Heute zeigt seine Karten.
2. Eine Fahrt in «Training» speichern: Heute und die Woche zeigen sie sofort.
3. Nach einer Fahrt von gestern oder heute: die Zeile «Neu seit gestern …» erscheint weiterhin, wenn etwas Neues erreicht wurde.
