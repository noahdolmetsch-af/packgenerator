# Prüfungen: Rundgang auf der echten Seite (abhaken, Sportjahr, Backup)

Auftrag: Noah «2, 1, 4», Schritt 2 (Thread «Prüfungen so einrichten, dass main grün bleibt»)

Kein sichtbarer Unterschied in der App. Es ändert sich nur die Prüfung auf GitHub.

## Was ist neu
- **Der Live-Check handelt jetzt wie du.** Bisher öffnete er auf der echten Seite nur Seiten (Heute, Ich, Touren, offline). Neu läuft im selben Lauf (nach jedem Online-Gehen und jeden Morgen) ein Rundgang mit den Dingen, die du jeden Tag tust (`tests/e2e/live/rundgang.spec.js`):
  1. Auf Aktiv «Tennis spielen» abhaken, es öffnet «Geschafft», der Haken bleibt nach dem Neuladen.
  2. Sportjahr öffnen: keine Fehlerseite, «Tennis» steht drin.
  3. Backup speichern: die Datei enthält den Haken.
  4. Den Haken zurücknehmen (zweites Tippen).
  5. Das Backup wieder einspielen (Alle Daten ersetzen): der Haken ist zurück.
  Dazu darf im Browser kein Fehler auftreten.
- Bei Rot öffnet der Live-Check wie bisher ein Issue «Live-Check: die App im Netz braucht Hilfe» (Mail an dich). Grün schliesst es.
- **Deine Daten bleiben unberührt:** Der Roboter nutzt einen frischen Browser mit eigenen leeren Daten. Er liest und schreibt nichts von dir.

## Was fällt weg oder rutscht tiefer
- Nichts. Der Live-Check dauert etwa eine Minute länger.

## Selbst entschieden
- Haken, Sportjahr und Backup sind die drei Dinge, die du genannt hast. Weitere Schritte (Tour planen, Packliste abhaken) kommen, wenn du sie willst.
- Nur auf dem Handy-Format, wie der Live-Check bisher. Lokal ist der Rundgang auf Handy und Computer grün.
- Kein neues Issue und kein neues Label: der Rundgang hängt im bestehenden Live-Check.
- Der Testname bleibt bewusst ohne Umlaut: Chromium kann eine Datei aus einem Ordner mit «ü» im Pfad nicht auswählen (so fand ich den Fehler beim Bauen).

## Entscheide (für decisions.md)
- 21.11.2026: Der Live-Check geht nach dem Online-Gehen auch den Alltag durch (abhaken, Sportjahr, Backup), nicht nur Seiten öffnen (Noah «2»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Eine App, die mich im Alltag unterstützt»: main bleibt grün. Danach (Noah «2, 1, 4»): Fehler-Melder in der App (zuerst ein Vorschlag), Wackel-Test-Liste.

## Prüfschritte
Nichts Sichtbares. Nach dem Merge: unter Actions › «Live-Check» ist der Lauf nach dem nächsten Online-Gehen grün, im Bericht stehen zwei Tests (Seiten und Rundgang).
