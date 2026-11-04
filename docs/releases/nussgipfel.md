# Nussgipfel-Rechner

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «E und F» (Paket F, Idee 26 aus `notes/ideen-bewegung-2026-11-03/`); Ziel 5 «Alltag»

## Was ist neu
- Wo die App die kcal einer Fahrt nennt, steht daneben, wie viele Nussgipfel das sind («Das sind etwa 12 Nussgipfel.»): bei **Verpflegung** (Touren › Verpflegung), auf der **Live-Karte** («Bisher etwa … kcal verbraucht») und auf der **Wetterkarte einer Tour** («Pro Fahrtag etwa … kcal»). Ein Nussgipfel zählt 400 kcal (`nussgipfel.js`), gerundet auf einen ganzen.
- Neuer Schalter unter Ich › Darstellung › Bedienung: «Nussgipfel-Rechnung» (Standard: an). Aus = die Zeile ist überall weg.

## Was fällt weg oder rutscht tiefer
- nichts. Eine kleine graue Zeile mehr an drei Stellen.

## Selbst entschieden
- 400 kcal pro Nussgipfel (Bäckerei-Nussgipfel liegen zwischen 350 und 450). Als fester Wert; wer es nicht will, schaltet die Zeile aus.
- Als Schalter in «Bedienung», nicht als eigene Funktion im Katalog (Zusatz ohne eigene Seite, Fertig-Regel 1 bis 5 entfallen).
- Nicht auf Heute: Das Beispiel der Idee («Heute: 4 Nussgipfel verbrannt») braucht die Tagesenergie aus den Fahrten, die Heute heute nirgends zeigt. Die drei Orte oben zeigen die kcal schon. Kommt auf Heute, falls Noah es will.
- `RideEnergy.svelte` (Rückblick) ist heute nirgends eingehängt und bleibt unberührt.
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket F «Schmunzel-Ideen»: Idee 26 gebaut (Zeile in `vorhaben-liste.md` steht in PR #759).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Tour öffnen, dann Verpflegung: unter den Zahlen steht «Das sind etwa … Nussgipfel.»
2. Ich › Darstellung › Bedienung: «Nussgipfel-Rechnung» ausschalten: die Zeile ist weg.
