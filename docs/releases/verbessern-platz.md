# Der Knopf «Verbessern» deckt das Seitenende nicht mehr zu

27.11.2026 · Auftrag: Noah, Test von «Frag Gemini» am Samsung A56 (27.11. 00:29); Regel «Nie abgeschnitten»

## Was ist neu
- Solange der schwebende Knopf «Verbessern» sichtbar ist, behält jede Seite unten Platz für ihn (Handy 48 px, Computer 72 px). Die letzte Zeile liegt über dem Knopf. Ohne den Knopf (in Ich › Darstellung › Bedienung ausgeschaltet) ändert sich nichts.

## Was fällt weg oder rutscht tiefer
- nichts. Seiten werden am Ende um diesen Platz länger, solange der Knopf an ist.

## Selbst entschieden
- Platz am Hauptteil statt am `body`: am `body` wurde die Seitenleiste am Computer kürzer (gesehen auf den ersten Bildern).
- Nicht in `App.svelte`, damit der Platz nur da ist, wo der Knopf ist.

## Entscheide
- `docs/decisions/verbessern-platz.md`.

## Stand im Plan (roadmap.md / vorhaben.md)
- keine Änderung.

## Prüfschritte (nach dem Merge)
1. Heute öffnen, ganz nach unten scrollen: die letzte Zeile liegt frei neben dem Knopf «Verbessern».
2. Dasselbe auf «Ich» und bei «Frag Gemini», am Handy und am Computer.
