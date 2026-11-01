# Quick-Links-Stecknadel: bei «Grösse» 115 % nie über den Rand

PR #… · 31.10.2026 · Auftrag: Noah «1a», «kannst du damit schon beginnen» (Thread «Merge-Stau abbauen und Tests stabilisieren»)

## Was ist neu
- Behebt einen echten Fehler, der als wackeliger Test sichtbar war: Auf dem Handy (390 px) mit Grösse 115 % ragte die Stecknadel einer Karte rechts um 3 px über den Rand, und die Seite liess sich seitlich schieben (Ich › Darstellung, `look.spec.js`, rot auf main und in #479).
- Ursache: Die Nadel ist 44 px breit, bei Grösse 115 % aber 50,6 Bildschirm-Pixel. Die Platzierung rechnete mit 44 und liess sie darum 3 px über den Rand. Jetzt rechnet sie mit der gezoomten Breite (`PinMarks.svelte`, `placePin(…, 44 * z)`).
- Warum nur manchmal: Es hängt davon ab, wo die Karte beim Messen gerade endet (Layout-Zeitpunkt).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Kleine Änderung an der Datei des Quick-Links-Threads, weil sie rote Tests auf main verursacht. Dem Thread gesagt.
- Test geprüft: der Darstellung-Test lief 4 von 4 Läufen grün (vorher fiel in jedem Lauf einer durch); ein Unit-Test für die gezoomte Breite ist dazu.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- Thema «Merge-Stau»: Ursache für `look.spec` gefunden und behoben.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Darstellung: Grösse auf 115 %, Kompakt an. Die Seite lässt sich nicht seitlich verschieben.
2. Eine Seite mit Karten (z. B. Heute), Quick Links Nadeln an: die Nadel rechts oben liegt ganz auf dem Bildschirm.
