# Weg zum Ziel: Weg als Vorlage speichern

Auftrag: Noah «5c» (Entwurf G7, rechte Karte), Thread «Entwerfen Weg zum grossen Ziel»

## Was ist neu
- Nach dem Starttag steht unter dem Rückblick die Karte «Als Vorlage speichern»: Name eintippen (sonst der Name des Weges), «Vorlage speichern».
- «Neuer Weg» zeigt gespeicherte Vorlagen unter «Meine Wege». Wählt man eine, erscheinen ihre Schritte zum Abhaken statt der Vorschläge der App; «Vorschläge der App» geht zurück.
- Jede Vorlage lässt sich umbenennen und löschen (mit Rückgängig).

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Gespeichert werden die Schritte mit ihrem Abstand zum Start (`templateOf`); Haken und eigene Tage nicht. Ist ein Schritt beim Rückblick mit «Ja, früher» beantwortet (PR «Vorschlag fürs nächste Mal»), setzt `templateOf` ihn dann 14 Tage früher; diese Kopplung kommt mit dem Merge dieses PRs (eine Zeile in `templateOf`).
- Daten: ein zusätzliches Feld `templates` im Eintrag `weg` (keine neue Tabelle, keine neue Dexie-Version; ältere Einträge laufen unverändert, im Backup wie der Rest).
- Die Karte erscheint erst nach dem Starttag (wie der Rückblick); vorher gibt es nichts, woraus man lernt.
- Namen der Vorlage und ihrer Schritte gehen nie durch `t()`.
- «Gut zu wissen» entfällt (Seite ohne Karte «Was du hier tun kannst»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- Idee G: Rückblick 5a, Vorschlag 5e und Vorlage 5c gebaut. Offen: Heute-Zeile.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Weg zum Ziel, Weg mit vergangenem Starttag: Karte «Als Vorlage speichern», Namen eintippen, «Vorlage speichern».
2. «Neuer Weg» tippen: unter «Meine Wege» steht die Vorlage; wählen zeigt ihre Schritte.
