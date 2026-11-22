# Auftrag kopieren (Logbuch, Schritt 4 von 4)

21.11.2026 · Auftrag: Noah «freigabe» (Entwurf: https://claude.ai/artifact/V1T1DcxH66ej3EJrvRFHSt; Thread «Neue Verbesserungen finden», Umsetzungsauftrag L4)

## Was ist neu
- Im Verbesserungs-Logbuch steht ein Abschnitt «Auftrag für den Chat» mit dem Knopf **«Auftrag kopieren»**: die offenen Einträge als ein Text in der Zwischenablage, nach Seite sortiert (mit Adresse), die Seite mit «Stört jetzt» zuerst, innerhalb einer Seite «Stört jetzt» zuerst, dann der älteste. «Gut so» steht getrennt am Ende als reine Notiz. Erledigte Einträge fehlen.
- Pro Eintrag steht, ob es eine kleine Änderung ist oder zuerst ein Bild kommt (Regel «3a»), und bei Einträgen mit Foto die Bildnummer.
- **«Bilder speichern»** (erscheint, sobald Einträge ein Foto haben): speichert die Fotos mit den gleichen Nummern, auf dem Handy über das Teilen-Fenster, am Computer als Dateien. Du hängst sie im Chat an. Die Fotos selbst kommen mit Schritt 3.
- Reine Textfunktionen in `src/lib/logbuch/auftrag.js`, Browserteil in `export.js`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Der Text ist deutsch (wie die App) und beginnt mit einer Zeile, was «kleine Änderung» und «zuerst Bild» heisst, damit der Koordinator die Regel sofort sieht.
- Seiten ohne Adresse stehen unter «Ohne Seite».
- Nichts wird gesendet; der Eintragsstand ändert sich beim Kopieren nicht (ein «Erledigt» setzt du selbst).
- «Bilder speichern» zeigt sich nur, wenn es Fotos gibt; bis Schritt 3 ist es deshalb noch nicht zu sehen.

## Entscheide
- siehe `docs/decisions/auftrag.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Verbesserungs-Logbuch: Schritt 4 von 4 gebaut (Ziel 1 «Eine App, die mich im Alltag unterstützt»).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Verbesserungs-Logbuch mit ein paar Einträgen: «Auftrag kopieren» tippen, die Meldung «Auftrag kopiert» erscheint.
2. Den Text irgendwo einfügen: Seiten mit Adresse, «Stört jetzt» zuerst, «Gut so» am Ende.
