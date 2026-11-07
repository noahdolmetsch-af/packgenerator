# Jetzt dran: Zeilen weglegen oder ausschalten

PR (Jetzt dran, Frage 4) · 5.11.2026 · Auftrag: Noah «4a» (Thread «Überdenke die Kachel «Jetzt dran»»)

## Was ist neu
- Jede ruhige Zeile (unter «Gut zu wissen») hat den Knopf «Später»: Sie ist eine Woche weg, kommt von selbst wieder, und eine Meldung bietet «Rückgängig» an.
- Neues Fenster «Zeilen wählen» (Knopf unter «Jetzt dran» und unter «Heute anpassen»): ein Schalter pro Zeilenart (Fahr-Idee, Verschleiss-Ausblick, Offene Aufgaben, ungenutzte Teile, Lernpunkt, leichtere Ausrüstung, Vorlagen-Vorschläge, Ziel-Schritt, Notizen zum Einordnen, Backup-Ordner, Testtouren aufräumen).
- Im Fenster steht, was gerade weggelegt ist, mit «Wieder zeigen».
- Neue Einstellung `homeRows` (Dexie-Tabelle `settings`, kein neues Schema); Backup und Sync nehmen sie wie jede andere mit.

## Was fällt weg oder rutscht tiefer
- Nichts fällt ohne dein Zutun weg. Zeilen, die du ausschaltest oder weglegst, fehlen auf Heute, bis du sie wieder einschaltest (oder die Woche um ist).

## Selbst entschieden
- Nicht ausschaltbar: Backup fällig, fällige Pflege, Rückblick, «Bist du gefahren?», Laden, Tour-Vorbereitung (sie schützen Daten und Touren). Das steht im Fenster.
- «Später» gilt 7 Tage (Kalendertage, Europe/Zurich), wie bei den Velo-Blättern.
- Gemerkt wird pro Zeile (Schlüssel) mit Textkopie, damit das Fenster auch nach Änderung der Zeile verständlich bleibt.

## Entscheide (für decisions.md)
- 5.11.2026: «Später» bei ruhigen Zeilen plus Schalter pro Zeilenart (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Jetzt dran: Fragen 1–4 umgesetzt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Heute › «Gut zu wissen · N» öffnen: bei einer ruhigen Zeile «Später» antippen; die Zeile verschwindet, «Rückgängig» holt sie zurück.
2. «Zeilen wählen» öffnen, «Verschleiss-Ausblick» ausschalten: die Zeile fehlt auf Heute.
3. Im Fenster «Wieder zeigen» oder den Schalter wieder einschalten: die Zeile ist zurück.
