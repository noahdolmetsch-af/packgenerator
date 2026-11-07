# Nebelmeer-Tage: das Regal auf der Sammel-Wand (Schritt D)

Auftrag: Noah «1-5a» (Thread «Entwickeln: Über die Nebelgrenze motivieren», Antwort 4a: «Foto-Vorschlag und Zähler, ohne Ziel und ohne Serie, eigenes Regal»). Baut auf der Karte «Sonne über dem Nebel» (#1015, #1040) und der Sammel-Wand auf. B und E bleiben zurückgestellt (5a).

## Was ist neu
- Auf der Sammel-Wand ein Regal «Nebelmeer»: die Tage, an denen du über dem Nebel warst, je mit Name, Datum, Nebelhöhe («Nebel bis 900 m») und Foto. Dazu eine leise Zahl «3 Nebelmeer-Tage diesen Winter» (Winter = Oktober bis März). Noch keiner: «Diesen Winter noch kein Nebelmeer-Tag. Nebel kommt nicht auf Befehl.»
- «Tag hinzufügen» (Name, Tag, Nebelhöhe, Foto), ändern (Stift), Foto hinzufügen oder ersetzen (Kamera), entfernen mit Rückgängig. Das Regal zeigt drei Tage, «n weitere Tage zeigen» den Rest.
- In der Karte «Sonne über dem Nebel» auf Heute der Knopf «Heute merken»: er hält den Tag mit der Fahrt und der Nebelhöhe fest. Danach steht dort «Heute ist als Nebelmeer-Tag gemerkt.» mit Link zur Sammel-Wand.
- Das Foto eines Tages ist ein normales Album-Foto und liegt auch im Fotoalbum.

## Was fällt weg oder rutscht tiefer
- nichts. Die Sammel-Wand bekommt ein Regal mehr (zwischen Gipfelbuch und Neuland), die Karte auf Heute einen Knopf. Der Satz «Nichts wird hier geändert» auf der Wand stimmt für das Regal «Nebelmeer» nicht mehr (es hat kein anderes Zuhause); die Kopfzeile der Seite bleibt, das Regal erklärt sich selbst.

## Selbst entschieden
- Du bestätigst den Tag selbst («Heute merken» oder von Hand). Die App rät nicht aus Route und Nebelgrenze, ob du oben warst: das wäre eine Schätzung auf einer Schätzung. Die Karte verschwindet, wenn sich der Nebel auflöst; wer abends merken will, fügt den Tag im Regal hinzu (Tag steht schon auf heute).
- Kein eigener «Nach der Fahrt»-Schritt im Rückblick: der Rückblick kennt die Nebelhöhe des Tages nicht verlässlich (die Abfrage deckt nur heute und die nächsten Tage). Kann später folgen, wenn du ihn willst.
- Wo die Daten liegen: eine Einstellung `fogSeaDays` (in jedem Backup, keine Änderung am Datenspeicher) und die normalen Fotos mit `album: true`. Entfernst du einen Tag, bleibt das Foto im Fotoalbum (dort löschbar); Rückgängig stellt den Tag wieder her.
- Winter = 1. Oktober bis 31. März; von April bis September zeigt die Zahl den Winter, der gerade zu Ende ging.
- Tage sind nach Datum sortiert, nicht von Hand: neu zuerst. Kein Pfeil-Ordnen, weil die Reihenfolge schon die Zeit ist.
- Kein Ziel, keine Serie, kein Hinweis, wenn lange kein Nebelmeer-Tag dazukam (Idee D: «Nebel kommt nicht auf Befehl»). Das Winterziel (Antwort 4b) gibt es nicht, weil du 4a gewählt hast.
- Keine neue Funktion in `features.js`: gehört zu «Sammel-Wand» (`f.collectwall`, Suchwort und Handbuch-Schritt ergänzt).

## Entscheide (für decisions.md)
- 07.11.2026: Nebelmeer-Tage als Regal auf der Sammel-Wand, bestätigt durch Tipp oder von Hand, mit leiser Winterzahl, ohne Serie und ohne Ziel (Noah «4a»).

## Stand im Plan (roadmap.md / vorhaben.md)
- Wetter/Sammlungen: Idee «Nebelgrenze motiviert»: A, C und D umgesetzt; B (Zug) und E (zweite Nachricht) zurückgestellt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Rückblick › Sammel-Wand: das Regal «Nebelmeer» ist da, ohne Tage mit dem ruhigen Satz.
2. «Tag hinzufügen», Name und Foto angeben, speichern: der Tag erscheint mit Foto, die Zahl sagt «1 Nebelmeer-Tag diesen Winter». Ich › Fotoalbum: das Foto ist auch dort.
3. Stift: Name ändern. Papierkorb: der Tag verschwindet, «Rückgängig» bringt ihn zurück.
4. An einem Nebelmorgen mit Sonne darüber: in der Karte auf Heute «Heute merken» tippen; die Karte sagt «Heute ist als Nebelmeer-Tag gemerkt», und der Tag steht im Regal.
