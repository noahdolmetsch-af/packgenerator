# «Heute erholen» / «Welcher Berg ruft?»: ein Satz auf Heute

Auftrag: Noah 24.11.2026 «1-5» (Punkt 1, Leitfaden «Die App kennt meine Daten und schlägt vor»); Ziele Klarheit und Auffindbarkeit

## Was ist neu
- Unter dem Satz zum Tag («Heute sind 7 Dinge dran.») steht, wenn es passt, **ein** zweiter ruhiger Satz (`src/lib/home/TagesSatz.svelte`, Regeln `src/lib/home/tagessatz.js`). Er kommt aus der Antwort des Tages (Form und Erholung: Form, Schlaf, HRV, Ruhepuls), den Aktivzonenminuten der Woche und dem Wetter von heute:
  - Antwort «Ruhe»: «Heute erholen: deine Werte sagen es leise.» Ein Tipp öffnet die Seite Form (dort steht, welche Werte zählen).
  - Antwort «locker»: «Ein lockerer Tag: eine ruhige Runde oder ein Spaziergang passt.»
  - Gute Antwort und trocken (oder Wetter unbekannt): «Heute geht es gut: welcher Berg ruft?» Ein Tipp öffnet das Gipfelbuch.
  - Gute Antwort, aber Regen: «Heute geht es gut, aber es regnet: drinnen oder später.» Ein Tipp öffnet Wetter.
  - Ein normaler oder guter Tag nach einer aktiven Woche (Aktivzonenminuten mindestens 30 % über deiner üblichen Woche): «Eine aktive Woche liegt hinter dir: heute darf es ruhig sein.» Ein Tipp öffnet den Verlauf der Zonenminuten.
  - Ein normaler Tag ohne Auffälliges: kein Satz.
- Das kleine × rechts daneben legt den Satz für heute weg (nur auf diesem Gerät, `localStorage`).
- Es ist nur ein Vorschlag, nie eine Wertung oder Diagnose. Die Rechnung für «Form und Erholung» lädt erst, wenn die Seite ruhig ist.

## Was fällt weg oder rutscht tiefer
- Nichts. Der Satz «Heute sind n Dinge dran» und alles andere stehen, wo sie standen; die neue Zeile steht dazwischen und vor «Heute entdecken».

## Wie das zu Klarheit und Auffindbarkeit beiträgt
- Klarheit: Heute sagt in einem Satz, was zum Körper des Tages passt, statt Zahlen zu lesen.
- Auffindbarkeit: der Tipp führt dorthin, wo der Grund steht (Form, Zonenminuten) oder wo man weitermacht (Gipfelbuch, Wetter).

## Selbst entschieden
- **«Welcher Berg ruft?» führt vorerst zum Gipfelbuch**, nicht zu einem einzelnen Berg: die Rechnung des Gipfelbuch-Threads (`bergRuft`) ist noch nicht auf main. Sobald sie da ist, ersetzt ein eigener kleiner PR den Satz durch den Berg («Heute ruft der …, 38 km») hinter einem Import, der erst beim Tippen lädt.
- **Zonenminuten** zählen nur als Gegengewicht (eine aktive Woche bremst den Satz «geht gut»); der Satz «Ruhe» kommt immer aus der Antwort des Tages, die schon Schlaf, HRV und Ruhepuls zusammenzählt.
- **Kein neuer Schalter:** «Heute nicht» reicht für den Tag; ein dauerhaftes Ausschalten kommt mit «Heute anpassen», wenn es gebraucht wird.
- **Fertig-Regel:** Seite/Absprung: der Tipp im Satz; Leer-Zustand: ohne Antwort des Tages, auf einem leeren Gerät und in der Nacht steht kein Satz; app-stand: Zeile Heute. `features.js` bekommt keinen eigenen Eintrag (ein Satz auf Heute, keine Seite).

## Entscheide (für decisions.md)
- `docs/decisions/tagessatz-heute.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan unverändert.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter «Heute sind n Dinge dran.» steht, je nach Tag, «Heute erholen …», «… welcher Berg ruft?» oder nichts.
2. Den Satz antippen: die Seite Form, das Gipfelbuch oder Wetter öffnet sich.
3. Auf das × tippen: der Satz ist weg, auch nach dem Neuladen; morgen ist er wieder da.
