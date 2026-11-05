# Handbuch erst beim Öffnen laden

PR · 04.11.2026 · Auftrag: Noah «a» (Thread «Erklären und beheben: Start-Grenze bei 98 %»), Teil 1 von 2 («Was ist neu» folgt als eigener PR)

## Was ist neu
- Das Handbuch (Schritte und Beispiele jeder Funktion, Englisch und Deutsch) lädt nicht mehr beim Start der App, sondern erst, wenn es gebraucht wird: auf den Seiten Ich › Handbuch und Ich › Kleine Apps und in der Karte «Was du hier tun kannst».
- Der Start liest damit rund 350 KB weniger JavaScript (gemessen: 3.97 → 3.83 MB im ganzen Start, davon 206 KB bei den vom Wächter gezählten deutschen Texten: 4.52 → 4.31 MB).
- In der App ändert sich nichts. Die Karte «Was du hier tun kannst» zeigt «So geht's» einen Augenblick später, wenn das Handbuch noch lädt. Offline geht alles weiter, das Handbuch ist im Offline-Speicher wie jede andere Datei.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Das Handbuch-Deutsch ist geteilt: 1239 Texte nur fürs Handbuch (neue Datei `src/lib/handbook/texte-de.js`), 485 Texte bleiben beim Start in `src/lib/i18n/de/handbuch.js`, weil auch andere Stellen sie brauchen oder sie einen anderen Text überschreiben; 221 doppelte Einträge mit gleichem Wortlaut wurden entfernt. Alle 1945 Texte sind nachgezählt, kein Wortlaut hat sich geändert.
- Zwei neue Tests (`tests/size-guard.test.js`): nur die Handbuch-Seiten und `handbook/load.js` dürfen das Handbuch laden, und kein Text in der späten Datei wird anderswo gebraucht.
- Das Handbuch-Deutsch der neueren Funktionen (Dateien in `src/lib/featreg/` mit eigenen Deutsch-Dateien) bleibt beim Start; das wäre ein späterer Schritt.
- Keine «Was ist neu»-Datei und keine Zeile in `docs/app-stand.md`: nichts Sichtbares, keine neue Funktion.

## Entscheide (für decisions.md)
- 04.11.2026: Noah «a»: Handbuch und «Was ist neu» erst beim Öffnen laden, in zwei PRs. Dieser PR ist der erste.

## Stand im Plan
- Tempo: Teil 1 (Handbuch) fertig. Teil 2 («Was ist neu», rund 1 MB) folgt als eigener PR.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Handbuch öffnen: eine Funktion antippen, «Aufschalten», Schritte und Beispiel stehen auf Deutsch da.
2. Touren › Träume: die Karte «Was du hier tun kannst» zeigt unter «So geht's» Schritte und Beispiel auf Deutsch.
3. Ich › Kleine Apps: Titel, Schritte und Beispiele sind auf Deutsch.
