# Die Tasche rollt zu

PR folgt · 03.11.2026 · Auftrag: Noah «a» (Thread «Durchgehen: offene Fragen einzeln», Paket B «Packen fühlt sich echt an»: nur Idee 6 und 11)

## Was ist neu
- Packen: Neben dem Titel der offenen Tasche steht eine kleine gezeichnete Tasche (`src/lib/pack/BagRoll.svelte`). Solange etwas fehlt, ist ihre Öffnung offen. Hakst du das letzte Teil ab, rollt der Verschluss zu, und die Schnalle rastet ein. Das passiert in den 0,7 Sekunden, bevor die Seite zur nächsten Tasche springt.
- Auf dem gezeichneten Velo (`PackBike.svelte`) rollt der Verschluss einer vollen Tasche oben zu.
- Der Klick ist ein kurzes doppeltes Vibrieren (nur Android). Er hängt am bestehenden Schalter «Kurzes Vibrieren beim Abhaken» (Ich › Bedienung).

## Was fällt weg oder rutscht tiefer
- Nichts. Die Zahl im Ring und das Häkchen bleiben, der Kopf der offenen Tasche hat links nur ein Bild mehr.

## Selbst entschieden
- **Idee 6 (Vibrieren beim Abhaken) gab es schon**: seit 13.10.2026 (FE7) vibriert das Handy beim Abhaken, an von Anfang an, abschaltbar unter Ich › Bedienung. Der Eintrag in den Ideen («beim Packen nicht») war falsch. Neu ist nur der Klick beim Zurollen.
- Bei «Bewegung reduzieren» am Gerät rollt nichts, die Tasche wechselt nur ihr Bild, und der Klick bleibt aus.
- Eine Tasche, die beim Öffnen der Seite schon voll ist, zeigt sich zu, ohne zu rollen und ohne Klick.
- Die Rolle sitzt im Kopf der offenen Tasche und auf dem Velo, nicht in den Ringen der Kacheln: der Ring mit Zahl bleibt, wie er ist.
- `docs/app-stand.md` liegt noch nicht auf `main` (PR 742 offen), darum kann dieser PR die Datei nicht ändern. Es gibt keine neue Funktion, nur eine Bewegung in «Tasche für Tasche packen».

## Entscheide (für decisions.md)
- 03.11.2026: Paket B baut nur Rollverschluss (11); Vibrieren (6) war schon da; Karten nacheinander (7) und Ringe füllen (8) bleiben Idee.

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuer Schwung: Zeile 5b in `vorhaben-liste.md`, Rollverschluss gebaut.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour am Packtag öffnen, «Packen»: neben dem Titel der offenen Tasche steht eine kleine Tasche mit offener Öffnung.
2. Das letzte offene Teil der Tasche abhaken: der Verschluss rollt zu (am Samsung klickt es kurz), dann springt die Seite zur nächsten Tasche.
3. Eine volle Tasche antippen: die kleine Tasche steht zu da. Auf dem gezeichneten Velo hat die volle Tasche einen Streifen oben.
