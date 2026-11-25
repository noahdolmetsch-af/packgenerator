# Wächter gegen tote Adressen und doppelte Reiternamen

PR #1783 · 21.11.2026 · Auftrag: Noah «a» (Thread «App-Landkarte»)

## Was ist neu
- Neuer Test `tests/links.test.js`. W1: Jede Adresse `#/…`, die im Code ausgeschrieben steht, führt auf eine Seite. Bisher öffnete eine unbekannte Adresse still Heute, und niemand merkte es.
- W2: Innerhalb eines Ortes tragen zwei Reiter (oder Knöpfe unter einem Reiter) nicht denselben deutschen Namen für verschiedene Seiten (`docs/namen.md`: ein Wort pro Sache). Bekannt und offen: «Erkenntnisse» unter Auswerten (`KNOWN_SAME_NAME`, darf nur kürzer werden).
- Auf Aktiv steht unter «Diese Woche» ein neuer Link «Geschafft» (`#/flow/geschafft`, vor «Wochenrückblick»). Er zeigt, was die Haken von heute gebracht haben; ohne Haken sagt die Seite, dass noch nichts abgehakt ist. Grund: der Roboter-Test «höchstens 3 Taps von Heute» war auf main rot, weil die Seite «Geschafft» nur über die Meldung nach dem Abhaken erreichbar war (Noah «Test zuerst reparieren»).
- Der Roboter-Test wartet jetzt, bis die Linkliste einer Seite dreimal gleich ist (Patch aus dem Thread «Wackel-Tests»). Vorher schaute er zu früh und fand bei jedem Lauf andere «zu weite» Seiten (Meditation, Ski-Pflege waren nur Zeitfehler).
- Zwei tote Adressen repariert, die der Test gefunden hat:
  - Weg zum Ziel, Erholung, Schritt «Velo prüfen»: `#/velos` → `#/bikes`.
  - «Was ist neu» zur Agenda: `#/agenda` → `#/me/agenda`.

## Was fällt weg oder rutscht tiefer
- nichts.

## Selbst entschieden
- «Geschafft» steht auf Aktiv bei den drei Wochen-Links, nicht in der Tick-Kachel: dort ist es ein Weg zum Nachschauen, nicht zum Abhaken.
- Neue Zeile in «Was ist neu» (`waechter-links.js`), weil der Link sichtbar ist.
- Der Erholungs-Schritt «Essen» bleibt ohne Ziel (`food: ''`): der bestehende Test nennt das ausdrücklich so gewollt. Mögliches Ziel später: `#/gear/supplies`.
- Adressen mit einem noch fehlenden Teil (`'#/tour/' + id`) und Kommentare zählt der Test nicht.
- Der Test prüft die Liste der Adressen auch selbst (mehr als 200 gefunden), damit ein Wächter, der nichts liest, auffällt.

## Entscheide (für decisions.md)
- keine

## Stand im Plan (roadmap.md / vorhaben.md)
- App-Landkarte, Wächter W1 und W2: online mit diesem PR. W3–W5 (jede Seite hat ein Zuhause, eine Seite ein Ort, Sackgassen) folgen als eigene PRs.

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Ich › Was ist neu: bei «Agenda: Jetzt holen» auf den Link tippen. Es öffnet die Agenda, nicht Heute.
2. Aktiv › Erholung (Weg zum Ziel): Schritt «Velo prüfen» antippen. Es öffnet Velos.
3. Aktiv: unter «Diese Woche» auf «Geschafft» tippen. Es öffnet die Seite «Geschafft» (nach einem Haken mit den Zahlen, sonst mit dem Hinweis, dass noch nichts abgehakt ist).
