# Der Tab sagt, wo du bist

Auftrag: Noah «1a 2a 3a 4a 5a» vom 23.11.2026 (Thread «Papierkorb, Tab-Titel und Ziehen bauen»), Punkt 2 «Seitentitel im Browser-Tab». Ziel: Klarheit (man sieht, wo man ist).

## Was ist neu
- Der Titel des Browser-Tabs folgt der Pfad-Zeile, das Genaueste zuerst: «Jura-Runde · Touren», «Übersicht · Touren». Heute heisst weiter «Pack Generator». Vorher stand auf jeder Seite «Pack Generator».
- Läuft ein Timer, eine Meditation oder eine Fahrt, steht die Zeit vorn: «▶ 12:34 · Meditation» («⏸» bei Pause). Der Tab im Hintergrund zeigt so, wie lange es schon läuft.
- Für Bildschirmleser: nach einem Seitenwechsel sagt eine versteckte Zeile einmal die neue Seite (nie die laufende Zeit, kein Lärm).
- Namen, die Noah getippt hat (eine Tour, ein Velo), stehen unverändert; nur die Wörter der App gehen durch `t()`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Pause zeigt «⏸» statt «▶»; ein langer Name wird nach 60 Zeichen mit «…» gekürzt.
- Die Fahrt zählt die reine Fahrzeit (Pausen abgezogen), wie die Live-Karte.
- Das Modul der Aufnahme lädt erst auf den Seiten, die eine Aufnahme starten können (Live, Fahrt, Touren, Packen); die Startgrösse wächst nicht.
- Keine neue Funktion im Katalog (`features.js`) und kein «Gut zu wissen»: es ist keine Funktion mit eigener Seite, sondern ein Baustein, der überall gilt; die Zeile steht in `docs/app-stand.md` unter «Bausteine, die überall gelten».

## Entscheide (eigene Datei `docs/decisions/tab-titel.md`)
- 23.11.2026: Seitentitel im Tab mit Zeit vorn bei Timer und Fahrt (Noah «2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Ungenutzte Bedienmuster»: Punkt 2 von 4 (Reihenfolge 2 → 4 → 3 → 1).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Woche öffnen: der Tab nennt die Seite und ihren Ort.
2. Heute öffnen: der Tab sagt «Pack Generator».
3. Auf der Timer-Seite einen Timer starten, eine andere Seite öffnen: die Zeit steht vorn im Tab.
