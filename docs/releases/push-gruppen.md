# Erinnerungen aufs Handy in vier Gruppen

PR folgt · 08.11.2026 · Auftrag: Impeccable-UX-Test 08.11.2026, Arbeitsliste 7b-08; Noah «alles» (Thread «Push-Morgenschalter einbauen»)

## Was ist neu
- Auf `#/me/push` standen 22 Schalter in einer langen Liste. Jetzt sind sie in vier Gruppen, alle zugeklappt: **Rund um die Tour** (4), **Wetter und Licht** (8), **Velos und Material** (5), **Alltag** (5). Jede Zeile zeigt «3 von 8 an» oder «Alles aus», ein Pfeil zeigt auf und zu. Die Gruppen stehen in `PUSH_GROUPS` (`src/lib/push/schedule.js`).
- Die Namen der Schalter, ihre Reihenfolge innerhalb einer Gruppe und alles Gespeicherte bleiben gleich.

## Was fällt weg oder rutscht tiefer
- Die 22 Schalter rutschen hinter einen Tipp: alter Weg «sofort in der langen Liste», neuer Weg «Gruppe antippen». Die Gruppenzeile zeigt, wie viele darin an sind. Noah hat das mit «alles» (alle Empfehlungen) freigegeben.

## Selbst entschieden
- Die vier Gruppen sind fest (Überschriften der App, nicht umbenennbar oder löschbar): Es sind Arten von Hinweisen der App, keine eigenen Daten. Noah «alles».
- Zeilen «Erinnerung zu deiner Zeit» und «Welche Touren es beobachtet» bleiben direkt unter ihrem Schalter, in der Gruppe.
- Geöffnet bleibt eine Gruppe nur bis zum Neuladen; nichts davon wird gespeichert.
- Der Heimat-Test (`heimat.spec.js`) öffnet die Gruppen der Reihe nach einzeln, so wie eine Person sie antippt, und prüft jede für sich; sonst wäre «Kette nach Regen» bei vier offenen Gruppen weiter als 2,5 Bildschirme unten.
- Nicht dabei, eigener PR danach (Noah «alles»): der Kasten «Weckruf für den Server» in Alltagsworten.
- Server, Backup und Speicherstruktur sind nicht betroffen.

## Entscheide (für decisions.md)
- keine neuen (Namen der Gruppen stehen in `docs/namen.md`, Zeile 21)

## Stand im Plan (roadmap.md / vorhaben.md)
- Impeccable-Arbeitsliste: 7b-08 Teil «Schalter in Gruppen» erledigt; Teil «Weckruf-Kasten» offen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Erinnerungen aufs Handy: vier zugeklappte Gruppen, jede mit «n von m an» oder «Alles aus».
2. «Wetter und Licht» antippen: die acht Schalter öffnen sich, die anderen Gruppen bleiben zu.
3. Einen Schalter ein- und wieder ausschalten: die Zahl in der Gruppenzeile ändert sich.
