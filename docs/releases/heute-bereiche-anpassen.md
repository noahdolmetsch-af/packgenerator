# Eigene Bereiche auf Heute

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a 2a» (27.10.2026), Thread «Heute ruhiger»

## Was ist neu
- Unter «Startseite anpassen» steht die Liste «Bereiche von Heute» (`src/lib/home/AreasEdit.svelte`). Die Bereiche lassen sich mit Pfeilen und Ziehen verschieben (1a), umbenennen und ausblenden (2a), jedes Mal mit Rückgängig.
- Ausblenden fragt im gemeinsamen Fenster (`GroupDeleteSheet`, neu mit Knopf-Wort «Ausblenden»), wohin die Kacheln gehen: «Ohne Bereich» (am Ende von Heute, vorgewählt) oder ein anderer Bereich. Die Kacheln bleiben immer auf Heute. «Wieder zeigen» holt einen Bereich zurück.
- Gespeichert in einer Einstellung `homeAreas` (`order`, `names`, `off`; `src/lib/home/sections.js`: `normAreas`, `areasOf`, `moveArea`, `renameArea`, `hideArea`, `showArea`). Kein Schema-Wechsel, das Backup nimmt die Einstellung wie alle anderen mit.
- Eigene Namen gehen nicht durch `t()`. Neue Gruppenart in `GROUP_PLACES` («Areas of Today»).

## Was fällt weg oder rutscht tiefer
- nichts. Ohne eigene Einstellung sieht Heute aus wie vorher.

## Selbst entschieden
- Ein Bereich wird ausgeblendet, nicht gelöscht: die sechs Bereiche gehören zur App, so kommen sie mit «Wieder zeigen» zurück.
- Kleine Kacheln aus einem ausgeblendeten «Schnell öffnen» bleiben in ihrem neuen Bereich eine ruhige Liste.
- Ein leerer Name bringt den Namen der App zurück.

## Entscheide (für decisions.md)
- 27.10.2026: Bereiche von Heute verschieben (Pfeile und Ziehen), umbenennen und ausblenden mit Rückgängig; Kacheln gehen nach «Ohne Bereich» (Noah «1a 2a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- «Heute ruhiger» (Ziel Alltag): fertig. Das Zuklappen der Bereiche am Handy baut «Neuer Schwung» (Noah «3a»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute öffnen, unten «Startseite anpassen»: unter «Bereiche von Heute» «Dein Körper» mit dem Pfeil nach oben schieben, dann «Fertig». Dein Körper steht jetzt zuoberst.
2. Wieder «Startseite anpassen»: Stift bei «Jetzt», eigenen Namen eingeben. Dann Auge bei «Deine Woche», «Ohne Bereich» lassen, «Ausblenden». Heute zeigt den neuen Namen, die Wochen-Kacheln stehen unten unter «Ohne Bereich».
3. «Wieder zeigen» holt «Deine Woche» zurück.
