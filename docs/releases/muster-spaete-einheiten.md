# Muster entdeckt: späte Einheiten

PR #<offen> · 03.11.2026 · Auftrag: Noah «Ich möchte alle 1-7 Ideen umsetzen» (Thread «Umsetzen: Sieben Cockpit-Ideen», Idee 5)

## Was ist neu
- Neuer Wert **«Späte Einheiten»** in Auswerten › Analyse › Alle Werte › Sport und Velo: wie viele Strava-Einheiten am Tag um 19:00 Uhr oder später enden (Startzeit plus Dauer).
- «Was hängt zusammen?» und die Liste «Stärkste Zusammenhänge» nehmen ihn automatisch mit: «Schlafe ich nach späten Einheiten kürzer?» (Tag danach / Nacht danach), ebenso Ruhepuls oder HRV. Ein Tipp auf eine Zeile zeigt das Paar mit den Punkten (= den Daten dahinter).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Idee 5 war schon zu grossen Teilen da (Erkenntnisse, «Was hängt zusammen?», «Was auffällt»). Es fehlte der Wert «späte Einheit», deshalb nur er; die Karte «Das fällt auf» baut der Aktiv/Auswerten-Thread (Plan 03.11.2026, Schritt 9) und nutzt diese Liste.
- «Spät» ist fest 19:00 Uhr (Annahme, kein einstellbarer Wert in diesem Schritt).
- Tage ohne Einheit zählen nicht als «nicht spät» (leer statt 0), sonst sähe jeder Ruhetag wie ein früher Tag aus. Tage mit Einheiten, die nicht spät sind, zählen 0.
- Es gilt Strava; Einheiten ohne Startzeit werden nicht gezählt. Kein Schema- oder Backup-Format geändert.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Cockpit-Ideen (Notiz `notes/ideen-cockpit-2026-11-03`): Idee 5 gebaut. Weiter: 7, 6, 4, 1, 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Analyse › Alle Werte › Sport und Velo › «Späte Einheiten».
2. «Was hängt zusammen?»: waagrecht «Späte Einheiten», senkrecht «Schlaf», «Tag danach (Nacht danach)».
3. Eine Zeile in «Stärkste Zusammenhänge» antippen, falls dort eine mit «Späte Einheiten» steht.
