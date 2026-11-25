# Heute abhaken: Kacheln zuerst, eine Zahl für die Woche

PR # · 24.11.2026 · Auftrag: Noah «1-5a» (impeccable, ganze App, 24.11.2026 07:37 UTC), Paket 3 «Heute abhaken + Zahlen-Fix» (Quelle `notes/impeccable-ganze-app-2026-11-24/woche.md`, Funde 1 und 3)

## Was ist neu
- **Kacheln zuerst:** Auf «Heute abhaken» (`#/flow`) stehen die Kacheln direkt unter der Hilfe-Zeile «Was du hier tun kannst». Darüber steht nur noch eine Zeile: «Stoppuhr ›» links, «Bearbeiten ›» rechts. Am Handy beginnt die erste Kachel etwa 500 px höher.
- Die Frage «Wie war's?» (neue Strava- oder Fitbit-Aktivität) und die Einstiegskarte von Aktiv stehen unter den Kacheln und den laufenden Challenges.
- Die zweite Überschrift «Heute abhaken» und die Zeile darunter (die Wochenzahl, die der Kopf schon sagt) bleiben für Screenreader da, sind aber nicht mehr zu sehen (`quiet` in `src/lib/flow/kit/Sec.svelte`).
- **Zahlen-Fix:** «diese Woche k von n Einheiten» zählt jeden Haken einmal. «Liegestütze · 20» ist eine Einheit, nicht zwanzig. Aktiv und Woche sagen für dieselbe Woche dieselbe Zahl (`weekPlan` gibt dem erledigten Eintrag ein Feld `ticks`, `weekUnits` zählt es). Reine Rechnung, keine Datenänderung.

## Was fällt weg oder rutscht tiefer
- «Wie war's?» rutscht unter die Kacheln (am Handy etwa 500 px tiefer). Die Einstiegskarte von Aktiv (nur beim ersten Besuch offen) rutscht mit.
- Der Sprung «Heute abhaken» in «Auf dieser Seite» fällt weg, weil man schon dort ist; «Diese Woche» und «Ringe» bleiben.
- Die sichtbare zweite Überschrift «Heute abhaken» und die doppelte Wochenzahl fallen weg (für Screenreader bleiben sie).
- Sonst nichts. Alle Adressen bleiben.

## Selbst entschieden
- «Wie war's?» steht in der ersten Spalte unter den Challenges, damit es am Computer nicht über beiden Spalten steht; am Handy folgt es direkt auf die Kacheln, wie im Mockup.
- Ohne Sportarten (leere Seite) bleibt alles, wie es war, nur in neuer Reihenfolge: Hinweis, «Wie war's?», Einstiegskarte.
- Die Wochenzahl zählt **Haken**, nicht Minuten oder Wiederholungen; ein zweiter Haken derselben Sportart am selben Tag zählt als zweite Einheit, wie in Woche.
- Der Wert `n` am Eintrag (Wiederholungen) bleibt, wie er war; nur `weekUnits` liest jetzt `ticks`.
- Der Wächter-Test `tests/e2e/aktiv-kacheln-zuerst.spec.js` prüft die Reihenfolge und die Stoppuhr/Bearbeiten-Zeile.

## Beitrag zu den Zielen und Leitfaden
- Auffindbarkeit: die meistgenutzte Handlung (Abhaken) ist ohne Scrollen da.
- Klarheit: eine Zahl für die Woche, ein Kopf, kein doppelter Titel.
- Leitfaden (`docs/leitfaden.md`): Abhaken liegt vorne.

## Stand im Plan
- Paket 3 der Welle 1 (impeccable ganze App) erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche › Training › Heute abhaken am Handy: unter der Hilfe-Zeile stehen «Stoppuhr ›» und «Bearbeiten ›», darunter gleich die Kacheln.
2. Eine Sportart mit Wiederholungen abhaken (z. B. Liegestütze · 20): «diese Woche k von n Einheiten» zählt eins mehr.
3. Woche › Woche: «k von n Einheiten erledigt» ist dieselbe Zahl.
