# «Jetzt laden» sagt, wenn es nicht geklappt hat

PR folgt · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4a» (Thread «Fix «Jetzt laden» Update-Knopf»)

## Was ist neu
- Der dunkle Balken «Version … ist online, aber dieses Gerät hat noch eine ältere» und der Knopf «Neueste laden» in Ich warten nach dem Tippen acht Sekunden. Ist die Seite dann noch da (das Neuladen ist nicht passiert), steht dort ehrlich: «… konnte nicht geladen werden. Schliesse die App ganz (in der Übersicht nach oben wegwischen) und öffne sie neu. Deine Daten bleiben auf diesem Gerät.» Der Balken-Knopf heisst dann «Nochmal versuchen».
- Kommt die App von «frisch laden» zurück (Adresse mit `?fresh=`) und die Online-Version ist nach fünf Sekunden immer noch neuer als die laufende, sagt der Balken auch das (`verifyFresh` in `src/lib/behind.js`), statt wieder wie am Anfang zu fragen.
- Schritte, die auf dem Handy hängen oder einen Fehler werfen (Service Worker entfernen, Dateispeicher leeren, neue Adresse öffnen), stoppen das Laden nicht mehr: sie laufen gleichzeitig mit je 3 Sekunden Höchstzeit, bei einem Fehler folgt das einfache Neuladen.
- Der Balken-Knopf ist im echten Browser mit Touch und Service Worker geprüft (`tests/e2e/live/update.spec.js`, läuft im Live-Check); dazu Einheitstests für die neuen Wege.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Ursache: im Testbrowser (Handy-Touch und Computer, echter Service Worker, alte und neue Version) lädt der Knopf die neue Version zuverlässig; auf Noahs Handy liess sich die genaue Stelle ohne das Gerät nicht finden. Darum macht dieser PR den Weg ehrlich und prüfbar, statt nur einen weiteren Versuch zu raten.
- Keine Daten werden angefasst; «Website-Daten löschen» wird nie empfohlen.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: Update-Weg ehrlich und prüfbar; kein Planeintrag geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich öffnen, zur Zeile «Version … auf diesem Gerät» scrollen, «Neueste laden» tippen: die App lädt neu, Notizen und Listen sind noch da.
2. Falls oben der dunkle Balken «Jetzt laden» kommt: tippen. Entweder lädt die App neu, oder der Balken sagt nach etwa acht Sekunden, was zu tun ist.
