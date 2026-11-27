# Heute-Test im dunklen Modus: Breite erst messen, wenn Heute fertig ist

PR #NNNN · 27.11.2026 · Auftrag: Hinweis des Wachs-/Wunschlisten-Threads (home-0460.spec.js:167 einmal rot bei zwei Workern), Wackel-Wächter

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `home-0460.spec.js:167` («colour worlds and dark mode in More; every choice stays», Computer).
- **Ursache:** Der Test wechselte mit `page.goto('./#/')` zu Heute und mass sofort die Seitenbreite bei 390 px («Today in the dark»). Heute baut seine Abschnitte erst nach dem Aufräumen und dem Laden der Daten auf; auf der halb gebauten Seite war `scrollWidth` 854 statt höchstens 390. Mit zwei Workern (Rechner unter Last) trat es 8 von 8 Mal auf, mit einem Worker 1 von 3 Mal (der erste Lauf).
- **Fix:** Der Test wartet mit `settle(page)` (Aufräumen fertig, Heute hat entschieden, was es zeigt), wie es die anderen Seiten-Tests tun. Zusätzlich misst `noSideScroll` nach der Grössenänderung erst nach zwei Bildern, nicht mitten im Umbau. Geprüft wird weiter dasselbe (höchstens 390 und 320 px breit), nichts wurde gelockert.
- **Lokal:** zwei Worker, 8 Läufe je Gerät: vorher 8 von 8 Computer rot, jetzt 16 von 16 grün.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- App nicht geändert: nach dem Aufbau ist Heute 390 und 320 px schmal genug (der Test misst das weiter, auch in anderen Zuständen).
- Kein Warten mit fester Zeit, nur auf den Zustand «Heute fertig».

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: Test grün. In der App nichts zu prüfen.
