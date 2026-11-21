# Wochenrückblick auf Heute

PR #? · 19.11.2026 · Auftrag: Noah «1b» (10.11.2026) und «3a» (19.11.2026, Empfehlung ★ angenommen) (Thread «Bauen: Wochenbrief am Sonntag»)

## Was ist neu
- Von Sonntag 17 Uhr bis Montag 12 Uhr steht oben auf Heute eine Karte «Deine Woche in drei Zahlen»: Stunden, Kilometer und Einheiten der fertigen Woche, je mit dem Unterschied zur Vorwoche (dieselben Zahlen wie im Wochenrückblick).
- Am Sonntag nennt sie, was von deinen eigenen Aufgaben auf Montag rutscht (dieselbe Zählung wie der Wochen-Abschluss in «Woche planen»).
- Knöpfe: «Rückblick öffnen» (blendet die Karte bis nächsten Sonntag aus), «Nächste Woche planen» (am Montag «Woche planen») und «Heute nicht» (bis morgen).
- Ohne Daten der Woche und ohne offene Aufgaben zeigt sich die Karte nicht.

## Was fällt weg oder rutscht tiefer
- nichts. Das Sonntags-Fenster «Dein Wochenrückblick» (ab 18 Uhr) bleibt wie es ist (Noah «3a»).

## Selbst entschieden
- Name in der App: «Wochenrückblick» statt «Wochenbrief», weil `docs/namen.md` ein Wort pro Ding verlangt (der Brief im Chat heisst weiter Wochenbrief).
- Die Zeile «Neu in der App» aus dem Entwurf fehlt: «Was ist neu» steht schon ganz unten auf Heute, die Karte soll nichts doppeln.
- Die Karte wird nur in ihrer Zeit gerechnet: ausserhalb lädt sie keine Daten.
- Keine eigene Funktion in `features.js` und keine eigene Seite: die Karte ist ein Teil von Heute (Fertig-Regel: Absprung sind die zwei Knöpfe auf Rückblick und Woche, Leerzustand = Karte ist weg, nächster Schritt = die zwei Knöpfe).
- Gespeichert wird nur `homeWeekCard` in den Einstellungen ({ off, done }); kein Schema, kein Backup-Format geändert.

## Entscheide (für decisions.md)
- 19.11.2026: Karte und Fenster laufen nebeneinander (Noah «3a», Empfehlung).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wochenbrief am Sonntag, Teil App-Karte: gebaut, wartet auf «ok».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Öffne an einem Sonntag nach 17 Uhr (oder am Montag vor 12 Uhr) Heute: oben unter der Begrüssung steht die Karte mit drei Zahlen.
2. Tippe «Heute nicht»: die Karte ist weg; am nächsten Tag (Montag vor 12 Uhr) kommt sie noch einmal.
3. Tippe «Rückblick öffnen»: der Wochenrückblick öffnet sich, und die Karte bleibt bis nächsten Sonntag weg.
