# Bikepacking-Helfer: Rast suchen, Lichter, Ankunfts-Bericht

Aufträge: Noah 26.11.2026 «1a 2a 3a 4a», 27.11.2026 «1a 2b 3 4a», Freigabe-Karte «Sollen die Lichter so in die App?» → «Freigeben», und «a» (kleine Pakete desselben Threads in einen PR). Thread «Bikepacking-Rennen: Stand und Ideen zeigen». Drei Teile in einem PR; jeder Teil unten mit seinen Abschnitten.

## Teil: Rast suchen

Auftrag: Noah 26.11.2026 «1a 2a 3a 4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»); Karte «Was ist der beste Pausen-Vorschlag, und was gilt ohne Netz?» → «Kürzester Umweg zuerst».

### Was ist neu
- Auf der Live-Karte (auf einer Strecke) gibt es die Karte «Rast» mit dem Knopf «Rast suchen». Ein Tipp nennt bis zu drei Orte zum Anhalten (Laden, Essen, Tankstelle, Wasser) in den nächsten 20 km der Strecke, der kürzeste Umweg zuerst, offene vor geschlossenen.
- Jeder Ort zeigt Name, Entfernung und den Umweg in km («direkt an der Strecke» ohne Umweg).
- Ist in den 20 km nichts, sagt die Karte das und nennt den nächsten Ort dahinter.
- Ohne Netz zählen nur Orte, die vorher geladen wurden («Stopps entlang der Strecke»); ist nichts geladen, sagt die Karte, dass man sie laden soll.

### Was fällt weg oder rutscht tiefer
nichts.

### Selbst entschieden
- Gesucht wird erst auf Tipp, nichts läuft im Hintergrund (Akku, Daten).
- Umweg = zweimal der Abstand zur Strecke; Reihenfolge: offen vor geschlossen, dann Umweg, dann Entfernung.
- Keine neue Funktion in `features.js` und kein neuer Absprung: es ist eine Karte auf der bestehenden Live-Karte, innerhalb der bestehenden Zeilen (Fertig-Regel Punkte 1–3 werden durch die Live-Karte erfüllt).
- Das Funkloch-Notausstieg-Stück ist weggelassen, wie Noah es entschieden hat.

### Entscheide
- 26.11.2026: `docs/decisions/bikepacking-helfer.md`

### Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte auf einer Strecke starten, zur Karte «Rast» scrollen.
2. «Rast suchen» tippen: bis zu drei Orte mit Umweg, oder der Grund, warum keine da sind.

## Teil: Lichter: mehrere Lichter, Modi und Laden als «% in Minuten»

Auftrag: Noah 26.11.2026 «3a» (eine Lampe), dann am 27.11.2026 00:21 (Wunsch: «für die lichter möchte ich, dass ich jedem licht die ladedauer (% in min) und die leuchtdauer (verschiedene modi, für jeden dauer prozent der ladung in min) … intelligent an sinnvollen stellen erscheinen»), Antworten «1a 2b 3 (ich tippe zb 20 % in 23 minuten) 4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»).

### Was ist neu
- Die Karte «Licht» der Live-Karte ist jetzt «Deine Lichter»: beliebig viele Lichter (bis 8), jedes mit Namen, mehreren Modi (bis 6) und eigener Ladung. Unter «Licht ändern» tippt Noah pro Modus «x % in y min» und fürs Laden «x % in y min» (zum Beispiel 7 % in 60 min und 20 % in 23 min). Die App rechnet daraus die Stunden Licht und die Ladezeit.
- Pro Licht: Wie viel ist noch drin (Voll, Halb, Fast leer), welcher Modus brennt, wie viele Stunden Licht bleiben, wie lange das Laden dauert (von leer und von jetzt an), ob es durch die Dunkelheit reicht und welcher Modus reichen würde.
- Hinzufügen, umbenennen und löschen: Ein Licht ist schnell neu gemacht, darum löscht der Papierkorb sofort und bietet «Rückgängig» für 8 Sekunden an.
- Das alte einzelne Licht (Stunden, Stufen, Ladezeit) wird beim ersten Öffnen als erstes Licht übernommen.
- An sinnvollen Stellen (Vorschläge 1–5, Noah «4a»):
  1. «Bereit für unterwegs?» (vor dem Start) sagt, wie lange jedes Licht zum Laden braucht.
  2. Modus-Rat in der Karte: «Mit «Eco» reicht es bis zum Ende der Dunkelheit.»
  3. In «Rast suchen»: «Falls du dort laden kannst: 30 Minuten geben «Helm» x % (y h Licht).» Ein volles Licht nimmt nichts mehr auf, darum erscheint die Zeile nur für Lichter, die nicht voll sind.
  4. Warnung in der Dämmerung: Bricht in der nächsten Stunde die Dunkelheit an (oder ist sie da) und ein Licht reicht nicht durch, sagt die Live-Karte es einmal, mit «Verstanden».
  5. Ankunfts-Bericht: pro Licht «etwa x % einer vollen Ladung» für die Zeit im Dunkeln.

