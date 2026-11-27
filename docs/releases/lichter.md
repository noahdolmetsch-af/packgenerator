# Lichter: mehrere Lichter, Modi und Laden als «% in Minuten»

Auftrag: Noah 26.11.2026 «3a» (eine Lampe), dann am 27.11.2026 00:21 (Wunsch: «für die lichter möchte ich, dass ich jedem licht die ladedauer (% in min) und die leuchtdauer (verschiedene modi, für jeden dauer prozent der ladung in min) … intelligent an sinnvollen stellen erscheinen»), Antworten «1a 2b 3 (ich tippe zb 20 % in 23 minuten) 4a» (Thread «Bikepacking-Rennen: Stand und Ideen zeigen»).

## Was ist neu
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

## Was fällt weg oder rutscht tiefer
- Die Felder «Dein Licht brennt mit voller Ladung (Stunden)», «Stufe 1–3 (Stunden)» und «Laden von leer dauert (Stunden)» fallen weg. Ersatz: pro Modus und fürs Laden «% in Minuten»; die alten Werte werden übernommen (10 h = 100 % in 600 min).

## Selbst entschieden
- Die App lernt nichts aus Fahrten, Noah tippt die Zahlen (Entscheid «3a», jetzt als «% in Minuten»). Der Handy-Akku wird weiter aus dem Akkustand gerechnet.
- Vorschlag 1 (Laden-Schritt) steht in «Bereit für unterwegs?» auf der Live-Karte, nicht in der Packliste: Die Packliste gehört dem Packen-Thread. Die Karte klappt von selbst zu, sobald Karte und Sprache bereit sind; die Zeile steht dann beim Aufklappen. Ein Schritt im Packen kann folgen, wenn Noah das will.
- Der Modus-Rat nennt nur den hellsten Modus, der noch bis zum Ende der Dunkelheit reicht; reicht keiner, sagt die rote Zeile wie bisher, man solle laden oder ein Ersatzlicht mitnehmen.
- Kein neuer Block über dem Inhalt (Content first): Die Karte war schon da, nur ihr Inhalt wächst; die Warnung ist eine Zeile im Meldungsstreifen.
- Die Lichter bleiben in diesem Browser (wie die alte Lampe), nicht in der Datenbank. Ein Eintrag in der Sicherung folgt, wenn Noah das will.
- Keine neue Funktion in `features.js`, kein neuer Absprung: Es ist die bestehende Live-Karte.

## Entscheide
- 27.11.2026: `docs/decisions/lichter.md`

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Live-Karte öffnen, «Licht ändern»: Modus mit «25 % in 60 min», Laden mit «20 % in 23 min» eintragen. Die Karte sagt etwa 4 h Licht und 1:55 h Laden von leer.
2. «Licht hinzufügen», Namen tippen, Papierkorb tippen: Licht weg, «Rückgängig» bringt es zurück.
3. Vor dem Start: «Bereit für unterwegs?» aufklappen, die Zeile «Lade deine Lichter am Vorabend» zeigt die Ladezeiten.
