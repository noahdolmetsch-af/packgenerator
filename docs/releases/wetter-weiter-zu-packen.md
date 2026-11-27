# Wetter: ein Weg weiter zum Packen

PR #1825 · 27.11.2026 · Auftrag: Nachtlauf 27.11. rot, Wege-Wächter (Sackgasse auf `#/wetter`)

## Was ist neu
- In der leisen Zeile «Als Nächstes:» am Ende von Wetter (erster Teil) steht ein dritter Schritt «Packen für den Tag» (Link auf `#/pack`). Sonst ändert sich nichts an der Wetter-Seite.
- **Ursache:** PR 1811 («Gehört zu» ins «?»-Fenster) nahm die Zeile «Gehört zu …» von der Seite. Das war bei Wetter der einzige Link auf eine andere Seite, wenn kein Netz da ist (Wetterdaten fehlen, keine Warnungen, keine Tour): die Zeile «Als Nächstes:» hatte nur Knöpfe, die zwischen den Teilen wechseln. Der Wege-Wächter am Computer (Nachtlauf 27.11., Teil 7) meldete deshalb «Sackgasse».
- **Gemessen:** ohne Netz vorher 0, jetzt 1 Link auf einen anderen Ort der App in der Hauptfläche (390, 1440×800, 1440×900).

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Ein Link statt eines neuen Blocks: Die Zeile «Als Nächstes:» gibt es schon (Content first: nichts über dem Inhalt). Packen passt zum Wetter, weil die Packliste die Wetterhinweise nutzt.
- Die Wetter-Seite selbst (Noahs Warteliste, 5 Fragen) ist nicht umgebaut.
- Der Wächter-Test selbst bleibt unverändert; der Wetter-Test `wetter-ausbau.spec.js` prüft den neuen Link zusätzlich.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung (die Wetter-Seite steht auf der Warteliste).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Wetter öffnen, ans Ende des ersten Teils scrollen: in «Als Nächstes:» steht «Packen für den Tag», ein Tipp öffnet Packen.
