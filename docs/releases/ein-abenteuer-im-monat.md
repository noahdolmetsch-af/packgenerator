# Ein Abenteuer im Monat

PR (diese Änderung) · 07.11.2026 · Auftrag: Noah «ok N12» (Thread «Träume N12, N18, N10 bauen»), Idee N12 von «Träume und Neuland»

## Was ist neu
- Touren › Träume, unter der Traum-Liste: «Ein Abenteuer im Monat» (`src/lib/dreams/MonthAdventureCard.svelte`). Die Karte nennt das Abenteuer dieses Monats; die Arten wechseln sich Monat für Monat ab: Feierabend-Biwak (N6, nur April bis Oktober), Zug hin, Velo heim (N7) und Runde durch Neuland (N2), dazu eigene Ideen (`src/lib/dreams/monatsabenteuer.js`).
- «Zeig mir» scrollt zur Karte der Art (Biwak, Zug hin, weisse Flecken). «Diesen Monat nicht» schliesst den Monat, «Wieder zeigen» holt ihn zurück.
- Unter «Arten»: eingebaute ausblenden und wieder zeigen, eigene Abenteuer hinzufügen, umbenennen und löschen (mit Rückgängig), und die Zeile auf Heute ausschalten.
- Heute: eine ruhige Zeile «Abenteuer im Monat: …» (`src/lib/dreams/MonthAdventureRow.svelte`), ohne Kachel. Sie steht, sobald ein Wohnort gesetzt ist (oder wenn das Abenteuer eine eigene Idee ist), den ganzen Monat, ein Tipp öffnet Träume, «Diesen Monat nicht» schliesst sie bis zum nächsten Monat.
- Einstellung `dreams.monthAdventure` (im Backup). Neue Funktion im Katalog: `f.monthadv`.

## Was fällt weg oder rutscht tiefer
- Träume: «Passt jetzt: Ideen pro Monat» und alle Karten darunter rücken um die neue Karte nach unten.
- Heute: eine Zeile mehr unter «Neu seit gestern», nur mit Wohnort und nur bis «Diesen Monat nicht».

## Selbst entschieden
- Die Arten kommen reihum nach der Monatszahl (kein Zufall), damit die Zeile über den Monat gleich bleibt und der nächste Monat sicher etwas anderes bringt.
- Ohne Wohnort bleibt Heute ruhig: die eingebauten Arten starten alle von zu Hause. Die Karte auf Träume zeigt das Abenteuer trotzdem.
- «Zeig mir» springt zur Karte, plant aber nichts von selbst: Planen bleibt eine Handlung auf der Karte der Art.
- Datenspeicher: nur eine neue Einstellung, kein Dexie-Schema-Wechsel, Backup-Format gleich.

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: N12 «Ein Abenteuer im Monat» gebaut. Offen: N18 «Neue Sammlungen aus OpenStreetMap», N10 «Eine Fundliste».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Einstellungen: Wohnort gesetzt? Dann steht auf Heute unter den Hinweisen «Abenteuer im Monat: …».
2. Ein Tipp auf die Zeile öffnet Touren › Träume; bei «Ein Abenteuer im Monat» auf «Zeig mir» tippen.
3. «Diesen Monat nicht» tippen: die Zeile auf Heute ist weg. Auf Träume «Wieder zeigen» bringt sie zurück.
