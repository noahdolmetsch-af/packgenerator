# Bilder in «Was ist neu»

Auftrag: Noah «1b 2a 3a 4b 5a» (Thread «Neuheiten in der App besser zeigen»), Schritt 2 von 4 von Weg B. Baut auf dem Werkzeug von `news-bilder` auf.

## Was ist neu
- In Ich › Was ist neu zeigt ein Update oben in seiner Karte ein Bild der neuen Stelle (Handy-Ausschnitt, orange umrahmt). Gab es die Stelle schon, ist das Bild ein Schieber: ziehen (oder Pfeiltasten auf dem Schieber) zeigt links vorher, rechts nachher. Sonst steht nur «Nachher».
- Die Updates der letzten Nacht (46 Dateien) haben ihre «Nachher»-Bilder bekommen, damit die Seite nicht leer wirkt. «Vorher» gibt es für sie nicht (der Stand davor ist nicht mehr zu bauen).
- Ein Bild, das nicht lädt (offline, noch nie gesehen), lässt nichts zurück: die Karte sieht aus wie bisher. Ein einmal gesehenes Bild bleibt auf dem Gerät (`vite.config.js`, Cache «pg-news-bilder»).
- Der Build gibt der Neuheit die Liste ihrer Bilder (`bilder`), `VersionNews.svelte` zeigt sie über den Zeilen.

## Was fällt weg oder rutscht tiefer
- nichts. Die Zeilen mit «Ausprobieren» rutschen in einer Karte mit Bild etwa 200 bis 300 px tiefer.

## Selbst entschieden
- Bildformat WebP statt JPEG (ändert `news-bilder`): der Wächter gegen private Daten lässt keine JPG im Repo zu. Das Werkzeug macht WebP aus dem Screenshot im Browser selbst (Canvas), ohne weiteres Programm; etwa 5 bis 30 KB je Bild.
- Mehrere Bilder eines Updates: das erste steht offen, die weiteren hinter der Zeile «Weitere Bilder (n)».
- Bild über den Zeilen statt in der Zeile: so sieht man zuerst, was sich geändert hat, dann den Text («Inhalt zuerst» gilt für Hilfe, nicht für das Bild der Neuheit selbst).
- Höchstens drei Bilder pro Update (die ersten drei Zeilen mit genauer Stelle).
- Die Bilder sind nicht im Install-Cache (sonst über 4 MB beim ersten Start), sondern kommen beim ersten Ansehen und bleiben dann.
- Dieser PR hat selbst kein Bild: seine Neuheit zeigt auf die Bilder der anderen Updates; «Ausprobieren» sagt dort, wo sie erscheinen.

## Entscheide (eigene Datei)
- keine neuen; Grundlage `docs/decisions/news-bilder.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- Neuheiten besser zeigen (Weg B): Schritt 2 (Anzeige) fertig; folgt: Karte auf Heute nach Ort, Pflicht per Test.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: die neuesten Updates zeigen ein Bild der Stelle über ihren Zeilen.
2. Bei einem Update mit Vorher-Bild den Schieber ziehen: links vorher, rechts nachher.
3. «Ausprobieren» bei einem Update: öffnet die Stelle und leuchtet sie an, wie bisher.
