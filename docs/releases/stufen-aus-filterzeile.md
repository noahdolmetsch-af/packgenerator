# Aktionen in Auswerten: «Stufen ändern» nicht mehr in der Filterzeile der Meilensteine

PR #1783 · 24.11.2026 · Auftrag: Noah «1-5a» (Prüfung «Aktionen in Auswerten», Entscheid 5a), Teil 5 von 5

Ziele von Noah (23.11.2026 18:09): **Klarheit** (die Filterzeile zeigt nur Filter, kein Werkzeug) und **Auffindbarkeit** (der Weg zu den Zahlen bleibt am Seitenende und in der Hilfe). Leitfaden `docs/leitfaden.md`: Meilensteine, Fitness-Daten.

## Was ist neu
- «Meilensteine»: der Knopf «Stufen ändern» rechts neben den Filtern (Alle, Über alle, Sportarten) ist weg. Die Filterzeile zeigt nur noch Filter.
- Der Weg bleibt: ganz unten steht die Karte «Zahlen und Stufen ändern» (zu, ein Tipp öffnet sie); die Adresse `#/flow/milestones?tune=1` öffnet sie weiter von selbst (auch der Link auf der Seite «Trophäen»). Der Satz in der geschlossenen Hilfe («Wie zählt das?») nennt jetzt diesen Namen und den Ort.

## Was fällt weg oder rutscht tiefer
- Der Knopf «Stufen ändern» oben neben den Filtern fällt weg; sein Ziel (die Zahlen) liegt weiter unten: neuer Weg ist die Karte «Zahlen und Stufen ändern» am Seitenende (am Handy gleich: Scrollen bis ans Ende, ein Tipp).

## Selbst entschieden
- Der Hilfesatz bekommt einen neuen englischen Schlüssel mit neuem Deutsch (`src/lib/i18n/de/aktionen-stufen.js`); der alte Eintrag bleibt unbenutzt in `meilensteinebelohnung.js` (alte Dateien werden nicht umgeschrieben).
- Der Link auf «Trophäen» (`tune=1`) bleibt, wie er ist.
- Kein Daten-, Backup- oder `api/`-Eingriff.

## Entscheide
- Noah 23.11.2026 19:49 «1-5a», Entscheid 5a. Siehe `docs/decisions/rueckgaengig-acht-sekunden.md` (Nachtrag).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Aktionen in Auswerten»: Teil 5 gebaut; offen: Löschen-Regel (Teil 4).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Meilensteine: neben den Filtern steht kein «Stufen ändern» mehr.
2. Ans Seitenende scrollen, «Zahlen und Stufen ändern» antippen: die Zahlen lassen sich ändern (Handy und Computer).
