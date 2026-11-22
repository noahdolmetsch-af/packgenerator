# Erinnerung an die Kunden: Ort, Absage-Regel, eigener Text

PR folgt · 08.11.2026 · Auftrag: Noah 04.11.2026 «2a» (Erinnerung als Zeile auf Heute) und «2b» (E-Mail nur vorbereiten, Mail-Dienst später), Reihenfolge 07.11.2026 «flyer zuerst, dann probestunde, dann automatische erinnerungs mail» (Thread «Klären Flyer für Tennisstunden»)

## Was ist neu
- Die Zeile «Stunde morgen um 17:00: Mia · Tennis-Lektion» auf Heute gab es schon (heute und morgen, Knopf «Erinnern»). Neu ist der Text dahinter: «Hallo Mia! Zur Erinnerung: Tennis-Lektion morgen um 17:00. Ort: Mythenquai. Wenn du nicht kommen kannst, sag mir bitte bis 24 Stunden vorher Bescheid. Bis dann!» Ort kommt aus der Zeit (bei mehreren Orten) oder aus dem Angebot, die Frist aus «So wird gebucht».
- Geht die Erinnerung an eine E-Mail-Adresse, hat die vorbereitete Mail einen Betreff («Erinnerung: Tennis-Lektion morgen um 17:00»). Bei einer Telefonnummer öffnet sich wie bisher die SMS-App.
- Neue Karte «Erinnerung an die Kunden» im Angebot (neben «So wird gebucht»): Schalter «Mich am Vortag und am Tag selbst erinnern», das Beispiel des Textes, und «Eigener Text». Im Fenster schreibst du deinen Text mit den Wörtern {Name} {Angebot} {Tag} {Zeit} {Ort} {Stunden} (auf Englisch {name} {title} …); darunter siehst du sofort, wie er aussieht. Leer lassen heisst: der fertige Text. «Fertigen Text nehmen» setzt zurück.
- Der Text und der Schalter gelten für alle Angebote und stehen im Backup (Einstellung `booking.reminder`).

## Was fällt weg oder rutscht tiefer
- nichts. Der alte Satz «Hallo …! Zur Erinnerung: … Bis dann!» ist der Anfang des neuen Textes; ohne Ort und ohne Frist bleibt er so kurz wie bisher.

## Selbst entschieden
- Die App sendet nichts (Noah «2b»): «automatisch» heisst, dass die Erinnerung zur richtigen Zeit auf Heute steht und die Mail fertig ist. Ein echter Versand braucht einen Mail-Dienst und kommt später.
- Ein Text und ein Schalter für alle Angebote, nicht pro Angebot: so ist es ein Ort, und der Server (`api/`) bleibt unverändert; die Einstellung liegt nur auf dem Gerät und im Backup.
- Deutsche Wörter für die Platzhalter, weil die deutsche App keine englischen Wörter zeigen soll; die englischen Wörter funktionieren auch.
- Unbekannte Wörter in geschweiften Klammern bleiben, wie du sie schreibst.
- Der Schalter blendet nur die Zeile auf Heute aus; in der Buchungsliste siehst du alle Stunden weiterhin.
- Knopf heisst «Eigener Text» (nicht «Text ändern»), damit er nicht mit «Ändern» bei «So wird gebucht» verwechselt wird.
- Fertig-Regel: wie bei Probestunde und Warteliste keine eigene Funktion im Katalog und keine Karte «Gut zu wissen» (Teil der Seite «Tennis › Angebote»); die Zeile in `docs/app-stand.md` wurde ergänzt.

## Entscheide (für decisions.md)
- keine neuen (Noah «2a», «2b» vom 04.11.2026 gelten)

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: die vorbereitete Erinnerungs-Mail ist online; offen bleiben Bestätigungs-Mail und Teilnehmerliste (je eigener PR) und der echte Versand mit Mail-Dienst.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tennis › Angebote › ein Angebot öffnen: Die Karte «Erinnerung an die Kunden» zeigt den fertigen Text mit Ort und Frist.
2. «Eigener Text» antippen, einen Text mit {Name} und {Zeit} schreiben, speichern: Das Beispiel zeigt deinen Text.
3. Heute: Gibt es eine Stunde heute oder morgen, öffnet «Erinnern» die Mail (oder SMS) mit diesem Text.
