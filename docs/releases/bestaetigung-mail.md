# Bestätigung an die Kunden: Besammlung, Abholung, Regen

PR folgt · 09.11.2026 · Auftrag: Noah 05.11.2026 «5c» (Bestätigungs-Mail vorbereiten: Besammlung, Abholung, Regenregel) und 09.11.2026 «mit bestätigungsmail» (Thread «Klären Flyer für Tennisstunden»)

## Was ist neu
- Neue Karte «Bestätigung an die Kunden» im Angebot (unter «Erinnerung an die Kunden»): Mit «Angaben ergänzen» schreibst du einmal drei Zeilen, **Besammlung**, **Abholung** und **Bei Regen**. Alle drei sind freiwillig; eine leere Zeile steht nicht in der Nachricht. Die Karte zeigt das Beispiel: «Hallo Mia! Die Stunde ist gebucht: Tennis-Lektion am Do. 12.11. · 17:00. Ort: Mythenquai. Besammlung: beim Clubhaus. Abholung: Eltern holen am Platz ab. Bei Regen: Ich schreibe dir bis 14:00. Wenn du nicht kommen kannst, sag mir bitte bis 24 Stunden vorher Bescheid. Bis dann!»
- Der Text steht bereit, sobald du eine Anfrage oder eine Wunschzeit bestätigst («Bestätigt. Sag es jetzt Mia:» mit «Schreiben»), und später mit dem neuen Knopf **«Bestätigung»** bei jeder gebuchten Person in der Stundenliste, auch bei Buchungen ohne Anfrage.
- Bei einer E-Mail-Adresse hat die vorbereitete Mail einen Betreff («Bestätigt: Tennis-Lektion, Do. 12.11. · 17:00»). Bei einer Telefonnummer öffnet sich wie bisher die SMS-App.
- Die drei Zeilen gelten für alle Angebote und stehen im Backup (Einstellung `booking.confirm`, kein `api/`-Change). Die App sendet nichts (Noah «2b»).

## Was fällt weg oder rutscht tiefer
- nichts. Der Satz nach dem Bestätigen ist jetzt immer derselbe (Gruss, Stunde, Ort, Zeilen, Absage-Frist, «Bis dann!»): vorher hiess er nach einer Anfrage «… ist bestätigt. Bis dann!» (ohne Gruss) und nach einer Wunschzeit «Guten Tag … Die Stunde ist gebucht …». Ohne die drei Zeilen und ohne Ort bleibt er so kurz wie die Wunschzeit-Nachricht vorher.

## Selbst entschieden
- Ein Satz für alle drei Wege (Anfrage, Wunschzeit, Stundenliste), damit Eltern immer dieselbe Nachricht bekommen.
- Drei feste Zeilen statt eines freien Textes (anders als bei der Erinnerung): Noah nannte genau diese drei Angaben; ein freier Text kann später wie bei der Erinnerung dazukommen.
- Die Zeilen gelten für alle Angebote (ein Ort, kein `api/`-Change); wer mehrere Plätze hat, schreibt «je nach Ort» oder passt die Nachricht vor dem Senden an.
- Ort kommt wie bei der Erinnerung aus der Zeit (bei mehreren Orten) oder aus dem Angebot; bei einer Wunschzeit nur, wenn die Eltern genau einen Ort angekreuzt haben.
- Der Knopf «Bestätigung» sitzt neben «Schreiben» in der Stundenliste; er heisst nicht «Ändern…», damit er nicht mit «Ändern» (bei «So wird gebucht») verwechselt wird.
- Fertig-Regel: wie bei Erinnerung, Probestunde und Warteliste keine eigene Funktion im Katalog und keine Karte «Gut zu wissen» (Teil der Seite «Tennis › Angebote»); die Zeile in `docs/app-stand.md` wurde ergänzt.
- Kein echter Versand: ein Mail-Dienst kommt später.

## Entscheide (für decisions.md)
- keine neuen (Noah «5c» vom 05.11.2026 gilt)

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: die vorbereitete Bestätigungs-Mail ist online; offen bleiben die Teilnehmerliste mit Warteliste (eigener PR) und der echte Versand mit Mail-Dienst.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Tennis › Angebote › ein Angebot öffnen: Auf der Karte «Bestätigung an die Kunden» «Angaben ergänzen» antippen, eine Besammlung schreiben, speichern: Das Beispiel zeigt sie.
2. Eine Zeit mit Buchung öffnen: Bei der gebuchten Person «Bestätigung» antippen, die Mail (oder SMS) öffnet sich mit deinem Text.
3. Eine Anfrage bestätigen: Danach steht «Bestätigt. Sag es jetzt …» mit demselben Text und «Schreiben».
