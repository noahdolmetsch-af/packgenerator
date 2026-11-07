# Einheiten-Bibliothek

PR folgt · 07.11.2026 · Auftrag: Noah «7 Einheiten-Bibliothek» (Thread «Verbessern Training: intelligentere Wochenpläne»)

## Was ist neu
- **Beispiele:** Die Bibliothek startet mit 6 Vorlagen (Lockere Fahrt, Intervalle, Langer Tag, Lauf, Wanderung, Kraft). Alle änderbar und löschbar; «Beispiele wieder hinzufügen» holt fehlende zurück.
- **Eigene Gruppen** (Noah «1-5 a»): «Neue Gruppe …» am Eintrag, Gruppe umbenennen und löschen (Fenster «Wohin?», «Ohne Gruppe» vorgewählt, Rückgängig), Eintrag verschieben.
- **Sortieren:** Pfeile und Ziehen in «Bibliothek verwalten».
- **Häufig zuerst:** Jedes Einsetzen zählt; die meist genutzten stehen in ihrer Gruppe oben, mit «5×».
- **Aus dem Rückblick behalten:** «Einheit behalten» steht auch im Formular einer bestehenden Einheit (auch erledigte, frühere Wochen), ohne Abtippen.
- Grundlage (erste Fassung):
- Im Formular einer neuen Einheit: «Einheit behalten» speichert Name, Art, Minuten, Zone (und Sportart) in der Bibliothek (Einstellung `training.library`, höchstens 30, wandert mit dem Backup).
- Darüber stehen die behaltenen Einheiten unter «Aus deiner Bibliothek»: ein Tipp füllt das Formular.
- «Bibliothek verwalten»: umbenennen und entfernen, entfernen mit Rückgängig.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- Höchstens 40 Einträge; eine Gruppe besteht nur, solange eine Einheit darin ist (kein leerer Gruppen-Zustand).
- «Aus dem Rückblick»: kein eigener Knopf in der Wochenanalyse, sondern das Behalten im Formular jeder Einheit (auch erledigter und früherer Wochen).
- Der Name kommt aus dem Namensfeld, sonst aus der Sportart oder der Art.
- Kein eigener Eintrag in features.js: die Bibliothek gehört zum Formular auf der Seite Training.

## Entscheide (für decisions.md)
- 07.11.2026: «Ganze Wochen merken» wird ein eigener PR (11).
- 07.11.2026: Die Bibliothek ist eine eigene Liste von Vorlagen, getrennt vom Plan; ein Tipp füllt nur das Formular, gespeichert wird weiter mit «Speichern».

## Stand im Plan (roadmap.md / vorhaben.md)
- Training verbessern: Punkt 7 (Einheiten-Bibliothek).

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Aktiv › Training, + bei einem Tag, Name, Minuten, Zone ausfüllen, «Einheit behalten».
2. + bei einem anderen Tag: die Einheit steht unter «Aus deiner Bibliothek», ein Tipp füllt das Formular.
3. «Bibliothek verwalten»: umbenennen, entfernen, «Rückgängig».
