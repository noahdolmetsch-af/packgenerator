# Ein sanfter Hinweis nach drei harten Tagen

PR folgt · 05.11.2026 · Auftrag: Noah «4a und b» (Thread «Ideen für alle Bereiche der App», Idee Aktiv 4a «Ruhetag-Hinweis»)

## Was ist neu
- Auf Aktiv steht über «Heute abhaken» eine ruhige Zeile, wenn du drei harte Tage in Folge hattest: «3 harte Tage in Folge. Heute locker?». Hattest du heute schon den dritten harten Tag, steht dort «Morgen locker?».
- «Hart» heisst: für dich selbst im oberen Viertel der letzten sechs Wochen (Belastung wie auf «Form und Erholung», aus Strava: Leistung, sonst Anstrengung, sonst Puls und Zeit), nie unter einer Mindestbelastung. Hast du noch zu wenig Tage, gilt eine feste, hohe Grenze.
- Zwei Knöpfe: «Erholung ansehen» (führt zu `#/flow/rest`) und «Heute nicht» (blendet die Zeile für den Tag aus).
- Reine Beobachtung, keine Pflicht und keine Diagnose. Ausschalten: Ich › Aussehen › Vorschläge › Leistungstipps (dieselbe Wahl wie bei den anderen Leistungs-Hinweisen).
- Code: `src/lib/ruhetag.js` (Regel, rein), `src/lib/ruhetag-data.js` (liest die Aktivitäten), `src/lib/flow/RuhetagHint.svelte`.

## Was fällt weg oder rutscht tiefer
- nichts. Der Hinweis auf «Erholung» («3 aktive Tage in Folge») bleibt wie er ist; er zählt aktive Tage, der neue harte Tage.

## Selbst entschieden
- Ort: Aktiv (nicht Heute), dort fällt man die Entscheidung «Was mache ich heute?». Eine ruhige Zeile in «Jetzt dran» auf Heute wäre ein kleiner Folge-Schritt, falls du sie willst.
- Kein neuer Eintrag im Funktionskatalog (`features.js`): es ist ein Hinweis auf einer bestehenden Seite, wie «Heute sagt, wenn etwas nicht stimmt». Die Zeile steht deshalb in der Zeile «Aktiv» in `docs/app-stand.md`.
- Ohne Strava-Aktivitäten (oder unter acht Tagen) erscheint nichts, was nicht eindeutig hart war.
- Ein leichter Tag heute (kleine Belastung) zeigt keinen Hinweis: du machst es ja schon locker.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Ideen für alle Bereiche (05.11.): Aktiv 4a gebaut. 4b (Wochenziele) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv öffnen: ohne drei harte Tage in Folge steht keine zusätzliche Zeile über «Heute abhaken».
2. Nach drei harten Tagen (zum Beispiel drei lange Fahrten hintereinander): die Zeile «… harte Tage in Folge. Heute locker?» erscheint.
3. «Heute nicht» tippen: die Zeile verschwindet für den Tag.
4. Ich › Aussehen › Vorschläge › Leistungstipps ausschalten: die Zeile erscheint nicht mehr.
