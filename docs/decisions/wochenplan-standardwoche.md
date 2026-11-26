# Standardwoche im Wochenplan

26.11.2026 · Auftrag: Noah (Thread «Wochenplan-Vorschläge verlässlich machen»), Antworten «1a, Wunsch- und Fix-Plätze pro Sportart mit Zeiten, 3a, Sollwerte werden mitberücksichtigt, 5b» und «nichts doppeltes»

- Noahs Vision: eine Beispiel- oder Standardwoche, in der jede Sportart fixe und variable Plätze mit Zeiten hat; was in der Vorwoche verschoben wurde, wird nächste Woche wieder vorgeschlagen; Navigation und Aussehen sehr einfach, wenige Klicks.
- **Keine zweite Seite und kein zweiter Planer** (Noah 26.11.2026 «ziel ist nichts doppeltes»): Die Standardwoche ist eine Ansicht des Wochenplans, im Reiter «Standardwoche» neben «Woche». Sie liest und schreibt dieselben Ziele (`training.weekplan`); «Woche vorschlagen» in Training › Woche führt weiter in den Wochenplan.
- **1a:** eigene Ansicht, am Handy eine Tageliste, am Computer ein Raster Tage × Morgen/Tag/Abend.
- **Wunsch- und Fix-Plätze pro Sportart (Noah):** jeder Platz hat Tag und Zeit und ist «Fix» (die Einheit steht dort) oder «Wunsch» (die Einheit geht dorthin, wenn der Platz frei ist; sonst nimmt der Plan den besten anderen und sagt es in einer Notiz). Wünsche haben eine Reihenfolge; mehrere Wünsche sind Alternativen, nicht zusätzliche Einheiten. Ein Wunsch sorgt dafür, dass mindestens eine freie Einheit da ist; ein Fix-Platz über der Anzahl hebt die Anzahl.
- **3a:** Was in einer Woche von Hand verschoben wurde, wird in den folgenden Wochen automatisch wieder vorgeschlagen (bis 6 Wochen, solange niemand es wieder verschiebt), grün markiert «wie letzte Woche»; «Zurück zur Standardwoche» nimmt es für diese und die folgenden Wochen weg (Rückgängig bringt es zurück).
- **Sollwerte:** Stunden und Anzahl pro Art stehen über der Standardwoche und sagen, ob die Woche sie hält (Bereich wie «2–3 Gym» ist nicht gebaut: Noah wählte nur «Sollwerte werden mitberücksichtigt»; die Anzahl bleibt eine feste Zahl).
- **5b:** alles in einem Paket.
- Die ältere «Woche vorschlagen»-Logik ohne gespeicherten Wochenplan (`SuggestWeek.svelte`) bleibt in diesem Paket stehen, weil sie Tageslimits und Gewohnheiten hält, die sonst nirgends zu ändern sind; für jeden mit gespeichertem Wochenplan ist sie nie sichtbar. Entfernen ist ein eigener Schritt, wenn Noah es will.
- Notiz pro Platz («zu zweit») ist nicht gebaut; Namen von Personen gehören nicht in die App-Texte.
