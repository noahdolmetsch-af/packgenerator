# Schnupperstunde (Probestunde) im Angebot

PR folgt · 08.11.2026 · Auftrag: Noah «10a» (04.11.2026: pro Angebot, einmal pro Person), Reihenfolge 07.11.2026 «flyer zuerst, dann probestunde», «ja» (08.11.2026) (Thread «Klären Flyer für Tennisstunden»)

## Was ist neu
- Unter «So wird gebucht» (Tennis › Angebote › ein Angebot › «Ändern») gibt es den Schalter «Schnupperstunde anbieten». Er fügt eine Art «Schnupperstunde» hinzu: ein Platz, halber Preis der ersten Art (60 CHF Einzel → 30 CHF). Name, Plätze und Preis änderst du wie bei jeder Art.
- Die Zeiten der Schnupperstunde öffnest du wie jede andere Zeit: im Fenster «Zeit öffnen» wählst du die Art «Schnupperstunde».
- «Einmal pro Person»: Fragt eine Person, die schon eine Schnupperstunde dieses Angebots hat (gleicher Name oder gleiche Telefonnummer oder E-Mail), nach einer zweiten, steht bei der Anfrage und bei der Buchung «Hatte schon eine Schnupperstunde: …». Sagst du ab, schlägt die vorbereitete Nachricht eine normale Stunde vor.
- Im Kundenblatt ist die Schnupperstunde bei den Stunden markiert.
- Der Rechnungsentwurf nimmt für eine Schnupperstunde immer den Preis der Schnupperstunde, auch wenn die Person einen eigenen Preis hat.

## Was fällt weg oder rutscht tiefer
- nichts. Ohne den Schalter bleibt alles wie bisher.

## Selbst entschieden
- Kein neuer Server-Code (`api/` bleibt): die Schnupperstunde ist eine gewöhnliche Art des Angebots mit dem Schlüssel `trial`, der Server speichert sie wie jede Art. Darum kann er «einmal pro Person» nicht sperren; die App zeigt es nur an, du entscheidest (alles ist ein Vorschlag). Bei «Sofort gebucht»-Angeboten siehst du die Markierung erst nach der Buchung und kannst sie absagen.
- Preis halb: Vorschlag aus deinem Satz «Schnupperstunde halber Preis» (07.11.2026), auf 50 Rappen gerundet, im Fenster änderbar.
- Der Schalter erscheint bei Tennis- und eigenen Angeboten, nicht bei Touren und Velo-Service. Der Server erlaubt höchstens vier Arten; sind vier da, fehlt der Schalter.
- Schaltest du ihn aus, werden die Zeiten der Schnupperstunde zu Zeiten der ersten Art (nichts geht verloren); das Fenster sagt es vorher.
- Gleiche Person: gleicher Name (Gross-/Kleinschreibung und Leerzeichen egal) oder gleiche Nummer oder E-Mail.
- Das Wort: «Schnupperstunde», wie schon beim Flyer (Art «Schnupperstunde»).
- Fertig-Regel: wie bei Gutscheine und Warteliste keine eigene Funktion im Katalog und keine Karte «Gut zu wissen» (Teil der Seite «Tennis › Angebote»); die Zeile in `docs/app-stand.md` wurde ergänzt.

## Entscheide (für decisions.md)
- keine neuen (Noah «10a» vom 04.11.2026 gilt)

## Stand im Plan (roadmap.md / vorhaben.md)
- Zusatzideen Dienstleistung: Probestunde online; offen bleibt die automatische (vorbereitete) Erinnerungs-Mail.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ein Tennis-Angebot öffnen, «Ändern» unter «So wird gebucht», «Schnupperstunde anbieten» einschalten: eine Art «Schnupperstunde» mit halbem Preis erscheint. Speichern.
2. Eine Zeit öffnen und die Art «Schnupperstunde» wählen: die Zeit trägt den Namen.
3. Zwei Anfragen derselben Person für zwei Schnupperzeiten stellen (Link teilen, auf dem Handy öffnen) und die erste bestätigen: bei der zweiten steht «Hatte schon eine Schnupperstunde» und «Ablehnen» schlägt eine normale Stunde vor.
