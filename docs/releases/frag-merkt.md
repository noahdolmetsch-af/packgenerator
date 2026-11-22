# Frag die App merkt sich Fragen

Auftrag: Noah «1a 2b 3a 4a 5a» (21.11.2026), Vorschlag S6 «Lückenliste», Antwort 5a: ja, nur auf dem Gerät. Erster Schritt: die Liste. Die zwei neuen Fragearten (Nächte draussen, letzter Werkstattbesuch) folgen in einem eigenen PR.

## Was ist neu
- Fragt man im Assistenten («Frag die App») etwas, das die App nicht beantworten kann, merkt sie sich die Frage. Unter dem Ergebnis steht eine **zugeklappte** Liste «Eine Frage ohne Antwort» / «N Fragen ohne Antwort».
- In der Liste: die Frage antippen stellt sie nochmals; «Entfernen» nimmt sie weg, mit Rückgängig. Wird dieselbe Frage nochmals gestellt, steht sie nur einmal da und zählt «2-mal gefragt».
- Kann die App eine Frage später beantworten (nach einem Update), verschwindet sie von selbst aus der Liste.
- Höchstens 20 Fragen, die älteste geht zuerst.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- **Nur auf dem Gerät:** die Liste liegt in `localStorage` (Schlüssel `pg.openq`), nicht in der Datenbank. Sie kommt darum nie in ein Backup und nie in den Sync; es gibt keine Datenänderung und keinen Schema-Wechsel (kein Backup-Format-Wechsel, keine Einzelfreigabe nötig).
- **Ort:** der Auftrag nannte «Ich › Hilfe». Es gibt dort keine passende Seite; die Fragen werden im Assistenten gestellt, also steht die Liste dort, zugeklappt unter dem Ergebnis (Inhalt zuerst: nichts steht über dem Inhalt).
- Gemerkt wird nur nach einer ausdrücklichen Frage im Assistenten («Fragen» oder ein Beispiel), nicht bei jedem Buchstaben der Suche oben.
- Kein neuer Eintrag in `features.js`: es ist eine Verfeinerung von «Frag die App»; dessen Zeile in `docs/app-stand.md` bekommt einen Satz.
- Es wird nichts an einen Dienst geschickt.

## Entscheide (für decisions.md)
- 21.11.2026: S6 «Frag die App merkt sich Fragen ohne Antwort», nur auf dem Gerät (Noah, «5a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Klügere App: S3, S5, S1 gemacht; S6 Schritt 1 (die Liste) gebaut, Schritt 2 (zwei neue Fragearten) folgt; danach S4 nach K3.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Assistent öffnen, etwas fragen, das die App nicht wissen kann («Wann ist Vollmond auf dem Mars?»): unter dem Ergebnis erscheint «Eine Frage ohne Antwort».
2. Liste öffnen, «Entfernen» tippen, dann «Rückgängig».
