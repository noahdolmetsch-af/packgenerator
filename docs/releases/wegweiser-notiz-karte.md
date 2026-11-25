# Notizen erklärt, was eine offene Notiz kann (Wegweiser 26c)

PR #<Nummer> · 02.11.2026 · Auftrag: Noah «speichere schritt 1-26 als geplant … freigabe» (01.11.2026), «kannst du damit schon beginnen während du wartest?» (02.11.2026), Thread «Entdeckbarkeit versteckter Funktionen planen»

## Was ist neu
- Die 6 Funktionen einer offenen Notiz (Erinnern an einem Ort der Strecke, Verknüpfte Notizen, Skizze, Formatieren, Datei anhängen, Erinnern) stehen in der Karte «Was du hier tun kannst» auf Notizen, je mit «Gut zu wissen».
- `SHOWS_TOO` in `src/lib/seiteninhalt.js`: eine Seite zeigt auch die Funktionen der Fenster, die sie öffnet. Eine offene Notiz ist ein Fenster über Notizen und würde eine eigene Karte verdecken (gesehen bei Schritt 21).
- 6 neue Tipps in `src/lib/wissen/planen.js`, Deutsch in `src/lib/i18n/de/wissen-planen.js`.

## Was fällt weg oder rutscht tiefer
- nichts. Die Karte auf Notizen hat 6 Zeilen mehr; sichtbar bleiben die ersten 4, der Rest steht hinter «Alle … zeigen».

## Selbst entschieden
- Die Notiz-Funktionen stehen auf Notizen statt in der offenen Notiz, weil das Fenster die Karte verdecken würde.
- Der Test «jede Funktion gehört zu ihrer Seite» lässt jetzt auch die Seiten aus `SHOWS_TOO` zu (Änderung mit Absicht).

## Entscheide (für decisions.md)
- keine neuen.

## Stand im Plan (roadmap.md / vorhaben.md)
- Vorhaben 17 Wegweiser statt Katalog: Schritt 26 in kleinen PRs, 26c gebaut (nach 21).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Planen › Notizen öffnen, in «Was du hier tun kannst» auf «Alle … zeigen» tippen.
2. «Erinnern», «Skizze» und «Erinnern an einem Ort der Strecke» stehen dort mit einer Zeile «Gut zu wissen».
