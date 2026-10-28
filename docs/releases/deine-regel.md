# Deine eigene Regel

PR (Deine Regel) · 27.10.2026 · Auftrag: Noah «4a kann aber trotzdem übergangen werden», dann «1a 2a und b möglich 3a» (Thread «Kleider-Vorschlag selbst anpassen»), Schritt 3 von 3

## Was ist neu
- Unter «Warum so?» im Fenster «Was ziehe ich an?» steht «Deine Regel» (Einstellung `wear.rule`).
- Einfach (Noah 2b): «Ich friere schnell / normal / Mir wird schnell warm» rechnet 2 °C kälter oder wärmer, zusätzlich zur gelernten Verschiebung aus den Rückblicken.
- Genauer (Noah 2a): hinter «Genauer: ab wann jede Schicht kommt» pro Schicht die Grenze in °C, änderbar mit − und + (`src/lib/wardrobe.js` ONION_LIMITS, wearRule, stepLimit). Offen, sobald eine Grenze vom Standard abweicht.
- «Zuerst leichter / wärmer» wählt bei mehreren passenden Teilen das leichtere oder das wärmere.
- «Standardregel» setzt alles zurück. Packen nutzt dieselbe Regel (Pack.svelte, Wardrobe.svelte).
- Jede Schicht kann trotzdem von Hand dazugenommen oder weggelassen werden (Noah 4).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Grenzen −15 bis 30 °C in 1-°C-Schritten.
- Die Beine bleiben im Fenster immer dabei; ihre Grenze (10 °C) gilt nur beim Packen und ist nicht verstellbar.
- Die Regel steht unter «Warum so?», damit das Fenster ruhig bleibt.
- Die einfache Wahl ist drei Knöpfe statt eines Schiebereglers: auf dem Handy leichter zu treffen.

## Entscheide (für decisions.md)
- 27.10.2026: Eine Regel für Heute und Packen; «Du frierst» ±2 °C zusätzlich zur gelernten Verschiebung.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Was ziehe ich an? selbst anpassen»: Schritte 1–3 gebaut. Offen: °C-Bereich eines Sets im Set selbst ändern.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Was ziehe ich an?» › «Warum so?»: Unten steht «Deine Regel» mit drei Knöpfen.
2. «Ich friere schnell» tippen: Die Zeile oben zeigt «gefühlt» 2 °C kälter.
3. «Genauer» öffnen, bei «Füsse» zweimal + tippen: Die Grenze steigt um 2 °C; an einem kühlen Tag kommen die Überschuhe dazu.
4. «Standardregel» tippen: alles wieder wie vorher.