### Was fällt weg oder rutscht tiefer
- Die Felder «Dein Licht brennt mit voller Ladung (Stunden)», «Stufe 1–3 (Stunden)» und «Laden von leer dauert (Stunden)» fallen weg. Ersatz: pro Modus und fürs Laden «% in Minuten»; die alten Werte werden übernommen (10 h = 100 % in 600 min).

### Selbst entschieden
- Die App lernt nichts aus Fahrten, Noah tippt die Zahlen (Entscheid «3a», jetzt als «% in Minuten»). Der Handy-Akku wird weiter aus dem Akkustand gerechnet.
- Vorschlag 1 (Laden-Schritt) steht in «Bereit für unterwegs?» auf der Live-Karte, nicht in der Packliste: Die Packliste gehört dem Packen-Thread. Die Karte klappt von selbst zu, sobald Karte und Sprache bereit sind; die Zeile steht dann beim Aufklappen. Ein Schritt im Packen kann folgen, wenn Noah das will.
- Der Modus-Rat nennt nur den hellsten Modus, der noch bis zum Ende der Dunkelheit reicht; reicht keiner, sagt die rote Zeile wie bisher, man solle laden oder ein Ersatzlicht mitnehmen.
- Kein neuer Block über dem Inhalt (Content first): Die Karte war schon da, nur ihr Inhalt wächst; die Warnung ist eine Zeile im Meldungsstreifen.
- Die Lichter bleiben in diesem Browser (wie die alte Lampe), nicht in der Datenbank. Ein Eintrag in der Sicherung folgt, wenn Noah das will.
- Keine neue Funktion in `features.js`, kein neuer Absprung: Es ist die bestehende Live-Karte.

### Entscheide
- 27.11.2026: `docs/decisions/bikepacking-helfer.md`

### Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte öffnen, «Licht ändern»: Modus mit «25 % in 60 min», Laden mit «20 % in 23 min» eintragen. Die Karte sagt etwa 4 h Licht und 1:55 h Laden von leer.
2. «Licht hinzufügen», Namen tippen, Papierkorb tippen: Licht weg, «Rückgängig» bringt es zurück.
3. Vor dem Start: «Bereit für unterwegs?» aufklappen, die Zeile «Lade deine Lichter am Vorabend» zeigt die Ladezeiten.

## Teil: Ankunfts-Bericht

Auftrag: Noah 26.11.2026 «4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»).

### Was ist neu
- Am Ende der Strecke zeigt die Live-Karte von selbst den Ankunfts-Bericht: Zeit unterwegs, gefahren und gestanden; die Stopps (Zahl und längster); Pause gegen Plan, wenn ein Plan lief; Handy-Akku von … auf …; die Zeit im Dunkeln und pro Licht der Anteil einer vollen Ladung.
- «Später» klappt den Bericht zu; «Ankunfts-Bericht ansehen» bringt ihn zurück.
- Der Bericht erscheint nur, wenn mindestens die Hälfte der Strecke gefahren wurde und man am Ziel ist.

### Was fällt weg oder rutscht tiefer
nichts.

### Selbst entschieden
- Der Bericht liegt als Zeile im bestehenden Meldungsstreifen der Live-Karte, kein neuer Block auf der Seite.
- Er rechnet nur aus den Fahrdaten auf dem Gerät; nichts wird gesendet.
- Pro Licht steht, wie viel einer vollen Ladung es in der Zeit im Dunkeln gebraucht hat (aus dem Modus, der brannte).
- Das Fahrende bleibt Sache des Knopfes «Fahrt beenden»; der Bericht beendet nichts.

### Entscheide
- 26.11.2026: `docs/decisions/bikepacking-helfer.md`

### Prüfschritte (nach dem Merge auf der echten Seite)
1. Eine Strecke mit der Live-Karte bis zum Ziel fahren.
2. Am Ziel erscheint der Bericht; «Später» klappt ihn zu, «Ankunfts-Bericht ansehen» zeigt ihn wieder.

