# Tour-Pfad

PR #1184 · 08.11.2026 · Auftrag: Noah «1 go A» (Thread «Bauen: Tour-Stand und Meine Datenquellen», Schritt 1 des Plans «ganze App»)

## Was ist neu
- Neue Seite «Tour-Pfad» (`#/trips/pfad?t=<Tour>`, `src/pages/Tourpfad.svelte`): eine Tour in vier Phasen (Planen, Vorbereiten, Unterwegs, Danach). Jede Zeile ist ein Link auf eine Seite, die es schon gibt, mit ihrem Stand (✓ erledigt, ◐ begonnen, ○ offen, ! Hinweis). Die laufende Phase ist offen, die anderen sind eingeklappt. Ein grosser Knopf führt zur ersten offenen Zeile.
- Neuer Baustein `src/lib/ui/Pfad.svelte` (Phasen mit Zeilen). Er kennt keine Tour; die Tour liefert nur ihre Zeilen. Dieselbe Hülle können später Velo-Jahr, Material, Mein Tag und Meine Woche nutzen.
- Die Rechnung dahinter ist `tourStand` (Schritt 0a, #1136). Die Worte stehen in `src/lib/tourpfad/saetze.js`.
- Weg hinein: oben auf den Tour-Seiten (Plan, Pack, Live, Review) steht in der Zeile «‹ Touren» der Link «Tour-Pfad»; am Computer ist auch «Schritt 2 von 4» unten ein Link zum Pfad.

## Was fällt weg oder rutscht tiefer
- nichts. Die Schrittleiste (Plan · Pack · Live · Review · Analyse) bleibt in diesem PR unverändert.

## Selbst entschieden
- Noah hat «A» gewählt: die vier Phasen sollen die Leiste ersetzen. Das ist ein eigener PR danach (Schritt 1b): die Leiste sitzt auf vier Seiten und in vielen Tests, und die fünf Seiten (Plan, Pack, Live, Review, Analyse) müssen dabei sauber auf vier Phasen verteilt werden. Dieser PR bringt zuerst den Pfad selbst, damit man ihn sehen kann.
- Zeilen ausblenden, umbenennen und eigene Zeilen: noch nicht. Das braucht einen Eintrag in den Einstellungen (Datenspeicher, Backup) und ist darum ein eigener PR mit Prüfung an einer Backup-Kopie. Die Rechnung kann ausgeblendete Zeilen schon (`hidden`).
- Zeilen ohne Daten (Körper, Velo-Pflege, Verpflegung, Fahrt) zeigen keinen Stand, nur einen Satz, was zu tun ist («Sieh dir deine Form an»). Sie tun nicht so, als wäre alles in Ordnung. Die Zeile «Körper und Tour» erscheint erst, wenn die längste Fahrt bekannt ist; dafür liest der Pfad sie noch nicht.
- Welche Tour: die in der Adresse (`?t=`), sonst die nächste kommende oder laufende, sonst die letzte.
- Karte «Meine Tour» auf Heute ist Schritt 2a, nicht Teil dieses PR.
- Nicht umgesetzt von der Fertig-Regel: «Gut zu wissen»-Text (die Seite hat die Karte «Was du hier tun kannst» nicht), «Passt hier»-Zeile (der Absprung ist der Link «Schritt n von 4»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: Schritt 1 gebaut. Danach 1b (Leiste durch Phasen ersetzen) und 2a (Karte «Meine Tour»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour öffnen, oben «Tour-Pfad» antippen: der Pfad der Tour öffnet sich.
2. Die laufende Phase ist offen; eine andere antippen, sie klappt auf.
3. Den grossen Knopf antippen: du landest bei der ersten offenen Zeile, zum Beispiel Packen.
