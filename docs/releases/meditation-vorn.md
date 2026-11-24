# Meditation und Challenge vorn

PR #? · 23.11.2026 · Auftrag: Noah «1-5a» (Leitfaden-Abgleich) und «1-3a» (Fragen im Thread «Challenges nach Gelegenheit bauen»)

## Was ist neu
- Unten im Block «Heute abhaken» steht **eine Zeile** (`src/lib/home/ChallengeLine.svelte`): links **Draussen** mit «20 von 90 Min heute» und «+30 Min» (mit Rückgängig; nur solange die Challenge läuft), rechts die **Meditation** mit den Tagen in Folge, «heute noch offen» oder «heute gemacht» und dem Startknopf der Karte («Jetzt starten · 20 Min», nach einer Sitzung «Nochmals · 10 Min»).
- Die Zeile liest dieselben Daten wie die Karten «Draussen» und «Meditation»; sie speichert nichts Eigenes (kein Datenformat, keine Backup-Änderung).
- Die leise Zeile «Meditation: oben bei deinen Gewohnheiten» fällt weg (die Zeile ersetzt den Hinweis; die anderen Gewohnheiten werden weiter genannt).

## Was fällt weg oder rutscht tiefer
Nichts. Die grossen Karten «Draussen» und «Meditation» bleiben unverändert weiter unten als Details (Noah «3a»). Nur der Hinweis «Meditation: oben bei deinen Gewohnheiten» ist ersetzt: er stimmte nicht mehr, weil die Karten unter «Dein Körper heute» und «Meine Tour» liegen.

## Selbst entschieden
- Die Zeile steht im Block «Heute abhaken» (unter den Kacheln), nicht als eigener Block darüber oder darunter: so bleibt «Abhaken» der erste Block (Klarheit) und der Tagesbogen-Platz «Jetzt» bleibt frei von Draussen und Meditation.
- Der Block fehlt weiter, wenn es keine Aktivität zum Abhaken gibt; dann fehlt auch die Zeile (die Karten weiter unten bleiben).
- Mein Tag › Abhaken zeigt Meditation und die Challenge-Karte schon beieinander; dort ändert dieser PR nichts.
- Kein neuer deutscher Text: alle Wörter kommen von den Karten.

## Entscheide
- 23.11.2026 «1a 2a 3a»: die Zeile zeigt Draussen-Stand und Meditation je mit Knopf; die Meditation steht immer, Draussen nur solange eine Challenge läuft; die grossen Karten bleiben als Details (`docs/decisions/meditation-vorn.md`).

## Stand im Plan
- Leitfaden «Meditation wieder stärker nach vorn»: Heute erledigt (diese Zeile); Mein Tag › Abhaken war schon so.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen: unten im Block «Heute abhaken» steht die Zeile mit Draussen (falls die Challenge läuft) und Meditation.
2. «+30 Min» tippen: die Minuten wachsen, «Rückgängig» nimmt sie zurück.
3. Den Startknopf der Meditation tippen: die Sitzung startet wie auf der Karte.
