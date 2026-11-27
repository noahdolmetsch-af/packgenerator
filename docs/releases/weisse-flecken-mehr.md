# Weisse Flecken ausbauen

PR #1831 · 27.11.2026 · Auftrag: Noah «1b 2a 3a 4a 5b» (27.11.2026 16:47) auf seine Frage «Neuland oder Weisse Flecken in der Nähe?» (Thread «Touren-Seite klarer machen»)

## Was ist neu
- «Weisse Flecken in der Nähe» (Touren › Träume): der Umkreis hat fünf Knöpfe (10, 25, 50, 75, 100 km) und ein Feld «Anderer Umkreis» zum Eintippen (5 bis 200 km, `src/lib/neuland/flecken.js`: `SPOT_RADII`, `SPOT_MIN`, `SPOT_MAX`). Die Wahl bleibt gespeichert wie bisher.
- Unter der Karte steht «Wo gibt es am meisten Neues?»: die bis zu vier Himmelsrichtungen mit den meisten Gemeinden, in denen du noch nie warst, mit «n von m noch nie besucht» und der Entfernung der nächsten (`directions()` in `flecken.js`).
- Ein gewählter Ort ab 50 km Entfernung (`TRAIN_KM`) zeigt den Hinweis «Zug hin, Velo heim» mit einem Knopf, der zu dieser Karte weiter unten auf der Seite springt.
- Die zwei Orte führen zueinander: Neuland › Gemeinden hat den Link «Weisse Flecken in der Nähe ›» (`#/trips/dreams?spots=1`, scrollt zu den Weissen Flecken); die Weissen Flecken haben unten «Alle Gemeinden in Neuland ›».

## Was fällt weg oder rutscht tiefer
- Nichts fällt weg. Die drei festen Umkreise 10, 25, 50 km sind jetzt fünf Knöpfe plus Eintippen.

## Selbst entschieden
- Eintippen von 5 bis 200 km: zu kleine oder zu grosse Werte werden auf den Rand gesetzt, ein Nicht-Wert lässt den Umkreis wie er war. Beim eingetippten Wert ist kein Knopf gewählt.
- «Wo gibt es am meisten Neues?» zeigt höchstens vier Richtungen und lässt Richtungen aus, in denen alles besucht ist.
- Die Hilfe-Schritte und der Text des Eintrags «Weisse Flecken in der Nähe» (`features.js`, `handbook.js`) nennen jetzt 10 bis 100 km und das Eintippen.
- Fertig-Regel: keine neue Funktion, sondern Ausbau von `f.whitespots`; Absprung ist der Link in Neuland; die Seiten «Was du hier tun kannst» bleiben wie sie sind.
- Nicht gebaut (Noah «5b»): das Ziel «Weissen Fleck schliessen» bei den Herausforderungen; steht auf der Warteliste.

## Entscheide (eigene Datei `docs/decisions/weisse-flecken-mehr.md`)
- 27.11.2026: Noah «1b 2a 3a 4a 5b».

## Stand im Plan
Dient «Klarheit» und «Auffindbarkeit» (Block 1): weniger Verwirrung zwischen Neuland und Weissen Flecken, ein Weg zwischen beiden. Kein Plan geändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume › «Weisse Flecken in der Nähe»: 100 km wählen, die Karte wird grösser.
2. «60» ins Feld «Anderer Umkreis» tippen: die Zeile über der Karte sagt 60 km.
3. Unter der Karte steht «Wo gibt es am meisten Neues?»; einen Ort ab 50 km antippen: der Hinweis «Zug hin, Velo heim» erscheint.
4. Neuland › Gemeinden: der Link «Weisse Flecken in der Nähe ›» führt dorthin und scrollt zur Karte.
