# Notfall ohne Standort, alte Adresse, Leiste bei 320 px

Auftrag: Noah «1–5 a» zum UX-Test vom 08.11.2026 (Thread «Notfall-Seite und 320-px-Leiste reparieren»). Befunde 4-02, D-3 und D-5 aus `notes/ux-test-impeccable-2026-11-08/`.

## Was ist neu
- **Notfall (`#/mountain/sos`)**: Ist der Standort aus oder kommt kein Signal, steht im Kasten «Dein Standort» jetzt «Sag der Rettung deinen Ortsnamen oder schau ihn auf der Karte nach», dazu die Knöpfe «Nochmal versuchen» (fragt neu) und «Karte öffnen» (`#/mountain/map`). Endet ein zweiter Versuch gleich, steht «Noch immer aus.» davor. Klappt er, erscheint der Standort und die Knöpfe gehen. Die zwei Anrufknöpfe bleiben oben, unverändert.
- **Alte Adresse (`#/flow/tennis` und jede unbekannte Adresse unter `#/flow/`)**: statt still den Aktiv-Start zu zeigen, sagt die Seite «Diese Seite gibt es nicht mehr». Für Tennis führt «Zu Tennis» zur Sportart, sonst gibt es «Zu Aktiv». Die Liste der bekannten Adressen steht in `src/lib/flow/oldaddress.js`; `tests/oldaddress.test.js` fällt, wenn eine im Quelltext geschriebene Adresse fehlt.
- **Leiste bei 320 px**: «Velos und Material» steht in zwei ganzen Zeilen statt «Velos und …». Nur unter 360 px Breite: kein seitlicher Rand und die Buchstaben der zwei Zeilen etwas enger (die Schriftgrösse bleibt 12 px, die Schriftstufen kennen keine kleinere).

## Was fällt weg oder rutscht tiefer
- nichts. (Der alte Satz «Erlaube «Standort» in den Browser-Einstellungen oder lies deinen Ort auf der Karte ab» ist ersetzt; der Hinweis auf die Browser-Einstellungen steht als zweite Zeile weiter da.)

## Selbst entschieden
- Die Karte `#/mountain/map` bekommt **keine** «Mein Standort»-Taste (im Befund als Zusatz genannt): eine eigene Funktion, eigener PR, wenn Noah sie will.
- Dasselbe Muster «Text verweist auf Funktion ohne Link» steht auf `#/live` («Noch kein Standort … ruf an», `livekarte.js:91`): nicht in diesem PR geprüft, eigener Fund.
- «Nochmal versuchen» gibt es auch, wenn nur das Signal fehlt (Zeitüberschreitung), nicht nur bei ausgeschaltetem Standort.
- Wörter: «Standort», «Karte öffnen», «Nochmal versuchen» wie im Bestand; die Namensliste (docs/namen.md) war beim Bau noch nicht gemergt, kein Wort daraus betroffen.
- Auf 320 px nur die Buchstaben der Leiste enger gesetzt (Schrift bleibt 12 px, der Stil-Wächter erlaubt nur die Stufen), nicht die Beschriftung gekürzt (der Name «Velos und Material» gehört Noah).
- Fertig-Regel: keine neue Funktion in `features.js`, daher keine neuen Seiten- oder Wissenseinträge; `docs/app-stand.md` hat bei «Standort im Notfall» die neue Zeile.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Ziel «Unterwegs sicherer» (Z3): Notfall-Seite ist keine Sackgasse mehr. Keine Planänderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Notfall öffnen (Touren › Skitouren › Berg und Notfall › Notfall) und den Standort für die App im Browser ausschalten: «Nochmal versuchen» und «Karte öffnen» stehen im Kasten; die Karte öffnet sich.
2. `…/packgenerator/#/flow/tennis` öffnen: «Diese Seite gibt es nicht mehr», «Zu Tennis» öffnet die Sportart.
3. Handy mit 320 px (oder Browserfenster so schmal): untere Leiste, «Velos und Material» in zwei ganzen Zeilen.
