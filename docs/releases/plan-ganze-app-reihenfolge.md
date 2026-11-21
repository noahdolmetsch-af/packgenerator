# Plan «ganze App»: neue Reihenfolge nach den Entscheiden vom 08.11.

Auftrag: Noah 08.11.2026 («Db Eb Fa Ca Bb Aa», «1c», dann «a»/«b» zu den Fragen 2–11; Thread «Skizzieren: Tour von A bis Z und Datencenter»). Entscheide im Volltext: Projektordner `design/app-gesamt/entscheide-2026-11-08.md`.

## Was ist neu
- `docs/plan-ganze-app.md`: neue Reihenfolge (Tour-Pfad, 1b Schrittleiste, 4a Fragen, 2a Meine Tour, 2b Hauptkarte, dann Pause für Noahs echte Tour, danach Velos und Ich, Material und Aktiv, Planen, Tourprofil, Unterwegs, Danach).
- Schritt 1b (Schrittleiste durch die vier Phasen) steht jetzt im Plan.
- Schritt 7a: der Unterwegs-Modus startet nicht von selbst, Noah schaltet ihn mit einem Knopf auf «Meine Tour» ein (Frage 9, Antwort b).
- Schritt 7b: «Das fällt auf» nur nach der Tour.
- Schritt 8 (Tour-Budget) hat den neuen Stand `gestrichen`. `scripts/plan-stand.mjs` zählt ihn nicht mit («Plan: 2 von 15 online»).
- `tests/plan.test.js`: kennt `gestrichen` (kein PR und kein Weg nötig) und prüft, dass nur Schritt 8 so steht.
- Nichts davon ist in der App sichtbar.

## Was fällt weg oder rutscht tiefer
- Schritt 8 (Tour-Budget) fällt aus dem Plan (Noah «E b», in Frage 11 bestätigt).
- Alle Orts-Umbauten (3a bis 5b, 6) und 4b, 7a, 7b rutschen hinter die Pause für die echte Tour.

## Selbst entschieden
- Die Pause steht als Zeile ohne Schrittnummer in der Tabelle; der Test liest sie nicht, sie zählt nicht als Schritt.
- «Gestrichen» ist ein eigener Stand und kein Löschen der Zeile, damit man sieht, dass die Idee entschieden und nicht vergessen wurde.

## Entscheide (für decisions.md)
- 08.11.2026: Reihenfolge und Inhalt des Plans «ganze App» neu festgelegt; Unterwegs-Modus wird selbst eingeschaltet; Tour-Budget gestrichen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Plan «ganze App»: unverändert 2 Schritte online, Rest offen; Reihenfolge angepasst.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts in der App zu sehen. Auf GitHub unter `docs/plan-ganze-app.md` stehen die Schritte in neuer Reihenfolge, Schritt 8 «gestrichen» und eine Zeile «Pause».
2. Unter Actions ist der Lauf «build» grün.
