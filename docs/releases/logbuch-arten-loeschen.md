# Verbesserungs-Logbuch L5, Schritt 2: Arten und Gruppen löschen

22.11.2026 · Auftrag: Noah «L5 bauen» (Spez `05-logbuch-arten`, Antworten «1a 2a 3a 4a 5a»)

## Was ist neu
- Im Fenster «Arten und Gruppen» hat jede Art und jede Gruppe im Menü «⋯» den Punkt **«Löschen»**. Das Fenster `GroupDeleteSheet` fragt zuerst, wohin die Dinge gehen:
  - **Art:** die Einträge gehen in eine andere Art oder bleiben **«Ohne Art»** (vorgewählt). Kein Eintrag wird gelöscht.
  - **Gruppe:** ihre Arten gehen in eine andere Gruppe oder in die Gruppe **«Ohne Gruppe»** (vorgewählt, wird bei Bedarf unten angelegt). Keine Art und kein Eintrag geht verloren; eine leere Gruppe lässt sich einfach löschen.
- Danach steht im Fenster **«Rückgängig»**: die Art (oder Gruppe) und die umgehängten Einträge kommen zurück, Fotos bleiben unberührt.
- Ein Eintrag «Ohne Art» zeigt «Ohne Art» in der Liste, ist unter «Alle» zu finden und lässt sich weiter ändern (Art wählen oder lassen). Ein neuer Eintrag braucht weiter eine Art.
- Die Fehler, die sich die App selbst merkt, landen ohne Art, wenn die Art «Fehler» gelöscht ist; derselbe Fehler zählt weiter hoch.
- Der Wächter `tests/groups.test.js` kennt die neue Stelle (`GROUP_PLACES`).

## Was fällt weg oder rutscht tiefer
- nichts. Alles, was es gab, bleibt als Standard; «Zurück zum Standard» holt die Arten und Gruppen zurück. Eintrags-Zuordnungen holt «Rückgängig» direkt nach dem Löschen zurück (nicht «Zurück zum Standard»).

## Selbst entschieden
- «Ohne Gruppe» ist eine gewöhnliche Gruppe mit dem festen Schlüssel `ohne`; sie lässt sich umbenennen, ordnen und löschen, sobald sie leer ist (sie kann ihre Arten nicht an sich selbst geben).
- Eine Art lässt sich noch nicht in eine andere Gruppe verschieben; das kommt nicht in diesem PR.
- Das Löschen einer Art schreibt die betroffenen Einträge und die Einstellung in einem Zug (eine Transaktion); «Rückgängig» schreibt nur die geänderten Felder (Art, Weg, Stand, Dringlichkeit) zurück.
- Auto-Fehler: Dubletten werden nur unter «Fehler» und «Ohne Art» gezählt. Wurden die alten Fehler-Einträge in eine andere Art verschoben, zählt derselbe Fehler dort nicht hoch, sondern bekommt einen neuen Eintrag.
- `GroupDeleteSheet.svelte`: bei vielen Zielen (zwölf Arten) werden die Zeilen nicht mehr zusammengedrückt, die Liste scrollt (`flex: none`). Das gilt für alle Stellen, die das Fenster nutzen.
- Backup-Prüfung: Backup mit gelöschter Art und Einträgen ohne Art ausgeben und einspielen, «Sicherung prüfen» grün, ein altes Backup ohne die Einstellung gibt die erste Fassung (`tests/logbuch-kinds.test.js`).

## Entscheide
- Siehe `docs/decisions/logbuch-arten-ordnen.md`: 2a (löschen wie alles andere) und 3a (fragen, wohin; «Ohne Art» vorgewählt; Rückgängig).

## Stand im Plan (roadmap.md / vorhaben.md)
- L5 in drei PRs: 1 Speicher und Fenster (online), 2 Löschen mit Frage und Rückgängig (dieser), 3 neue Arten und Gruppen.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbesserungs-Logbuch › «Arten und Gruppen ändern» › bei einer Art «⋯» › «Löschen».
2. Das Fenster fragt, wohin die Einträge gehen; «Ohne Art» ist gewählt. Löschen: die Art ist weg.
3. «Rückgängig» im Fenster tippen: die Art ist zurück.
