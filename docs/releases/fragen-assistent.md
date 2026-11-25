# Fragen-Bereich: Assistent von den Fragen aus

PR #1783 · 23.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Fragen-Bereich», Entscheid 5a); Bündler gab die Reihenfolge

Ziele von Noah (23.11.2026 18:09): **Klarheit** (man sieht, wo man ist: «Auswerten» bleibt markiert, ein Link führt zurück) und **Auffindbarkeit** (die sechs Fragen sind im Assistenten sofort als Knöpfe da).

## Was ist neu
- Von «Eigene Frage stellen» (Seite «Frag deine Daten») öffnet der Assistent unter `#/assistent?von=fragen`: der Cursor steht im Feld, in der Leiste und der Seitenleiste bleibt «Auswerten» markiert, der Link «Zurück zu «Frag deine Daten»» führt zurück.
- Die sechs Fragen der Seite sind Knöpfe unter dem Feld. Ein Tipp zeigt dieselbe Karte wie auf der Seite, mit «Stand heute …», «Wie gerechnet» und «Mehr dazu». Die Daten und die Texte sind geteilt (`FragenDaten.svelte`, `FrageKarte.svelte`, `saetze.js`): kein zweiter Rechenweg, `answerOf` zählt.
- Der Assistent allein (`#/assistent`) bleibt eine Seite von «Ich».

## Was fällt weg oder rutscht tiefer
- nichts. Die Seite «Fragen» ist innen umgebaut (die Texte wohnen jetzt in `src/lib/fragen/saetze.js`), sieht aber aus wie nach dem vorigen PR.

## Selbst entschieden
- «Auswerten» bleibt über die Adresse `?von=fragen` markiert (`src/lib/nav.js`, `FROM_FRAGEN`), nicht über ein gemerktes Herkommen: die Adresse ist teilbar und überlebt ein Neuladen.
- Das Feld bekommt den Cursor nur, wenn noch keine Frage im Feld steht. Am Handy öffnet das die Tastatur: gewollt (Noah «5a»).
- Statt des Pfad-Zeilen-Baus ein eigener Link «Zurück zu …» mit dem Ziel im Text, damit es auch nach «Pfad-Zeile weg» trägt.
- Die Karte der Frage ist bei zu wenig Daten die schmale Zeile (aufgeklappt wird sie mit einem Tipp).
- Kein Daten-, Backup- oder `api/`-Eingriff; die Rechnung bleibt.

## Entscheide
- Noah 23.11.2026 18:17 «1-5a», Entscheid 5a. Siehe `docs/decisions/fragen-kopf-kurz.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- Fragen-Bereich: Teil 2 (Assistent). Folgt: Idee auf Heute (nach «Heute entdecken»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Fragen › «Eigene Frage stellen»: Cursor im Feld, «Auswerten» markiert.
2. Eine der sechs Fragen antippen: die Antwort erscheint, «Stand heute» steht darunter.
3. «Zurück zu «Frag deine Daten»» führt zur Seite zurück.
