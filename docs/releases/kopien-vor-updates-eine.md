# Vor Updates bleibt nur die letzte Kopie

PR · 24.11.2026 · Auftrag: Noahs Entscheid «Nur 1 Kopie vor Updates» (`docs/decisions/kopien-vor-updates-eine.md`) · Gruppe: Klarheit (der Satz unter «Vor Updates» sagt genau, was bleibt)

## Was ist neu
- Die App behält vor einem Update nur noch die letzte Kopie (`KEEP.update` 3 → 1 in `src/lib/maintenance/snapshots.js`). Mit Noahs Daten spart das etwa 110 MB von 166 MB.
- Auch alte Kopien gehen weg: beim nächsten Start räumt `pruneNow` (nur über die Indizes, ohne eine Kopie zu lesen) alles über der Grenze weg, nicht erst beim nächsten Update. Die Notizen dazu gehen mit.
- Der Satz unter «Vor Updates» (Ich › Daten › Mehr) sagt es: «Eine Kopie deiner Daten vor dem letzten Update und vor jedem der letzten 3 Importe, nur auf diesem Gerät.»

## Was fällt weg oder rutscht tiefer
- Die zwei älteren Kopien vor Updates fallen weg (die Kopie vor dem vorletzten und drittletzten Update). Man kann nur noch den letzten Update zurückgehen. Noah hat das am 24.11.2026 20:42 mit dem Knopf «Nur 1 Kopie vor Updates» gewählt.
- Nichts sonst: Kopien vor Import (bis 3), vor Zurückgehen, vor dem ersten Abgleich und vor «Neu beginnen» bleiben, wie sie waren. Deine Daten, das Backup-Format und die Hauptdatenbank bleiben unberührt.

## Selbst entschieden
- Die Kopien vor einem Import bleiben bei 3: Noah hat nur «vor Updates» gewählt. Sie zeigt die Speicherkarte weiter in der Summe «Vor Updates».
- Aufräumen schon beim Start statt erst beim nächsten Update, damit Noah den Platz sofort zurückbekommt.
- Backup: Noahs letztes Backup ist von heute (24.11., 15:26); es werden nur Sicherheitskopien weggeräumt, keine Daten.

## Stand im Plan
- Speicher senken: Handy 177 MB; mit diesem PR bleiben etwa 70 MB für die Kopien statt 166 MB.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Daten › Mehr öffnen: unter «Vor Updates» steht der neue Satz; es steht eine Kopie vor dem letzten Update in der Liste.
2. «Speicher messen»: Zeile «Vor Updates» zeigt 1 Kopie (und eventuell Import-Kopien) und eine kleinere Grösse.
