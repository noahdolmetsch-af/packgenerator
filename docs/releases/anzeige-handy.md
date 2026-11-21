# Sechs Anzeige-Fehler behoben

Auftrag: Noah (Koordinator, 08.11.2026), UX-Test «Impeccable» vom 08.11.2026: kleine Anzeigefehler beheben. Zweiter kleiner PR nach «Richtiges Deutsch» (#1182).

## Was ist neu
- Einkauf, leer: Karte «Noch keine Wünsche» mit «Wunsch hinzufügen» statt «Noch kein Material» und «Keine Teile auf der Wunschliste gefunden» (3-01, `src/pages/Gear.svelte`). Ist schon etwas im Bestand, aber nichts auf der Wunschliste, steht dort «Noch nichts auf der Wunschliste.»; «… gefunden» steht nur noch bei Suche oder Filter.
- Einkauf: Die Zeile heisst «Sortiert: Wichtigstes zuerst» statt «Sortiert: Meist dabei» (3-06), weil die Wunschliste nach «was gefehlt hat» geordnet ist.
- Heute, Gewichts-Kachel: «Nicht mehr fragen» bricht am schmalen Handy in die nächste Zeile, statt hinter einem unsichtbaren Seitwärts-Scrollen zu verschwinden (D1, `WeighTile.svelte`).
- Wegweiser (Touren › Berg): vor den Zeilen standen «yellow», «mountain», «alpine» (D-1, `Scales.svelte`: das Attribut hiess `data-sign`, das die Farbe-nie-allein-Regel als Text vorschreibt; jetzt `data-flag`).
- Mein Kompass: Platzhalter «Neu in «Nicht vergessen»» passt ins Feld (D3).
- Meine Sportarten: «+ Sportart der Touren» bricht nicht mehr dreizeilig um (D-4).

## Was fällt weg oder rutscht tiefer
- Das Sortier-Wort «Meist dabei» auf der Wunschliste entfällt (es stimmte nicht).

## Selbst entschieden
- Die Sortierwahl im Fenster «Sortieren und filtern» bleibt auf der Wunschliste, wie sie ist; sie zu verstecken ist ein eigener Schritt.
- Die beschnittene Beschriftung der unteren Leiste bei 320 px (D-5) bleibt aus: die Leiste steht auf jeder Seite und braucht den vollen Lauf.
- Nur Anzeige und Texte; nichts an `api/`, Backup oder Speicherstruktur.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Material › Einkauf mit leerer Wunschliste: die Karte spricht von Wünschen.
2. Touren › Berg › Wegweiser: kein englisches Wort vor den Zeilen.
3. Heute am schmalen Handy mit der Gewichts-Kachel: beide Links («Verlauf …», «Nicht mehr fragen») sichtbar.
