# Dein Bild für jede Sportart

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1a 2a 3a» (Thread «Aktiv schöner und verständlicher»)

## Was ist neu
- Jede Sportseite hat oben ein Titelbild: ein eigenes Foto (Ausschnitt verschiebbar) oder der Vorschlag der App, die Farbe der Sportart mit ihrem Symbol. Darunter eine Zeile «n von Ziel in den letzten 7 Tagen».
- «Nächstes Ziel» ist zurück: eine Zeile oben in Meine Sportarten mit dem Meilenstein, der seinem nächsten Stern am nächsten ist, mit Balken. Tippen öffnet die Sportseite.
- Meilensteine am Handy: der nächste Stern pro Sportart bleibt offen, alle Karten («Alle n zeigen») und «Serien, Touren und Velos» sind eingeklappt.

## Was fällt weg oder rutscht tiefer
- Am Handy rutschen auf der Meilenstein-Seite (Filter «Alle») die übrigen Karten und «Serien, Touren und Velos» in Klappen (Noah «2a»). Alter Weg: alles offen untereinander. Neuer Weg: Klappe antippen.
- Die Längen-Grenze für `#/flow/milestones` in `laenge.js` fällt weg (Regel 6, keine Seitenlänge).
- Sonst nichts; am Computer bleibt die Meilenstein-Seite wie bisher.

## Selbst entschieden
- Vorschlag ohne Foto = Farbe plus Symbol der Sportart (kein Bild aus dem Netz, null Kosten, offline).
- Die Titelbilder liegen in einer eigenen Einstellungs-Zeile `sport.covers`, weil die Sport-Einstellungen unbekannte Felder verwerfen.
- Tennis behält seinen eigenen Kopf (P4); das Bildfenster ist dasselbe, jetzt mit dem Namen der Sportart.
- Die Klappen gelten nur am Handy und nur beim Filter «Alle»; eine einzelne Sportart zeigt alles offen.
- «Nächstes Ziel» zeigt nur einen Meilenstein mit schon etwas Fortschritt; ohne solchen fehlt die Zeile.

## Entscheide (für decisions.md)
- 27.10.2026: Titelbild pro Sportart, Meilensteine am Handy kürzer, «Nächstes Ziel» zurück (Noah «1a 2a 3a»).

## Stand im Plan
- Aktiv schöner und verständlicher: diese drei Punkte erledigt; offen nur, was Noah neu nennt.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Auswerten › Meine Sportarten: oben steht «Nächstes Ziel» mit Balken; tippen öffnet die Sportseite.
2. Auf einer Sportseite oben auf die Kamera tippen, Foto wählen; «Ohne Bild» bringt Farbe und Symbol zurück, mit Rückgängig.
3. Am Handy die Meilensteine öffnen: oben die nächsten Sterne, darunter zwei Klappen.
