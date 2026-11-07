# Sammlungen mit Charakter

PR (noch offen) · 07.11.2026 · Auftrag: Noah «1a 2a 3a 4b 5a» (Thread «Plane Entdecken und Sammeln»), Schritt 4 der Reihenfolge (Idee 2).

## Was ist neu
- Jede Sammlung in Neuland hat ein **Bild** (16 zur Auswahl: Berg, Fernglas, Wellen, Tropfen …) und einen **Farbton** (5, aus den Farben der App, auch im dunklen Modus). Die eingebauten Sammlungen haben ein Standard-Aussehen.
- Neuland › «Sammlungen wählen»: vor jedem Namen steht das Bild; das runde Bild vor dem Namen öffnet «Aussehen der Sammlung» (Bild, Farbton, «Zurück zum Standard»). Jeder Tipp speichert sofort.
- Das Bild steht auch neben dem Namen der offenen Sammlung auf der Seite.
- **Vorlagen** unter «Eigene Sammlung»: «Aussichtspunkte», «Schluchten», «Historische Wege», «Schotteranstiege». Ein Tipp legt eine eigene Sammlung mit diesem Namen und Aussehen an und öffnet sie. Name und Aussehen lassen sich danach wie bei jeder eigenen Sammlung ändern, die Sammlung löschen (mit Rückgängig).
- Neue Dateien: `src/lib/neuland/look.js`, `LookBadge.svelte`, `LookSheet.svelte`, Wort-Datei `neulandlook.js`.

## Was fällt weg oder rutscht tiefer
nichts. In «Sammlungen wählen» kommen pro Zeile ein Bild und ein Knopf dazu.

## Selbst entschieden
- Das Aussehen steht im Neuland-Zustand (`look: { <Sammlung>: { icon, tint } }`) und damit im Backup. Alte Backups ohne `look` bleiben gültig (leer = Standard). **Kein Schema-Wechsel** in Dexie; der Neuland-Eintrag in `settings` ist schon bisher ein freies Objekt. Ein Test prüft den Hin-und-zurück-Weg und den alten Zustand.
- Das Bild kommt aus einer festen Liste (Symbole der App), nicht aus eigenen Bildern: klein, offline, ohne Speicherplatz. Unbekannte Werte aus einem Backup werden ignoriert.
- Die Chips oben (`Seg`) bleiben unverändert (gemeinsamer Baustein, viele Seiten); das Bild steht in der Überschrift und in der Liste.
- Vorlagen sind Vorschläge: sie legen nur Name und Aussehen an. Orte kommen weiterhin von Hand oder aus eigenen Einträgen (Vorlage mit Orten aus Kartendaten wäre ein eigener Schritt).
- Wird eine eigene Sammlung gelöscht, geht ihr Aussehen mit.
- Teile der Fertig-Regel: keine eigene Seite (gehört zu Neuland), «Gut zu wissen» unverändert.

## Entscheide (für decisions.md)
nichts Neues.

## Stand im Plan
- Entdecken und Sammeln: Schritt 4 von 7 gebaut (Sammlungen mit Charakter). Als Nächstes «Challenges nach Gelegenheit».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Neuland › «Sammlungen wählen»: vor jedem Namen ein Bild.
2. Das runde Bild einer Sammlung: anderes Bild und anderen Farbton wählen; Liste und Überschrift zeigen es.
3. «Zurück zum Standard» setzt es zurück.
4. Vorlage «Aussichtspunkte» antippen: eine eigene Sammlung entsteht und öffnet sich.
