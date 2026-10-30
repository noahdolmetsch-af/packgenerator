# Werkstatt zu Hause

PR #275 · 27.10.2026 · Auftrag: Noah «1a 2a 3a 4a 5a» (26.10.), «71-76 freigabe» (26.10.), «1a» online bringen (27.10.) (Thread «Bauen Velo-Ideen 71 bis 76»)

## Was ist neu
- 71 Werkstattbesuch › «Quittung aufteilen»: eigenes Fenster, jede Zeile bekommt Teil, Arbeit (ersetzt / Service / geprüft) und Auftrag; «Zeile teilen»; Vorschlag fürs Teil aus dem Text; Undo. (`src/lib/werkstatt/split.js`, `ReceiptSplit.svelte`)
- 72 Ein neuer km-Stand mit Sprung ≥ 30 km fragt zuerst: Fahrten ausserhalb der App (an einem Tag), nur neuer Stand oder Tippfehler. (`kmgap.js`, `care/KmGapSheet.svelte`)
- 73 Setup-Logbuch sichert die Masse und bis 3 Fotos; «Zurück zu diesen Massen» mit Undo. (`bikes/rueckbau.js`)
- 74 Nach Sturz oder Geräusch: Teil auf «prüfen» (Seite Verschleiss), «Geprüft, alles gut». (`wear.js` FLAG_KINDS)
- 75 Verschleiss-Fotos › «Foto mit Vorlage»: Kamera in der App, altes Foto halb durchsichtig darüber. (`care/GhostCamera.svelte`)
- 76 Eigene Seite Velos › Pflege › Werkstatt-Runden: Arbeiten, Werkzeug, Material, Vorschläge; abhaken schreibt «gewartet» ins Teil. (`werkstatt/rounds.js`, `RoundsPage.svelte`, Einstellung `werkstatt.rounds`)
- Kein Schema-Wechsel, kein `api/`.

## Was fällt weg oder rutscht tiefer
- nichts. Beim Speichern eines km-Stands kommt bei einem Sprung ab 30 km zuerst eine Frage.

## Selbst entschieden
- Die km-Frage kommt ab 30 km Sprung; höchstens 3 Fotos pro gesichertem Setup; eine Arbeit ohne Teil schreibt nichts ins Teil.
- `pf.spec.js` S4 und `bikecare.spec.js` D1 beantworten die neue km-Frage («nur neuer Stand», gewollt geändert).

## Entscheide (für decisions.md)
- 26.10.2026: Velos 71–76 «1a 2a 3a 4a 5a»: 71 eigenes Fenster mit Teil, Arbeit und Auftrag pro Zeile, «Zeile teilen» ja; 75 Kamera in der App mit altem Foto darüber; 76 eigene Seite unter Velos › Pflege; abgehakte Arbeit schreibt «gewartet» ins Teil.

## Stand im Plan (roadmap.md / vorhaben.md)
- 996 Einzelideen: Paket Velos (71–76) online, damit sind alle 63 gewählten Einzelideen gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Velos › Pflege › ein Velo › Werkstatt-Runden: «Herbst-Service» antippen, «Runde starten», zwei Arbeiten abhaken, «Fertig».
2. Werkstatt › ein Besuch mit Quittungsfoto › «Quittung aufteilen»: Zeilen bekommen ein Teil.
3. Pflege › km ändern: eine Zahl 100 km höher eintippen → die App fragt zuerst.
