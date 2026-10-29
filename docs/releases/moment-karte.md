# Dein Moment auf Heute

PR folgt · 29.10.2026 · Auftrag: Noah «1a 2a 3a» (Thread «Neue Struktur der App aus der Funktionsliste»), Schritt 4 von «Heute als Begleiter»

## Was ist neu
- Neue Karte «Dein Moment» auf Heute, direkt unter der Meditation. Sie nennt den erkannten Moment (packen, unterwegs, zurück, Velo-Pflege …), zeigt die fünf Schritte einer Tour und einen Knopf für den nächsten Schritt.
- Die Karte ist eine normale Kachel: verschieben, ausblenden, löschen unter «Startseite anpassen».

## Was fällt weg oder rutscht tiefer
- nichts. (Die Doppelten, die die Karte ersetzt, bleiben vorerst: Tour-Karte «1/7», Start-Karte, «Schon ausprobiert?» und die vier Schnellknöpfe. Sie fallen in eigenen kleinen PRs weg, jeweils mit deinem Ok.)

## Selbst entschieden
- Die Karte steht unter der Meditation und vor der Tour-Karte; die Tour-Karte bleibt im «Jetzt»-Bereich.
- Der Moment folgt der Regel aus `src/lib/home/momentcard.js` (Tour heute, Nachbereitung offen, Pflege fällig, Eingang offen, sonst Tageszeit).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Heute als Begleiter: Schritt 4 gebaut; als Nächstes Entdecken-Karte (5), dann «Gehört dazu» (7–9).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter der Meditation steht «Dein Moment: …».
2. Auf den Knopf tippen: er öffnet den Ort für den nächsten Schritt, zum Beispiel die Packliste.
