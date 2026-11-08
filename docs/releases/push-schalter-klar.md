# Erinnerungen aufs Handy: klar, was an ist

PR folgt · 08.11.2026 · Auftrag: Impeccable-UX-Test 08.11.2026, Arbeitsliste 7b-07 (Thread «Push-Morgenschalter einbauen»)

## Was ist neu
- Auf `#/me/push` stand «Alles ist aus» und gleichzeitig «Eine Nachricht am Morgen» auf «an». Jetzt sind die Schalter «Eine Nachricht am Morgen» und «Welche Erinnerungen» grau, solange «Aufs Handy» aus ist, mit der Zeile «Schalte zuerst «Aufs Handy» ein. Bis dahin sind deine Wahlen nur gemerkt; es wird nichts geschickt.»
- Der Untertitel sagt dasselbe: «Es kommt nichts, bis du «Aufs Handy» einschaltest; danach wählst du, was kommen soll.»
- Blockiert der Browser Hinweise, steht unter «Aufs Handy» «Dein Browser blockiert Hinweise.», darunter in einem eigenen Absatz: «Tippe oben neben der Adresse auf das Schloss, dann auf «Benachrichtigungen» und auf «Erlauben»», dazu der Knopf «Nochmals».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Schalter bleiben bedienbar (nur grau statt grün), statt gesperrt zu sein, wie die Arbeitsliste vorschlägt: So lässt sich vorab wählen, auch wenn der Browser blockiert, und es gibt keine Reihenfolge-Pflicht (Regel 11, nichts wird blockiert). Gespeichert wird wie bisher; Speicherstruktur, Backup und `api/` bleiben unberührt.
- Nicht dabei: die vier Gruppen für die 22 Schalter und der eigene Kasten für die Einrichtung (Arbeitsliste 7b-08, Aufwand M). Eigener PR, wenn Noah es will.
- Keine neue Funktion im Katalog (`features.js`): bestehende Seite.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Impeccable-Arbeitsliste: 7b-07 erledigt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Erinnerungen aufs Handy: ist «Aufs Handy» aus, sind die Schalter grau, und eine Zeile sagt, was zuerst zu tun ist.
2. «Aufs Handy» einschalten: die Schalter werden grün.
3. Wer Hinweise im Browser blockiert hat: Schritte mit Schloss und Knopf «Nochmals» sind sichtbar.
