# Ein Link wird ein Traum

PR (diese Änderung) · 27.10.2026 · Auftrag: Noah «1-5 a» (Thread «Träume und Neuland prominent machen»), Idee N13

## Was ist neu
- Touren › Träume: ins Feld oben darf jetzt auch ein Link. «Hinzufügen» liest ihn (`src/lib/dreams/fromlink.js`):
  - Ride with GPS: die ganze Strecke über den eigenen Server (wie «Neue Quellen»): Name, km, Höhenmeter und Karte.
  - komoot oder ein Bericht: die Seite über den eigenen Seitenleser (wie «Webseite als Text»): Name aus dem Seitentitel, km und Höhenmeter, wenn die Seite sie nennt.
- Im Traum: neben dem Link der Knopf «Aus dem Link lesen». Ein eigener Name bleibt.
- Die Traum-Zeile zeigt km und Höhenmeter (aus der Karte oder aus dem Link).
- Neue Funktion im Katalog: `f.dreamlink`.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- komoot gibt ohne Konto keine GPX-Datei. Für die Karte bleibt «Karte aus GPX-Datei» wie bisher.
- Höhenmeter aus GPX: ein Schritt zählt ab 5 m (gegen GPS-Zittern).
- Kann der Link nicht gelesen werden, wird der Traum trotzdem mit Link gespeichert, und die Meldung sagt warum.
- Ein Traum bekommt das Feld `facts` ({ km, gainM }), wenn es keine Karte gibt; die Karte (`route`) kann jetzt `gainM` tragen. Beides im Backup, alte Träume bleiben gleich.
- Beim «Tour planen» geht die Strecke noch nicht in die Tour (das kommt mit N16 «Bereit?»).

## Entscheide (für decisions.md)
- keine neuen

## Stand im Plan (roadmap.md / vorhaben.md)
- «Träume und Neuland»: Schritt 5 von 20 (N13). Als Nächstes N11 «Neu heute».

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Touren › Träume öffnen, oben einen Ride-with-GPS-Link einfügen, «Hinzufügen».
2. Der neue Traum zeigt Name, km und Höhenmeter; antippen: die Karte ist da.
3. Einen Traum mit komoot-Link öffnen und «Aus dem Link lesen» tippen: km und Höhenmeter erscheinen, dein Name bleibt.
