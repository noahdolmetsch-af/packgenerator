# Verbesserungs-Logbuch L5, Schritt 3: eigene Arten und Gruppen

22.11.2026 · Auftrag: Noah «L5 bauen» (Spez `05-logbuch-arten`, Antworten «1a 2a 3a 4a 5a»)

## Was ist neu
- Im Fenster «Arten und Gruppen»: **«Art in …»** unter jeder Gruppe legt eine neue Art an, **«Neue Gruppe»** unten eine neue Gruppe. Beim Anlegen einer Art wählst du den **Weg** (kleine Änderung, zuerst ein Bild, nur eine Notiz); vorgewählt ist «Zuerst ein Bild» (Noah «4a»).
- **«⋯» › «Weg ändern»** ändert den Weg später. Die Einträge dieser Art folgen (Weg, Stand «Notiert», Dringlichkeit), damit «Auftrag kopieren» sie richtig einordnet. «Rückgängig» holt es zurück.
- Eigene Arten stehen im Fenster «Verbessern», im Filter, in der Liste und im Auftrag.
- **«Zurück zum Standard»** holt die ersten 13 Arten und 4 Gruppen zurück. Einträge eigener Arten bleiben, ohne Art; «Rückgängig» holt Arten, Gruppen und Einträge zurück.
- Eine neue Art oder Gruppe hat einen festen Schlüssel (`k-…`, `g-…`) und einen frei wählbaren Namen; der Name läuft nicht durch `t()`.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Eine neue Art oder Gruppe braucht einen Namen; doppelte Namen sind erlaubt (jede bekommt ihren eigenen Schlüssel).
- Der Weg einer eingebauten Art ist ebenfalls änderbar (nicht nur der eigenen).
- Eine Art lässt sich noch nicht in eine andere Gruppe verschieben (nur über Löschen der Gruppe).
- Backup: eine eigene Art mit Eintrag, ausgegeben und eingespielt, «Sicherung prüfen» grün (`tests/logbuch-kinds.test.js`).

## Entscheide
- Siehe `docs/decisions/logbuch-arten-ordnen.md` (4a: Weg beim Anlegen wählen, Standard «Zuerst Bild», änderbar).

## Stand im Plan (roadmap.md / vorhaben.md)
- L5 in drei PRs: 1 Speicher und Fenster, 2 Löschen mit Frage und Rückgängig, 3 neue Arten und Gruppen (dieser). Damit ist L5 fertig.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbesserungs-Logbuch › «Arten und Gruppen ändern» › «Art in …» bei einer Gruppe.
2. Namen tippen, Weg wählen, speichern: die Art steht in der Liste und im Fenster «Neuer Eintrag».
3. «⋯» › «Weg ändern» › «Nur eine Notiz»: die Einträge dieser Art sind Notizen.
