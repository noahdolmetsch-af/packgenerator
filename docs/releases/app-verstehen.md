# Deine App verstehen

PR #269 · 26./27.10.2026 · Auftrag: Noah «der plan- wie unabhägig bleiben 1-6 alle umsetzen. mini kurs ebenfalls auch in der app einsehbar mit links und übungen … unter ich - app verstehen», «1 a und danach b 2b 3 beides 4b frei wählbar wann … 5a» (26.10. 21:11 UTC); Auto-Merge für Dependabot: «freigabe für auto-merge. also in zukunft soll es automatisch passieren ohne meine freigabe und auch ohne claude» (26.10. 21:07 UTC); online bringen: «2a» (27.10. 15:24 UTC, Thread «Mein Überblick») (Thread «Erklären App-Aufbau und Unabhängigkeit»)

## Was ist neu
- **Ich › App verstehen** (`#/me/verstehen`): sieben kurze Lektionen in beliebiger Reihenfolge, je mit Schritten, einer Übung und Links (GitHub, Vercel, Seiten in der App). «Als erledigt abhaken» lässt sich wieder wegnehmen, nichts erinnert.
- **Notfall-Handbuch** (`docs/notfall-handbuch.md`): wie die App gebaut ist, «Wenn etwas kaputt ist» mit Klicks (Schritte A–E), Backup, einen anderen Helfer einweisen, was man nie tun soll.
- **Konten-Liste** (`docs/konten.md`): alle Konten und die Namen der Schlüssel, ohne Passwörter, Schlüssel oder Mailadressen. Der private Teil liegt nur im Projektordner (`private/konten-privat.md`).
- **Bibliotheks-Updates (Dependabot)** führen sich wieder von selbst zusammen, sobald die Prüfungen grün sind (`.github/workflows/dependabot-automerge.yml`).

## Was fällt weg oder rutscht tiefer
- nichts (eine neue Zeile unter Ich › Hilfe, über «Datenschutz und Nutzung»)

## Selbst entschieden
- Lektionen als aufklappbare Karten; «Erledigt» steht in `db.settings` (`verstehen`) und reist im Backup mit.
- Backup-Erinnerung (Antwort 5a) gab es schon: Ich › Eigene Werte «Backup-Erinnerung alle», Standard 14 Tage, auch als Push. Kein neuer Code.
- Ein PR statt zwei, weil der Thread nur einen Zweig hat.
- `CLAUDE.md` Regel 3 sagt noch «Dependabot … follow the same way» (kein Auto-Merge). Noahs Antwort vom 26.10. 21:07 ist jünger und gilt für Dependabot; die Zeile in CLAUDE.md muss ein Regel-PR nachziehen.

## Entscheide (für decisions.md)
- 26.10.2026: Dependabot-Updates mergen wieder von selbst auf Grün, ohne Noah und ohne Claude (Noah 21:07).
- 26.10.2026: Mini-Kurs in der App unter Ich › App verstehen, frei wählbar, ohne Erinnerung; Konten-Liste öffentlich ohne Geheimnisse plus privat im Projektordner.

## Stand im Plan (roadmap.md / vorhaben.md)
- Unabhängig bleiben (Ziel Alltag): Notfall-Handbuch, Konten-Liste und Kurs fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › **App verstehen** öffnen: sieben Lektionen, oben «0 von 7 erledigt».
2. Lektion 2 aufklappen › **Als erledigt abhaken**: oben steht «1 von 7 erledigt».
3. **Notfall-Handbuch** antippen: GitHub öffnet das Handbuch.
