# Spruch auf Heute (PR 1)

PR folgt · 07.11.2026 · Auftrag: Noah «Bau spruch pr1» nach «1b 2a 3b Bern» und «1a 2a 3a» (Thread «Entwerfen: täglicher Einstiegs-Spruch»)

## Was ist neu
- Neue Kachel **«Spruch»** auf Heute, direkt unter der Karte «Dein Moment»: ein kurzer Satz auf **Berndeutsch**, in der App aus Vorlagen und deinen eigenen Zahlen gebaut (kein KI-Aufruf, kein Internet für den Satz selbst).
- Vier Quellen mit je vier Sätzen (16): **Wetter** (Regen bis zur Uhrzeit, trocken und mild, Nebelgrenze mit Sonne darüber, kalter Morgen), **Zonenminuten** der Woche, **Schlaf und Ruhepuls** gegen dein eigenes Normal der letzten 30 Tage, **nächste Tour** (Tage und Packstand).
- Fünf Töne (motivierend, ruhig, lustig, Vision, herausfordernd) im Mix; der Ton wechselt von selbst. «Warum?» zeigt den Wert hinter dem Satz, «Neuer Spruch» gibt den nächsten.
- Bei jedem frischen Start der App ein neuer Satz; innerhalb einer Sitzung bleibt er. Die letzten 30 gezeigten Sätze sind gesperrt, dieselbe Quelle kommt nicht zweimal hintereinander (solange eine andere passt).
- **Gesundheit nur beobachten:** Ein Satz nennt nur einen gemessenen Wert, nie eine Ursache und nie einen Rat. An einem Tag, an dem Schlaf (mind. 40 Min. unter dem Normal) oder Ruhepuls (mind. 3 über dem Normal) abweichen, kommt keine Herausforderung, nur ruhige und freundliche Sätze.
- Ohne passenden Wert (kein Wohnort, keine Uhr, keine Tour) sagt die Kachel, warum sie leer ist, und bietet «Wetterort festlegen» und «Tour planen» an.

## Was fällt weg oder rutscht tiefer
- nichts. Begrüssung, Mundart-Wetterzeile und «Jetzt dran» bleiben. Alles, was in Heute unter der Karte «Dein Moment» steht, rutscht um die Höhe der Kachel nach unten; die Kachel lässt sich unter «Heute anpassen» verschieben oder ausblenden.

## Selbst entschieden
- **Platz weicht von deinem «2a» ab:** Du wolltest die Kachel direkt unter «Jetzt dran». Dort steht sie rund 4,3 Bildschirme tief auf dem Handy, und der Wächter `heimat.spec` verlangt, dass jede Funktion innerhalb von 2,5 Bildschirmen sichtbar ist (die Lücken-Liste darf nicht wachsen). Darum steht sie direkt unter der Karte «Dein Moment». Willst du sie doch weiter unten, verschiebst du sie unter «Heute anpassen», oder sag es und ich ändere den Standardplatz.
- Der Verlauf liegt als eine Zeile in den Einstellungen (`home.spruch`), keine neue Tabelle. Sie ist im Backup.
- Bestehende Kachelwände bekommen die Kachel einmal (Wand v 19), direkt unter der Karte «Dein Moment» (sonst unter der Tourkarte, sonst ganz unten). Wer sie wegnimmt, bekommt sie nicht wieder.
- «Im Normal»: kein Wert zum Vergleichen (keine Uhr, weniger als 7 Tage) heisst «nichts weicht ab», eine Herausforderung darf dann kommen.
- In den Sätzen an wenigen Stellen die Berner Form («e Firaaberundi», «E neui Wuche» statt «ä …») und «Rueipuls»; die Wörter sind Schreibweise nach Gehör und lassen sich auf Noahs Hinweis einzeln ändern.
- Nicht in PR 1 (laut Plan später): Tonwahl, «Nicht mehr solche», Seite «Alle Sprüche», eigene Sprüche, mehr Quellen und Zitate. Mit nur 16 Sätzen kann sich ein Wortlaut innerhalb von 30 Tagen wiederholen (die Zahlen darin ändern sich); weitere Formulierungen kommen in PR 2.
- Fertig-Regel: Seite (Eintrag `f.spruch`, Handbuch, Beispiel) ist da; Absprung und «Gut zu wissen» entfallen, weil die Kachel selbst auf Heute steht und keine eigene Seite hat; leere Ansicht und Zeile in `docs/app-stand.md` sind da. «Als Nächstes»: «Tour planen» in der leeren Ansicht.

## Entscheide (für decisions.md)
- 07.11.2026: Der Einstiegs-Spruch ist eine verschiebbare Kachel (1b), Berndeutsch (3b), Zitate bleiben Hochdeutsch (2a); Herausforderung nur bei Erholung im Normal; PR 1 einzeln freigeben, weil er die gespeicherte Kachelwand ergänzt.

## Stand im Plan
- Spruch zum Einstieg: PR 1 von 4 (Kachel mit 16 Sätzen). Plan und Sätze: `design/tagesspruch/konzept.md` im Projektordner.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auf Heute die Kachel «Spruch» unter der Karte «Dein Moment» suchen: ein Satz auf Berndeutsch, darunter Ton und Quelle.
2. «Warum?» tippen: die Zahl hinter dem Satz erscheint.
3. «Neuer Spruch» einige Male tippen: jedes Mal ein anderer Satz.
4. Unter «Heute anpassen» die Kachel verschieben oder ausblenden; mit «Zurück» (Rückgängig) kommt sie wieder.
