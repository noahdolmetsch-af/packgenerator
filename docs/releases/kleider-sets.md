# Kleider-Sets

PR (Kleider-Sets) · 27.10.2026 · Auftrag: Noah «1a 2a oder b wählbar 3a 4a kann aber trotzdem übergangen werden 5a» (Thread «Kleider-Vorschlag selbst anpassen»), Schritt 2 von 3

## Was ist neu
- Beim ersten Öffnen von «Was ziehe ich an?» legt die App einmal 9 Muster-Sets an: Alltagskleider, Oben und unten lang, Oben und unten kurz, Übergang, Regen, Kalt, Heiss, Abfahrt und Pass, Bikepacking-Abend. Jedes Set bekommt die eigenen Teile, die zu seiner Temperatur passen (`src/lib/wearpresets.js`, `src/lib/home/wearsets.js` seedPlan, Merker `wear.seeded`).
- Im Fenster: «Automatisch», das Set, das heute passt («passt heute»), das gewählte Set; der Rest hinter «Weitere Sets». Die Teile des Sets kommen zuerst, wo das Set nichts hat, wählt die App (Noah 1a).
- Tauschen merkt sich «nur heute» oder «im Set …», wählbar im Tausch-Kasten (Einstellung `wear.remember`, Noah 2). «Set mit diesem Vorschlag füllen» für ein leeres Set. Rückgängig im Fenster.
- Packen schlägt dieselben Sets vor (Noah 5a); eigene Kits gehen vor den Mustern (`chooseKit`).
- Deutsch: «Deine Kits» heisst jetzt «Deine Kleider-Sets».

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Bereiche (gefühlte Temperatur): Kalt bis 5 °C, Lang 5–12, Übergang 12–18, Kurz 18–28, Heiss ab 28. Regen ohne Bereich, passt bei Nässe unter 18 °C. Alltag, Abfahrt und Bikepacking-Abend nur von Hand.
- Muster-Sets heissen über `t()`, bis man sie umbenennt; Umbenennen und Löschen wie jeder Baustein. Ein gelöschtes Muster kommt nicht wieder.
- Eigene Kits vor Mustern, damit importierte Kits nicht verdrängt werden.
- Ruhig: nur 2–3 Set-Knöpfe sichtbar, der Rest hinter «Weitere Sets». Pro Zeile kurz «aus dem Set».

## Entscheide (für decisions.md)
- 27.10.2026: Kleider-Sets sind Bausteine mit °C-Bereich wie die Kits; dieselben Sets gelten auf Heute und beim Packen.

## Stand im Plan (roadmap.md / vorhaben.md)
- «Was ziehe ich an? selbst anpassen»: Schritt 1 online, Schritt 2 mit diesem PR; Schritt 3 «Deine eigene Regel» folgt. Offen: °C-Bereich eines Sets im Set selbst ändern.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Was ziehe ich an?» öffnen: Oben stehen «Automatisch» und das passende Set mit «passt heute».
2. «Weitere Sets» antippen: alle 9 Muster erscheinen.
3. Bei einer Zeile «Tauschen» › «Merken: im Set …» › ein Teil wählen: Die Zeile zeigt «aus dem Set». Rückgängig steht im Fenster.
4. Packen › eine Tour: Beim Kälte-Check kommt dasselbe Set als Vorschlag.
