# Prüfungen: sofortige Meldung mit Mail, wenn das Online-Gehen von main rot ist

Auftrag: Noah «ja» (Thread «Prüfungen so einrichten, dass main grün bleibt»)

Kein sichtbarer Unterschied in der App. Es ändert sich nur etwas auf GitHub.

## Was ist neu
- **Neue Datei `.github/workflows/online-rot.yml` («Online-Rot melden»):** Sobald der Lauf «Build and deploy» nach einem Merge auf `main` fertig und **rot** ist, öffnet GitHub sofort ein Issue «Online-Gehen von main ist rot» (Label `online-rot`) und schickt dir eine Mail. Im Issue stehen der Merge (Titel und Nummer des Commits), der Link zum Lauf und welcher Schritt rot ist. Ist schon ein solches Issue offen, kommt ein Kommentar dazu («Wieder rot»), also wieder eine Mail.
- **Wieder grün:** Ist der nächste Lauf auf `main` grün (die Version ist online), schliesst GitHub das Issue selbst mit «Wieder online».
- **Warum:** Bisher sah man ein rotes `main` erst am nächsten Morgen (Live-Check, Nachtlauf) oder wenn jemand nachschaute. In der Zeit stand die neue Version nicht online, und jeder weitere PR wurde auf einem roten Stand gebaut (zuletzt `sync-ruhige-runde` nach #1333).
- Ein abgebrochener Lauf (ein neuerer Merge hat ihn ersetzt) meldet nichts. Läufe von PRs melden nichts (dort zeigt das rote Häkchen am PR schon alles).
- Kein Geld, kein Secret: nur das eingebaute `GITHUB_TOKEN`. Der Commit-Text wird nur als Text eingesetzt, nie als Befehl ausgeführt.

## Was fällt weg oder rutscht tiefer
- Nichts. `deploy.yml` bleibt unverändert; die Meldung ist ein eigener, kleiner Ablauf, der erst nach dessen Ende startet.

## Selbst entschieden
- Eigene Datei statt eines weiteren Jobs in `deploy.yml`: so kann die Meldung das Online-Gehen nie aufhalten oder selbst rot machen, und `deploy.yml` (Schnellspur) bleibt, wie es ist.
- Ein Kommentar (= Mail) bei **jedem** weiteren roten Lauf, anders als beim Nachtlauf: hier ist jeder Lauf ein neuer Merge, also etwas Neues. Bei «abgebrochen» keine Meldung.
- Das Issue schliesst sich bei dem nächsten grünen Lauf, auch wenn der rote Merge nicht der Auslöser war: Online ist online.
- Keine Änderung an `docs/app-stand.md` (die Datei beschreibt nur, was die App kann).

## Entscheide (für decisions.md)
- 21.11.2026: Ein rotes Online-Gehen von main meldet sich sofort mit Issue und Mail (Noah «ja»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: main bleibt grün. Danach in dieser Reihenfolge (Noah «2, 1, 4»): Rundgang auf der echten Seite, Fehler-Melder in der App, Wackel-Test-Liste.

## Prüfschritte
Nichts Sichtbares. Nach dem Merge: Der erste rote Lauf auf `main` öffnet das Issue von selbst (unter Issues, Label `online-rot`). Wer es vorher sehen will: auf GitHub unter Actions › «Online-Rot melden» läuft nach jedem Merge einmal (bei grün in unter einer Minute, ohne Issue).
