# Handy und Computer in Sekunden gleich

PR folgt · 10.11.2026 · Auftrag: Noah «1 ok 2 ok», «a» (Thread «Prüfen: Abhaken sofort zwischen Handy und Computer»)

Baut auf «Abgleich: zuerst senden, nie hängen» (PR 1) auf und wird erst danach geöffnet.

Anlass: Ein Haken (zum Beispiel Tennis) auf dem Handy sollte sofort auf dem Computer stehen und umgekehrt. Bisher: Senden 20 Sekunden nach der Änderung, Nachfragen alle 5 Minuten, und man sah nirgends ausser unter Ich › Daten und Backup, ob es klappte.

## Was ist neu
- Eine Änderung geht 2 Sekunden später raus (vorher 20 Sekunden).
- Solange die App offen und vorne ist, fragt sie alle 20 Sekunden nach Neuem. Passiert zehn Runden lang nichts, alle 60 Sekunden. Eine Änderung, das Zurückkommen in die App, Netz zurück oder Ziehen macht sie wieder schnell. Ist die App verborgen, läuft kein Zeitgeber.
- Ziehen zum Aktualisieren auf Heute startet auch einen Abgleich (höchstens 15 Sekunden gewartet, danach läuft er im Hintergrund weiter).
- Eine ruhige graue Zeile unter den Kacheln von «Heute abhaken» auf Aktiv: «Abgeglichen vor 12 s», «Gleicht ab …» oder «Abgleich hängt · tippen, um es neu zu versuchen» (ein Tipp startet eine Runde). Sie erscheint nur bei eingeschaltetem Abgleich (`src/lib/flow/SyncLine.svelte`).
- Kleiner Startfehler behoben: Die erste Änderung nach dem Öffnen konnte keinen Abgleich auslösen, wenn der Zustand des Abgleichs noch nicht gelesen war.

## Was fällt weg oder rutscht tiefer
- Der 5-Minuten-Takt ist ersetzt durch den 20-Sekunden-Takt (60 s bei Ruhe).
- Sonst nichts.

## Selbst entschieden
- Die Zeile steht nur auf Aktiv bei «Heute abhaken», nicht auch in der Kachel «Im Flow» auf Heute. Auf Zuruf nachziehbar.
- 20 Sekunden und 60 Sekunden sind ein Kompromiss zwischen «sofort» und dem Gratis-Kontingent des Servers. Eine Anfrage sind etwa zwei Redis-Befehle. Das Limit des Gratis-Plans habe ich nicht nachgeprüft; bei rund 3 Stunden offener App pro Tag und Gerät liegt es weit darunter (geschätzt, nicht gemessen).
- Keine neue Funktion im Katalog (`features.js`) und keine neue Seite: es ist eine Zeile bei einer bestehenden Funktion. Damit entfallen Fertig-Regel 1, 3 und 6; Absprung (2) ist die Zeile selbst (tippbar nur bei Problem), Leerzustand (4) ist «Noch nicht abgeglichen», nächster Schritt (5) ist nicht nötig.
- Server (`api/`), Tabellen und Backup-Format bleiben unverändert.
- Der Hinweis «Abgleich hängt» erscheint nach einem Fehler oder wenn eine Runde länger als 90 Sekunden läuft.

## Entscheide (für decisions.md)
- 10.11.2026: Der Abgleich fragt alle 20 Sekunden nach, solange die App vorne ist, statt eine Live-Verbindung zu bauen (Grund: gratis, Vercel Hobby hält keine dauernde Verbindung).

## Stand im Plan (roadmap.md / vorhaben.md)
- Abgleich Handy ↔ Computer: PR 2 von 2.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Handy und Computer: beide auf Aktiv offen. Auf dem Handy Tennis antippen.
2. Auf dem Computer steht Tennis nach etwa 20 Sekunden abgehakt, ohne dass du etwas tippst.
3. Unter den Kacheln steht «Abgeglichen vor …». Nimm den Haken am Computer zurück: nach kurzer Zeit auch am Handy.
