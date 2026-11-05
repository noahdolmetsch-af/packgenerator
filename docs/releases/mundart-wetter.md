# Wetter-Sprüche auf Mundart

PR (diese Änderung) · 03.11.2026 · Noah 03.11. «E und F» (Paket F, Idee 27 aus `notes/ideen-bewegung-2026-11-03/`); Ziel 5 «Alltag»

## Was ist neu
- Auf Heute steht unter Datum und Wetter eine kurze Zeile auf Mundart, die zum Wetter passt, zum Beispiel «Hüt isch Pfüdi-Wätter, Regejagge ii!» (Regen), «Es paar Schüürli chönnte cho …» (Schauer), «Schöns Wätter hüt: uf’s Velo!» (trocken), «Hitz hüt: gnueg Wasser mitnä und en Huet uf!» (ab 26 °C) oder «Brrr, chalt hüt! Handschueh a und Mütze uf.» (bis 3 °C). Am Abend, wenn die Zeile über morgen spricht, heisst es «morn».
- Der Spruch wechselt jeden Tag und bleibt den ganzen Tag gleich (`mundart.js`, 2 bis 4 Sprüche je Wetterart).
- Neuer Schalter unter Ich › Darstellung › Bedienung: «Wetter-Sprüche auf Mundart» (Standard: an). Aus = die Zeile ist weg.
- `weatherLine` (`heute.js`) liefert dafür neu die Art des Wetters (`kind`); Text und Verhalten der Wetterzeile bleiben gleich.

## Was fällt weg oder rutscht tiefer
- nichts. Eine kleine graue Zeile mehr unter dem Wetter; nachts (22 bis 06 Uhr) und ohne Vorhersage steht sie nicht.

## Selbst entschieden
- Die Sprüche sind feste Mundart-Texte und gehen **nicht** durch `t()`, genau wie die Begrüssung «Hoi, wi gahts?» (HG1 1a: immer Mundart, egal welche Sprache die App hat). Nur der Schalter hat Englisch und Deutsch.
- Als Schalter in «Bedienung», keine eigene Funktion im Katalog (Zusatz ohne eigene Seite, Fertig-Regel 1 bis 5 entfallen).
- Sprüche sind Vorschläge von mir; Noah kann sie ändern lassen (Wortlaut ist Geschmack, nicht Technik).
- `docs/app-stand.md` ist noch nicht auf `main` (PR #742 offen); die Zeile folgt nach dessen Merge.

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Paket F «Schmunzel-Ideen»: Idee 27 gebaut (Zeile in `vorhaben-liste.md` steht in PR #759).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unter Datum und Wetter steht eine kurze Zeile auf Mundart (nur wenn der Wohnort eine Vorhersage hat).
2. Ich › Darstellung › Bedienung: «Wetter-Sprüche auf Mundart» ausschalten: die Zeile ist weg.
