# Heimat-Test: auf das Notiz-Fenster warten, und sagen, wenn es nie aufgeht

PR #NNNN · 26.11.2026 · Auftrag: möglicher neuer Wackler aus der Handy-Prüfung von PR 1807 (Koordinator), Wackel-Wächter

## Was ist neu
- Nichts Sichtbares geändert, nur Test für `heimat.spec.js` («every function is visible on its home page», Handy).
- **Was passiert ist:** In der Handy-Prüfung von PR 1807 (Impeccable-Nachtbericht, ändert nichts an der App) meldete der Test «f.richtext «Formatieren» on #/notes?open=:note» als nicht sichtbar, im ersten Lauf und im Wiederholungslauf. Im selben Teil 2 war auch `fragen-aus-daten.spec.js:400` zweimal rot («das Feld lädt seine Einstellungen später»). Der neue Lauf desselben Standes war grün. Beides deutet auf einen langsamen Prüfrechner in diesem Zeitraum (Teil 2 brauchte 31 Minuten), nicht auf die App.
- **Nicht nachgestellt:** auf main 3 von 3 grün; mit zwei Dauerläufern, die die Hälfte der Rechner belegen, erscheint die Format-Leiste 2,5 bis 3,3 Sekunden nach dem Neuladen (6 von 6 Läufen), unmittelbar nach dem Warten auf die Seite.
- **Fix (Vorsicht, Ursache nicht bewiesen):** Bei Seiten mit `?open=` wartet der Test zuerst auf das Fenster selbst (`dialog[open]`, bis 15 Sekunden, ein Zustand, keine feste Zeit). Fehlt eine Funktion und das Fenster ging nie auf, sagt die Meldung das jetzt: «(its window did not open)». Beim nächsten Rot steht die Ursache im Log.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- App nicht geändert: nichts spricht für einen App-Fehler (Notiz-Fenster und Format-Leiste im lokalen Lauf immer da).
- Wackelliste: Eintrag «beobachten», bis ein zweites Rot oder ein Log mit der neuen Meldung die Ursache zeigt.

## Entscheide
- keine.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. In GitHub: Test grün. In der App nichts zu prüfen.
